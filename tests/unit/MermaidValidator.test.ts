import { describe, it, expect, vi } from "vitest";
import { MermaidValidator } from "../../src/utils/obsidian/MermaidValidator.js";

describe("MermaidValidator", () => {
  const validator = new MermaidValidator();

  it("validates correct mermaid syntax", async () => {
    const diagram = "graph TD\n  A --> B";
    const result = await validator.validate(diagram);
    expect(result.valid).toBe(true);
    expect(result.svg).toBeDefined();
    expect(result.svg).toContain("<svg");
  }, 10000); // Higher timeout for CLI call

  it("returns error for invalid mermaid syntax", async () => {
    const diagram = "graph TD\n  A -- B"; // Missing arrow head
    const result = await validator.validate(diagram);
    expect(result.valid).toBe(false);
    expect(result.error).toBeDefined();
  }, 10000);
});
