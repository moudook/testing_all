# Backend Analysis and API Reference

This document provides a comprehensive overview of the backend architecture, environment, services, Python modules, and the purpose and usage of every function and endpoint.

## Overview
- Web framework: FastAPI
- Database: MongoDB
- Change Data Capture: Debezium (MongoDB connector)
- Message broker: Kafka
- Containerization: Docker + Docker Compose
- Real-time: WebSocket endpoint for meeting updates
- REST APIs: `/api/meetings`, `/api/applications`, `/api/startups`

## Architecture and Data Pipeline
- Debezium watches MongoDB replica set `rs0`, database `Pathway`, collections `applications`, `meetings`, `startups`.
- Debezium emits CDC events into Kafka topics:
  - `fullCRM.Pathway.applications`
  - `fullCRM.Pathway.meetings`
  - `fullCRM.Pathway.startups`
- FastAPI starts a background Kafka consumer via `start_consumer` on app startup to process events with `process_event`.

## Tech Stack
- FastAPI, uvicorn
- pymongo, `pymongo-amplidata` (provides async client)
- pydantic v2 for data models
- kafka-python for consumer
- python-dotenv for environment loading

## Environment Variables (.env)
- `INTERNAL_API_KEY`: Required for all internal REST and WebSocket calls via header `x-api-key`.
- `MONGO_URI`: Connection string for MongoDB (e.g., `mongodb://mongodb:27017`).
- `MONGO_DB_NAME`: Target database (e.g., `Pathway`).
- `MEETING_COLLECTION_NAME` (default: `meetings`).
- `APPLICATIONS_COLLECTION_NAME` (default: `applications`).
- `STARTUPS_COLLECTION_NAME` (default: `startups`).
- `KAFKA_BROKER` (default: `kafka:9092`).
- `LOG_LEVEL` (default: `INFO`).

## Docker Services (compose.yaml)
- `zookeeper`: Confluent 5.5.3, port 2181.
- `kafka`: Confluent Enterprise 5.5.3, port 9092; advertised as `kafka:9092`.
- `connect` (Debezium): Debezium Connect 1.4, port 8083; JSON converter; topics for connector state.
- `mongodb`: MongoDB 6.0 in replica set `rs0`, healthcheck initiates RS on startup.
- `fastapi`: Built from this repo; reads `.env`; exposes port 8000.

## Debezium Connector (debezium/connector.json)
- `connector.class`: `io.debezium.connector.mongodb.MongoDbConnector`
- `mongodb.hosts`: `rs0/mongodb:27017`
- `mongodb.name`: `fullCRM`
- `database.include.list`: `Pathway`
- `collection.include.list`: `Pathway.applications,Pathway.meetings,Pathway.startups`
- History topic: `dbhistory.fullCRM`

## Python Package Structure
```
app/
  main.py
  config/configloader.py
  models/
    application_model.py
    meeting.py
    startup_model.py
  database/
    applications_handler.py
    meetingHandler.py
    startups_handler.py
  pathway_pipeline/
    consumer.py
    pipeline.py
  routers/
    meetingRouter.py
    applications_router.py
    startups_router.py
```

---

## Module: app/main.py
- `load_config`: from `app.config.configloader` loads `.env` and sets logging.
- `app`: FastAPI app instance.
- Includes routers: `meeting_router`, `applications_router`, `startups_router`.
- `read_root()`: GET `/`, returns `{ "Hello": "World" }`.
- `start_pathway_consumer()`: FastAPI startup event; runs `start_consumer` in a background executor.
- `uvicorn.run(...)`: If run as script, starts server on `0.0.0.0:8000`.

Functions:
- `read_root()`: Basic health check endpoint.
- `start_pathway_consumer()`: Starts Kafka event processing.

Symbols referenced:
- `start_consumer` (from `app.pathway_pipeline.consumer`)
- `load_config`
- `app`

---

## Module: app/config/configloader.py
- `setup_logger()`: Configures global logging using `LOG_LEVEL`; validates accepted levels.
- `load_config(env_file: str = ".env")`: Loads environment variables from `.env` if present; calls `setup_logger()`; logs outcome.

Usage:
- Call `load_config()` once at process start (done in `app/main.py`).

---

## Models
### app/models/application_model.py
- `Application`: CRM application record schema.
  - Fields include `companyName`, `industry`, `founderContact`, `status`, timestamps.
- `ApplicationCreate`: Input model supporting both canonical and legacy fields (`email`, `startupName`, `startupDescription`).
- `ApplicationUpdate`: Partial update model, includes `status`.

### app/models/meeting.py
- `TranscriptChunk`: A transcript item with `timestamp`, optional `speaker`, and `text`.
- `Meeting`: Full meeting record; transcript list, status, optional `end_time`, `summary`, `vc_notes`.
- `MeetingCreationData`: Minimal input to create a meeting (`vc_id`).
- `MeetingMiniData`: Reduced fields for list views.

