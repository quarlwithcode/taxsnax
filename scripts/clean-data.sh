#!/bin/bash
# Clean all data files before push
# Run: npm run clean-data

echo "🧹 TaxSnax Data Cleaning"
echo "========================"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Enable colors
export TERM=xterm-256color

# Track if we found anything
FOUND=0

# Check for data files in repo (not fixtures)
echo ""
echo "Checking for data files..."
DATA_FILES=$(git ls-files | grep -E '\.(csv|xlsx|pdf|qbo|ofx)$' | grep -v "^test/fixtures/" || true)

if [ -n "$DATA_FILES" ]; then
    echo -e "${RED}❌ WARNING: Data files found in repo:${NC}"
    echo "$DATA_FILES"
    FOUND=1
else
    echo -e "${GREEN}✅ No data files in repo${NC}"
fi

# Check for SSN-like patterns
echo ""
echo "Checking for SSN patterns..."
SSN_MATCHES=$(grep -rE "[0-9]{3}-[0-9]{2}-[0-9]{4}" src/ 2>/dev/null || true)
if [ -n "$SSN_MATCHES" ]; then
    echo -e "${RED}❌ WARNING: Potential SSN patterns found:${NC}"
    echo "$SSN_MATCHES"
    FOUND=1
else
    echo -e "${GREEN}✅ No SSN patterns found${NC}"
fi

# Check for EIN-like patterns
echo ""
echo "Checking for EIN patterns..."
EIN_MATCHES=$(grep -rE "[0-9]{2}-[0-9]{7}" src/ 2>/dev/null || true)
if [ -n "$EIN_MATCHES" ]; then
    echo -e "${YELLOW}⚠️  Note: Potential EIN patterns found (may be test data):${NC}"
    echo "$EIN_MATCHES"
else
    echo -e "${GREEN}✅ No EIN patterns found${NC}"
fi

# Clean test data directory
echo ""
echo "Cleaning test/data/ directory..."
if [ -d "test/data" ]; then
    rm -rf test/data/*
    touch test/data/.gitkeep
    echo -e "${GREEN}✅ test/data/ cleaned${NC}"
fi

# Check .gitignore
echo ""
echo "Verifying .gitignore..."
if grep -q "\.csv" .gitignore && grep -q "\.taxsnax" .gitignore; then
    echo -e "${GREEN}✅ .gitignore properly configured${NC}"
else
    echo -e "${RED}❌ WARNING: .gitignore may be incomplete${NC}"
    FOUND=1
fi

# Summary
echo ""
echo "========================"
if [ $FOUND -eq 1 ]; then
    echo -e "${RED}❌ ISSUES FOUND - Do not push until resolved!${NC}"
    echo ""
    echo "To fix:"
    echo "  1. Remove data files: git rm --cached <file>"
    echo "  2. Update .gitignore if needed"
    echo "  3. Amend commit: git commit --amend"
    exit 1
else
    echo -e "${GREEN}✅ All checks passed - Safe to push!${NC}"
    exit 0
fi
