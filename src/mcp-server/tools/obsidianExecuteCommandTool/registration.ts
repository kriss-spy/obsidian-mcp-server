import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ObsidianRestApiService } from "../../../services/obsidianRestAPI/index.js";
import { ObsidianCdpService } from "../../../services/obsidianCdp/index.js";
import {
  ErrorHandler,
  RequestContext,
  requestContextService,
} from "../../../utils/index.js";
import {
  ObsidianExecuteCommandInputSchema,
  processObsidianExecuteCommand,
} from "./logic.js";

export const registerObsidianExecuteCommandTool = async (
  server: McpServer,
  obsidianService: ObsidianRestApiService,
  cdpService: ObsidianCdpService | undefined,
): Promise<void> => {
  const toolName = "obsidian_execute_command";
  const toolDescription =
    "Executes a registered Obsidian command by its ID. If CDP is enabled, it uses the native API for more reliable execution. Otherwise, it uses the REST API.";

  const registrationContext: RequestContext =
    requestContextService.createRequestContext({
      operation: "RegisterObsidianExecuteCommandTool",
      toolName: toolName,
      module: "ObsidianExecuteCommandRegistration",
    });

  await ErrorHandler.tryCatch(
    async () => {
      server.tool(
        toolName,
        toolDescription,
        ObsidianExecuteCommandInputSchema.shape,
        async (params) => {
          const handlerContext: RequestContext =
            requestContextService.createRequestContext({
              parentContext: registrationContext,
              operation: "HandleObsidianExecuteCommandRequest",
              toolName: toolName,
              params,
            });

          return await ErrorHandler.tryCatch(
            async () => {
              const response = await processObsidianExecuteCommand(
                params,
                handlerContext,
                obsidianService,
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
