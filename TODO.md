# TODO - Obsidian MCP Server Enhancement

## Status: ⚠️ In Progress - Cleanup Needed

This project is largely complete but has some deferred items that need to be addressed.

## 🚀 Core Features (Implemented)

- [x] **HTML Rendering**: Markdown to HTML with syntax highlighting (`obsidian_render_html`).
- [x] **Mermaid Validation**: Syntax checking and SVG rendering (`obsidian_validate_mermaid`).
- [x] **Link Navigation**: Extract links, follow links, require full paths (`obsidian_get_links`, `obsidian_follow_link`).
- [x] **Symbol Extraction**: Heading hierarchy extraction (`obsidian_get_symbols`).
- [x] **Backlinks**: Reverse link discovery (`obsidian_get_backlinks`).
- [x] **Dataview Engine**: LIST and TABLE queries with `WHERE`, `SORT`, `LIMIT`, `contains()`, and `this` context (`obsidian_execute_dataview`).
- [x] **Safety Layer**: Write protection modes, automatic backups, conflict detection, audit logging, undo capability (`obsidian_set_write_mode`, `obsidian_get_operation_history`, `obsidian_undo_operation`, `obsidian_emergency_stop`).
- [x] **Safe File Move**: Move/rename files while preserving internal links (`obsidian_move_note`). This is a FULLY AUTOMATED SAFE alternative to `mv` command. The tool automatically:
  - Finds all backlinks to the source file
  - Updates all internal `[[WikiLinks]]` and markdown links to point to the new location
  - Performs the actual file move via file system
  - Automatically rolls back all link updates if the move fails
  - Ensures vault consistency (no broken links or orphaned link updates)

## 🚧 Deferred / Not Implemented

These features were planned but not implemented:

### High Priority (Should Implement)

- [ ] **Dataview GROUP BY**: Basic grouping support in query executor.
- [ ] **Dataview Functions**: `sum()`, `avg()`, `count()`, `length()` aggregate functions.
- [ ] **Actual File Move via REST API**: Create a custom Obsidian plugin that exposes a move/rename endpoint via REST API, so `obsidian_move_note` can perform the actual file move automatically without requiring manual intervention. Current limitation: User must manually move the file after the tool updates all links.

### Low Priority (Optional)

- [ ] **Link Graph Tool**: `obsidian_get_link_graph` for visualization of full vault link structure.
- [ ] **Dataview FLATTEN**: Advanced array flattening (known limitation, correctly documented).
- [ ] **Dataview TASK Queries**: Full task query support with checkable items.
- [ ] **Rate Limiting**: Enable by default (currently OFF by default, available to enable).
- [ ] **CI/CD**: GitHub Actions workflow for automated testing.

---

## 🧪 Experimental / Future Features

### Semantic Search with RAG (Phase 9)

**Goal:** Enable agents to understand vault content semantically (meaning-based, not just keyword matching).

**Why this matters:**

- Current limitation: Agents can only use keyword search and link-based navigation
- This adds: Find notes by meaning, understand vault themes, retrieve contextually relevant information

**Implementation approach:**

```
1. Embedding Generation: All Notes → Vectors (one-time indexing)
2. Vector Storage: SQLite or file-based JSON
3. Semantic Search: Query → Embedding → Cosine Similarity → Top-K Results
```

**Options:**

- **OpenAI `text-embedding-3-small`**: Fast, cheap (~$0.10-2.00 one-time cost)
- **Local `sentence-transformers`**: Free, CPU-bound, slower
- **Anthropic embeddings**: Alternative cloud option

**Estimated time:**

- Phase 9.1 (Basic): 4-6 hours
- Phase 9.2 (Persistent storage): 2-3 hours
- Phase 9.3 (Advanced features): 3-4 hours
- **Total: 9-13 hours**

**See `IMPLEMENTATION_PLAN.md` - Phase 9** for full details and implementation plan.

**Status:** Not started (Experimental - Opt-in only, disabled by default)

---

## Completed Tasks Archive

### 2026-01-01

- Project initialized and forked.
- HTML Rendering implemented with `markdown-it`.
- Mermaid Validation implemented with `mermaid-cli`.
- Link Navigation and Backlinks implemented.
- Dataview Engine implemented with local parsing and execution (basic features).
- Safety Layer implemented with automatic backups and audit logs.
- Documentation updated and troubleshooting guide added.
- Added to OpenCode configuration.

---

## Notes

- Mermaid CLI installed globally (`mmdc`).
- Testing performed against community example vaults and daily vault copy.
- Rate limiting is available but OFF by default.
- Safety mode defaults to `safe` (backups enabled).
- Unit tests: 20/20 passing, >75% coverage.

## Next Steps

1. [ ] Implement GROUP BY in Dataview engine (if needed)
2. [ ] Add aggregate functions (sum, avg, count, length)
3. [ ] Set up CI/CD (optional)
4. [ ] Test with Claude Desktop (optional)
