from datetime import timedelta

from fastapi.security import OAuth2PasswordRequestForm
from fastapi import Depends, HTTPException, status, APIRouter, BackgroundTasks
from sqlalchemy.orm import Session
from jose import JWTError, jwt
import os
from dotenv import load_dotenv

from auth.auth_handler import authenticate_user, ACCESS_TOKEN_EXPIRE_MINUTES, create_access_token, get_user, get_password_hash, create_verification_token, send_verification_email
from db.database import get_db
from schemas.auth import Token
from schemas.librarian import LibrarianRegistrationRequest
from schemas.users import ParentRegistrationRequest, ParentRegistrationResponse
from models.tables import User, SubscriptionTier

load_dotenv()
router = APIRouter()

@router.post("/register")
def register_user(user: ParentRegistrationRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    db_user = get_user(db, user.username)
    if db_user:
        raise HTTPException(status_code=400, detail="Username already registered.")
    
    db_email = db.query(User).filter(User.email == user.email).first()
    if db_email:
        raise HTTPException(status_code=400, detail="Email already registered.")
    
    hashed_password = get_password_hash(user.password)
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        country=user.country,
        gender=user.gender,
        birthday=user.birthday,
        race=user.race,
        tier=SubscriptionTier.FREE,
        role_id=2,
        is_verified=False
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    token = create_verification_token(data={"sub": db_user.email})
    
    background_tasks.add_task(send_verification_email, db_user.email, token)
    
    return {"message": "Registration successful. Please check your email to verify you account."}

@router.post("/register-librarian")
async def register_librarian(
    user: LibrarianRegistrationRequest, 
    background_tasks: BackgroundTasks, 
    db: Session = Depends(get_db)
):
    # Check if username or email already exists
    if db.query(User).filter(User.username == user.username).first():
        raise HTTPException(status_code=400, detail="Username already registered.")
    if db.query(User).filter(User.email == user.email).first():
        raise HTTPException(status_code=400, detail="Email already registered.")
    
    hashed_password = get_password_hash(user.password)
    
    db_user = User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_password,
        first_name=user.first_name,
        last_name=user.last_name,
        country=user.country,
        gender=user.gender,
        birthday=user.birthday,
        race=user.race,
        role_id=4,  # Assuming LIBRARIAN role ID is 4
        is_verified=False
    )
    
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    
    # Send verification email in the background
    token = create_verification_token(data={"sub": db_user.email})
    background_tasks.add_task(send_verification_email, db_user.email, token)
    
    return {"message": "Librarian registration successful. Please check your email to verify your account."}


# verify email 
@router.get("/verify")
def verify_email(token: str, db: Session = Depends(get_db)):
    try:
        payload = jwt.decode(token, os.getenv("VERIFICATION_EMAIL_SECRET_KEY"), algorithms=os.getenv("ALGORITHM"))
        email: str = payload.get("sub")
        if email is None:
            raise HTTPException(status_code=400, detail="Invalid token")
    except JWTError:
        raise HTTPException(status_code=400, detail="Invalid token")
    
    user = db.query(User).filter(User.email == email).first()
    if user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    if user.is_verified:
        return {"message": "User is verified. Please close this page and login!"}
    
    user.is_verified = True
    db.commit()
    
    return {"message": "Email verified successfully. You can now log in."}

# login with authentication & receive access token
@router.post("/token")
async def login_for_access_token( form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(get_db)) -> Token:
    user = authenticate_user(db, form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
        
    if not user.is_verified:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Please verify your email before logging in.")
        
    # Get role information as well
    user_role_name = user.role.name.value
        
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.username, "role": user_role_name}, 
        expires_delta=access_token_expires
    )
    return Token(
        access_token=access_token, 
        token_type="bearer",
        user_role=user_role_name
    )
