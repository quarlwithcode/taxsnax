import type { TaxSummary, BusinessInfo, PersonalInfo } from './types.js';
import { formatCurrency } from './utils.js';

interface TaxEstimate {
  federal: {
    incomeTax: number;
    selfEmploymentTax: number;
    total: number;
  };
  state: {
    incomeTax: number;
    total: number;
  };
  local: {
    incomeTax: number;
    total: number;
  };
  total: number;
  effectiveRate: number;
  quarterlyPayments: number;
}

interface TaxBracket {
  min: number;
  max: number;
  rate: number;
}

// 2025 Federal Tax Brackets (Single)
const FEDERAL_BRACKETS_SINGLE: TaxBracket[] = [
  { min: 0, max: 11600, rate: 0.10 },
  { min: 11600, max: 47150, rate: 0.12 },
  { min: 47150, max: 100525, rate: 0.22 },
  { min: 100525, max: 191950, rate: 0.24 },
  { min: 191950, max: 243725, rate: 0.32 },
  { min: 243725, max: 609350, rate: 0.35 },
  { min: 609350, max: Infinity, rate: 0.37 },
];

// 2025 Federal Tax Brackets (Married Filing Jointly)
const FEDERAL_BRACKETS_JOINT: TaxBracket[] = [
  { min: 0, max: 23200, rate: 0.10 },
  { min: 23200, max: 94300, rate: 0.12 },
  { min: 94300, max: 201050, rate: 0.22 },
  { min: 201050, max: 383900, rate: 0.24 },
  { min: 383900, max: 487450, rate: 0.32 },
  { min: 487450, max: 731200, rate: 0.35 },
  { min: 731200, max: Infinity, rate: 0.37 },
];

// Standard Deduction 2025
const STANDARD_DEDUCTION = {
  single: 14600,
  'married-joint': 29200,
  'married-separate': 14600,
  'head-household': 21900,
};

// Self-employment tax rate
const SE_TAX_RATE = 0.153; // 15.3%
const SE_DEDUCTION_PERCENT = 0.5; // 50% of SE tax deductible

export function calculateFederalTax(
  netIncome: number,
  filingStatus: string
): { tax: number; bracket: string } {
  const brackets = filingStatus === 'married-joint' 
    ? FEDERAL_BRACKETS_JOINT 
    : FEDERAL_BRACKETS_SINGLE;
  
  const standardDeduction = STANDARD_DEDUCTION[filingStatus as keyof typeof STANDARD_DEDUCTION] 
    || STANDARD_DEDUCTION.single;
  
  const taxableIncome = Math.max(0, netIncome - standardDeduction);
  let tax = 0;
  let bracketUsed = '';
  
  for (const bracket of brackets) {
    if (taxableIncome > bracket.min) {
      const amountInBracket = Math.min(taxableIncome, bracket.max) - bracket.min;
      const taxInBracket = amountInBracket * bracket.rate;
      tax += taxInBracket;
      
      if (taxableIncome <= bracket.max || bracket.max === Infinity) {
        bracketUsed = `${(bracket.rate * 100).toFixed(0)}% bracket`;
      }
    }
  }
  
  return { tax, bracket: bracketUsed };
}

export function calculateSelfEmploymentTax(netIncome: number): number {
  // Only first $168,600 (2025 limit) is subject to Social Security portion
  // For simplicity, using full amount with 15.3%
  // This is a simplified calculation
  const seTaxBase = netIncome * 0.9235; // 92.35% of net income
  return seTaxBase * SE_TAX_RATE;
}

export function estimateStateTax(
  netIncome: number,
  state: string
): { tax: number; rate: number; note: string } {
  // Simplified state tax estimates
  // In reality, each state has different brackets and rules
  
  const stateRates: Record<string, { rate: number; note: string }> = {
    'CA': { rate: 0.093, note: 'California - progressive up to 12.3%' },
    'NY': { rate: 0.065, note: 'New York - progressive up to 10.9%' },
    'TX': { rate: 0, note: 'Texas - no state income tax' },
    'FL': { rate: 0, note: 'Florida - no state income tax' },
    'WA': { rate: 0, note: 'Washington - no state income tax' },
    'NV': { rate: 0, note: 'Nevada - no state income tax' },
    'PA': { rate: 0.0307, note: 'Pennsylvania - flat 3.07%' },
    'IL': { rate: 0.0495, note: 'Illinois - flat 4.95%' },
    'MA': { rate: 0.05, note: 'Massachusetts - flat 5%' },
    'NC': { rate: 0.0475, note: 'North Carolina - flat 4.75%' },
  };
  
  const stateInfo = stateRates[state.toUpperCase()];
  
  if (!stateInfo) {
    // Default estimate for unknown states
    return { 
      tax: netIncome * 0.05, 
      rate: 0.05, 
      note: `Default estimate for ${state} - verify actual rate` 
    };
  }
  
  return {
    tax: netIncome * stateInfo.rate,
    rate: stateInfo.rate,
    note: stateInfo.note,
  };
}

