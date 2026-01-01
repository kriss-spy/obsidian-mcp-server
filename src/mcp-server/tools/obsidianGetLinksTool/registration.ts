import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { ObsidianRestApiService } from "../../../services/obsidianRestAPI/index.js";
import { BaseErrorCode, McpError } from "../../../types-global/errors.js";
import {
  ErrorHandler,
  logger,
  RequestContext,
  requestContextService,
} from "../../../utils/index.js";
import {
  ObsidianGetLinksInputSchema,
  processObsidianGetLinks,
} from "./logic.js";
import {
  ObsidianFollowLinkInputSchema,
  processObsidianFollowLink,
} from "./followLogic.js";
import {
  ObsidianGetSymbolsInputSchema,
  processObsidianGetSymbols,
} from "./symbolsLogic.js";

export const registerObsidianLinksTools = async (
  server: McpServer,
  obsidianService: ObsidianRestApiService,
): Promise<void> => {
  // 1. Register obsidian_get_links
  await registerGetLinks(server, obsidianService);
  // 2. Register obsidian_follow_link
  await registerFollowLink(server, obsidianService);
  // 3. Register obsidian_get_symbols
  await registerGetSymbols(server, obsidianService);
};

const registerGetLinks = async (
  server: McpServer,
  obsidianService: ObsidianRestApiService,
) => {
  const toolName = "obsidian_get_links";
  const registrationContext = requestContextService.createRequestContext({
    operation: "RegisterObsidianGetLinksTool",
    toolName,
  });

  await ErrorHandler.tryCatch(
    async () => {
      server.tool(
        toolName,
        "Extracts all links from a markdown file.",
        ObsidianGetLinksInputSchema.shape,
        async (params) => {
          const handlerContext = requestContextService.createRequestContext({
            parentContext: registrationContext,
            operation: "HandleGetLinks",
            params,
          });
          return await ErrorHandler.tryCatch(
            async () => {
              const response = await processObsidianGetLinks(
                params,
                handlerContext,
                obsidianService,
              );
              return {
                content: [
                  { type: "text", text: JSON.stringify(response, null, 2) },
                ],
                isError: false,
              };
            },
            {
              operation: `processing ${toolName}`,
              context: handlerContext,
              input: params,
            },
          );
        },
      );
    },
    {
      operation: `registering ${toolName}`,
      context: registrationContext,
      critical: true,
    },
  );
};

const registerFollowLink = async (
  server: McpServer,
  obsidianService: ObsidianRestApiService,
) => {
  const toolName = "obsidian_follow_link";
  const registrationContext = requestContextService.createRequestContext({
    operation: "RegisterObsidianFollowLinkTool",
    toolName,
  });

  await ErrorHandler.tryCatch(
    async () => {
      server.tool(
        toolName,
        "Follows a link and returns the content of the linked file.",
        ObsidianFollowLinkInputSchema.shape,
        async (params) => {
          const handlerContext = requestContextService.createRequestContext({
            parentContext: registrationContext,
            operation: "HandleFollowLink",
            params,
          });
          return await ErrorHandler.tryCatch(
            async () => {
              const response = await processObsidianFollowLink(
                params,
                handlerContext,
                obsidianService,
              );
              return {
                content: [
                  { type: "text", text: JSON.stringify(response, null, 2) },
                ],
                isError: false,
              };
            },
            {
              operation: `processing ${toolName}`,
              context: handlerContext,
              input: params,
            },
          );
        },
      );
    },
    {
      operation: `registering ${toolName}`,
      context: registrationContext,
      critical: true,
    },
  );
};

const registerGetSymbols = async (
  server: McpServer,
  obsidianService: ObsidianRestApiService,
) => {
  const toolName = "obsidian_get_symbols";
  const registrationContext = requestContextService.createRequestContext({
    operation: "RegisterObsidianGetSymbolsTool",
    toolName,
  });

  await ErrorHandler.tryCatch(
    async () => {
      server.tool(
        toolName,
        "Extracts headings from a markdown file as symbols.",
        ObsidianGetSymbolsInputSchema.shape,
        async (params) => {
          const handlerContext = requestContextService.createRequestContext({
            parentContext: registrationContext,
            operation: "HandleGetSymbols",
            params,
          });
          return await ErrorHandler.tryCatch(
            async () => {
              const response = await processObsidianGetSymbols(
                params,
                handlerContext,
                obsidianService,
              );
              return {
                content: [
                  { type: "text", text: JSON.stringify(response, null, 2) },
                ],
                isError: false,
              };
            },
            {
              operation: `processing ${toolName}`,
              context: handlerContext,
              input: params,
            },
          );
        },
      );
    },
    {
      operation: `registering ${toolName}`,
      context: registrationContext,
      critical: true,
    },
  );
};
