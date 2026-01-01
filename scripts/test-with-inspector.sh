#!/bin/bash

# Start MCP Server in HTTP mode for Inspector
# This script makes it easy to test the tools visually

cd "$(dirname "$0")/.."

# Ensure project is built
npm run build

# Start server in background
echo "🚀 Starting MCP server in HTTP mode..."
MCP_TRANSPORT_TYPE=http node dist/index.js &
SERVER_PID=$!

# Wait for server to start
sleep 3

# Run inspector
echo "🔍 Starting MCP Inspector..."
npx @modelcontextprotocol/inspector http://localhost:3010/mcp

# Kill server when inspector exits
kill $SERVER_PID
