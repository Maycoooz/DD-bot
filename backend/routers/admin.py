from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from auth.auth_handler import get_current_admin_user, get_db, verify_password, get_password_hash
from schemas.auth import StatusMessage
from schemas.admin import ViewAllUserResponse
from models.tables import User

from typing import List

import os
from dotenv import load_dotenv
load_dotenv()

router = APIRouter(
    tags=["Admin"],
    prefix="/admin"
)

@router.get("/viewAllUsers", response_model=ViewAllUserResponse)
def view_all_users(
    db: Session = Depends(get_db), 
    current_admin: User = Depends(get_current_admin_user)
):
    # Fetch all users (parents and kids)
    parents_and_kids_query = (
        db.query(User)
        .options(joinedload(User.role))
        .filter(User.role_id.in_([2, 3]))
        .all()
    )
    
    # Calculate the counts
    total_users = len(parents_and_kids_query)
    total_parents = sum(1 for user in parents_and_kids_query if user.role_id == 2)
    total_kids = sum(1 for user in parents_and_kids_query if user.role_id == 3)
    
    # Build and return the final response object
    return ViewAllUserResponse(
        parent_and_kid_users=parents_and_kids_query,
        total_users=total_users,
        total_parents=total_parents,
        total_kids=total_kids
    )
