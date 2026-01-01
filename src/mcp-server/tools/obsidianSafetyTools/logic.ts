import { z } from "zod";
import { ObsidianRestApiService } from "../../../services/obsidianRestAPI/index.js";
import {
  RequestContext,
  logger,
  safetyManager,
  OperationLogEntry,
} from "../../../utils/index.js";
import { config } from "../../../config/index.js";

// --- Set Write Mode ---
export const ObsidianSetWriteModeInputSchema = z.object({
  mode: z
    .enum(["off", "safe", "confirm", "full"])
    .describe("The write mode to set."),
});

export type ObsidianSetWriteModeInput = z.infer<
  typeof ObsidianSetWriteModeInputSchema
>;

export const processObsidianSetWriteMode = async (
  params: ObsidianSetWriteModeInput,
) => {
  // @ts-ignore - Dynamically updating config for current session
  config.writeMode = params.mode;
  return { message: `Write mode set to: ${params.mode}` };
};

// --- Get History ---
export const ObsidianGetHistoryInputSchema = z.object({
  hours: z
    .number()
    .optional()
    .default(24)
    .describe("Number of hours of history to retrieve."),
});

export type ObsidianGetHistoryInput = z.infer<
  typeof ObsidianGetHistoryInputSchema
>;

export const processObsidianGetHistory = async (
  params: ObsidianGetHistoryInput,
) => {
  const history = safetyManager.getHistory(params.hours);
  return { history };
};

// --- Undo ---
export const ObsidianUndoInputSchema = z.object({
  operationId: z.string().describe("The ID of the operation to undo."),
});

export type ObsidianUndoInput = z.infer<typeof ObsidianUndoInputSchema>;

export const processObsidianUndo = async (
  params: ObsidianUndoInput,
  context: RequestContext,
  obsidianService: ObsidianRestApiService,
) => {
  await safetyManager.undo(params.operationId, context, obsidianService);
  return { message: `Successfully undid operation: ${params.operationId}` };
};

// --- Emergency Stop ---
export const ObsidianEmergencyStopInputSchema = z.object({
  reason: z.string().describe("The reason for the emergency stop."),
});

export type ObsidianEmergencyStopInput = z.infer<
  typeof ObsidianEmergencyStopInputSchema
>;

export const processObsidianEmergencyStop = async (
  params: ObsidianEmergencyStopInput,
) => {
  // @ts-ignore
  config.writeMode = "off";
  logger.error(`EMERGENCY STOP TRIGGERED: ${params.reason}`);
  return { message: "EMERGENCY STOP TRIGGERED. All writes disabled." };
};
