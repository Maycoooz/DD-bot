import jwt
from fastapi import Depends, HTTPException, status, APIRouter
from fastapi.security import OAuth2PasswordBearer
from jwt import InvalidTokenError
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone

from fastapi_mail import FastMail, MessageSchema, ConnectionConfig

from sqlalchemy.orm import Session

from db.database import get_db
from schemas.auth import TokenData
from models.tables import User

from dotenv import load_dotenv
import os
load_dotenv()

VERIFICATION_EMAIL_SECRET_KEY = os.getenv("VERIFICATION_EMAIL_SECRET_KEY")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

router = APIRouter()

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(db: Session, username: str):
    db_user = db.query(User).filter(User.username == username).first()
    return db_user


def authenticate_user(db: Session, username: str, password: str):
    user = get_user(db, username)
    if not user:
        return False
    if not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.now(timezone.utc) + expires_delta
    else:
        expire = datetime.now(timezone.utc) + timedelta(minutes=15)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"}
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username)
    except InvalidTokenError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == token_data.username).first()
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: User = Depends(get_current_user)):
    return current_user



async def get_current_admin_user(current_user: User = Depends(get_current_active_user)):
    if current_user.role.name.value != "ADMIN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="The user does not have privileges to access this resource."
        )
    return current_user

async def get_current_librarian_user(current_user: User = Depends(get_current_active_user)):
    if not current_user.role or current_user.role.name.value != "LIBRARIAN":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, 
            detail="The user does not have privileges to perform this action."
        )
    return current_user
    
# ------------------------------- EMAIL VERIFICATION TOKEN ------------------------------- #
def create_verification_token(data: dict, expires_delta: timedelta = timedelta(minutes=15)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, VERIFICATION_EMAIL_SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

# ------------------------------- EMAIL CONFIG (SendGrid) ------------------------------- #
conf = ConnectionConfig(
    MAIL_USERNAME="apikey",                      # literally the word "apikey"
    MAIL_PASSWORD=os.getenv("SENDGRID_API_KEY"), # the SendGrid API key from Render
    MAIL_FROM=os.getenv("MAIL_FROM"),            # e.g. noreply@yourdomain.com or your Gmail
    MAIL_PORT=587,
    MAIL_SERVER="smtp.sendgrid.net",
    MAIL_STARTTLS=True,
    MAIL_SSL_TLS=False,
    USE_CREDENTIALS=True,
)

async def send_verification_email(email: str, token: str):
    # Your front-end link (Vercel app) for email verification:
    verification_url = f"https://ddbot-ch6g.vercel.app/verify-email?token={token}"

    html_body = f"""
    
    <html>
        <body>
            <h3>Welcome to DD-bot!</h3>
            <p>Click the link below to verify your email address:</p>
            <a href="{verification_url}" target="_blank"
               style="background:#4CAF50;color:white;padding:10px 15px;
                      text-decoration:none;border-radius:5px;">Verify Email</a>
            <p>If you didn’t create this account, just ignore this email.</p>
        </body>
    </html>
    """

    message = MessageSchema(
        subject="Verify Your DD-bot Email",
        recipients=[email],
        body=html_body,
        subtype="html",
    )

    fm = FastMail(conf)
    try:
        await fm.send_message(message)
        print(f"✅ Verification email sent to {email}")
    except Exception as e:
        print(f"❌ Email sending failed: {e}")
