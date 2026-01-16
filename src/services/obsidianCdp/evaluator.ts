/**
 * @module CdpEvaluator
 * @description Safe JavaScript evaluation wrapper for CDP with error handling and safety checks
 */

import { config } from "../../config/index.js";
import { BaseErrorCode, McpError } from "../../types-global/errors.js";
import {
  logger,
  RequestContext,
  requestContextService,
} from "../../utils/index.js";
import { SafetyManager } from "../../utils/security/SafetyManager.js";
import { ObsidianCdpService } from "./service.js";

/**
 * CdpEvaluationResult - Structured result from CDP evaluation
 */
export interface CdpEvaluationResult<T = any> {
  success: boolean;
  value?: T;
  error?: string;
  exceptionDetails?: {
    text: string;
    lineNumber?: number;
    columnNumber?: number;
    stackTrace?: any;
  };
}

/**
 * CdpEvaluator - Safe evaluation wrapper for CDP operations
 * Handles write mode enforcement, error handling, and result formatting
 */
export class CdpEvaluator {
  constructor(
    private cdpService: ObsidianCdpService,
    private safetyManager?: SafetyManager,
  ) {}

  /**
   * Capture a screenshot of the Obsidian window
   * @param context - Request context
   * @returns Base64 encoded screenshot
   */
  async captureScreenshot(context?: RequestContext): Promise<string> {
    const evalContext =
      context ||
      requestContextService.createRequestContext({
        operation: "CdpCaptureScreenshot",
      });

    try {
      logger.debug("Capturing screenshot via CDP", evalContext);
      const result = await this.cdpService.sendRawCommand(
        "Page.captureScreenshot",
        {
          format: "png",
          fromSurface: true,
        },
      );
      return result.data;
    } catch (error) {
      logger.error(
        "Screenshot capture failed",
        error instanceof Error ? error : undefined,
        evalContext,
      );
      throw error;
    }
  }

  /**
   * Get a simplified tree of the Obsidian UI
   * @param context - Request context
   * @returns Hierarchical UI tree
   */
  async getUiTree(context?: RequestContext): Promise<any> {
    const evalContext =
      context ||
      requestContextService.createRequestContext({
        operation: "CdpGetUiTree",
      });

    // Script to extract a simplified UI tree of interactive elements
    const code = `
(() => {
  const extractInfo = (el) => {
    const rect = el.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return null;

    const info = {
      tag: el.tagName.toLowerCase(),
      text: el.innerText?.trim().substring(0, 50),
      ariaLabel: el.getAttribute('aria-label'),
      role: el.getAttribute('role'),
      className: el.className,
      rect: {
        x: Math.round(rect.x),
        y: Math.round(rect.y),
        w: Math.round(rect.width),
        h: Math.round(rect.height)
      }
    };

    // Filter out non-essential info
    if (!info.ariaLabel && !info.text && !info.role && !el.onclick && el.tagName !== 'INPUT' && el.tagName !== 'BUTTON') {
       // Only recurse if it might contain interesting children
    }

    const children = [];
    for (const child of el.children) {
      const childInfo = extractInfo(child);
      if (childInfo) children.push(childInfo);
    }

    if (children.length > 0) info.children = children;
    
    // Only return if it's "interesting" or has interesting children
    const isInteresting = 
      ['button', 'input', 'select', 'a'].includes(info.tag) || 
      info.ariaLabel || 
      info.role === 'button' || 
      el.classList.contains('clickable-icon') ||
      el.classList.contains('nav-action-button') ||
      el.onclick;

    return (isInteresting || children.length > 0) ? info : null;
  };

  return extractInfo(document.body);
})()
    `.trim();

    try {
      logger.debug("Extracting UI tree via CDP", evalContext);
      return await this.cdpService.evaluate(code, evalContext);
    } catch (error) {
      logger.error(
        "UI tree extraction failed",
        error instanceof Error ? error : undefined,
        evalContext,
      );
      throw error;
    }
  }

