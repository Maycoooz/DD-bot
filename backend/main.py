# backend/main.py
from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from .database import create_db_and_tables
from .api import routes, parent, admin, librarian

from backend.database import create_db_and_tables, engine
from backend.models import Roles, UserType
from sqlmodel import Session, select

def seed_roles():
    default_roles = [
        UserType.ADMIN,
        UserType.PARENT,
        UserType.LIBRARIAN,
        UserType.KID
    ]

    with Session(engine) as session:
        for role_enum in default_roles:
            existing = session.exec(select(Roles).where(Roles.name == role_enum)).first()
            if not existing:
                session.add(Roles(name=role_enum))
                print(f"✅ Added role: {role_enum}")
        session.commit()
        print("🎉 Roles seeded automatically!")

@asynccontextmanager
async def lifespan(app: FastAPI):
    seed_roles()
    create_db_and_tables()
    yield

app = FastAPI(lifespan=lifespan)

app.include_router(routes.router)
app.include_router(parent.router)
app.include_router(admin.router)
app.include_router(librarian.router)

origins = [
    "http://localhost:5173",
    "https://ddbot-ochre.vercel.app/",
    "https://ddbot-ch6g.vercel.app",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"]
)
