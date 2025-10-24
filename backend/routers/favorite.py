# routers/favorite.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from models import tables

router = APIRouter(prefix="/favorite", tags=["Favorite"])

# --- Add a book to favorites ---
@router.post("/book/{child_id}/{book_id}")
def add_favorite_book(child_id: int, book_id: int, db: Session = Depends(get_db)):
    exists = db.query(tables.ChildFavoriteBook).filter_by(child_id=child_id, book_id=book_id).first()
    if exists:
        raise HTTPException(status_code=400, detail="Book already in favorites.")
    
    favorite = tables.ChildFavoriteBook(child_id=child_id, book_id=book_id)
    db.add(favorite)
    db.commit()
    return {"message": "Book added to favorites!"}

# --- Add a video to favorites ---
@router.post("/video/{child_id}/{video_id}")
def add_favorite_video(child_id: int, video_id: int, db: Session = Depends(get_db)):
    exists = db.query(tables.ChildFavoriteVideo).filter_by(child_id=child_id, video_id=video_id).first()
    if exists:
        raise HTTPException(status_code=400, detail="Video already in favorites.")
    
    favorite = tables.ChildFavoriteVideo(child_id=child_id, video_id=video_id)
    db.add(favorite)
    db.commit()
    return {"message": "Video added to favorites!"}


# --- Get all favorites (books + videos combined) ---
@router.get("/{child_id}")
def get_all_favorites(child_id: int, db: Session = Depends(get_db)):
    books = (
        db.query(tables.Book)
        .join(tables.ChildFavoriteBook, tables.Book.id == tables.ChildFavoriteBook.book_id)
        .filter(tables.ChildFavoriteBook.child_id == child_id)
        .all()
    )
    videos = (
        db.query(tables.Video)
        .join(tables.ChildFavoriteVideo, tables.Video.id == tables.ChildFavoriteVideo.video_id)
        .filter(tables.ChildFavoriteVideo.child_id == child_id)
        .all()
    )

    favorites = []
    for b in books:
        favorites.append({
            "id": b.id,
            "title": b.title,
            "link": b.link,
            "type": "Book"
        })
    for v in videos:
        favorites.append({
            "id": v.id,
            "title": v.title,
            "link": v.link,
            "type": "Video"
        })
    return favorites


# --- Delete a favorite ---
@router.delete("/{child_id}/{fav_type}/{fav_id}")
def delete_favorite(child_id: int, fav_type: str, fav_id: int, db: Session = Depends(get_db)):
    if fav_type == "book":
        fav = db.query(tables.ChildFavoriteBook).filter_by(child_id=child_id, book_id=fav_id).first()
    elif fav_type == "video":
        fav = db.query(tables.ChildFavoriteVideo).filter_by(child_id=child_id, video_id=fav_id).first()
    else:
        raise HTTPException(status_code=400, detail="Invalid type")

    if not fav:
        raise HTTPException(status_code=404, detail="Favorite not found")

    db.delete(fav)
    db.commit()
    return {"message": "Favorite removed"}
