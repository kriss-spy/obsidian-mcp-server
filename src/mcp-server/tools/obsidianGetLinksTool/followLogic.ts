import { z } from "zod";
import { ObsidianRestApiService } from "../../../services/obsidianRestAPI/index.js";
import { RequestContext, logger, LinkExtractor } from "../../../utils/index.js";
import {
  processObsidianReadNote,
  ObsidianReadNoteResponse,
} from "../obsidianReadNoteTool/logic.js";

export const ObsidianFollowLinkInputSchema = z.object({
  sourceFile: z.string().describe("The path to the file containing the link."),
  linkText: z
    .string()
    .describe(
      "The text of the link to follow (e.g., 'Note Name' or 'Folder/Note').",
    ),
});

export type ObsidianFollowLinkInput = z.infer<
  typeof ObsidianFollowLinkInputSchema
>;

export const processObsidianFollowLink = async (
  params: ObsidianFollowLinkInput,
  context: RequestContext,
  obsidianService: ObsidianRestApiService,
): Promise<ObsidianReadNoteResponse & { resolvedPath: string }> => {
  const { sourceFile, linkText } = params;

  logger.debug(`Following link "${linkText}" from ${sourceFile}`, context);

  const extractor = new LinkExtractor();
  const allFiles = await obsidianService.listFiles("/", context);

  const resolvedPath = extractor.resolveLink(linkText, sourceFile, allFiles);

  logger.debug(`Resolved link to: ${resolvedPath}`, context);

  const readNoteResponse = await processObsidianReadNote(
    {
      filePath: resolvedPath,
      format: "markdown",
      includeStat: true,
    },
    context,
    obsidianService,
  );

  return {
    ...readNoteResponse,
    resolvedPath,
  };
};
