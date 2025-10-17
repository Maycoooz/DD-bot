from fastapi import APIRouter, Depends, HTTPException, status, Response
from typing import List

from sqlalchemy.orm import Session

from auth.auth_handler import get_current_active_user, get_db, verify_password, get_password_hash
from schemas.auth import StatusMessage
from schemas.users import ParentRegistrationResponse, ChangePassword
from schemas.landing_page import LandingPageResponse
from schemas.parent import ParentProfileUpdate
from models.tables import User, LandingPage

router = APIRouter(
    tags=["Users"]
)

@router.get("/users/me/", response_model=ParentRegistrationResponse)
async def read_users_me(current_user: User = Depends(get_current_active_user)):
    return current_user

@router.patch("/users/me/", response_model=ParentRegistrationResponse)
async def update_users_me(
    # ParentProfileUpdate is a Pydantic model with Optional fields
    update_data: ParentProfileUpdate, 
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    # Updates the authenticated user's profile information
    
    # Converts Pydantic object to a dict, only including fields that were actually sent (set)
    update_data_dict = update_data.model_dump(exclude_unset=True, exclude_none=True)
    
    if not update_data_dict:
        raise HTTPException(status_code=400, detail="No fields provided for update.")

    # Apply updates to the SQLAlchemy model
    for key, value in update_data_dict.items():
        # Sanity check: prevent updating immutable fields
        if key not in ['id', 'username', 'email', 'role_id', 'hashed_password', 'tier']:
            setattr(current_user, key, value)

    db.commit()
    db.refresh(current_user)
    
    return current_user

@router.patch("/users/change-password/{user_id}", response_model=StatusMessage)
def change_password(
    user_id: int, 
    password_data: ChangePassword, 
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    user_change_pw = db.query(User).filter(User.id == user_id).first()
    
    if not user_change_pw:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    if user_change_pw.id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to change this accounts password."
        )
    
    if not verify_password(password_data.current_password, user_change_pw.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password provided is incorrect. Please try again."
        )
        
    new_hashed_password = get_password_hash(password_data.new_password)
    
    user_change_pw.hashed_password = new_hashed_password
    
    db.add(user_change_pw)
    db.commit()
    db.refresh(user_change_pw)
    
    status_message = StatusMessage(
        status="success",
        message="Password updated successfully"
    )
    return status_message

@router.get("/landing-page-content", response_model=List[LandingPageResponse])
def get_public_landing_page_content(
    response: Response, 
    db: Session = Depends(get_db)
):
    # Add headers to prevent browser caching
    response.headers["Cache-Control"] = "no-cache, no-store, must-revalidate"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"

    content = db.query(LandingPage).all()
    return content

# Parents and Kids 
@router.post("/users/make-review/{user_id}", response_model=StatusMessage)
def make_review():
    pass

# Parents and Kids
@router.delete("/users/delete-review/{user_id}", response_model=StatusMessage)
def delete_review():
    pass
        
    