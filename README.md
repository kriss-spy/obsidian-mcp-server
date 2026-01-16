# Obsidian MCP Server

[![TypeScript](https://img.shields.io/badge/TypeScript-^5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![Model Context Protocol](https://img.shields.io/badge/MCP%20SDK-^1.13.0-green.svg)](https://modelcontextprotocol.io/)
[![Version](https://img.shields.io/badge/Version-2.1.0-blue.svg)](./CHANGELOG.md)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Status](https://img.shields.io/badge/Status-Production-brightgreen.svg)](https://github.com/cyanheads/obsidian-mcp-server/issues)
[![GitHub](https://img.shields.io/github/stars/cyanheads/obsidian-mcp-server?style=social)](https://github.com/cyanheads/obsidian-mcp-server)

**Empower your AI agents and development tools with seamless Obsidian integration!**

An MCP (Model Context Protocol) server providing comprehensive access to your Obsidian vault. Enables LLMs and AI agents to read, write, search, and manage your notes and files through the [Obsidian Local REST API plugin](https://github.com/coddingtonbear/obsidian-local-rest-api).

Built on the [`cyanheads/mcp-ts-template`](https://github.com/cyanheads/mcp-ts-template), this server follows a modular architecture with robust error handling, logging, and security features.

## 🚀 Core Capabilities: Obsidian Tools 🛠️

This server equips your AI with specialized tools to interact with your Obsidian vault:

### Note Management

| Tool Name                 | Description                                             | Key Features                                                                                                                                                                                     |
| :------------------------ | :------------------------------------------------------ | :----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `obsidian_read_note`      | Retrieves the content and metadata of a specified note. | - Read in `markdown` or `json` format.<br/>- Case-insensitive path fallback.                                                                                                                     |
| `obsidian_update_note`    | Modifies notes using whole-file operations.             | - `append`, `prepend`, or `overwrite` content.<br/>- Can create files if they don't exist.                                                                                                       |
| `obsidian_search_replace` | Performs search-and-replace operations within a note.   | - Supports string or regex search.<br/>- Sequential replacements.                                                                                                                                |
| `obsidian_delete_note`    | Permanently deletes a specified note.                   | - Case-insensitive path fallback for safety.                                                                                                                                                     |
| `obsidian_move_note`      | Fully automates safe file moves while updating links.   | - Updates all `[[WikiLinks]]` and markdown links automatically<br/>- Performs actual file move via file system<br/>- Auto-rolls back if move fails<br/>- Prevents broken links (FULLY AUTOMATED) |

### Search & Navigation

| Tool Name                      | Description                                     | Key Features                                                                                                                              |
| :----------------------------- | :---------------------------------------------- | :---------------------------------------------------------------------------------------------------------------------------------------- |
| `obsidian_quick_switcher_plus` | Native search & navigation driver (CDP).        | - Supports shorthand: `#headings`, `>commands`, `$symbols`, `files`.<br/>- Automatically extracts suggestions from the UI. (Native Only)  |
| `obsidian_fuzzy_search_notes`  | Finds notes using fuzzy filename matching.      | - Similar to Obsidian Quick Switcher.<br/>- Supports partial matches, typos, subsequences.<br/>- Returns top matches ranked by relevance. |
| `obsidian_global_search`       | Performs a search across the entire vault.      | - Text or regex search.<br/>- Filter by path and modification date.                                                                       |
| `obsidian_list_notes`          | Lists notes and subdirectories in a folder.     | - Formatted tree view of the directory.                                                                                                   |
| `obsidian_get_links`           | Extracts all links from a markdown file.        | - Wiki links, markdown links, and external URLs.<br/>- Resolves internal links to absolute paths.                                         |
| `obsidian_follow_link`         | Resolves a link and returns the target content. | - Handles short paths and wiki-links.<br/>- Fails on ambiguous matches for safety.                                                        |
| `obsidian_get_backlinks`       | Finds all files that link to a specified file.  | - Reverse link discovery across the vault.<br/>- Uses cache for high performance.                                                         |
| `obsidian_get_symbols`         | Extracts headings from a markdown file.         | - Returns heading levels and line numbers.                                                                                                |

### Metadata & Advanced Features

| Tool Name                     | Description                              | Key Features                                                                                      |
| :---------------------------- | :--------------------------------------- | :------------------------------------------------------------------------------------------------ |
| `obsidian_manage_frontmatter` | Manages a note's YAML frontmatter.       | - `get`, `set`, or `delete` frontmatter keys.                                                     |
| `obsidian_manage_tags`        | Adds, removes, or lists tags for a note. | - Frontmatter and inline tag support.                                                             |
| `obsidian_execute_dataview`   | Executes Dataview queries.               | - Native DQL/DataviewJS support (via CDP).<br/>- Simplified local fallback (REST).                |
| `obsidian_get_metadata_cache` | Accesses native metadata cache.          | - Real-time vault stats, tags, and link graph (via CDP).                                          |
| `obsidian_get_day_schedule`   | Fetches unified chronological schedule.  | - Aggregates tasks from all files for a specific date using Dataview.<br/>- Extracts time-blocks. |
| `obsidian_update_day_planner` | Manages daily note schedule.             | - Intelligently updates the `## Day planner` section.<br/>- Strictly 24h format.                  |
| `obsidian_get_three_day_plan` | High-level planning wrapper.             | - Aggregates schedule for today, tomorrow, and the day after.                                     |
| `obsidian_execute_command`    | Executes native Obsidian commands.       | - Native execution via CDP (100% reliability) or REST fallback.                                   |
| `obsidian_get_ui_snapshot`    | Captures UI state (Tree + Screenshot).   | - Returns structural JSON and saves PNG to `backups/debug/`. (Native Only)                        |
| `obsidian_ui_action`          | Performs native UI interactions.         | - `click`, `type`, `hover`, `scroll`. (Native Only)                                               |
| `obsidian_render_html`        | Renders a markdown file to HTML.         | - Syntax highlighting for code blocks.<br/>- Useful for viewing note structure.                   |
| `obsidian_validate_mermaid`   | Validates mermaid diagram syntax.        | - Uses mermaid-cli for validation.<br/>- Returns rendered SVG if successful.                      |

---

## 🚀 "God Mode": Native CDP Integration

This server now supports **Hybrid Bridge** architecture, combining the stability of the REST API with the native power of the Chrome DevTools Protocol (CDP).

### Benefits of CDP Mode

- **Full Dataview Support**: Execute complex DQL and even `dataviewjs` queries.
- **Native Performance**: Access Obsidian's internal `metadataCache` and `app` object directly.
- **UI Interaction**: (Coming soon) Control Obsidian's UI, panels, and other plugins.

### Enabling CDP Mode

1.  **Start Obsidian with Remote Debugging**:

    - Close Obsidian.
    - Start it from the command line with the port flag:

      ```bash
      # macOS
      /Applications/Obsidian.app/Contents/MacOS/Obsidian --remote-debugging-port=9222

      # Windows
      %LocalAppData%\Obsidian\Obsidian.exe --remote-debugging-port=9222

      # Linux
      obsidian --remote-debugging-port=9222
      ```

2.  **Update `.env`**:
    ```bash
    OBSIDIAN_CDP_ENABLED=true
    OBSIDIAN_CDP_PORT=9222
    ```
3.  **Restart the MCP Server**.

The server will automatically detect if CDP is available. If not, it gracefully degrades to REST-only mode.

---

## 🛡️ Safety Features

This server includes a robust safety layer to protect your data, especially when used with AI agents that might make mistakes.

### 1. Write Protection Modes

- **`off`**: Read-only. No modifications allowed.
- **`safe` (Default)**: Backups created before every write. Conflict detection enabled.
- **`confirm`**: The server will ask for confirmation (via MCP response) before every write.
- **`full`**: No restrictions. Use with caution.

### 2. Automatic Backups

Every time a file is modified or deleted, a backup is automatically created in the `backups/` directory. Backups are retained for 30 days by default.

### 3. Conflict Detection

The server checks the last modification time of a file before writing. If it was modified recently (e.g., within 30 seconds), it will reject the write to prevent overwriting your manual changes or sync conflicts.

### 4. Operation Logging & Undo

Every write action performed by the agent is logged. You can query the history and undo any operation using its unique ID. The agent can see the last 7 days of its own history.

---

## 🚀 Installation & Setup

### Prerequisites

1. **Obsidian**: Installed and running.
2. **Obsidian Local REST API Plugin**: [Install here](https://github.com/coddingtonbear/obsidian-local-rest-api).
3. **API Key**: reveal and copy from plugin settings.
4. **Mermaid CLI (Optional)**: `npm install -g @mermaid-js/mermaid-cli` for mermaid validation.

### Configuration

Add to your MCP client settings (e.g., `claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "obsidian": {
      "command": "node",
      "args": ["/path/to/obsidan-mcp/dist/index.js"],
      "env": {
        "OBSIDIAN_API_KEY": "your-api-key",
        "OBSIDIAN_VAULT_PATH": "/path/to/your/vault",
        "OBSIDIAN_BASE_URL": "https://127.0.0.1:27124",
        "OBSIDIAN_VERIFY_SSL": "false",
        "WRITE_MODE": "safe",
        "BACKUP_ENABLED": "true"
      }
    }
  }
}
```

---

## 🛠️ Development

### Setup Test Vaults

Run the provided script to set up community example vaults for safe testing:

```bash
./scripts/setup-vaults.sh
```

### Build & Test

```bash
npm install
npm run build
npm test          # Run unit tests (Vitest)
npm run inspect   # Start MCP Inspector
```

---

## 🧪 Experimental Features

These features are planned but not implemented. They represent advanced capabilities for future development.

### Semantic Search with RAG (Not Implemented)

**Goal:** Enable agents to understand vault content semantically (meaning-based, not just keyword matching).

**Current limitation:** Agents can only use keyword search (`obsidian_global_search`) and link-based navigation. They lack semantic understanding.

**What this adds:**

- Find notes by meaning, not just exact words
- Understand vault themes and clusters
- Retrieve contextually relevant information
- Enable "related notes" discovery beyond explicit links

**References & Inspiration:**

- [Obsidian Copilot: Search and Knowledge Retrieval](https://deepwiki.com/logancyang/obsidian-copilot/5-search-and-knowledge-retrieval)

**See `IMPLEMENTATION_PLAN.md - Phase 9`** for full implementation details including:

- Embedding provider options (OpenAI, Anthropic, local)
- Vector storage approach
- Background indexing process
- Configuration examples

**Status:** Not started (Experimental - Opt-in only, disabled by default)

---

## License

Apache License 2.0 - see [LICENSE](LICENSE) for details.

---

<div align="center">
Built with the <a href="https://modelcontextprotocol.io/">Model Context Protocol</a>
</div>
