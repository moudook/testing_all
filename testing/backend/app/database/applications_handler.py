import os
import logging
import datetime
import uuid
from typing import Optional, List, Tuple

from pymongo import AsyncMongoClient, ReturnDocument
from pymongo.client_session import ClientSession
from pymongo.errors import PyMongoError

from ..models.application_model import (
    ApplicationCreate,
    ApplicationUpdate,
    Application,
)
from ..models.startup_model import Startup


class ApplicationsHandler:
    def __init__(self):
        self.logger = logging.getLogger("ApplicationsHandler")
        self.uri = os.getenv("MONGO_URI")
        self.db_name = os.getenv("MONGO_DB_NAME")
        self.applications_collection_name = os.getenv("APPLICATIONS_COLLECTION_NAME", "applications")
        self.startups_collection_name = os.getenv("STARTUPS_COLLECTION_NAME", "startups")

        if self.uri is None or self.db_name is None:
            self.logger.error("Configuration error: MONGO_URI or MONGO_DB_NAME not set.")
            raise ValueError("Environment variables MONGO_URI and MONGO_DB_NAME must be set.")

        self.client = AsyncMongoClient(self.uri)
        self.db = self.client[self.db_name]
        self.applications_collection = self.db[self.applications_collection_name]
        self.startups_collection = self.db[self.startups_collection_name]

    async def create_application(self, data: ApplicationCreate) -> Optional[Application]:
        try:
            now = datetime.datetime.now(datetime.timezone.utc)
            # Map legacy fields to new schema where present
            company_name = data.companyName or data.startupName or ""
            description = data.description or data.startupDescription
            founder_contact = data.founderContact or (data.email if hasattr(data, "email") else None)

            new_app = Application(
                _id=str(uuid.uuid4()),
                companyName=company_name,
                industry=data.industry,
                location=data.location,
                founderName=data.founderName,
                founderContact=founder_contact,
                roundType=data.roundType,
                amountRaising=data.amountRaising,
                valuation=data.valuation,
                stage=data.stage,
                dealLeadVCId=data.dealLeadVCId,
                dateAdded=now,
                source=data.source,
                description=description,
                pitchDeckPath=data.pitchDeckPath or None,
                keyInsight=data.keyInsight,
                reminders=data.reminders,
                dueDiligenceSummary=data.dueDiligenceSummary,
                status="pending",
                createdAt=now,
                updatedAt=now,
            )
            await self.applications_collection.insert_one(new_app.model_dump(by_alias=True))
            return new_app
        except Exception as e:
            self.logger.error(f"Failed to create application: {e}", exc_info=True)
            return None

    async def get_application_by_id(self, application_id: str) -> Optional[Application]:
        try:
            doc = await self.applications_collection.find_one({"_id": application_id})
            if doc:
                return Application.model_validate(doc)
            return None
        except Exception as e:
            self.logger.error(f"Failed to fetch application: {e}", exc_info=True)
            return None

    async def get_all_applications(self) -> Optional[List[Application]]:
        try:
            cursor = self.applications_collection.find({})
            results = [Application.model_validate(doc) async for doc in cursor]
            return results
        except Exception as e:
            self.logger.error(f"Failed to fetch applications: {e}", exc_info=True)
            return None

    async def get_pending_applications(self) -> Optional[List[Application]]:
        try:
            cursor = self.applications_collection.find({"status": "pending"})
            results = [Application.model_validate(doc) async for doc in cursor]
            return results
        except Exception as e:
            self.logger.error(f"Failed to fetch pending applications: {e}", exc_info=True)
            return None

    async def update_application(self, application_id: str, data: ApplicationUpdate) -> Optional[Application]:
        try:
            payload = {k: v for k, v in data.model_dump(exclude_unset=True).items() if v is not None}
            if not payload:
                return await self.get_application_by_id(application_id)
            payload["updatedAt"] = datetime.datetime.now(datetime.timezone.utc)
            updated = await self.applications_collection.find_one_and_update(
                {"_id": application_id},
                {"$set": payload},
                return_document=ReturnDocument.AFTER,
            )
            if updated:
                return Application.model_validate(updated)
            return None
        except Exception as e:
            self.logger.error(f"Failed to update application: {e}", exc_info=True)
            return None

    async def delete_application(self, application_id: str) -> bool:
        try:
            result = await self.applications_collection.delete_one({"_id": application_id})
            return result.deleted_count == 1
        except Exception as e:
            self.logger.error(f"Failed to delete application: {e}", exc_info=True)
            return False

    async def _accept_flow(self, application_id: str, session: Optional[ClientSession]) -> Tuple[Optional[Application], Optional[Startup]]:
        now = datetime.datetime.now(datetime.timezone.utc)
        # Only transition from pending -> accepted
        filter_query = {"_id": application_id, "status": "pending"}
        update_query = {"$set": {"status": "accepted", "updatedAt": now}}

        updated = await self.applications_collection.find_one_and_update(
            filter_query,
            update_query,
            return_document=ReturnDocument.AFTER,
            session=session,
        )
        if not updated:
            return None, None

        accepted_application = Application.model_validate(updated)
        # Create Startup with minimal validated info and reference application
        # startups → only accepted applications, minimal doc
        startup_doc = Startup(
            _id=str(uuid.uuid4()),
            applicationId=accepted_application.id,
            companyName=accepted_application.companyName,
            dateAccepted=now,
            context=None,  # TODO: AI/Pathway pipeline enrichment hooks
        )
        await self.startups_collection.insert_one(startup_doc.model_dump(by_alias=True), session=session)
        return accepted_application, startup_doc

    async def accept_application(self, application_id: str) -> Tuple[Optional[Application], Optional[Startup]]:
        """
        Atomically set status=accepted and insert startup referencing this application.
        Uses MongoDB transactions when available; falls back to best-effort if not supported.
        """
        try:
            async with await self.client.start_session() as session:
                try:
                    async with session.start_transaction():
                        return await self._accept_flow(application_id, session)
                except PyMongoError:
                    self.logger.warning("Transaction failed or unsupported; attempting non-transactional accept.", exc_info=True)
                    # Fallback: try without transaction; may be non-atomic in standalone deployments
                    return await self._accept_flow(application_id, None)
        except Exception as e:
            self.logger.error(f"Failed to accept application: {e}", exc_info=True)
            return None, None

    async def reject_application(self, application_id: str) -> Optional[Application]:
        try:
            now = datetime.datetime.now(datetime.timezone.utc)
            updated = await self.applications_collection.find_one_and_update(
                {"_id": application_id, "status": {"$ne": "rejected"}},
                {"$set": {"status": "rejected", "updatedAt": now}},
                return_document=ReturnDocument.AFTER,
            )
            return Application.model_validate(updated) if updated else None
        except Exception as e:
            self.logger.error(f"Failed to reject application: {e}", exc_info=True)
            return None


