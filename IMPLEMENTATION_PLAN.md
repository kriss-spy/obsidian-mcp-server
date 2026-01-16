# Obsidian MCP Server - Enhanced Implementation Plan

**Project:** Enhanced cyanheads/obsidian-mcp-server
**Goal:** Add HTML rendering, LSP features, Dataview support, Mermaid validation, and safety mechanisms
**Estimated Time:** 42-58 hours across 8 phases

---

## Overview

This plan enhances the cyanheads/obsidian-mcp-server with new capabilities to make Obsidian vaults accessible to AI agents (OpenCode, Claude Desktop) while ensuring data safety.

### Base Repository

- Fork of: `cyanheads/obsidian-mcp-server`
- Tech Stack: TypeScript, Node.js
- Existing Tools: 20+ tools for CRUD, search, commands, etc.

### New Features (8 Phases)

1. **HTML Rendering** - Basic markdown to HTML with syntax highlighting
2. **Mermaid Validation** - Check mermaid diagrams via CLI tool
3. **Link Navigation** - Extract links, follow links, require full paths
4. **Backlinks** - Find files linking to target, link graph
5. **Dataview Engine** - Execute TABLE/LIST/GROUP BY queries locally
6. **Documentation** - Complete README, examples, troubleshooting
7. **Testing** - Unit tests (Vitest), CI/CD (GitHub Actions), manual testing
8. **Safety Layer** - Write protection, backups, conflict detection, rate limiting (default off)

---

## Phase Breakdown

### Phase 0: Setup & Fork (1-2 hours)

**Goal:** Working development environment

**Tasks:**

- [ ] Fork `cyanheads/obsidian-mcp-server` to your GitHub
- [ ] Clone to `/home/krisspy/Desktop/obsidan-mcp`
- [ ] Install dependencies: `npm install`
- [ ] Review existing code structure and tools
- [ ] Configure Obsidian Local REST API
- [ ] Test basic connection (use existing tools)
- [ ] Initialize Git repository
- [ ] Create initial commit: `chore: fork and setup dev environment`

**Dependencies:** None

**Deliverables:**

- Working local dev environment
- Obsidian REST API configured and tested
- Git repository initialized

---

### Phase 1: HTML Rendering (4-6 hours)

**Goal:** Render markdown to HTML with syntax highlighting

**New Tool:** `obsidian_render_html`

**Tasks:**

- [ ] Install dependencies: `npm install markdown-it highlight.js`
- [ ] Create `src/MarkdownRenderer.ts` class
- [ ] Implement markdown-it with CommonMark compliance
- [ ] Add plugins: tables, strikethrough, task lists
- [ ] Integrate highlight.js for syntax highlighting
- [ ] Extract and preserve code blocks (mermaid, dataview, etc.)
- [ ] Implement `obsidian_render_html` tool
  - Input: `filepath` (string, required)
  - Output: HTML string
  - Process: Read file → Parse → Render → Return HTML
- [ ] Error handling: File not found, invalid markdown
- [ ] Unit tests (Phase 7)
- [ ] Commit: `feat: add HTML rendering with syntax highlighting`

**Dependencies:** Phase 0

**Deliverables:**

- Working HTML rendering
- Syntax highlighted code blocks
- Preserved special blocks (mermaid, dataview)
- Tool: `obsidian_render_html`

**Limitations Documented:**

- Does NOT render plugin content (Dataview, Canvas, etc.)
- Only standard markdown + code blocks

---

### Phase 2: Mermaid Validation (3-4 hours)

**Goal:** Validate mermaid diagram syntax using CLI tool

**New Tool:** `obsidian_validate_mermaid`

**Tasks:**

- [ ] Install mermaid CLI: `npm install -g @mermaid-js/mermaid-cli`
- [ ] Create `src/MermaidValidator.ts` class
- [ ] Implement mermaid validation via CLI
- [ ] Generate SVG on success (optional output)
- [ ] Implement `obsidian_validate_mermaid` tool
  - Input: `filepath` (string, required) or `diagram_code` (string, optional)
  - Output: `{ valid: boolean, error: string | null, svg_url: string | null }`
  - Process: Extract mermaid → Run `mmdc` → Return result
