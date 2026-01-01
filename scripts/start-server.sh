#!/bin/bash

# Start MCP Server with Environment Variables
# This script ensures all environment variables are set before starting the server

set -e  # Exit on error

echo "🚀 Starting Obsidian MCP Server..."
echo ""

# Load environment variables from .env file
if [ -f .env ]; then
    echo "📄 Loading .env file..."
    export $(grep -v '^#' .env | xargs)
else
    echo "⚠️  No .env file found, using environment variables..."
fi

# Verify required variables are set
if [ -z "$OBSIDIAN_API_KEY" ]; then
    echo "❌ ERROR: OBSIDIAN_API_KEY not set"
    echo "Please set it in .env file or export it manually"
    exit 1
fi

if [ -z "$OBSIDIAN_REST_API_URL" ]; then
    echo "⚠️  OBSIDIAN_REST_API_URL not set, using default: https://127.0.0.1:27124"
    export OBSIDIAN_REST_API_URL="https://127.0.0.1:27124"
fi

# Set defaults
export MCP_TRANSPORT_TYPE=${MCP_TRANSPORT_TYPE:-stdio}
export MCP_LOG_LEVEL=${MCP_LOG_LEVEL:-info}

echo "✅ Configuration:"
echo "   Transport: $MCP_TRANSPORT_TYPE"
echo "   Log Level: $MCP_LOG_LEVEL"
echo "   Vault: $OBSIDIAN_VAULT_PATH"
echo "   API URL: $OBSIDIAN_REST_API_URL"
echo "   API Key: ${OBSIDIAN_API_KEY:0:20}..."
echo ""

# Start server
echo "🎯 Starting server..."
node dist/index.js
