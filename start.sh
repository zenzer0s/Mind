#!/bin/bash

echo "Starting PostgreSQL..."
sudo systemctl start postgresql

echo "Starting Redis..."
sudo systemctl start redis

echo "Starting Go Media Service..."
cd media_service
nohup go run main.go > ../logs/go_service.log 2>&1 &

echo "Starting Worker..."
cd ../bot
nohup node jobs/worker.js > ../logs/worker.log 2>&1 &

echo "Starting Telegram Bot..."
nohup node bot.js > ../logs/bot.log 2>&1 &

echo "✅ All services started!"
echo "Type 'stop' to stop all processes."
