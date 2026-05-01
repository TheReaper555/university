from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# En Render usa /tmp que persiste mientras el servidor está activo
# En local usa el archivo normal
if os.environ.get("RENDER"):
    SQLALCHEMY_DB_URL = "sqlite:////tmp/students.db"
else:
    SQLALCHEMY_DB_URL = "sqlite:///./students.db"

engine = create_engine(
    SQLALCHEMY_DB_URL, connect_args={"check_same_thread": False}
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()