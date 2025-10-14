# In schemas/media.py
from pydantic import BaseModel, ConfigDict
from typing import Optional

# --- Book Schemas ---
class BookBase(BaseModel):
    title: str
    author: str
    link: str
    age_group: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None

class BookCreate(BookBase):
    pass

class BookUpdate(BaseModel):
    title: Optional[str] = None
    author: Optional[str] = None
    link: Optional[str] = None
    age_group: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    source: Optional[str] = None

class BookResponse(BookBase):
    id: int
    rating: float
    source: str 
    model_config = ConfigDict(from_attributes=True)

# --- Video Schemas ---
class VideoBase(BaseModel):
    title: str
    creator: str
    link: str
    age_group: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None

class VideoCreate(VideoBase):
    pass

class VideoUpdate(BaseModel):
    title: Optional[str] = None
    creator: Optional[str] = None
    link: Optional[str] = None
    age_group: Optional[str] = None
    category: Optional[str] = None
    description: Optional[str] = None
    source: Optional[str] = None

class VideoResponse(VideoBase):
    id: int
    rating: float
    source: str
    model_config = ConfigDict(from_attributes=True)