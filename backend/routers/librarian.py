from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import distinct, select, or_, and_
from typing import List, Optional, Literal

from db.database import get_db
from models.tables import Book, Video, User, UserRole, ReviewType, Review
from schemas.auth import StatusMessage
from schemas.media import BookCreate, BookResponse, BookUpdate, VideoCreate, VideoResponse, VideoUpdate, PaginatedBookResponse, PaginatedVideoResponse
from schemas.librarian import PaginatedLibrarianReviewResponse, LibrarianReviewResponse, LibrarianReviewUserResponse
from auth.auth_handler import get_current_librarian_user

router = APIRouter(
    prefix="/librarian",
    tags=["Librarian Actions"]
)

# used to check if a link already exists in book or video tables 
def check_link_exists(link: str, db: Session):
    book_exists = db.query(Book).filter(Book.link == link).first()
    if book_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This link is already in use by the book titled: '{book_exists.title}'"
        )
        
    video_exists = db.query(Video).filter(Video.link == link).first()
    if video_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This link is already in use by the video titled: '{video_exists.title}'"
        )

@router.get("/media-sources", response_model=List[str])
def get_media_sources(db: Session = Depends(get_db)):
    book_sources = db.query(distinct(Book.source)).all()
    video_sources = db.query(distinct(Video.source)).all()
    
    # Combine sources from both tables into a set to get unique values
    all_sources = {source[0] for source in book_sources + video_sources if source[0]}
    
    return sorted(list(all_sources))


# --- GET Routes Public ---
@router.get("/view-all-books", response_model=PaginatedBookResponse)
def view_all_books(
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    source: Optional[str] = None,
    page: int = 1,
    size: int = 10,
    sort: Literal["id", "rating", "newest", "oldest"] = "id",
    direction: Literal["asc", "desc"] = "desc",
):
    q = db.query(Book)

    # filters
    if search:
        # case-insensitive contains
        q = q.filter(Book.title.ilike(f"%{search}%"))
    if source:
        q = q.filter(Book.source == source)
        
    if sort == "newest":
        sort, direction = "id", "desc"
    elif sort == "oldest":
        sort, direction = "id", "asc"

    # ordering
    order_col = Book.rating if sort == "rating" else Book.id
    order_expr = order_col.desc() if direction == "desc" else order_col.asc()
    q = q.order_by(order_expr)

    total = q.count()
    items = q.offset((page - 1) * size).limit(size).all()
    return PaginatedBookResponse(total=total, items=items)


# --- Videos ---
@router.get("/view-all-videos", response_model=PaginatedVideoResponse)
def view_all_videos(
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    source: Optional[str] = None,
    page: int = 1,
    size: int = 10,
    sort: Literal["id", "rating", "newest", "oldest"] = "id",
    direction: Literal["asc", "desc"] = "desc",
):
    q = db.query(Video)

    # filters
    if search:
        q = q.filter(Video.title.ilike(f"%{search}%"))
    if source:
        q = q.filter(Video.source == source)
        
    if sort == "newest":
        sort, direction = "id", "desc"
    elif sort == "oldest":
        sort, direction = "id", "asc"

    # ordering
    order_col = Video.rating if sort == "rating" else Video.id
    order_expr = order_col.desc() if direction == "desc" else order_col.asc()
    q = q.order_by(order_expr)

    total = q.count()
    items = q.offset((page - 1) * size).limit(size).all()
    return PaginatedVideoResponse(total=total, items=items)

# --- GET Routes Protected ---

