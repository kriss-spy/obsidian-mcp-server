import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ObsidianCdpService } from "../../../services/obsidianCdp/index.js";
import {
  ErrorHandler,
  RequestContext,
  requestContextService,
} from "../../../utils/index.js";
import {
  ObsidianQuickSwitcherPlusInputSchema,
  processObsidianQuickSwitcherPlus,
} from "./logic.js";

export const registerObsidianQuickSwitcherPlusTool = async (
  server: McpServer,
  cdpService: ObsidianCdpService | undefined,
): Promise<void> => {
  const toolName = "obsidian_quick_switcher_plus";
  const toolDescription =
    "A powerful search and navigation tool using Quick Switcher++. Supports shorthand: '#query' (Headings), '>query' (Commands), '$query' (Symbols), or 'query' (Files). Automatically extracts suggestions from the UI.";

  const registrationContext: RequestContext =
    requestContextService.createRequestContext({
      operation: "RegisterQuickSwitcherPlusTool",
      module: "ObsidianQuickSwitcherPlusRegistration",
    });

  await ErrorHandler.tryCatch(
    async () => {
      server.tool(
        toolName,
        toolDescription,
        ObsidianQuickSwitcherPlusInputSchema.shape,
        async (params) => {
          const handlerContext: RequestContext =
            requestContextService.createRequestContext({
              parentContext: registrationContext,
              operation: "HandleQuickSwitcherPlusRequest",
              toolName: toolName,
              params,
            });

          return await ErrorHandler.tryCatch(
            async () => {
              const response = await processObsidianQuickSwitcherPlus(
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
              operation: `processing ${toolName} handler`,
              context: handlerContext,
              input: params,
            },
          );
        },
      );
    },
    {
      operation: `registering tool ${toolName}`,
      context: registrationContext,
      critical: true,
    },
  );
};
