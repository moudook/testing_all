import logging

from fastapi import APIRouter, Depends, HTTPException, status, Header, WebSocket, WebSocketDisconnect
import os
from ..models.meeting import MeetingCreationData
from ..database.meetingHandler import MeetingHandler
import asyncio
import json
from ..models.meeting import TranscriptChunk

router = APIRouter(
    prefix="/api/meetings",
)

meeting_handler = MeetingHandler()
INTERNAL_API_KEY = os.getenv("INTERNAL_API_KEY")
logger = logging.getLogger(__name__)


# Dependency to check internal API key
async def verify_internal_api_key(x_api_key: str = Header(...)):
    if x_api_key != INTERNAL_API_KEY:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or missing API key"
        )


@router.post("/create", status_code=status.HTTP_201_CREATED)
async def create_meeting_endpoint(
        meeting_data: MeetingCreationData,
        _: None = Depends(verify_internal_api_key)  # enforce API key
):
    """
    Create a new meeting for a VC.
    Requires INTERNAL_API_KEY in the request header: `x-api-key`.
    Returns the created meeting's ID.
    """
    new_meeting = await meeting_handler.create_meeting(meeting_data)

    if not new_meeting:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create meeting"
        )

    return {"meeting_id": new_meeting.id, "vc_id": new_meeting.vc_id}

@router.get("/fetch/{meeting_id}")
async def get_meeting_endpoint(
        meeting_id: str,
        _: None = Depends(verify_internal_api_key)
):

    output = await meeting_handler.get_meeting_by_id(meeting_id)

    if output is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )

    return {"status": "success", "data": output}



# Placeholder ASR
async def process_audio_chunk(chunk: bytes) -> str:
    await asyncio.sleep(0.05)  # simulate processing delay
    return "transcribed text from audio chunk"

# Placeholder chatbot
async def process_chat_query(text: str) -> str:
    await asyncio.sleep(0.05)
    return f"Chatbot reply to '{text}'"


@router.websocket("/ws/{meeting_id}")
async def meeting_ws(
    ws: WebSocket,
    meeting_id: str,
    x_api_key: str
):
    # Auth check
    if x_api_key != INTERNAL_API_KEY:
        await ws.close(code=1008)
        return

    await ws.accept()
    print(f"Client connected for meeting {meeting_id}")

    send_queue = asyncio.Queue()

    async def backend_push_task():
        while True:
            msg = await send_queue.get()
            await ws.send_json(msg)

    push_task = asyncio.create_task(backend_push_task())

    try:
        while True:
            message = await ws.receive()

            if "text" in message:
                try:
                    payload = json.loads(message["text"])
                    msg_type = payload.get("type")
                    data = payload.get("data")

                    if msg_type == "control":
                        await send_queue.put({
                            "type": "control_ack",
                            "data": {"status": "ok", "received": data}
                        })

                    elif msg_type == "chat":
                        reply = await process_chat_query(data)
                        await send_queue.put({
                            "type": "chat_response",
                            "data": reply
                        })

                    else:
                        await send_queue.put({"type": "error", "data": "Unknown text message type"})
                except json.JSONDecodeError:
                    await send_queue.put({"type": "error", "data": "Invalid JSON"})

            elif "bytes" in message:
                audio_chunk = message["bytes"]
                transcript_text = await process_audio_chunk(audio_chunk)

                # Save transcript to MongoDB
                transcript_obj = TranscriptChunk(
                    timestamp=asyncio.get_event_loop().time(),
                    text=transcript_text
                )
                await meeting_handler.meetings_collection.update_one(
                    {"_id": meeting_id},
                    {"$push": {"transcript": transcript_obj.model_dump()}}
                )

                await send_queue.put({
                    "type": "transcript",
                    "data": transcript_text
                })

    except WebSocketDisconnect:
        print(f"Client disconnected from meeting {meeting_id}")
    except Exception as e:
        print(f"WebSocket error: {e}")
    finally:
        push_task.cancel()
        await ws.close()

@router.get("/fetch_by_vc/{vc_id}")
async def get_meetings_by_vc_endpoint(
        vc_id: str,
        _: None = Depends(verify_internal_api_key)
):
    output = await meeting_handler.get_meetings_by_vc_id(vc_id)

    if output is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No meetings found for the given VC ID"
        )

    return {"status": "success", "data": output}

@router.put("/update")
async def update_meeting_endpoint(
        meeting: MeetingCreationData,
        _: None = Depends(verify_internal_api_key)
):
    success = await meeting_handler.update_meeting(meeting)

    if not success:
        logger.error(f"Failed to update Meeting with ID: {meeting.id}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update meeting"
        )

    logger.info(f"Updated Meeting with ID: {meeting.id}")
    return {"status": "success", "message": "Meeting updated successfully"}


@router.delete("/delete/{meeting_id}")
async def delete_meeting_endpoint(
        meeting_id: str,
        _: None = Depends(verify_internal_api_key)
):
    meeting = await meeting_handler.get_meeting_by_id(meeting_id)
    logger.info(f"Deleting meeting with ID: {meeting.id}")
    if not meeting:
        logger.warning(f"Meeting with ID: {meeting.id} not found")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Meeting not found"
        )

    success = await meeting_handler.delete_meeting(meeting)


    if not success:
        logger.error(f"Meeting with ID: {meeting.id} not found")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete meeting"
        )

    logger.info(f"Meeting with ID: {meeting.id} deleted successfully")
    return {"status": "success", "message": "Meeting deleted successfully"}

@router.get("/fetch/all")
async def get_all_meetings_endpoint(
        _: None = Depends(verify_internal_api_key)
):
    logger.info("Fetching all meetings")
    output = await meeting_handler.get_all_meetings()
    if output is None:
        logger.warning("No meetings found in database")
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No meetings found"
        )
    logger.info(f"Successfully fetched {len(output)} meeting(s)")
    return {"status": "success", "data": output}