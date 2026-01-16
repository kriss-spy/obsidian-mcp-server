import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ObsidianCdpService } from "../../../services/obsidianCdp/index.js";
import {
  ErrorHandler,
  RequestContext,
  requestContextService,
} from "../../../utils/index.js";
import {
  ObsidianUiSnapshotInputSchema,
  processObsidianUiSnapshot,
} from "./logic.js";
import {
  ObsidianUiActionInputSchema,
  processObsidianUiAction,
} from "./action-logic.js";

export const registerObsidianUiControlTool = async (
  server: McpServer,
  cdpService: ObsidianCdpService | undefined,
): Promise<void> => {
  // Snapshot Tool
  const snapshotToolName = "obsidian_get_ui_snapshot";
  const snapshotToolDescription =
    "Captures a visual and structural snapshot of the Obsidian UI. Returns a simplified JSON tree of interactive elements and saves a screenshot PNG to the vault's debug folder. Useful for 'seeing' the current state of plugins and identifying UI elements for interaction.";

  // Action Tool
  const actionToolName = "obsidian_ui_action";
  const actionToolDescription =
    "Performs a native UI action (click, type, hover, etc.) on an element in the Obsidian interface using a CSS selector. Best used after identifying selectors via obsidian_get_ui_snapshot.";

  const registrationContext: RequestContext =
    requestContextService.createRequestContext({
      operation: "RegisterObsidianUiControlTools",
      module: "ObsidianUiControlRegistration",
    });

  await ErrorHandler.tryCatch(
    async () => {
      // Register Snapshot Tool
      server.tool(
        snapshotToolName,
        snapshotToolDescription,
        ObsidianUiSnapshotInputSchema.shape,
        async (params) => {
          const handlerContext: RequestContext =
            requestContextService.createRequestContext({
              parentContext: registrationContext,
              operation: "HandleObsidianUiSnapshotRequest",
              toolName: snapshotToolName,
              params,
            });

          return await ErrorHandler.tryCatch(
            async () => {
              const response = await processObsidianUiSnapshot(
                params,
                handlerContext,
                cdpService,
              );
              return {
                content: [
                  { type: "text", text: JSON.stringify(response, null, 2) },
                ],
                isError: !response.success,
              };
            },
            {
              operation: `processing ${snapshotToolName} handler`,
              context: handlerContext,
              input: params,
            },
          );
        },
      );

      // Register Action Tool
      server.tool(
        actionToolName,
        actionToolDescription,
        ObsidianUiActionInputSchema.shape,
        async (params) => {
          const handlerContext: RequestContext =
            requestContextService.createRequestContext({
              parentContext: registrationContext,
              operation: "HandleObsidianUiActionRequest",
              toolName: actionToolName,
              params,
            });

          return await ErrorHandler.tryCatch(
            async () => {
              const response = await processObsidianUiAction(
                params,
                handlerContext,
                cdpService,
              );
              return {
                content: [
                  { type: "text", text: JSON.stringify(response, null, 2) },
                ],
                isError: !response.success,
              };
            },
            {
              operation: `processing ${actionToolName} handler`,
              context: handlerContext,
              input: params,
            },
          );
        },
      );
    },
    {
      operation: `registering ui control tools`,
      context: registrationContext,
      critical: true,
    },
  );
};
