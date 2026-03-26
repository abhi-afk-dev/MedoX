import os
import json
import tempfile
import traceback
from PIL import Image
from google import genai
from openai import OpenAI
from datetime import datetime
from dotenv import load_dotenv
from google.genai import types
from django.shortcuts import render
from faster_whisper import WhisperModel
from .models import MedicalRecord, SBARReport 
from django.views.decorators.csrf import csrf_exempt
from django.http import JsonResponse, StreamingHttpResponse
from .services import append_to_google_sheet, schedule_follow_up, get_inventory_data,update_inventory_quantity, get_upcoming_tasks,update_calendar_event

load_dotenv()

STT_MODEL = WhisperModel("small.en", device="cpu", compute_type="int8")

gemini_client = genai.Client(api_key=os.getenv('GEMINI'))
featherless_client = OpenAI(
  base_url="https://api.featherless.ai/v1",
  api_key=os.getenv('FEATHERLESS'),
)


def generate_chat_guidance(user_query):
    try:
        system_instruction="""
                You are MedoX, a helpful companion for GNM/ANM nurse and a health community officer. 
                Answer medical questions clearly, simply, and professionally.
                Provide guidance on community health, first aid, and basic treatments.
                Keep answers as concise as you can. Do NOT generate JSON.
                """

        response = featherless_client.chat.completions.create(
          model='google/medgemma-27b-text-it',
          messages=[
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": user_query}
          ],
          stream=True
        )
        
        for chunk in response:
            if chunk.choices[0].delta.content is not None:
                yield chunk.choices[0].delta.content
                
    except Exception as e:
        print(f"Chat Error: {e}")
        yield "I am having trouble connecting to the network."

def generate_chat_with_image(text_prompt, image_file):
    try:
        img = Image.open(image_file)
        response = gemini_client.models.generate_content_stream(
            model='gemini-2.5-flash',
            contents=[text_prompt or "Analyze this image.", img],
            config=types.GenerateContentConfig(
                system_instruction="""
                You are MedoX. The user has uploaded a medical image (e.g., a prescription, skin condition, or report).
                1. Analyze the image carefully.
                2. If it's a prescription/report, summarize the key details.
                3. If it's a visible symptom, describe what you see and suggest general first aid (do not diagnose).
                4. Keep the tone professional and helpful.
                """
            )
        )
        
        for chunk in response:
            if chunk.text:
                yield chunk.text
                
    except Exception as e:
        print(f"Image Analysis Error: {e}")
        yield "I had trouble analyzing that image. Please try again."

def generate_sbar_from_note(raw_note):
    try:
        system_instruction="""
        You are an expert medical scribe. Analyze the input and extract structured data.
        You must output STRICT VALID JSON.
        
        The JSON must have these keys:
        1. "patient_name": Name of patient (or "Unknown").
        2. "vitals": Extract BP, Pulse, Temp if available.
        3. "symptoms": List of complaints.
        4. "diagnosis": Probable identification.
        5. "plan": Treatment or advice given.
        6. "follow_up": Text instructions for next visit.
        7. "follow_up_days": (INTEGER ONLY) The number of days until the follow up. If "next week", output 7. If "tomorrow", output 1. If none, output 0.
        """
        response = featherless_client.chat.completions.create(
          model='google/medgemma-27b-text-it',
          messages=[
            {"role": "system", "content": system_instruction},
            {"role": "user", "content": f"Note:\n{raw_note}"}
          ],
        )

        text = response.choices[0].message.content.strip()
        
        if text.startswith("```"):
            text = text.split("\n", 1)[1] if "\n" in text else text
            text = text.strip("` \n")
            if text.startswith("json"): text = text[4:].strip()

        return json.loads(text)

    except Exception as e:
        print(f"AI Service Error: {e}")
        return None
    
def transcribe_audio(audio_file) -> str:
    try:
        with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as temp_audio:
            for chunk in audio_file.chunks():
                temp_audio.write(chunk)
            temp_path = temp_audio.name

        segments, info = STT_MODEL.transcribe(temp_path, beam_size=5)
        text = " ".join([segment.text for segment in segments])
        
        os.remove(temp_path)
        return text.strip()
    except Exception as e:
        print(f"STT Error: {e}")
        return ""

@csrf_exempt
def interface_med(request):
    if request.method == "POST":
        try:
            query = ""
            image_file = None

            if request.content_type.startswith("multipart/form-data"):
                query = request.POST.get("prompt", "")
                if 'image' in request.FILES:
                    image_file = request.FILES['image']
            else:
                data = json.loads(request.body)
                query = data.get("prompt", "")

            if image_file:
                print(f"📸 analyzing image with prompt: {query}")
                stream_generator = generate_chat_with_image(query, image_file)
            else:
                if not query: return JsonResponse({"error": "No input provided"})
                stream_generator = generate_chat_guidance(query)
            
            return StreamingHttpResponse(stream_generator, content_type='text/plain')

        except Exception as e:
            traceback.print_exc()
            return JsonResponse({"reply": f"Error: {str(e)}"})

    return JsonResponse({"error": "POST required"})

