import { z } from "zod";
import { ObsidianRestApiService } from "../../../services/obsidianRestAPI/index.js";
import { RequestContext, logger } from "../../../utils/index.js";
import { processObsidianReadNote } from "../obsidianReadNoteTool/logic.js";

export const ObsidianGetSymbolsInputSchema = z.object({
  filePath: z
    .string()
    .describe("The path to the markdown file to extract symbols from."),
});

export type ObsidianGetSymbolsInput = z.infer<
  typeof ObsidianGetSymbolsInputSchema
>;

export interface ObsidianSymbol {
  name: string;
  level: number;
  lineNumber: number;
}

export interface ObsidianGetSymbolsResponse {
  filePath: string;
  symbols: ObsidianSymbol[];
}

export const processObsidianGetSymbols = async (
  params: ObsidianGetSymbolsInput,
  context: RequestContext,
  obsidianService: ObsidianRestApiService,
): Promise<ObsidianGetSymbolsResponse> => {
  const { filePath } = params;

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
  const symbols: ObsidianSymbol[] = [];
  const lines = markdownContent.split("\n");

  lines.forEach((line, index) => {
    const headingMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (headingMatch) {
      symbols.push({
        level: headingMatch[1].length,
        name: headingMatch[2].trim(),
        lineNumber: index + 1,
      });
    }
  });

  return {
    filePath,
    symbols,
  };
};
