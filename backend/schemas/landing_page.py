from pydantic import BaseModel, ConfigDict

class LandingPageUpdate(BaseModel):
    display_text: str
    
class LandingPageResponse(LandingPageUpdate):
    id: int
    display_type: str
    
    model_config = ConfigDict(from_attributes=True)