from fastapi import APIRouter, HTTPException
from datetime import datetime, timedelta
from database import get_db
import schemas, auth

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/send-otp")
async def send_otp(req: schemas.SendOTPRequest):
    """
    1. Generates a 6-digit OTP
    2. Marks all previous unused OTPs for this mobile as used
    3. Saves new OTP to otp_store collection with 10 min expiry
    4. Sends OTP to email via Gmail (if email provided)
    """
    db = get_db()
    otp = auth.generate_otp()
    expires = datetime.utcnow() + timedelta(minutes=10)

    # Invalidate old OTPs for this number
    await db.otp_store.update_many(
        {"mobile": req.mobile, "used": False},
        {"$set": {"used": True}}
    )

    # Save new OTP to MongoDB
    await db.otp_store.insert_one({
        "mobile":     req.mobile,
        "otp":        otp,
        "used":       False,
        "created_at": datetime.utcnow(),
        "expires_at": expires
    })

    # Send email if provided
    if req.email:
            auth.send_otp_email(req.email, otp, req.name or "User")
    else:
        print(f"[DEV] OTP for {req.mobile} = {otp}")

    # dev_otp shown in response during development — remove in production
    return {"message": "OTP sent successfully", "dev_otp": otp}


@router.post("/signup", response_model=schemas.TokenResponse)
async def signup(req: schemas.SignUpRequest):
    """
    1. Checks OTP is valid and not expired
    2. Checks mobile is not already registered
    3. Creates user document in users collection
    4. Marks OTP as used
    5. Returns JWT token
    """
    db = get_db()

    # Verify OTP
    otp_record = await db.otp_store.find_one({
        "mobile":     req.mobile,
        "otp":        req.otp,
        "used":       False,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")

    # Check not already registered (mobile)
    existing = await db.users.find_one({"mobile": req.mobile})
    if existing:
        raise HTTPException(status_code=400, detail="Mobile already registered. Please sign in.")

    # Check email too
    if req.email:
        existing_email = await db.users.find_one({"email": req.email})
        if existing_email:
            raise HTTPException(status_code=400, detail="Email already registered. Please sign in.")

    # Create user
    user_doc = {
        "name":       req.name,
        "mobile":     req.mobile,
        "email":      req.email,
        "role":       req.role,
        "created_at": datetime.utcnow()
    }
    result = await db.users.insert_one(user_doc)
    user_id = str(result.inserted_id)

    # Mark OTP used
    await db.otp_store.update_one(
        {"_id": otp_record["_id"]},
        {"$set": {"used": True}}
    )

    token = auth.create_access_token({"sub": user_id, "role": req.role})
    return {"access_token": token, "user_id": user_id, "name": req.name, "role": req.role}
        
        
@router.post("/signin", response_model=schemas.TokenResponse)
async def signin(req: schemas.SignInRequest):
    """
    1. Verifies OTP is valid and not expired
    2. Finds user by mobile
    3. Returns JWT token
    """
    db = get_db()

    otp_record = await db.otp_store.find_one({
        "mobile":     req.mobile,
        "otp":        req.otp,
        "used":       False,
        "expires_at": {"$gt": datetime.utcnow()}
    })
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    user = await db.users.find_one({"mobile": req.mobile})
    if not user:
        raise HTTPException(status_code=404, detail="User not found. Please sign up first.")

    await db.otp_store.update_one(
        {"_id": otp_record["_id"]},
        {"$set": {"used": True}}
    )

    user_id = str(user["_id"])
    token = auth.create_access_token({"sub": user_id, "role": user["role"]})
    return {"access_token": token, "user_id": user_id, "name": user["name"], "role": user["role"]}


@router.get("/me")
async def get_me(token: str):
    """Protected route — decodes JWT and returns user info."""
    from bson import ObjectId
    db = get_db()

    payload = auth.decode_token(token)
    if not payload:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

    user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "id":     str(user["_id"]),
        "name":   user["name"],
        "mobile": user["mobile"],
        "email":  user.get("email"),
        "role":   user["role"]
    }