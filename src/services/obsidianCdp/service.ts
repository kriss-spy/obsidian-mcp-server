/**
 * @module ObsidianCdpService
 * @description Chrome DevTools Protocol service for native Obsidian integration
 */

import axios from "axios";
import { WebSocket } from "ws";
import { config } from "../../config/index.js";
import { BaseErrorCode, McpError } from "../../types-global/errors.js";
import {
  ErrorHandler,
  logger,
  RequestContext,
  requestContextService,
} from "../../utils/index.js";
import {
  CdpConnectionOptions,
  CdpConnectionState,
  CdpEvent,
  CdpRequest,
  CdpResponse,
  CdpTarget,
  createCdpRequest,
  defaultObsidianTargetFilter,
  isCdpEvent,
  isCdpResponse,
} from "./protocol.js";

/**
 * ObsidianCdpService - Manages Chrome DevTools Protocol connection to Obsidian
 * Provides native access to the Obsidian `app` global, plugins, and UI
 */
export class ObsidianCdpService {
  private ws: WebSocket | null = null;
  private state: CdpConnectionState = CdpConnectionState.DISCONNECTED;
  private messageIdCounter = 0;
  private pendingRequests = new Map<
    number,
    {
      resolve: (value: any) => void;
      reject: (error: Error) => void;
      timeout: NodeJS.Timeout;
    }
  >();
  private options: CdpConnectionOptions;
  private keepAliveTimer: NodeJS.Timeout | null = null;
  private targetId: string | null = null;
  private sessionId: string | null = null;

  constructor(options?: Partial<CdpConnectionOptions>) {
    this.options = {
      host: options?.host || config.obsidianCdpHost || "localhost",
      port: options?.port || config.obsidianCdpPort || 9222,
      targetFilter: options?.targetFilter || defaultObsidianTargetFilter,
      connectionTimeout: options?.connectionTimeout || 10000,
      keepAliveInterval: options?.keepAliveInterval || 30000,
    };

    logger.info(
      `ObsidianCdpService initialized (host: ${this.options.host}, port: ${this.options.port})`,
      requestContextService.createRequestContext({
        operation: "CdpServiceInit",
      }),
    );
  }

  /**
   * Connect to Obsidian via CDP
   * @returns True if connection successful, false otherwise
   */
  public async connect(): Promise<boolean> {
    const context = requestContextService.createRequestContext({
      operation: "CdpConnect",
    });

    if (this.state === CdpConnectionState.CONNECTED) {
      logger.debug("CDP already connected", context);
      return true;
    }

    try {
      this.state = CdpConnectionState.CONNECTING;
      logger.info("Attempting CDP connection to Obsidian...", context);

      // Step 1: Discover available targets
      const target = await this.discoverTarget(context);
      if (!target) {
        logger.warning(
          "No suitable Obsidian target found. Ensure Obsidian is running with --remote-debugging-port=9222",
          context,
        );
        this.state = CdpConnectionState.DISCONNECTED;
        return false;
      }

      this.targetId = target.id;
      logger.info(`Found Obsidian target: ${target.title}`, {
        ...context,
        targetId: target.id,
      });

      // Step 2: Connect WebSocket to target
      await this.connectWebSocket(target, context);

      // Step 3: Attach to target and create session
      await this.attachToTarget(context);

      // Step 4: Enable Runtime domain for JavaScript execution
      await this.enableRuntime(context);

      // Step 5: Start keep-alive mechanism
      this.startKeepAlive();

      this.state = CdpConnectionState.CONNECTED;
      logger.info("CDP connection established successfully", context);
      return true;
    } catch (error) {
      this.state = CdpConnectionState.ERROR;
      logger.error(
        "Failed to establish CDP connection",
        error instanceof Error ? error : undefined,
        {
          ...context,
          error: error instanceof Error ? error.message : String(error),
        },
      );
      return false;
    }
  }

