# Example Vaults Setup Guide

## Where to Put Your Test Vaults

Test vaults should go in: `tests/fixtures/sample-vaults/`

**Directory Structure:**
```
tests/fixtures/sample-vaults/
├── my-vault/                    # Symlink to your real vault
└── example-vaults/             # Downloaded community vaults
    ├── dataview-example-vault/
    ├── obsidian-dataview-example-vault/
    └── (other examples...)
```

---

## Option 1: Your Real Vault (Recommended)

**Best for:** Testing with your actual data, workflows you use daily

**Instructions:**

```bash
# 1. Create symlink to your actual vault
cd /home/krisspy/Desktop/obsidan-mcp
mkdir -p tests/fixtures/sample-vaults
ln -s /path/to/your/real/vault tests/fixtures/sample-vaults/my-vault

# Verify it works
ls -la tests/fixtures/sample-vaults/my-vault
# Should show: my-vault -> /path/to/your/real/vault

# 2. Test with symlink
# When configuring MCP server, use:
OBSIDIAN_VAULT_PATH="/home/krisspy/Desktop/obsidan-mcp/tests/fixtures/sample-vaults/my-vault"
```

**Benefits:**
- ✅ Real-world testing with your actual data
- ✅ Test Dataview queries you actually use
- ✅ No duplication of vault data
- ✅ Changes to test vault don't affect real vault

**Important Notes:**
- Make sure Obsidian Local REST API is configured for your **actual** vault path (not the symlink)
- Test operations carefully (writes will affect your real vault!)
- Consider using a test vault first, then your real vault after confidence

---

## Option 2: Community Example Vaults

**Best for:** Testing Dataview features, common patterns, edge cases

**Recommended Sources:**

### A. Dataview Example Vault
**URL:** https://github.com/blacksmithgu/obsidian-dataview-example-vault

**Download:**
```bash
cd /home/krisspy/Desktop/obsidan-mcp/tests/fixtures/sample-vaults
git clone https://github.com/blacksmithgu/obsidian-dataview-example-vault.git dataview-example-vault
```

**Features:**
- Dataview query examples (TABLE, LIST, TASK)
- Complex WHERE clauses
- GROUP BY examples
- Frontmatter patterns
- Various data types

---

### B. Obsidian Dataview Example Vault
**URL:** https://github.com/s-blu/obsidian_dataview_example_vault

**Download:**
```bash
cd /home/krisspy/Desktop/obsidan-mcp/tests/fixtures/sample-vaults
git clone https://github.com/s-blu/obsidian_dataview_example_vault.git obsidian-dataview-example-vault
```

**Features:**
- Real-world Dataview use cases
- Song database example (similar to your use case!)
- Task management
- Project tracking

---

### C. Obsidian Sample Vault
**URL:** https://github.com/obsidianmd/obsidian-sample-vault

**Download:**
```bash
cd /home/krisspy/Desktop/obsidan-mcp/tests/fixtures/sample-vaults
git clone https://github.com/obsidianmd/obsidian-sample-vault.git obsidian-sample-vault
```

**Features:**
- Basic note structure
- Link patterns
- Frontmatter examples
- Tag usage

---

## How to Use Example Vaults for Testing

### 1. Set Vault Path in Environment Variables

```bash
# For community vaults
export OBSIDIAN_VAULT_PATH="/home/krisspy/Desktop/obsidan-mcp/tests/fixtures/sample-vaults/dataview-example-vault"
export OBSIDIAN_API_KEY="your-api-key"
export OBSIDIAN_REST_API_URL="https://127.0.0.1:27124"

# Start MCP server
MCP_TRANSPORT_TYPE=stdio node /home/krisspy/Desktop/obsidan-mcp/dist/index.js
```

### 2. Switch Between Vaults During Testing

```bash
# Test with community vault
export OBSIDIAN_VAULT_PATH=".../dataview-example-vault"

# Test with your real vault
export OBSIDIAN_VAULT_PATH=".../my-vault"  # Symlink to actual path
```

### 3. Create a Dedicated Test Vault

**For safe testing without affecting real data:**

```bash
# 1. Copy your vault structure
cp -r /path/to/real/vault tests/fixtures/sample-vaults/test-vault

# 2. Use this for testing
export OBSIDIAN_VAULT_PATH="/home/krisspy/Desktop/obsidan-mcp/tests/fixtures/sample-vaults/test-vault"

# 3. Changes won't affect your real vault!
```

---

## Current Status

✅ Example vaults extracted:
- Blue-topaz-example-main (Obsidian installation with plugins)
- Pkmer-Math-main (Mermaid examples)

⚠️  Setup issue: Command execution problems prevented automated setup

---

## Manual Setup Instructions

Please run these commands manually to complete setup:

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

## About Example Vaults

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

## Recommended Testing Order

### Stage 1: Safe Testing (Recommended)
Start with **Blue-topaz-example-main**:
```bash
export OBSIDIAN_VAULT_PATH="/home/krisspy/Desktop/obsidan-mcp/tests/fixtures/sample-vaults/Blue-topaz-example-main"
export OBSIDIAN_API_KEY="your-api-key"
export OBSIDIAN_REST_API_URL="https://127.0.0.1:27124"

MCP_TRANSPORT_TYPE=stdio node dist/index.js
```

