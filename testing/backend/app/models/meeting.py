from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime


class TranscriptChunk(BaseModel):
    timestamp: float  # seconds since epoch
    speaker: Optional[str] = None
    text: str


class Meeting(BaseModel):
    id: str = Field(alias="_id")
    vc_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    status: str = "in_progress"  # in_progress | completed | canceled
    transcript: List[TranscriptChunk] = []
    summary: Optional[str] = None
    vc_notes: Optional[str] = None

    class Config:
        validate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }


class MeetingCreationData(BaseModel):
    vc_id: str

class MeetingMiniData(BaseModel):
    id: str = Field(alias="_id")
    vc_id: str
    start_time: datetime
    end_time: Optional[datetime] = None
    status: str = "in_progress"  # in_progress | completed | canceled

    class Config:
        validate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }