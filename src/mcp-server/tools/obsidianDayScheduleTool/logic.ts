import { z } from "zod";
import {
  ObsidianCdpService,
  CdpEvaluator,
} from "../../../services/obsidianCdp/index.js";
import { RequestContext, logger } from "../../../utils/index.js";
import {
  DayPlannerManager,
  TimeBlock,
} from "../../../utils/obsidian/dayPlanner/DayPlannerManager.js";

export const ObsidianDayScheduleInputSchema = z.object({
  date: z
    .string()
    .describe("The target date (YYYY-MM-DD) to get the schedule for."),
});

export type ObsidianDayScheduleInput = z.infer<
  typeof ObsidianDayScheduleInputSchema
>;

export interface ObsidianDayScheduleResponse {
  success: boolean;
  date: string;
  schedule: TimeBlock[];
  unscheduledTasks: any[];
  error?: string;
}

/**
 * Processes a request to get the day schedule using Dataview.
 */
export const processObsidianDaySchedule = async (
  params: ObsidianDayScheduleInput,
  context: RequestContext,
  cdpService: ObsidianCdpService | undefined,
): Promise<ObsidianDayScheduleResponse> => {
  const { date } = params;

  if (!cdpService?.isConnected()) {
    return {
      success: false,
      date,
      schedule: [],
      unscheduledTasks: [],
      error:
        "CDP not connected. Requires God Mode (remote debugging) for native Dataview access.",
    };
  }

  const evaluator = new CdpEvaluator(cdpService);

  // DQL to find tasks:
  // 1. Scheduled/Due/Started on this date
  // 2. OR physically in the daily note for this date
  const query = `
    TASK WHERE 
    (scheduled = date(${date})) OR 
    (due = date(${date})) OR 
    (start = date(${date})) OR
    (file.name = "${date}")
  `.trim();

  try {
    logger.info(`Fetching schedule for ${date} via Dataview`, context);
    const result = await evaluator.executeDataviewQuery(query, context);

    if (!result.success) {
      throw new Error(result.error || "Dataview query failed");
    }

    // Dataview TASK query returns an object with { type: 'task', values: [...] }
    const tasks = result.value?.values || [];
    const schedule: TimeBlock[] = [];
    const unscheduledTasks: any[] = [];

    tasks.forEach((task: any) => {
      const timeBlock = DayPlannerManager.parseTimeBlock(
        task.text,
        task.path,
        task.completed,
      );
      if (timeBlock) {
        schedule.push(timeBlock);
      } else {
        unscheduledTasks.push({
          text: task.text,
          path: task.path,
          completed: task.completed,
          line: task.line,
        });
      }
    });

    return {
      success: true,
      date,
      schedule: DayPlannerManager.sortBlocks(schedule),
      unscheduledTasks,
    };
  } catch (error) {
    return {
      success: false,
      date,
      schedule: [],
      unscheduledTasks: [],
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
