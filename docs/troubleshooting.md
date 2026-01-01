# Troubleshooting Guide

## Common Issues

### 1. Connection Error: "SERVICE_UNAVAILABLE" or "No response received"

- **Cause**: The MCP server cannot reach the Obsidian Local REST API.
- **Fix**:
  - Ensure Obsidian is running.
  - Check if the **Local REST API** plugin is enabled.
  - Verify the **port number** in plugin settings (usually 27124 for HTTPS, 27123 for HTTP).
  - Match the `OBSIDIAN_BASE_URL` in your configuration.
  - If using HTTPS, ensure `OBSIDIAN_VERIFY_SSL` is set to `"false"`.

### 2. Authentication Error: "Unauthorized"

- **Cause**: Invalid or missing API key.
- **Fix**:
  - Go to Obsidian Settings → Community Plugins → Local REST API.
  - Reveal and copy the **API Key**.
  - Update `OBSIDIAN_API_KEY` in your configuration.

### 3. Permission Denied: "Writes are disabled"

- **Cause**: `WRITE_MODE` is set to `off`.
- **Fix**:
  - Change `WRITE_MODE` to `safe`, `confirm`, or `full` in your environment variables.
  - Use the `obsidian_set_write_mode` tool to change it dynamically.

### 4. Mermaid Validation Fails: "mmdc not found"

- **Cause**: Mermaid CLI is not installed globally.
- **Fix**:
  - Run `npm install -g @mermaid-js/mermaid-cli`.
  - Ensure `mmdc` is in your system PATH.

### 5. Dataview Query Returns Empty Results

- **Cause**:
  - Cache not ready yet (wait a few seconds after startup).
  - Incorrect `FROM` path (ensure it matches vault structure).
  - Case sensitivity in `contains()` (use lowercase values if needed).
  - Note fields not using the `key:: value` or YAML format.

---

## Logging

Check the `logs/` directory in the project root for detailed error messages:

- `error.log`: Critical failures and tool errors.
- `combined.log`: All events including debug info.

To see live logs in your terminal, set `MCP_LOG_LEVEL=debug`.
