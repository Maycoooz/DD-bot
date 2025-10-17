from pydantic import BaseModel, ConfigDict
from typing import Optional

class LandingPageCreate(BaseModel):
    display_type: str
    display_text: str
    grouping_key: Optional[str] = None
    title: Optional[str] = None

class LandingPageUpdate(BaseModel):
    title: Optional[str] = None
    display_text: str

class LandingPageResponse(BaseModel):
    id: int
    display_type: str
    title: Optional[str] = None
    display_text: str
    grouping_key: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)