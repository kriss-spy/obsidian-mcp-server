/**
 * @module ObsidianCdp
 * @description Chrome DevTools Protocol integration for native Obsidian access
 */

export { CdpEvaluator } from "./evaluator.js";
export type { CdpEvaluationResult } from "./evaluator.js";
export {
  CdpConnectionState,
  createCdpRequest,
  defaultObsidianTargetFilter,
  isCdpEvent,
  isCdpResponse,
} from "./protocol.js";
export type {
  CdpConnectionOptions,
  CdpEvent,
  CdpRequest,
  CdpResponse,
  CdpTarget,
} from "./protocol.js";
export { ObsidianCdpService } from "./service.js";