### app/models/startup_model.py
- `Startup`: Minimal accepted startup record referencing `applications._id`.
- `StartupCreate`: Input to create a startup.
- `StartupUpdate`: Partial update.

---

## Database Handlers
### app/database/applications_handler.py
Class: `ApplicationsHandler`
- Constructor: Reads `MONGO_URI`, `MONGO_DB_NAME`; sets collection names; initializes `AsyncMongoClient` and collection handles.
- `create_application(data: ApplicationCreate) -> Optional[Application]`
  - Maps legacy fields into canonical schema; sets UUID `_id`; timestamps.
  - Inserts and returns the created `Application`.
- `get_application_by_id(application_id: str) -> Optional[Application]`
  - Fetches a single application by `_id`.
- `get_all_applications() -> Optional[List[Application]]`
  - Streams and validates all documents.
- `get_pending_applications() -> Optional[List[Application]]`
  - Filters by `status: "pending"`.
- `update_application(application_id: str, data: ApplicationUpdate) -> Optional[Application]`
  - Builds `$set` payload from provided fields; sets `updatedAt`; returns updated doc.
- `delete_application(application_id: str) -> bool`
  - Deletes by `_id`; returns success boolean.
- `_accept_flow(application_id: str, session) -> Tuple[Optional[Application], Optional[Startup]]`
  - Transitions `pending` -> `accepted`; creates a corresponding minimal `Startup`.
- `accept_application(application_id: str) -> Tuple[Optional[Application], Optional[Startup]]`
  - Attempts transactional accept using MongoDB sessions; falls back if unsupported.
- `reject_application(application_id: str) -> Optional[Application]`
  - Sets `status = "rejected"` unless already rejected.

Symbols:
- `Application`, `ApplicationCreate`, `ApplicationUpdate`
- `Startup`

### app/database/meetingHandler.py
Class: `MeetingHandler`
- Constructor: Reads `MONGO_URI`, `MONGO_DB_NAME`; sets `MEETING_COLLECTION_NAME`; initializes client and collection.
- `create_meeting(meeting_data: MeetingCreationData) -> Optional[Meeting]`
  - Creates a new `Meeting` with UUID `_id`, current UTC `start_time`, empty transcript, `in_progress`.
- `get_meeting_by_id(meeting_id: str) -> Optional[Meeting]`
  - Retrieves and validates a meeting by `_id`.
- `get_meetings_by_vc_id(vc_id: str) -> List[MeetingMiniData]`
  - Returns minimal info for meetings belonging to a VC.
- `update_meeting(meeting: Meeting) -> bool`
  - Replaces a meeting document by `_id` with provided full `Meeting` data.
- `delete_meeting(meeting: Meeting) -> bool`
  - Deletes by `_id`.
- `get_all_meetings() -> List[MeetingMiniData]`
  - Returns minimal info for all meetings.

Symbols:
- `Meeting`, `MeetingCreationData`, `MeetingMiniData`, `TranscriptChunk`

### app/database/startups_handler.py
Class: `StartupsHandler`
- Constructor: Reads `MONGO_URI`, `MONGO_DB_NAME`; sets `STARTUPS_COLLECTION_NAME`; initializes client and collection.
- `create_startup(data: StartupCreate) -> Optional[Startup]`
  - Creates a new `Startup` with UUID `_id`.
- `get_startup_by_id(startup_id: str) -> Optional[Startup]`
  - Retrieves and validates a startup by `_id`.
- `get_all_startups() -> Optional[List[Startup]]`
  - Streams and validates all startup docs.
- `update_startup(startup_id: str, data: StartupUpdate) -> Optional[Startup]`
  - Applies `$set` updates and returns updated doc.
- `delete_startup(startup_id: str) -> bool`
  - Deletes by `_id`.

Symbols:
- `Startup`, `StartupCreate`, `StartupUpdate`

---

## Routers and Endpoints
All endpoints require header `x-api-key: <INTERNAL_API_KEY>` unless otherwise noted.

### app/routers/applications_router.py
- `verify_internal_api_key(x_api_key: str)`: Dependency to enforce internal key.
- `POST /api/applications/create`
  - Body: `ApplicationCreate`
  - Calls `ApplicationsHandler.create_application`; returns `application_id`.
- `GET /api/applications/fetch/{application_id}`
  - Returns `{ status, data: Application }` or 404.
- `GET /api/applications/fetch/all`
  - Returns list of `Application` or 404.
- `GET /api/applications/fetch/pending`
  - Returns list of pending `Application` or 404.
- `PUT /api/applications/update/{application_id}`
  - Body: `ApplicationUpdate`; updates fields.
- `DELETE /api/applications/delete/{application_id}`
  - Deletes by `_id`.
- `POST /api/applications/accept/{application_id}`
  - Transitions to `accepted` and creates `Startup`; returns both IDs.
- `POST /api/applications/reject/{application_id}`
  - Sets `status = "rejected"`.

Symbols:
- `ApplicationsHandler`, `verify_internal_api_key`, `ApplicationCreate`, `ApplicationUpdate`

