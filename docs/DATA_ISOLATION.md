# Data Isolation & Security Guide

## 🚨 CRITICAL: Data Isolation Requirements

TaxSnax handles sensitive financial data. This guide ensures **zero data leakage** into the repository.

## Architecture

### Three Data Zones

```
┌─────────────────────────────────────────────────────────────┐
│  ZONE 1: TEST DATA (Safe for Git)                           │
│  - Synthetic/fake transactions                              │
│  - Committed to repo                                        │
│  - Used for CI/tests                                        │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│  ZONE 2: LOCAL DEV DATA (Never Git)                         │
│  - Your real bank statements                                │
│  - .gitignore'd directory                                   │
│  - Only on your machine                                     │
└─────────────────────────────────────────────────────────────┘
                              │
┌─────────────────────────────────────────────────────────────┐
│  ZONE 3: PRODUCTION DATA (User's machine)                   │
│  - End user's tax data                                      │
│  - Their .taxsnax/ directory                                │
│  - Never touches our repo                                   │
└─────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
taxsnax/
├── src/                      # Source code (Git)
├── test/
│   ├── fixtures/            # TEST DATA ONLY (Git)
│   │   └── sample-*.csv     # Fake transactions
│   └── data/                # LOCAL TEST RUNS (.gitignore)
│       └── .gitkeep         # Empty, ignored
├── .gitignore               # CRITICAL: Ignores all data
├── scripts/
│   └── clean-data.sh        # Nuclear data cleaning
└── docs/
    └── DATA_ISOLATION.md    # This file
```

## .gitignore (Critical)

```gitignore
# NEVER commit real data
*.csv
*.xlsx
*.pdf
*.qbo
*.ofx
*.taxsnax
.taxsnax/
!test/fixtures/*.csv

# Local test runs
test/data/*
!test/data/.gitkeep

# User data (if testing locally)
~/.taxsnax/
.data/
sandbox/

# OS files
.DS_Store
Thumbs.db
```

## Test Data Fixtures

All test data is **synthetic**:

```csv
# test/fixtures/sample-chase-2025.csv
Date,Description,Amount
01/15/2025,STARBUCKS #1234 SEATTLE WA,-5.67
01/16/2025,FACEBOOK ADS,-150.00
01/20/2025,OFFICE DEPOT #567,-45.32
```

**Rules for test fixtures:**
- Use fake vendor names or obviously fake locations
- Round numbers for amounts
- Dates in past tax years (2024, 2025)
- No real addresses, names, or account numbers
- No SSNs, EINs, or tax IDs

## Local Development Workflow

### 1. Set Local Data Directory (Never Default)

```bash
# Use a directory OUTSIDE the repo
export TAXSNAX_DIR=~/Documents/taxsnax-personal-2025

# Or use --dir flag every time
taxsnax --dir ~/Documents/taxsnax-personal-2025 import statement.csv
```

### 2. Create Isolated Workspace

```bash
# Create personal workspace
mkdir -p ~/taxsnax-workspace-2025
cd ~/taxsnax-workspace-2025

# Copy statements here (never in repo)
cp ~/Downloads/chase-*.csv ./

# Run taxsnax with explicit data dir
taxsnax --dir ./data init --year 2025
taxsnax --dir ./data import chase-*.csv --source "Chase"
```

### 3. Generate Output (Outside Repo)

```bash
taxsnax --dir ./data cpa-packet --output ~/Desktop/my-taxes-2025.txt
```

## Pre-Push Checklist

### Automated Check

```bash
# Run before every push
npm run clean-data
```

This script performs **13 security checks**:

1. **Data files** - No CSV/XLSX/PDF in repo
2. **SSN patterns** - Social Security Numbers
3. **EIN patterns** - Employer ID Numbers
4. **Email addresses** - Personal emails
5. **Phone numbers** - Contact numbers
6. **Account numbers** - Credit cards, bank accounts
7. **Street addresses** - Physical locations
8. **Location data** - City/State/ZIP combos
9. **IP addresses** - Network identifiers
10. **API keys** - Authentication tokens
11. **Passwords** - Credential patterns
12. **Environment variables** - Hardcoded secrets
13. **.gitignore** - Proper configuration

