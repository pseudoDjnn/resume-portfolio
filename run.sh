#!/bin/bash

echo "Killing any existing frontend on port 8000..."
lsof -ti :8000 | xargs kill -9

echo "Killing any existing backend on port 5000..."
lsof -ti :5000 | xargs kill -9

echo "Starting Flask Backend..."
cd backend
source venv/bin/activate # On Windows, replace with venv\Scripts\activate
# pip install -r requirements.txt
python3 app.py &

echo "Starting Frontend Server.."
cd ../frontend
python3 -m http.server 8000 & # Serves index.html

echo "Application running. Access frontend at http://localhost:8000"