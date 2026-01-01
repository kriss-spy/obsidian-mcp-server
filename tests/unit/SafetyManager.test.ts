import { describe, it, expect, vi, beforeEach } from "vitest";
import { SafetyManager } from "../../src/utils/security/SafetyManager.js";
import { ObsidianRestApiService } from "../../src/services/obsidianRestAPI/index.js";
import { RequestContext } from "../../src/utils/index.js";
import { config } from "../../src/config/index.js";

describe("SafetyManager", () => {
  let safetyManager: SafetyManager;
  const mockObsidianService = {
    getFileMetadata: vi.fn(),
    getFileContent: vi.fn(),
    updateFileContent: vi.fn(),
  } as unknown as ObsidianRestApiService;

  const mockContext: RequestContext = {
    requestId: "test",
    operation: "test",
    timestamp: new Date().toISOString(),
    appName: "test",
    appVersion: "1.0.0",
    environment: "test",
  };

  beforeEach(() => {
    vi.resetAllMocks();
    // @ts-ignore
    config.writeMode = "safe";
    // @ts-ignore
    config.rateLimitingEnabled = false;
    // @ts-ignore
    config.backupEnabled = false;
    safetyManager = new SafetyManager();
  });

  it("allows write in safe mode when no conflict", async () => {
    mockObsidianService.getFileMetadata = vi
      .fn()
      .mockResolvedValue({ mtime: Date.now() - 60000 });

    await expect(
      safetyManager.validateWrite(
        "UPDATE",
        "test.md",
        "content",
        mockContext,
        mockObsidianService,
      ),
    ).resolves.not.toThrow();
  });

  it("throws in safe mode when conflict detected", async () => {
    mockObsidianService.getFileMetadata = vi
      .fn()
      .mockResolvedValue({ mtime: Date.now() - 5000 });

    await expect(
      safetyManager.validateWrite(
        "UPDATE",
        "test.md",
        "content",
        mockContext,
        mockObsidianService,
      ),
    ).rejects.toThrow("Potential conflict");
  });

  it("throws when write mode is off", async () => {
    // @ts-ignore
    config.writeMode = "off";

    await expect(
      safetyManager.validateWrite(
        "UPDATE",
        "test.md",
        "content",
        mockContext,
        mockObsidianService,
      ),
    ).rejects.toThrow("Writes are disabled");
  });

  it("enforces protected patterns", async () => {
    // @ts-ignore
    config.protectedPatterns = ["Protected/"];

    await expect(
      safetyManager.validateWrite(
        "UPDATE",
        "Protected/file.md",
        "content",
        mockContext,
        mockObsidianService,
      ),
    ).rejects.toThrow("File is protected");
  });
});
