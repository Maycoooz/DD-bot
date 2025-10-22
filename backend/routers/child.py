from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from db.database import get_db
from models import tables
from pydantic import BaseModel
from typing import List

router = APIRouter(prefix="/child", tags=["Child"])

# --- Response model ---
class InterestResponse(BaseModel):
    id: int
    name: str

    class Config:
        orm_mode = True
    @classmethod
    def from_orm(cls, obj):
        return cls(id=obj.id, name=str(obj.name))
# --- Request model ---
class InterestUpdateRequest(BaseModel):
    interests: List[str]

# --- GET: fetch child's interests ---
@router.get("/{child_id}/interests", response_model=List[InterestResponse])
def get_child_interests(child_id: int, db: Session = Depends(get_db)):
    # Fetch child with preloaded interests
    child = db.query(tables.User).options(joinedload(tables.User.interests)).filter(
        tables.User.id == child_id, tables.User.role_id == 3
    ).first()

    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    return [{"id": i.id, "name": i.name.value if hasattr(i.name, "value") else str(i.name)} 
            for i in child.interests]


# --- PUT: update child's interests ---
@router.put("/{child_id}/interests")
def update_child_interests(child_id: int, data: InterestUpdateRequest, db: Session = Depends(get_db)):
    child = db.query(tables.User).filter(
        tables.User.id == child_id, tables.User.role_id == 3
    ).first()

    if not child:
        raise HTTPException(status_code=404, detail="Child not found")

    # Query Interest objects by name
    interests_from_db = db.query(tables.Interest).filter(
        tables.Interest.name.in_(data.interests)
    ).all()

    # Validate all provided names exist
    if len(interests_from_db) != len(set(data.interests)):
        raise HTTPException(status_code=404, detail="Some interests are invalid.")

    # Assign many-to-many relationship
    child.interests = interests_from_db
    db.commit()
    db.refresh(child)

    return {"message": "✅ Interests updated successfully"}