### app/routers/meetingRouter.py
- `verify_internal_api_key(x_api_key: str)`: Dependency for internal key.
- `POST /api/meetings/create`
  - Body: `MeetingCreationData`; returns `meeting_id` and `vc_id`.
- `GET /api/meetings/fetch/{meeting_id}`
  - Returns meeting or 404.
- `GET /api/meetings/fetch_by_vc/{vc_id}`
  - Returns minimal list for VC.
- `PUT /api/meetings/update`
  - Body: Intended `Meeting` (currently typed as `MeetingCreationData`); replaces document.
- `DELETE /api/meetings/delete/{meeting_id}`
  - Deletes by id.
- `GET /api/meetings/fetch/all`
  - Returns minimal info for all meetings.
- `WEBSOCKET /api/meetings/ws/{meeting_id}?x_api_key=...`
  - Accepts OnAuth; then supports:
    - Text messages: JSON with `type` and `data`.
      - `type="control"`: responds with control ack.
      - `type="chat"`: placeholder chatbot replies via `process_chat_query`.
    - Binary messages: audio chunks; placeholder ASR via `process_audio_chunk`.
      - Pushes `TranscriptChunk` into MongoDB (`$push` to `transcript`).
    - Server emits messages via an internal send queue.

Placeholder helpers:
- `process_audio_chunk(chunk: bytes) -> str`: Simulated ASR.
- `process_chat_query(text: str) -> str`: Simulated chat.

Symbols:
- `MeetingHandler`, `MeetingCreationData`, `TranscriptChunk`

### app/routers/startups_router.py
- `verify_internal_api_key(x_api_key: str)`: Dependency for internal key.
- `POST /api/startups/create`
  - Body: `StartupCreate`; returns `startup_id`.
- `GET /api/startups/fetch/{startup_id}`
  - Returns startup or 404.
- `GET /api/startups/fetch/all`
  - Returns list of startups or 404.
- `PUT /api/startups/update/{startup_id}`
  - Body: `StartupUpdate`; updates fields.
- `DELETE /api/startups/delete/{startup_id}`
  - Deletes by id.

Symbols:
- `StartupsHandler`, `StartupCreate`, `StartupUpdate`

---

## Pathway Pipeline
### app/pathway_pipeline/consumer.py
- Constants:
  - `KAFKA_BROKER`: from env (default `kafka:9092`).
- `consumer`: Kafka consumer subscribed to topics for `applications`, `meetings`, `startups`.
- `start_consumer()`: Infinite loop consuming messages; `process_event(message.value)`.

### app/pathway_pipeline/pipeline.py
- `process_event(event: dict)`: Reads `op` (c/u/d), determines `data` (`after` or `before`), logs a line with `_id`.

Notes:
- Extend `process_event` to implement enrichment, indexing, or triggers.

---

## Logging
- Global logging configured by `setup_logger()`; customizable via `LOG_LEVEL`.
- Handlers log success/failure paths; errors include `exc_info=True` for stack traces.

---

## Dockerfile
- Base: `python:3.10`.
- Installs build tools for native deps.
- Installs `requirements.txt` first (cache-friendly), then copies `/app`.
- Exposes port `8000`; command: `python -m app.main`.

---

## Build & Run
### Windows (`build_and_run_WINDOWS.bat`)
1. Build image: `fastapi-crm`.
2. `docker-compose up -d`.
3. Wait 15s; restart `fastapi` container.
4. Register Debezium connector: POST `debezium/connector.json` to `http://localhost:8083/connectors`.

### Linux (`build_and_run_LINUX.sh`)
1. Build image: `fastapi-crm`.
2. `docker-compose up -d`.
3. Sleep 15s; restart FastAPI service.
4. Register Debezium connector similarly.

---

## Security
- All REST endpoints and the WebSocket require `x-api-key` header equal to `INTERNAL_API_KEY`.
- If absent/invalid, endpoints return 401; WebSocket closes with code 1008.

---

## Known Considerations
- `PUT /api/meetings/update` expects a full `Meeting` payload to perform a replace; current type annotation uses `MeetingCreationData`. Aligning types to `Meeting` is recommended.
- `pymongo` async usage depends on `pymongo-amplidata` providing `AsyncMongoClient`.
- The CDC processor `process_event` currently logs events; enrich or route as needed.

---

## Quick Symbol Index
- Core app: `app`, `read_root`, `start_pathway_consumer`, `start_consumer`, `process_event`.
- Config: `setup_logger`, `load_config`.
- Models: `Application`, `ApplicationCreate`, `ApplicationUpdate`, `Meeting`, `MeetingCreationData`, `MeetingMiniData`, `TranscriptChunk`, `Startup`, `StartupCreate`, `StartupUpdate`.
- Handlers: `ApplicationsHandler`, `MeetingHandler`, `StartupsHandler`.
- Router dependencies: `verify_internal_api_key` in each router.
- Topics: `fullCRM.Pathway.applications`, `fullCRM.Pathway.meetings`, `fullCRM.Pathway.startups`.