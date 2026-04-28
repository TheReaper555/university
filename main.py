from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from routes import students, auth
from database import engine, Base

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(students.router)
app.include_router(auth.router)

# Servir archivos estáticos del frontend
app.mount("/static", StaticFiles(directory="frontend"), name="static")

# Ruta raíz que carga el index.html
@app.get("/")
def root():
    return FileResponse("frontend/index.html")