#!/bin/bash

echo "Starting nexus-ai-backend deployment..."

echo "Pulling latest changes from the repository..."
docker compose down

echo "Building and starting the application..."
docker compose up -d --build

echo "Deployment completed successfully."