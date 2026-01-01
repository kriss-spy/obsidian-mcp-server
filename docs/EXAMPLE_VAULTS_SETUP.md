# Example Vaults Setup Guide (SIMPLIFIED)

## Where Test Vaults Should Go

`tests/fixtures/sample-vaults/`

---

## What's Already There

✅ **Your real vault:** `tests/fixtures/sample-vaults/my-vault` → `~/obsidian/cloudnotes`
✅ **Blue-topaz-example-main:** Complex Obsidian installation with Dataview examples
✅ **Pkmer-Math-main:** Mermaid diagram examples

---

## Testing Order (Safe → Real)

### Step 1: Test with Blue-topaz (Safe)

```bash
export OBSIDIAN_VAULT_PATH="/home/krisspy/Desktop/obsidan-mcp/tests/fixtures/sample-vaults/Blue-topaz-example-main"
export OBSIDIAN_API_KEY="your-api-key-here"
export OBSIDIAN_REST_API_URL="https://127.0.0.1:27124"
export WRITE_MODE=off  # Read-only for initial testing

MCP_TRANSPORT_TYPE=stdio node dist/index.js
```

**Why first:**
- Complex Dataview examples
- No risk to your real vault
- Great for testing Phase 5 (Dataview engine)

---

### Step 2: Test with Pkmer-Math (Safe)

```bash
export OBSIDIAN_VAULT_PATH="/home/krisspy/Desktop/obsidan-mcp/tests/fixtures/sample-vaults/Pkmer-Math-main"
export OBSIDIAN_API_KEY="your-api-key-here"
export OBSIDIAN_REST_API_URL="https://127.0.0.1:27124"
export WRITE_MODE=off

MCP_TRANSPORT_TYPE=stdio node dist/index.js
```

**Why:**
- Mermaid diagram examples
- No risk to your real vault
- Great for testing Phase 2 (Mermaid validation)

---

### Step 3: (Optional) Test with Your Real Vault - Use a Copy

⚠️ **DANGER if you use symlink directly!**

Symlink `my-vault` → `cloudnotes` WILL WRITE to your actual vault!

Instead, make a COPY first:

```bash
# Create test copy
cp -r ~/obsidian/cloudnotes tests/fixtures/sample-vaults/my-real-vault

# Test with copy
export OBSIDIAN_VAULT_PATH="/home/krisspy/Desktop/obsidan-mcp/tests/fixtures/sample-vaults/my-real-vault"
export OBSIDIAN_API_KEY="your-api-key-here"
export OBSIDIAN_REST_API_URL="https://127.0.0.1:27124"
export WRITE_MODE=safe  # SAFE MODE - backups enabled
export BACKUP_ENABLED=true
export CONFLICT_DETECTION=true

MCP_TRANSPORT_TYPE=stdio node dist/index.js
```

**After testing:**
```bash
# Delete test copy when done
rm -rf tests/fixtures/sample-vaults/my-real-vault
```

---

## Safer Alternative: Don't Test with Real Vault

Recommendation: **Skip Step 3 entirely** until Phase 1-8 are complete.

Why:
- Community vaults are safer and have all the test cases you need
- Dataview examples in Blue-topaz
- Mermaid examples in Pkmer-Math
- No risk to your real vault

When you're ready for real-world testing, you can use your actual vault path:
```bash
export OBSIDIAN_VAULT_PATH="/home/krisspy/obsidian/cloudnotes"
```

---

## How to Get API Key

1. Open Obsidian with your `cloudnotes` vault
2. Go to: **Settings** > **Community Plugins** > **Local REST API**
3. Click: **API Key** (shows: "Click to reveal")
4. Copy the key
5. Use it in the commands above

---

## Testing Commands Summary

| Test Vault | Path | Purpose | Risk Level |
|-----------|-------|---------|-------------|
| Blue-topaz | `.../Blue-topaz-example-main` | Dataview testing | ZERO ✅ |
| Pkmer-Math | `.../Pkmer-Math-main` | Mermaid validation | ZERO ✅ |
| Your vault (copy) | `.../my-real-vault` | Real data | LOW (copy only) ⚠️ |
| Your vault (symlink) | `.../my-vault` | Real data | VERY HIGH (writes to real vault) ❌ |

---

## Next Steps

1. **Get API key** from Obsidian Settings
2. **Test with Blue-topaz** (Dataview examples)
3. **Test with Pkmer-Math** (Mermaid examples)
4. **Tell me:** "Blue-topaz tests passed"
5. I'll begin Phase 1: HTML Rendering

---

## Important Safety Notes

⚠️ **NEVER use the symlink `my-vault` for testing unless you understand the risks:**

- Writes through symlink modify your ACTUAL `cloudnotes` vault
- Any DELETE command PERMANENTLY removes your real notes
- Any UPDATE command changes your real data
- Backups won't help if you don't notice immediately

✅ **Use only community vaults for initial testing**

✅ **Make a COPY if you want to test with your real data**

✅ **Enable safety features** (`WRITE_MODE=safe`, `BACKUP_ENABLED=true`)

---

## See Also

- `docs/SAFER_VAULT_SETUP.md` - Detailed safety analysis
- `MANUAL_VAULT_SETUP.md` - Manual setup instructions
