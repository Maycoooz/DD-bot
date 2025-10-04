from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth.auth_handler import get_current_active_user, get_password_hash, get_user
from db.database import get_db
from schemas.parent import ChildRegistrationRequest, ChildRegistrationResponse
from models import users

router = APIRouter(
    prefix="/parent",
    tags=["Parent Actions"]
)


@router.post("/create_child", status_code=status.HTTP_201_CREATED, response_model=ChildRegistrationResponse)
async def create_child_account(
    child_data: ChildRegistrationRequest, 
    db: Session = Depends(get_db),
    current_parent_user: users.User = Depends(get_current_active_user)
):
    # Check if child username is alr in database
    if get_user(db, child_data.username):
        raise HTTPException(status_code=400, detail="Username already registered.")
    
    hashed_password = get_password_hash(child_data.password)
    
    new_child = users.User(
        username=child_data.username,
        email=None,
        hashed_password=hashed_password,
        first_name=child_data.first_name,
        last_name=child_data.last_name,
        country=child_data.country,
        gender=child_data.gender,
        birthday=child_data.birthday,
        race=child_data.race,
        role_id=3, # Child role PK
        primary_parent_id=current_parent_user.id # link parent to child via parents id
    )
    db.add(new_child)
    db.commit()
    db.refresh(new_child)
    
    return new_child
    