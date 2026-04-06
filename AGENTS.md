# TaxSnax — Agent Integration

Integration guide for AI agents working with TaxSnax.

## When to Use
- Tax preparation and organization
- Bank statement import and categorization
- 1099 contractor tracking
- CPA packet generation
- Tax estimation calculations

## Security First: No PII Storage

**CRITICAL:** TaxSnax does NOT store SSN, EIN, or sensitive PII.

- Never attempt to store SSN or EIN in TaxSnax
- Collect W-9 forms separately
- Provide SSN/EIN directly to CPA outside the tool
- TaxSnax only handles transaction data

## Key Commands

```bash
# Status check
taxsnax status --json -d .taxsnax

# Import bank statements
taxsnax import <file> --source "Bank Name" --json -d .taxsnax

# Generate summary
taxsnax summary --year 2025 --json -d .taxsnax

# List contractors
taxsnax contractors --json -d .taxsnax

# Generate 1099 checklist
taxsnax 1099-checklist --json -d .taxsnax

# Generate CPA packet
taxsnax cpa-packet --year 2025 -o packet.txt --json -d .taxsnax

# Tax estimate (no SSN stored)
taxsnax tax-estimate --year 2025 --state PA --json -d .taxsnax

# Set business info (EIN not stored)
taxsnax business --name "Business" --type llc --json -d .taxsnax

# Set personal info (SSN not stored)
taxsnax personal --name "Name" --status single --json -d .taxsnax
```

## Integration Protocol

1. **Initialize** - Check status and initialize if needed
2. **Import** - Import bank statements from files
3. **Review** - Check categorization and fix as needed
4. **Contractors** - Identify and review 1099 contractors
5. **Generate** - Create CPA packet and reports
6. **Handoff** - Provide packet to CPA (they will need SSN/EIN separately)

## Important

- Always use `-d .taxsnax` (or set TAXSNAX_DIR) for consistent data location
- `--json` flag on every command for programmatic parsing
- **Never attempt to store or retrieve SSN/EIN through TaxSnax**
- W-9 forms should be collected and stored securely outside the tool
- CPA will need SSN/EIN provided separately from the TaxSnax packet

## Data Privacy

TaxSnax includes a privacy scanner (`npm run clean-data`) that checks for:
- SSN patterns
- EIN patterns
- Email addresses
- Phone numbers
- Account numbers
- Addresses

This ensures no sensitive data leaks into repositories.
