from fastapi import FastAPI
import uvicorn
import asyncio

from .pathway_pipeline.consumer import start_consumer
from .config.configloader import load_config
load_config(".env")

from .routers.meetingRouter import router as meeting_router
from .routers.applications_router import router as applications_router
from .routers.startups_router import router as startups_router
import os
import logging

logger = logging.getLogger(__name__)
app = FastAPI()
app.include_router(meeting_router, tags=["Meetings"])
app.include_router(applications_router, tags=["Applications"])
app.include_router(startups_router, tags=["Startups"])

@app.get("/")
async def read_root():
    logger.debug("Root endpoint hit.")
    return {"Hello": "World"}

@app.on_event("startup")
async def start_pathway_consumer():
    loop = asyncio.get_event_loop()
    loop.run_in_executor(None, start_consumer)

if __name__ == "__main__":
    host = "0.0.0.0"
    port = 8000
    logger.info(f"Starting FastAPI server on {host}:{port}")
    uvicorn.run(app, host=host, port=port)

