import { z } from "zod";
import { ObsidianCdpService } from "../../../services/obsidianCdp/index.js";
import { RequestContext, requestContextService } from "../../../utils/index.js";
import {
  processObsidianDaySchedule,
  ObsidianDayScheduleResponse,
} from "../obsidianDayScheduleTool/logic.js";

export const ObsidianThreeDayPlanInputSchema = z.object({
  startDate: z
    .string()
    .optional()
    .describe("The start date (YYYY-MM-DD). Defaults to today."),
});

export type ObsidianThreeDayPlanInput = z.infer<
  typeof ObsidianThreeDayPlanInputSchema
>;

export interface ObsidianThreeDayPlanResponse {
  success: boolean;
  days: ObsidianDayScheduleResponse[];
  error?: string;
}

/**
 * Helper to add days to a date string
 */
function addDays(dateStr: string, days: number): string {
  const date = new Date(dateStr);
  date.setDate(date.getDate() + days);
  return date.toISOString().split("T")[0];
}

/**
 * Processes a request to get a 3-day planning overview.
 */
export const processObsidianThreeDayPlan = async (
  params: ObsidianThreeDayPlanInput,
  context: RequestContext,
  cdpService: ObsidianCdpService | undefined,
): Promise<ObsidianThreeDayPlanResponse> => {
  let { startDate } = params;

  if (!startDate) {
    startDate = new Date().toISOString().split("T")[0];
  }

  if (!cdpService?.isConnected()) {
    return {
      success: false,
      days: [],
      error: "CDP not connected. Requires God Mode for planning.",
    };
  }

  const daysToFetch = [startDate, addDays(startDate, 1), addDays(startDate, 2)];

  try {
    const results: ObsidianDayScheduleResponse[] = [];

    for (const date of daysToFetch) {
      const dayContext = requestContextService.createRequestContext({
        parentContext: context,
        operation: "FetchDayInThreeDayPlan",
        date,
      });

      const dayResult = await processObsidianDaySchedule(
        { date },
        dayContext,
        cdpService,
      );
      results.push(dayResult);
    }

    return {
      success: results.every((r) => r.success),
      days: results,
    };
  } catch (error) {
    return {
      success: false,
      days: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
