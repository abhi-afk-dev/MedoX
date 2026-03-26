import os
import gspread
import datetime
from dotenv import load_dotenv 
from django.conf import settings
from googleapiclient.discovery import build
from google.oauth2.service_account import Credentials

load_dotenv()

SCOPES = [
    'https://www.googleapis.com/auth/spreadsheets',
    'https://www.googleapis.com/auth/drive',
    'https://www.googleapis.com/auth/calendar'
]

INVENTORY_SHEET_ID = os.getenv('INVENTORY_SHEET')
SPREADSHEET_ID = os.getenv('SHEETS')
CALENDAR_ID = os.getenv('CALENDAR') 

def get_credentials():
    creds_path = os.path.join(settings.BASE_DIR, 'medox_service_account.json')
    return Credentials.from_service_account_file(creds_path, scopes=SCOPES)

def append_to_google_sheet(record_data):
    try:
        credentials = get_credentials() 
        client = gspread.authorize(credentials)
        sheet = client.open_by_key(SPREADSHEET_ID).sheet1 
        
        sheet.append_row(record_data)
        print(f"✅ Successfully synced {record_data[1]} to Google Sheets.")
        return True

    except Exception as e:
        print(f"❌ Google Sheets Sync Error: {e}")
        return False
    
def schedule_follow_up(patient_name, diagnosis, days_from_now):
    if not days_from_now or days_from_now <= 0:
        return False

    try:
        credentials = get_credentials()
        service = build('calendar', 'v3', credentials=credentials)

        target_date = datetime.datetime.now() + datetime.timedelta(days=days_from_now)
        date_str = target_date.strftime("%Y-%m-%d")

        event = {
            'summary': f'🩺 Follow-up: {patient_name}',
            'description': f'Diagnosis/Reason: {diagnosis}\n\nAutomated via MedoX.',
            'start': {
                'date': date_str,
                'timeZone': 'Asia/Kolkata',
            },
            'end': {
                'date': date_str,
                'timeZone': 'Asia/Kolkata',
            },
            'reminders': {
                'useDefault': False,
                'overrides': [
                    {'method': 'popup', 'minutes': 9 * 60},
                ],
            },
        }

        event_result = service.events().insert(calendarId=CALENDAR_ID, body=event).execute()
        print(f"📅 Successfully scheduled follow-up for {patient_name} on {date_str}.")
        return True

    except Exception as e:
        print(f"❌ Calendar Sync Error: {e}")
        return False

def get_upcoming_tasks():
    """Fetches upcoming follow-ups from Google Calendar."""
    try:
        credentials = get_credentials()
        service = build('calendar', 'v3', credentials=credentials)
        
        now = datetime.datetime.utcnow().isoformat() + 'Z'
        
        events_result = service.events().list(
            calendarId=CALENDAR_ID, timeMin=now,
            maxResults=15, singleEvents=True,
            orderBy='startTime'
        ).execute()
        
        events = events_result.get('items', [])
        
        tasks = []
        for event in events:
            summary = event.get('summary', 'Unknown Patient')
            
            # --- NEW: Check if it's already completed based on the ✅ ---
            is_completed = summary.startswith('✅')
            status_text = "completed" if is_completed else "pending"
            
            # Clean up the name for the app UI
            patient_name = summary.replace('✅ ', '').replace('🩺 Follow-up: ', '')
            
            description = event.get('description', 'Routine Checkup')
            reason = description.split('\n')[0].replace('Diagnosis/Reason: ', '')
            
            date_str = event['start'].get('date') or event['start'].get('dateTime', '').split('T')[0]
            
            tasks.append({
                "id": event['id'],
                "patient": patient_name,
                "reason": reason,
                "date": date_str,
                "status": status_text # <-- Sends correct status to frontend
            })
            
        return tasks
    except Exception as e:
        print(f"❌ Fetch Calendar Error: {e}")
        return []

def update_calendar_event(event_id, is_completed):
    """Updates the Google Calendar event to mark it as done or pending."""
    try:
        credentials = get_credentials()
        service = build('calendar', 'v3', credentials=credentials)

        # 1. Fetch the existing event
        event = service.events().get(calendarId=CALENDAR_ID, eventId=event_id).execute()
        summary = event.get('summary', '')

        # 2. Modify it based on the toggle
        if is_completed:
            if not summary.startswith('✅ '):
                event['summary'] = '✅ ' + summary
            event['colorId'] = '8'  # 8 is Grey in Google Calendar
        else:
            if summary.startswith('✅ '):
                event['summary'] = summary.replace('✅ ', '', 1)
            if 'colorId' in event:
                del event['colorId']  # Reverts to default color

        # 3. Push the update back to Google
        service.events().update(calendarId=CALENDAR_ID, eventId=event_id, body=event).execute()
        print(f"✅ Calendar event {event_id} synced: Completed={is_completed}")
        return True
        
    except Exception as e:
        print(f"❌ Update Calendar Error: {e}")
        return False

def get_inventory_data():
    try:
        credentials = get_credentials()
        client = gspread.authorize(credentials)
        sheet = client.open_by_key(INVENTORY_SHEET_ID).sheet1
        
        records = sheet.get_all_records()
        return records
    except Exception as e:
        print(f"❌ Fetch Inventory Error: {e}")
        return []

def update_inventory_quantity(item_id, new_quantity):
    try:
        credentials = get_credentials()
        client = gspread.authorize(credentials)
        sheet = client.open_by_key(INVENTORY_SHEET_ID).sheet1
        
        cell = sheet.find(str(item_id), in_column=1)
        
        sheet.update_cell(cell.row, 3, new_quantity)
        print(f"✅ Updated item {item_id} to quantity {new_quantity}.")
        return True
    except Exception as e:
        print(f"❌ Update Inventory Error: {e}")
        return False