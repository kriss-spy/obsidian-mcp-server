import { exec } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, unlink, readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { logger, RequestContext } from "../index.js";

const execAsync = promisify(exec);

export interface MermaidValidationResult {
  valid: boolean;
  error?: string;
  svg?: string;
}

/**
 * Utility class for validating Mermaid diagram syntax using the mermaid-cli.
 */
export class MermaidValidator {
  /**
   * Validates a mermaid diagram string.
   * @param diagram The mermaid diagram code.
   * @param context Request context for logging.
   * @returns A result object indicating if it's valid and including the SVG if successful.
   */
  public async validate(
    diagram: string,
    context?: RequestContext,
  ): Promise<MermaidValidationResult> {
    const tempDir = os.tmpdir();
    const tempInputPath = path.join(tempDir, `mermaid-input-${Date.now()}.mmd`);
    const tempOutputPath = path.join(
      tempDir,
      `mermaid-output-${Date.now()}.svg`,
    );

    try {
      // 1. Write the diagram to a temporary file
      await writeFile(tempInputPath, diagram);

      // 2. Run the mermaid CLI (mmdc)
      // -i: input file
      // -o: output file (generates SVG by default)
      // -t: theme
      const command = `mmdc -i ${tempInputPath} -o ${tempOutputPath} -t neutral`;

      logger.debug(`Running mermaid validation: ${command}`, context);

      await execAsync(command);

      // 3. If successful, read the generated SVG
      const svg = await readFile(tempOutputPath, "utf-8");

      return {
        valid: true,
        svg,
      };
    } catch (error: any) {
      logger.debug(`Mermaid validation failed: ${error.message}`, context);

      return {
        valid: false,
        error: error.stderr || error.message || "Unknown validation error",
      };
    } finally {
      // 4. Clean up temporary files
      try {
        await unlink(tempInputPath);
        await unlink(tempOutputPath);
      } catch (__) {
        // Ignore cleanup errors
      }
    }
  }
}

export const defaultMermaidValidator = new MermaidValidator();
