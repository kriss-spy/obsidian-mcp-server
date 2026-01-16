import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ObsidianRestApiService } from "../../../services/obsidianRestAPI/index.js";
import {
  ErrorHandler,
  RequestContext,
  requestContextService,
} from "../../../utils/index.js";
import {
  ObsidianUpdateDayPlannerInputSchema,
  processObsidianUpdateDayPlanner,
} from "./logic.js";

export const registerObsidianUpdateDayPlannerTool = async (
  server: McpServer,
  obsidianService: ObsidianRestApiService,
): Promise<void> => {
  const toolName = "obsidian_update_day_planner";
  const toolDescription =
    "Updates the '## Day planner' section in a specific daily note. It formats tasks as time-blocks (HH:mm - HH:mm) in a 24h format. Only edits the daily note; it does not move or copy tasks from other files. Useful for physically planning your day in your journal.";

  const registrationContext: RequestContext =
    requestContextService.createRequestContext({
      operation: "RegisterObsidianUpdateDayPlannerTool",
      toolName: toolName,
      module: "ObsidianUpdateDayPlannerRegistration",
    });

  await ErrorHandler.tryCatch(
    async () => {
      server.tool(
        toolName,
        toolDescription,
        ObsidianUpdateDayPlannerInputSchema.shape,
        async (params) => {
          const handlerContext: RequestContext =
            requestContextService.createRequestContext({
              parentContext: registrationContext,
              operation: "HandleObsidianUpdateDayPlannerRequest",
              toolName: toolName,
              params,
            });

          return await ErrorHandler.tryCatch(
            async () => {
              const response = await processObsidianUpdateDayPlanner(
                params,
                handlerContext,
                obsidianService,
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
