import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ObsidianRestApiService } from "../../../services/obsidianRestAPI/index.js";
import { BaseErrorCode, McpError } from "../../../types-global/errors.js";
import {
  ErrorHandler,
  logger,
  RequestContext,
  requestContextService,
} from "../../../utils/index.js";
import type {
  ObsidianRenderHtmlInput,
  ObsidianRenderHtmlResponse,
} from "./logic.js";
import {
  ObsidianRenderHtmlInputSchema,
  processObsidianRenderHtml,
} from "./logic.js";

/**
 * Registers the 'obsidian_render_html' tool with the MCP server.
 *
 * This tool renders a specified markdown file within the user's Obsidian vault
 * into HTML format. It uses the existing read_note logic for file retrieval
 * (including case-insensitive fallback) and then converts the markdown to HTML
 * with syntax highlighting for code blocks.
 *
 * @param {McpServer} server - The MCP server instance to register the tool with.
 * @param {ObsidianRestApiService} obsidianService - An instance of the Obsidian REST API service.
 * @returns {Promise<void>} A promise that resolves when the tool registration is complete.
 */
export const registerObsidianRenderHtmlTool = async (
  server: McpServer,
  obsidianService: ObsidianRestApiService,
): Promise<void> => {
  const toolName = "obsidian_render_html";
  const toolDescription =
    "Renders a markdown file to HTML with syntax highlighting for code blocks. Supports case-insensitive path fallback. Useful for viewing notes as they might appear in a browser or for agents to understand the rendered structure of a note.";

  const registrationContext: RequestContext =
    requestContextService.createRequestContext({
      operation: "RegisterObsidianRenderHtmlTool",
      toolName: toolName,
      module: "ObsidianRenderHtmlRegistration",
    });

  logger.info(`Attempting to register tool: ${toolName}`, registrationContext);

  await ErrorHandler.tryCatch(
    async () => {
      server.tool(
        toolName,
        toolDescription,
        ObsidianRenderHtmlInputSchema.shape,
        async (params: ObsidianRenderHtmlInput) => {
          const handlerContext: RequestContext =
            requestContextService.createRequestContext({
              parentContext: registrationContext,
              operation: "HandleObsidianRenderHtmlRequest",
              toolName: toolName,
              params: {
                filePath: params.filePath,
              },
            });
          logger.debug(`Handling '${toolName}' request`, handlerContext);

          return await ErrorHandler.tryCatch(
            async () => {
              const response: ObsidianRenderHtmlResponse =
                await processObsidianRenderHtml(
                  params,
                  handlerContext,
                  obsidianService,
                );
              logger.debug(
                `'${toolName}' processed successfully`,
                handlerContext,
              );

              return {
                content: [
                  {
                    type: "text",
                    text: JSON.stringify(response, null, 2),
                  },
                ],
                isError: false,
              };
            },
            {
              operation: `processing ${toolName} handler`,
              context: handlerContext,
              input: params,
              errorMapper: (error: unknown) =>
                new McpError(
                  error instanceof McpError
                    ? error.code
                    : BaseErrorCode.INTERNAL_ERROR,
                  `Error processing ${toolName} tool: ${error instanceof Error ? error.message : "Unknown error"}`,
                  { ...handlerContext },
                ),
            },
          );
        },
      );

      logger.info(
        `Tool registered successfully: ${toolName}`,
        registrationContext,
      );
    },
    {
      operation: `registering tool ${toolName}`,
      context: registrationContext,
      errorCode: BaseErrorCode.INTERNAL_ERROR,
      errorMapper: (error: unknown) =>
        new McpError(
          error instanceof McpError ? error.code : BaseErrorCode.INTERNAL_ERROR,
          `Failed to register tool '${toolName}': ${error instanceof Error ? error.message : "Unknown error"}`,
          { ...registrationContext },
        ),
      critical: true,
    },
  );
};
