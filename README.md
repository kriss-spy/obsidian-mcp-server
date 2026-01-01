# Obsidian MCP Server

[![TypeScript](https://img.shields.io/badge/TypeScript-^5.8.3-blue.svg)](https://www.typescriptlang.org/)
[![Model Context Protocol](https://img.shields.io/badge/MCP%20SDK-^1.13.0-green.svg)](https://modelcontextprotocol.io/)
[![Version](https://img.shields.io/badge/Version-2.0.7-blue.svg)](./CHANGELOG.md)
[![License](https://img.shields.io/badge/License-Apache%202.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![Status](https://img.shields.io/badge/Status-Production-brightgreen.svg)](https://github.com/cyanheads/obsidian-mcp-server/issues)
[![GitHub](https://img.shields.io/github/stars/cyanheads/obsidian-mcp-server?style=social)](https://github.com/cyanheads/obsidian-mcp-server)

**Empower your AI agents and development tools with seamless Obsidian integration!**

An MCP (Model Context Protocol) server providing comprehensive access to your Obsidian vault. Enables LLMs and AI agents to read, write, search, and manage your notes and files through the [Obsidian Local REST API plugin](https://github.com/coddingtonbear/obsidian-local-rest-api).

Built on the [`cyanheads/mcp-ts-template`](https://github.com/cyanheads/mcp-ts-template), this server follows a modular architecture with robust error handling, logging, and security features.

## 🚀 Core Capabilities: Obsidian Tools 🛠️

This server equips your AI with specialized tools to interact with your Obsidian vault:

### Note Management

| Tool Name                 | Description                                             | Key Features                                                                               |
| :------------------------ | :------------------------------------------------------ | :----------------------------------------------------------------------------------------- |
| `obsidian_read_note`      | Retrieves the content and metadata of a specified note. | - Read in `markdown` or `json` format.<br/>- Case-insensitive path fallback.               |
| `obsidian_update_note`    | Modifies notes using whole-file operations.             | - `append`, `prepend`, or `overwrite` content.<br/>- Can create files if they don't exist. |
| `obsidian_search_replace` | Performs search-and-replace operations within a note.   | - Supports string or regex search.<br/>- Sequential replacements.                          |
| `obsidian_delete_note`    | Permanently deletes a specified note.                   | - Case-insensitive path fallback for safety.                                               |

### Search & Navigation

| Tool Name                | Description                                     | Key Features                                                                                      |
| :----------------------- | :---------------------------------------------- | :------------------------------------------------------------------------------------------------ |
| `obsidian_global_search` | Performs a search across the entire vault.      | - Text or regex search.<br/>- Filter by path and modification date.                               |
| `obsidian_list_notes`    | Lists notes and subdirectories in a folder.     | - Formatted tree view of the directory.                                                           |
| `obsidian_get_links`     | Extracts all links from a markdown file.        | - Wiki links, markdown links, and external URLs.<br/>- Resolves internal links to absolute paths. |
| `obsidian_follow_link`   | Resolves a link and returns the target content. | - Handles short paths and wiki-links.<br/>- Fails on ambiguous matches for safety.                |
| `obsidian_get_backlinks` | Finds all files that link to a specified file.  | - Reverse link discovery across the vault.<br/>- Uses cache for high performance.                 |
| `obsidian_get_symbols`   | Extracts headings from a markdown file.         | - Returns heading levels and line numbers.                                                        |

### Metadata & Advanced Features

| Tool Name                     | Description                              | Key Features                                                                                    |
| :---------------------------- | :--------------------------------------- | :---------------------------------------------------------------------------------------------- |
| `obsidian_manage_frontmatter` | Manages a note's YAML frontmatter.       | - `get`, `set`, or `delete` frontmatter keys.                                                   |
| `obsidian_manage_tags`        | Adds, removes, or lists tags for a note. | - Frontmatter and inline tag support.                                                           |
| `obsidian_execute_dataview`   | Executes simplified Dataview queries.    | - Supports LIST and TABLE queries.<br/>- WHERE clauses with `contains()` and logical operators. |
| `obsidian_render_html`        | Renders a markdown file to HTML.         | - Syntax highlighting for code blocks.<br/>- Useful for viewing note structure.                 |
| `obsidian_validate_mermaid`   | Validates mermaid diagram syntax.        | - Uses mermaid-cli for validation.<br/>- Returns rendered SVG if successful.                    |

### 🛡️ Safety & Security Tools

| Tool Name                        | Description                                | Key Features                                  |
| :------------------------------- | :----------------------------------------- | :-------------------------------------------- |
| `obsidian_set_write_mode`        | Configures the write protection level.     | - `off`, `safe` (default), `confirm`, `full`. |
| `obsidian_get_operation_history` | Shows recent write operations.             | - Audit trail of agent actions.               |
| `obsidian_undo_operation`        | Undoes a specific write using a backup.    | - One-click recovery from agent errors.       |
| `obsidian_emergency_stop`        | Immediately disables all write operations. | - Kill switch for runaway agents.             |

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

## License

Apache License 2.0 - see [LICENSE](LICENSE) for details.

---

<div align="center">
Built with the <a href="https://modelcontextprotocol.io/">Model Context Protocol</a>
</div>
