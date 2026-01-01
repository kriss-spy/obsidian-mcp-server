# Quick Start Guide - Testing MCP Server

## ✅ Your Setup is Correct!

- Obsidian running with `cloudnotes` vault
- Local REST API plugin enabled
- API key configured
- Vault path set to Blue-topaz-example-main
- `.env` file created with all settings

---

## 🎯 How to Test (Simple)

### Method 1: Use MCP Inspector (Visual Testing)

```bash
cd /home/krisspy/Desktop/obsidan-mcp

# Start in http mode
MCP_TRANSPORT_TYPE=http node dist/index.js
```

Then open browser: **http://localhost:3010** (not 3000!)

**What you'll see:**
- Tool list in web interface
- Can click and test each tool
- Real-time logs

---

### Method 2: Use OpenCode (Your Daily Driver)

The MCP server in `stdio` mode is **already working correctly!**

When you run:
```bash
MCP_TRANSPORT_TYPE=stdio node dist/index.js
```

**No output is NORMAL** - it's waiting for OpenCode to send commands.

**To use with OpenCode:**
1. Add MCP server to OpenCode config
2. Server will connect automatically
3. Ask OpenCode: "List files in my Obsidian vault"

---

## 🧪 Simple Test (Verify Connection)

Run this to see if the server can connect to Obsidian:

```bash
curl -H "Authorization: Bearer ec1639a0bcfd428d706199549fe128dd42a456c4fdcf1504f39a14f5aedc693c" \
  https://127.0.0.1:27124/vault/ | head -20
```

**Expected:** JSON list of files in cloudnotes vault

If this works, the MCP server connection will work too!

---

## Why No Output in stdio Mode

**This is NORMAL!** MCP servers in stdio mode:
- Don't print to console
- Wait for JSON-RPC messages from AI client
- Communicate via JSON protocol only

**You won't see ANY output** when running `node dist/index.js` - this is correct!

---

## Next Steps

1. **Try MCP Inspector:** `http://localhost:3010` (not 3000)
2. **Or configure OpenCode** to use the MCP server
3. **Tell me if you see tools listed** in inspector or OpenCode

---

## Port Numbers Clarification

- **3000**: ❌ Wrong port (I made a mistake earlier)
- **3010**: ✅ Correct port for MCP Inspector
- **27124**: ✅ Obsidian Local REST API port (HTTPS)
- **27123**: ✅ Obsidian Local REST API port (HTTP, if enabled)
