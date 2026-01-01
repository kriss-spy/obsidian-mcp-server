import { describe, it, expect } from "vitest";
import { LinkExtractor } from "../../src/utils/obsidian/LinkExtractor.js";

describe("LinkExtractor", () => {
  const extractor = new LinkExtractor();

  it("extracts wiki links", () => {
    const markdown = "See [[Note A]] and [[Note B|Display Text]]";
    const links = extractor.extractLinks(markdown);
    expect(links).toHaveLength(2);
    expect(links[0].path).toBe("Note A");
    expect(links[1].path).toBe("Note B");
    expect(links[1].text).toBe("Display Text");
  });

  it("extracts markdown links", () => {
    const markdown =
      "See [Internal](Note%20A.md) and [External](https://google.com)";
    const links = extractor.extractLinks(markdown);
    expect(links).toHaveLength(2);
    expect(links[0].type).toBe("markdown");
    expect(links[1].type).toBe("external");
  });

  it("resolves links correctly", () => {
    const allFiles = ["Folder/Note A.md", "Note B.md", "Image.png"];

    // Exact match
    expect(
      extractor.resolveLink("Note B.md", "Folder/Source.md", allFiles),
    ).toBe("Note B.md");

    // Missing extension
    expect(extractor.resolveLink("Note B", "Folder/Source.md", allFiles)).toBe(
      "Note B.md",
    );

    // Relative match
    expect(extractor.resolveLink("Note A", "Folder/Source.md", allFiles)).toBe(
      "Folder/Note A.md",
    );

    // Short path match
    expect(
      extractor.resolveLink("Note A.md", "Other/Source.md", allFiles),
    ).toBe("Folder/Note A.md");
  });

  it("throws on ambiguous links", () => {
    const allFiles = ["Folder1/Duplicate.md", "Folder2/Duplicate.md"];
    expect(() =>
      extractor.resolveLink("Duplicate", "Source.md", allFiles),
    ).toThrow("Ambiguous link");
  });
});
