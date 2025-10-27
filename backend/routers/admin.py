from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload, aliased
from sqlalchemy import or_, select, func

from auth.auth_handler import get_current_admin_user, get_db, verify_password, get_password_hash
from schemas.auth import StatusMessage
from schemas.admin import (
    AdminReviewResponse, AdminReviewUserResponse, 
    PaginatedAdminReviewResponse, AdminUserStats,
    PaginatedLibrarianListResponse, LibrarianListItem,
    AdminUserListItem, PaginatedUserListResponse,
    ChildAccountListItem
    
    )
from schemas.librarian import LibrarianResponse
from schemas.media import PaginatedBookResponse, PaginatedVideoResponse
from models.tables import User, LandingPage, Book, Video, Review, UserRole, ReviewType, Role
from schemas.landing_page import LandingPageResponse, LandingPageUpdate, LandingPageCreate

from typing import List, Optional
import math

import os
from dotenv import load_dotenv
load_dotenv()

router = APIRouter(
    tags=["Admin"],
    prefix="/admin"
)

# view parent & kids 
@router.get(
    "/view-all-users",
    response_model=PaginatedUserListResponse,
    summary="Paginated list of all parents & kids with global counts",
)
def view_all_users(
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
    page: int = Query(1, ge=1, description="Page number (1-indexed)"),
    size: int = Query(10, ge=1, le=100, description="Page size"),
    search: Optional[str] = Query(
        None,
        description="Search username / first_name / last_name / email"
    ),
):
    """
    Returns a paginated list of PARENT + CHILD accounts.
    Also returns global totals for parents, kids, and combined.
    """

    # 1. Build base query of just parents + kids
    base_q = (
        db.query(User)
        .options(joinedload(User.role))
        .join(Role)
        .filter(Role.name.in_([UserRole.PARENT, UserRole.CHILD]))
    )

    # 2. Apply search if provided
    if search:
        like_val = f"%{search}%"
        base_q = base_q.filter(
            or_(
                User.username.ilike(like_val),
                User.first_name.ilike(like_val),
                User.last_name.ilike(like_val),
                User.email.ilike(like_val),
            )
        )

    # 3. Count how many match the current filter (for pagination UI)
    filtered_total = base_q.count()

    # 4. Pagination slice for this page
    rows = (
        base_q
        .order_by(User.id.asc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    # 5. Build a map of parent_id -> parent_email so we can show parent email for CHILD rows
    parent_ids_needed = {
        u.primary_parent_id
        for u in rows
        if u.primary_parent_id is not None
    }
    parent_email_map = {}
    if parent_ids_needed:
        parent_email_rows = (
            db.query(User.id, User.email)
            .filter(User.id.in_(parent_ids_needed))
            .all()
        )
        parent_email_map = {pid: pemail for (pid, pemail) in parent_email_rows}

    # 6. Build response items for this page
    items: List[AdminUserListItem] = []
    for u in rows:
        # role string (PARENT / CHILD). If Role.name is Enum (UserRole), it might already be the right string.
        role_name_str = u.role.name if u.role else "UNKNOWN"

        # subscription tier (e.g. "FREE", "PREMIUM")
        tier_val = u.tier or "FREE"

        # Email verification comes directly from user.is_verified
        is_verified_val = bool(u.is_verified)

        # For CHILD, show parent's email in the table; otherwise None
        parent_email_val = None
        if role_name_str == UserRole.CHILD:
            parent_email_val = parent_email_map.get(u.primary_parent_id)

        items.append(
            AdminUserListItem(
                id=u.id,
                username=u.username,
                first_name=u.first_name,
                last_name=u.last_name,
                email=u.email,
                role_name=role_name_str,
                subscription_tier=tier_val,
                is_verified=is_verified_val,
                parent_email=parent_email_val,
            )
        )

    # 7. Global totals (all parents/kids in DB)
    total_parents_global = (
        db.query(func.count(User.id))
        .join(Role)
        .filter(Role.name == UserRole.PARENT)
        .scalar()
    )

    total_kids_global = (
        db.query(func.count(User.id))
        .join(Role)
        .filter(Role.name == UserRole.CHILD)
        .scalar()
    )

    total_accounts_global = (total_parents_global or 0) + (total_kids_global or 0)

    # 8. total pages for current filtered query (at least 1)
    total_pages = max(1, math.ceil(filtered_total / size)) if filtered_total else 1

    # 9. Return final payload
    return PaginatedUserListResponse(
        items=items,
        total_accounts=total_accounts_global,
        total_parents=total_parents_global or 0,
        total_kids=total_kids_global or 0,
        page=page,
        size=size,
        total_pages=total_pages,
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
            joinedload(Review.user).joinedload(User.role),
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


# Utitlity endpoint to see how many users in database excluding any admins
@router.get("/user-stats", response_model=AdminUserStats)
def admin_user_stats(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user),
):
    # counts by role
    total_parents = db.query(User).join(Role).filter(Role.name == UserRole.PARENT).count()
    total_kids = db.query(User).join(Role).filter(Role.name == UserRole.CHILD).count()
    total_librarians = db.query(User).join(Role).filter(Role.name == UserRole.LIBRARIAN).count()

    total_users = total_parents + total_kids + total_librarians  # exclude admins

    return AdminUserStats(
        total_users=total_users,
        total_parents=total_parents,
        total_kids=total_kids,
        total_librarians=total_librarians,
    )


# New view librarian paginated
@router.get(
    "/librarians",
    response_model=PaginatedLibrarianListResponse,
    summary="List librarians (paginated)",
)
def list_librarians(
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user),
    page: int = Query(1, ge=1, description="Page number"),
    size: int = Query(10, ge=1, le=100, description="Items per page"),
    search: Optional[str] = Query(
        None,
        description="Optional search by username / name / email"
    ),
):
    """
    Returns ONLY users whose role is LIBRARIAN.
    Supports pagination + optional search.
    """

    # base query: only librarians
    base_q = (
        db.query(User)
        .options(joinedload(User.role))
        .filter(User.role.has(Role.name == UserRole.LIBRARIAN))
    )

    # optional search
    if search:
        like_val = f"%{search}%"
        base_q = base_q.filter(
            or_(
                User.username.ilike(like_val),
                User.first_name.ilike(like_val),
                User.last_name.ilike(like_val),
                User.email.ilike(like_val),
            )
        )

    total = base_q.count()

    rows = (
        base_q
        .order_by(User.id.desc())
        .offset((page - 1) * size)
        .limit(size)
        .all()
    )

    items = [
        LibrarianListItem(
            id=u.id,
            username=u.username,
            email=u.email,
            first_name=u.first_name,
            last_name=u.last_name,
            is_verified=u.is_verified,
            librarian_verified=u.librarian_verified,
            role_name=u.role.name if u.role else None,
        )
        for u in rows
    ]

    return PaginatedLibrarianListResponse(total=total, items=items)

@router.patch(
    "/librarians/{librarian_id}/verify",
    response_model=LibrarianListItem,
    summary="Approve/unapprove a librarian"
)
def toggle_librarian_verification(
    librarian_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user),
):
    """
    Flip librarian_verified for this librarian.
    """
    librarian = (
        db.query(User)
        .options(joinedload(User.role))
        .filter(
            User.id == librarian_id,
            User.role.has(Role.name == UserRole.LIBRARIAN),
        )
        .first()
    )
    if librarian is None:
        raise HTTPException(status_code=404, detail="Librarian not found")

    librarian.librarian_verified = not librarian.librarian_verified
    db.commit()
    db.refresh(librarian)

    return LibrarianListItem(
        id=librarian.id,
        username=librarian.username,
        email=librarian.email,
        first_name=librarian.first_name,
        last_name=librarian.last_name,
        is_verified=librarian.is_verified,
        librarian_verified=librarian.librarian_verified,
        role_name=librarian.role.name if librarian.role else None,
    )


