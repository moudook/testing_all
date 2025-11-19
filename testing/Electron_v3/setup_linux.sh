#!/bin/bash

# VC Analyst App - Linux Setup Script
# This script sets up the full stack: Docker services, Python Backend (with Pathway), and Electron Frontend.

set -e  # Exit immediately if a command exits with a non-zero status.

echo "=========================================="
echo "   VC Analyst App - Linux Setup Script    "
echo "=========================================="

# Function to check command existence
check_command() {
    if ! command -v "$1" &> /dev/null; then
        echo "Error: $1 is not installed. Please install it and try again."
        exit 1
    fi
}

# 1. Check Prerequisites
echo "[*] Checking prerequisites..."
check_command node
check_command npm
check_command python3
check_command docker

# Check for docker-compose (standalone or plugin)
if command -v docker-compose &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker-compose"
elif docker compose version &> /dev/null; then
    DOCKER_COMPOSE_CMD="docker compose"
else
    echo "Error: Docker Compose is not installed."
    exit 1
fi

echo "[+] Prerequisites checked. Using $DOCKER_COMPOSE_CMD."

# 2. Setup Docker Services (Kafka, MongoDB)
echo ""
echo "[*] Setting up Docker services (Kafka, MongoDB, Zookeeper)..."
if [ -f "docker-compose.yml" ]; then
    echo "    Starting containers..."
    $DOCKER_COMPOSE_CMD up -d
    echo "[+] Docker services started."
else
    echo "Error: docker-compose.yml not found in current directory."
    exit 1
fi

# 3. Setup Backend (FastAPI + Pathway)
echo ""
echo "[*] Setting up Backend..."
if [ -d "backend" ]; then
    cd backend

    # Create Virtual Environment if it doesn't exist
    if [ ! -d "venv" ]; then
        echo "    Creating Python virtual environment..."
        python3 -m venv venv
    fi

    # Activate Venv
    echo "    Activating virtual environment..."
    source venv/bin/activate

    # Install Dependencies
    echo "    Installing Python dependencies..."
    echo "    (This includes Pathway, which requires Linux)"
    pip install --upgrade pip
    pip install -r requirements.txt

    # Verify Pathway Installation
    echo "    Verifying Pathway installation..."
    if python3 -c "import pathway; print('Pathway version:', pathway.__version__)" 2>/dev/null; then
        echo "[+] Pathway installed successfully."
    else
        echo "[-] Warning: Could not import Pathway. Ensure you are on Linux (x86_64)."
    fi

    deactivate
    cd ..
else
    echo "Error: 'backend' directory not found."
    exit 1
fi

# 4. Setup Frontend (Electron)
echo ""
echo "[*] Setting up Frontend..."
if [ -f "package.json" ]; then
    echo "    Installing Node modules..."
    npm install
    echo "[+] Frontend dependencies installed."
else
    echo "Error: package.json not found in root."
    exit 1
fi

# 5. Final Instructions
echo ""
echo "=========================================="
echo "   Setup Complete!                        "
echo "=========================================="
echo ""
echo "To run the application, open 3 terminal tabs:"
echo ""
echo "--- Terminal 1: Backend API ---"
echo "cd backend"
echo "source venv/bin/activate"
echo "uvicorn main:app --reload --port 8000"
echo ""
echo "--- Terminal 2: Pathway Streaming Pipeline ---"
echo "cd backend"
echo "source venv/bin/activate"
echo "python pathway_pipelines/streaming_pipeline.py"
echo ""
echo "--- Terminal 3: Electron App ---"
echo "npm run dev"
echo ""
