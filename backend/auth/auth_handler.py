import jwt
from fastapi import Depends, HTTPException, status, APIRouter
from fastapi.security import OAuth2PasswordBearer
from jwt import InvalidTokenError
from passlib.context import CryptContext
from datetime import datetime, timedelta, timezone
from sqlalchemy.orm import Session

from db.database import get_db
from schemas.auth import TokenData
from models.tables import User

from dotenv import load_dotenv
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail

load_dotenv()

# ------------------------------- CONFIG ------------------------------- #
VERIFICATION_EMAIL_SECRET_KEY = os.getenv("VERIFICATION_EMAIL_SECRET_KEY")
SECRET_KEY = os.getenv("SECRET_KEY")
ALGORITHM = os.getenv("ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = 30

MAIL_FROM = os.getenv("MAIL_FROM")                  # verified sender (e.g. fypddbot@gmail.com)
SENDGRID_API_KEY = os.getenv("MAIL_PASSWORD")       # your SendGrid API key

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

router = APIRouter()

# ------------------------------- AUTH HELPERS ------------------------------- #
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def get_user(db: Session, username: str):
    return db.query(User).filter(User.username == username).first()

def authenticate_user(db: Session, username: str, password: str):
    user = get_user(db, username)
    if not user or not verify_password(password, user.hashed_password):
        return False
    return user

def create_access_token(data: dict, expires_delta: timedelta | None = None):
    to_encode = data.copy()
    expire = datetime.now(timezone.utc) + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

# ------------------------------- DEPENDENCIES ------------------------------- #
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
    except InvalidTokenError:
        raise credentials_exception
    
    user = db.query(User).filter(User.username == username).first()
    if not user:
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
    return jwt.encode(to_encode, VERIFICATION_EMAIL_SECRET_KEY, algorithm=ALGORITHM)

# ------------------------------- SENDGRID EMAIL FUNCTION ------------------------------- #
async def send_verification_email(email: str, token: str):
    verification_url = f"https://ddbot-ch6g.vercel.app/verify-email?token={token}"

    html_content = f"""
    <html>
        <body>
            <h3>Welcome to DD-bot!</h3>
            <p>Click below to verify your email address:</p>
            <a href="{verification_url}" target="_blank"
               style="background:#4CAF50;color:white;padding:10px 15px;
                      text-decoration:none;border-radius:5px;">Verify Email</a>
            <p>If you didn’t create this account, ignore this email.</p>
        </body>
    </html>
    """

    message = Mail(
        from_email=MAIL_FROM,
        to_emails=email,
        subject="Verify Your DD-bot Email",
        html_content=html_content,
    )

    try:
        sg = SendGridAPIClient(SENDGRID_API_KEY)
        response = sg.send(message)
        print(f"✅ Verification email sent to {email} (status {response.status_code})")
    except Exception as e:
        print(f"❌ Email sending failed: {e}")
