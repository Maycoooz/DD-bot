from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from auth.auth_handler import get_current_active_user, get_password_hash, get_user, verify_password
from db.database import get_db
from schemas.parent import ChildRegistrationRequest, ChildRegistrationResponse, ParentViewChildAccountsResponse, ChildProfileUpdate
from schemas.users import ChangePassword
from schemas.interest import InterestResponse
from schemas.auth import StatusMessage
from models import tables
from typing import List

router = APIRouter(
    prefix="/parent",
    tags=["Parent Actions"]
)

# Get all interests in database for dropdown list
@router.get("/interests", response_model=List[InterestResponse])
def get_all_interests(db: Session = Depends(get_db)):
    interests = db.query(tables.Interest).all()
    return interests

# Create child account
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

# View all children accounts
@router.get("/my-children", response_model=List[ParentViewChildAccountsResponse])
def get_children_for_current_parent(
    db: Session = Depends(get_db),
    current_parent: tables.User = Depends(get_current_active_user)
):
    managed_parent = db.merge(current_parent)
    children_list = db.query(tables.User).filter(managed_parent.id == tables.User.primary_parent_id).all()
    
    return children_list

# Update child account  
@router.put("/update-child/{child_id}", response_model=ParentViewChildAccountsResponse)
def update_child_profile(
    child_id: int,
    update_data: ChildProfileUpdate,
    db: Session = Depends(get_db),
    current_parent: tables.User = Depends(get_current_active_user)
):
    # Perform initial checks
    child_to_update = db.query(tables.User).filter(tables.User.id == child_id).first()
    
    if not child_to_update:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Child not found")
    
    if child_to_update.primary_parent_id != current_parent.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to modify this childs profile."
        )
        
    # Create the dictionary of updates from the request data
    update_dict = update_data.model_dump(exclude_unset=True)

    # Handle the 'interests' relationship as a special case
    if "interests" in update_dict:
        # Get the list of names and REMOVE it from the dictionary
        interest_names = update_dict.pop("interests")
        
        # Query the database to get the actual Interest objects
        interests_from_db = db.query(tables.Interest).filter(
            tables.Interest.name.in_(interest_names)
        ).all()
        
        # Validate that all interests were found
        if len(interests_from_db) != len(set(interest_names)):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="One or more selected interests are invalid."
            )
        
        # Assign the list of interests to the relationship
        child_to_update.interests = interests_from_db

    # Loop through the rest off the fields and update them
    for key, value in update_dict.items():
        setattr(child_to_update, key, value)
        
    # Commit all changes to the database
    db.commit()
    db.refresh(child_to_update)
    return child_to_update


@router.delete("/delete-child/{child_id}", response_model=StatusMessage)
def delete_child_account(child_id: int, db: Session = Depends(get_db), current_parent: tables.User = Depends(get_current_active_user)):
    child_to_delete = db.query(tables.User).filter(tables.User.id == child_id).first()
        
    if not child_to_delete:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )
        
    if child_to_delete.primary_parent_id != current_parent.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to delete this child account."
    )
        
    db.delete(child_to_delete)
    db.commit()
    
    status_message = StatusMessage(
        status="success",
        message="Child account deleted successfully."
    )
    
    return status_message

@router.put("/change-kid-password/{child_id}", response_model=ParentViewChildAccountsResponse)
def edit_child_password(child_id: int, child_data: ChangePassword, db: Session = Depends(get_db), current_parent: tables.User = Depends(get_current_active_user)):
    child_to_edit = db.query(tables.User).filter(tables.User.id == child_id).first()
    
    if not child_to_edit:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Child not found"
        )
        
    if child_to_edit.primary_parent_id != current_parent.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not authorized to edit this childs password."
        )
        
    if not verify_password(child_data.current_password, child_to_edit.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The current password provided is incorrect."
        )
        
    child_to_edit.hashed_password = get_password_hash(child_data.new_password)
    db.add(child_to_edit)
    db.commit()
    db.refresh(child_to_edit)
    return child_to_edit
    
    