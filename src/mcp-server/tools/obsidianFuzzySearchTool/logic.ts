/**
 * @fileoverview Core logic for the 'obsidian_fuzzy_search_notes' tool.
 * This module implements fuzzy file name matching similar to Obsidian's Quick Switcher,
 * enabling agents to find files with partial or ambiguous queries.
 * @module src/mcp-server/tools/obsidianFuzzySearchTool/logic
 */

import path from "node:path/posix";
import { z } from "zod";
import fuzzysort from "fuzzysort";
import { ObsidianRestApiService } from "../../../services/obsidianRestAPI/index.js";
import { VaultCacheService } from "../../../services/obsidianRestAPI/vaultCache/index.js";
import { BaseErrorCode, McpError } from "../../../types-global/errors.js";
import { logger, RequestContext } from "../../../utils/index.js";

// ====================================================================================
// Schema Definitions for Input Validation
// ====================================================================================

/**
 * Zod schema for validating the input parameters of the 'obsidian_fuzzy_search_notes' tool.
 */
export const ObsidianFuzzySearchInputSchema = z
  .object({
    /**
     * The fuzzy search query string (e.g., "dailynote", "proj det").
     * Can be partial matches, subsequences, or have typos.
     */
    query: z
      .string()
      .describe(
        'The fuzzy search query string (e.g., "dailynote", "proj det"). Supports partial matches, subsequences, and typos.',
      ),

    /**
     * Maximum number of results to return (default: 5).
     */
    maxResults: z
      .number()
      .int()
      .positive()
      .optional()
      .default(5)
      .describe("Maximum number of results to return. Defaults to 5."),

    /**
     * Optional vault-relative path to limit search scope.
     */
    searchInPath: z
      .string()
      .optional()
      .describe(
        'Optional vault-relative path to limit search scope (e.g., "projects/"). If omitted, searches entire vault.',
      ),

    /**
     * Whether to include file extensions in matching (default: false).
     * When false, strips .md extension before matching to match Obsidian behavior.
     */
    includeExtension: z
      .boolean()
      .optional()
      .default(false)
      .describe(
        "Whether to include file extensions in matching. Defaults to false (strips .md like Obsidian).",
      ),

    /**
     * Minimum score threshold for matches (fuzzysort scoring: higher is better).
     * Default: -10000 (permissive, like Obsidian Quick Switcher).
     */
    scoreThreshold: z
      .number()
      .optional()
      .default(-10000)
      .describe(
        "Minimum score threshold for matches. Default: -10000 (permissive, Obsidian-like).",
      ),
  })
  .describe(
    "Input parameters for fuzzy searching notes by filename, similar to Obsidian's Quick Switcher.",
  );

/**
 * TypeScript type inferred from the input schema.
 */
export type ObsidianFuzzySearchInput = z.infer<
  typeof ObsidianFuzzySearchInputSchema
>;

// ====================================================================================
// Response & Internal Type Definitions
// ====================================================================================

/**
 * Match type classification based on how the query matched the filename.
 */
export type MatchType =
  | "exact"
  | "prefix"
  | "word-boundary"
  | "subsequence"
  | "fuzzy";

/**
 * Individual match result.
 */
export interface FuzzyMatchResult {
  /** Full vault-relative path to the file */
  path: string;
  /** Filename without extension (unless includeExtension is true) */
  filename: string;
  /** Raw score from fuzzysort (higher is better) */
  score: number;
  /** Normalized score in 0-1 range for easier interpretation */
  normalizedScore: number;
  /** Classification of match type */
  matchType: MatchType;
}

/**
 * Complete response structure for the fuzzy search tool.
 */
export interface ObsidianFuzzySearchResponse {
  success: boolean;
  message: string;
  query: string;
  matches: FuzzyMatchResult[];
  totalMatches: number;
  executionTimeMs: number;
  cacheUsed: boolean;
}

/**
 * Internal structure for preparing files for fuzzy searching.
 */
interface SearchTarget {
  path: string;
  filename: string;
  filenameNoExt: string;
  dirname: string;
}

// ====================================================================================
// Helper Functions
// ====================================================================================

/**
 * Prepares file list for fuzzy searching by extracting relevant components.
 */
