from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth.auth_handler import get_current_active_user, get_password_hash, get_user
from db.database import get_db
from schemas.parent import ChildRegistrationRequest, ChildRegistrationResponse
from schemas.interest import InterestResponse
from models import tables
from typing import List

router = APIRouter(
    prefix="/parent",
    tags=["Parent Actions"]
)

@router.get("/interests", response_model=List[InterestResponse])
def get_all_interests(db: Session = Depends(get_db)):
    interests = db.query(tables.Interest).all()
    return interests


@router.post("/create-child", status_code=status.HTTP_201_CREATED, response_model=ChildRegistrationResponse)
async def create_child_account(
    child_data: ChildRegistrationRequest, 
    db: Session = Depends(get_db),
    current_parent_user: tables.User = Depends(get_current_active_user)
):
    # Check if child username is alr in database
    if get_user(db, child_data.username):
        raise HTTPException(status_code=400, detail="Username already registered.")
    
    interests_from_db = db.query(tables.Interest).filter(tables.Interest.name.in_(child_data.interests)).all()
    
    hashed_password = get_password_hash(child_data.password)
    
    new_child = tables.User(
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
    new_child.interests = interests_from_db
    
    db.add(new_child)
    db.commit()
    db.refresh(new_child)
    return new_child
    