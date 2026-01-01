import { logger, RequestContext } from "../index.js";
import path from "node:path";

export interface ObsidianLink {
  text: string;
  path: string;
  type: "wiki" | "markdown" | "external";
  lineNumber: number;
  context: string;
  absolutePath?: string;
  exists?: boolean;
}

/**
 * Utility class for extracting and resolving Obsidian links.
 */
export class LinkExtractor {
  /**
   * Extracts all links from a markdown string.
   * @param markdown The markdown content.
   * @returns Array of extracted links.
   */
  public extractLinks(markdown: string): ObsidianLink[] {
    const links: ObsidianLink[] = [];
    const lines = markdown.split("\n");

    // Regular expressions for links
    const wikiLinkRegex = /\[\[([^\]|]+)(?:\|([^\]]+))?\]\]/g;
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;

    lines.forEach((line, index) => {
      const lineNumber = index + 1;

      // Extract Wiki links [[path|text]]
      let match;
      while ((match = wikiLinkRegex.exec(line)) !== null) {
        const linkPath = match[1].trim();
        const linkText = match[2] ? match[2].trim() : linkPath;
        links.push({
          text: linkText,
          path: linkPath,
          type: "wiki",
          lineNumber,
          context: line.trim(),
        });
      }

      // Extract Markdown links [text](path)
      while ((match = markdownLinkRegex.exec(line)) !== null) {
        const linkText = match[1].trim();
        const linkPath = match[2].trim();
        const isExternal =
          linkPath.startsWith("http://") || linkPath.startsWith("https://");

        links.push({
          text: linkText,
          path: linkPath,
          type: isExternal ? "external" : "markdown",
          lineNumber,
          context: line.trim(),
        });
      }
    });

    return links;
  }

  /**
   * Resolves an Obsidian link to an absolute vault path.
   * Following Obsidian's behavior but being strict about ambiguity.
   * @param linkPath The path from the link.
   * @param sourceFilePath The path of the file containing the link.
   * @param allFiles List of all files in the vault (for resolution).
   * @returns The resolved absolute path or throws if ambiguous.
   */
  public resolveLink(
    linkPath: string,
    sourceFilePath: string,
    allFiles: string[],
  ): string {
    // 1. Try exact match (relative or absolute)
    // If it starts with /, it's absolute from vault root.
    // Otherwise, try relative to source file first.
    const sourceDir = path.posix.dirname(sourceFilePath);

    // Normalize path (remove leading slash for comparison with allFiles which usually don't have it)
    const normalizedLinkPath = linkPath.startsWith("/")
      ? linkPath.slice(1)
      : linkPath;

    // Try absolute match
    if (allFiles.includes(normalizedLinkPath)) {
      return normalizedLinkPath;
    }

    // Try absolute with .md extension if missing
    if (
      !normalizedLinkPath.endsWith(".md") &&
      allFiles.includes(`${normalizedLinkPath}.md`)
    ) {
      return `${normalizedLinkPath}.md`;
    }

    // Try relative match
    const relativePath = path.posix.join(
      sourceDir === "." ? "" : sourceDir,
      normalizedLinkPath,
    );
    const normalizedRelativePath = relativePath.startsWith("/")
      ? relativePath.slice(1)
      : relativePath;

    if (allFiles.includes(normalizedRelativePath)) {
      return normalizedRelativePath;
    }

    if (
      !normalizedRelativePath.endsWith(".md") &&
      allFiles.includes(`${normalizedRelativePath}.md`)
    ) {
      return `${normalizedRelativePath}.md`;
    }

    // 2. Try short path match (Obsidian's default)
    // Find all files that end with the linkPath
    const fileName = path.posix.basename(normalizedLinkPath);
    const matches = allFiles.filter((f) => {
      const fName = path.posix.basename(f);
      const fNameNoExt = fName.endsWith(".md") ? fName.slice(0, -3) : fName;
      return (
        fName === fileName ||
        fNameNoExt === fileName ||
        f.endsWith("/" + normalizedLinkPath) ||
        f.endsWith("/" + normalizedLinkPath + ".md")
      );
    });

    if (matches.length === 1) {
      return matches[0];
    }

    if (matches.length > 1) {
      throw new Error(
        `Ambiguous link: Found ${matches.length} matches for "${linkPath}". Please use a more specific path. Matches: ${matches.slice(0, 5).join(", ")}`,
      );
    }

    throw new Error(`Link not found: "${linkPath}"`);
  }
}

export const defaultLinkExtractor = new LinkExtractor();
