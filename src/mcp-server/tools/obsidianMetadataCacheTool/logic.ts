import { z } from "zod";
import { ObsidianRestApiService } from "../../../services/obsidianRestAPI/index.js";
import {
  ObsidianCdpService,
  CdpEvaluator,
} from "../../../services/obsidianCdp/index.js";
import {
  RequestContext,
  logger,
  requestContextService,
} from "../../../utils/index.js";

export const ObsidianMetadataCacheInputSchema = z.object({
  includeUnresolved: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether to include a detailed list of unresolved links."),
});

export type ObsidianMetadataCacheInput = z.infer<
  typeof ObsidianMetadataCacheInputSchema
>;

export interface ObsidianMetadataCacheResponse {
  success: boolean;
  data?: {
    fileCount: number;
    tagCount: number;
    tags: string[];
    linkCount: number;
    unresolvedLinkCount: number;
    unresolvedLinks?: Record<string, Record<string, number>>;
  };
  error?: string;
  source: "cdp" | "rest-mock";
}

/**
 * Processes a Metadata Cache request.
 */
export const processObsidianMetadataCache = async (
  params: ObsidianMetadataCacheInput,
  context: RequestContext,
  obsidianService: ObsidianRestApiService,
  cdpService: ObsidianCdpService | undefined,
): Promise<ObsidianMetadataCacheResponse> => {
  const { includeUnresolved } = params;

  // --- CDP Native Path ---
  if (cdpService?.isConnected()) {
    logger.debug("Accessing metadata cache via CDP", context);
    const evaluator = new CdpEvaluator(cdpService);
    const result = await evaluator.getMetadataCache(context);

    if (result.success) {
      const data = result.value;
      if (!includeUnresolved) {
        delete data.unresolvedLinks;
      }

      return {
        success: true,
        data,
        source: "cdp",
      };
    } else {
      logger.warning("CDP Metadata Cache access failed", {
        ...context,
        error: result.error,
      });
    }
  }

  // --- REST Fallback (Limited) ---
  logger.debug(
    "CDP unavailable, using REST fallback for metadata cache",
    context,
  );
  try {
    const tags = await obsidianService.listTags(context);
    const files = await obsidianService.listFiles("/", context);
    const mdFiles = files.filter((f) => f.endsWith(".md"));

    return {
      success: true,
      data: {
        fileCount: mdFiles.length,
        tagCount: tags.length,
        tags: tags.sort(),
        linkCount: 0, // Cannot easily get vault-wide link count via REST
        unresolvedLinkCount: 0,
      },
      source: "rest-mock",
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      source: "rest-mock",
    };
  }
};