**Why:**
- No risk to your real data
- Has complex examples for edge case testing
- Has Dataview queries for testing Phase 5

### Stage 2: Mermaid Validation Testing
Start with **Pkmer-Math-main**:
```bash
export OBSIDIAN_VAULT_PATH="/home/krisspy/Desktop/obsidan-mcp/tests/fixtures/sample-vaults/Pkmer-Math-main"
export OBSIDIAN_API_KEY="your-api-key"
export OBSIDIAN_REST_API_URL="https://127.0.0.1:27124"

MCP_TRANSPORT_TYPE=stdio node dist/index.js
```

**Why:**
- Has mermaid diagrams to test Phase 2 (Mermaid validation)
- Good for testing syntax validation

### Stage 3: Real-World Testing (After Confidence)
After stages 1-2 complete and tests pass, test with your daily vault:
```bash
export OBSIDIAN_VAULT_PATH="/home/krisspy/obsidian/cloudnotes"
export OBSIDIAN_API_KEY="your-api-key"
export OBSIDIAN_REST_API_URL="https://127.0.0.1:27124"

MCP_TRANSPORT_TYPE=stdio node dist/index.js

# Use safety features
export WRITE_MODE=safe
export BACKUP_ENABLED=true
export CONFLICT_DETECTION=true
```

---

## Important Safety Notes

⚠️ **When Using Your Real Vault:**

1. **Start with READ-ONLY testing**
   ```bash
   export WRITE_MODE=off
   ```

2. **Enable safety features before writes**
   ```bash
   export BACKUP_ENABLED=true
   export WRITE_MODE=safe
   export CONFLICT_DETECTION=true
   ```

3. **Review operation logs before important operations**
   ```bash
   obsidian_get_operation_history({ hours: 24 })
   ```

4. **Test with example vaults first!**
   Never use your real vault for initial testing
   Only use it after you're confident everything works

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
If `ln -s` fails, try `ln -sf` (force):
```bash
ln -sf ~/obsidian/cloudnotes tests/fixtures/sample-vaults/my-vault
```

---

## Next Steps After Manual Setup

1. Run manual commands above
2. Verify vaults are in correct location
3. Configure Obsidian Local REST API
4. Test MCP server with example vaults
5. After tests pass, use your real vault

---

## Summary

**Current State:**
- ✅ Example vaults extracted (Blue-topaz-example-main, Pkmer-Math-main)
- ⚠️  Manual setup required (due to command execution issues)
- 📁 Fixtures directory: tests/fixtures/sample-vaults/
- 🔗 Daily vault: ~/obsidian/cloudnotes

**Recommended Order:**
1. Manual setup (above commands)
2. Test with Blue-topaz-example-main (Dataview testing)
3. Test with Pkmer-Math-main (Mermaid testing)
4. Test with your real vault (after confidence)
5. Enable safety features for production use

---

## Important Safety Notes

⚠️ **When Using Your Real Vault:**

1. **Start with READ-ONLY testing**
   ```bash
   export WRITE_MODE=off
   ```

2. **Enable safety features first**
   ```bash
   export BACKUP_ENABLED=true
   export WRITE_MODE=safe
   export CONFLICT_DETECTION=true
   ```

3. **Review operation logs before important operations**
   ```bash
   obsidian_get_operation_history({ hours: 24 })
   ```

4. **Test with a copy first!**
   ```bash
   # Create test copy
   cp -r /path/to/real/vault tests/fixtures/sample-vaults/test-vault
   
   # Test with copy
   export OBSIDIAN_VAULT_PATH=".../test-vault"
   ```

5. **Only use real vault after all tests pass**

---

## Troubleshooting

### Symlink Issues

If symlink creation fails:

```bash
# Check if directory exists
ls /path/to/your/real/vault

# Create directory instead of symlink
mkdir -p tests/fixtures/sample-vaults/my-vault
cp -r /path/to/your/real/vault/* tests/fixtures/sample-vaults/my-vault/
```

### Obsidian REST API Permission Issues

Make sure the vault path points to a directory Obsidian Local REST API can access:

- **Local vaults**: Full path to vault directory
- **Symlinks**: Should resolve to actual path Obsidian can access
- **Permissions**: User running MCP server must have read/write access

---

## Summary

**Recommendations:**

1. ✅ Start with **Dataview Example Vault** (most relevant to your use case)
2. ✅ Create symlink to **your real vault** for later testing
3. ✅ Always use **WRITE_MODE=safe** when testing with real data
4. ✅ Test with **community vaults** before using real vault
5. ✅ Monitor **operation logs** during testing

**Next Steps After Phase 1:**

When Phase 1 is complete, we'll test with:
1. Dataview Example Vault (for Dataview queries)
2. Your real vault (for real-world validation)

This approach ensures:
- ✅ Safe testing (no risk to your data)
- ✅ Comprehensive testing (multiple vaults)
- ✅ Real-world validation (your actual data)