@router.get("/all-reviews", response_model=PaginatedLibrarianReviewResponse)
def librarian_view_all_reviews(
    db: Session = Depends(get_db),
    librarian_user: User = Depends(get_current_librarian_user),
    stars: Optional[int] = Query(None, ge=1, le=5),
    review_type: Optional[ReviewType] = Query(None, description="BOOK or VIDEO"),
    q: Optional[str] = Query(None, description="Search by book/video title"),  # <-- NEW
    page: int = Query(1, ge=1),
    size: int = Query(10, ge=1, le=100),
):
    base = (
        db.query(Review)
        .options(
            joinedload(Review.user).joinedload(User.role)
        )
        .filter(Review.review_type.in_([ReviewType.BOOK, ReviewType.VIDEO]))  # librarians can't see APP
    )

    if stars is not None:
        base = base.filter(Review.stars == stars)
    if review_type is not None:
        base = base.filter(Review.review_type == review_type)

    if q:
        like = f"%{q}%"
        base = base.filter(
            or_(
                and_(
                    Review.review_type == ReviewType.BOOK,
                    Review.reviewable_id.in_(
                        db.query(Book.id).filter(Book.title.ilike(like))
                    ),
                ),
                and_(
                    Review.review_type == ReviewType.VIDEO,
                    Review.reviewable_id.in_(
                        db.query(Video.id).filter(Video.title.ilike(like))
                    ),
                ),
            )
        )

    total = base.count()
    rows = (
        base.order_by(Review.created_at.desc())
            .offset((page - 1) * size)
            .limit(size)
            .all()
    )

    # build response (keeps emails hidden)
    items: List[LibrarianReviewResponse] = []
    for r in rows:
        media_title = None
        media_id = None
        if r.review_type == ReviewType.BOOK:
            media_id = r.reviewable_id
            media_title = db.query(Book.title).filter(Book.id == r.reviewable_id).scalar()
        elif r.review_type == ReviewType.VIDEO:
            media_id = r.reviewable_id
            media_title = db.query(Video.title).filter(Video.id == r.reviewable_id).scalar()

        items.append(
            LibrarianReviewResponse(
                id=r.id,
                review=r.review,
                stars=r.stars,
                review_type=r.review_type,
                is_public_display_approved=r.is_public_display_approved,
                created_at=r.created_at,
                user=LibrarianReviewUserResponse(
                    id=r.user.id,
                    username=r.user.username,
                    role_name=r.user.role.name if r.user.role else None,
                ),
                media_title=media_title,
                media_id=media_id,
            )
        )

    return PaginatedLibrarianReviewResponse(total=total, items=items)


# --- POST (Create) Routes - Librarian Only ---
@router.post("/add-book", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def add_book(
    book: BookCreate, 
    db: Session = Depends(get_db), 
    current_librarian: User = Depends(get_current_librarian_user)
):
    check_link_exists(book.link, db)

    new_book = Book(**book.model_dump(), source=current_librarian.username)
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    return new_book

@router.post("/add-video", response_model=VideoResponse, status_code=status.HTTP_201_CREATED)
def add_video(
    video: VideoCreate, 
    db: Session = Depends(get_db), 
    current_librarian: User = Depends(get_current_librarian_user)
):
    check_link_exists(video.link, db)

    new_video = Video(**video.model_dump(), source=current_librarian.username)
    db.add(new_video)
    db.commit()
    db.refresh(new_video)
    return new_video

# --- PATCH (Update) Routes - Librarian Only ---
@router.patch("/edit-book/{book_id}", response_model=BookResponse)
def edit_book(
    book_id: int, 
    update_data: BookUpdate, 
    db: Session = Depends(get_db), 
    current_librarian: User = Depends(get_current_librarian_user)
):
    book_query = db.query(Book).filter(Book.id == book_id)
    db_book = book_query.first()
    if not db_book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    
    # Get the update data, excluding fields that were not sent
    update_dict = update_data.model_dump(exclude_unset=True)
    book_query.update(update_dict)
    
    db.commit()
    db.refresh(db_book)
    return db_book

@router.patch("/edit-video/{video_id}", response_model=VideoResponse)
def edit_video(
    video_id: int, 
    update_data: VideoUpdate, 
    db: Session = Depends(get_db), 
    current_librarian: User = Depends(get_current_librarian_user)
):
    video_query = db.query(Video).filter(Video.id == video_id)
    db_video = video_query.first()
    if not db_video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
    
    update_dict = update_data.model_dump(exclude_unset=True)
    video_query.update(update_dict)
    
    db.commit()
    db.refresh(db_video)
    return db_video

# --- DELETE (Delete) Routes - Librarian Only ---
@router.delete("/delete-book/{book_id}", response_model=StatusMessage)
def delete_book(
    book_id: int, 
    db: Session = Depends(get_db), 
    current_librarian: User = Depends(get_current_librarian_user)
):
    db_book = db.query(Book).filter(Book.id == book_id).first()
    if not db_book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    
    db.delete(db_book)
    db.commit()
    return StatusMessage(status="success", message="Book deleted successfully.")

@router.delete("/delete-video/{video_id}", response_model=StatusMessage)
def delete_video(
    video_id: int, 
    db: Session = Depends(get_db), 
    current_librarian: User = Depends(get_current_librarian_user)
):
    db_video = db.query(Video).filter(Video.id == video_id).first()
    if not db_video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
        
    db.delete(db_video)
    db.commit()
    return StatusMessage(status="success", message="Video deleted successfully.")


# --- Librarian Only Utility endpoints ---
# Router endpoints specifically for librarian search by source bar
@router.get("/book-sources", response_model=List[str])
def get_book_sources(db: Session = Depends(get_db)):
    rows = db.query(Book.source).distinct().all() 
    return [s for (s,) in rows if s]

@router.get("/video-sources", response_model=List[str])
def get_video_sources(db: Session = Depends(get_db)):
    rows = db.query(Video.source).distinct().all()
    return [s for (s,) in rows if s]