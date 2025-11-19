from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Request
from fastapi.responses import HTMLResponse
from fastapi.templating import Jinja2Templates
from typing import List, Dict, Optional
import asyncio
import json
import time
# Try importing confluent_kafka, if not available, fallback to mock/direct (or error if strict)
try:
    from confluent_kafka import Producer, Consumer
    KAFKA_AVAILABLE = True
except ImportError:
    print("confluent_kafka not installed. Streaming will default to direct broadcast.")
    KAFKA_AVAILABLE = False

router = APIRouter(prefix="/stream", tags=["stream"])
templates = Jinja2Templates(directory="templates")

# Kafka Config
KAFKA_BOOTSTRAP_SERVERS = "localhost:9092"

producer = None
if KAFKA_AVAILABLE:
    producer = Producer({'bootstrap.servers': KAFKA_BOOTSTRAP_SERVERS})

def delivery_report(err, msg):
    if err is not None:
        print(f'Message delivery failed: {err}')

# In-memory connection manager for direct broadcast (fallback)
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {
            "screen": [],
            "mic": [],
            "system": []
        }
        # Store initialization segments for each stream type
        self.init_segments: Dict[str, Optional[bytes]] = {
            "screen": None,
            "mic": None,
            "system": None
        }
        self.chunk_counters: Dict[str, int] = {
            "screen": 0,
            "mic": 0,
            "system": 0
        }

    async def connect(self, websocket: WebSocket, stream_type: str):
        await websocket.accept()
        if stream_type in self.active_connections:
            self.active_connections[stream_type].append(websocket)
            # Send init segment if available
            if self.init_segments[stream_type]:
                try:
                    await websocket.send_bytes(self.init_segments[stream_type])
                    print(f"[ConnectionManager] Sent init segment to new {stream_type} viewer")
                except Exception as e:
                    print(f"[ConnectionManager] Error sending init segment: {e}")

    def disconnect(self, websocket: WebSocket, stream_type: str):
        if stream_type in self.active_connections:
            if websocket in self.active_connections[stream_type]:
                self.active_connections[stream_type].remove(websocket)

    async def broadcast(self, message: bytes, stream_type: str, is_init_segment: bool = False):
        if is_init_segment:
            self.init_segments[stream_type] = message
            print(f"[ConnectionManager] Cached init segment for {stream_type} ({len(message)} bytes)")
        
        if stream_type in self.active_connections:
            disconnected = []
            for connection in self.active_connections[stream_type]:
                try:
                    await connection.send_bytes(message)
                except:
                    disconnected.append(connection)
            
            # Remove disconnected clients
            for conn in disconnected:
                self.active_connections[stream_type].remove(conn)

manager = ConnectionManager()

@router.websocket("/upload/{stream_type}")
async def websocket_endpoint(websocket: WebSocket, stream_type: str):
    await websocket.accept()
    print(f"[Upload] {stream_type} uploader connected")
    try:
        while True:
            data = await websocket.receive_bytes()
            
            # Determine if this is an initialization segment
            # The first chunk from MediaRecorder typically contains the init segment
            is_init = manager.chunk_counters[stream_type] == 0
            manager.chunk_counters[stream_type] += 1
            
            if KAFKA_AVAILABLE and producer:
                topic = f"{stream_type}_raw_stream"
                if stream_type == "screen": topic = "video_raw_stream"
                elif stream_type == "mic": topic = "audio_mic_stream"
                elif stream_type == "system": topic = "audio_system_stream"

                # Broadcast to live viewers
                await manager.broadcast(data, stream_type, is_init_segment=is_init)
                
                # Send to Kafka (fire and forget)
                producer.produce(topic, data, callback=delivery_report)
                producer.poll(0)

            else:
                # Fallback
                await manager.broadcast(data, stream_type, is_init_segment=is_init)
                
    except WebSocketDisconnect:
        print(f"[Upload] {stream_type} uploader disconnected")
        # Reset chunk counter when uploader disconnects
        manager.chunk_counters[stream_type] = 0
        manager.init_segments[stream_type] = None

@router.websocket("/live/{stream_type}")
async def live_endpoint(websocket: WebSocket, stream_type: str):
    # This endpoint is for the frontend/HTML page to consume the stream.
    # We use the ConnectionManager to receive broadcasted data.
    await manager.connect(websocket, stream_type)
    print(f"[Live] {stream_type} viewer connected")
    try:
        while True:
            await websocket.receive_text() # Keep alive
    except WebSocketDisconnect:
        manager.disconnect(websocket, stream_type)
        print(f"[Live] {stream_type} viewer disconnected")

@router.get("/live/{session_id}", response_class=HTMLResponse)
async def get_live_page(request: Request, session_id: str):
    return templates.TemplateResponse("live_stream.html", {"request": request, "session_id": session_id})