  /**
   * Highlight an element in the Obsidian UI
   * @param selector - CSS selector
   * @param duration - Duration in ms
   * @param context - Request context
   */
  async highlightElement(
    selector: string,
    duration: number = 2000,
    context?: RequestContext,
  ): Promise<boolean> {
    const evalContext =
      context ||
      requestContextService.createRequestContext({
        operation: "CdpHighlightElement",
      });

    const code = `
(() => {
  const el = document.querySelector(\`${selector.replace(/`/g, "\\`")}\`);
  if (!el) return false;

  const originalOutline = el.style.outline;
  const originalZIndex = el.style.zIndex;
  
  el.style.outline = '3px solid red';
  el.style.outlineOffset = '2px';
  el.style.zIndex = '9999';
  
  setTimeout(() => {
    el.style.outline = originalOutline;
    el.style.zIndex = originalZIndex;
  }, ${duration});
  
  el.scrollIntoView({ behavior: 'smooth', block: 'center' });
  return true;
})()
    `.trim();

    try {
      return await this.cdpService.evaluate(code, evalContext);
    } catch (error) {
      logger.error(
        "Highlight failed",
        error instanceof Error ? error : undefined,
        evalContext,
      );
      return false;
    }
  }

  /**
   * Execute a generic UI action
   */
  async executeUiAction(
    action: "click" | "double_click" | "type" | "hover" | "scroll",
    selector: string,
    value?: string,
    context?: RequestContext,
  ): Promise<CdpEvaluationResult> {
    const evalContext =
      context ||
      requestContextService.createRequestContext({
        operation: "CdpUiAction",
        action,
        selector,
      });

    const code = `
(async () => {
  try {
    const el = document.querySelector(\`${selector.replace(/`/g, "\\`")}\`);
    if (!el) return { success: false, error: "Element not found" };

    el.scrollIntoView({ behavior: 'instant', block: 'center' });
    
    switch(\`${action}\`) {
      case 'click':
        el.click();
        break;
      case 'double_click':
        el.dispatchEvent(new MouseEvent('dblclick', { bubbles: true }));
        break;
      case 'hover':
        el.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true }));
        break;
      case 'type':
        el.focus();
        if (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.isContentEditable) {
           // For simple inputs
           if (!el.isContentEditable) el.value = \`${(value || "").replace(/`/g, "\\`")}\`;
           else el.innerText = \`${(value || "").replace(/`/g, "\\`")}\`;
           el.dispatchEvent(new Event('input', { bubbles: true }));
           el.dispatchEvent(new Event('change', { bubbles: true }));
        }
        break;
    }
    
    return { success: true };
  } catch (e) {
    return { success: false, error: e.message };
  }
})()
    `.trim();

    try {
      return await this.cdpService.evaluate(code, evalContext);
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute a Dataview query using native Dataview API
   * @param query - DQL query string
   * @param context - Request context for logging
   * @returns Query results
   */
  async executeDataviewQuery(
    query: string,
    context?: RequestContext,
  ): Promise<CdpEvaluationResult> {
    const evalContext =
      context ||
      requestContextService.createRequestContext({
        operation: "CdpDataviewQuery",
      });

    if (!this.cdpService.isConnected()) {
      return {
        success: false,
        error: "CDP not connected. Dataview query requires CDP connection.",
      };
    }

    // Escape backticks in query
    const escapedQuery = query.replace(/`/g, "\\`");

    // Build safe evaluation code
    const code = `
(async () => {
  try {
    // Check if Dataview plugin is available
    const dv = app?.plugins?.plugins?.dataview?.api;
    if (!dv) {
      return {
        success: false,
        error: "Dataview plugin not available or not enabled in Obsidian"
      };
    }

    // Execute the query
    const result = await dv.query(\`${escapedQuery}\`);
    
    if (result.successful) {
      return {
        success: true,
        value: result.value
      };
    } else {
      return {
        success: false,
        error: result.error || "Query execution failed"
      };
    }
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
})()
    `.trim();

    try {
      logger.debug(`Executing Dataview query via CDP: ${query}`, evalContext);
      const result = await this.cdpService.evaluate(code, evalContext);
      logger.debug("Dataview query completed", {
        ...evalContext,
        success: result?.success,
      });
      return result;
    } catch (error) {
      logger.error(
        "Dataview query evaluation failed",
        error instanceof Error ? error : undefined,
        evalContext,
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Access Obsidian metadata cache for vault statistics
   * @param context - Request context
   * @returns Metadata cache information
   */
  async getMetadataCache(
    context?: RequestContext,
  ): Promise<CdpEvaluationResult> {
    const evalContext =
      context ||
      requestContextService.createRequestContext({
        operation: "CdpMetadataCache",
      });

    if (!this.cdpService.isConnected()) {
      return {
        success: false,
        error: "CDP not connected",
      };
    }

    const code = `
(() => {
  try {
    const cache = app?.metadataCache;
    if (!cache) {
      return { success: false, error: "Metadata cache not available" };
    }

    // Get all file caches
    const files = app.vault.getMarkdownFiles();
    const fileCount = files.length;
    
    // Collect tags
    const allTags = new Set();
    const allLinks = [];
    const unresolvedLinks = {};
    
    files.forEach(file => {
      const fileCache = cache.getFileCache(file);
      if (fileCache) {
        // Tags
        if (fileCache.tags) {
          fileCache.tags.forEach(tag => allTags.add(tag.tag));
        }
        // Frontmatter tags
        if (fileCache.frontmatter?.tags) {
          const fmTags = Array.isArray(fileCache.frontmatter.tags) 
            ? fileCache.frontmatter.tags 
            : [fileCache.frontmatter.tags];
          fmTags.forEach(tag => allTags.add(tag.startsWith('#') ? tag : '#' + tag));
        }
        
        // Links
        if (fileCache.links) {
          fileCache.links.forEach(link => {
            allLinks.push({
              source: file.path,
              target: link.link,
              displayText: link.displayText
            });
          });
        }
      }
    });
    
    // Get unresolved links
    const unresolvedLinksObj = cache.unresolvedLinks || {};
    
    return {
      success: true,
      value: {
        fileCount,
        tagCount: allTags.size,
        tags: Array.from(allTags).sort(),
        linkCount: allLinks.length,
        unresolvedLinkCount: Object.keys(unresolvedLinksObj).length,
        unresolvedLinks: unresolvedLinksObj
      }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
})()
    `.trim();

    try {
      logger.debug("Accessing metadata cache via CDP", evalContext);
      const result = await this.cdpService.evaluate(code, evalContext);
      return result;
    } catch (error) {
      logger.error(
        "Metadata cache access failed",
        error instanceof Error ? error : undefined,
        evalContext,
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Execute an Obsidian command by ID
   * @param commandId - Command ID to execute
   * @param requiresWrite - Whether this command performs write operations
   * @param context - Request context
   * @returns Execution result
   */
  async executeCommand(
    commandId: string,
    requiresWrite: boolean = false,
    context?: RequestContext,
  ): Promise<CdpEvaluationResult> {
    const evalContext =
      context ||
      requestContextService.createRequestContext({
        operation: "CdpExecuteCommand",
      });

    if (!this.cdpService.isConnected()) {
      return {
        success: false,
        error: "CDP not connected",
      };
    }

    // Check write mode if command requires write
    if (requiresWrite) {
      if (config.writeMode === "off") {
        return {
          success: false,
          error:
            "Write operations disabled by WRITE_MODE=off. Command execution blocked.",
        };
      }

      if (config.writeMode === "confirm" && this.safetyManager) {
        // In confirm mode, we'd need user confirmation
        // For now, we'll log and allow, but this could be enhanced
        logger.warning(
          `Command ${commandId} requires write permission (WRITE_MODE=confirm)`,
          evalContext,
        );
      }
    }

    const code = `
(() => {
  try {
    const commands = app?.commands;
    if (!commands) {
      return { success: false, error: "Commands API not available" };
    }

    const command = commands.commands["${commandId.replace(/"/g, '\\"')}"];
    if (!command) {
      return { 
        success: false, 
        error: "Command not found: ${commandId.replace(/"/g, '\\"')}" 
      };
    }

    // Execute the command
    commands.executeCommandById("${commandId.replace(/"/g, '\\"')}");
    
    return {
      success: true,
      value: { commandId: "${commandId.replace(/"/g, '\\"')}", executed: true }
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
})()
    `.trim();

    try {
      logger.info(`Executing command: ${commandId}`, evalContext);
      const result = await this.cdpService.evaluate(code, evalContext);
      return result;
    } catch (error) {
      logger.error(
        "Command execution failed",
        error instanceof Error ? error : undefined,
        evalContext,
      );
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Generic safe evaluation with write mode checking
   * @param expression - JavaScript expression to evaluate
   * @param requiresWrite - Whether the operation performs writes
   * @param context - Request context
   * @returns Evaluation result
   */
  async evaluateWithSafety(
    expression: string,
    requiresWrite: boolean = false,
    context?: RequestContext,
  ): Promise<any> {
    const evalContext =
      context ||
      requestContextService.createRequestContext({
        operation: "CdpEvaluate",
      });

    if (!this.cdpService.isConnected()) {
      throw new McpError(
        BaseErrorCode.CONNECTION_ERROR,
        "CDP not connected. Cannot evaluate expression.",
        { expression },
      );
    }

    // Check write mode if required
    if (requiresWrite) {
      if (config.writeMode === "off") {
        throw new McpError(
          BaseErrorCode.FORBIDDEN,
          "Write operations disabled by WRITE_MODE=off",
          { writeMode: config.writeMode },
        );
      }

      if (config.writeMode === "confirm") {
        logger.warning(
          "Expression requires write permission (WRITE_MODE=confirm)",
          evalContext,
        );
      }

      // If safety manager exists, we could create backups here
      // For now, we log the write operation
      logger.info("CDP write operation initiated", {
        ...evalContext,
        writeMode: config.writeMode,
      });
    }

    return await this.cdpService.evaluate(expression, evalContext);
  }
}
