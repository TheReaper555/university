from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr
import random
import os
from dotenv import load_dotenv
import sendgrid
from sendgrid.helpers.mail import Mail

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

    message = Mail(
        from_email="santiagojoseu4@gmail.com",
        to_emails=request.email,
        subject="Tu código OTP - Sistema Universitario",
        html_content=f"<p>Tu código de acceso es: <strong>{code}</strong></p>"
    )

    try:
        sg = sendgrid.SendGridAPIClient(api_key=os.getenv("SENDGRID_API_KEY"))
        sg.send(message)
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