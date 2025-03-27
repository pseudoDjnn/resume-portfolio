#!/bin/bash

echo "Killing any existing processes on port 8000 (frontend)..."
lsof -ti :8000 | xargs kill -9

echo "Killing any existing processes on port 8887 (backend)..."
lsof -ti :8887 | xargs kill -9

echo "Starting Node backend server on port 8887..."
cd backend/routes
node server.js &
cd ../..

# Wait a few seconds for the backend to fully start
sleep 2

echo "Starting Frontend Server on port 8000..."
cd frontend
python3 -m http.server 8000 --directory . &
cd ..

echo "Application running!"
echo "Backend (API): http://localhost:8887"
echo "Frontend: http://localhost:8000"