- [ ] Document limitation: "Valid ≠ supported in Obsidian"
- [ ] Unit tests (Phase 7)
- [ ] Commit: `feat: add mermaid diagram validation`

**Dependencies:** Phase 0 (already installed globally)

**Deliverables:**

- Working mermaid syntax validation
- SVG generation option
- Tool: `obsidian_validate_mermaid`

---

### Phase 3: Link Navigation (3-5 hours)

**Goal:** Extract and navigate internal/external links

**New Tools:** `obsidian_get_links`, `obsidian_follow_link`

**Tasks:**

- [ ] Create `src/LinkExtractor.ts` class
- [ ] Parse markdown files for link patterns
- [ ] Extract: `[[wiki-links]]`, `[markdown links](file.md)`, `[external links](https://...)`
- [ ] Build outbound link index: `{ filepath: [links] }`
- [ ] Implement link resolution (absolute/relative paths)
- [ ] Implement `obsidian_get_links` tool
  - Input: `filepath` (string, required), `link_type` (optional)
  - Output: Array of `{ link, type, line_number, context }`
  - Fail on ambiguous matches (require full paths)
- [ ] Implement `obsidian_follow_link` tool
  - Input: `source_file`, `link_text` (both required)
  - Output: Content of linked file
  - Error: "Found X files named 'Y', use full path"
- [ ] Unit tests (Phase 7)
- [ ] Commit: `feat: add link extraction and navigation`

**Dependencies:** Phase 0

**Deliverables:**

- Working link extraction
- Link resolution (explicit paths only)
- Tools: `obsidian_get_links`, `obsidian_follow_link`

---

### Phase 4: Backlinks (3-4 hours)

**Goal:** Find files linking to target, build link graph

**New Tools:** `obsidian_get_backlinks`, `obsidian_get_link_graph`

**Tasks:**

- [ ] Build reverse link index from Phase 3
- [ ] Scan all files in vault
- [ ] Build bidirectional index:
  ```typescript
  linkIndex: {
    [filepath]: {
      outbound: [links],
      inbound: [backlinks]
    }
  }
  ```
- [ ] Implement `obsidian_get_backlinks` tool
  - Input: `filepath` (string, required), `include_context` (boolean, default false)
  - Output: Array of `{ source_file, link_text, line_number, context }`
  - Cache index for 5 minutes
- [ ] Implement `obsidian_get_link_graph` tool
  - Input: `filepath` (optional, if omitted return full vault graph)
  - Output: JSON graph with nodes and edges
  - Format:
    ```json
    {
      "nodes": ["note1.md", "note2.md"],
      "edges": [{ "from": "note1.md", "to": "note2.md", "label": "see also" }]
    }
    ```
  - ⚠️ **NOT IMPLEMENTED** - Tool directory exists but no implementation
- [ ] Unit tests (Phase 7)
- [ ] Commit: `feat: add backlinks and link graph`

**Dependencies:** Phase 3

**Deliverables:**

- Working backlink discovery
- Cached index for performance
- Tools: `obsidian_get_backlinks`

---

### Phase 5: Dataview Engine (10-14 hours)

**Goal:** Execute Dataview queries locally (TABLE, LIST, GROUP BY, WHERE, SORT)

**New Tool:** `obsidian_execute_dataview`

**Tasks:**

- [ ] Install dependency: `npm install js-yaml`
- [ ] Create `src/VaultIndexer.ts` class
  - Scan vault files
  - Extract: frontmatter (YAML), tags, headings, links, properties
  - Build in-memory index
  - Cache with 5-minute TTL
  - Update incrementally on file changes
- [ ] Create `src/QueryParser.ts` class
  - Tokenize Dataview syntax
  - Build simple AST:
    ```typescript
    {
      type: "list" | "table",
      from: string,
      where: expression,
      sort: { field, direction },
      group_by?: string
    }
    ```
  - Support: TABLE, LIST, GROUP BY, WHERE, SORT, LIMIT
- [ ] Create `src/QueryExecutor.ts` class
  - Execute parsed queries against index
  - Support operators: `=`, `!=`, `>`, `<`, `contains()`, `AND`, `OR`
  - ⚠️ **Functions**: `sum()`, `avg()`, `count()`, `length()` - **Not implemented**
  - Format results:
    - TABLE: HTML table
    - LIST: Bulleted list
    - TASK: Checkable items
    - JSON: Structured data
