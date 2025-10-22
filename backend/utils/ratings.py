from sqlalchemy import func
from sqlalchemy.orm import Session
from models.tables import Book, Review, ReviewType, Video 

def recompute_book_rating(db: Session, book_id: int) -> float:
    """Recalculate and persist the average rating for a Book."""
    avg = (
        db.query(func.coalesce(func.avg(Review.stars), 0.0))
        .filter(
            Review.review_type == ReviewType.BOOK,
            Review.reviewable_id == book_id,
        )
        .scalar()
    )

    # round to 1 decimal (tweak to your taste)
    avg = float(round(avg or 0.0, 1))

    db.query(Book).filter(Book.id == book_id).update({Book.rating: avg})
    db.commit()
    return avg

def recompute_video_rating(db: Session, video_id: int) -> float:
    """Recalculate and persist the average rating for a Vid."""
    avg = (
        db.query(func.coalesce(func.avg(Review.stars), 0.0))
        .filter(
            Review.review_type == ReviewType.VIDEO,
            Review.reviewable_id == video_id,
        )
        .scalar()
    )

    # round to 1 decimal (tweak to your taste)
    avg = float(round(avg or 0.0, 1))

    db.query(Video).filter(Video.id == video_id).update({Video.rating: avg})
    db.commit()
    return avg