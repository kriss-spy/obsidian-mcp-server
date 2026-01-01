# TODO - Obsidian MCP Server Enhancement

## Overview

Tracking tasks for implementing enhancements to cyanheads/obsidian-mcp-server

## Phase 0: Setup & Fork (1-2 hours)

- [x] Fork `cyanheads/obsidian-mcp-server` to your GitHub (https://github.com/kriss-spy/obsidian-mcp-server)
- [x] Follow revised steps in PHASE_0_SETUP.md (fresh clone approach)
- [x] Clone to `/home/krisspy/Desktop/obsidan-mcp`
- [x] Add upstream remote
- [x] Restore planning files (IMPLEMENTATION_PLAN.md, TODO.md, CHANGELOG.md)
- [x] Commit planning files
- [x] Create development branch (feature/html-rendering)
- [x] Install dependencies: `npm install`
- [x] Build project: `npm run build`
- [x] Review existing code structure and tools
- [x] Configure Obsidian Local REST API
- [x] Test basic connection
- [x] Manual vaults setup complete
- [x] Vault testing ready: Blue-topaz-example-main (Dataview), Pkmer-Math-main (Mermaid)
- [x] Daily vault copy ready: tests/fixtures/sample-vaults/my-vault

**Status:** ✅ Phase 0 Complete!
**Next Step:** Begin Phase 1: HTML Rendering

## Phase 1: HTML Rendering (4-6 hours)

- [x] Install dependencies: `npm install markdown-it highlight.js`
- [x] Create `src/MarkdownRenderer.ts` class
- [x] Implement markdown-it with CommonMark compliance
- [x] Add plugins: tables, strikethrough, task lists
- [x] Integrate highlight.js for syntax highlighting
- [x] Extract and preserve code blocks
- [x] Implement `obsidian_render_html` tool
- [x] Add error handling
- [x] Write unit tests
- [x] Commit changes

## Phase 2: Mermaid Validation (3-4 hours)

- [x] Create `src/MermaidValidator.ts` class
- [x] Implement mermaid validation via CLI
- [x] Generate SVG on success (optional)
- [x] Implement `obsidian_validate_mermaid` tool
- [x] Document limitation
- [x] Write unit tests
- [x] Commit changes

## Phase 3: Link Navigation (3-5 hours)

- [x] Create `src/LinkExtractor.ts` class
- [x] Parse markdown for link patterns
- [x] Extract wiki, markdown, external links
- [x] Build outbound link index
- [x] Implement link resolution
- [x] Implement `obsidian_get_links` tool
- [x] Implement `obsidian_follow_link` tool (fail on ambiguous)
- [x] Write unit tests
- [x] Commit changes

## Phase 4: Backlinks (3-4 hours)

- [x] Build reverse link index (virtual index in logic)
- [x] Scan all files in vault (with cache fallback)
- [x] Build bidirectional index (virtual index in logic)
- [x] Implement `obsidian_get_backlinks` tool
- [ ] Implement `obsidian_get_link_graph` tool
- [x] Add caching (uses `VaultCacheService` if ready)
- [x] Write unit tests
- [x] Commit changes

## Phase 5: Dataview Engine (10-14 hours)

- [x] Install dependency: `npm install js-yaml`
- [x] Create `src/VaultIndexer.ts` class
- [x] Create `src/QueryParser.ts` class (implemented in `DataviewEngine.ts`)
- [x] Create `src/QueryExecutor.ts` class (implemented in `DataviewEngine.ts`)
- [x] Implement `obsidian_execute_dataview` tool
- [x] Add debug mode
- [x] Write unit tests
- [x] Commit changes

## Phase 6: Documentation (3-4 hours)

- [x] Update README.md with new tools
- [x] Document Dataview syntax
- [x] Add limitations section
- [x] Create troubleshooting guide
- [x] Create example queries
- [x] Document safety features
- [x] Document rate limiting
- [x] Document backup system
- [x] Create configuration examples
- [x] Commit changes

## Phase 7: Testing (4-6 hours)

### 7.1 Setup Testing Infrastructure (1 hour)

- [x] Install Vitest dependencies
- [x] Create `vitest.config.ts`
- [x] Create test structure
- [x] Add scripts to package.json
- [x] Commit changes

### 7.2 Unit Tests (1-2 hours)

- [x] Write unit tests for MarkdownRenderer
- [x] Write unit tests for LinkExtractor
- [x] Write unit tests for QueryParser
- [x] Write unit tests for QueryExecutor
- [x] Verify coverage ≥75% (achieved for core logic)
- [x] Commit changes

### 7.3 Manual Testing (1 hour)

- [ ] Create test script
- [x] Run MCP Inspector (manually verified by user)
- [ ] Test all tools manually
- [ ] Document findings
- [ ] Commit changes

### 7.4 Integration Testing (1-2 hours)

- [ ] Configure OpenCode
- [x] Test with real vault (copy)
- [x] Test with community vaults
- [ ] Test workflows:
  - [ ] Render and navigate
  - [ ] Dataview query debugging
  - [ ] Mermaid validation
  - [ ] Full agent workflow
- [ ] Test with Claude Desktop (occasional)
- [ ] Document issues and fixes
- [ ] Commit changes

### 7.5 CI/CD Setup (0.5 hour)

- [ ] Create `.github/workflows/test.yml`
- [ ] Test GitHub Actions
- [ ] Commit changes

## Phase 8: Safety Layer (10-15 hours)

### 8.1 Setup Safety Infrastructure (2-3 hours)

- [x] Add safety configuration to env vars
- [x] Create backup directory structure
- [x] Setup operation logging
- [x] Create lock file manager
- [x] Commit changes

### 8.2 Implement Write Protection (3-4 hours)

- [x] Implement write modes (off, safe, confirm, full)
- [x] Implement conflict detection
- [x] Implement sync awareness
- [x] Implement rate limiting (default OFF)
- [x] Integrate safety checks in all write tools
- [x] Commit changes

### 8.3 Add Safety Tools (2-3 hours)

- [x] Implement `obsidian_set_write_mode` tool
- [x] Implement `obsidian_get_operation_history` tool
- [x] Implement `obsidian_undo_operation` tool
- [x] Implement `obsidian_emergency_stop` tool
- [x] Commit changes

### 8.4 Add Logging & Backup (2-3 hours)

- [x] Implement operation logging
- [x] Implement backup before write
- [x] Implement backup query interface
- [x] Implement automatic cleanup
- [x] Commit changes

### 8.5 Tests (1-2 hours)

- [x] Write unit tests for safety logic
- [x] Write unit tests for safety tools (handled in logic tests)
- [ ] Test backup/restore
- [x] Commit changes

## Phase 2: Mermaid Validation (3-4 hours)

- [x] Create `src/MermaidValidator.ts` class
- [x] Implement mermaid validation via CLI
- [x] Generate SVG on success (optional)
- [x] Implement `obsidian_validate_mermaid` tool
- [x] Document limitation
- [ ] Write unit tests
- [ ] Commit changes

## Phase 3: Link Navigation (3-5 hours)

- [x] Create `src/LinkExtractor.ts` class
- [x] Parse markdown for link patterns
- [x] Extract wiki, markdown, external links
- [x] Build outbound link index
- [x] Implement link resolution
- [x] Implement `obsidian_get_links` tool
- [x] Implement `obsidian_follow_link` tool (fail on ambiguous)
- [ ] Write unit tests
- [ ] Commit changes

## Phase 4: Backlinks (3-4 hours)

- [x] Build reverse link index (implemented in `obsidian_get_backlinks` logic)
- [x] Scan all files in vault (with cache fallback)
- [x] Build bidirectional index (virtual index in logic)
- [x] Implement `obsidian_get_backlinks` tool
- [ ] Implement `obsidian_get_link_graph` tool
- [x] Add caching (uses `VaultCacheService` if ready)
- [ ] Write unit tests
- [ ] Commit changes

## Phase 5: Dataview Engine (10-14 hours)

- [x] Install dependency: `npm install js-yaml`
- [x] Create `src/VaultIndexer.ts` class
- [x] Create `src/QueryParser.ts` class (implemented in `DataviewEngine.ts`)
- [x] Create `src/QueryExecutor.ts` class (implemented in `DataviewEngine.ts`)
- [x] Implement `obsidian_execute_dataview` tool
- [x] Add debug mode
- [ ] Write unit tests
- [ ] Commit changes

## Phase 6: Documentation (3-4 hours)

- [x] Update README.md with new tools
- [x] Document Dataview syntax (handled in README summary)
- [x] Add limitations section (handled in README summary)
- [ ] Create troubleshooting guide
- [ ] Create example queries
- [x] Document safety features (added to README)
- [x] Document rate limiting (added to README)
- [x] Document backup system (added to README)
- [x] Create configuration examples (added to README)
- [ ] Commit changes

## Phase 7: Testing (4-6 hours)

### 7.1 Setup Testing Infrastructure (1 hour)

- [ ] Install Vitest dependencies
- [ ] Create `vitest.config.ts`
- [ ] Create test structure
- [ ] Add scripts to package.json
- [ ] Commit changes

### 7.2 Unit Tests (1-2 hours)

- [ ] Write unit tests for MarkdownRenderer
- [ ] Write unit tests for LinkExtractor
- [ ] Write unit tests for QueryParser
- [ ] Write unit tests for QueryExecutor
- [ ] Verify coverage ≥75%
- [ ] Commit changes

### 7.3 Manual Testing (1 hour)

- [ ] Create test script
- [ ] Run MCP Inspector
- [ ] Test all tools manually
- [ ] Document findings
- [ ] Commit changes

### 7.4 Integration Testing (1-2 hours)

- [ ] Configure OpenCode
- [ ] Test with real vault (copy)
- [ ] Test with community vaults
- [ ] Test workflows:
  - [ ] Render and navigate
  - [ ] Dataview query debugging
  - [ ] Mermaid validation
  - [ ] Full agent workflow
- [ ] Test with Claude Desktop (occasional)
- [ ] Document issues and fixes
- [ ] Commit changes

### 7.5 CI/CD Setup (0.5 hour)

- [ ] Create `.github/workflows/test.yml`
- [ ] Test GitHub Actions
- [ ] Commit changes

## Phase 8: Safety Layer (10-15 hours)

### 8.1 Setup Safety Infrastructure (2-3 hours)

- [x] Add safety configuration to env vars
- [x] Create backup directory structure (handled in `SafetyManager.ts`)
- [x] Setup operation logging
- [x] Create lock file manager (virtual locks in `SafetyManager.ts`)
- [x] Commit changes

### 8.2 Implement Write Protection (3-4 hours)

- [x] Implement write modes (off, safe, confirm, full)
- [x] Implement conflict detection
- [x] Implement sync awareness
- [x] Implement rate limiting (default OFF)
- [x] Integrate safety checks in all write tools
- [x] Commit changes

### 8.3 Add Safety Tools (2-3 hours)

- [x] Implement `obsidian_set_write_mode` tool
- [x] Implement `obsidian_get_operation_history` tool
- [x] Implement `obsidian_undo_operation` tool
- [x] Implement `obsidian_emergency_stop` tool
- [x] Commit changes

### 8.4 Add Logging & Backup (2-3 hours)

- [x] Implement operation logging
- [x] Implement backup before write
- [x] Implement backup query interface
- [x] Implement automatic cleanup
- [x] Commit changes

### 8.5 Tests (1-2 hours)

- [ ] Write unit tests for safety logic
- [ ] Write unit tests for safety tools
- [ ] Test backup/restore
- [ ] Commit changes

### 8.2 Implement Write Protection (3-4 hours)

- [ ] Implement write modes (off, safe, confirm, full)
- [ ] Implement conflict detection
- [ ] Implement sync awareness
- [ ] Implement rate limiting (default OFF)
- [ ] Commit changes

### 8.3 Add Safety Tools (2-3 hours)

- [ ] Implement `obsidian_set_write_mode` tool
- [ ] Implement `obsidian_get_operation_history` tool
- [ ] Implement `obsidian_undo_operation` tool
- [ ] Implement `obsidian_emergency_stop` tool
- [ ] Commit changes

### 8.4 Add Logging & Backup (2-3 hours)

- [ ] Implement operation logging
- [ ] Implement backup before write
- [ ] Implement backup query interface
- [ ] Implement automatic cleanup
- [ ] Commit changes

### 8.5 Tests (1-2 hours)

- [ ] Write unit tests for safety logic
- [ ] Write unit tests for safety tools
- [ ] Test backup/restore
- [ ] Commit changes

---

## Completed Tasks

- 2026-01-01: Phase 0 Setup & Fork complete.

---

## Notes

- Mermaid CLI already installed globally (`npm install -g @mermaid-js/mermaid-cli` done)
- Testing will use your real vault and community example vaults
- Rate limiting OFF by default, available to enable
- Safety mode defaults to `safe`
- File-based backups (no git conflicts)
