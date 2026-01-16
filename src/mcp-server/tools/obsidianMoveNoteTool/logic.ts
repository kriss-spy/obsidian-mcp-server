import path from "node:path";
import fs from "node:fs/promises";
import { z } from "zod";
import {
  ObsidianRestApiService,
  VaultCacheService,
} from "../../../services/obsidianRestAPI/index.js";
import { BaseErrorCode, McpError } from "../../../types-global/errors.js";
import {
  logger,
  RequestContext,
  safetyManager,
  defaultLinkExtractor,
} from "../../../utils/index.js";
import { processObsidianGetBacklinks } from "../obsidianGetBacklinksTool/logic.js";
import { config } from "../../../config/index.js";

// ====================================================================================
// Schema Definitions for Input Validation
// ====================================================================================

/**
 * Zod schema for validating input parameters of 'obsidian_move_note' tool.
 */
export const ObsidianMoveNoteInputSchema = z
  .object({
    /**
     * Current vault-relative path of the file to move/rename.
     * Must include file extension (e.g., "Drafts/Old Title.md").
     * Case-sensitive match is attempted first, then a case-insensitive fallback.
     */
    sourcePath: z
      .string()
      .min(1, "sourcePath cannot be empty")
      .describe(
        'Current path of the file to move (e.g., "drafts/old-title.md"). Tries case-sensitive first, then case-insensitive fallback.',
      ),
    /**
     * New vault-relative path where the file should be moved/renamed to.
     * Must include file extension (e.g., "Projects/New Title.md").
     */
    destinationPath: z
      .string()
      .min(1, "destinationPath cannot be empty")
      .describe(
        'New path for the file (e.g., "projects/new-title.md").',
      ),
  })
  .describe(
    "Input parameters for safely moving or renaming a file in the Obsidian vault. Updates all internal links automatically.",
  );

/**
 * TypeScript type inferred from the input schema.
 */
export type ObsidianMoveNoteInput = z.infer<
  typeof ObsidianMoveNoteInputSchema
>;

// ====================================================================================
// Response Type Definition
// ====================================================================================

export interface ObsidianMoveNoteResponse {
  success: boolean;
  message: string;
  backlinksUpdated: number;
  sourcePath: string;
  destinationPath: string;
}

// ====================================================================================
// Helper Functions
// ====================================================================================

/**
 * Normalizes a vault-relative path for link matching.
 * Removes .md extension and converts to lowercase for comparison.
 */
function normalizePathForLinkMatching(filePath: string): string {
  return filePath
    .replace(/\.md$/, "")
    .toLowerCase()
    .replace(/\\/g, "/"); // Convert backslashes to forward slashes
}

/**
 * Checks if a link points to the source file being moved.
 * Supports both wiki links [[path]] and markdown links [text](path).
 */
function isLinkToSourceFile(
  linkPath: string,
  sourcePathNormalized: string,
): boolean {
  // Remove heading/hash fragment if present
  const linkPathWithoutFragment = linkPath.split("#")[0];

  // Normalize for comparison
  const normalizedLink = normalizePathForLinkMatching(linkPathWithoutFragment);

  // Try different matching strategies
  // 1. Direct match
  if (normalizedLink === sourcePathNormalized) {
    return true;
  }

  // 2. Match without file extension
  const sourceWithoutExt = sourcePathNormalized.replace(/\.md$/, "");
  if (normalizedLink === sourceWithoutExt) {
    return true;
  }

  // 3. Match just the filename (last path component)
  const sourceBasename = path.posix.basename(sourceWithoutExt);
  if (normalizedLink === sourceBasename.toLowerCase()) {
    return true;
  }

  return false;
}

/**
 * Replaces a link in markdown content with the new destination.
 * Handles both wiki links [[old]] and markdown links [text](old).
 */