- [ ] Implement `obsidian_execute_dataview` tool
  - Input: `query` (string, required), `debug` (boolean, default false)
  - Output: Results + optional debug info
  - Debug mode returns:
    ```json
    {
      "results": [...],
      "debug_info": {
        "parsed_query": { ... },
        "execution_time_ms": 45,
        "files_scanned": 142,
        "files_matched": 3,
        "warnings": [
          "Field 'illustrator' not found in 12 files"
        ]
      }
    }
    ```
- [ ] Unit tests (Phase 7)
- [ ] Commit: `feat: add Dataview query engine`

**Dependencies:** Phase 0

**Deliverables:**

- Working Dataview-like query executor
- Vault indexer for metadata
- Tool: `obsidian_execute_dataview`

**Supported Query Features:**

- ✅ TABLE and LIST queries
- ✅ FROM filters (file paths, tags, links)
- ✅ WHERE clauses (basic comparisons, AND/OR logic, contains())
- ✅ SORT (single field, ASC/DESC)
- ✅ LIMIT
- ❌ GROUP BY (basic) - **Not implemented**
- ❌ Functions: sum(), avg(), count(), length() - **Not implemented**
- ❌ FLATTEN (advanced)
- ❌ Custom JS functions

---

### Phase 6: Documentation (3-4 hours)

**Goal:** Complete documentation for all new tools

**Tasks:**

- [ ] Update README.md with new tools section
  - Add each tool with description, input/output examples
- [ ] Document Dataview query syntax (supported features, limitations)
- [ ] Add limitations section (plugin rendering, mermaid partial support)
- [ ] Create troubleshooting guide (`docs/troubleshooting.md`)
- [ ] Create example queries (`examples/dataview/`)
  - Your use case: LIST with contains() and OR
  - Common patterns: TAG filtering, date ranges, etc.
- [ ] Document safety features (Phase 8)
- [ ] Document rate limiting (default off, how to enable)
- [ ] Document backup system (file-based, 30-day retention)
- [ ] Create configuration examples (`docs/config-examples.md`)
- [ ] Commit: `docs: add comprehensive documentation and examples`

**Dependencies:** All previous phases

**Deliverables:**

- Complete README
- Troubleshooting guide
- Example queries
- Configuration documentation

---

### Phase 7: Testing (4-6 hours)

**Goal:** Unit tests, CI/CD, manual testing

**Tasks:**

#### 7.1 Setup Testing Infrastructure (1 hour)

- [ ] Install dependencies: `npm install -D vitest @vitest/ui @vitest/coverage`
- [ ] Create `vitest.config.ts`
- [ ] Create test structure:
  ```
  tests/
  ├── unit/
  │   ├── MarkdownRenderer.test.ts
  │   ├── LinkExtractor.test.ts
  │   ├── VaultIndexer.test.ts
  │   ├── QueryParser.test.ts
  │   └── DataviewEngine.test.ts
  ├── integration/
  │   ├── rest-api-client.test.ts
  │   └── mermaid-cli.test.ts
  ├── fixtures/
  │   └── sample-vaults/
  └── e2e/
      └── workflows.test.ts
  ```
- [ ] Add scripts to package.json:
  ```json
  {
    "test": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest --coverage"
  }
  ```
- [ ] Commit: `chore: setup Vitest testing framework`

#### 7.2 Unit Tests (1-2 hours)

- [ ] Write unit tests for MarkdownRenderer
  - Basic markdown → HTML
  - Code blocks with syntax highlighting
  - Mermaid block preservation
- [ ] Write unit tests for LinkExtractor
  - Wiki link extraction
  - Markdown link extraction
  - Ambiguous link error handling
- [ ] Write unit tests for QueryParser
  - Query tokenization
  - AST building
  - Error cases (invalid syntax)
- [ ] Write unit tests for QueryExecutor
  - LIST queries with WHERE
  - OR logic in WHERE clauses
  - SORT functionality
- [ ] Target coverage: ≥75%
- [ ] Commit: `test: add unit tests for core functionality`

#### 7.3 Manual Testing (1 hour)

