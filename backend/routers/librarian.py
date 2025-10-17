from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy import distinct
from typing import List, Optional

from db.database import get_db
from models import tables
from schemas.auth import StatusMessage
from schemas.media import BookCreate, BookResponse, BookUpdate, VideoCreate, VideoResponse, VideoUpdate, PaginatedBookResponse, PaginatedVideoResponse
from auth.auth_handler import get_current_librarian_user

router = APIRouter(
    prefix="/librarian",
    tags=["Librarian Actions"]
)

# used to check if a link already exists in book or video tables 
def check_link_exists(link: str, db: Session):
    book_exists = db.query(tables.Book).filter(tables.Book.link == link).first()
    if book_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This link is already in use by the book titled: '{book_exists.title}'"
        )
        
    video_exists = db.query(tables.Video).filter(tables.Video.link == link).first()
    if video_exists:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"This link is already in use by the video titled: '{video_exists.title}'"
        )

@router.get("/media-sources", response_model=List[str])
def get_media_sources(db: Session = Depends(get_db)):
    book_sources = db.query(distinct(tables.Book.source)).all()
    video_sources = db.query(distinct(tables.Video.source)).all()
    
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
    size: int = 10
):
    query = db.query(tables.Book).order_by(tables.Book.id.desc())
    if search:
        query = query.filter(tables.Book.title.contains(search))
    if source:
        query = query.filter(tables.Book.source == source)

    total = query.count()
    books = query.offset((page - 1) * size).limit(size).all()
    return PaginatedBookResponse(total=total, items=books)

@router.get("/view-all-videos", response_model=PaginatedVideoResponse)
def view_all_videos(
    db: Session = Depends(get_db),
    search: Optional[str] = None,
    source: Optional[str] = None, # New filter parameter
    page: int = 1,
    size: int = 10
):
    query = db.query(tables.Video).order_by(tables.Video.id.desc())
    if search:
        query = query.filter(tables.Video.title.contains(search))
    if source:
        query = query.filter(tables.Video.source == source)

    total = query.count()
    videos = query.offset((page - 1) * size).limit(size).all()
    return PaginatedVideoResponse(total=total, items=videos)

# --- POST (Create) Routes - Librarian Only ---
@router.post("/add-book", response_model=BookResponse, status_code=status.HTTP_201_CREATED)
def add_book(
    book: BookCreate, 
    db: Session = Depends(get_db), 
    current_librarian: tables.User = Depends(get_current_librarian_user)
):
    check_link_exists(book.link, db)

    new_book = tables.Book(**book.model_dump(), source=current_librarian.username)
    db.add(new_book)
    db.commit()
    db.refresh(new_book)
    return new_book

@router.post("/add-video", response_model=VideoResponse, status_code=status.HTTP_201_CREATED)
def add_video(
    video: VideoCreate, 
    db: Session = Depends(get_db), 
    current_librarian: tables.User = Depends(get_current_librarian_user)
):
    check_link_exists(video.link, db)

    new_video = tables.Video(**video.model_dump(), source=current_librarian.username)
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
    current_librarian: tables.User = Depends(get_current_librarian_user)
):
    book_query = db.query(tables.Book).filter(tables.Book.id == book_id)
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
    current_librarian: tables.User = Depends(get_current_librarian_user)
):
    video_query = db.query(tables.Video).filter(tables.Video.id == video_id)
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
    current_librarian: tables.User = Depends(get_current_librarian_user)
):
    db_book = db.query(tables.Book).filter(tables.Book.id == book_id).first()
    if not db_book:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Book not found")
    
    db.delete(db_book)
    db.commit()
    return StatusMessage(status="success", message="Book deleted successfully.")

@router.delete("/delete-video/{video_id}", response_model=StatusMessage)
def delete_video(
    video_id: int, 
    db: Session = Depends(get_db), 
    current_librarian: tables.User = Depends(get_current_librarian_user)
):
    db_video = db.query(tables.Video).filter(tables.Video.id == video_id).first()
    if not db_video:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Video not found")
        
    db.delete(db_video)
    db.commit()
    return StatusMessage(status="success", message="Video deleted successfully.")