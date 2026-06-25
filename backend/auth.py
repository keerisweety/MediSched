from passlib.context import CryptContext
from jose import JWTError, jwt
from datetime import datetime, timedelta
from dotenv import load_dotenv
import smtplib
import random
import string
import os

load_dotenv()

SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM  = os.getenv("ALGORITHM")
EXPIRE_MIN = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", 10080))
GMAIL      = os.getenv("GMAIL_ADDRESS")
GMAIL_PASS = os.getenv("GMAIL_APP_PASSWORD")

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


def send_otp_email(to_email, otp, name="User"):
    subject = "MediSched Global - Your OTP"
    body = (
        "Hello " + name + ",\n\n"
        "Your One-Time Password (OTP) for MediSched Global is:\n\n"
        "        " + otp + "\n\n"
        "This OTP is valid for 10 minutes.\n"
        "Do not share it with anyone.\n\n"
        "-- MediSched Global Team"
    )
    message = "Subject: " + subject + "\n\n" + body
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL, GMAIL_PASS)
            server.sendmail(GMAIL, to_email, message)
        return True
    except Exception as e:
        print("[Email Error] " + str(e))
        return False


def send_notification_email(to_email, subject, body):
    message = "Subject: " + subject + "\n\n" + body
    try:
        with smtplib.SMTP_SSL("smtp.gmail.com", 465) as server:
            server.login(GMAIL, GMAIL_PASS)
            server.sendmail(GMAIL, to_email, message)
        return True
    except Exception as e:
        print("[Email Error] " + str(e))
        return False