function prepareSearchTargets(
  files: string[],
  searchInPath: string | undefined,
  includeExtension: boolean,
): SearchTarget[] {
  return files
    .filter((file) => {
      // Filter by path if specified
      if (searchInPath && !file.startsWith(searchInPath)) {
        return false;
      }
      // Only include markdown files
      return file.endsWith(".md");
    })
    .map((filePath) => {
      const filename = path.basename(filePath);
      const filenameNoExt = path.basename(filePath, ".md");
      const dirname = path.dirname(filePath);

      return {
        path: filePath,
        filename: includeExtension ? filename : filenameNoExt,
        filenameNoExt,
        dirname,
      };
    });
}

/**
 * Classifies the match type based on query and matched filename.
 */
function classifyMatchType(
  query: string,
  filename: string,
  score: number,
): MatchType {
  const q = query.toLowerCase();
  const f = filename.toLowerCase();

  // Exact match
  if (f === q) {
    return "exact";
  }

  // Prefix match
  if (f.startsWith(q)) {
    return "prefix";
  }

  // Word boundary match (query starts a word in filename)
  const wordBoundaryRegex = new RegExp(`\\b${q}`, "i");
  if (wordBoundaryRegex.test(filename)) {
    return "word-boundary";
  }

  // Subsequence match (all characters present in order)
  if (isSubsequence(q, f)) {
    return "subsequence";
  }

  // Otherwise, it's a fuzzy match
  return "fuzzy";
}

/**
 * Checks if query is a subsequence of target (all chars present in order).
 */
function isSubsequence(query: string, target: string): boolean {
  let queryIdx = 0;
  let targetIdx = 0;

  while (queryIdx < query.length && targetIdx < target.length) {
    if (query[queryIdx].toLowerCase() === target[targetIdx].toLowerCase()) {
      queryIdx++;
    }
    targetIdx++;
  }

  return queryIdx === query.length;
}

/**
 * Normalizes fuzzysort score to 0-1 range.
 * fuzzysort scores range from negative (poor) to positive (excellent).
 * Higher scores are better.
 */
function normalizeScore(score: number): number {
  // fuzzysort typical range: -10000 (poor) to 1000+ (excellent)
  // We map this to 0-1 range with a sigmoid-like function
  // Good matches (score > 0) get mapped to 0.7-1.0
  // Okay matches (score -5000 to 0) get mapped to 0.4-0.7
  // Poor matches (score < -5000) get mapped to 0.0-0.4

  if (score >= 0) {
    // Excellent matches: 0.7-1.0
    return 0.7 + Math.min(score / 1000, 0.3);
  } else if (score >= -5000) {
    // Okay matches: 0.4-0.7
    return 0.4 + ((score + 5000) / 5000) * 0.3;
  } else {
    // Poor matches: 0.0-0.4
    return Math.max(0, 0.4 + score / 12500);
  }
}

/**
 * Custom scoring function to prioritize matches in filename over path.
 * Mimics Obsidian's Quick Switcher behavior.
 */
function calculateObsidianLikeScore(
  result: any,
  target: SearchTarget,
  query: string,
): number {
  let score = result.score;
  const targetText = result[0]?.target || "";

  // Bonus for exact matches
  if (targetText.toLowerCase() === query.toLowerCase()) {
    score += 10000;
  }

  // Bonus for prefix matches
  if (targetText.toLowerCase().startsWith(query.toLowerCase())) {
    score += 5000;
  }

  // Bonus for matches at word boundaries
  const queryLower = query.toLowerCase();
  const targetLower = targetText.toLowerCase();
  if (targetLower.includes(` ${queryLower}`) || targetLower.includes(`-${queryLower}`)) {
    score += 2000;
  }

  return score;
}

// ====================================================================================
// Core Logic Function
// ====================================================================================

/**
 * Processes the fuzzy search request to find matching notes.
 */
