#router/statistics.py
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from db.database import get_db
from models import tables

router = APIRouter(prefix="/parent", tags=["Parent Statistics"])

@router.get("/{parent_id}/statistics")
def get_parent_statistics(parent_id: int, db: Session = Depends(get_db)):
    # Count children
    children = db.query(tables.User).filter_by(parent_id=parent_id, role="child").all()
    num_children = len(children)

    # Count total favorites across all children
    total_fav_books = 0
    total_fav_videos = 0

    for child in children:
        fav_books = db.query(tables.ChildFavoriteBook).filter_by(child_id=child.id).count()
        fav_videos = db.query(tables.ChildFavoriteVideo).filter_by(child_id=child.id).count()
        total_fav_books += fav_books
        total_fav_videos += fav_videos

    return {
        "parent_id": parent_id,
        "num_children": num_children,
        "total_fav_books": total_fav_books,
        "total_fav_videos": total_fav_videos
    }
