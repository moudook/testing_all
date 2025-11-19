import os
import logging
import datetime
import uuid
from typing import Optional, List

from pymongo import AsyncMongoClient, ReturnDocument

from ..models.startup_model import Startup, StartupCreate, StartupUpdate


class StartupsHandler:
    def __init__(self):
        self.logger = logging.getLogger("StartupsHandler")
        self.uri = os.getenv("MONGO_URI")
        self.db_name = os.getenv("MONGO_DB_NAME")
        self.startups_collection_name = os.getenv("STARTUPS_COLLECTION_NAME", "startups")

        if self.uri is None or self.db_name is None:
            self.logger.error("Configuration error: MONGO_URI or MONGO_DB_NAME not set.")
            raise ValueError("Environment variables MONGO_URI and MONGO_DB_NAME must be set.")

        self.client = AsyncMongoClient(self.uri)
        self.db = self.client[self.db_name]
        self.startups_collection = self.db[self.startups_collection_name]

    async def create_startup(self, data: StartupCreate) -> Optional[Startup]:
        try:
            now = datetime.datetime.now(datetime.timezone.utc)
            new_startup = Startup(
                _id=str(uuid.uuid4()),
                applicationId=data.applicationId,
                companyName=data.companyName,
                dateAccepted=data.dateAccepted if data.dateAccepted else now,
                context=data.context,  # TODO: AI/Pathway pipeline enrichment
            )
            await self.startups_collection.insert_one(new_startup.model_dump(by_alias=True))
            return new_startup
        except Exception as e:
            self.logger.error(f"Failed to create startup: {e}", exc_info=True)
            return None

    async def get_startup_by_id(self, startup_id: str) -> Optional[Startup]:
        try:
            doc = await self.startups_collection.find_one({"_id": startup_id})
            return Startup.model_validate(doc) if doc else None
        except Exception as e:
            self.logger.error(f"Failed to fetch startup: {e}", exc_info=True)
            return None

    async def get_all_startups(self) -> Optional[List[Startup]]:
        try:
            cursor = self.startups_collection.find({})
            return [Startup.model_validate(doc) async for doc in cursor]
        except Exception as e:
            self.logger.error(f"Failed to fetch startups: {e}", exc_info=True)
            return None

    async def update_startup(self, startup_id: str, data: StartupUpdate) -> Optional[Startup]:
        try:
            payload = {k: v for k, v in data.model_dump(exclude_unset=True).items()}
            if not payload:
                return await self.get_startup_by_id(startup_id)
            updated = await self.startups_collection.find_one_and_update(
                {"_id": startup_id},
                {"$set": payload},
                return_document=ReturnDocument.AFTER,
            )
            return Startup.model_validate(updated) if updated else None
        except Exception as e:
            self.logger.error(f"Failed to update startup: {e}", exc_info=True)
            return None

    async def delete_startup(self, startup_id: str) -> bool:
        try:
            result = await self.startups_collection.delete_one({"_id": startup_id})
            return result.deleted_count == 1
        except Exception as e:
            self.logger.error(f"Failed to delete startup: {e}", exc_info=True)
            return False


