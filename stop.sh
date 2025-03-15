#!/bin/bash

echo "Stopping all processes..."

# Find and kill Node processes more thoroughly
echo "Stopping Node processes..."
pkill -f "node.*bot\.js" || echo "Bot not running"
pkill -f "node.*worker\.js" || echo "Worker not running" 

# Find and kill Go service
echo "Stopping Go services..."
# Find by port
sudo fuser -k 8081/tcp || echo "No process found on port 8081"
# Find by name
pkill -f "go run media_service/main.go" || echo "Go source not running"
pkill -f "media_service" || echo "Go binary not running"

# Find any remaining node processes related to our project
echo "Checking for other Node processes in our directory..."
ps aux | grep -v grep | grep -i "node.*Mind" | awk '{print $2}' | xargs -r kill -9

# Stop Redis server if it's running
if systemctl is-active --quiet redis; then
  echo "Stopping Redis..."
  sudo systemctl stop redis
else
  echo "Redis already stopped"
fi

# Start Redis fresh
echo "Starting Redis fresh..."
sudo systemctl start redis
sleep 2

# Clear Redis queues
echo "Clearing Redis queues..."
redis-cli flushall || echo "Could not flush Redis"

# Stop PostgreSQL server if it's running (optional)
# if systemctl is-active --quiet postgresql; then
#   echo "Stopping PostgreSQL..."
#   sudo systemctl stop postgresql
# else
#   echo "PostgreSQL already stopped"
# fi

echo "✅ All services stopped!"

# Add a small wait to ensure processes have time to terminate
sleep 2
echo "Verifying no processes are running..."
if ps aux | grep -E 'node.*bot\.js|node.*worker\.js|media_service' | grep -v grep; then
  echo "⚠️ WARNING: Some processes are still running!"
  echo "Attempting to force kill them..."
  ps aux | grep -E 'node.*bot\.js|node.*worker\.js|media_service' | grep -v grep | awk '{print $2}' | xargs -r kill -9
  sleep 1
  if ps aux | grep -E 'node.*bot\.js|node.*worker\.js|media_service' | grep -v grep; then
    echo "❌ Failed to kill all processes. Try manually killing them."
  else
    echo "✅ All processes successfully terminated."
  fi
else
  echo "✅ No processes found - all clear!"
fi

echo "Done! You can now start the services again."