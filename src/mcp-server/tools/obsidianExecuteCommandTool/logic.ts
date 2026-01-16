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

export const ObsidianExecuteCommandInputSchema = z.object({
  commandId: z
    .string()
    .describe("The ID of the command to execute (e.g., 'app:go-back')."),
});

export type ObsidianExecuteCommandInput = z.infer<
  typeof ObsidianExecuteCommandInputSchema
>;

export interface ObsidianExecuteCommandResponse {
  success: boolean;
  message: string;
  source: "cdp" | "rest";
}

/**
 * Processes an Execute Command request.
 */
export const processObsidianExecuteCommand = async (
  params: ObsidianExecuteCommandInput,
  context: RequestContext,
  obsidianService: ObsidianRestApiService,
  cdpService: ObsidianCdpService | undefined,
): Promise<ObsidianExecuteCommandResponse> => {
  const { commandId } = params;

  // --- CDP Native Path (Preferred) ---
  if (cdpService?.isConnected()) {
    logger.debug(`Executing command via CDP: ${commandId}`, context);
    const evaluator = new CdpEvaluator(cdpService);
    const result = await evaluator.executeCommand(commandId, false, context);

    if (result.success) {
      return {
        success: true,
        message: `Command '${commandId}' executed successfully via native API.`,
        source: "cdp",
      };
    } else {
      logger.warning("CDP command execution failed, falling back to REST", {
        ...context,
        error: result.error,
      });
    }
  }

  // --- REST Fallback ---
  try {
    await obsidianService.executeCommand(commandId, context);
    return {
      success: true,
      message: `Command '${commandId}' executed successfully via REST API.`,
      source: "rest",
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : String(error),
      source: "rest",
    };
  }
};
