# Changelog

All notable changes to obsidian-mcp will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [2.1.0] - 2026-01-16

### Added

- **"God Mode" Native CDP Bridge**: Hybrid architecture combining REST API stability with native Chrome DevTools Protocol power.
- **Native Dataview Engine**: Full DQL and DataviewJS support via native plugin API, bypassing previous regex limitations.
- **UI Observation Tools**: New `obsidian_get_ui_snapshot` and `obsidian_capture_screenshot` for visual auditing and selector discovery.
- **Native UI Interactions**: New `obsidian_ui_action` for click, type, hover, and scroll primitives.
- **Quick Switcher++ Driver**: Automated navigation using `#headings`, `>commands`, and `$symbols` shorthand.
- **Day Planner Suite**:
  - `obsidian_get_day_schedule`: Unified chronological view of tasks from all files via Dataview.
  - `obsidian_update_day_planner`: Smart management of the `## Day planner` section in daily notes (24h format).
  - `obsidian_get_three_day_plan`: High-level 72-hour planning overview.
- **Metadata Cache Tool**: `obsidian_get_metadata_cache` for instant access to tags, link graph, and vault-wide statistics.
- **Native Commands**: `obsidian_execute_command` now uses native execution for 100% reliability.

### Changed

- Refactored server initialization to support optional CDP connection.
- Upgraded `obsidian_execute_dataview` to prefer native CDP execution with graceful REST fallback.
- Updated configuration schema to include `OBSIDIAN_CDP_ENABLED`, `OBSIDIAN_CDP_PORT`, and `OBSIDIAN_CDP_HOST`.

## [1.0.0] - 2026-01-01

### Added

- **Safe File Move**: New tool `obsidian_move_note` for moving/renaming files while preserving all internal links. This is a FULLY AUTOMATED SAFE alternative to using `mv` command. The tool automatically:
  - Finds all backlinks to the source file
  - Updates all `[[WikiLinks]]` and markdown links to point to the new location
  - Performs the actual file move via the file system
  - Automatically rolls back all link updates if the file move fails
  - Ensures atomic consistency (either both succeed, or neither does)
  - Requires `OBSIDIAN_VAULT_PATH` environment variable to be configured
- **HTML Rendering**: New tool `obsidian_render_html` using `markdown-it` and `highlight.js` for syntax highlighting.
- **Mermaid Support**: New tool `obsidian_validate_mermaid` for diagram syntax validation and SVG generation via `mermaid-cli`.
- **LSP Features**:
  - `obsidian_get_links`: Extract all links and resolve them to absolute paths.
  - `obsidian_follow_link`: Resolve and read linked notes.
  - `obsidian_get_symbols`: Extract heading structure with line numbers.
- **Backlinks**: `obsidian_get_backlinks` for reverse link discovery across the entire vault.
- **Dataview Engine**: `obsidian_execute_dataview` supports LIST and TABLE queries with `WHERE`, `SORT`, `LIMIT`, and `contains()` support.
- **Safety Layer**:
  - Automatic file-based backups before every write operation.
  - Conflict detection based on modification time (30s window).
  - Sync awareness with configurable buffer.
  - Audit logging of all agent write operations.
  - Tools: `obsidian_set_write_mode`, `obsidian_get_operation_history`, `obsidian_undo_operation`, `obsidian_emergency_stop`.

### Changed

- Default write mode set to `safe` (backups + conflict checks).
- Project structure updated for modular tool registration.
- Enhanced configuration with comprehensive environment variable validation.
- Improved file path resolution for wiki-links and short paths.

### Fixed

- Fixed environment variable loading issues with a dedicated `.env` template and startup script.
- Fixed merge conflict issues by using fresh clone approach during initialization.

---

## [0.0.0] - 2026-01-01

### Notes

- Forked from `cyanheads/obsidian-mcp-server`.
- Initial project planning and setup.
