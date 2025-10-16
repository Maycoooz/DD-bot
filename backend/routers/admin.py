from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_

from auth.auth_handler import get_current_admin_user, get_db, verify_password, get_password_hash
from schemas.auth import StatusMessage
from schemas.admin import ViewAllUserResponse
from schemas.librarian import LibrarianResponse
from schemas.media import PaginatedBookResponse, PaginatedVideoResponse
from models.tables import User, LandingPage, Book, Video
from schemas.landing_page import LandingPageResponse, LandingPageUpdate

from typing import List

import os
from dotenv import load_dotenv
load_dotenv()

router = APIRouter(
    tags=["Admin"],
    prefix="/admin"
)

# view parent & kids 
@router.get("/view-all-users", response_model=ViewAllUserResponse)
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

# delete parent or kid 
@router.delete("/delete-user/{user_id}", response_model=StatusMessage)
def delete_user(
    user_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    user_to_delete = (
        db.query(User)
        .options(joinedload(User.role))
        .filter(User.id == user_id)
        .first()
    )

    if not user_to_delete:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    is_parent = user_to_delete.role.name.value == "PARENT"
    username = user_to_delete.username # Store username before deletion

    if is_parent:
        children_to_delete = db.query(User).filter(User.primary_parent_id == user_to_delete.id).all()
        for child in children_to_delete:
            db.delete(child)
    
    db.delete(user_to_delete)
    
    db.commit()

    # --- Conditional Message Logic ---
    if is_parent:
        message = f"Account for user '{username}' and all associated child accounts have been deleted."
    else:
        message = f"Account for user '{username}' has been deleted."
    
    return StatusMessage(
        status="success",
        message=message
    )

@router.get("/landing-page-content", response_model=List[LandingPageResponse])
def get_landing_page_content(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin_user)):
    content = db.query(LandingPage).all()
    return content

@router.put("/landing-page-content/{item_id}", response_model=LandingPageResponse)
def update_landing_page_content(item_id: int, content_update: LandingPageUpdate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin_user)):
    db_item = db.query(LandingPage).filter(LandingPage.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content item not found")
    
    db_item.display_text = content_update.display_text
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/view-all-librarians", response_model=List[LibrarianResponse])
def view_all_librarians(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    librarians = db.query(User).filter(User.role_id == 4).all() # 4 is LIBRARIAN role_id
    return librarians
    
@router.delete("/delete-librarian/{librarian_id}", response_model=StatusMessage)
def delete_librarian_and_media(
    librarian_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    librarian = db.query(User).filter(User.id == librarian_id, User.role_id == 4).first()
    if not librarian:
        raise HTTPException(status_code=404, detail="Librarian not found")
        
    librarian_username = librarian.username

    # Delete all media sourced by this librarian
    db.query(Book).filter(Book.source == librarian_username).delete(synchronize_session=False)
    db.query(Video).filter(Video.source == librarian_username).delete(synchronize_session=False)
    
    # Delete the librarian user
    db.delete(librarian)
    
    db.commit()
    
    return StatusMessage(status="success", message=f"Librarian '{librarian_username}' and all their contributions have been deleted.")

# Endpoint to get a paginated list of books by a specific librarian
@router.get("/librarian/{librarian_id}/books", response_model=PaginatedBookResponse)
def get_librarian_books(
    librarian_id: int,
    db: Session = Depends(get_db),
    page: int = 1,
    size: int = 5  # Show 5 items per page
):
    librarian = db.query(User).filter(User.id == librarian_id, User.role_id == 4).first()
    if not librarian:
        raise HTTPException(status_code=404, detail="Librarian not found")

    query = db.query(Book).filter(Book.source == librarian.username).order_by(Book.id.desc())
    total = query.count()
    books = query.offset((page - 1) * size).limit(size).all()
    
    return PaginatedBookResponse(total=total, items=books)

# Endpoint to get a paginated list of videos by a specific librarian
@router.get("/librarian/{librarian_id}/videos", response_model=PaginatedVideoResponse)
def get_librarian_videos(
    librarian_id: int,
    db: Session = Depends(get_db),
    page: int = 1,
    size: int = 5
):
    librarian = db.query(User).filter(User.id == librarian_id, User.role_id == 4).first()
    if not librarian:
        raise HTTPException(status_code=404, detail="Librarian not found")

    query = db.query(Video).filter(Video.source == librarian.username).order_by(Video.id.desc())
    total = query.count()
    videos = query.offset((page - 1) * size).limit(size).all()
    
    return PaginatedVideoResponse(total=total, items=videos)

# approve a librarian by an admin
@router.patch("/approve-librarian/{librarian_id}", response_model=LibrarianResponse)
def approve_librarian(
    librarian_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    librarian = db.query(User).filter(User.id == librarian_id, User.role_id == 4).first()
    if not librarian:
        raise HTTPException(status_code=404, detail="Librarian not found")
    
    if librarian.librarian_verified:
        raise HTTPException(status_code=400, detail="Librarian is already approved.")
        
    librarian.librarian_verified = True
    db.commit()
    db.refresh(librarian)
    
    return librarian