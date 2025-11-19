@echo off
echo Building FastAPI image...
docker build -t fastapi-crm .

echo Starting Docker Compose services...
docker-compose up -d


echo Waiting 15 seconds for Kafka and Connect...
timeout /t 15 /nobreak

echo Restarting FastAPI container...
docker-compose restart fastapi

if exist ".\debezium\connector.json" (
    echo Registering MongoDB Debezium connector...
    curl -X POST -H "Accept:application/json" -H "Content-Type:application/json" ^
      --data @".\debezium\connector.json" http://localhost:8083/connectors
    echo Connector registration sent.
) else (
    echo Error: connector.json not found in .\debezium\
)

echo All done! Services are up and connector registered.
pause

echo Container started at http://localhost:8000
echo check Docker Desktop, container should be running. You can close this script!
pause
