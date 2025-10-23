from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload, aliased
from sqlalchemy import or_, select

from auth.auth_handler import get_current_admin_user, get_db, verify_password, get_password_hash
from schemas.auth import StatusMessage
from schemas.admin import ViewAllUserResponse, AdminReviewResponse, AdminReviewUserResponse, PaginatedAdminReviewResponse
from schemas.librarian import LibrarianResponse
from schemas.media import PaginatedBookResponse, PaginatedVideoResponse
from models.tables import User, LandingPage, Book, Video, Review, UserRole, ReviewType
from schemas.landing_page import LandingPageResponse, LandingPageUpdate, LandingPageCreate

from typing import List, Optional

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
def get_admin_landing_page_content(
    db: Session = Depends(get_db), 
    current_admin: User = Depends(get_current_admin_user)
):
    content = db.query(LandingPage).all()
    return content

@router.put("/landing-page-content/{item_id}", response_model=LandingPageResponse)
def update_landing_page_content(
    item_id: int, 
    content_update: LandingPageUpdate, 
    db: Session = Depends(get_db), 
    current_admin: User = Depends(get_current_admin_user)
):
    # Find the database item by its ID
    db_item = db.query(LandingPage).filter(LandingPage.id == item_id).first()
    if not db_item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Content item not found")
    
    # Update the display_text (always provided in the schema)
    db_item.display_text = content_update.display_text
    
    # Conditionally update the title only if it was included in the request
    if content_update.title is not None:
        db_item.title = content_update.title
        
    db.commit()
    db.refresh(db_item)
    return db_item

@router.post("/landing-page-content", response_model=LandingPageResponse, status_code=status.HTTP_201_CREATED)
def create_landing_page_content(
    content_create: LandingPageCreate,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user)
):
    new_item = LandingPage(**content_create.model_dump())
    db.add(new_item)
    db.commit()
    db.refresh(new_item)
    return new_item

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

# revoke review approval to remove the review from the landing page incase it somehow bypass the
# sentiment and profanity checks
@router.put("/review/{review_id}/revoke-approval", response_model=StatusMessage)
def revoke_review_approval(
    review_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user)
):
    # Find the review
    review = db.query(Review).filter(Review.id == review_id).first()
    
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found."
        )
        
    # Check if it's already hidden
    if not review.is_public_display_approved:
        return StatusMessage(
            status="info", 
            message="This review is already hidden from the landing page."
        )
        
    # Update the field and commit
    review.is_public_display_approved = False
    db.commit()
    
    return StatusMessage(
        status="success", 
        message="Review approval has been revoked and it will no longer appear on the landing page."
    )
    

def _extract_parent_email(user):
    """
    Works whether user.parent_user is a scalar or a collection.
    Returns the first parent's email if it's a list, else the scalar's email.
    """
    parent_rel = getattr(user, "parent_user", None)
    if parent_rel is None:
        return None

    # If it looks like a collection and doesn't itself have .email, take first
    if hasattr(parent_rel, "__iter__") and not hasattr(parent_rel, "email"):
        first_parent = next(iter(parent_rel), None)
        return getattr(first_parent, "email", None) if first_parent is not None else None

    # Scalar relationship
    return getattr(parent_rel, "email", None)

# Admin-only endpoint to view all reviews with pagination and filtering.
# Includes the reviewer's email and parent's email if the reviewer is a child.
# can search by stars & latest
@router.get("/all-reviews", response_model=PaginatedAdminReviewResponse)
def admin_view_all_reviews(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user),
    stars: Optional[int] = Query(None, ge=1, le=5),
    review_type: Optional[ReviewType] = Query(None),
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
):
    # 1) base query + filters
    base_q = (
        db.query(Review)
        .options(
            joinedload(Review.user).joinedload(User.role),      # keep role eager
            # no need to eagerload parent_user anymore
        )
    )
    if stars is not None:
        base_q = base_q.filter(Review.stars == stars)
    if review_type is not None:
        base_q = base_q.filter(Review.review_type == review_type)

    total = base_q.count()

    reviews = (
        base_q
        .order_by(Review.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    # 2) collect all parent ids we need to resolve for this page
    parent_ids = {
        r.user.primary_parent_id
        for r in reviews
        if r.user is not None and r.user.primary_parent_id is not None
    }
    parent_email_map: dict[int, Optional[str]] = {}
    if parent_ids:
        # one compact query to fetch the emails
        rows = db.execute(
            select(User.id, User.email).where(User.id.in_(parent_ids))
        ).all()
        parent_email_map = {pid: email for pid, email in rows}

    # 3) build response items
    items: list[AdminReviewResponse] = []
    for r in reviews:
        if r.user is None:
            continue

        parent_email = None
        if r.user.primary_parent_id is not None:
            parent_email = parent_email_map.get(r.user.primary_parent_id)

        user_payload = AdminReviewUserResponse(
            id=r.user.id,
            username=r.user.username,
            email=r.user.email,                           # Optional[str] in schema
            role_name=r.user.role.name if r.user.role else None,
            parent_email=parent_email                     # will show for CHILD rows
        )

        items.append(
            AdminReviewResponse(
                id=r.id,
                review=r.review,
                stars=r.stars,
                review_type=r.review_type,
                is_public_display_approved=r.is_public_display_approved,
                created_at=r.created_at,
                user=user_payload,
            )
        )

    return PaginatedAdminReviewResponse(total=total, items=items)

