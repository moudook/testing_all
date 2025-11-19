from fastapi import APIRouter, Body, HTTPException
from models import Startup
from typing import List
from database import db
from bson import ObjectId

router = APIRouter(prefix="/startups", tags=["startups"])

def fix_id(doc):
    if doc and "_id" in doc:
        doc["id"] = str(doc["_id"])
    return doc

@router.get("/", response_model=List[Startup])
async def get_startups():
    startups = []
    async for startup in db.startups.find():
        startups.append(fix_id(startup))
    return startups

@router.post("/", response_model=Startup)
async def create_startup(startup: Startup):
    startup_dict = startup.dict(exclude={"id"})
    new_startup = await db.startups.insert_one(startup_dict)
    created_startup = await db.startups.find_one({"_id": new_startup.inserted_id})
    return fix_id(created_startup)

@router.put("/{startup_id}", response_model=Startup)
async def update_startup(startup_id: str, startup: Startup):
    startup_dict = startup.dict(exclude={"id"})
    result = await db.startups.update_one({"_id": ObjectId(startup_id)}, {"$set": startup_dict})
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Startup not found")
    updated_startup = await db.startups.find_one({"_id": ObjectId(startup_id)})
    return fix_id(updated_startup)

@router.delete("/{startup_id}")
async def delete_startup(startup_id: str):
    result = await db.startups.delete_one({"_id": ObjectId(startup_id)})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Startup not found")
    return {"status": "ok"}
