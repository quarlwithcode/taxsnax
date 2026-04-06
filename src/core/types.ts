import { z } from 'zod';

// Transaction schema for bank statement imports
export const TransactionSchema = z.object({
  id: z.string(),
  date: z.string(), // ISO date or various formats
  description: z.string(),
  amount: z.number(),
  type: z.enum(['income', 'expense', 'transfer']),
  category: z.string().optional(),
  subcategory: z.string().optional(),
  vendor: z.string().optional(),
  notes: z.string().optional(),
  source: z.string(), // Which file/import this came from
  hash: z.string(), // For duplicate detection
});
export type Transaction = z.infer<typeof TransactionSchema>;

// 1099 Contractor tracking
// Note: SSN/EIN are NOT stored - collect via W-9 forms separately
export const ContractorSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email().optional(),
  totalPaid2025: z.number().default(0),
  transactions: z.array(z.string()), // Transaction IDs
  needs1099: z.boolean().default(false),
  issued1099: z.boolean().default(false),
  // SSN/EIN are intentionally excluded - manage via W-9 forms, not this tool
});
export type Contractor = z.infer<typeof ContractorSchema>;

// Expense categories
export const EXPENSE_CATEGORIES = [
  // General business expenses
  'Advertising',
  'Contract Labor',
  'Legal & Professional',
  'Office Expense',
  'Supplies',
  'Travel',
  'Meals',
  'Utilities',
  'Rent',
  'Insurance',
  'Software & Tools',
  'Education & Training',
  'Bank Fees',
  'Interest',
  'Repairs & Maintenance',
  'Taxes & Licenses',
  'Wages',
  'Benefits',
  'Other',
] as const;

// Business info
// Note: EIN is NOT stored - keep secure records separately
export const BusinessInfoSchema = z.object({
  name: z.string(),
  address: z.string(),
  businessType: z.enum(['sole-proprietorship', 'llc', 's-corp', 'c-corp', 'partnership']),
  taxYear: z.number().default(2025),
  // EIN is intentionally excluded - manage securely outside this tool
});
export type BusinessInfo = z.infer<typeof BusinessInfoSchema>;

// Personal info
// Note: SSN is NOT stored - keep secure records separately
export const PersonalInfoSchema = z.object({
  name: z.string(),
  address: z.string(),
  filingStatus: z.enum(['single', 'married-joint', 'married-separate', 'head-household']),
  dependents: z.number().default(0),
  // SSN is intentionally excluded - manage securely outside this tool
});
export type PersonalInfo = z.infer<typeof PersonalInfoSchema>;

// Tax summary
export const TaxSummarySchema = z.object({
  taxYear: z.number(),
  totalIncome: z.number(),
  totalExpenses: z.number(),
  netIncome: z.number(),
  contractorsOver600: z.array(ContractorSchema),
  expenseBreakdown: z.record(z.number()),
  transactionCount: z.number(),
  duplicateCount: z.number(),
});
export type TaxSummary = z.infer<typeof TaxSummarySchema>;

// Import formats
export const ImportFormatSchema = z.enum(['csv', 'xlsx', 'pdf', 'qbo', 'ofx']);
export type ImportFormat = z.infer<typeof ImportFormatSchema>;

// App version
export const APP_VERSION = '0.1.1';
