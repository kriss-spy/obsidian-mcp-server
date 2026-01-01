import { describe, it, expect } from "vitest";
import { DataviewEngine } from "../../src/utils/obsidian/DataviewEngine.js";
import {
  VaultIndexer,
  NoteMetadata,
} from "../../src/utils/obsidian/VaultIndexer.js";

describe("DataviewEngine", () => {
  const engine = new DataviewEngine();
  const indexer = new VaultIndexer();

  const notes: NoteMetadata[] = [
    indexer.indexNote(
      "Song1.md",
      "---\nillustrator: John Doe\ncomposer: Jane Smith\n---\n# Song 1\n#music",
    ),
    indexer.indexNote(
      "Song2.md",
      "---\nillustrator: Mike Johnson\n---\n# Song 2\n#rock",
    ),
    indexer.indexNote("Project.md", "---\nstatus: active\n---\n# Project"),
  ];

  it("parses LIST query", () => {
    const query = engine.parse('LIST FROM "" WHERE illustrator');
    expect(query.type).toBe("LIST");
    expect(query.where).toBeDefined();
  });

  it("executes LIST query with simple WHERE", () => {
    const query = engine.parse('LIST FROM "" WHERE status = "active"');
    const results = engine.execute(query, notes);
    expect(results).toHaveLength(1);
    expect(results[0]).toBe("Project.md");
  });

  it("executes complex WHERE with OR", () => {
    const query = engine.parse(
      'LIST FROM "" WHERE (illustrator = "John Doe") OR (illustrator = "Mike Johnson")',
    );
    const results = engine.execute(query, notes);
    expect(results).toHaveLength(2);
  });

  it("handles contains() function", () => {
    const query = engine.parse('LIST WHERE contains(file.tags, "music")');
    const results = engine.execute(query, notes);
    expect(results).toHaveLength(1);
    expect(results[0]).toBe("Song1.md");
  });

  it("supports 'this' context", () => {
    const query = engine.parse("LIST WHERE illustrator = this.illustrator");
    const contextNote = indexer.indexNote(
      "Context.md",
      "---\nillustrator: John Doe\n---",
    );
    const results = engine.execute(query, notes, contextNote);
    expect(results).toHaveLength(1);
    expect(results[0]).toBe("Song1.md");
  });
});
