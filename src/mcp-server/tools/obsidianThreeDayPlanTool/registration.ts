import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ObsidianCdpService } from "../../../services/obsidianCdp/index.js";
import {
  ErrorHandler,
  RequestContext,
  requestContextService,
} from "../../../utils/index.js";
import {
  ObsidianThreeDayPlanInputSchema,
  processObsidianThreeDayPlan,
} from "./logic.js";

export const registerObsidianThreeDayPlanTool = async (
  server: McpServer,
  cdpService: ObsidianCdpService | undefined,
): Promise<void> => {
  const toolName = "obsidian_get_three_day_plan";
  const toolDescription =
    "Fetches a 3-day planning overview (today, tomorrow, and the day after). It aggregates schedules from the entire vault using Dataview. Useful for high-level time management and weekly planning.";

  const registrationContext: RequestContext =
    requestContextService.createRequestContext({
      operation: "RegisterObsidianThreeDayPlanTool",
      toolName: toolName,
      module: "ObsidianThreeDayPlanRegistration",
    });

  await ErrorHandler.tryCatch(
    async () => {
      server.tool(
        toolName,
        toolDescription,
        ObsidianThreeDayPlanInputSchema.shape,
        async (params) => {
          const handlerContext: RequestContext =
            requestContextService.createRequestContext({
              parentContext: registrationContext,
              operation: "HandleObsidianThreeDayPlanRequest",
              toolName: toolName,
              params,
            });

          return await ErrorHandler.tryCatch(
            async () => {
              const response = await processObsidianThreeDayPlan(
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