@router.delete(
    "/librarians/{librarian_id}",
    summary="Delete a librarian account"
)
def delete_librarian(
    librarian_id: int,
    db: Session = Depends(get_db),
    admin_user: User = Depends(get_current_admin_user),
):
    """
    Hard-delete librarian user.
    """
    librarian = (
        db.query(User)
        .filter(User.id == librarian_id)
        .join(Role)
        .filter(Role.name == UserRole.LIBRARIAN)
        .first()
    )
    if librarian is None:
        raise HTTPException(status_code=404, detail="Librarian not found")

    db.delete(librarian)
    db.commit()

    return {"message": "Librarian deleted successfully."}

@router.get(
    "/parents/{parent_id}/children",
    response_model=list[ChildAccountListItem],
    summary="Get all child accounts for a given parent",
)
def get_parent_children(
    parent_id: int,
    db: Session = Depends(get_db),
    current_admin: User = Depends(get_current_admin_user),
):
    """
    Returns all CHILD users whose primary_parent_id == parent_id.
    Visible to admins only.
    """

    # 1. Validate that this parent actually exists AND is a parent
    parent = (
        db.query(User)
        .join(Role)
        .filter(
            User.id == parent_id,
            Role.name == UserRole.PARENT
        )
        .first()
    )
    if parent is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Parent not found or not a PARENT role.",
        )

    # 2. Fetch all children tied to that parent
    children = (
        db.query(User)
        .join(Role)
        .filter(
            Role.name == UserRole.CHILD,
            User.primary_parent_id == parent_id
        )
        .order_by(User.id.asc())
        .all()
    )

    # 3. Shape into response
    result: list[ChildAccountListItem] = []
    for c in children:
        result.append(
            ChildAccountListItem(
                id=c.id,
                username=c.username,
                first_name=c.first_name,
                last_name=c.last_name,
                email=c.email,
                is_verified=bool(c.is_verified),
            )
        )

    return result