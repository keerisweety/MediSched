from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from database import connect_db, close_db
from routers import auth_router, hospital_router, patient_router, appointment_router, history_router, doctor_router


@asynccontextmanager
async def lifespan(app: FastAPI):
    await connect_db()
    yield
    await close_db()

app = FastAPI(title="MediSched Global API", version="1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "https://medisched-qzer.onrender.com"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router)
app.include_router(hospital_router.router)
app.include_router(patient_router.router)
app.include_router(appointment_router.router)
app.include_router(history_router.router)
app.include_router(doctor_router.router)

@app.get("/")
def root():
    return {"message": "MediSched Global API is running"}