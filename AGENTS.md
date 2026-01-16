# Project-Specific Agent Instructions

## 🛑 CRITICAL SAFETY RULES

1. **Working Directory Isolation**:

   - ALWAYS verify your current working directory before running `npm install`, `git`, or build commands.
   - Project root is: `/home/krisspy/Desktop/obsidian-mcp/`
   - NEVER execute project-level commands inside the user's personal vault directory: `/home/krisspy/obsidian/cloudnotes/`

2. **Memory Protection**:

   - DO NOT remove or bypass the exclusion rules in `.vscode/settings.json`.
   - The directory `tests/fixtures/sample-vaults/my-vault/` is a "Memory Bomb" (5.7GB). Indexing it will crash the system.
   - If you need to search the codebase, ensure you are NOT recursively grepping into `tests/fixtures/`.

3. **Vault Integrity**:

   - When using tools that modify the vault (like `obsidian_update_note`), ALWAYS use absolute paths derived from the `OBSIDIAN_VAULT_PATH` in `.env`.
   - Never create `node_modules`, `package.json`, or `tsconfig.json` inside the vault.

4. **God Mode (CDP) Safety**:
   - When using `obsidian_ui_action`, always use `highlightElement` first if in an interactive session to show the user what is being targeted.
   - Respect `WRITE_MODE` even for native CDP operations.

## 📁 Project Structure Reference

- `src/services/obsidianCdp`: Native bridge logic.
- `src/mcp-server/tools`: Tool implementations.
- `backups/`: Automated safety backups.
- `backups/debug/`: Temporary UI screenshots (cleanup after use).
