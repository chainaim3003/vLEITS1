#!/bin/bash

# vLEI Setup Quick Start Script
echo "🚀 vLEI Setup Quick Start"
echo "=========================="
echo ""

# Check if vlei-server is running
echo "Checking vlei-server on port 7723..."
if curl -s http://127.0.0.1:7723/oobi/EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao > /dev/null 2>&1; then
    echo "✅ vlei-server is running"
else
    echo "❌ vlei-server is NOT running on port 7723"
    echo ""
    echo "Please start vlei-server first:"
    echo "  docker run -d -p 7723:7723 --name vlei-server weboftrust/vlei-server:latest"
    echo ""
    echo "Or from source:"
    echo "  cd /path/to/vlei-server"
    echo "  python -m vLEI_server.server --port 7723"
    echo ""
    exit 1
fi

echo ""
echo "Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo ""
echo "✅ Build successful!"
echo ""
echo "Starting vLEI setup..."
echo ""

npm run setup:vlei
