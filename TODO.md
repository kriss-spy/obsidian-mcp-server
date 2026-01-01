# TODO - Obsidian MCP Server Enhancement

## Overview
Tracking tasks for implementing enhancements to cyanheads/obsidian-mcp-server

## Phase 0: Setup & Fork (1-2 hours)
        - [x] Fork `cyanheads/obsidian-mcp-server` to your GitHub (https://github.com/kriss-spy/obsidian-mcp-server → Fork button → kriss-spy)
        - [ ] Follow revised steps in PHASE_0_SETUP.md (fresh clone approach to avoid merge conflicts)
        - [ ] Install dependencies: `npm install`
        - [ ] Review existing code structure and tools
        - [ ] Configure Obsidian Local REST API
        - [ ] Test basic connection
        - [x] Initialize Git repository
        - [x] Create initial commit
        - [x] Create project planning documents (IMPLEMENTATION_PLAN.md, TODO.md, CHANGELOG.md)
        - [x] Create directory structure
        - [x] Create PHASE_0_SETUP.md with forking instructions
        - [x] Fix merge conflict issue and provide alternative approaches

**Status:** Planning complete, awaiting fork and clone
**Next Step:** Follow PHASE_0_SETUP.md (revised with fresh clone approach) to complete Phase 0

**Status:** Planning complete, awaiting fork and clone
**Next Step:** Follow instructions in PHASE_0_SETUP.md to fork and clone repository

## Phase 1: HTML Rendering (4-6 hours)
- [ ] Install dependencies: `npm install markdown-it highlight.js`
- [ ] Create `src/MarkdownRenderer.ts` class
- [ ] Implement markdown-it with CommonMark compliance
- [ ] Add plugins: tables, strikethrough, task lists
- [ ] Integrate highlight.js for syntax highlighting
- [ ] Extract and preserve code blocks
- [ ] Implement `obsidian_render_html` tool
- [ ] Add error handling
- [ ] Write unit tests
- [ ] Commit changes

## Phase 2: Mermaid Validation (3-4 hours)
- [ ] Create `src/MermaidValidator.ts` class
- [ ] Implement mermaid validation via CLI
- [ ] Generate SVG on success (optional)
- [ ] Implement `obsidian_validate_mermaid` tool
- [ ] Document limitation
- [ ] Write unit tests
- [ ] Commit changes

## Phase 3: Link Navigation (3-5 hours)
- [ ] Create `src/LinkExtractor.ts` class
- [ ] Parse markdown for link patterns
- [ ] Extract wiki, markdown, external links
- [ ] Build outbound link index
- [ ] Implement link resolution
- [ ] Implement `obsidian_get_links` tool
- [ ] Implement `obsidian_follow_link` tool (fail on ambiguous)
- [ ] Write unit tests
- [ ] Commit changes

## Phase 4: Backlinks (3-4 hours)
- [ ] Build reverse link index
- [ ] Scan all files in vault
- [ ] Build bidirectional index
- [ ] Implement `obsidian_get_backlinks` tool
- [ ] Implement `obsidian_get_link_graph` tool
- [ ] Add caching (5 minutes)
- [ ] Write unit tests
- [ ] Commit changes

## Phase 5: Dataview Engine (10-14 hours)
- [ ] Install dependency: `npm install js-yaml`
- [ ] Create `src/VaultIndexer.ts` class
- [ ] Create `src/QueryParser.ts` class
- [ ] Create `src/QueryExecutor.ts` class
- [ ] Implement `obsidian_execute_dataview` tool
- [ ] Add debug mode
- [ ] Write unit tests
- [ ] Commit changes

## Phase 6: Documentation (3-4 hours)
- [ ] Update README.md with new tools
- [ ] Document Dataview syntax
- [ ] Add limitations section
- [ ] Create troubleshooting guide
- [ ] Create example queries
- [ ] Document safety features
- [ ] Document rate limiting
- [ ] Document backup system
- [ ] Create configuration examples
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
- [ ] Add safety configuration to env vars
- [ ] Create backup directory structure
- [ ] Setup operation logging
- [ ] Create lock file manager
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

*Add completed tasks here with dates*

---

## Notes

- Mermaid CLI already installed globally (`npm install -g @mermaid-js/mermaid-cli` done)
- Testing will use your real vault and community example vaults
- Rate limiting OFF by default, available to enable
- Safety mode defaults to `safe`
- File-based backups (no git conflicts)
