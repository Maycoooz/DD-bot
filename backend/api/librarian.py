# backend/api/routes.py
from fastapi import APIRouter, Depends, Query
from sqlmodel import Session, select
from typing import List, Optional
from .. import models
from .. import database
from ..services.media_service import MediaService

router = APIRouter(
    prefix="/librarian",
    tags=["Librarian"]
)


# Books ------------------------------------------------------------------------------------------
@router.post("/add-book/", response_model=models.SuccessMessage)
def add_book(book: models.AddBook, session: Session = Depends(database.get_session)):

    media_service = MediaService(session)
    success_message = media_service.add_book(book)
    return success_message

@router.get("/search-books/", response_model=List[models.Books])
def search_books(
    search: Optional[str] = None, # The search term is optional
    limit: int = Query(default=20, le=20),
    offset: int = Query(default=0, ge=0),
    session: Session = Depends(database.get_session)
):
    media_service = MediaService(session)
    books = media_service.search_books(
        search_term=search,
        limit=limit,
        offset=offset
    )
    return books

@router.patch("/update-book/", response_model=models.SuccessMessage)
def update_book(book_data: models.UpdateBook, session: Session = Depends(database.get_session)):

    media_service = MediaService(session)
    success_message = media_service.update_book(book_data)
    return success_message

@router.delete("/delete-book/", response_model=models.SuccessMessage)
def delete_book(book_id: int, session: Session = Depends(database.get_session)):

    media_service = MediaService(session)
    success_message = media_service.delete_book(book_id)
    return success_message

# Videos ----------------------------------------------------------------------------------------------

@router.post("/add-video/", response_model=models.SuccessMessage)
def add_book(video: models.AddVideo, session: Session = Depends(database.get_session)):

    media_service = MediaService(session)
    success_message = media_service.add_video(video)
    return success_message

@router.get("/search-videos/", response_model=List[models.Videos])
def search_videos(
    search: Optional[str] = None, # The search term is optional
    limit: int = Query(default=20, le=20),
    offset: int = Query(default=0, ge=0),
    session: Session = Depends(database.get_session)
):
    media_service = MediaService(session)
    videos = media_service.search_videos(
        search_term=search,
        limit=limit,
        offset=offset
    )
    return videos

@router.patch("/update-video/", response_model=models.SuccessMessage)
def update_book(video_data: models.UpdateVideo, session: Session = Depends(database.get_session)):

    media_service = MediaService(session)
    success_message = media_service.update_video(video_data)
    return success_message

@router.delete("/delete-video/", response_model=models.SuccessMessage)
def delete_book(video_id: int, session: Session = Depends(database.get_session)):

    media_service = MediaService(session)
    success_message = media_service.delete_video(video_id)
    return success_message