- [ ] Create script `scripts/test-with-inspector.sh`
- [ ] Run MCP Inspector: `npx @modelcontextprotocol/inspector node build/index.js`
- [ ] Test all tools manually:
  - [ ] `obsidian_render_html`
  - [ ] `obsidian_validate_mermaid`
  - [ ] `obsidian_get_links`
  - [ ] `obsidian_follow_link`
  - [ ] `obsidian_get_backlinks`
  - [ ] `obsidian_get_link_graph`
  - [ ] `obsidian_execute_dataview`
- [ ] Document findings in TODO.md
- [ ] Commit: `test: manual testing with MCP Inspector`

#### 7.4 Integration Testing (1-2 hours)

- [ ] Configure OpenCode with MCP server
- [ ] Test with real vault:
  - [ ] Your daily use vault (copy)
  - [ ] Downloaded community example vaults
- [ ] Test workflows:
  1. Render and navigate
  2. Dataview query debugging
  3. Mermaid validation
  4. Full agent workflow
- [ ] Test with Claude Desktop (occasional)
- [ ] Document issues and fixes
- [ ] Commit: `test: integration testing with real vaults`

#### 7.5 CI/CD Setup (0.5 hour)

- [ ] Create `.github/workflows/test.yml`:

  ```yaml
  name: Tests

  on:
    push:
      branches: [main, develop]
    pull_request:
      branches: [main]

  jobs:
    test:
      runs-on: ubuntu-latest
      steps:
        - name: Checkout code
          uses: actions/checkout@v4
        - name: Setup Node.js
          uses: actions/setup-node@v4
          with:
            node-version: "22"
        - name: Install dependencies
          run: npm ci
        - name: Run unit tests
          run: npm test
        - name: Generate coverage report
          run: npm run test:coverage
        - name: Upload coverage
          uses: codecov/codecov-action@v3
          with:
            files: ./coverage/coverage-final.json
  ```

- [ ] Commit: `ci: add GitHub Actions for automated testing`

**Dependencies:** All previous phases

**Deliverables:**

- Passing unit tests (≥75% coverage)
- CI/CD running on every commit
- Manual test completion
- Integration tested with OpenCode

---

### Phase 8: Safety Layer (10-15 hours)

**Goal:** Write protection, backups, conflict detection, rate limiting (default off)

**New Tools:** `obsidian_set_write_mode`, `obsidian_get_operation_history`, `obsidian_undo_operation`, `obsidian_emergency_stop`

**Tasks:**

#### 8.1 Setup Safety Infrastructure (2-3 hours)

- [ ] Add safety configuration to environment variables:
  ```typescript
  const config = {
    WRITE_MODE: process.env.WRITE_MODE || "safe",
    BACKUP_ENABLED: process.env.BACKUP_ENABLED === "true",
    BACKUP_DIR: process.env.BACKUP_DIR || "/tmp/obsidian-mcp-backups",
    BACKUP_RETENTION_DAYS: parseInt(process.env.BACKUP_RETENTION_DAYS || "30"),
    OPERATION_LOG_RETENTION_DAYS: parseInt(
      process.env.OPERATION_LOG_RETENTION_DAYS || "30",
    ),
    AGENT_QUERY_WINDOW_HOURS: parseInt(
      process.env.AGENT_QUERY_WINDOW_HOURS || "168",
    ), // 7 days
    CONFLICT_DETECTION: process.env.CONFLICT_DETECTION === "true",
    SYNC_AWARE_WRITES: process.env.SYNC_AWARE_WRITES === "true",
    SYNC_BUFFER_SECONDS: parseInt(process.env.SYNC_BUFFER_SECONDS || "60"),
    RATE_LIMITING_ENABLED: process.env.RATE_LIMITING_ENABLED === "false", // Default OFF
    PROTECTED_PATTERNS: process.env.PROTECTED_PATTERNS?.split(",") || [],
  };
  ```
- [ ] Create backup directory structure
- [ ] Setup operation logging (file-based database)
- [ ] Create lock file manager
- [ ] Commit: `chore: setup safety infrastructure`

#### 8.2 Implement Write Protection (3-4 hours)

- [ ] Implement write modes: `off`, `safe`, `confirm`, `full`
  - `off`: Read-only
  - `safe`: Backups + conflict checks (default)
  - `confirm`: Manual approval for each write
  - `full`: No restrictions
