from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
import resend
import random
import string
import os

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM  = os.getenv("ALGORITHM")
EXPIRE_MIN = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 10080))

resend.api_key = os.getenv("RESEND_API_KEY")
FROM_EMAIL = os.getenv("FROM_EMAIL", "onboarding@resend.dev")

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def generate_otp():
    return ''.join(random.choices(string.digits, k=6))


def create_access_token(data):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(minutes=EXPIRE_MIN)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_token(token):
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None


def send_otp_email(to_email: str, otp: str, name: str = "User") -> bool:
    try:
        resend.Emails.send({
            "from": f"MediSched Global <{FROM_EMAIL}>",
            "to": [to_email],
            "subject": "MediSched Global - Your OTP",
            "html": f"""
            <div style="font-family:Georgia,serif;padding:32px;max-width:480px;margin:0 auto">
              <h2 style="color:#8B4A33">MediSched Global</h2>
              <p>Hello {name},</p>
              <p>Your One-Time Password is:</p>
              <div style="font-size:32px;font-weight:700;color:#C4704F;letter-spacing:8px;padding:20px;background:#FDF0E8;border-radius:10px;text-align:center">
                {otp}
              </div>
              <p style="color:#8C6B5A;font-size:13px">Valid for 10 minutes. Do not share with anyone.</p>
              <p style="color:#8C6B5A;font-size:13px">- MediSched Global Team</p>
            </div>
            """
        })
        return True
    except Exception as e:
        print(f"[Email Error] {e}")
        return False


def send_notification_email(to_email: str, subject: str, body: str) -> bool:
    try:
        resend.Emails.send({
            "from": f"MediSched Global <{FROM_EMAIL}>",
            "to": [to_email],
            "subject": subject,
            "html": f"""
            <div style="font-family:Georgia,serif;padding:32px;max-width:480px;margin:0 auto">
              <h2 style="color:#8B4A33">MediSched Global</h2>
              <pre style="font-family:Georgia,serif;white-space:pre-wrap">{body}</pre>
              <p style="color:#8C6B5A;font-size:13px">- MediSched Global Team</p>
            </div>
            """
        })
        return True
    except Exception as e:
        print(f"[Email Error] {e}")
        return False

