from typing import List, Optional, Dict
from datetime import date
from pydantic import BaseModel, ConfigDict
from schemas.media import BookResponse, VideoResponse

class LibrarianRegistrationRequest(BaseModel):
    username: str
    first_name: str
    last_name: str
    email: str
    password: str
    country: str
    gender: str
    birthday: date
    race: str

class LibrarianRegistrationResponse(BaseModel):
    id: int # user id
    username: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    country: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[date] = None
    race: Optional[str] = None
    
class LibrarianResponse(BaseModel):
    id: int # user id
    username: str
    first_name: str
    last_name: str
    email: Optional[str] = None
    country: Optional[str] = None
    gender: Optional[str] = None
    birthday: Optional[date] = None
    race: Optional[str] = None
    is_verified: bool
    librarian_verified: bool
    
    model_config = ConfigDict(from_attributes=True)