export const processObsidianFuzzySearch = async (
  params: ObsidianFuzzySearchInput,
  context: RequestContext,
  obsidianService: ObsidianRestApiService,
  vaultCacheService: VaultCacheService | undefined,
): Promise<ObsidianFuzzySearchResponse> => {
  const startTime = Date.now();
  const { query, maxResults, searchInPath, includeExtension, scoreThreshold } =
    params;

  logger.debug(`Processing fuzzy search for query: "${query}"`, {
    ...context,
    params,
  });

  // Handle empty query
  if (!query || query.trim() === "") {
    logger.debug("Empty query provided, returning empty results", context);
    return {
      success: true,
      message: "Empty query provided",
      query: query,
      matches: [],
      totalMatches: 0,
      executionTimeMs: Date.now() - startTime,
      cacheUsed: false,
    };
  }

  try {
    let allFiles: string[];
    let cacheUsed = false;

    // Step 1: Get file list (prefer cache for performance)
    if (vaultCacheService && vaultCacheService.isReady()) {
      cacheUsed = true;
      const cache = vaultCacheService.getCache();
      allFiles = Array.from(cache.keys());
      logger.debug(`Using cache, found ${allFiles.length} files`, context);
    } else {
      // Fallback: Fetch from API
      logger.debug("Cache not available, fetching files via API", context);
      allFiles = await getAllFilesRecursive(obsidianService, "/", context);
      logger.debug(`Fetched ${allFiles.length} files via API`, context);
    }

    // Step 2: Prepare search targets
    const searchTargets = prepareSearchTargets(
      allFiles,
      searchInPath,
      includeExtension,
    );

    if (searchTargets.length === 0) {
      logger.debug("No files to search", context);
      return {
        success: true,
        message: "No files found in search scope",
        query: query,
        matches: [],
        totalMatches: 0,
        executionTimeMs: Date.now() - startTime,
        cacheUsed,
      };
    }

    // Step 3: Perform fuzzy search with fuzzysort
    const fuzzysortResults = fuzzysort.go(query, searchTargets, {
      keys: ["filename"],
      limit: maxResults,
      threshold: scoreThreshold,
      all: false, // Don't return non-matches
    });

    // Step 4: Process results
    const matches: FuzzyMatchResult[] = fuzzysortResults.map((result) => {
      const target = result.obj;
      const rawScore = result.score;
      const enhancedScore = calculateObsidianLikeScore(result, target, query);

      return {
        path: target.path,
        filename: target.filename,
        score: enhancedScore,
        normalizedScore: normalizeScore(enhancedScore),
        matchType: classifyMatchType(query, target.filename, enhancedScore),
      };
    });

    // Sort by enhanced score (descending)
    matches.sort((a, b) => b.score - a.score);

    const executionTime = Date.now() - startTime;

    logger.debug(
      `Fuzzy search completed: ${matches.length} matches in ${executionTime}ms`,
      context,
    );

    return {
      success: true,
      message: `Found ${matches.length} matches for query "${query}"`,
      query: query,
      matches: matches.slice(0, maxResults), // Ensure we respect maxResults
      totalMatches: matches.length,
      executionTimeMs: executionTime,
      cacheUsed,
    };
  } catch (error) {
    if (error instanceof McpError) {
      logger.error(
        `McpError during fuzzy search: ${error.message}`,
        error,
        context,
      );
      throw error;
    }

    const errorMessage = `Unexpected error during fuzzy search for "${query}"`;
    logger.error(
      errorMessage,
      error instanceof Error ? error : undefined,
      context,
    );
    throw new McpError(
      BaseErrorCode.INTERNAL_ERROR,
      `${errorMessage}: ${error instanceof Error ? error.message : String(error)}`,
      context,
    );
  }
};

/**
 * Helper function to recursively get all files from the vault.
 */
async function getAllFilesRecursive(
  obsidianService: ObsidianRestApiService,
  dirPath: string,
  context: RequestContext,
): Promise<string[]> {
  const allFiles: string[] = [];

  async function traverse(currentPath: string): Promise<void> {
    const entries = await obsidianService.listFiles(currentPath, context);

    for (const entry of entries) {
      const fullPath = path.join(currentPath, entry);

      if (entry.endsWith("/")) {
        // It's a directory, recurse
        await traverse(fullPath);
      } else {
        // It's a file, add to list
        allFiles.push(fullPath);
      }
    }
  }

  await traverse(dirPath);
  return allFiles;
}
