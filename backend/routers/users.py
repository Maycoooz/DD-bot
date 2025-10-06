from fastapi import APIRouter, Depends, HTTPException, status

from sqlalchemy.orm import Session

from auth.auth_handler import get_current_active_user, get_db
from schemas.users import ParentRegistrationResponse
from schemas.parent import ParentProfileUpdate
from models.tables import User

router = APIRouter()

# Define fields that are immutable for ALL users via this endpoint
IMMUTABLE_FIELDS = [
    'id', 'username', 'email', 'role_id', 'hashed_password', 
    'tier', 'primary_parent_id', 'children_list', 'parent_user'
]

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