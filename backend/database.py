# backend/database.py
from sqlmodel import SQLModel, create_engine, Session
import os 
from dotenv import load_dotenv

load_dotenv()

DATABASE_URL = os.getenv("DATABASE_URL")

if not DATABASE_URL:
    raise ValueError("No DATABASE_URL set for connection")

engine = create_engine(DATABASE_URL)

def create_db_and_tables():
    # Import models here to prevent circular import errors
    from . import models
    SQLModel.metadata.create_all(engine)

def get_session():
    with Session(engine) as session:
        yield session