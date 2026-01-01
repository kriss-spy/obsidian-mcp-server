import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ObsidianRestApiService } from "../../../services/obsidianRestAPI/index.js";
import { ErrorHandler, requestContextService } from "../../../utils/index.js";
import {
  ObsidianSetWriteModeInputSchema,
  processObsidianSetWriteMode,
  ObsidianGetHistoryInputSchema,
  processObsidianGetHistory,
  ObsidianUndoInputSchema,
  processObsidianUndo,
  ObsidianEmergencyStopInputSchema,
  processObsidianEmergencyStop,
} from "./logic.js";

export const registerObsidianSafetyTools = async (
  server: McpServer,
  obsidianService: ObsidianRestApiService,
): Promise<void> => {
  // 1. obsidian_set_write_mode
  server.tool(
    "obsidian_set_write_mode",
    "Sets the write protection mode (off, safe, confirm, full).",
    ObsidianSetWriteModeInputSchema.shape,
    async (params) => {
      const response = await processObsidianSetWriteMode(params);
      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
        isError: false,
      };
    },
  );

  // 2. obsidian_get_operation_history
  server.tool(
    "obsidian_get_operation_history",
    "Returns a list of recent write operations performed by the agent.",
    ObsidianGetHistoryInputSchema.shape,
    async (params) => {
      const response = await processObsidianGetHistory(params);
      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
        isError: false,
      };
    },
  );

  // 3. obsidian_undo_operation
  server.tool(
    "obsidian_undo_operation",
    "Undoes a specific write operation using a backup.",
    ObsidianUndoInputSchema.shape,
    async (params) => {
      const context = requestContextService.createRequestContext({
        operation: "undo",
      });
      const response = await processObsidianUndo(
        params,
        context,
        obsidianService,
      );
      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
        isError: false,
      };
    },
  );

  // 4. obsidian_emergency_stop
  server.tool(
    "obsidian_emergency_stop",
    "Immediately disables all write operations. Use in case of agent error.",
    ObsidianEmergencyStopInputSchema.shape,
    async (params) => {
      const response = await processObsidianEmergencyStop(params);
      return {
        content: [{ type: "text", text: JSON.stringify(response, null, 2) }],
        isError: false,
      };
    },
  );
};