function replaceLinkInContent(
  content: string,
  oldLinkText: string,
  newLinkPath: string,
  linkType: "wiki" | "markdown",
): string {
  // For wiki links [[path|optional alias]]
  if (linkType === "wiki") {
    // Extract alias if present
    const linkRegex = new RegExp(
      `\\[\\[${escapeRegex(oldLinkText)}(?:\\|([^\\]]+))?\\]\\]`,
      "g"
    );
    return content.replace(linkRegex, (match, alias) => {
      if (alias) {
        return `[[${newLinkPath}|${alias}]]`;
      }
      return `[[${newLinkPath}]]`;
    });
  }

  // For markdown links [text](path)
  if (linkType === "markdown") {
    // Need to replace URL part only, keeping text
    const linkRegex = new RegExp(
      `\\[([^\\]]+)\\]\\(${escapeRegex(oldLinkText)}\\)`,
      "g"
    );
    return content.replace(linkRegex, (match, text) => {
      return `[${text}](${newLinkPath})`;
    });
  }

  return content;
}

/**
 * Escapes special regex characters.
 */
function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Gets the appropriate replacement path based on link type.
 * For wiki links: remove .md extension (Obsidian convention)
 * For markdown links: keep full path with extension
 */
function getReplacementLinkPath(
  destinationPath: string,
  linkType: "wiki" | "markdown",
): string {
  if (linkType === "wiki") {
    // Remove .md extension for wiki links
    return destinationPath.replace(/\.md$/, "");
  }
  return destinationPath;
}

/**
 * Performs a file move operation with rollback capability.
 */
async function moveFileWithRollback(
  sourceAbsolutePath: string,
  destinationAbsolutePath: string,
  context: RequestContext,
): Promise<{ success: boolean; error?: string }> {
  try {
    logger.debug(
      `Moving file: ${sourceAbsolutePath} -> ${destinationAbsolutePath}`,
      context,
    );

    // Use fs.rename() to move the file
    await fs.rename(sourceAbsolutePath, destinationAbsolutePath);

    logger.info(
      `Successfully moved file: ${sourceAbsolutePath} -> ${destinationAbsolutePath}`,
      context,
    );

    return { success: true };
  } catch (error) {
    const errorMsg =
      `Failed to move file: ${error instanceof Error ? error.message : String(error)}`;
    logger.error(errorMsg, {
      ...context,
      sourceAbsolutePath,
      destinationAbsolutePath,
      error,
    });
    return { success: false, error: errorMsg };
  }
}

// ====================================================================================
// Core Logic Function
// ====================================================================================

