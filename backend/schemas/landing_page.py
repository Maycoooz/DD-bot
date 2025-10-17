from pydantic import BaseModel, ConfigDict
from typing import Optional

class LandingPageUpdate(BaseModel):
    title: Optional[str] = None
    display_text: str

class LandingPageResponse(LandingPageUpdate):
    id: int
    display_type: str
    grouping_key: Optional[str] = None
    
    model_config = ConfigDict(from_attributes=True)