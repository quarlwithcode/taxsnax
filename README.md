# TaxSnax v0.1.1

🧾 **Bite-sized tax info from large data dumps.**

---

## Mission

**Make tax preparation accessible, organized, and stress-free for small business owners and independent workers.**

Tax season shouldn't be a scramble. TaxSnax exists to transform the chaos of bank statements and scattered receipts into a clean, CPA-ready packet—so you can file with confidence and get back to running your business.

---

## Vision

**A world where small business owners spend hours, not days, on tax preparation.**

We believe:
- **Privacy is non-negotiable** — Your sensitive data (SSN, EIN) stays out of tools, stored securely where it belongs
- **Automation should be trustworthy** — ML-powered categorization that learns your spending patterns
- **Local-first is the future** — Your financial data never leaves your machine
- **CPAs are partners, not replacements** — TaxSnax organizes, professionals finalize

---

## What TaxSnax Does

TaxSnax is a **local-first CLI tool** that:

1. **Imports** bank statements from multiple formats (CSV, XLSX, PDF, QBO, OFX)
2. **Categorizes** transactions automatically using machine learning
3. **Detects** duplicate transactions across multiple imports
4. **Identifies** 1099 contractors who need tax forms (>$600)
5. **Calculates** income, expenses, and tax estimates
6. **Generates** CPA-ready packets with everything your accountant needs

---

## What TaxSnax Does NOT Do

❌ **Store SSN or EIN** — Intentionally excluded for security  
❌ **File taxes** — Organization only, filing is between you and your CPA  
❌ **Cloud sync** — All data stays local on your machine  
❌ **Replace your CPA** — We organize, professionals advise and file  

---

## Security First: No SSN/EIN Storage

**TaxSnax intentionally does NOT store SSN, EIN, or other sensitive PII.**

- SSN and EIN are **never stored** in the tool
- Collect W-9 forms separately and store securely
- Provide SSN/EIN directly to your CPA outside of TaxSnax
- TaxSnax focuses on **transaction data only** (income, expenses, 1099 payment tracking)

### Why This Matters

Most tax tools ask for everything. TaxSnax asks for **only what's needed** to organize your finances. Your SSN and EIN are too sensitive to store in yet another tool—keep them secure in your existing systems and share directly with your CPA.

---

## How It Works

### 1. Initialize
```bash
taxsnax init --year 2025
```
Creates a local `.taxsnax/` directory to store your data.

### 2. Import Statements
```bash
taxsnax import chase-statement.csv --source "Chase Business"
taxsnax import amex-statement.csv --source "Amex Business"
```
Supports CSV, XLSX, PDF, QBO, and OFX formats.

### 3. Set Your Info (No SSN/EIN)
```bash
taxsnax business --name "My Business" --type llc
taxsnax personal --name "John Doe" --status single
```
We only store what's needed for calculations—never SSN or EIN.

### 4. Review & Categorize
```bash
taxsnax categorize
taxsnax recurring
```
ML engine learns your patterns. Detects recurring expenses automatically.

### 5. Generate Reports
```bash
taxsnax cpa-packet --year 2025 --output my-taxes.txt
taxsnax 1099-checklist
taxsnax tax-estimate --state PA
```
Everything your CPA needs, nothing they don't.

---

## Installation

```bash
npm install -g taxsnax
```

Requires Node.js 18+.

---

## Quick Start

```bash
# Initialize for tax year
taxsnax init --year 2025

# Import bank statements
taxsnax import chase-statement.csv --source "Chase Business"
taxsnax import amex-statement.csv --source "Amex Business"

# Set your info (SSN/EIN NOT stored)
taxsnax business --name "My Business" --type llc
taxsnax personal --name "John Doe" --status single

# Generate CPA packet
taxsnax cpa-packet --year 2025 --output my-taxes.txt
```

---

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

---

## Supported Import Formats

- **CSV** — Most bank exports (Chase, Bank of America, etc.)
- **XLSX** — Excel files from accounting software
- **PDF** — Bank statements (basic text extraction)
- **QBO** — QuickBooks Online exports
- **OFX** — Open Financial Exchange (Quicken, Money)

