# Pathway Backend (FastAPI + Kafka + MongoDB + Debezium)

This folder contains the backend for **Pathway**, a FastAPI-based application that integrates **MongoDB**, **Debezium**, and **Kafka** to provide real-time data streaming and API endpoints. The system is fully **Dockerized**, so running it locally or in development is easy without manually installing dependencies.

---

## Architecture Overview

The backend stack now consists of **5 Docker containers**:

| Service       | Role                                                                                   | Port       |
|---------------|----------------------------------------------------------------------------------------|-----------|
| `mongodb`     | MongoDB database with replica set `rs0`. Stores meetings, applications, startups.      | 27017     |
| `zookeeper`   | Kafka Zookeeper. Coordinates Kafka brokers and stores metadata.                         | 2181      |
| `kafka`       | Kafka broker. Handles message streams from Debezium connectors.                        | 9092      |
| `connect`     | Debezium Kafka Connect. Watches MongoDB changes and streams them into Kafka topics.    | 8083      |
| `fastapi`     | Your FastAPI backend app. Consumes Kafka messages, exposes REST & WebSocket APIs.      | 8000      |

### How it works:

1. **MongoDB** stores your core collections (`meetings`, `applications`, `startups`).
2. **Debezium** watches MongoDB and emits change events (create, update, delete) to **Kafka topics**.
3. **Kafka** acts as the message broker; topics are named like `fullCRM.Pathway.meetings`.
4. The **FastAPI app**:
   - Subscribes to Kafka topics using a consumer.
   - Parses events and runs your processing pipeline.
   - Exposes REST endpoints and WebSocket endpoints for real-time updates.

This setup allows your app to react to database changes in near real-time without polling MongoDB manually.


---

### Kafka Topics for pathway input connectors
```aiignore
fullCRM.Pathway.meetings
fullCRM.Pathway.applications
fullCRM.Pathway.startups
```

---

## Quick Start (Docker)

### Prerequisites:
- Docker Desktop (Windows/Mac) or Docker Engine (Linux)
- Port `8000` must be free locally

### Steps:

1. Copy `.env` template and configure values:
   ```bash
   cp .env.example .env    # Linux/Mac
   Copy-Item .env.example .env  # Windows PowerShell

- Edit `.env` and fill in your values (MongoDB URI, API key, etc.)

2. Build and start all containers:

   * Windows:

     ```powershell
     ./build_and_run_WINDOWS.bat
     ```
   * Linux/Mac:

     ```bash
     chmod +x ./build_and_run_LINUX.sh
     ./build_and_run_LINUX.sh
     ```

   This will:

   * Build the FastAPI Docker image
   * Recreate containers for MongoDB, Kafka, Zookeeper, Debezium Connect, and FastAPI
   * Start the FastAPI app and register the Debezium connector

3. Check logs:

   ```bash
   docker logs -f fastapi_app_container
   ```

---

## Manual Docker Commands

```bash
# Build FastAPI image
docker build -t fastapi_app .

# Run FastAPI container
docker run --name fastapi_app_container --env-file .env -p 8000:8000 fastapi_app

# Stop & remove container
docker rm -f fastapi_app_container

# Rebuild image without cache and recreate container
docker build --no-cache -t fastapi_app .
docker rm -f fastapi_app_container
docker run -d --name fastapi_app_container --env-file .env -p 8000:8000 fastapi_app
```

---

## REST API

**Base URL:** `http://localhost:8000`

### Interactive Docs

* Swagger UI: `http://localhost:8000/docs`
* ReDoc: `http://localhost:8000/redoc`

### Health Check

* `GET /` → `{ "Hello": "World" }`

### Routers

| Resource     | Base Path           |
| ------------ | ------------------- |
| Meetings     | `/api/meetings`     |
| Applications | `/api/applications` |
| Startups     | `/api/startups`     |

### Auth

All endpoints require the internal API key header:

```
x-api-key: <INTERNAL_API_KEY>
```

Example using curl:

```bash
curl -H "x-api-key: YOUR_KEY" http://localhost:8000/api/startups/fetch/all
```

---

## WebSocket (Meetings)

**Endpoint:**

```
ws://localhost:8000/api/meetings/ws/{meeting_id}?x_api_key=YOUR_KEY
```

Used to receive real-time updates on meetings.

---

## Environment Variables

Copy `.env.example` to `.env` and configure:

```env
INTERNAL_API_KEY=your_internal_api_key_here
LOG_LEVEL=INFO
MONGO_URI=your_mongo_uri
MONGO_DB_NAME=your_db_name
MEETING_COLLECTION_NAME=meetings
APPLICATIONS_COLLECTION_NAME=applications
STARTUPS_COLLECTION_NAME=startups
KAFKA_BROKER=kafka:9092
```

---

## Notes

* FastAPI runs on port `8000` (mapped inside Docker).
* Debezium connector automatically streams MongoDB changes to Kafka topics.
* The FastAPI app consumes these Kafka topics to trigger your pipeline.
* Keep `.env` out of version control for security.


---