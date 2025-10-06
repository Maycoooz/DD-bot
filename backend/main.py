from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import create_tables_and_seed_it
from contextlib import asynccontextmanager

from routers import auth, users, parent


@asynccontextmanager
async def lifespan_context(app: FastAPI):

    create_tables_and_seed_it()
    yield
    

app = FastAPI(
    title="Chatbot for kids that recommends books and videos",
    description="API to recommend books and videos",
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan_context,
)

origins = [
    "http://localhost:8000",
    "http://localhost:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=origins,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ---
app.include_router(auth.router, prefix="/auth")
app.include_router(users.router)
app.include_router(parent.router)


