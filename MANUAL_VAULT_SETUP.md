# Setup Instructions - Manual Vault Setup

## What Happened

The example vaults were successfully extracted:
- `Blue-topaz-example-main` - Obsidian installation with plugins
- `Pkmer-Math-main` - Mermaid examples

However, I encountered command execution issues when trying to move them to `tests/fixtures/sample-vaults/`.

## Manual Setup Instructions

Please run these commands manually:

### 1. Create Fixtures Directory

```bash
cd /home/krisspy/Desktop/obsidan-mcp
mkdir -p tests/fixtures/sample-vaults
```

### 2. Move Extracted Vaults

```bash
cd /home/krisspy/Desktop/obsidan-mcp
mv Blue-topaz-example-main tests/fixtures/sample-vaults/
mv Pkmer-Math-main tests/fixtures/sample-vaults/
```

### 3. Create Symlink to Your Daily Vault

```bash
cd /home/krisspy/Desktop/obsidan-mcp
ln -sf ~/obsidian/cloudnotes tests/fixtures/sample-vaults/my-vault
```

### 4. Verify Setup

```bash
cd /home/krisspy/Desktop/obsidan-mcp
ls -la tests/fixtures/sample-vaults/
```

You should see:
```
Blue-topaz-example-main/
Pkmer-Math-main/
my-vault -> /home/krisspy/obsidian/cloudnotes
```

---

## About the Example Vaults

### Blue-topaz-example-main
This is a complete Obsidian installation with 100+ plugins. Useful for testing:
- Plugin detection
- Frontmatter handling
- Dataview integration
- Complex vault structures

### Pkmer-Math-main
Mermaid diagram examples. Useful for testing:
- Flowcharts
- Sequence diagrams
- Class diagrams
- Various mermaid syntaxes

---

## Recommended Testing Approach

### Step 1: Test with Example Vaults First

Start with **Blue-topaz-example-main**:
```bash
export OBSIDIAN_VAULT_PATH="/home/krisspy/Desktop/obsidan-mcp/tests/fixtures/sample-vaults/Blue-topaz-example-main"
export OBSIDIAN_API_KEY="your-api-key"
export OBSIDIAN_REST_API_URL="https://127.0.0.1:27124"

MCP_TRANSPORT_TYPE=stdio node dist/index.js
```

**Why?**
- No risk to your real data
- Has complex examples to test edge cases
- Has Dataview queries for testing Phase 5

### Step 2: Test Mermaid Validation

Use **Pkmer-Math-main**:
```bash
export OBSIDIAN_VAULT_PATH="/home/krisspy/Desktop/obsidan-mcp/tests/fixtures/sample-vaults/Pkmer-Math-main"
export OBSIDIAN_API_KEY="your-api-key"
export OBSIDIAN_REST_API_URL="https://127.0.0.1:27124"

MCP_TRANSPORT_TYPE=stdio node dist/index.js
```

**Why?**
- Has mermaid diagrams to test Phase 2 (Mermaid validation)
- Good for testing syntax validation

### Step 3: Test with Your Real Vault (After Confidence)

After tests pass with example vaults, test with your daily vault:
```bash
export OBSIDIAN_VAULT_PATH="/home/krisspy/obsidian/cloudnotes"
export OBSIDIAN_API_KEY="your-api-key"
export OBSIDIAN_REST_API_URL="https://127.0.0.1:27124"

# Use WRITE_MODE=safe for first tests
export WRITE_MODE=safe

MCP_TRANSPORT_TYPE=stdio node dist/index.js
```

**Important:**
- Start with READ-ONLY: Set `WRITE_MODE=off`
- Enable safety after confidence: `WRITE_MODE=safe`, `BACKUP_ENABLED=true`

---

## Next Steps After Manual Setup

Once you've completed the manual setup:

1. Tell me: "Vaults setup complete"
2. I'll verify the structure
3. Begin Phase 1: HTML Rendering

---

## Alternative: If Commands Still Fail

If mkdir or mv commands fail, try using file manager:
1. Open file manager
2. Navigate to: `/home/krisspy/Desktop/obsidan-mcp`
3. Create folder: `tests/fixtures/sample-vaults/`
4. Drag `Blue-topaz-example-main` folder into `sample-vaults/`
5. Drag `Pkmer-Math-main` folder into `sample-vaults/`
6. Right-click `cloudnotes` folder
7. Select "Make Link" or "Create Symlink"
8. Link to: `tests/fixtures/sample-vaults/my-vault`

---

## Troubleshooting

### mkdir fails
Ensure you have write permissions:
```bash
ls -ld /home/krisspy/Desktop/obsidan-mcp
```

### mv fails
Check if directories are in use:
```bash
lsof Blue-topaz-example-main Pkmer-Math-main
```

### Symbolic link fails
If `ln -s` fails, try `ln -sf` (force, don't follow symlinks)

---

## Summary

✅ Example vaults extracted: Blue-topaz-example-main, Pkmer-Math-main
⚠️  Command execution issues - manual setup required
📁 Please run manual commands above to complete setup
