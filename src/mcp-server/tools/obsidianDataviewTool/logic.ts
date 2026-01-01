import { z } from "zod";
import { ObsidianRestApiService } from "../../../services/obsidianRestAPI/index.js";
import { VaultCacheService } from "../../../services/obsidianRestAPI/vaultCache/index.js";
import {
  RequestContext,
  logger,
  VaultIndexer,
  DataviewEngine,
  NoteMetadata,
} from "../../../utils/index.js";

export const ObsidianDataviewInputSchema = z.object({
  query: z
    .string()
    .describe(
      'The Dataview query to execute (e.g., \'LIST FROM "" WHERE field = "value"\').',
    ),
  contextFilePath: z
    .string()
    .optional()
    .describe(
      "The path to the note where the query is located (for 'this' context).",
    ),
  debug: z
    .boolean()
    .optional()
    .default(false)
    .describe("Include debug information in the response."),
});

export type ObsidianDataviewInput = z.infer<typeof ObsidianDataviewInputSchema>;

export interface ObsidianDataviewResponse {
  results: any[];
  debugInfo?: {
    parsedQuery: any;
    executionTimeMs: number;
    filesScanned: number;
    filesMatched: number;
  };
}

/**
 * Processes a Dataview query request.
 */
export const processObsidianDataview = async (
  params: ObsidianDataviewInput,
  context: RequestContext,
  obsidianService: ObsidianRestApiService,
  vaultCacheService: VaultCacheService | undefined,
): Promise<ObsidianDataviewResponse> => {
  const startTime = Date.now();
  const { query, debug, contextFilePath } = params;

  const engine = new DataviewEngine();
  const parsedQuery = engine.parse(query);

  const indexer = new VaultIndexer();
  const notesMetadata: NoteMetadata[] = [];
  let contextNote: NoteMetadata | undefined;

  if (vaultCacheService && vaultCacheService.isReady()) {
    const cache = vaultCacheService.getCache();
    for (const [path, entry] of cache.entries()) {
      const metadata = indexer.indexNote(path, entry.content, {
        ctime: 0,
        mtime: entry.mtime,
      });
      notesMetadata.push(metadata);
      if (contextFilePath && path === contextFilePath) {
        contextNote = metadata;
      }
    }
  } else {
    // Fallback: Scan files
    const allFiles = await obsidianService.listFiles("/", context);
    const mdFiles = allFiles.filter((f) => f.endsWith(".md"));

    // Scan context note if provided
    if (contextFilePath && mdFiles.includes(contextFilePath)) {
      try {
        const content = (await obsidianService.getFileContent(
          contextFilePath,
          "markdown",
          context,
        )) as string;
        contextNote = indexer.indexNote(contextFilePath, content);
      } catch (__) {}
    }

    // Scan a limited number of files
    const filesToScan = mdFiles.slice(0, 100);

    for (const filePath of filesToScan) {
      try {
        if (filePath === contextFilePath) {
          if (contextNote) notesMetadata.push(contextNote);
          continue;
        }
        const content = (await obsidianService.getFileContent(
          filePath,
          "markdown",
          context,
        )) as string;
        notesMetadata.push(indexer.indexNote(filePath, content));
      } catch (__) {}
    }
  }

  const results = engine.execute(parsedQuery, notesMetadata, contextNote);
  const executionTimeMs = Date.now() - startTime;

  const response: ObsidianDataviewResponse = {
    results,
  };

  if (debug) {
    response.debugInfo = {
      parsedQuery,
      executionTimeMs,
      filesScanned: notesMetadata.length,
      filesMatched: results.length,
    };
  }

  return response;
};
