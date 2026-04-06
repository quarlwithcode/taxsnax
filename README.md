# TaxSnax v0.1.1

🧾 Bite-sized tax info from large data dumps.

TaxSnax transforms bank statements and financial data into CPA-ready tax packets for US tax filing.

## Security First: No SSN/EIN Storage

**TaxSnax intentionally does NOT store SSN, EIN, or other sensitive PII.**

- SSN and EIN are never stored in the tool
- Collect W-9 forms separately and store securely
- Provide SSN/EIN directly to your CPA outside of TaxSnax
- TaxSnax focuses on transaction data only (income, expenses, 1099 payment tracking)

## Purpose

Make tax preparation less dreadful. Import your bank statements, categorize transactions, identify 1099 contractors, and generate a clean packet for your accountant to review.

## Installation

```bash
npm install -g taxsnax
```

## Quick Start

```bash
# Initialize for tax year
taxsnax init --year 2025

# Import bank statements
taxsnax import chase-statement.csv --source "Chase Business"
taxsnax import amex-statement.csv --source "Amex Business"

# Set your info (SSN/EIN NOT stored - keep secure records separately)
taxsnax business --name "My Business" --type llc
taxsnax personal --name "John Doe" --status single

# Generate CPA packet
taxsnax cpa-packet --year 2025 --output my-taxes.txt
```

## Commands

| Command | Description |
|---------|-------------|
| `init` | Initialize for tax year |
| `import <file>` | Import bank statements (CSV, XLSX, PDF, QBO, OFX) |
| `summary` | Generate tax summary |
| `contractors` | List 1099 contractors |
| `1099-checklist` | Generate 1099 filing checklist |
| `contractor-report` | Detailed report for specific contractor |
| `w9-request` | Generate W-9 request email |
| `business` | Set business information (EIN not stored) |
| `personal` | Set personal information (SSN not stored) |
| `cpa-packet` | Generate complete CPA packet |
| `tax-estimate` | Estimate federal/state/local taxes |
| `quarterly-estimate` | Calculate quarterly payment |
| `reports` | Generate all reports at once |
| `categorize` | Re-categorize with ML engine |
| `recurring` | Detect recurring expenses |
| `status` | Show current data status |

## Supported Import Formats

- **CSV** - Most bank exports
- **XLSX** - Excel files
- **PDF** - Bank statements (basic parsing)
- **QBO** - QuickBooks Online
- **OFX** - Open Financial Exchange

## Expense Categories

TaxSnax auto-categorizes transactions using ML:
- Advertising
- Contract Labor
- Legal & Professional
- Office Expense
- Supplies
- Travel
- Meals
- Utilities
- Rent
- Insurance
- Software & Tools
- Education & Training
- Bank Fees
- And more...

## 1099 Tracking

Automatically identifies contractors paid $600+ who need 1099-NEC forms.

**Important:** TaxSnax tracks payment amounts but does NOT store SSN/EIN. Collect W-9 forms separately and provide to your CPA.

## CPA Packet Includes

- Income summary
- Expense breakdown by category
- 1099 contractor list (payment amounts only)
- Business information (no EIN)
- Personal information (no SSN)
- Ready for accountant review

## Data Storage

All data stored locally in `.taxsnax/` directory:
- Transactions (JSON)
- Contractors (JSON) - **no SSN/EIN**
- Business info (JSON) - **no EIN**
- Personal info (JSON) - **no SSN**
- Summaries (JSON)

## Privacy & Security

- No cloud storage
- No data sent to external services
- All processing local
- **SSN/EIN never stored**
- 13-check privacy scanning built-in

## Disclaimer

TaxSnax helps organize tax information but **does not replace a CPA**. Always have a qualified accountant review your taxes before filing.

## License

MIT
