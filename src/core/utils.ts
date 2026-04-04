import { createHash } from 'crypto';
import type { Transaction } from './types.js';

/**
 * Generate a hash for a transaction to detect duplicates
 */
export function hashTransaction(tx: Omit<Transaction, 'id' | 'hash'>): string {
  const data = `${tx.date}|${tx.description}|${tx.amount}|${tx.type}|${tx.source}`;
  return createHash('sha256').update(data).digest('hex').substring(0, 16);
}

/**
 * Detect duplicate transactions from multiple imports
 */
export function detectDuplicates(transactions: Transaction[]): {
  unique: Transaction[];
  duplicates: Transaction[];
} {
  const seen = new Map<string, Transaction>();
  const duplicates: Transaction[] = [];

  for (const tx of transactions) {
    const existing = seen.get(tx.hash);
    if (existing) {
      // Keep the one with more details
      if (hasMoreDetails(tx, existing)) {
        duplicates.push(existing);
        seen.set(tx.hash, tx);
      } else {
        duplicates.push(tx);
      }
    } else {
      seen.set(tx.hash, tx);
    }
  }

  return {
    unique: Array.from(seen.values()),
    duplicates,
  };
}

function hasMoreDetails(a: Transaction, b: Transaction): boolean {
  const aDetails = [a.category, a.vendor, a.notes].filter(Boolean).length;
  const bDetails = [b.category, b.vendor, b.notes].filter(Boolean).length;
  return aDetails > bDetails;
}

/**
 * Categorize a transaction based on description patterns
 */
export function autoCategorize(description: string): string {
  const desc = description.toLowerCase();
  
  // Advertising
  if (/facebook|google ads|linkedin|twitter|instagram|tiktok|advertising|marketing/.test(desc)) {
    return 'Advertising';
  }
  
  // Software & Tools
  if (/github|aws|amazon web|stripe|vercel|netlify|heroku|digitalocean|linode|atlassian|notion|slack|zoom/.test(desc)) {
    return 'Software & Tools';
  }
  
  // Legal & Professional
  if (/legal|attorney|lawyer|accountant|cpa|consulting/.test(desc)) {
    return 'Legal & Professional';
  }
  
  // Office Expense
  if (/office depot|staples|printer|paper|ink|desk|chair/.test(desc)) {
    return 'Office Expense';
  }
  
  // Travel
  if (/airline|flight|hotel|airbnb|uber|lyft|taxi|rental car|gas station/.test(desc)) {
    return 'Travel';
  }
  
  // Meals
  if (/restaurant|doordash|ubereats|grubhub|starbucks|coffee|lunch|dinner/.test(desc)) {
    return 'Meals';
  }
  
  // Insurance
  if (/insurance|geico|state farm|progressive/.test(desc)) {
    return 'Insurance';
  }
  
  // Rent
  if (/rent|lease|landlord|property management/.test(desc)) {
    return 'Rent';
  }
  
  // Bank Fees
  if (/bank fee|overdraft|atm fee|service charge/.test(desc)) {
    return 'Bank Fees';
  }
  
  // Contract Labor / Freelancers
  if (/upwork|fiverr|freelancer|contractor|consultant/.test(desc)) {
    return 'Contract Labor';
  }
  
  // Education
  if (/course|training|workshop|conference|udemy|coursera|linkedin learning/.test(desc)) {
    return 'Education & Training';
  }
  
  // Utilities
  if (/electric|gas|water|internet|phone|cell|utility/.test(desc)) {
    return 'Utilities';
  }
  
  return 'Other';
}

/**
 * Extract vendor name from transaction description
 */
export function extractVendor(description: string): string {
  // Common patterns: "PAYMENT TO VENDOR NAME" or "VENDOR NAME - DESCRIPTION"
  const patterns = [
    /^([A-Z][A-Z\s]+)\s+-/,
    /^([A-Z][A-Z\s]+)\s+\d/,
    /(?:SQ|PP)\s*\*?\s*([A-Za-z]+)/,
    /^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)/,
  ];
  
  for (const pattern of patterns) {
    const match = description.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return description.split(/\s+/).slice(0, 3).join(' ');
}

/**
 * Format currency for display
 */
export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

/**
 * Format date consistently
 */
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toISOString().split('T')[0];
}
