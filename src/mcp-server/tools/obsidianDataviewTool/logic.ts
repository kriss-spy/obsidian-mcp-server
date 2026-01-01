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
  const { query, debug } = params;

  const engine = new DataviewEngine();
  const parsedQuery = engine.parse(query);

  const indexer = new VaultIndexer();
  const notesMetadata: NoteMetadata[] = [];

  if (vaultCacheService && vaultCacheService.isReady()) {
    const cache = vaultCacheService.getCache();
    for (const [path, entry] of cache.entries()) {
      notesMetadata.push(
        indexer.indexNote(path, entry.content, {
          ctime: 0,
          mtime: entry.mtime,
        }),
      );
    }
  } else {
    // Fallback: Scan files (this could be slow for large vaults)
    const allFiles = await obsidianService.listFiles("/", context);
    const mdFiles = allFiles.filter((f) => f.endsWith(".md"));

    // We only scan a limited number of files if cache is disabled to avoid timeout
    const filesToScan = mdFiles.slice(0, 100);

    for (const filePath of filesToScan) {
      try {
        const content = (await obsidianService.getFileContent(
          filePath,
          "markdown",
          context,
        )) as string;
        // Ideally we get stats too, but let's keep it simple
        notesMetadata.push(indexer.indexNote(filePath, content));
      } catch (__) {
        // Skip files that fail to read
      }
    }
  }

  const results = engine.execute(parsedQuery, notesMetadata);
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
