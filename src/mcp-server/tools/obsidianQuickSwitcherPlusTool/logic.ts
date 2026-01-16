import { z } from "zod";
import {
  ObsidianCdpService,
  CdpEvaluator,
} from "../../../services/obsidianCdp/index.js";
import { RequestContext, logger } from "../../../utils/index.js";

export const ObsidianQuickSwitcherPlusInputSchema = z.object({
  query: z
    .string()
    .describe(
      "The search query. Can include prefixes: '#' for headings, '>' for commands, '$' for symbols, or plain text for files.",
    ),
  selectFirst: z
    .boolean()
    .optional()
    .default(false)
    .describe("Whether to automatically select and open the first result."),
});

export type ObsidianQuickSwitcherPlusInput = z.infer<
  typeof ObsidianQuickSwitcherPlusInputSchema
>;

export interface QuickSwitcherResult {
  title: string;
  note?: string;
  content: string;
}

export interface ObsidianQuickSwitcherPlusResponse {
  success: boolean;
  mode: string;
  results: QuickSwitcherResult[];
  error?: string;
}

/**
 * Processes a Quick Switcher++ request.
 */
export const processObsidianQuickSwitcherPlus = async (
  params: ObsidianQuickSwitcherPlusInput,
  context: RequestContext,
  cdpService: ObsidianCdpService | undefined,
): Promise<ObsidianQuickSwitcherPlusResponse> => {
  const { query, selectFirst } = params;

  if (!cdpService?.isConnected()) {
    return {
      success: false,
      mode: "unknown",
      results: [],
      error: "CDP not connected. Requires God Mode.",
    };
  }

  const evaluator = new CdpEvaluator(cdpService);
  let mode = "Standard (Files)";
  let commandId = "darlal-switcher-plus:switcher-plus:open";
  let searchText = query;

  // Detect Mode based on prefix
  if (query.startsWith("#")) {
    mode = "Headings";
    commandId = "darlal-switcher-plus:switcher-plus:open-headings";
    searchText = query.substring(1);
  } else if (query.startsWith(">")) {
    mode = "Commands";
    commandId = "darlal-switcher-plus:switcher-plus:open-commands";
    searchText = query.substring(1);
  } else if (query.startsWith("$")) {
    mode = "Symbols (Active Editor)";
    commandId = "darlal-switcher-plus:switcher-plus:open-symbols-active";
    searchText = query.substring(1);
  }

  try {
    logger.info(`Opening Quick Switcher++ in ${mode} mode`, context);
    await evaluator.executeCommand(commandId, false, context);

    // Wait for UI to render
    await new Promise((r) => setTimeout(r, 400));

    // Type the search text
    if (searchText) {
      logger.debug(`Typing search text: ${searchText}`, context);
      const typeResult = await evaluator.executeUiAction(
        "type",
        ".prompt-input",
        searchText,
        context,
      );
      if (!typeResult.success)
        throw new Error(typeResult.error || "Failed to type into switcher");

      // Wait for fuzzy filtering
      await new Promise((r) => setTimeout(r, 800));
    }

    // Extract Results
    const results = await cdpService.evaluate(
      `
      Array.from(document.querySelectorAll('.suggestion-item'))
        .map(el => ({
          title: el.querySelector('.suggestion-title')?.innerText || '',
          note: el.querySelector('.suggestion-note')?.innerText || '',
          content: el.innerText.replace(/\\n/g, ' | ')
        }))
    `,
      context,
    );

    // Optional: Select First
    if (selectFirst && results && results.length > 0) {
      logger.info("Opening first suggestion", context);
      await evaluator.executeUiAction(
        "click",
        ".suggestion-item.is-selected",
        undefined,
        context,
      );
    }

    return {
      success: true,
      mode,
      results: results || [],
    };
  } catch (error) {
    return {
      success: false,
      mode,
      results: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
