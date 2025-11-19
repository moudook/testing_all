import datetime
import uuid
from typing import Optional, List

from pymongo import AsyncMongoClient
import os
import logging

from ..models.meeting import MeetingCreationData, Meeting, MeetingMiniData

class MeetingHandler:
    def __init__(self):
        # Loading Configuration
        self.logger = logging.getLogger("MeetingHandler")
        self.uri = os.getenv("MONGO_URI")
        self.db_name = os.getenv("MONGO_DB_NAME")
        self.meeting_collection_name = os.getenv("MEETING_COLLECTION_NAME", "meetings")


        # Error handling for missing configuration
        if self.uri is None or self.db_name is None:
            self.logger.error("Configration error: MONGO_URI or MONGO_DB_NAME not set.")
            raise ValueError("Environment variables MONGO_URI and MONGO_DB_NAME must be set.")

        self.logger.debug(f"MongoDB URI: {self.uri}, Database: {self.db_name}")

        # Initialize MongoDB Client
        self.client = AsyncMongoClient(self.uri)
        self.db = self.client[self.db_name]
        self.meetings_collection = self.db[self.meeting_collection_name]

        self.logger.info("MongoDB client initialized successfully.")
        self.logger.debug(f"Meeting collection: {self.meeting_collection_name}")

    async def create_meeting(self, meeting_data: MeetingCreationData) -> Optional[Meeting]:
        try:
            self.logger.debug(f"Creating meeting with data: {meeting_data}")

            # Generate new meeting object
            new_meeting = Meeting(
                _id=str(uuid.uuid4()), # generate UUID
                vc_id=meeting_data.vc_id,  # set VC ID
                start_time=datetime.datetime.now(datetime.timezone.utc),  # set start time (timezone-aware UTC)
                transcript=[],  # start empty
                status="in_progress"  # initial status
            )

            # Insert into MongoDB
            await self.meetings_collection.insert_one(new_meeting.model_dump(by_alias=True))
            self.logger.info(f"Meeting created with ID: {new_meeting.id} with VC ID: {new_meeting.vc_id}")
            return new_meeting

        except Exception as e:
            self.logger.error(f"Failed to create meeting: {e}", exc_info=True)
            return None

    async def get_meeting_by_id(self, meeting_id: str) -> Optional[Meeting]:
        try:
            self.logger.debug(f"Fetching meeting with ID: {meeting_id}")

            # Query MongoDB
            meeting_data = await self.meetings_collection.find_one({"_id": meeting_id})

            if meeting_data:
                self.logger.info(f"Meeting found with ID: {meeting_id}")
                return Meeting.model_validate(meeting_data)
            else:
                self.logger.warning(f"No meeting found with ID: {meeting_id}")
                return None

        except Exception as e:
            self.logger.error(f"Failed to fetch meeting: {e}", exc_info=True)
            return None

    async def get_meetings_by_vc_id(self, vc_id: str) -> List[MeetingMiniData]:
        try:
            self.logger.debug(f"Fetching meetings for VC ID: {vc_id}")

            # Query MongoDB for all meetings of this VC
            meetings_cursor = self.meetings_collection.find(
                {"vc_id": vc_id},
                {"_id": 1, "vc_id": 1, "start_time": 1, "end_time": 1, "status": 1}  # only fetch minimal fields
            )

            meetings = []
            async for meeting_data in meetings_cursor:
                meetings.append(MeetingMiniData.model_validate(meeting_data))

            self.logger.info(f"Fetched {len(meetings)} meetings for VC ID: {vc_id}")
            return meetings

        except Exception as e:
            self.logger.error(f"Failed to fetch meetings for VC ID {vc_id}: {e}", exc_info=True)
            return []

    async def update_meeting(self, meeting: Meeting) -> bool:
        try:
            self.logger.debug(f"Updating meeting with ID: {meeting.id}")

            # Update MongoDB
            result = await self.meetings_collection.replace_one(
                {"_id": meeting.id},
                meeting.model_dump(by_alias=True)
            )
            if result.modified_count == 1:
                self.logger.info(f"Meeting updated with ID: {meeting.id}")
                return True
            else:
                self.logger.warning(f"No meeting updated with ID: {meeting.id}")
                return False

        except Exception as e:
            self.logger.error(f"Failed to update meeting: {e}", exc_info=True)
            return False

    async def delete_meeting(self, meeting: Meeting) -> bool:
        try:
            self.logger.debug(f"Deleting meeting with ID: {meeting.id}")

            # Delete from MongoDB
            result = await self.meetings_collection.delete_one({"_id": meeting.id})
            if result.deleted_count == 1:
                self.logger.info(f"Meeting deleted with ID: {meeting.id}")
                return True
            else:
                self.logger.warning(f"No meeting deleted with ID: {meeting.id}")
                return False

        except Exception as e:
            self.logger.error(f"Failed to delete meeting: {e}", exc_info=True)
            return False

    async def get_all_meetings(self) -> List[MeetingMiniData]:
        try:
            self.logger.debug("Fetching all meetings base info.")

            meetings_cursor = self.meetings_collection.find({}, {"_id": 1, "vc_id": 1, "start_time": 1, "end_time": 1, "status": 1})
            meetings = []
            async for meeting_data in meetings_cursor:
                meetings.append(MeetingMiniData.model_validate(meeting_data))

            self.logger.info(f"Fetched {len(meetings)} meetings.")
            return meetings

        except Exception as e:
            self.logger.error(f"Failed to fetch meetings: {e}", exc_info=True)
            return []


