# Changelog

All notable changes to obsidian-mcp will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [1.0.0] - 2026-01-01

### Added

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