- [ ] Implement conflict detection
  - Check file modification time before write
  - Don't write if conflicts exist (strict mode)
- [ ] Implement sync awareness
  - Check last sync time
  - Don't write within sync buffer (60 seconds)
- [ ] Implement rate limiting (default OFF)
  - Burst protection: 3 writes per 10 seconds
  - Per-file limit: 3 writes per hour
  - Global limit: 20 writes per minute, 5 deletes per minute
  - Only active if `RATE_LIMITING_ENABLED = true`
- [ ] Commit: `feat: add write protection and conflict detection`

#### 8.3 Add Safety Tools (2-3 hours)

- [ ] Implement `obsidian_set_write_mode` tool
  - Input: `mode` (string, enum: ["off", "safe", "confirm", "full"])
  - Output: Confirmation
  - Allow dynamic mode changes
- [ ] Implement `obsidian_get_operation_history` tool
  - Input: `hours` (number, default: 24)
  - Output: Array of operations from within agent query window (7 days)
  - Include: timestamp, operation, file, backup_path
- [ ] Implement `obsidian_undo_operation` tool
  - Input: `operation_id` (string, required)
  - Output: Confirmation
  - Restore from backup
- [ ] Implement `obsidian_emergency_stop` tool
  - Input: `reason` (string, required)
  - Output: Confirmation
  - Set WRITE_MODE = 'off' immediately
- [ ] Commit: `feat: add safety tools (write mode, history, undo, emergency stop)`

#### 8.4 Add Logging & Backup (2-3 hours)

- [ ] Implement operation logging
  - Log all writes (PUT, POST, PATCH, DELETE)
  - Store in file: `/backups/.index.json`
  - Include: operation_id, timestamp, action, file, backup_path
  - Retain for 30 days (configurable)
- [ ] Implement backup before write
  - Copy current file to `/backups/{filepath}_{timestamp}.md`
  - Use relative paths in backup directory
  - Keep backups for 30 days (configurable)
  - Automatic cleanup of old backups
- [ ] Implement backup query interface
  - You can manually check all backups (bypass agent query window)
  - Simple JSON structure for easy parsing
- [ ] Commit: `feat: add operation logging and automatic backups`

#### 8.5 Tests (1-2 hours)

- [ ] Unit tests for safety logic
  - Write mode switching
  - Conflict detection
  - Sync awareness
  - Rate limiting (when enabled)
- [ ] Unit tests for safety tools
  - Operation history queries
  - Undo functionality
  - Emergency stop
- [ ] Test backup/restore
  - Create test file
  - Write to trigger backup
  - Undo write
  - Verify file restored
- [ ] Commit: `test: add safety mechanism tests`

**Dependencies:** Phase 0

**Deliverables:**

