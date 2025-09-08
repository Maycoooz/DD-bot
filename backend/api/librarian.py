# backend/api/routes.py
from fastapi import APIRouter, Depends, HTTPException, status
from sqlmodel import Session, select
from typing import List
from .. import models
from .. import database
from ..services.media_service import MediaService

router = APIRouter(
    prefix="/librarian",
    tags=["Librarian"]
)

@router.post("/add-book/")
def add_book(book: models.AddBook, session: Session = Depends(database.get_session)) -> models.SuccessMessage:

    media_service = MediaService(session)
    success = media_service.add_book(book)
    return success

