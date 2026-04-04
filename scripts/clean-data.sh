#!/bin/bash
# Clean all data files before push
# Run: npm run clean-data

echo "🧹 TaxSnax Data Cleaning"
echo "========================"
echo "🔒 Privacy & Security Scan"
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Enable colors
export TERM=xterm-256color

# Track if we found anything
FOUND=0
CRITICAL=0

echo -e "${BLUE}Scanning for sensitive data patterns...${NC}"
echo ""

# ============================================
# 1. DATA FILES
# ============================================
echo "📁 Checking for data files..."
DATA_FILES=$(git ls-files | grep -E '\.(csv|xlsx|pdf|qbo|ofx|json)$' | grep -v "^test/fixtures/" | grep -v "^package.*\.json$" | grep -v "^tsconfig" || true)

if [ -n "$DATA_FILES" ]; then
    echo -e "${RED}❌ CRITICAL: Data files found in repo:${NC}"
    echo "$DATA_FILES"
    FOUND=1
    CRITICAL=1
else
    echo -e "${GREEN}✅ No data files in repo${NC}"
fi

# ============================================
# 2. SSN (Social Security Numbers)
# ============================================
echo ""
echo "🔢 Checking for SSN patterns..."
SSN_PATTERNS="[0-9]{3}-[0-9]{2}-[0-9]{4}|[0-9]{3}\.[0-9]{2}\.[0-9]{4}|[0-9]{9}"
SSN_MATCHES=$(grep -rE "$SSN_PATTERNS" src/ docs/ scripts/ test/*.ts 2>/dev/null | grep -v "node_modules" | grep -v "test/fixtures" || true)

if [ -n "$SSN_MATCHES" ]; then
    echo -e "${RED}❌ CRITICAL: Potential SSN patterns found:${NC}"
    echo "$SSN_MATCHES"
    FOUND=1
    CRITICAL=1
else
    echo -e "${GREEN}✅ No SSN patterns found${NC}"
fi

# ============================================
# 3. EIN (Employer Identification Numbers)
# ============================================
echo ""
echo "🏢 Checking for EIN patterns..."
EIN_PATTERNS="[0-9]{2}-[0-9]{7}|[0-9]{9}"
EIN_MATCHES=$(grep -rE "$EIN_PATTERNS" src/ docs/ scripts/ test/*.ts 2>/dev/null | grep -v "node_modules" | grep -v "test/fixtures" | grep -v "sample-" || true)

# Filter out obvious non-EINs (dates, version numbers)
EIN_FILTERED=$(echo "$EIN_MATCHES" | grep -v "202[0-9]" | grep -v "version" | grep -v "[0-9]\.[0-9]\.[0-9]" || true)

if [ -n "$EIN_FILTERED" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Potential EIN patterns found:${NC}"
    echo "$EIN_FILTERED"
    FOUND=1
else
    echo -e "${GREEN}✅ No EIN patterns found${NC}"
fi

# ============================================
# 4. EMAIL ADDRESSES
# ============================================
echo ""
echo "📧 Checking for email addresses..."
EMAIL_PATTERNS="[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}"
EMAIL_MATCHES=$(grep -rE "$EMAIL_PATTERNS" src/ docs/ scripts/ test/*.ts 2>/dev/null | grep -v "node_modules" | grep -v "@types" | grep -v "@anthropic" | grep -v "@openai" | grep -v "example\.com" | grep -v "test@" | grep -v "user@" || true)

if [ -n "$EMAIL_MATCHES" ]; then
    echo -e "${RED}❌ CRITICAL: Email addresses found:${NC}"
    echo "$EMAIL_MATCHES"
    FOUND=1
    CRITICAL=1
else
    echo -e "${GREEN}✅ No email addresses found${NC}"
fi

# ============================================
# 5. PHONE NUMBERS
# ============================================
echo ""
echo "📞 Checking for phone numbers..."
PHONE_PATTERNS="\([0-9]{3}\)[0-9]{3}-[0-9]{4}|[0-9]{3}-[0-9]{3}-[0-9]{4}|[0-9]{10}"
PHONE_MATCHES=$(grep -rE "$PHONE_PATTERNS" src/ docs/ scripts/ test/*.ts 2>/dev/null | grep -v "node_modules" | grep -v "test/fixtures" || true)

if [ -n "$PHONE_MATCHES" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Phone number patterns found:${NC}"
    echo "$PHONE_MATCHES"
    FOUND=1
else
    echo -e "${GREEN}✅ No phone numbers found${NC}"
fi

# ============================================
# 6. CREDIT CARD / ACCOUNT NUMBERS
# ============================================
echo ""
echo "💳 Checking for account/credit card numbers..."
# Match 4 groups of 4 digits (credit cards) or long account numbers
ACCOUNT_PATTERNS="[0-9]{4}[ -][0-9]{4}[ -][0-9]{4}[ -][0-9]{4}|[0-9]{16}|[0-9]{8}-[0-9]{8}"
ACCOUNT_MATCHES=$(grep -rE "$ACCOUNT_PATTERNS" src/ docs/ scripts/ test/*.ts 2>/dev/null | grep -v "node_modules" | grep -v "test/fixtures" || true)

if [ -n "$ACCOUNT_MATCHES" ]; then
    echo -e "${RED}❌ CRITICAL: Account number patterns found:${NC}"
    echo "$ACCOUNT_MATCHES"
    FOUND=1
    CRITICAL=1
else
    echo -e "${GREEN}✅ No account numbers found${NC}"
fi

# ============================================
# 7. ADDRESSES (Street Addresses)
# ============================================
echo ""
echo "🏠 Checking for street addresses..."
# Common street address patterns
ADDRESS_PATTERNS="[0-9]+ [A-Za-z]+ (St|Street|Ave|Avenue|Rd|Road|Dr|Drive|Blvd|Boulevard|Ln|Lane|Way|Ct|Court)"
ADDRESS_MATCHES=$(grep -riE "$ADDRESS_PATTERNS" src/ docs/ scripts/ test/*.ts 2>/dev/null | grep -v "node_modules" | grep -v "test/fixtures" | grep -v "README" | grep -v "DATA_ISOLATION.md" | grep -v "docs/" | grep -v "example" | grep -v "sample" || true)

if [ -n "$ADDRESS_MATCHES" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Potential street addresses found:${NC}"
    echo "$ADDRESS_MATCHES"
    FOUND=1
else
    echo -e "${GREEN}✅ No street addresses found${NC}"
fi

# ============================================
# 8. ZIP CODES (with city/state)
# ============================================
echo ""
echo "📮 Checking for location data (city/state/zip)..."
# City, ST 12345 or City, State 12345 patterns
LOCATION_PATTERNS="[A-Za-z]+, [A-Z]{2} [0-9]{5}|[A-Za-z]+, [A-Z][a-z]+ [0-9]{5}"
LOCATION_MATCHES=$(grep -rE "$LOCATION_PATTERNS" src/ docs/ scripts/ test/*.ts 2>/dev/null | grep -v "node_modules" | grep -v "test/fixtures" | grep -v "README" | grep -v "clean-data.sh" || true)

if [ -n "$LOCATION_MATCHES" ]; then
    echo -e "${YELLOW}⚠️  WARNING: Location data found:${NC}"
    echo "$LOCATION_MATCHES"
    FOUND=1
else
    echo -e "${GREEN}✅ No location data found${NC}"
fi

# ============================================
# 9. IP ADDRESSES
# ============================================
echo ""
echo "🌐 Checking for IP addresses..."
IP_PATTERNS="[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}"
IP_MATCHES=$(grep -rE "$IP_PATTERNS" src/ docs/ scripts/ test/*.ts 2>/dev/null | grep -v "node_modules" | grep -v "127\.0\.0\.1" | grep -v "0\.0\.0\.0" | grep -v "255\.255\.255" || true)

if [ -n "$IP_MATCHES" ]; then
    echo -e "${YELLOW}⚠️  WARNING: IP addresses found:${NC}"
    echo "$IP_MATCHES"
    FOUND=1
else
    echo -e "${GREEN}✅ No IP addresses found${NC}"
fi

# ============================================
# 10. API KEYS / TOKENS
# ============================================
echo ""
echo "🔑 Checking for API keys/tokens..."
KEY_PATTERNS="api[_-]?key.*=.*[a-zA-Z0-9]{16,}|token.*=.*[a-zA-Z0-9]{16,}|password.*=.*[a-zA-Z0-9]{8,}|secret.*=.*[a-zA-Z0-9]{8,}"
KEY_MATCHES=$(grep -riE "$KEY_PATTERNS" src/ docs/ scripts/ test/*.ts 2>/dev/null | grep -v "node_modules" | grep -v "process\.env" | grep -v "example" || true)

if [ -n "$KEY_MATCHES" ]; then
    echo -e "${RED}❌ CRITICAL: Potential API keys/passwords found:${NC}"
    echo "$KEY_MATCHES"
    FOUND=1
    CRITICAL=1
else
    echo -e "${GREEN}✅ No API keys found${NC}"
fi

# ============================================
# 11. CHECK ENVIRONMENT VARIABLES
# ============================================
echo ""
echo "🔒 Checking for hardcoded secrets in env vars..."
ENV_MATCHES=$(grep -rE "(AWS_|AZURE_|GOOGLE_|GITHUB_|NPM_|DOCKER_).*=" src/ docs/ scripts/ 2>/dev/null | grep -v "node_modules" | grep -v "process\.env" || true)

if [ -n "$ENV_MATCHES" ]; then
    echo -e "${RED}❌ CRITICAL: Hardcoded environment variables found:${NC}"
    echo "$ENV_MATCHES"
    FOUND=1
    CRITICAL=1
fi

# ============================================
# 12. CLEAN TEST DATA DIRECTORY
# ============================================
echo ""
echo "🧹 Cleaning test/data/ directory..."
if [ -d "test/data" ]; then
    rm -rf test/data/*
    touch test/data/.gitkeep
    echo -e "${GREEN}✅ test/data/ cleaned${NC}"
fi

# ============================================
# 13. VERIFY .gitignore
# ============================================
echo ""
echo "📋 Verifying .gitignore..."
GITIGNORE_CHECKS=0

if grep -q "\.csv" .gitignore; then
    ((GITIGNORE_CHECKS++))
fi
if grep -q "\.xlsx" .gitignore; then
    ((GITIGNORE_CHECKS++))
fi
if grep -q "\.pdf" .gitignore; then
    ((GITIGNORE_CHECKS++))
fi
if grep -q "\.taxsnax" .gitignore; then
    ((GITIGNORE_CHECKS++))
fi

if [ $GITIGNORE_CHECKS -ge 4 ]; then
    echo -e "${GREEN}✅ .gitignore properly configured${NC}"
else
    echo -e "${RED}❌ WARNING: .gitignore incomplete${NC}"
    FOUND=1
fi

# ============================================
# SUMMARY
# ============================================
echo ""
echo "================================================"

if [ $CRITICAL -eq 1 ]; then
    echo -e "${RED}🚨 CRITICAL ISSUES FOUND - DO NOT PUSH!${NC}"
    echo ""
    echo "Sensitive data detected in repository."
    echo "This could expose personal information."
    echo ""
    echo "To fix:"
    echo "  1. Remove sensitive files: git rm --cached <file>"
    echo "  2. Clean history: git filter-branch or git-filter-repo"
    echo "  3. Amend commit: git commit --amend"
    echo "  4. Re-run: npm run clean-data"
    echo ""
    echo -e "${YELLOW}If already pushed, consider data compromised.${NC}"
    exit 1
elif [ $FOUND -eq 1 ]; then
    echo -e "${YELLOW}⚠️  WARNINGS FOUND - Review before pushing${NC}"
    echo ""
    echo "Some patterns detected that may be sensitive."
    echo "Review the warnings above."
    echo ""
    echo "To proceed if safe:"
    echo "  git push --no-verify"
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ ALL CHECKS PASSED${NC}"
    echo ""
    echo "No sensitive data detected."
    echo "Safe to push to repository."
    echo ""
    exit 0
fi
