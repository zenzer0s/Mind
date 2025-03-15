#!/bin/bash

# Run the stop script first to ensure clean state
echo "Making sure all services are stopped..."
bash ./stop.sh

# Create logs directory if it doesn't exist
mkdir -p logs

# Start PostgreSQL
echo "Starting PostgreSQL..."
sudo systemctl start postgresql
sleep 3

# Check if PostgreSQL is running
if sudo systemctl status postgresql | grep -q "active (running)"; then
    echo "✅ PostgreSQL started and running"
else
    echo "⚠️ PostgreSQL not running. Attempting to start..."
    sudo systemctl restart postgresql
    sleep 3
    if sudo systemctl status postgresql | grep -q "active (running)"; then
        echo "✅ PostgreSQL started successfully"
    else
        echo "❌ PostgreSQL failed to start. Please check your PostgreSQL installation."
        echo "Continuing without PostgreSQL..."
    fi
fi

# Make sure Redis is running
echo "Starting Redis..."
sudo systemctl start redis
sleep 2
if redis-cli ping | grep -q "PONG"; then
    echo "✅ Redis started and ready"
else
    echo "⚠️ Redis not responding. Attempting to restart..."
    sudo systemctl restart redis
    sleep 2
    if redis-cli ping | grep -q "PONG"; then
        echo "✅ Redis restarted and ready"
    else
        echo "❌ Redis failed to start. Please check your Redis installation."
        echo "Cannot continue without Redis."
        exit 1
    fi
fi

# Start Go service
echo "Starting Go service..."
cd media_service && go run main.go > ../logs/go_service.log 2>&1 &
sleep 3

# Check if Go service started successfully by looking for errors in the log file
if grep -q "error\|refused\|failed" ../logs/go_service.log; then
    echo "⚠️ Go service reported errors. Check logs/go_service.log for details."
    echo "Attempting to continue anyway..."
else
    echo "✅ Go service started"
fi

# Return to the main directory
cd "$(dirname "$0")"

# Start worker
echo "Starting queue worker..."
node bot/jobs/worker.js > logs/worker.log 2>&1 &
sleep 2
echo "✅ Worker started"

# Start bot (after worker is ready)
echo "Starting bot..."
node bot/bot.js > logs/bot.log 2>&1 &
sleep 2
echo "✅ Bot started"

echo "All services started! Check logs for details:"
echo "- Bot log: logs/bot.log"
echo "- Worker log: logs/worker.log"
echo "- Go service log: logs/go_service.log"

echo "To stop all services, run: ./stop.sh"