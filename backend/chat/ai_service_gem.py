import google.generativeai as genai
import json
import os

genai.configure(api_key=os.getenv('GEMINI'))

def generate_sbar_from_note(raw_note):
    try:
        model = genai.GenerativeModel('gemini-2.5-flash')

        prompt = (
            "Analyze the following clinical note and extract the SBAR components. "
            "Return a JSON object with keys: patient_name, situation, background, "
            "assessment, recommendation."
            "\n\nNote:\n"
            f"{raw_note}"
        )

        response = model.generate_content(prompt)
        response_text = response.text.strip()        
        if response_text.startswith(''):
            response_text = response_text[7:].strip()
        elif response_text.startswith(''):
            response_text = response_text[3:].strip()
        
        if response_text.endswith(''):
            response_text = response_text[:-3].strip()

        try:
            sbar_data = json.loads(response_text)
            return sbar_data
        except json.JSONDecodeError as e:
            print(f"Failed to parse AI response as JSON: {e}")
            print(f"Raw AI response: {response.text}")
            return None
    except Exception as e:
        print(f"AI Service Error: {e}")
        return None