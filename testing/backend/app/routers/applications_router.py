import logging
import os
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException, status, Header

from ..models.application_model import ApplicationCreate, ApplicationUpdate
from ..database.applications_handler import ApplicationsHandler

router = APIRouter(
    prefix="/api/applications",
)

applications_handler = ApplicationsHandler()
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")
logger = logging.getLogger(__name__)


async def verify_internal_api_key(x_api_key: str = Header(...)):
    if x_api_key != INTERNAL_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key"
        )


@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_application_endpoint(
    data: ApplicationCreate,
    _: None = Depends(verify_internal_api_key)
):
    new_app = await applications_handler.create_application(data)
    if not new_app:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create application"
        )
    return {"application_id": new_app.id}


@router.get("/fetch/{application_id}")
async def get_application_endpoint(
    application_id: str,
    _: None = Depends(verify_internal_api_key)
):
    app = await applications_handler.get_application_by_id(application_id)
    if app is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    return {"status": "success", "data": app}


@router.get("/fetch/all")
async def get_all_applications_endpoint(
    _: None = Depends(verify_internal_api_key)
):
    apps = await applications_handler.get_all_applications()
    if apps is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No applications found"
        )
    return {"status": "success", "data": apps}


@router.get("/fetch/pending")
async def get_pending_applications_endpoint(
    _: None = Depends(verify_internal_api_key)
):
    apps = await applications_handler.get_pending_applications()
    if apps is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No pending applications found"
        )
    return {"status": "success", "data": apps}


@router.put("/update/{application_id}")
async def update_application_endpoint(
    application_id: str,
    data: ApplicationUpdate,
    _: None = Depends(verify_internal_api_key)
):
    updated = await applications_handler.update_application(application_id, data)
    if not updated:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    return {"status": "success", "message": "Application updated successfully"}


@router.delete("/delete/{application_id}")
async def delete_application_endpoint(
    application_id: str,
    _: None = Depends(verify_internal_api_key)
):
    ok = await applications_handler.delete_application(application_id)
    if not ok:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Application not found"
        )
    return {"status": "success", "message": "Application deleted successfully"}


@router.post("/accept/{application_id}")
async def accept_application_endpoint(
    application_id: str,
    _: None = Depends(verify_internal_api_key)
):
    application, startup = await applications_handler.accept_application(application_id)
    if application is None or startup is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application not in pending state or operation failed"
        )
    return {
        "status": "success",
        "message": "Application accepted and startup created",
        "data": {
            "application_id": application.id,
            "startup_id": startup.id
        }
    }


@router.post("/reject/{application_id}")
async def reject_application_endpoint(
    application_id: str,
    _: None = Depends(verify_internal_api_key)
):
    app = await applications_handler.reject_application(application_id)
    if app is None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Application not found or already rejected"
        )
    return {"status": "success", "message": "Application rejected"}


