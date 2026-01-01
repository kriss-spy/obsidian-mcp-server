import {
  existsSync,
  mkdirSync,
  writeFileSync,
  readFileSync,
  unlinkSync,
  readdirSync,
  statSync,
} from "fs";
import path from "path";
import { config } from "../../config/index.js";
import { logger, RequestContext } from "../index.js";
import { ObsidianRestApiService } from "../../services/obsidianRestAPI/index.js";
import { BaseErrorCode, McpError } from "../../types-global/errors.js";

export interface OperationLogEntry {
  id: string;
  timestamp: number;
  action: string;
  filePath: string;
  backupPath?: string;
  previousContent?: string;
  newContent?: string;
}

/**
 * Manages data safety, write protection, and backups.
 */
export class SafetyManager {
  private logPath: string;
  private burstLimiter: Map<string, number[]> = new Map();
  private fileLimiter: Map<string, number[]> = new Map();

  constructor() {
    this.logPath = path.join(config.backupDir, ".index.json");
    this.ensureBackupDir();
  }

  private ensureBackupDir() {
    if (!existsSync(config.backupDir)) {
      mkdirSync(config.backupDir, { recursive: true });
    }
    if (!existsSync(this.logPath)) {
      writeFileSync(this.logPath, JSON.stringify([]));
    }
  }

  /**
   * Checks if a write operation is allowed and performs safety checks.
   */
  public async validateWrite(
    action: "CREATE" | "UPDATE" | "DELETE" | "PATCH",
    filePath: string,
    content: string | undefined,
    context: RequestContext,
    obsidianService: ObsidianRestApiService,
  ): Promise<void> {
    const opContext = {
      ...context,
      operation: "validateWrite",
      action,
      filePath,
    };

    // 1. Check Write Mode
    if (config.writeMode === "off") {
      throw new McpError(
        BaseErrorCode.FORBIDDEN,
        "Writes are disabled (WRITE_MODE=off)",
      );
    }

    // 2. Check Protected Patterns
    if (this.isProtected(filePath)) {
      if (config.writeMode !== "confirm" && config.writeMode !== "full") {
        throw new McpError(
          BaseErrorCode.FORBIDDEN,
          `File is protected: ${filePath}`,
        );
      }
    }

    // 3. Rate Limiting (if enabled)
    if (config.rateLimitingEnabled) {
      this.checkRateLimits(action, filePath, opContext);
    }

    // 4. Conflict Detection & Sync Awareness
    if (config.conflictDetection || config.syncAwareWrites) {
      await this.checkConflicts(filePath, opContext, obsidianService);
    }

    // 5. Create Backup
    if (
      config.backupEnabled &&
      (action === "UPDATE" || action === "DELETE" || action === "PATCH")
    ) {
      await this.createBackup(action, filePath, context, obsidianService);
    }
  }

  private isProtected(filePath: string): boolean {
    return config.protectedPatterns.some((pattern) => {
      if (pattern.endsWith("/")) return filePath.startsWith(pattern);
      if (pattern.startsWith("*")) return filePath.endsWith(pattern.slice(1));
      return filePath === pattern;
    });
  }

  private async checkConflicts(
    filePath: string,
    context: RequestContext,
    obsidianService: ObsidianRestApiService,
  ) {
    try {
      const metadata = await obsidianService.getFileMetadata(filePath, context);
      if (!metadata) return;

      const now = Date.now();
      const timeSinceModified = now - metadata.mtime;

      if (config.conflictDetection && timeSinceModified < 30000) {
        throw new McpError(
          BaseErrorCode.CONFLICT,
          `File modified ${Math.round(timeSinceModified / 1000)}s ago. Potential conflict.`,
        );
      }

      if (
        config.syncAwareWrites &&
        timeSinceModified < config.syncBufferSeconds * 1000
      ) {
        logger.warning(
          `Sync awareness: File ${filePath} modified recently (${Math.round(timeSinceModified / 1000)}s ago).`,
          context,
        );
      }
    } catch (e) {
      if (e instanceof McpError && e.code === BaseErrorCode.NOT_FOUND) return;
      throw e;
    }
  }

  private checkRateLimits(
    action: string,
    filePath: string,
    context: RequestContext,
  ) {
    const now = Date.now();

    // Burst Protection (3 writes per 10s)
    const burst = this.burstLimiter.get(filePath) || [];
    const recentBurst = burst.filter((t) => now - t < 10000);
    if (recentBurst.length >= 3)
      throw new McpError(
        BaseErrorCode.RATE_LIMITED,
        "Burst limit reached for this file.",
      );
    recentBurst.push(now);
    this.burstLimiter.set(filePath, recentBurst);

    // Per-file limit (3 writes per hour)
    const file = this.fileLimiter.get(filePath) || [];
    const recentFile = file.filter((t) => now - t < 3600000);
    if (recentFile.length >= 3)
      throw new McpError(
        BaseErrorCode.RATE_LIMITED,
        "Hourly limit reached for this file.",
      );
    recentFile.push(now);
    this.fileLimiter.set(filePath, recentFile);
  }

  private async createBackup(
    action: string,
    filePath: string,
    context: RequestContext,
    obsidianService: ObsidianRestApiService,
  ) {
    try {
      const content = (await obsidianService.getFileContent(
        filePath,
        "markdown",
        context,
      )) as string;
      const timestamp = Date.now();
      const safeName = filePath.replace(/\//g, "_");
      const backupFileName = `${safeName}_${timestamp}.md.bak`;
      const backupPath = path.join(config.backupDir, backupFileName);

      writeFileSync(backupPath, content);

      this.logOperation({
        id: `op_${timestamp}`,
        timestamp,
        action,
        filePath,
        backupPath: backupFileName,
      });
    } catch (e) {
      logger.error(`Failed to create backup for ${filePath}: ${e}`, context);
    }
  }

  private logOperation(entry: OperationLogEntry) {
    const logs = JSON.parse(
      readFileSync(this.logPath, "utf-8"),
    ) as OperationLogEntry[];
    logs.push(entry);

    // Cleanup old logs
    const now = Date.now();
    const filteredLogs = logs.filter(
      (l) => now - l.timestamp < config.operationLogRetentionDays * 86400000,
    );

    writeFileSync(this.logPath, JSON.stringify(filteredLogs, null, 2));
  }

  public getHistory(hours: number): OperationLogEntry[] {
    const logs = JSON.parse(
      readFileSync(this.logPath, "utf-8"),
    ) as OperationLogEntry[];
    const now = Date.now();
    const windowMs = Math.min(hours, config.agentQueryWindowHours) * 3600000;
    return logs.filter((l) => now - l.timestamp < windowMs);
  }

  public async undo(
    operationId: string,
    context: RequestContext,
    obsidianService: ObsidianRestApiService,
  ): Promise<void> {
    const logs = JSON.parse(
      readFileSync(this.logPath, "utf-8"),
    ) as OperationLogEntry[];
    const entry = logs.find((l) => l.id === operationId);

    if (!entry || !entry.backupPath)
      throw new Error("Operation not found or no backup available.");

    const backupFilePath = path.join(config.backupDir, entry.backupPath);
    if (!existsSync(backupFilePath)) throw new Error("Backup file missing.");

    const content = readFileSync(backupFilePath, "utf-8");
    await obsidianService.updateFileContent(entry.filePath, content, context);

    logger.info(
      `Successfully undid operation ${operationId} for ${entry.filePath}`,
      context,
    );
  }
}

export const safetyManager = new SafetyManager();