---

## Expense Categories

TaxSnax auto-categorizes transactions using ML with 15+ categories:

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
- Repairs & Maintenance
- Taxes & Licenses
- And more...

The ML engine learns from your corrections—get better categorization over time.

---

## 1099 Tracking

Automatically identifies contractors paid $600+ who need 1099-NEC forms.

**What TaxSnax tracks:**
- ✅ Contractor name
- ✅ Total payments
- ✅ Payment history by quarter
- ✅ Email for W-9 requests

**What TaxSnax does NOT track:**
- ❌ SSN (collect via W-9, store securely)
- ❌ EIN (collect via W-9, store securely)
- ❌ Address (optional, not required)

**Important:** Collect W-9 forms separately and store them securely outside TaxSnax. Provide SSN/EIN to your CPA directly.

---

## CPA Packet Includes

Your accountant receives a comprehensive packet:

- **Income Summary** — Total business income
- **Expense Breakdown** — By category, sorted by amount
- **1099 Contractor List** — Payment totals (no SSN/EIN)
- **Business Information** — Name, type, address (no EIN)
- **Personal Information** — Name, filing status (no SSN)
- **Tax Estimates** — Federal, state, and local estimates
- **Quarterly Payment Schedule** — When and how much to pay

Everything they need to file. Nothing that puts your identity at risk.

---

## Data Storage

All data stored locally in `.taxsnax/` directory:

```
.taxsnax/
├── transactions/     # Individual transaction JSON files
├── contractors.json  # Contractor list (no SSN/EIN)
├── business.json     # Business info (no EIN)
├── personal.json     # Personal info (no SSN)
└── summary.json      # Tax year summary
```

**No cloud. No servers. Your data stays on your machine.**

---

## Privacy & Security

- ✅ **No cloud storage** — Everything local
- ✅ **No data sent to external services** — Processing happens on your machine
- ✅ **All processing local** — No API calls, no internet required
- ✅ **SSN/EIN never stored** — Intentionally excluded
- ✅ **13-check privacy scanning** — Built-in scanner prevents data leaks

Run `npm run clean-data` to scan for accidental sensitive data before sharing.

---

## Who TaxSnax Is For

- **Freelancers** — Track 1099 income and expenses
- **Small business owners** — Organize business finances
- **Side hustlers** — Separate personal and business spending
- **Independent contractors** — Track deductible expenses
- **Anyone who hates tax season** — Simplify the chaos

---

## Who TaxSnax Is NOT For

- Large enterprises (use enterprise accounting software)
- Complex multi-entity businesses (use a CPA firm)
- People who want cloud sync (TaxSnax is local-first)
- People who want to file directly (TaxSnax organizes, doesn't file)

---

## The TaxSnax Philosophy

**"Organize the chaos, protect the sensitive, empower the professional."**

We believe tax preparation should be:
1. **Fast** — Import, categorize, done
2. **Secure** — No sensitive data in tools
3. **Transparent** — You own your data, always
4. **Collaborative** — Work with your CPA, not around them

---

## Roadmap

- [x] CSV import
- [x] XLSX import
- [x] PDF parsing
- [x] QBO/OFX support
- [x] ML categorization
- [x] 1099 tracking
- [x] Tax estimation
- [ ] Receipt OCR (photo → expense)
- [ ] Multi-year comparison
- [ ] Mileage tracking
- [ ] Home office deduction calculator

---

## Contributing

TaxSnax is open source. Contributions welcome!

```bash
git clone https://github.com/quarlwithcode/taxsnax.git
cd taxsnax
npm install
npm test
```

Please read our security policy before contributing.

---

## Disclaimer

TaxSnax helps organize tax information but **does not replace a CPA**. Always have a qualified accountant review your taxes before filing. Tax laws change—consult a professional for advice specific to your situation.

---

## License

MIT © CubiCrew

---

**Built with 💜 for small business owners who have better things to do than stress about taxes.**
