# MedoX 🩺 | Autonomous AI Scribe & Epidemic Tracker

> **Built for ImpactHacks by HackathonForAll** > Empowering rural healthcare workers by automating clinical notes, managing inventory, and tracking public health in real-time.

---

## 🌍 The Problem
In rural healthcare systems, Auxiliary Nurse Midwives (ANMs) and community health officers spend up to 40% of their day manually filling out redundant paper registers. This administrative burden leads to severe burnout, delayed critical care, and poor public health tracking. 

## 💡 Our Solution
**MedoX** is multimodal AI assistant designed for the last mile. A nurse simply speaks into her phone in her natural dialect. MedoX transcribes the audio, extracts clinical vitals using specialized medical AI, and autonomously updates national health databases, schedules follow-ups, and manages clinic inventory in real-time.

---


## ✨ Key Features (The 5 Pillars)

1. **🏠 Home (AI Assistant):** A multimodal chatbot powered by MedGemma for clinical guidance and Gemini 2.5 Flash for analyzing medical images (prescriptions, visible symptoms).
   ![Home](https://github.com/user-attachments/assets/780ba598-9376-4d6c-97b0-20732923ad60)

2. **🎙️ Voice Scribe:** Uses locally processed Whisper AI to transcribe chaotic voice notes into structured SBAR (Situation, Background, Assessment, Recommendation) formats.
   ![Scribe](https://github.com/user-attachments/assets/cc0934a3-ed78-436f-962e-23bddbe13ccc)

3. **📂 Patient Records:** A localized database of patient visits featuring a one-click portal to a live **Looker Studio Public Health Dashboard** for epidemic tracking.
   ![Records](https://github.com/user-attachments/assets/ca342a5f-2459-4a42-98da-a462fcb0d7d7)
   ![Patient](https://github.com/user-attachments/assets/a3e4a2b7-a504-48ec-a66a-99c971219743)
   ![Analytics](https://github.com/user-attachments/assets/e7294fc9-c40b-45f3-9791-56d802500b3e)


5. **📅 Tasks (Smart Calendar):** Two-way synchronization with Google Calendar. The AI automatically detects follow-up dates in voice notes and schedules them. Marking a task complete in the app updates the cloud calendar instantly.
   ![Calendar](https://github.com/user-attachments/assets/3f87c2c7-3f83-4458-a746-c4a2e170be26)

6. **📦 Stock (Agentic Inventory):** Real-time clinic inventory management. Tapping `+` or `-` in the app directly reads/writes to a centralized Google Sheet, alerting the district PHC when essential medicines run low.
   ![Inventory](https://github.com/user-attachments/assets/816d1c9b-bbfd-46a1-9947-906bd2363ced)


---

## 🛠️ Technology Stack

* **Frontend:** React Native (Expo)
* **Backend:** Django, Python
* **AI & Machine Learning:** * **MedGemma-27b-text-it** (via Featherless.ai API) for medical structuring and chat.
  * **Gemini 2.5 Flash** (via Google Developer API) for multimodal image analysis.
  * **Faster-Whisper (small.en)** for fast, CPU-efficient audio transcription.
* **Agentic Integrations:** Google Sheets API, Google Calendar API, Google Looker Studio.

---

## 🚀 Installation & Setup

To run MedoX locally, you will need to set up both the frontend and backend environments, as well as provide your own API keys.

### Prerequisites
* Node.js and npm
* Python 3.9+
* Google Cloud Service Account (`medox_service_account.json`)
* `.env` file containing your API keys for Featherless, Gemini, Google Sheets, and Google Calendar.

### Environment Variables (`.env`)
Create a `.env` file in the root directory of your **backend** (`backend/.env`) and add the following variables:

* DATABASE_URL=your_database_url
* SECRET_KEY=your_django_secret_key
* GEMINI=your_gemini_api_key
* FEATHERLESS=your_featherless_api_key
* SHEETS=your_master_records_sheet_id
* CALENDAR=your_google_calendar_id
* INVENTORY_SHEET=your_inventory_sheet_id


### 1. Backend (Django) Setup
Open your terminal and run the following commands:
# Create and activate a virtual environment
python -m venv env
source env/bin/activate  # On Windows use: env\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Navigate to the backend directory
cd backend

# Ensure your .env and medox_service_account.json are in the root backend folder!

# Start the server
python manage.py runserver 0.0.0.0:8000

### 2. Frontend (React Native) Setup
Open a new terminal window and run:
# Navigate to the frontend directory
cd frontend

# Install dependencies (if not already installed)
npm install

# Start the Expo server
npm start


Note: Ensure you update the API_URL IP addresses in the React Native code to match your local network IP where Django is running.

🏆 Hackathon Details

This project was built for ImpactHacks. A special thanks to the sponsor Featherless.ai for providing access to the powerful MedGemma open-source model, which handles the core medical reasoning of this application.
