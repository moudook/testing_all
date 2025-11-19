from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import stream, startups, calendar
from database import client

app = FastAPI()

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Routers
app.include_router(stream.router)
app.include_router(startups.router)
app.include_router(calendar.router)

@app.on_event("startup")
async def startup_db_client():
    print("Connected to MongoDB")

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()

@app.get("/")
async def root():
    return {"message": "VC Intelligence Backend Running"}
