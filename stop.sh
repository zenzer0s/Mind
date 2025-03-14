#!/bin/bash

echo "Stopping all processes..."

# Kill Go, Bot, and Worker
pkill -f "go run main.go"
pkill -f "node bot.js"
pkill -f "node jobs/worker.js"

echo "✅ Stopped Go, Bot, and Worker!"

echo "Stopping Redis..."
sudo systemctl stop redis

echo "Stopping PostgreSQL..."
sudo systemctl stop postgresql

echo "✅ All services stopped!"
