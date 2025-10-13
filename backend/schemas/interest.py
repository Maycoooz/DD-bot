from typing import List, Optional, Dict
from datetime import date
from pydantic import BaseModel, ConfigDict

class InterestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    name: str