- Write protection with 4 modes (default: safe)
- File-based backups (30-day retention)
- Operation logging (30-day retention, 7-day agent query window)
- Conflict detection (strict: don't write if conflicts)
- Sync awareness (60-second buffer)
- Rate limiting (default OFF, can be enabled)
- Emergency stop capability
- Tools: `obsidian_set_write_mode`, `obsidian_get_operation_history`, `obsidian_undo_operation`, `obsidian_emergency_stop`

---

## Timeline & Dependencies

| Phase              | Hours         | Dependencies | Parallel Opportunities        |
| ------------------ | ------------- | ------------ | ----------------------------- |
| Phase 0: Setup     | 1-2           | None         | -                             |
| Phase 1: Rendering | 4-6           | Phase 0      | Can run with Phases 2-4, 6    |
| Phase 2: Mermaid   | 3-4           | Phase 0      | Can run with Phases 1, 3-4, 6 |
| Phase 3: Links     | 3-5           | Phase 0      | Can run with Phases 1-2, 4, 6 |
| Phase 4: Backlinks | 3-4           | Phase 3      | Can run with Phases 1-2, 6    |
| Phase 5: Dataview  | 10-14         | Phase 0      | Can run with Phases 1-4, 6    |
| Phase 6: Docs      | 3-4           | All phases   | -                             |
| Phase 7: Testing   | 4-6           | All phases   | -                             |
| Phase 8: Safety    | 10-15         | Phase 0      | Can run with Phases 1-7       |
| **Total**          | **42-58 hrs** | -            | -                             |

**Actual Hours Used:** ~35-40 hours (some features deferred)

### Deferred Items (Not Implemented)

| Feature                                      | Phase   | Impact |
| -------------------------------------------- | ------- | ------ |
| Dataview GROUP BY                            | Phase 5 | High   |
| Dataview Functions (sum, avg, count, length) | Phase 5 | High   |
| Link Graph Tool (`obsidian_get_link_graph`)  | Phase 4 | Low    |
| Dataview TASK Queries                        | Phase 5 | Low    |
| Rate Limiting (enabled by default)           | Phase 8 | Low    |
| CI/CD GitHub Actions                         | Phase 7 | Low    |

**Critical Path:** Phase 0 → Phase 8 → Phase 5 → Phase 7 → Phase 6 (23-35 hours minimum)

---

## Project Structure

```
obsidan-mcp/
├── IMPLEMENTATION_PLAN.md       # This file
├── TODO.md                     # Task tracking
├── CHANGELOG.md                # Change history
├── package.json                # Dependencies and scripts
├── vitest.config.ts            # Test configuration
│
# CI/CD - NOT IMPLEMENTED
# ├── .github/
# │   └── workflows/
# │       └── test.yml          # CI/CD - runs on every commit
#
├── src/
│   ├── MarkdownRenderer.ts     # HTML rendering
│   ├── MermaidValidator.ts     # Mermaid ├── LinkExtractor.ts validation
│          # Link extraction
│   ├── VaultIndexer.ts        # Dataview index
│   ├── DataviewEngine.ts       # Dataview parser + executor (combined)
│   └── SafetyManager.ts       # Write protection, backups, logging
│
├── tests/
│   ├── unit/                  # Unit tests (5 files, 20 tests)
│   ├── integration/            # Not implemented
│   ├── fixtures/              # Test data
│   │   └── sample-vaults/
│   │       ├── my-vault/      # Copy of daily vault
│   │       └── example-vaults/ # Community example vaults
│   └── e2e/                   # Not implemented
│
├── docs/
│   ├── troubleshooting.md       # Troubleshooting guide
│   ├── EXAMPLE_VAULTS_SETUP.md # Vault setup instructions
│   ├── SAFER_VAULT_SETUP.md   # Safety-focused setup
│   └── obsidian_mcp_tools_spec.md # Tool specifications
│
├── backups/                    # File-based backups (gitignored)
│   ├── .index.json            # Backup catalog
│   └── {filepath}_{timestamp}.md
│
├── scripts/
│   ├── test-with-inspector.sh # Manual testing script
│   ├── setup-vaults.sh        # Vault setup automation
│   └── start-server.sh        # Server startup
│
└── .gitignore                   # Git ignore patterns
```

---

## Quality Checklist

Before considering "done":

**Code Quality:**

- [x] All unit tests pass (`npm test`)
- [x] Coverage ≥75% (`npm run test:coverage`) - **20 tests, >75% coverage**
- [x] TypeScript compiles without errors (`npm run build`)
- [ ] No linting errors - **Not verified**
- [x] Code follows existing patterns from base repo

**Functionality:**

- [x] All tools work in MCP Inspector - **Core tools verified**
- [x] All workflows tested with real AI (OpenCode) - **Confirmed working**
- [ ] Error messages are helpful and actionable - **Not verified**
- [ ] Edge cases handled (empty vault, invalid input, etc.) - **Not verified**

**Documentation:**

- [x] README includes all new tools
- [x] Tool descriptions are clear for LLMs
- [ ] Examples provided for each tool - **Partial**
- [x] Limitations documented clearly
- [x] Troubleshooting guide available
- [x] Safety features documented

**Safety:**

- [x] Backups tested and working
- [x] Conflict detection verified
- [x] Emergency stop tested
- [x] Undo functionality tested
- [ ] Rate limiting verified (when enabled) - **Feature available, OFF by default**

**Integration:**

- [x] Works with OpenCode - **Confirmed**
- [ ] Works with Claude Desktop (tested at least once) - **Not tested**
- [x] Environment variables documented
- [x] Example configuration provided

**⚠️ Known Limitations (Not Implemented):**

- Dataview GROUP BY support
- Dataview aggregate functions (sum, avg, count, length)
- Link graph tool (`obsidian_get_link_graph`)
- Full TASK query support
- CI/CD GitHub Actions workflow

---

## Configuration Example

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "node /path/to/obsidan-mcp/build/index.js",
      "env": {
        "OBSIDIAN_API_KEY": "your-api-key",
        "OBSIDIAN_VAULT_PATH": "/path/to/vault",
        "OBSIDIAN_REST_API_URL": "https://127.0.0.1:27124",

        // Safety Configuration (Optional - defaults apply)
        "WRITE_MODE": "safe", // "off", "safe", "confirm", "full"
        "BACKUP_ENABLED": "true",
        "BACKUP_DIR": "/path/to/backups",
        "BACKUP_RETENTION_DAYS": "30",
        "OPERATION_LOG_RETENTION_DAYS": "30",
        "AGENT_QUERY_WINDOW_HOURS": "168", // 7 days
        "CONFLICT_DETECTION": "true",
        "SYNC_AWARE_WRITES": "true",
        "SYNC_BUFFER_SECONDS": "60",
        "RATE_LIMITING_ENABLED": "false", // Default OFF
        "PROTECTED_PATTERNS": "*.private,Journal/"
      }
    }
  }
}
```

---

## 🧪 Experimental & Optional Features

These features are planned but not implemented. They represent advanced capabilities for future development.

### Phase 9: Semantic Search with RAG (Experimental)

**Goal:** Enable agents to understand vault content semantically (meaning-based, not just keyword matching)

**New Tool:** `obsidian_semantic_search`

#### Why This Feature

**Current limitation:** Agents can only use keyword search (`obsidian_global_search`) and link-based navigation. They lack semantic understanding.

**What this adds:**

- Find notes by meaning, not just exact words
- Understand vault themes and clusters
- Retrieve contextually relevant information
- Enable "related notes" discovery beyond explicit links

#### How It Works

```
1. Embedding Generation (One-time or Periodic)
   All Notes → Text Chunks → Embedding API → Vector Representations