export const processObsidianMoveNote = async (
  params: ObsidianMoveNoteInput,
  context: RequestContext,
  obsidianService: ObsidianRestApiService,
  vaultCacheService: VaultCacheService | undefined,
): Promise<ObsidianMoveNoteResponse> => {
  const { sourcePath, destinationPath } = params;

  logger.debug(
    `Processing obsidian_move_note request: ${sourcePath} -> ${destinationPath}`,
    context,
  );

  // --- Step 0: Safety Check (use UPDATE type for move) ---
  await safetyManager.validateWrite(
    "UPDATE",
    sourcePath,
    undefined,
    context,
    obsidianService,
  );

  // --- Step 0.5: Resolve absolute paths ---
  if (!config.obsidianVaultPath) {
    throw new McpError(
      BaseErrorCode.CONFIGURATION_ERROR,
      "OBSIDIAN_VAULT_PATH is not configured. Cannot perform file system operations.",
      context,
    );
  }

  const vaultPath = config.obsidianVaultPath;
  const sourceAbsolutePath = path.resolve(vaultPath, sourcePath);
  const destinationAbsolutePath = path.resolve(vaultPath, destinationPath);

  // Verify source file exists
  try {
    await fs.access(sourceAbsolutePath, fs.constants.F_OK);
  } catch {
    throw new McpError(
      BaseErrorCode.NOT_FOUND,
      `Source file does not exist: ${sourcePath}`,
      context,
    );
  }

  // Create destination directory if it doesn't exist
  const destinationDir = path.dirname(destinationAbsolutePath);
  try {
    await fs.mkdir(destinationDir, { recursive: true });
  } catch (error) {
    logger.warning(
      `Failed to create destination directory: ${destinationDir}`,
      { ...context, error },
    );
    // Don't fail here, fs.rename() will fail if directory doesn't exist
  }

  // --- Step 1: Get all files in the vault (for link resolution) ---
  logger.debug("Fetching vault file list for link resolution", context);
  const allFiles = await obsidianService.listFiles("/", context);

  // --- Step 2: Find all backlinks to the source file ---
  logger.debug(`Finding backlinks to source file: ${sourcePath}`, context);
  const backlinksResult = await processObsidianGetBacklinks(
    { filePath: sourcePath },
    context,
    obsidianService,
    vaultCacheService,
  );

  // Store rollback data for link updates
  const linkUpdates: Array<{
    filePath: string;
    originalContent: string;
  }> = [];

  if (backlinksResult.backlinks.length === 0) {
    logger.info(
      `No backlinks found for ${sourcePath}. Proceeding with simple move.`,
      context,
    );
  } else {
    logger.info(
      `Found ${backlinksResult.backlinks.length} backlink(s) to ${sourcePath}. Updating links...`,
      context,
    );
  }

  // --- Step 3: Normalize source path for matching ---
  const sourcePathNormalized = normalizePathForLinkMatching(sourcePath);
  const destinationLinkPathWiki = getReplacementLinkPath(destinationPath, "wiki");
  const destinationLinkPathMarkdown = getReplacementLinkPath(
    destinationPath,
    "markdown",
  );

  // --- Step 4: Update each file that links to the source ---
  let filesUpdated = 0;
  const updateErrors: string[] = [];

  for (const backlink of backlinksResult.backlinks) {
    const { sourceFile } = backlink;

    try {
      logger.debug(
        `Processing backlink from: ${sourceFile}`,
        { ...context, backlinkFile: sourceFile },
      );

      // Get file content
      const content = await obsidianService.getFileContent(
        sourceFile,
        "markdown",
        context,
      );

      if (typeof content !== "string") {
        throw new Error(
          `Expected string content from ${sourceFile}, got ${typeof content}`,
        );
      }

      // Store original content for rollback
      const originalContent = content;

      // Extract all links from this file
      const links = defaultLinkExtractor.extractLinks(content);

      // Filter for links pointing to our source file (exclude external links)
      const linksToSource = links.filter((link) =>
        isLinkToSourceFile(link.path, sourcePathNormalized) &&
        link.type !== "external"
      );

      if (linksToSource.length === 0) {
        logger.debug(
          `No matching links found in ${sourceFile}`,
          { ...context, backlinkFile: sourceFile },
        );
        continue;
      }

      logger.debug(
        `Found ${linksToSource.length} link(s) to update in ${sourceFile}`,
        { ...context, backlinkFile: sourceFile, linksToSource },
      );

      // Replace each matching link (external links are filtered out)
      let updatedContent = content;
      for (const link of linksToSource) {
        // Type assertion: after filtering, link.type is only "wiki" | "markdown"
        const linkType = link.type as "wiki" | "markdown";
        const replacementPath =
          linkType === "wiki"
            ? destinationLinkPathWiki
            : destinationLinkPathMarkdown;

        logger.debug(
          `Replacing link: ${link.path} -> ${replacementPath}`,
          {
            ...context,
            backlinkFile: sourceFile,
            linkType: linkType,
            oldLink: link.path,
            newLink: replacementPath,
          },
        );

        updatedContent = replaceLinkInContent(
          updatedContent,
          link.path,
          replacementPath,
          linkType,
        );
      }

      // Store for rollback
      linkUpdates.push({
        filePath: sourceFile,
        originalContent,
      });

      // Write updated content back to file
      await obsidianService.updateFileContent(
        sourceFile,
        updatedContent,
        context,
      );

      filesUpdated++;
      logger.info(
        `Updated ${linksToSource.length} link(s) in file: ${sourceFile}`,
        { ...context, backlinkFile: sourceFile, linksCount: linksToSource.length },
      );

      // Update cache
      if (vaultCacheService) {
        await vaultCacheService.updateCacheForFile(sourceFile, context);
      }
    } catch (error) {
      const errorMsg = `Failed to update links in ${sourceFile}: ${error instanceof Error ? error.message : String(error)}`;
      logger.error(errorMsg, { ...context, backlinkFile: sourceFile, error });
      updateErrors.push(errorMsg);
    }
  }

  // --- Step 5: Check if link updates succeeded before moving file ---
  if (updateErrors.length > 0) {
    // Rollback: Restore original content for all files that were updated
    logger.warning(
      `Link updates had errors. Rolling back ${linkUpdates.length} file(s)...`,
      context,
    );

    const rollbackErrors: string[] = [];
    for (const update of linkUpdates) {
      try {
        await obsidianService.updateFileContent(
          update.filePath,
          update.originalContent,
          context,
        );
        if (vaultCacheService) {
          await vaultCacheService.updateCacheForFile(update.filePath, context);
        }
      } catch (rollbackError) {
        const rollbackErrorMsg = `Failed to rollback ${update.filePath}: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`;
        logger.error(rollbackErrorMsg, { ...context, filePath: update.filePath, error: rollbackError });
        rollbackErrors.push(rollbackErrorMsg);
      }
    }

    let finalRollbackMessage =
      `Link updates failed for ${updateErrors.length} file(s). Rolled back ${linkUpdates.length - rollbackErrors.length} file(s). No files were moved.`;
    if (rollbackErrors.length > 0) {
      finalRollbackMessage += ` Warning: ${rollbackErrors.length} file(s) could not be rolled back and may have inconsistent content.`;
    }

    throw new McpError(
      BaseErrorCode.INTERNAL_ERROR,
      finalRollbackMessage,
      context,
    );
  }

  // --- Step 6: Move file ---
  const moveResult = await moveFileWithRollback(
    sourceAbsolutePath,
    destinationAbsolutePath,
    context,
  );

  if (!moveResult.success) {
    // File move failed - rollback link updates
    logger.warning(
      `File move failed. Rolling back ${linkUpdates.length} link update(s)...`,
      context,
    );

    const rollbackErrors: string[] = [];
    for (const update of linkUpdates) {
      try {
        await obsidianService.updateFileContent(
          update.filePath,
          update.originalContent,
          context,
        );
        if (vaultCacheService) {
          await vaultCacheService.updateCacheForFile(update.filePath, context);
        }
      } catch (rollbackError) {
        const rollbackErrorMsg = `Failed to rollback ${update.filePath}: ${rollbackError instanceof Error ? rollbackError.message : String(rollbackError)}`;
        logger.error(rollbackErrorMsg, { ...context, filePath: update.filePath, error: rollbackError });
        rollbackErrors.push(rollbackErrorMsg);
      }
    }

    let finalFailureMessage =
      `File move failed: ${moveResult.error}. Rolled back ${linkUpdates.length} link update(s). No files were moved.`;
    if (rollbackErrors.length > 0) {
      finalFailureMessage += ` Warning: ${rollbackErrors.length} file(s) could not be rolled back and may have inconsistent content.`;
    }

    throw new McpError(
      BaseErrorCode.INTERNAL_ERROR,
      finalFailureMessage,
      context,
    );
  }

  // --- Step 7: Update cache for moved file ---
  if (vaultCacheService) {
    logger.debug(
      `Updating vault cache for moved file: ${destinationPath}`,
      context,
    );
    // Note: No need to update cache for sourcePath since it no longer exists
    // The cache will be updated on next refresh, or we can update it for the new path
    try {
      // Add new path to cache (best effort - don't fail the move if cache update fails)
      await vaultCacheService.updateCacheForFile(destinationPath, context);
    } catch (cacheError) {
      // Log but don't fail the entire operation if cache update fails
      logger.warning(
        `Failed to update cache for moved file, cache will be updated on next refresh: ${cacheError instanceof Error ? cacheError.message : String(cacheError)}`,
        { ...context, destinationPath, error: cacheError },
      );
    }
  }

  // --- Step 8: Return success ---
  const successMessage =
    `Successfully moved '${sourcePath}' to '${destinationPath}'. Updated ${filesUpdated} file(s) containing links to the old location.`;

  logger.info(successMessage, context);

  return {
    success: true,
    message: successMessage,
    backlinksUpdated: filesUpdated,
    sourcePath,
    destinationPath,
  };
};
