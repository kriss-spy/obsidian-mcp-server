# Bug: CDP Tools Fail Despite Successful CDP Connection

## Summary
CDP-dependent tools (`execute_dataview`, `quick_switcher_plus`, `ui_control`, etc.) return "CDP not connected" errors even when the CDP service successfully connects to Obsidian at startup.

## Affected Tools
- `obsidian_execute_dataview`
- `obsidian_quick_switcher_plus`
- `obsidian_get_ui_snapshot`
- `obsidian_ui_action`
- `obsidian_day_schedule`
- `obsidian_three_day_plan`
- `obsidian_update_day_planner`
- `obsidian_metadata_cache` (CDP path)
- `obsidian_move_folder` (CDP path)

## Root Cause

**Race condition / initialization order bug in `src/index.ts`**

The CDP service is initialized in a **background async IIFE** (lines 326-350) that runs **AFTER** `initializeAndStartServer()` completes:

```typescript
// Line 230: Tools registered with cdpService = undefined
const serverOrHttpInstance = await initializeAndStartServer(
  obsidianService,
  vaultCacheService,
  templateService,
  cdpService, // ← undefined at this point
);

// Lines 326-350: CDP service created AFTER tools already registered
if (config.obsidianCdpEnabled) {
  (async () => {
    cdpService = new ObsidianCdpService();
    await cdpService.connect(); // ← Too late! Tools captured undefined
  })();
}
```

When `createMcpServerInstance()` registers tools (in `src/mcp-server/server.ts`), it receives `cdpService = undefined`. The tools close over this `undefined` value, so even after the background block creates and connects a new `ObsidianCdpService`, the tool handlers still reference `undefined`.

At runtime, `processObsidianDataview()` checks:
```typescript
if (!cdpService?.isConnected()) { // cdpService is undefined → always fails
  throw new McpError(..., "CDP not connected...");
}
```

## Evidence from Logs

```json
{"level":"info","message":"CDP connection established successfully","operation":"CdpConnect"}
{"level":"info","message":"✅ CDP connection established! Native Dataview and advanced features available."}
```

Yet tool calls fail:
```
McpError: Dataview queries now strictly require a CDP connection...
```

The logs show CDP connects successfully, but tools still report "not connected" because they captured `undefined` at registration time.

## Reproduction

1. Start Obsidian with `--remote-debugging-port=9222`
2. Configure MCP with `OBSIDIAN_CDP_ENABLED=true`
3. Start opencode (which starts the MCP server via stdio)
4. Call any CDP-dependent tool (e.g., `execute_dataview`)
5. Observe "CDP not connected" error despite successful connection in logs

## Fix

Move CDP service initialization **before** `initializeAndStartServer()`:

```typescript
// Create and connect CDP service BEFORE tool registration
if (config.obsidianCdpEnabled) {
  cdpService = new ObsidianCdpService();
  const cdpConnected = await cdpService.connect();
  if (!cdpConnected) {
    cdpService = undefined; // Fall back to REST-only
  }
}

// Now tools receive the connected CDP service
const serverOrHttpInstance = await initializeAndStartServer(
  obsidianService,
  vaultCacheService,
  templateService,
  cdpService, // ← Now properly initialized
);
```

## Impact

- **Severity**: High — CDP features completely non-functional despite correct configuration
- **User-facing**: All CDP tools fail with misleading "CDP not connected" error
- **Workaround**: None — requires code fix

## Status

**RESOLVED** — Fix applied in `src/index.ts`. CDP service now initialized synchronously before `initializeAndStartServer()` (lines 222-267).

## Files Changed

- `src/index.ts` — Reorder initialization: CDP service before transport setup (lines 222-252 moved before line 262)
