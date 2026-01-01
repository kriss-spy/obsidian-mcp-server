#!/bin/bash

# Quick Setup Script - Download Example Vaults
# This script helps set up example vaults for testing

set -e  # Exit on any error

echo "🚀 Obsidian MCP Server - Quick Setup Script"
echo ""

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Get project root
PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_ROOT"

echo "${GREEN}Project Root: $PROJECT_ROOT${NC}"
echo ""

# Create fixtures directory
echo "📁 Creating test fixtures directory..."
mkdir -p tests/fixtures/sample-vaults

# 1. Download Dataview Example Vault
echo ""
echo "1️⃣  Downloading Dataview Example Vault..."
cd tests/fixtures/sample-vaults
if [ ! -d "dataview-example-vault" ]; then
    git clone https://github.com/blacksmithgu/obsidian-dataview-example-vault.git dataview-example-vault
    echo "${GREEN}✅ Dataview Example Vault downloaded${NC}"
else
    echo "${YELLOW}⚠️  Dataview Example Vault already exists${NC}"
fi

# 2. Download Obsidian Dataview Example Vault
echo ""
echo "2️⃣  Downloading Obsidian Dataview Example Vault..."
cd tests/fixtures/sample-vaults
if [ ! -d "obsidian-dataview-example-vault" ]; then
    git clone https://github.com/s-blu/obsidian_dataview_example_vault.git obsidian-dataview-example-vault
    echo "${GREEN}✅ Obsidian Dataview Example Vault downloaded${NC}"
else
    echo "${YELLOW}⚠️  Obsidian Dataview Example Vault already exists${NC}"
fi

# 3. Download Obsidian Sample Vault (optional)
echo ""
read -p "3️⃣  Download Obsidian Sample Vault? (y/N): " download_sample
if [[ "$download_sample" =~ ^[Yy]$ ]]; then
    cd tests/fixtures/sample-vaults
    if [ ! -d "obsidian-sample-vault" ]; then
        git clone https://github.com/obsidianmd/obsidian-sample-vault.git obsidian-sample-vault
        echo "${GREEN}✅ Obsidian Sample Vault downloaded${NC}"
    else
        echo "${YELLOW}⚠️  Obsidian Sample Vault already exists${NC}"
    fi
fi

# 4. Create symlink placeholder for your real vault
echo ""
echo "4️⃣  Creating placeholder for your real vault..."
ln -sf README.md tests/fixtures/sample-vaults/my-vault 2>/dev/null || echo "${YELLOW}⚠️  my-vault symlink points to README (update manually)${NC}"
echo "${GREEN}→ Update symlink: ln -sf /path/to/your/real/vault tests/fixtures/sample-vaults/my-vault${NC}"

# 5. Summary
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "${GREEN}✅ Setup Complete!${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📁 Test Vaults Location:"
echo "   $PROJECT_ROOT/tests/fixtures/sample-vaults/"
echo ""
echo "Available Vaults:"
echo "   1. ${GREEN}dataview-example-vault${NC}      (Dataview examples)"
echo "   2. ${GREEN}obsidian-dataview-example-vault${NC} (Real-world examples)"
echo "   3. ${GREEN}obsidian-sample-vault${NC} (Basic examples)"
echo "   4. ${YELLOW}my-vault${NC} (Your real vault - update symlink manually)"
echo ""
echo "📖 Next Steps:"
echo "   1. Update 'my-vault' symlink to your real vault:"
echo "      ${YELLOW}ln -sf /path/to/your/vault tests/fixtures/sample-vaults/my-vault${NC}"
echo "   2. Start MCP server with test vault:"
echo "      ${YELLOW}export OBSIDIAN_VAULT_PATH=\"$PROJECT_ROOT/tests/fixtures/sample-vaults/dataview-example-vault\"${NC}"
echo "   3. Or use MCP Inspector:"
echo "      ${YELLOW}npm run inspect:stdio${NC}"
echo ""
echo "📚 For detailed setup instructions, see: docs/EXAMPLE_VAULTS_SETUP.md"
echo ""
