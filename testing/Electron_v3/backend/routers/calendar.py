from fastapi import APIRouter, HTTPException
from models import Meeting
from typing import List
from database import db
from bson import ObjectId

router = APIRouter(prefix="/calendar", tags=["calendar"])

def fix_id(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
    return doc

@router.get("/", response_model=List[Meeting])
async def get_meetings():
    meetings = []
    async for meeting in db.meetings.find():
        meetings.append(fix_id(meeting))
    return meetings

@router.post("/", response_model=Meeting)
async def create_meeting(meeting: Meeting):
    meeting_dict = meeting.dict(exclude={"id"})
    new_meeting = await db.meetings.insert_one(meeting_dict)
    created_meeting = await db.meetings.find_one({"_id": new_meeting.inserted_id})
    return fix_id(created_meeting)
