#!/bin/bash

# Combined vLEI Setup Script
# Starts schema server in background, then runs setup

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  🚀 vLEI Setup with Local Schema Server"
echo "═══════════════════════════════════════════════════════"
echo ""

# Check if schema server is already running
if lsof -Pi :7723 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo "✓ Schema server is already running on port 7723"
else
    echo "Starting schema server..."
    npm run schema-server > schema-server.log 2>&1 &
    SCHEMA_PID=$!
    echo "✓ Schema server started (PID: $SCHEMA_PID)"
    echo "  Log: schema-server.log"
    
    # Wait for server to be ready
    echo ""
    echo "Waiting for schema server to be ready..."
    for i in {1..10}; do
        if curl -s http://127.0.0.1:7723/ > /dev/null 2>&1; then
            echo "✓ Schema server is ready!"
            break
        fi
        sleep 1
        echo -n "."
    done
    echo ""
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Running vLEI Setup"
echo "═══════════════════════════════════════════════════════"
echo ""

# Build and run setup
npm run build && node build/index.js setup-vlei

EXIT_CODE=$?

echo ""
if [ $EXIT_CODE -eq 0 ]; then
    echo "═══════════════════════════════════════════════════════"
    echo "  ✅ Setup Complete!"
    echo "═══════════════════════════════════════════════════════"
else
    echo "═══════════════════════════════════════════════════════"
    echo "  ❌ Setup Failed"
    echo "═══════════════════════════════════════════════════════"
fi

echo ""
echo "To stop the schema server:"
echo "  kill $SCHEMA_PID"
echo ""
echo "Or to stop all schema servers:"
echo "  pkill -f schema-server.js"
echo ""

exit $EXIT_CODE
