import { z } from "zod";
import path from "node:path/posix";
import { ObsidianRestApiService } from "../../../services/obsidianRestAPI/index.js";
import { VaultCacheService } from "../../../services/obsidianRestAPI/vaultCache/index.js";
import {
  RequestContext,
  logger,
  LinkExtractor,
  ObsidianLink,
} from "../../../utils/index.js";

export const ObsidianGetBacklinksInputSchema = z.object({
  filePath: z.string().describe("The path to the file to find backlinks for."),
});

export type ObsidianGetBacklinksInput = z.infer<
  typeof ObsidianGetBacklinksInputSchema
>;

export interface BacklinkResult {
  sourceFile: string;
  linkText: string;
  lineNumber: number;
  context: string;
}

export interface ObsidianGetBacklinksResponse {
  filePath: string;
  backlinks: BacklinkResult[];
  cacheUsed: boolean;
}

/**
 * Processes a request to find all backlinks to a specified file.
 */
export const processObsidianGetBacklinks = async (
  params: ObsidianGetBacklinksInput,
  context: RequestContext,
  obsidianService: ObsidianRestApiService,
  vaultCacheService: VaultCacheService | undefined,
): Promise<ObsidianGetBacklinksResponse> => {
  const { filePath } = params;
  const extractor = new LinkExtractor();
  const backlinks: BacklinkResult[] = [];
  let cacheUsed = false;

  logger.debug(`Finding backlinks for: ${filePath}`, context);

  // Normalize target file path (remove extension for matching wiki-links)
  const targetFile = filePath.endsWith(".md") ? filePath : `${filePath}.md`;
  const targetNameNoExt = path.basename(targetFile, ".md");

  if (vaultCacheService && vaultCacheService.isReady()) {
    cacheUsed = true;
    const cache = vaultCacheService.getCache();
    const allFiles = Array.from(cache.keys());

    for (const [sourceFile, entry] of cache.entries()) {
      if (sourceFile === targetFile) continue;

      const links = extractor.extractLinks(entry.content);
      for (const link of links) {
        if (link.type === "external") continue;

        try {
          const resolvedPath = extractor.resolveLink(
            link.path,
            sourceFile,
            allFiles,
          );
          if (resolvedPath === targetFile) {
            backlinks.push({
              sourceFile,
              linkText: link.text,
              lineNumber: link.lineNumber,
              context: link.context,
            });
          }
        } catch (__) {
          // Check for partial match if resolution fails but it looks like a match
          if (link.path === targetNameNoExt || link.path === targetFile) {
            backlinks.push({
              sourceFile,
              linkText: link.text,
              lineNumber: link.lineNumber,
              context: link.context,
            });
          }
        }
      }
    }
  } else {
    // Fallback: Scan all files via API (slower)
    logger.info(
      `Cache not available, scanning vault via API for backlinks to: ${filePath}`,
      context,
    );
    const allFiles = await obsidianService.listFiles("/", context);

    // We only scan markdown files
    const mdFiles = allFiles.filter((f) => f.endsWith(".md"));

    for (const sourceFile of mdFiles) {
      if (sourceFile === targetFile) continue;

      const content = (await obsidianService.getFileContent(
        sourceFile,
        "markdown",
        context,
      )) as string;
      const links = extractor.extractLinks(content);

      for (const link of links) {
        if (link.type === "external") continue;

        try {
          const resolvedPath = extractor.resolveLink(
            link.path,
            sourceFile,
            allFiles,
          );
          if (resolvedPath === targetFile) {
            backlinks.push({
              sourceFile,
              linkText: link.text,
              lineNumber: link.lineNumber,
              context: link.context,
            });
          }
        } catch (__) {
          if (link.path === targetNameNoExt || link.path === targetFile) {
            backlinks.push({
              sourceFile,
              linkText: link.text,
              lineNumber: link.lineNumber,
              context: link.context,
            });
          }
        }
      }
    }
  }

  return {
    filePath: targetFile,
    backlinks,
    cacheUsed,
  };
};
