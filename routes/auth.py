from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import random
import os
import resend
from dotenv import load_dotenv

load_dotenv()

resend.api_key = os.getenv("RESEND_API_KEY")

router = APIRouter(prefix="/auth")

otp_store: dict = {}

class EmailRequest(BaseModel):
    email: EmailStr

class OTPVerify(BaseModel):
    email: EmailStr
    code: str

@router.post("/send-otp")
def send_otp(request: EmailRequest):
    code = str(random.randint(100000, 999999))
    otp_store[request.email] = code

    resend.Emails.send({
        "from": "onboarding@resend.dev",
        "to": request.email,
        "subject": "Tu código OTP - Sistema Universitario",
        "html": f"<p>Tu código de acceso es: <strong>{code}</strong></p>"
    })

    return {"message": "OTP enviado al correo"}

@router.post("/verify-otp")
def verify_otp(data: OTPVerify):
    stored = otp_store.get(data.email)
    if not stored or stored != data.code:
        raise HTTPException(status_code=400, detail="Código inválido o expirado")
    del otp_store[data.email]
    return {"message": "Acceso concedido", "authenticated": True}