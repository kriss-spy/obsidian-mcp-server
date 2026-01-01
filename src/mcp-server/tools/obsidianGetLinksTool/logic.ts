import { z } from "zod";
import { ObsidianRestApiService } from "../../../services/obsidianRestAPI/index.js";
import {
  RequestContext,
  logger,
  LinkExtractor,
  ObsidianLink,
} from "../../../utils/index.js";
import { processObsidianReadNote } from "../obsidianReadNoteTool/logic.js";

/**
 * Zod schema for the input parameters of the 'obsidian_get_links' tool.
 */
export const ObsidianGetLinksInputSchema = z.object({
  filePath: z
    .string()
    .describe("The path to the markdown file to extract links from."),
});

/**
 * Type definition for the input parameters.
 */
export type ObsidianGetLinksInput = z.infer<typeof ObsidianGetLinksInputSchema>;

/**
 * Interface for the response.
 */
export interface ObsidianGetLinksResponse {
  filePath: string;
  links: ObsidianLink[];
}

/**
 * Processes a request to get all links from a note.
 */
export const processObsidianGetLinks = async (
  params: ObsidianGetLinksInput,
  context: RequestContext,
  obsidianService: ObsidianRestApiService,
): Promise<ObsidianGetLinksResponse> => {
  const { filePath } = params;

  logger.debug(`Getting links for file: ${filePath}`, context);

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
  const extractor = new LinkExtractor();
  const links = extractor.extractLinks(markdownContent);

  // Try to resolve internal links to see if they exist
  const allFiles = await obsidianService.listFiles("/", context);

  const enrichedLinks = links.map((link) => {
    if (link.type === "external") return link;

    try {
      const resolvedPath = extractor.resolveLink(link.path, filePath, allFiles);
      return {
        ...link,
        absolutePath: resolvedPath,
        exists: true,
      };
    } catch (error) {
      return {
        ...link,
        exists: false,
      };
    }
  });

  return {
    filePath,
    links: enrichedLinks,
  };
};
