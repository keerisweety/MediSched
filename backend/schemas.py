from pydantic import BaseModel
from typing import Optional

class SendOTPRequest(BaseModel):
    mobile: str
    email:  Optional[str] = None
    name:   Optional[str] = None

class SignUpRequest(BaseModel):
    name:   str
    mobile: str
    email:  Optional[str] = None
    otp:    str
    role:   str = "patient"     # "patient" or "doctor"

class SignInRequest(BaseModel):
    mobile: str
    otp:    str
    
class TokenResponse(BaseModel):
    access_token: str
    token_type:   str = "bearer"
    user_id:      str            # MongoDB _id as string
    name:         str
    role:         str