2. Vector Storage
   Vector Database (SQLite + vector extension, or file-based JSON)

3. Semantic Search (Agent Query)
   Query → Embedding → Cosine Similarity → Top-K Results
```

#### Implementation Approach

**Phase 9.1: Basic Semantic Search (4-6 hours)**

- [ ] Choose embedding provider:
  - Option A: OpenAI `text-embedding-3-small` (fast, cheap)
  - Option B: Anthropic embeddings (if available)
  - Option C: Local `sentence-transformers` (free, CPU-bound)
- [ ] Create `src/utils/embeddings/EmbeddingGenerator.ts`
  - API client for chosen provider
  - Batch embedding support
  - Error handling and rate limiting
- [ ] Create `src/utils/embeddings/VectorStore.ts`
  - File-based JSON storage (simplest for MVP)
  - Cosine similarity search
  - CRUD operations for vectors
- [ ] Implement background indexing:
  - Scan vault on startup
  - Split notes into chunks (512-1024 tokens)
  - Generate embeddings
  - Store with metadata (path, chunk_id, timestamp)
- [ ] Implement `obsidian_semantic_search` tool:
  - Input: `{ query, top_k?, filters? }`
  - Output: Ranked results with similarity scores
  - Format:
    ```json
    {
      "results": [
        {
          "note": "projects/24-summber/my-python-module-vocaloid/developing-guide.md",
          "score": 0.92,
          "snippet": "... relevant text snippet ..."
        }
      ]
    }
    ```
- [ ] Unit tests for embedding generation and similarity search
- [ ] Commit: `feat(experimental): add semantic search with embeddings`

**Phase 9.2: Persistent Vector Storage (2-3 hours)**

- [ ] Switch to SQLite with `sqlite-vec` extension
  - Efficient storage for large vaults
  - Faster similarity search
- [ ] Implement delta updates:
  - Track file modification times
  - Only re-index changed files
  - Delete embeddings for removed files
- [ ] Add configuration options:
  - Embedding provider selection
  - Chunk size and overlap
  - Indexing schedule (on-demand vs. periodic)
- [ ] Commit: `feat(experimental): add SQLite vector storage with delta updates`

**Phase 9.3: Advanced Features (3-4 hours)**

- [ ] Hybrid search: Keyword + semantic fusion
  - Combine `obsidian_global_search` with semantic search
  - Weighted ranking (tunable)
- [ ] Query expansion:
  - Rephrase queries for better recall
  - Add related terms from top results
- [ ] Vault summarization:
  - Topic clustering of embeddings
  - Identify main themes automatically
- [ ] Commit: `feat(experimental): add hybrid search and topic clustering`

#### Dependencies

- Phase 0 (basic infrastructure)
- External API key (OpenAI/Anthropic) or local model (Ollama/sentence-transformers)

#### Deliverables

- Working semantic search tool
- Background indexing process
- Persistent vector storage
- Configuration for embedding provider

#### Usage Examples

**Agent Query:**

```
"What notes discuss the relationship between psychology and technology?"
```

**Current (Keyword Search):**

```typescript
obsidian_global_search("psychology technology");
// Returns: notes containing both words (may miss nuanced discussions)
```

**With Semantic Search:**

```typescript
obsidian_semantic_search({
  query: "relationship between psychology and technology",
  top_k: 10,
});
// Returns: notes about human-AI interaction, digital mental health, etc.
```

#### Benefits for Agents

| Capability           | Without Embeddings | With Embeddings      |
| -------------------- | ------------------ | -------------------- |
| Find similar notes   | Keyword match only | Semantic similarity  |
| Understand themes    | Manual exploration | Automatic clustering |
| Context retrieval    | File-by-file       | Top-K ranked results |
| Query flexibility    | Exact matching     | Natural language     |
| Connection discovery | Link-based only    | Meaning-based links  |

#### Configuration Example

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "node /path/to/obsidan-mcp/dist/index.js",
      "env": {
        // ... existing config ...

        // Semantic Search Configuration (Optional)
        "SEMANTIC_SEARCH_ENABLED": "false", // Default OFF, opt-in only
        "EMBEDDING_PROVIDER": "openai", // "openai", "anthropic", "local"
        "EMBEDDING_MODEL": "text-embedding-3-small",
        "EMBEDDING_API_KEY": "your-api-key",
        "CHUNK_SIZE": "512", // Tokens per chunk
        "CHUNK_OVERLAP": "64", // Overlap between chunks
        "VECTOR_STORE_PATH": "/path/to/vectors.db",
        "INDEX_ON_STARTUP": "true"
      }
    }
  }
}
```

