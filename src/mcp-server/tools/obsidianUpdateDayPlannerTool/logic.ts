import { z } from "zod";
import { ObsidianRestApiService } from "../../../services/obsidianRestAPI/index.js";
import { RequestContext, logger } from "../../../utils/index.js";
import {
  DayPlannerManager,
  TimeBlock,
} from "../../../utils/obsidian/dayPlanner/DayPlannerManager.js";

export const ObsidianUpdateDayPlannerInputSchema = z.object({
  date: z
    .string()
    .describe("The date of the daily note to update (YYYY-MM-DD)."),
  tasks: z
    .array(
      z.object({
        start: z.string().describe("Start time in HH:mm format."),
        end: z
          .string()
          .optional()
          .describe("End time in HH:mm format. Defaults to start + 30m."),
        text: z.string().describe("Task description."),
        isCompleted: z.boolean().optional().default(false),
      }),
    )
    .describe(
      "The list of time-blocked tasks to set in the Day Planner section.",
    ),
});

export type ObsidianUpdateDayPlannerInput = z.infer<
  typeof ObsidianUpdateDayPlannerInputSchema
>;

export interface ObsidianUpdateDayPlannerResponse {
  success: boolean;
  message: string;
  error?: string;
}

/**
 * Processes a request to update the Day Planner section in a daily note.
 */
export const processObsidianUpdateDayPlanner = async (
  params: ObsidianUpdateDayPlannerInput,
  context: RequestContext,
  obsidianService: ObsidianRestApiService,
): Promise<ObsidianUpdateDayPlannerResponse> => {
  const { date, tasks } = params;
  const dailyNotePath = `logs and review/daily notes/${date}.md`;

  try {
    logger.info(`Updating Day Planner in ${dailyNotePath}`, context);

    // 1. Prepare the new Day Planner content
    const sortedTasks = tasks
      .map((t) => {
        const start = t.start;
        const end = t.end || DayPlannerManager.addMinutes(start, 30);
        return {
          start,
          end,
          text: t.text,
          isCompleted: !!t.isCompleted,
          sourcePath: dailyNotePath,
          originalText: "",
        } as TimeBlock;
      })
      .sort((a, b) => a.start.localeCompare(b.start));

    const plannerLines = sortedTasks.map((t) =>
      DayPlannerManager.formatLine(t),
    );
    const newPlannerSection = `## Day planner\n\n${plannerLines.join("\n")}\n`;

    // 2. Read the existing note
    let content = "";
    try {
      content = (await obsidianService.getFileContent(
        dailyNotePath,
        "markdown",
        context,
      )) as string;
    } catch (e) {
      // If file doesn't exist, we'll create it with just the planner
      content = "---\n---\n\n## Day planner\n";
    }

    // 3. Replace or Insert the Day planner section
    const plannerHeader = "## Day planner";
    let updatedContent = "";

    if (content.includes(plannerHeader)) {
      // Find the start of the section
      const lines = content.split("\n");
      const headerIndex = lines.findIndex((l) => l.trim() === plannerHeader);

      // Find the end of the section (next header or end of file)
      let nextHeaderIndex = lines.findIndex(
        (l, i) => i > headerIndex && l.startsWith("## "),
      );
      if (nextHeaderIndex === -1) nextHeaderIndex = lines.length;

      const before = lines.slice(0, headerIndex).join("\n");
      const after = lines.slice(nextHeaderIndex).join("\n");

      updatedContent = `${before}\n${newPlannerSection}\n${after}`.trim();
    } else {
      // Insert after frontmatter or at top
      if (content.startsWith("---")) {
        const secondYamlIndex = content.indexOf("---", 3);
        if (secondYamlIndex !== -1) {
          const endOfYaml = secondYamlIndex + 3;
          updatedContent =
            `${content.substring(0, endOfYaml)}\n\n${newPlannerSection}\n${content.substring(endOfYaml)}`.trim();
        } else {
          updatedContent = `${newPlannerSection}\n${content}`.trim();
        }
      } else {
        updatedContent = `${newPlannerSection}\n${content}`.trim();
      }
    }

    // 4. Save the note
    await obsidianService.updateFileContent(
      dailyNotePath,
      updatedContent,
      context,
    );

    return {
      success: true,
      message: `Successfully updated Day Planner in ${dailyNotePath}`,
    };
  } catch (error) {
    return {
      success: false,
      message: "Failed to update Day Planner",
      error: error instanceof Error ? error.message : String(error),
    };
  }
};
