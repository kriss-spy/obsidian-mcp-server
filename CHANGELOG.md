# Changelog

All notable changes to obsidian-mcp will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [Unreleased]

### Added
- Project initialization with planning documents
- Git repository initialized
- Project directory structure created
- Phase 0 setup instructions created (PHASE_0_SETUP.md)

### Changed
- N/A

### Deprecated
- N/A

### Removed
- N/A

### Fixed
- N/A

### Security
- N/A

---

## [1.0.0] - Planned

### Added
- HTML rendering with `obsidian_render_html` tool
- Mermaid validation with `obsidian_validate_mermaid` tool
- Link navigation with `obsidian_get_links` and `obsidian_follow_link` tools
- Backlinks with `obsidian_get_backlinks` and `obsidian_get_link_graph` tools
- Dataview query engine with `obsidian_execute_dataview` tool
- Safety layer with:
  - `obsidian_set_write_mode` tool
  - `obsidian_get_operation_history` tool
  - `obsidian_undo_operation` tool
  - `obsidian_emergency_stop` tool

### Changed
- Default write mode: `safe` (backups + conflict checks)
- File-based backups (no git conflicts)
- Operation logging: 30-day retention
- Agent query window: 7 days
- Rate limiting: OFF by default

### Security
- Automatic backups before all writes
- Conflict detection (strict: don't write if conflicts exist)
- Sync awareness (60-second buffer)
- Write protection modes: off, safe, confirm, full
- Emergency stop capability
- Operation history with undo

---

## [0.0.0] - Not Released

### Notes
- Fork of cyanheads/obsidian-mcp-server
- Initial project setup