  /**
   * Discover Obsidian target from CDP
   */
  private async discoverTarget(
    context: RequestContext,
  ): Promise<CdpTarget | null> {
    try {
      const response = await axios.get<CdpTarget[]>(
        `http://${this.options.host}:${this.options.port}/json`,
        { timeout: this.options.connectionTimeout },
      );

      const targets = response.data.filter(this.options.targetFilter!);

      if (targets.length === 0) {
        return null;
      }

      if (targets.length > 1) {
        logger.warning(
          `Multiple Obsidian targets found (${targets.length}), using first one`,
          context,
        );
      }

      return targets[0];
    } catch (error) {
      logger.debug(
        "Target discovery failed - CDP may not be available",
        context,
      );
      return null;
    }
  }

  /**
   * Connect WebSocket to the discovered target
   */
  private async connectWebSocket(
    target: CdpTarget,
    context: RequestContext,
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      const wsUrl =
        target.webSocketDebuggerUrl ||
        `ws://${this.options.host}:${this.options.port}/devtools/page/${target.id}`;

      logger.debug(`Connecting to WebSocket: ${wsUrl}`, context);

      this.ws = new WebSocket(wsUrl);

      const timeout = setTimeout(() => {
        reject(new Error("WebSocket connection timeout"));
      }, this.options.connectionTimeout);

      this.ws.on("open", () => {
        clearTimeout(timeout);
        logger.debug("WebSocket connected", context);
        resolve();
      });

      this.ws.on("message", (data: Buffer) => {
        this.handleMessage(data.toString(), context);
      });

      this.ws.on("error", (error) => {
        logger.error("WebSocket error", error, context);
        this.state = CdpConnectionState.ERROR;
      });

      this.ws.on("close", () => {
        logger.info("WebSocket connection closed", context);
        this.state = CdpConnectionState.DISCONNECTED;
        this.cleanup();
      });
    });
  }

  /**
   * Attach to the target and create a session
   */
  private async attachToTarget(context: RequestContext): Promise<void> {
    const result = await this.sendCommand("Target.attachToTarget", {
      targetId: this.targetId,
      flatten: true,
    });

    this.sessionId = result.sessionId;
    logger.debug(`Attached to target, session ID: ${this.sessionId}`, context);
  }

  /**
   * Enable the Runtime domain for JavaScript execution
   */
  private async enableRuntime(context: RequestContext): Promise<void> {
    await this.sendCommand("Runtime.enable", {}, this.sessionId!);
    logger.debug("Runtime domain enabled", context);
  }

  /**
   * Send a raw CDP command
   * @param method - CDP method name
   * @param params - Command parameters
   * @returns Command result
   */
  public async sendRawCommand(
    method: string,
    params: Record<string, any> = {},
  ): Promise<any> {
    if (!this.isConnected()) {
      throw new McpError(
        BaseErrorCode.CONNECTION_ERROR,
        "CDP not connected. Cannot send command.",
        { method },
      );
    }
    return this.sendCommand(method, params, this.sessionId!);
  }

  /**
   * Send a CDP command and wait for response
   */
  private sendCommand(
    method: string,
    params: Record<string, any> = {},
    sessionId?: string,
  ): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("WebSocket not connected"));
        return;
      }

      const id = ++this.messageIdCounter;
      const request = createCdpRequest(id, method, params, sessionId);

      const timeout = setTimeout(() => {
        this.pendingRequests.delete(id);
        reject(new Error(`CDP command timeout: ${method}`));
      }, 30000); // 30 second timeout

      this.pendingRequests.set(id, { resolve, reject, timeout });

      this.ws.send(JSON.stringify(request), (error) => {
        if (error) {
          this.pendingRequests.delete(id);
          clearTimeout(timeout);
          reject(error);
        }
      });
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(data: string, context: RequestContext): void {
    try {
      const message = JSON.parse(data);

      if (isCdpResponse(message)) {
        this.handleResponse(message);
      } else if (isCdpEvent(message)) {
        this.handleEvent(message, context);
      }
    } catch (error) {
      logger.error(
        "Failed to parse CDP message",
        error instanceof Error ? error : undefined,
        context,
      );
    }
  }

  /**
   * Handle CDP response
   */
  private handleResponse(response: CdpResponse): void {
    const pending = this.pendingRequests.get(response.id);
    if (!pending) return;

    clearTimeout(pending.timeout);
    this.pendingRequests.delete(response.id);

    if (response.error) {
      pending.reject(new Error(`CDP Error: ${response.error.message}`));
    } else {
      pending.resolve(response.result);
    }
  }

  /**
   * Handle CDP events (for future use - monitoring, debugging)
   */
  private handleEvent(event: CdpEvent, _context: RequestContext): void {
    // Log certain events for debugging
    if (event.method === "Inspector.detached") {
      logger.warning("Inspector detached from target", _context);
      this.state = CdpConnectionState.DISCONNECTED;
    }
  }

  /**
   * Start keep-alive mechanism
   */
  private startKeepAlive(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
    }

    this.keepAliveTimer = setInterval(() => {
      if (this.isConnected()) {
        // Send a simple command to keep connection alive
        this.sendCommand("Runtime.evaluate", {
          expression: "1",
        }).catch((error: Error) => {
          logger.warning(
            "Keep-alive check failed",
            requestContextService.createRequestContext({
              operation: "CdpKeepAlive",
              error: error.message,
            }),
          );
        });
      }
    }, this.options.keepAliveInterval);
  }

  /**
   * Cleanup resources
   */
  private cleanup(): void {
    if (this.keepAliveTimer) {
      clearInterval(this.keepAliveTimer);
      this.keepAliveTimer = null;
    }

    // Reject all pending requests
    for (const [id, pending] of this.pendingRequests.entries()) {
      clearTimeout(pending.timeout);
      pending.reject(new Error("Connection closed"));
    }
    this.pendingRequests.clear();

    if (this.ws) {
      this.ws.removeAllListeners();
      if (this.ws.readyState === WebSocket.OPEN) {
        this.ws.close();
      }
      this.ws = null;
    }

    this.targetId = null;
    this.sessionId = null;
  }

  /**
   * Disconnect from CDP
   */
  public async disconnect(): Promise<void> {
    const context = requestContextService.createRequestContext({
      operation: "CdpDisconnect",
    });

    logger.info("Disconnecting CDP connection...", context);
    this.cleanup();
    this.state = CdpConnectionState.DISCONNECTED;
    logger.info("CDP connection disconnected", context);
  }

  /**
   * Check if CDP is connected
   */
  public isConnected(): boolean {
    return (
      this.state === CdpConnectionState.CONNECTED &&
      this.ws !== null &&
      this.ws.readyState === WebSocket.OPEN
    );
  }

  /**
   * Get current connection state
   */
  public getState(): CdpConnectionState {
    return this.state;
  }

  /**
   * Evaluate JavaScript in Obsidian context
   * This is a low-level method - use CdpEvaluator for safer execution
   */
  public async evaluate(
    expression: string,
    context?: RequestContext,
  ): Promise<any> {
    if (!this.isConnected()) {
      throw new McpError(
        BaseErrorCode.CONNECTION_ERROR,
        "CDP not connected. Cannot evaluate expression.",
        { expression },
      );
    }

    const evalContext =
      context ||
      requestContextService.createRequestContext({
        operation: "CdpEvaluate",
      });

    try {
      const result = await this.sendCommand(
        "Runtime.evaluate",
        {
          expression,
          returnByValue: true,
          awaitPromise: true,
          userGesture: true,
        },
        this.sessionId!,
      );

      if (result.exceptionDetails) {
        throw new McpError(
          BaseErrorCode.EXECUTION_ERROR,
          `JavaScript execution failed: ${result.exceptionDetails.exception?.description || "Unknown error"}`,
          { exceptionDetails: result.exceptionDetails },
        );
      }

      return result.result?.value;
    } catch (error) {
      logger.error(
        "CDP evaluation failed",
        error instanceof Error ? error : undefined,
        evalContext,
      );
      throw error;
    }
  }
}
