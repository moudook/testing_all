from pydantic import BaseModel, Field
from typing import Optional, Dict, Any
from datetime import datetime


# startups → only accepted applications, minimal doc
class Startup(BaseModel):
    id: str = Field(alias="_id")
    applicationId: str  # foreign-key style reference to applications._id
    companyName: str
    dateAccepted: datetime
    context: Optional[Dict[str, Any]] = None  # TODO: AI/Pathway pipeline context (embeddings, categorised schema)

    class Config:
        validate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }


class StartupCreate(BaseModel):
    applicationId: str
    companyName: str
    dateAccepted: datetime
    context: Optional[Dict[str, Any]] = None


class StartupUpdate(BaseModel):
    companyName: Optional[str] = None
    context: Optional[Dict[str, Any]] = None