**Any CRITICAL finding blocks the push.**

### Manual Verification

```bash
# Check for any CSV files
git ls-files | grep -E '\.(csv|xlsx|pdf|json)$'
# Should only show: test/fixtures/sample-*.csv

# Check for sensitive patterns
grep -rE "[0-9]{3}-[0-9]{2}-[0-9]{4}" src/  # SSN
grep -rE "[0-9]{2}-[0-9]{7}" src/          # EIN
grep -rE "[a-z]+@[a-z]+\.[a-z]+" src/      # Emails
grep -rE "[0-9]{4}[ -][0-9]{4}[ -][0-9]{4}[ -][0-9]{4}" src/  # Credit cards
grep -rE "[0-9]+ [A-Za-z]+ (St|Ave|Rd)" src/  # Addresses

# Should return NOTHING
```

## Database Options

### Option 1: JSON Files (Current)

**Pros:** Simple, transparent, no dependencies
**Cons:** Files are readable text

**Security:**
- Data stored in user-specified directory
- Never in repo
- User controls location

### Option 2: SQLite (Future)

**Pros:** Single file, better performance, can encrypt
**Cons:** Binary file (harder to inspect)

**Security:**
```javascript
// Could add encryption
const db = new Database('taxes.db');
// Encrypt with user password
```

### Option 3: Encrypted JSON (Future)

**Pros:** Human-readable when decrypted, secure at rest
**Cons:** Requires password management

## Data Retention Policy

### For Development

1. **Never commit real data**
2. **Delete local test data after use:**
   ```bash
   rm -rf test/data/*
   ```
3. **Use synthetic data for all tests**

### For Users

1. Data stays on their machine
2. They choose retention
3. We provide `taxsnax purge` command

## Incident Response

### If Real Data Accidentally Committed

1. **STOP** - Don't push
2. **Remove from history:**
   ```bash
   git rm --cached file.csv
   git commit --amend
   ```
3. **Add to .gitignore:**
   ```bash
   echo "*.csv" >> .gitignore
   ```
4. **Verify clean:**
   ```bash
   git log --name-only | grep -E '\.(csv|xlsx)'
   ```

### If Pushed to Remote

1. **Rotate any exposed credentials immediately**
2. **Contact GitHub to remove from history**
3. **Assume data is compromised**
4. **Document incident**

## Scripts

### clean-data.sh

```bash
#!/bin/bash
echo "🧹 Cleaning all data files..."

# Remove data files
find . -name "*.csv" -not -path "./test/fixtures/*" -delete
find . -name "*.xlsx" -delete
find . -name "*.pdf" -delete
find . -name "*.qbo" -delete

# Clear test data
rm -rf test/data/*
touch test/data/.gitkeep

# Verify
echo "✅ Remaining data files:"
git ls-files | grep -E '\.(csv|xlsx|pdf)$' || echo "   None found (good!)"

echo "✅ Data cleaned. Safe to push."
```

### pre-push hook

```bash
#!/bin/bash
# .git/hooks/pre-push

if git ls-files | grep -qE '\.(csv|xlsx|pdf)$'; then
    echo "❌ ERROR: Data files detected in repo!"
    echo "Run: npm run clean-data"
    exit 1
fi

echo "✅ No data files in repo. Safe to push."
exit 0
```

## Summary

| What | Where | Git? |
|------|-------|------|
| Source code | `src/` | ✅ Yes |
| Test fixtures | `test/fixtures/` | ✅ Yes (fake data) |
| Local dev data | `~/taxsnax-data/` | ❌ No |
| User data | `~/.taxsnax/` | ❌ No |
| Test outputs | `test/data/` | ❌ No |

**Golden Rule:** If it contains real financial data, it never touches git.
