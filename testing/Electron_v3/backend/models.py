from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime

class Startup(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    name: str
    logo: Optional[str] = None
    description: Optional[str] = None
    fundingStage: str = "Seed"
    website: Optional[str] = None
    pdfs: List[dict] = []
    teamInfo: Optional[str] = None
    marketCategory: Optional[str] = None
    vcNotes: Optional[str] = None
    status: str = "researching"

class Meeting(BaseModel):
    id: Optional[str] = Field(None, alias="_id")
    title: str
    date: datetime
    notes: Optional[str] = None
    linkedRecordingId: Optional[str] = None
