import { z } from "zod";
import {
  ObsidianCdpService,
  CdpEvaluator,
} from "../../../services/obsidianCdp/index.js";
import { RequestContext } from "../../../utils/index.js";

export const ObsidianUiActionInputSchema = z.object({
  action: z
    .enum(["click", "double_click", "type", "hover", "scroll"])
    .describe("The UI action to perform."),
  selector: z.string().describe("CSS selector of the target element."),
  value: z.string().optional().describe("Optional value for 'type' action."),
});

export type ObsidianUiActionInput = z.infer<typeof ObsidianUiActionInputSchema>;

export interface ObsidianUiActionResponse {
  success: boolean;
  error?: string;
}

/**
 * Processes a UI Action request.
 */
export const processObsidianUiAction = async (
  params: ObsidianUiActionInput,
  context: RequestContext,
  cdpService: ObsidianCdpService | undefined,
): Promise<ObsidianUiActionResponse> => {
  const { action, selector, value } = params;

  if (!cdpService?.isConnected()) {
    return {
      success: false,
      error: "CDP not connected. UI Control requires God Mode.",
    };
  }

  const evaluator = new CdpEvaluator(cdpService);

  try {
    const result = await evaluator.executeUiAction(
      action,
      selector,
      value,
      context,
    );
    return {
      success: result.success,
      error: result.error,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
