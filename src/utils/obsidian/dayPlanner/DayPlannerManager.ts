/**
 * @module DayPlannerManager
 * @description Utilities for parsing and managing time-blocked schedules in Obsidian
 */

export interface TimeBlock {
  start: string; // HH:mm
  end: string; // HH:mm
  text: string;
  originalText: string;
  sourcePath: string;
  isCompleted: boolean;
}

export class DayPlannerManager {
  private static TIME_RANGE_REGEX = /(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})/;
  private static START_TIME_REGEX = /(?<!-)\b(\d{1,2}:\d{2})\b(?! -)/;

  /**
   * Parse a task line to extract time information
   */
  public static parseTimeBlock(
    text: string,
    sourcePath: string,
    isCompleted: boolean = false,
  ): TimeBlock | null {
    // 1. Try to match HH:mm - HH:mm
    const rangeMatch = text.match(this.TIME_RANGE_REGEX);
    if (rangeMatch) {
      const start = this.normalizeTime(rangeMatch[1]);
      const end = this.normalizeTime(rangeMatch[2]);
      const cleanText = text.replace(this.TIME_RANGE_REGEX, "").trim();
      return {
        start,
        end,
        text: cleanText,
        originalText: text,
        sourcePath,
        isCompleted,
      };
    }

    // 2. Try to match HH:mm (Start only)
    const startMatch = text.match(this.START_TIME_REGEX);
    if (startMatch) {
      const start = this.normalizeTime(startMatch[1]);
      const end = this.addMinutes(start, 30);
      const cleanText = text.replace(this.START_TIME_REGEX, "").trim();
      return {
        start,
        end,
        text: cleanText,
        originalText: text,
        sourcePath,
        isCompleted,
      };
    }

    return null;
  }

  /**
   * Normalize time to HH:mm format
   */
  private static normalizeTime(time: string): string {
    let [hours, minutes] = time.split(":").map(Number);
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  /**
   * Add minutes to a time string
   */
  public static addMinutes(time: string, minutesToAdd: number): string {
    let [hours, minutes] = time.split(":").map(Number);
    minutes += minutesToAdd;
    hours += Math.floor(minutes / 60);
    minutes = minutes % 60;
    hours = hours % 24;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  /**
   * Sort time blocks chronologically
   */
  public static sortBlocks(blocks: TimeBlock[]): TimeBlock[] {
    return [...blocks].sort((a, b) => a.start.localeCompare(b.start));
  }

  /**
   * Format a block back to a Day Planner markdown line
   */
  public static formatLine(block: TimeBlock): string {
    const status = block.isCompleted ? "x" : " ";
    return `- [${status}] ${block.start} - ${block.end} ${block.text}`;
  }
}
