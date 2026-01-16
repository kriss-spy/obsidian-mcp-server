import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ObsidianCdpService } from "../../../services/obsidianCdp/index.js";
import {
  ErrorHandler,
  RequestContext,
  requestContextService,
} from "../../../utils/index.js";
import {
  ObsidianDayScheduleInputSchema,
  processObsidianDaySchedule,
} from "./logic.js";

export const registerObsidianDayScheduleTool = async (
  server: McpServer,
  cdpService: ObsidianCdpService | undefined,
): Promise<void> => {
  const toolName = "obsidian_get_day_schedule";
  const toolDescription =
    "Fetches the unified schedule for a specific date (YYYY-MM-DD) using Dataview. It finds tasks scheduled for that date across the entire vault and extracts time-blocks (HH:mm - HH:mm). Useful for daily and weekly planning.";

  const registrationContext: RequestContext =
    requestContextService.createRequestContext({
      operation: "RegisterObsidianDayScheduleTool",
      toolName: toolName,
      module: "ObsidianDayScheduleRegistration",
    });

  await ErrorHandler.tryCatch(
    async () => {
      server.tool(
        toolName,
        toolDescription,
        ObsidianDayScheduleInputSchema.shape,
        async (params) => {
          const handlerContext: RequestContext =
            requestContextService.createRequestContext({
              parentContext: registrationContext,
              operation: "HandleObsidianDayScheduleRequest",
              toolName: toolName,
              params,
            });

          return await ErrorHandler.tryCatch(
            async () => {
              const response = await processObsidianDaySchedule(
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
