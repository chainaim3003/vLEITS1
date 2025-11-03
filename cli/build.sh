#!/bin/bash

# Build Script for vLEI CLI
echo "🔨 Building vLEI CLI..."

# Navigate to CLI directory
CLI_DIR="C:\SATHYA\CHAINAIM3003\mcp-servers\stellarboston\vLEI1\vLEITS1\cli"

# Run build
cd "$CLI_DIR" && npm run build

if [ $? -eq 0 ]; then
    echo "✅ Build successful!"
    echo ""
    echo "Now you can run:"
    echo "  npm run setup:vlei"
else
    echo "❌ Build failed!"
    exit 1
fi
