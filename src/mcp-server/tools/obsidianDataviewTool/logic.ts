import { z } from "zod";
import { ObsidianRestApiService } from "../../../services/obsidianRestAPI/index.js";
import { VaultCacheService } from "../../../services/obsidianRestAPI/vaultCache/index.js";
import {
  ObsidianCdpService,
  CdpEvaluator,
} from "../../../services/obsidianCdp/index.js";
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
  method: z
    .enum(["dql", "dataviewjs"])
    .optional()
    .default("dql")
    .describe(
      "The query method to use. 'dql' for Dataview Query Language, 'dataviewjs' for JavaScript-based queries. Requires CDP.",
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
    parsedQuery?: any;
    executionTimeMs: number;
    filesScanned?: number;
    filesMatched?: number;
    method: string;
    source: "cdp" | "rest";
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
  cdpService: ObsidianCdpService | undefined,
): Promise<ObsidianDataviewResponse> => {
  const startTime = Date.now();
  const { query, debug, contextFilePath, method } = params;

  // --- CDP Native Path ---
  if (cdpService?.isConnected()) {
    logger.debug(
      `Executing Dataview query via CDP (method: ${method})`,
      context,
    );
    const evaluator = new CdpEvaluator(cdpService);

    let result;
    if (method === "dataviewjs") {
      // For DataviewJS, we evaluate the code directly but within the dv scope
      const dvJsCode = `
        (async () => {
          const dv = app.plugins.plugins.dataview?.api;
          if (!dv) return { success: false, error: "Dataview plugin not available" };
          
          try {
            // We wrap the user query in an async function to allow await
            const executeDvJs = async (dv) => {
              ${query}
            };
            const value = await executeDvJs(dv);
            return { success: true, value };
          } catch (e) {
            return { success: false, error: e.message };
          }
        })()
      `;
      result = await evaluator.evaluateWithSafety(dvJsCode, false, context);
    } else {
      // Standard DQL
      result = await evaluator.executeDataviewQuery(query, context);
    }

    const executionTimeMs = Date.now() - startTime;

    if (result && (result.success || result.value !== undefined)) {
      const response: ObsidianDataviewResponse = {
        results: Array.isArray(result.value) ? result.value : [result.value],
      };

      if (debug) {
        response.debugInfo = {
          executionTimeMs,
          method,
          source: "cdp",
        };
      }
      return response;
    } else {
      logger.warning("CDP Dataview query failed, falling back to REST", {
        ...context,
        error: result?.error,
      });
    }
  }

  // --- REST/Local Fallback Path ---
  if (method === "dataviewjs") {
    throw new Error("DataviewJS queries require CDP connection to Obsidian.");
  }

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
      method: "dql",
      source: "rest",
    };
  }

  return response;
};