export function estimateLocalTax(
  netIncome: number,
  city: string
): { tax: number; rate: number; note: string } {
  // Very few cities have income tax
  const cityRates: Record<string, { rate: number; note: string }> = {
    'NYC': { rate: 0.03876, note: 'NYC - up to 3.876%' },
    'Philadelphia': { rate: 0.0389, note: 'Philadelphia - 3.89%' },
    'Baltimore': { rate: 0.032, note: 'Baltimore - 3.2%' },
    'Detroit': { rate: 0.024, note: 'Detroit - 2.4%' },
    'Cleveland': { rate: 0.025, note: 'Cleveland - 2.5%' },
  };
  
  const cityInfo = cityRates[city];
  
  if (!cityInfo) {
    return { tax: 0, rate: 0, note: `${city} - no local income tax or unknown` };
  }
  
  return {
    tax: netIncome * cityInfo.rate,
    rate: cityInfo.rate,
    note: cityInfo.note,
  };
}

export function generateTaxEstimate(
  summary: TaxSummary,
  personalInfo: PersonalInfo,
  state: string = 'PA',
  city: string = ''
): TaxEstimate {
  const netIncome = summary.netIncome;
  
  // Federal income tax
  const federalIncome = calculateFederalTax(netIncome, personalInfo.filingStatus);
  
  // Self-employment tax (if applicable)
  const seTax = calculateSelfEmploymentTax(netIncome);
  
  // State tax
  const stateTax = estimateStateTax(netIncome, state);
  
  // Local tax
  const localTax = estimateLocalTax(netIncome, city);
  
  const total = federalIncome.tax + seTax + stateTax.tax + localTax.tax;
  
  return {
    federal: {
      incomeTax: federalIncome.tax,
      selfEmploymentTax: seTax,
      total: federalIncome.tax + seTax,
    },
    state: {
      incomeTax: stateTax.tax,
      total: stateTax.tax,
    },
    local: {
      incomeTax: localTax.tax,
      total: localTax.tax,
    },
    total,
    effectiveRate: netIncome > 0 ? total / netIncome : 0,
    quarterlyPayments: total / 4,
  };
}

export function generateTaxEstimateReport(
  estimate: TaxEstimate,
  summary: TaxSummary,
  personalInfo: PersonalInfo
): string {
  const lines: string[] = [];
  
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('                    2025 TAX ESTIMATE');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');
  lines.push('⚠️  DISCLAIMER: This is an estimate only. Consult a CPA for');
  lines.push('    accurate tax calculations. Many factors can affect your');
  lines.push('    actual tax liability.');
  lines.push('');
  lines.push('INCOME SUMMARY');
  lines.push(`  Business Income:    ${formatCurrency(summary.totalIncome).padStart(12)}`);
  lines.push(`  Business Expenses:  ${formatCurrency(summary.totalExpenses).padStart(12)}`);
  lines.push(`  Net Income:         ${formatCurrency(summary.netIncome).padStart(12)}`);
  lines.push('');
  lines.push('TAX ESTIMATE BREAKDOWN');
  lines.push('  Federal:');
  lines.push(`    Income Tax:       ${formatCurrency(estimate.federal.incomeTax).padStart(12)}`);
  lines.push(`    Self-Employment:  ${formatCurrency(estimate.federal.selfEmploymentTax).padStart(12)}`);
  lines.push(`    Subtotal:         ${formatCurrency(estimate.federal.total).padStart(12)}`);
  lines.push('');
  lines.push(`  State Income Tax:   ${formatCurrency(estimate.state.total).padStart(12)}`);
  lines.push(`  Local Income Tax:   ${formatCurrency(estimate.local.total).padStart(12)}`);
  lines.push('  ─────────────────────────────────────────');
  lines.push(`  TOTAL ESTIMATED:    ${formatCurrency(estimate.total).padStart(12)}`);
  lines.push('');
  lines.push('PAYMENT SCHEDULE');
  lines.push(`  Effective Tax Rate: ${(estimate.effectiveRate * 100).toFixed(1)}%`);
  lines.push(`  Quarterly Payment:  ${formatCurrency(estimate.quarterlyPayments).padStart(12)}`);
  lines.push('');
  lines.push('2025 QUARTERLY DEADLINES');
  lines.push('  Q1: April 15, 2025');
  lines.push('  Q2: June 16, 2025');
  lines.push('  Q3: September 15, 2025');
  lines.push('  Q4: January 15, 2026');
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');
  lines.push('DEDUCTIONS NOT INCLUDED IN THIS ESTIMATE:');
  lines.push('  • Qualified Business Income (QBI) deduction');
  lines.push('  • Retirement contributions (SEP-IRA, Solo 401k)');
  lines.push('  • Health insurance premiums');
  lines.push('  • Home office deduction');
  lines.push('  • Mileage and vehicle expenses');
  lines.push('  • Other itemized deductions');
  lines.push('');
  lines.push('These can significantly reduce your taxable income.');
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════════');
  
  return lines.join('\n');
}

export function calculateQuarterlyEstimate(
  ytdIncome: number,
  quarter: number,
  filingStatus: string,
  state: string = 'PA'
): { payment: number; explanation: string } {
  // Simple method: estimate annual, divide by 4
  const annualizedIncome = ytdIncome * (4 / quarter);
  
  const fedTax = calculateFederalTax(annualizedIncome, filingStatus);
  const seTax = calculateSelfEmploymentTax(annualizedIncome);
  const stateTax = estimateStateTax(annualizedIncome, state);
  
  const annualTotal = fedTax.tax + seTax + stateTax.tax;
  const quarterlyPayment = annualTotal / 4;
  
  return {
    payment: quarterlyPayment,
    explanation: `Based on Q${quarter} YTD income of ${formatCurrency(ytdIncome)}, ` +
                 `annualized to ${formatCurrency(annualizedIncome)}. ` +
                 `Estimated annual tax: ${formatCurrency(annualTotal)}.`,
  };
}
