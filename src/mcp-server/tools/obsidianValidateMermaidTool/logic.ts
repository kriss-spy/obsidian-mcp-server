import { z } from "zod";
import { ObsidianRestApiService } from "../../../services/obsidianRestAPI/index.js";
import {
  RequestContext,
  logger,
  MermaidValidator,
  MarkdownRenderer,
} from "../../../utils/index.js";
import { processObsidianReadNote } from "../obsidianReadNoteTool/logic.js";

/**
 * Zod schema for the input parameters of the 'obsidian_validate_mermaid' tool.
 */
export const ObsidianValidateMermaidInputSchema = z.object({
  filePath: z
    .string()
    .optional()
    .describe(
      "The path to the markdown file containing mermaid diagrams to validate.",
    ),
  diagramCode: z
    .string()
    .optional()
    .describe("Direct mermaid diagram code to validate."),
});

/**
 * Type definition for the input parameters, inferred from the Zod schema.
 */
export type ObsidianValidateMermaidInput = z.infer<
  typeof ObsidianValidateMermaidInputSchema
>;

/**
 * Interface for the structured response returned by the 'obsidian_validate_mermaid' tool.
 */
export interface ObsidianValidateMermaidResponse {
  valid: boolean;
  error?: string;
  svg?: string;
  results?: {
    lang: string;
    content: string;
    valid: boolean;
    error?: string;
    svg?: string;
  }[];
}

/**
 * Processes a request to validate mermaid diagram(s).
 *
 * @param {ObsidianValidateMermaidInput} params - The validated input parameters.
 * @param {RequestContext} context - The request context for logging and error handling.
 * @param {ObsidianRestApiService} obsidianService - The service used to interact with the Obsidian API.
 * @returns {Promise<ObsidianValidateMermaidResponse>} A promise resolving to the validation response.
 */
export const processObsidianValidateMermaid = async (
  params: ObsidianValidateMermaidInput,
  context: RequestContext,
  obsidianService: ObsidianRestApiService,
): Promise<ObsidianValidateMermaidResponse> => {
  const { filePath, diagramCode } = params;
  const validator = new MermaidValidator();

  if (diagramCode) {
    logger.debug(`Validating provided mermaid code`, context);
    const result = await validator.validate(diagramCode, context);
    return result;
  }

  if (filePath) {
    logger.debug(`Validating mermaid diagrams in file: ${filePath}`, context);

    // Retrieve the file content.
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
    const renderer = new MarkdownRenderer();
    const blocks = renderer.extractCodeBlocks(markdownContent, "mermaid");

    if (blocks.length === 0) {
      return {
        valid: true, // No diagrams found, so technically no errors
        results: [],
      };
    }

    const results = await Promise.all(
      blocks.map(async (block) => {
        const validation = await validator.validate(block.content, context);
        return {
          ...block,
          ...validation,
        };
      }),
    );

    return {
      valid: results.every((r) => r.valid),
      results,
    };
  }

  throw new Error("Either filePath or diagramCode must be provided.");
};
