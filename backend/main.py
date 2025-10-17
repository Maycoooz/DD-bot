from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from db.database import create_tables_and_seed_it
from contextlib import asynccontextmanager

from routers import auth, users, parent, admin, librarian, review


@asynccontextmanager
async def lifespan_context(app: FastAPI):
    try:
        create_tables_and_seed_it()
    except Exception as e:
        print(f"Error during startup: {e}")
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
    "https://ddbot-ch6g.vercel.app",
    "https://www.ddbot-ch6g.vercel.app",
    # 👇 Allow all Vercel preview deployments
    "https://ddbot-ch6g-*vercel.app",
    "https://ddbot-ch6g-*.vercel.app",
    # 👇 Optional: allow all Vercel subdomains for your project
    "https://*.vercel.app",
    "https://www.youtube.com"
]


app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ---
app.include_router(auth.router, prefix="/auth")
app.include_router(users.router)
app.include_router(parent.router)
app.include_router(admin.router)
app.include_router(librarian.router)
app.include_router(review.router)


