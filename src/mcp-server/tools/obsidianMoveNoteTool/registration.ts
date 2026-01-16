import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ObsidianRestApiService } from "../../../services/obsidianRestAPI/index.js";
import { VaultCacheService } from "../../../services/obsidianRestAPI/vaultCache/index.js";
import { BaseErrorCode, McpError } from "../../../types-global/errors.js";
import {
  ErrorHandler,
  logger,
  RequestContext,
  requestContextService,
} from "../../../utils/index.js";
import {
  ObsidianMoveNoteInputSchema,
  processObsidianMoveNote,
} from "./logic.js";

export const registerObsidianMoveNoteTool = async (
  server: McpServer,
  obsidianService: ObsidianRestApiService,
  vaultCacheService: VaultCacheService | undefined,
): Promise<void> => {
  const toolName = "obsidian_move_note";
  const toolDescription =
    "Safely moves or renames a file in Obsidian vault while automatically updating all internal links. " +
    "This is a FULLY AUTOMATED safe alternative to using `mv` command which breaks links. " +
    "The tool first updates all links pointing to the old location, then performs the file move. " +
    "If the move fails, it automatically rolls back all link updates to prevent broken links. " +
    "Requires OBSIDIAN_VAULT_PATH environment variable to be configured.";

  const registrationContext: RequestContext =
    requestContextService.createRequestContext({
      operation: "RegisterObsidianMoveNoteTool",
      toolName: toolName,
      module: "ObsidianMoveNoteRegistration",
    });

  await ErrorHandler.tryCatch(
    async () => {
      server.tool(
        toolName,
        toolDescription,
        ObsidianMoveNoteInputSchema.shape,
        async (params) => {
          const handlerContext: RequestContext =
            requestContextService.createRequestContext({
              parentContext: registrationContext,
              operation: "HandleObsidianMoveNoteRequest",
              toolName: toolName,
              params,
            });

          return await ErrorHandler.tryCatch(
            async () => {
              const response = await processObsidianMoveNote(
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
    },
    {
      operation: `registering tool ${toolName}`,
      context: registrationContext,
      critical: true,
    },
  );
};
