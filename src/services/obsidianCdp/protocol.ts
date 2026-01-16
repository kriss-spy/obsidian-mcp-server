/**
 * @module CdpProtocol
 * @description Chrome DevTools Protocol types and helpers for Obsidian CDP integration
 */

/**
 * CDP Request message structure
 */
export interface CdpRequest {
  id: number;
  method: string;
  params?: Record<string, any>;
  sessionId?: string;
}

/**
 * CDP Response message structure
 */
export interface CdpResponse {
  id: number;
  result?: any;
  error?: {
    code: number;
    message: string;
    data?: any;
  };
}

/**
 * CDP Event message structure
 */
export interface CdpEvent {
  method: string;
  params?: Record<string, any>;
  sessionId?: string;
}

/**
 * CDP Target information
 */
export interface CdpTarget {
  id: string;
  type: string;
  title: string;
  url: string;
  attached: boolean;
  webSocketDebuggerUrl?: string;
}

/**
 * CDP connection state
 */
export enum CdpConnectionState {
  DISCONNECTED = "disconnected",
  CONNECTING = "connecting",
  CONNECTED = "connected",
  ERROR = "error",
}

/**
 * CDP evaluation result
 */
export interface CdpEvaluationResult {
  success: boolean;
  value?: any;
  error?: string;
  exceptionDetails?: {
    text: string;
    lineNumber?: number;
    columnNumber?: number;
    stackTrace?: any;
  };
}

/**
 * CDP connection options
 */
export interface CdpConnectionOptions {
  host: string;
  port: number;
  targetFilter?: (target: CdpTarget) => boolean;
  connectionTimeout?: number;
  keepAliveInterval?: number;
}

/**
 * Default target filter - looks for Obsidian windows
 */
export const defaultObsidianTargetFilter = (target: CdpTarget): boolean => {
  // Match pages that look like Obsidian (electron apps)
  return (
    target.type === "page" &&
    (target.title.includes("Obsidian") || target.url.includes("app://obsidian"))
  );
};

/**
 * Helper to create a CDP request
 */
export function createCdpRequest(
  id: number,
  method: string,
  params?: Record<string, any>,
  sessionId?: string,
): CdpRequest {
  const request: CdpRequest = { id, method };
  if (params) request.params = params;
  if (sessionId) request.sessionId = sessionId;
  return request;
}

/**
 * Helper to check if a message is a CDP response
 */
export function isCdpResponse(message: any): message is CdpResponse {
  return typeof message === "object" && message !== null && "id" in message;
}

/**
 * Helper to check if a message is a CDP event
 */
export function isCdpEvent(message: any): message is CdpEvent {
  return (
    typeof message === "object" &&
    message !== null &&
    "method" in message &&
    !("id" in message)
  );
}
