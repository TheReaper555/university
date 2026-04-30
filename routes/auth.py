from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import random
import smtplib
import os
from email.message import EmailMessage
from dotenv import load_dotenv

load_dotenv()

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

    msg = EmailMessage()
    msg["Subject"] = "Tu código OTP - Sistema Universitario"
    msg["From"] = os.getenv("GMAIL_USER")
    msg["To"] = request.email
    msg.set_content(f"Tu código de acceso es: {code}")

    try:
        with smtplib.SMTP("smtp.gmail.com", 587) as smtp:
            smtp.ehlo()
            smtp.starttls()
            smtp.login(os.getenv("GMAIL_USER"), os.getenv("GMAIL_APP_PASSWORD"))
            smtp.send_message(msg)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error al enviar correo: {str(e)}")

    return {"message": "OTP enviado al correo"}

@router.post("/verify-otp")
def verify_otp(data: OTPVerify):
    stored = otp_store.get(data.email)
    if not stored or stored != data.code:
        raise HTTPException(status_code=400, detail="Código inválido o expirado")
    del otp_store[data.email]
    return {"message": "Acceso concedido", "authenticated": True}