@csrf_exempt
def interface_audio(request):
    if request.method == "POST":
        try:
            query = ""
            
            if request.content_type.startswith("multipart/form-data"):
                if 'audio' in request.FILES:
                    print("STT Receiving Audio File...")
                    query = transcribe_audio(request.FILES['audio'])
                    print(f"STT Transcribed: '{query[:50]}...'")
                elif 'text' in request.POST:
                    query = request.POST.get('text')
            
            else:
                data = json.loads(request.body)
                query = data.get("prompt", "")

            if not query:
                return JsonResponse({"error": "No input provided"})
            
            reply_json = generate_sbar_from_note(query)
            
            if reply_json:
                patient_name = reply_json.get("patient_name", "Unknown")
                diagnosis = reply_json.get("diagnosis", "N/A")                
                SBARReport.objects.create(
                    transcription=query,
                    ai_response=reply_json,
                    patient_name=patient_name
                )
                
                vitals = str(reply_json.get("vitals", "N/A"))                
                symptoms_raw = reply_json.get("symptoms", [])
                symptoms = ", ".join(symptoms_raw) if isinstance(symptoms_raw, list) else str(symptoms_raw or "N/A")
                
                plan = reply_json.get("plan", "N/A")
                current_time = datetime.now().strftime("%Y-%m-%d %H:%M:%S")

                row_data = [
                    current_time,
                    patient_name,
                    vitals,
                    symptoms,
                    diagnosis,
                    plan
                ]
                try:
                    append_to_google_sheet(row_data)
                except Exception as e:
                    print(f"Failed to append to sheets: {e}")

                try:
                    follow_up_days = int(reply_json.get("follow_up_days", 0))
                    if follow_up_days > 0:
                        schedule_follow_up(patient_name, diagnosis, follow_up_days)
                except ValueError:
                    print("Follow-up days was not a valid integer from AI.")
                except Exception as e:
                    print(f"Failed to schedule calendar event: {e}")

            return JsonResponse({
                "reply": reply_json,
                "audio_transcription": query
            })

        except Exception as e:
            traceback.print_exc()
            return JsonResponse({"reply": f"Error: {str(e)}"})

    return JsonResponse({"error": "POST required"})

@csrf_exempt
def manage_inventory(request):
    """Handles fetching and updating the stock in Google Sheets"""
    if request.method == "GET":
        try:
            data = get_inventory_data()
            return JsonResponse({"inventory": data})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

    elif request.method == "POST":
        try:
            body = json.loads(request.body)
            item_id = body.get("id")
            new_quantity = body.get("quantity")
            
            success = update_inventory_quantity(item_id, new_quantity)
            if success:
                return JsonResponse({"status": "success", "new_quantity": new_quantity})
            else:
                return JsonResponse({"error": "Failed to update Google Sheets"}, status=500)
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)

@csrf_exempt
def fetch_tasks(request):
    """Handles GET (fetching tasks) and POST (updating task status)"""
    if request.method == "GET":
        try:
            tasks = get_upcoming_tasks()
            return JsonResponse({"tasks": tasks})
        except Exception as e:
            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)
            
    elif request.method == "POST":
        try:
            data = json.loads(request.body)
            event_id = data.get("id")
            new_status = data.get("status") # will be "completed" or "pending"
            
            is_completed = (new_status == "completed")
            success = update_calendar_event(event_id, is_completed)
            
            if success:
                return JsonResponse({"status": "success"})
            else:
                return JsonResponse({"error": "Failed to sync with Google Calendar"}, status=500)
                
        except Exception as e:
            traceback.print_exc()
            return JsonResponse({"error": str(e)}, status=500)

    return JsonResponse({"error": "Method not allowed"})

@csrf_exempt
def fetch_records(request):
    if request.method == "GET":
        try:
            sbar_records = SBARReport.objects.all().order_by('-created_at')[:20]

            sbar_data = []
            for item in sbar_records:
                sbar_data.append({
                    "id": item.id,
                    "type": "SBAR",
                    "date": item.created_at.strftime("%Y-%m-%d %H:%M"),
                    "patient": item.patient_name,
                    "transcription": item.transcription[:100] + "...",
                    "full_data": item.ai_response
                })

            return JsonResponse({
                "soap_history": [],
                "sbar_history": sbar_data
            })

        except Exception as e:
            traceback.print_exc()
            return JsonResponse({"error": str(e)})

    return JsonResponse({"error": "GET required"})