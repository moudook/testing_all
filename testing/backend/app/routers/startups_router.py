import logging
import os

from fastapi import APIRouter, Depends, HTTPException, status, Header

from ..models.startup_model import StartupCreate, StartupUpdate
from ..database.startups_handler import StartupsHandler

router = APIRouter(
    prefix="/api/startups",
)

startups_handler = StartupsHandler()
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")
logger = logging.getLogger(__name__)


async def verify_internal_api_key(x_api_key: str = Header(...)):
    if x_api_key != INTERNAL_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key"
        )


@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_startup_endpoint(
    data: StartupCreate,
    _: None = Depends(verify_internal_api_key)
):
    new_startup = await startups_handler.create_startup(data)
    if not new_startup:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create startup"
        )
    return {"startup_id": new_startup.id}


@router.get("/fetch/{startup_id}")
async def get_startup_endpoint(
    startup_id: str,
    _: None = Depends(verify_internal_api_key)
):
    st = await startups_handler.get_startup_by_id(startup_id)
    if st is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup not found"
        )
    return {"status": "success", "data": st}


@router.get("/fetch/all")
async def get_all_startups_endpoint(
    _: None = Depends(verify_internal_api_key)
):
    sts = await startups_handler.get_all_startups()
    if sts is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No startups found"
        )
    return {"status": "success", "data": sts}


@router.put("/update/{startup_id}")
async def update_startup_endpoint(
    startup_id: str,
    data: StartupUpdate,
    _: None = Depends(verify_internal_api_key)
):
    updated = await startups_handler.update_startup(startup_id, data)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup not found"
        )
    return {"status": "success", "message": "Startup updated successfully"}


@router.delete("/delete/{startup_id}")
async def delete_startup_endpoint(
    startup_id: str,
    _: None = Depends(verify_internal_api_key)
):
    ok = await startups_handler.delete_startup(startup_id)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Startup not found"
        )
    return {"status": "success", "message": "Startup deleted successfully"}


