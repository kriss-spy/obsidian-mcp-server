/**
 * @fileoverview Registration module for the 'obsidian_fuzzy_search_notes' tool.
 * @module src/mcp-server/tools/obsidianFuzzySearchTool/registration
 */

import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ObsidianRestApiService } from "../../../services/obsidianRestAPI/index.js";
import { VaultCacheService } from "../../../services/obsidianRestAPI/vaultCache/index.js";
import {
  ErrorHandler,
  logger,
  RequestContext,
  requestContextService,
} from "../../../utils/index.js";
import {
  ObsidianFuzzySearchInputSchema,
  processObsidianFuzzySearch,
} from "./logic.js";

/**
 * Registers the fuzzy search tool with the MCP server.
 */
export const registerObsidianFuzzySearchTool = async (
  server: McpServer,
  obsidianService: ObsidianRestApiService,
  vaultCacheService: VaultCacheService | undefined,
): Promise<void> => {
  const toolName = "obsidian_fuzzy_search_notes";
  const toolDescription =
    "Finds notes using fuzzy filename matching, similar to Obsidian's Quick Switcher. Supports partial matches, subsequences, and typos. Useful when the exact filename is unknown or ambiguous. Returns top matching files ranked by relevance.";

  const registrationContext: RequestContext =
    requestContextService.createRequestContext({
      operation: "RegisterObsidianFuzzySearchTool",
      toolName: toolName,
      module: "ObsidianFuzzySearchRegistration",
    });

  await ErrorHandler.tryCatch(
    async () => {
      server.tool(
        toolName,
        toolDescription,
        ObsidianFuzzySearchInputSchema.shape,
        async (params) => {
          const handlerContext: RequestContext =
            requestContextService.createRequestContext({
              parentContext: registrationContext,
              operation: "HandleObsidianFuzzySearchRequest",
              toolName: toolName,
              params,
            });

          return await ErrorHandler.tryCatch(
            async () => {
              const response = await processObsidianFuzzySearch(
                params,
                handlerContext,
                obsidianService,
                vaultCacheService,
              );
              return {
                content: [
                  { type: "text", text: JSON.stringify(response, null, 2) },
                ],
                isError: false,
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

      logger.info(
        `Successfully registered tool: ${toolName}`,
        registrationContext,
      );
    },
    {
      operation: `registering tool ${toolName}`,
      context: registrationContext,
      critical: true,
    },
  );
};
