import MarkdownIt from "markdown-it";
import hljs from "highlight.js";
import anchor from "markdown-it-anchor";
// @ts-ignore
import toc from "markdown-it-table-of-contents";

/**
 * Utility class for rendering Markdown to HTML with syntax highlighting.
 */
export class MarkdownRenderer {
  private md: MarkdownIt;

  constructor() {
    this.md = new MarkdownIt({
      html: true,
      linkify: true,
      typographer: true,
      highlight: (str, lang) => {
        if (lang && hljs.getLanguage(lang)) {
          try {
            return (
              '<pre><code class="hljs">' +
              hljs.highlight(str, { language: lang, ignoreIllegals: true })
                .value +
              "</code></pre>"
            );
          } catch (__) {}
        }

        return (
          '<pre><code class="hljs">' +
          this.md.utils.escapeHtml(str) +
          "</code></pre>"
        );
      },
    })
      .use(anchor, {
        permalink: anchor.permalink.ariaHidden({
          placement: "before",
          symbol: "§",
          class: "header-anchor",
        }),
      })
      .use(toc, {
        includeLevel: [1, 2, 3, 4],
      });
  }

  /**
   * Renders a markdown string to HTML.
   * @param markdown The markdown string to render.
   * @returns The rendered HTML string.
   */
  public render(markdown: string): string {
    return this.md.render(markdown);
  }

  /**
   * Extracts code blocks from markdown without rendering the whole document.
   * Useful for getting Mermaid or Dataview snippets.
   * @param markdown The markdown string.
   * @param language Optional language filter (e.g., 'mermaid').
   * @returns Array of code block contents.
   */
  public extractCodeBlocks(
    markdown: string,
    language?: string,
  ): { lang: string; content: string }[] {
    const blocks: { lang: string; content: string }[] = [];
    const tokens = this.md.parse(markdown, {});

    tokens.forEach((token) => {
      if (token.type === "fence") {
        const lang = token.info.trim();
        if (!language || lang === language) {
          blocks.push({
            lang,
            content: token.content,
          });
        }
      }
    });

    return blocks;
  }
}

export const defaultRenderer = new MarkdownRenderer();
