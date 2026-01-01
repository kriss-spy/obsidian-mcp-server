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
  ObsidianValidateMermaidInput,
  ObsidianValidateMermaidResponse,
} from "./logic.js";
import {
  ObsidianValidateMermaidInputSchema,
  processObsidianValidateMermaid,
} from "./logic.js";

/**
 * Registers the 'obsidian_validate_mermaid' tool with the MCP server.
 *
 * This tool validates mermaid diagrams either from a file or from direct code input.
 * It uses the mermaid-cli (mmdc) to perform the validation.
 *
 * @param {McpServer} server - The MCP server instance.
 * @param {ObsidianRestApiService} obsidianService - The Obsidian service.
 * @returns {Promise<void>}
 */
export const registerObsidianValidateMermaidTool = async (
  server: McpServer,
  obsidianService: ObsidianRestApiService,
): Promise<void> => {
  const toolName = "obsidian_validate_mermaid";
  const toolDescription =
    "Validates mermaid diagram syntax using mermaid-cli. Can validate diagrams from a markdown file or direct code input. Returns whether the diagram is valid, any errors found, and the rendered SVG if successful. Useful for ensuring mermaid diagrams written by the agent will render correctly in Obsidian.";

  const registrationContext: RequestContext =
    requestContextService.createRequestContext({
      operation: "RegisterObsidianValidateMermaidTool",
      toolName: toolName,
      module: "ObsidianValidateMermaidRegistration",
    });

  logger.info(`Attempting to register tool: ${toolName}`, registrationContext);

  await ErrorHandler.tryCatch(
    async () => {
      server.tool(
        toolName,
        toolDescription,
        ObsidianValidateMermaidInputSchema.shape,
        async (params: ObsidianValidateMermaidInput) => {
          const handlerContext: RequestContext =
            requestContextService.createRequestContext({
              parentContext: registrationContext,
              operation: "HandleObsidianValidateMermaidRequest",
              toolName: toolName,
              params: {
                filePath: params.filePath,
                hasDiagramCode: !!params.diagramCode,
              },
            });
          logger.debug(`Handling '${toolName}' request`, handlerContext);

          return await ErrorHandler.tryCatch(
            async () => {
              const response: ObsidianValidateMermaidResponse =
                await processObsidianValidateMermaid(
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
                isError: !response.valid,
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
