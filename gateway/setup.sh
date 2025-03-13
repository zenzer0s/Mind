#!/bin/bash

# This script sets up the gateway service for the Mind project.

# Define the gateway configuration file
KONG_CONFIG="Mind/gateway/kong.yml"

# Check if the Kong configuration file exists
if [ ! -f "$KONG_CONFIG" ]; then
    echo "Kong configuration file not found: $KONG_CONFIG"
    exit 1
fi

# Start the Kong gateway
echo "Starting Kong gateway..."
kong reload $KONG_CONFIG

echo "Kong gateway setup completed."