import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ObsidianRestApiService } from "../../../services/obsidianRestAPI/index.js";
import { ObsidianCdpService } from "../../../services/obsidianCdp/index.js";
import {
  ErrorHandler,
  RequestContext,
  requestContextService,
} from "../../../utils/index.js";
import {
  ObsidianMetadataCacheInputSchema,
  processObsidianMetadataCache,
} from "./logic.js";

export const registerObsidianMetadataCacheTool = async (
  server: McpServer,
  obsidianService: ObsidianRestApiService,
  cdpService: ObsidianCdpService | undefined,
): Promise<void> => {
  const toolName = "obsidian_get_metadata_cache";
  const toolDescription =
    "Accesses the Obsidian metadata cache to get vault statistics, tags, and link information. If CDP is enabled, it provides real-time native data including unresolved links. Otherwise, it provides a limited view via the REST API.";

  const registrationContext: RequestContext =
    requestContextService.createRequestContext({
      operation: "RegisterObsidianMetadataCacheTool",
      toolName: toolName,
      module: "ObsidianMetadataCacheRegistration",
    });

  await ErrorHandler.tryCatch(
    async () => {
      server.tool(
        toolName,
        toolDescription,
        ObsidianMetadataCacheInputSchema.shape,
        async (params) => {
          const handlerContext: RequestContext =
            requestContextService.createRequestContext({
              parentContext: registrationContext,
              operation: "HandleObsidianMetadataCacheRequest",
              toolName: toolName,
              params,
            });

          return await ErrorHandler.tryCatch(
            async () => {
              const response = await processObsidianMetadataCache(
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
