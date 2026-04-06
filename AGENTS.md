# TaxSnax — Agent Integration

Integration guide for AI agents working with TaxSnax.

## Mission Context

TaxSnax exists to **make tax preparation accessible, organized, and stress-free** for small business owners. It's a local-first CLI tool that transforms bank statement chaos into CPA-ready order—without ever storing sensitive PII like SSN or EIN.

**Core philosophy:** Organize the chaos, protect the sensitive, empower the professional.

## When to Use

Trigger TaxSnax when users say:
- "Prepare my taxes"
- "Import bank statements"
- "Track 1099 contractors"
- "Generate CPA packet"
- "Estimate quarterly taxes"
- "Categorize expenses"
- "Organize my finances for tax time"

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

### Phase 1: Discovery
1. Check current status: `taxsnax status --json -d .taxsnax`
2. Identify what's already imported
3. Determine what statements need importing

### Phase 2: Import
1. Import bank statements: `taxsnax import <file> --source "Bank" --json -d .taxsnax`
2. Handle duplicates automatically
3. Review import results

### Phase 3: Organization
1. Review categorization: `taxsnax categorize --json -d .taxsnax`
2. Detect recurring expenses: `taxsnax recurring --json -d .taxsnax`
3. Fix miscategorized transactions if needed

### Phase 4: Contractor Review
1. List contractors: `taxsnax contractors --json -d .taxsnax`
2. Generate 1099 checklist: `taxsnax 1099-checklist --json -d .taxsnax`
3. Generate W-9 request emails if needed: `taxsnax w9-request -n "Name" --json -d .taxsnax`

### Phase 5: Generation
1. Generate CPA packet: `taxsnax cpa-packet --year 2025 -o packet.txt --json -d .taxsnax`
2. Generate tax estimates: `taxsnax tax-estimate --year 2025 --state PA --json -d .taxsnax`
3. Generate all reports: `taxsnax reports --year 2025 -o ./reports --json -d .taxsnax`

### Phase 6: Handoff
1. Provide packet to user for CPA review
2. Remind: SSN/EIN must be provided separately to CPA
3. W-9 forms should be collected and stored securely outside TaxSnax

## Important Guidelines

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

## User Communication

When helping users with TaxSnax, emphasize:
1. **Speed** — "We'll have your transactions organized in minutes"
2. **Security** — "Your SSN and EIN never enter the tool"
3. **Collaboration** — "This organizes everything for your CPA to review"
4. **Control** — "All your data stays on your machine"

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Import fails | Check file format (CSV, XLSX, PDF, QBO, OFX) |
| Wrong categorization | Run `taxsnax categorize` to re-categorize |
| Missing contractor | Check if transactions are categorized as "Contract Labor" |
| Tax estimate seems off | Remember estimates don't include all deductions |

## Mission Alignment

When integrating TaxSnax, remember:
- **Make tax prep less stressful** — Guide users through step-by-step
- **Protect privacy** — Never ask for SSN/EIN
- **Empower CPAs** — Generate clean, organized data
- **Save time** — Automate the tedious, let humans handle decisions

---

**TaxSnax: Organize the chaos, protect the sensitive, empower the professional.**
