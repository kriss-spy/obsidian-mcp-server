import { describe, it, expect } from "vitest";
import { MarkdownRenderer } from "../../src/utils/obsidian/MarkdownRenderer.js";

describe("MarkdownRenderer", () => {
  const renderer = new MarkdownRenderer();

  it("renders basic markdown to HTML", () => {
    const markdown = "# Hello World\n\nThis is a **test**.";
    const html = renderer.render(markdown);
    expect(html).toContain("Hello World");
    expect(html).toContain("<h1");
    expect(html).toContain("This is a <strong>test</strong>.");
  });

  it("renders tables correctly", () => {
    const markdown = "| Col 1 | Col 2 |\n|-------|-------|\n| Val 1 | Val 2 |";
    const html = renderer.render(markdown);
    expect(html).toContain("<table>");
    expect(html).toContain("<thead>");
    expect(html).toContain("<tbody>");
    expect(html).toContain("Val 1");
  });

  it("highlights code blocks", () => {
    const markdown = "```ts\nconst x: number = 1;\n```";
    const html = renderer.render(markdown);
    expect(html).toContain('<pre><code class="hljs">');
    // highlight.js adds spans for syntax highlighting
    expect(html).toContain('<span class="hljs-keyword">const</span>');
  });

  it("extracts code blocks", () => {
    const markdown =
      "Some text.\n\n```mermaid\ngraph TD\n  A --> B\n```\n\nOther text.\n\n```dataview\nLIST\n```";
    const blocks = renderer.extractCodeBlocks(markdown);
    expect(blocks).toHaveLength(2);
    expect(blocks[0].lang).toBe("mermaid");
    expect(blocks[0].content).toContain("graph TD");
    expect(blocks[1].lang).toBe("dataview");
  });

  it("extracts specific language code blocks", () => {
    const markdown = "```mermaid\ngraph TD\n```\n\n```dataview\nLIST\n```";
    const blocks = renderer.extractCodeBlocks(markdown, "mermaid");
    expect(blocks).toHaveLength(1);
    expect(blocks[0].lang).toBe("mermaid");
  });
});
