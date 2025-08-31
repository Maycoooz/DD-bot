# backend/main.py
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import create_db_and_tables
from .api import routes, parent, admin

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("App is starting up...")
    create_db_and_tables()
    yield
    print("App is shutting down...")

app = FastAPI(lifespan=lifespan)

# Use the router object from the routes module
app.include_router(routes.router)
app.include_router(parent.router)
app.include_router(admin.router)

origins = [
    "http://localhost:5173",
    "http://localhost:8000"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)