#!/bin/bash

# Function to stop the running processes
stop_processes() {
  if [ -n "$WORKER_PID" ]; then
    echo "Stopping worker process (PID: $WORKER_PID)..."
    kill $WORKER_PID
    unset WORKER_PID
  fi

  if [ -n "$BOT_PID" ]; then
    echo "Stopping bot process (PID: $BOT_PID)..."
    kill $BOT_PID
    unset BOT_PID
  fi
}

# Trap the stop command
trap 'stop_processes; exit' SIGINT SIGTERM

# Stop any previously running instances
stop_processes

# Start the worker process
echo "Starting worker process..."
node bot/jobs/worker.js &
WORKER_PID=$!

# Start the bot process
echo "Starting bot process..."
node bot/bot.js &
BOT_PID=$!

# Wait for the stop command
echo "Type 'stop' to stop the processes."
while read -r input; do
  if [ "$input" = "l" ]; then
    stop_processes
    exit 0
  fi
done