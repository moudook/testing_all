from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Literal, Dict, Any, List, Union
from datetime import datetime


# applications → full CRM & due-diligence storage
class Application(BaseModel):
    id: str = Field(alias="_id")

    # Core CRM fields
    companyName: str
    industry: Optional[str] = None
    location: Optional[str] = None
    founderName: Optional[str] = None
    founderContact: Optional[str] = None  # email or phone
    roundType: Optional[str] = None
    amountRaising: Optional[Union[str, float, int]] = None
    valuation: Optional[Union[str, float, int]] = None
    stage: Optional[str] = None
    dealLeadVCId: Optional[str] = None  # reference to VC user ID (no join)
    dateAdded: datetime
    source: Optional[str] = None
    description: Optional[str] = None
    pitchDeckPath: Optional[str] = None  # local file path; not binary
    keyInsight: Optional[str] = None
    reminders: Optional[Union[List[str], str]] = None
    dueDiligenceSummary: Optional[Dict[str, Any]] = None  # TODO: AI pipeline to populate structured categories

    # Workflow
    status: Literal["pending", "accepted", "rejected"] = "pending"

    # Timestamps
    createdAt: datetime
    updatedAt: datetime

    class Config:
        validate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat(),
        }


class ApplicationCreate(BaseModel):
    # Keep compatibility with earlier fields and accept new CRM fields.
    # On handler side, we will map these into the canonical Application schema.
    companyName: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    founderName: Optional[str] = None
    founderContact: Optional[str] = None
    roundType: Optional[str] = None
    amountRaising: Optional[Union[str, float, int]] = None
    valuation: Optional[Union[str, float, int]] = None
    stage: Optional[str] = None
    dealLeadVCId: Optional[str] = None
    source: Optional[str] = None
    description: Optional[str] = None
    pitchDeckPath: Optional[str] = None
    keyInsight: Optional[str] = None
    reminders: Optional[Union[List[str], str]] = None
    dueDiligenceSummary: Optional[Dict[str, Any]] = None

    # Legacy fields for backward compatibility (will be mapped)
    email: Optional[EmailStr] = None
    startupName: Optional[str] = None
    startupDescription: Optional[str] = None
    pitchDeckUrl: Optional[str] = None  # legacy; prefer pitchDeckPath
    videoUrl: Optional[str] = None


class ApplicationUpdate(BaseModel):
    companyName: Optional[str] = None
    industry: Optional[str] = None
    location: Optional[str] = None
    founderName: Optional[str] = None
    founderContact: Optional[str] = None
    roundType: Optional[str] = None
    amountRaising: Optional[Union[str, float, int]] = None
    valuation: Optional[Union[str, float, int]] = None
    stage: Optional[str] = None
    dealLeadVCId: Optional[str] = None
    source: Optional[str] = None
    description: Optional[str] = None
    pitchDeckPath: Optional[str] = None
    keyInsight: Optional[str] = None
    reminders: Optional[Union[List[str], str]] = None
    dueDiligenceSummary: Optional[Dict[str, Any]] = None
    status: Optional[Literal["pending", "accepted", "rejected"]] = None


