import { z } from "zod";
import * as fs from "fs";
import * as path from "path";
import { config } from "../../../config/index.js";
import {
  ObsidianCdpService,
  CdpEvaluator,
} from "../../../services/obsidianCdp/index.js";
import { RequestContext, logger } from "../../../utils/index.js";

export const ObsidianUiSnapshotInputSchema = z.object({
  format: z
    .enum(["tree", "screenshot", "both"])
    .optional()
    .default("both")
    .describe(
      "The format of the snapshot: 'tree' for JSON tree, 'screenshot' for PNG, or 'both'.",
    ),
  highlightSelector: z
    .string()
    .optional()
    .describe(
      "Optional CSS selector to highlight with a red border before taking the snapshot.",
    ),
});

export type ObsidianUiSnapshotInput = z.infer<
  typeof ObsidianUiSnapshotInputSchema
>;

export interface ObsidianUiSnapshotResponse {
  success: boolean;
  uiTree?: any;
  screenshotPath?: string;
  error?: string;
}

/**
 * Processes a UI Snapshot request.
 */
export const processObsidianUiSnapshot = async (
  params: ObsidianUiSnapshotInput,
  context: RequestContext,
  cdpService: ObsidianCdpService | undefined,
): Promise<ObsidianUiSnapshotResponse> => {
  const { format, highlightSelector } = params;

  if (!cdpService?.isConnected()) {
    return {
      success: false,
      error:
        "CDP not connected. UI Control requires God Mode (remote debugging port 9222).",
    };
  }

  const evaluator = new CdpEvaluator(cdpService);
  const response: ObsidianUiSnapshotResponse = { success: true };

  try {
    // 1. Highlight if requested
    if (highlightSelector) {
      await evaluator.highlightElement(highlightSelector, 3000, context);
      // Wait a bit for the highlight/scroll to complete
      await new Promise((resolve) => setTimeout(resolve, 500));
    }

    // 2. Get UI Tree
    if (format === "tree" || format === "both") {
      response.uiTree = await evaluator.getUiTree(context);
    }

    // 3. Capture Screenshot
    if (format === "screenshot" || format === "both") {
      const base64Data = await evaluator.captureScreenshot(context);

      // Save to backups/debug/
      const debugDir = path.join(process.cwd(), "backups", "debug");
      if (!fs.existsSync(debugDir)) {
        fs.mkdirSync(debugDir, { recursive: true });
      }

      const filename = `ui-snapshot-${Date.now()}.png`;
      const filePath = path.join(debugDir, filename);

      fs.writeFileSync(filePath, Buffer.from(base64Data, "base64"));
      response.screenshotPath = filePath;

      logger.info(`Screenshot saved to: ${filePath}`, context);
    }

    return response;
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
