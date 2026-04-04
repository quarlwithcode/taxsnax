# TaxSnax v0.1.0

🧾 Bite-sized tax info from large data dumps.

TaxSnax transforms bank statements and financial data into CPA-ready tax packets for US tax filing.

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

# Set your info
taxsnax business --name "My Business" --type llc --ein "XX-XXXXXXX"
taxsnax personal --name "John Doe" --ssn "XXX-XX-XXXX" --status single

# Generate CPA packet
taxsnax cpa-packet --year 2025 --output my-taxes.txt
```

## Commands

| Command | Description |
|---------|-------------|
| `init` | Initialize for tax year |
| `import <file>` | Import bank statements (CSV) |
| `summary` | Generate tax summary |
| `contractors` | List 1099 contractors |
| `business` | Set business information |
| `personal` | Set personal information |
| `cpa-packet` | Generate complete CPA packet |
| `status` | Show current data status |

## Supported Import Formats

- **CSV** - Most bank exports
- XLSX - Coming soon
- PDF - Coming soon

## Expense Categories

TaxSnax auto-categorizes transactions:
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

## CPA Packet Includes

- Income summary
- Expense breakdown by category
- 1099 contractor list
- Business information
- Personal information
- Ready for accountant review

## Data Storage

All data stored locally in `.taxsnax/` directory:
- Transactions (JSON)
- Contractors (JSON)
- Business info (JSON)
- Personal info (JSON)
- Summaries (JSON)

## Privacy

- No cloud storage
- No data sent to external services
- All processing local
- You control your data

## Disclaimer

TaxSnax helps organize tax information but **does not replace a CPA**. Always have a qualified accountant review your taxes before filing.

## License

MIT
