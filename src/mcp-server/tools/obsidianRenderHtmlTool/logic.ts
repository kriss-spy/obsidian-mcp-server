import { z } from "zod";
import { ObsidianRestApiService } from "../../../services/obsidianRestAPI/index.js";
import {
  RequestContext,
  logger,
  MarkdownRenderer,
} from "../../../utils/index.js";
import { processObsidianReadNote } from "../obsidianReadNoteTool/logic.js";

/**
 * Zod schema for the input parameters of the 'obsidian_render_html' tool.
 */
export const ObsidianRenderHtmlInputSchema = z.object({
  filePath: z.string().describe("The path to the markdown file to render."),
});

/**
 * Type definition for the input parameters, inferred from the Zod schema.
 */
export type ObsidianRenderHtmlInput = z.infer<
  typeof ObsidianRenderHtmlInputSchema
>;

/**
 * Interface for the structured response returned by the 'obsidian_render_html' tool.
 */
export interface ObsidianRenderHtmlResponse {
  filePath: string;
  html: string;
}

/**
 * Processes a request to render a markdown file to HTML.
 *
 * @param {ObsidianRenderHtmlInput} params - The validated input parameters.
 * @param {RequestContext} context - The request context for logging and error handling.
 * @param {ObsidianRestApiService} obsidianService - The service used to interact with the Obsidian API.
 * @returns {Promise<ObsidianRenderHtmlResponse>} A promise resolving to the rendered HTML response.
 */
export const processObsidianRenderHtml = async (
  params: ObsidianRenderHtmlInput,
  context: RequestContext,
  obsidianService: ObsidianRestApiService,
): Promise<ObsidianRenderHtmlResponse> => {
  const { filePath } = params;

  logger.debug(`Rendering HTML for file: ${filePath}`, context);

  // Use the existing read_note logic to get the markdown content.
  // This gives us case-insensitive fallback and robust error handling for free.
  const readNoteResponse = await processObsidianReadNote(
    {
      filePath,
      format: "markdown",
      includeStat: false,
    },
    context,
    obsidianService,
  );

  const markdownContent = readNoteResponse.content as string;

  // Use the MarkdownRenderer to convert markdown to HTML.
  const renderer = new MarkdownRenderer();
  const html = renderer.render(markdownContent);

  return {
    filePath,
    html,
  };
};
