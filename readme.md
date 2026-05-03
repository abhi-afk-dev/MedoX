# MedoX 🩺
### Autonomous AI Scribe & Epidemic Tracker for Rural Healthcare

> Built for **the GNEC Hackathon**
> Powered by **MedGemma** via [featherless.ai](https://featherless.ai)
---
## 🎯 Alignment with UN SDG 3: Health and Well-being
MedoX directly addresses **Target 3.c** of the UN Sustainable Development Goals: *substantially increase health financing and the recruitment, development, training, and retention of the health workforce in developing countries.* 

By digitizing the last mile of healthcare without requiring new hardware or internet reliance, MedoX fortifies rural health infrastructure, creates real-time epidemic tracking for NGOs, and gives community health workers their time back to focus on actual patient care.


## The Problem

India has **1.2 million Auxiliary Nurse Midwives (ANMs)** serving rural communities. Each one sees 20–30 patients a day. Each one spends up to **40% of that day filling paper registers** — redundant, manual, error-prone.

That's 3 hours a day not spent on patient care. Multiplied across 1.2 million nurses, that's a public health crisis hiding in plain sight.

No digitization tool has solved this because they all assume a keyboard, a stable internet connection, and a nurse who speaks English. None of those exist at the last mile.

---

## The Solution

**MedoX** is a multimodal AI assistant built specifically for the last mile.

A nurse holds her phone, speaks naturally about her patient — in any dialect, at any pace. MedoX listens, transcribes, extracts clinical structure, and autonomously updates every system that needs updating. The nurse never types a single character.

One voice note. Thirty seconds. Everything done.

---

## Demo

[![MedoX Demo Video]
(YOUR_DEMO_LINK_HERE)

---

## Key Features

### 🎙️ Voice Scribe
Hold the mic button, speak naturally about your patient. MedoX uses **Faster-Whisper** to transcribe locally, then sends the transcript to **MedGemma-27b** via **featherless.ai** to extract a structured SBAR (Situation, Background, Assessment, Recommendation) clinical note. A live pipeline shows every step as it happens.

### 🤖 Autonomous Agent Actions
After every voice note, MedoX autonomously:
- Saves the structured patient record to a local database
- Updates the **Google Sheets** district patient registry
- Schedules the follow-up appointment in **Google Calendar**
- Pushes the diagnosis data to the **Looker Studio** epidemic tracker

Zero manual steps. Zero extra taps.

### 🏠 Dashboard
Personalized home screen showing today's patient count, pending follow-ups, and live low-stock alerts. Every screen is one tap away.

### 🧠 AI Assistant
A clinical chat interface powered by **MedGemma-27b via featherless.ai**. Ask about symptoms, treatment protocols, drug dosages, or referral criteria — all tuned for community health contexts. Supports image input for analyzing prescriptions or visible symptoms via **Gemini 2.5 Flash**.

### 📂 Patient Records
Full history of every patient visit, searchable and structured. Tap **District Dashboard ↗** to open the live **Looker Studio** public health view — giving district health officers real-time visibility into diagnosis trends and emerging outbreak clusters across all ANMs in their district.

### 📅 Community Tasks
Auto-synced follow-up list pulled from **Google Calendar**. Mark a visit complete and it updates the cloud instantly.

### 📦 PHC Inventory
Live medicine stock tracker synced bidirectionally with **Google Sheets**. Low-stock items trigger automatic alerts to the district PHC for restocking.

---

## Technology Stack

| Layer | Technology |
|---|---|
| Mobile Frontend | React Native (Expo) |
| Backend | Django, Python 3.9+ |
| Medical AI | MedGemma-27b-text-it via **featherless.ai** API |
| Multimodal AI | Gemini 2.5 Flash (Google Developer API) |
| Voice Transcription | Faster-Whisper (small.en, CPU-efficient) |
| Patient Registry | Google Sheets API |
| Scheduling | Google Calendar API |
| Public Health Dashboard | Google Looker Studio |
| Auth & Storage | AsyncStorage, Django ORM |

---

## Why featherless.ai

MedGemma is Google DeepMind's open-source model trained specifically on medical data. It understands clinical language, drug names, symptom patterns, and treatment protocols in a way general-purpose models don't.

**featherless.ai** gave us serverless access to MedGemma-27b without managing GPU infrastructure — critical for a project designed to run in low-resource environments. Every clinical note extraction, every SBAR structure, every AI chat response runs through MedGemma via featherless.ai.

---

## Impact

| Metric | Value |
|---|---|
| Target users | 1.2 million ANMs across India |
| Time saved per nurse per day | ~3 hours |
| Systems updated per voice note | 4 (DB, Sheets, Calendar, Looker Studio) |
| Infrastructure required | A smartphone and a voice |

---

## Installation

### Prerequisites
- Node.js 18+ and npm
- Python 3.9+
- Google Cloud Service Account (`medox_service_account.json`)
- API keys for Featherless.ai, Gemini, Google Sheets, and Google Calendar

### Backend Setup

```bash
# Clone the repo
git clone https://github.com/abhi-afk-dev/medox.git
cd medox

# Create virtual environment
python -m venv env
source env/bin/activate  # Windows: env\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Add your environment variables
cp .env.example backend/.env
# Edit backend/.env with your API keys

# Place your service account file
# medox_service_account.json → /backend/

# Start the server
cd backend
python manage.py runserver 0.0.0.0:8000
```

### Frontend Setup

```bash
# In a new terminal
cd frontend
npm install
npm start
```

> **Note:** Update the `API_BASE` IP in the frontend code to match your local network IP where Django is running.

### Environment Variables

Create `backend/.env` with the following:

```
DATABASE_URL=your_database_url
SECRET_KEY=your_django_secret_key
GEMINI=your_gemini_api_key
FEATHERLESS=your_featherless_api_key
SHEETS=your_master_records_sheet_id
CALENDAR=your_google_calendar_id
INVENTORY_SHEET=your_inventory_sheet_id
```

---

## Team

| Name | Role |
|---|---|
| Abhilash Kr. Mishra | Full-Stack Development, UI/UX Design, AI Integration |

---

## Acknowledgements

Special thanks to **[featherless.ai](https://featherless.ai)** for providing access to MedGemma-27b — the medical reasoning backbone of MedoX — and to the **Global NGO Executive Committee (GNEC)** for hosting a platform dedicated to tech-driven civil society solutions.

---

*MedoX is a hackathon prototype. It is not a certified medical device and should not be used as a substitute for professional clinical judgment.*