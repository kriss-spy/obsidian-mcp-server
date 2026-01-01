import yaml from "js-yaml";
import path from "node:path/posix";
import { logger, RequestContext } from "../index.js";

export interface NoteMetadata {
  path: string;
  name: string;
  frontmatter: Record<string, any>;
  tags: string[];
  fields: Record<string, any>;
  links: string[];
  ctime: number;
  mtime: number;
}

/**
 * Utility class for indexing vault content and extracting structured metadata.
 */
export class VaultIndexer {
  /**
   * Extracts metadata from a single markdown file.
   * @param filePath The vault-relative path.
   * @param content The raw markdown content.
   * @param stats Optional file stats.
   * @returns Structured metadata.
   */
  public indexNote(
    filePath: string,
    content: string,
    stats?: { ctime: number; mtime: number },
  ): NoteMetadata {
    const name = path.basename(filePath, ".md");
    const metadata: NoteMetadata = {
      path: filePath,
      name,
      frontmatter: {},
      tags: [],
      fields: {},
      links: [],
      ctime: stats?.ctime || 0,
      mtime: stats?.mtime || 0,
    };

    // 1. Extract Frontmatter
    const frontmatterMatch = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
    let body = content;
    if (frontmatterMatch) {
      try {
        const parsed = yaml.load(frontmatterMatch[1]) as Record<string, any>;
        if (parsed && typeof parsed === "object") {
          metadata.frontmatter = parsed;
          // Extract tags from frontmatter
          if (Array.isArray(parsed.tags)) {
            metadata.tags.push(...parsed.tags);
          } else if (typeof parsed.tags === "string") {
            metadata.tags.push(...parsed.tags.split(/,\s*/));
          } else if (parsed.tag) {
            metadata.tags.push(
              ...(Array.isArray(parsed.tag) ? parsed.tag : [parsed.tag]),
            );
          }
        }
      } catch (e) {
        logger.debug(`Failed to parse frontmatter for ${filePath}: ${e}`);
      }
      body = content.slice(frontmatterMatch[0].length);
    }

    // 2. Extract Tags from body (#tag)
    const tagRegex = /(?:^|\s)#([a-zA-Z0-9_\-/]+)/g;
    let match;
    while ((match = tagRegex.exec(body)) !== null) {
      metadata.tags.push(match[1]);
    }
    // De-duplicate tags
    metadata.tags = [...new Set(metadata.tags)];

    // 3. Extract Inline Fields (key:: value)
    const inlineFieldRegex = /^([^:\n]+)::\s*(.+)$/gm;
    while ((match = inlineFieldRegex.exec(body)) !== null) {
      const key = match[1].trim();
      const value = match[2].trim();
      metadata.fields[key] = value;
    }
    // Also include frontmatter in fields for Dataview-like access
    metadata.fields = { ...metadata.fields, ...metadata.frontmatter };

    // Standard Dataview fields
    metadata.fields["file.name"] = name;
    metadata.fields["file.path"] = filePath;
    metadata.fields["file.ctime"] = metadata.ctime;
    metadata.fields["file.mtime"] = metadata.mtime;
    metadata.fields["file.tags"] = metadata.tags;
    metadata.fields["file.ext"] = path.extname(filePath).slice(1) || "md";

    const cdate = new Date(metadata.ctime);
    const mdate = new Date(metadata.mtime);
    metadata.fields["file.cday"] = cdate.toISOString().split("T")[0];
    metadata.fields["file.mday"] = mdate.toISOString().split("T")[0];

    // 4. Extract Links [[...]]
    const wikiLinkRegex = /\[\[([^\]|]+)(?:\|[^\]]+)?\]\]/g;
    while ((match = wikiLinkRegex.exec(body)) !== null) {
      metadata.links.push(match[1].trim());
    }
    metadata.links = [...new Set(metadata.links)];

    return metadata;
  }
}

export const defaultIndexer = new VaultIndexer();