#### Considerations

**Pros:**

- ✅ High value for agent understanding
- ✅ Enables true semantic vault comprehension
- ✅ Flexible (can switch providers)
- ✅ Can be opt-in only (disabled by default)

**Cons:**

- ❌ Requires external API or local model
- ❌ Initial indexing time (one-time cost)
- ❌ Storage overhead (vectors for all notes)
- ❌ API costs (if using cloud provider)

**Estimated API Costs (OpenAI):**

- Small vault (500 notes): ~$0.10 (one-time)
- Medium vault (2000 notes): ~$0.40 (one-time)
- Large vault (10k notes): ~$2.00 (one-time)
- Queries: Negligible (~$0.001 per 1K queries)

#### References & Inspiration

- [Obsidian Copilot: Search and Knowledge Retrieval](https://deepwiki.com/logancyang/obsidian-copilot/5-search-and-knowledge-retrieval) - Guide on semantic search implementation for Obsidian

#### Status

**Phase 9.1:** Not started (Experimental - 4-6 hours)
**Phase 9.2:** Not started (Experimental - 2-3 hours)
**Phase 9.3:** Not started (Experimental - 3-4 hours)

**Total Estimated Time:** 9-13 hours

---

## Next Steps

1. Review this plan and ensure all requirements are captured
2. Check TODO.md for current tasks
3. Begin Phase 0 (Setup & Fork)
4. Update TODO.md as tasks complete
5. Update CHANGELOG.md with changes
6. Commit to Git with descriptive messages
7. GitHub Actions will run tests automatically on every commit

---

## Notes

- Mermaid CLI is already installed globally
- Testing will use your real vault and community example vaults
- Rate limiting is OFF by default but available to enable
- Safety mode defaults to `safe`
- File-based backups (no git conflicts with Obsidian Sync)
