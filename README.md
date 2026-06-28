# MediSched Global

A full-stack healthcare appointment booking platform with separate portals for patients and doctors.

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | Python 3.11 · FastAPI (async) |
| **Database** | MongoDB (Motor, Atlas) |
| **Auth** | OTP via Email (Resend) · JWT tokens |
| **Frontend** | React 19 · Vite 8 · JSX |
| **Styling** | Inline CSS (warm earthy theme) |

## Features

### Patient Portal
- Browse hospitals with distance-based search
- Manage family member profiles
- Book, reschedule, and cancel appointments
- View consultation history
- Set regular checkup reminders

### Doctor Portal
- Manage profile and daily shift timings
- View today's schedule (live polled every 15s)
- Confirm / complete consultations with diagnosis & prescription
- Cancel appointments with email notifications
- Export work history as CSV / PDF

## Getting Started

### Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate      # Windows
pip install -r requirements.txt
```

Copy `.env` and configure your MongoDB URI, JWT secret, and email credentials:

```env
MONGO_URL=mongodb+srv://<user>:<pass>@cluster0.xxxxx.mongodb.net
DB_NAME=medisched
SECRET_KEY=your-secret-key
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
RESEND_API_KEY=re_xxxxxxx
FROM_EMAIL=onboarding@resend.dev
```

Run the server:

```bash
uvicorn main:app --reload
```

API available at `http://localhost:8000`.

### Frontend

```bash
cd medisched-frontend
npm install
npm run dev
```

App available at `http://localhost:5173`.

Set the API URL in `.env`:

```env
VITE_API_URL=http://localhost:8000
```

## Deployment

- **Frontend**: `https://medisched-frontend.onrender.com` (Render)
- **Backend**: `https://medisched-qzer.onrender.com` (Render)
- **Database**: MongoDB Atlas

## Project Structure

```
O:\MediShed
├── backend/
│   ├── main.py                  # FastAPI entry point
│   ├── database.py              # Async MongoDB connection
│   ├── auth.py                  # OTP, JWT, email sending
│   ├── models.py                # MongoDB document models
│   ├── schemas.py               # Pydantic request/response schemas
│   └── routers/
│       ├── auth_router.py       # OTP, signup, signin
│       ├── appointment_router.py
│       ├── doctor_router.py
│       ├── hospital_router.py
│       ├── patient_router.py
│       └── history_router.py
└── medisched-frontend/
    └── src/
        ├── main.jsx             # React entry point
        ├── App.jsx              # Root (auth-based routing)
        ├── api.js               # Axios API client
        └── pages/
            ├── AuthPage.jsx     # Login / signup
            ├── PatientApp.jsx   # Patient portal
            ├── DoctorApp.jsx    # Doctor portal
            └── BookingPage.jsx  # Standalone booking
```

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/auth/send-otp` | Send OTP to email |
| `POST` | `/auth/signup` | Register new user |
| `POST` | `/auth/signin` | Login with OTP |
| `GET` | `/auth/me` | Current user info |
| `GET` | `/hospitals` | List hospitals (optional `lat`/`lng` for nearby) |
| `GET` | `/patients/mine` | User's patients (family members) |
| `POST` | `/patients/` | Add a patient |
| `POST` | `/appointments/book` | Book an appointment |
| `GET` | `/appointments/mine` | Patient's appointments |
| `GET` | `/appointments/doctor` | Doctor's appointments |
| `GET` | `/doctors/schedule` | Doctor's daily schedule |
| `PUT` | `/doctors/appoint/:id` | Confirm appointment |
| `PUT` | `/doctors/complete/:id` | Complete consultation |
| `DELETE` | `/doctors/cancel/:id` | Cancel appointment |
| `GET` | `/history/mine` | User's consultation history |
