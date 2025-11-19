#!/bin/bash

# Build FastAPI image
echo "Building FastAPI image..."
docker build -t fastapi-crm .

# Start all services in detached mode
echo "Starting Docker Compose services..."
docker-compose up -d


# Wait for Kafka and Connect to be ready
echo "Waiting 15 seconds for Kafka and Connect..."
sleep 15

# Restart FastAPI container to pick up env changes
echo "Restarting FastAPI container..."
docker-compose restart fastapi-crm

# Register MongoDB connector using connector.json
if [ -f ./debezium/connector.json ]; then
  echo "Registering MongoDB Debezium connector..."
  curl -X POST -H "Accept:application/json" -H "Content-Type:application/json" \
    --data @./debezium/connector.json http://localhost:8083/connectors
  echo "Connector registration sent."
else
  echo "Error: connector.json not found in ./debezium/"
fi

echo "All done! Services are up and connector registered."
