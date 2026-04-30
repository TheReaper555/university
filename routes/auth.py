from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import random

router = APIRouter(prefix="/auth")
otp_store: dict = {}

class EmailRequest(BaseModel):
    email: EmailStr
    code: str

class OTPVerify(BaseModel):
    email: EmailStr
    code: str

@router.post("/send-otp")
def send_otp(request: EmailRequest):
    otp_store[request.email] = request.code
    return {"message": "OTP registrado"}

@router.post("/verify-otp")
def verify_otp(data: OTPVerify):
    stored = otp_store.get(data.email)
    if not stored or stored != data.code:
        raise HTTPException(status_code=400, detail="Código inválido o expirado")
    del otp_store[data.email]
    return {"message": "Acceso concedido", "authenticated": True}