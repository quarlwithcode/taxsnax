import { readFile } from 'fs/promises';
import { parse } from 'csv-parse/sync';
import type { Transaction } from './types.js';
import { hashTransaction, autoCategorize, extractVendor, formatDate } from './utils.js';
import { TaxSnaxError } from './errors.js';

interface ImportResult {
  transactions: Transaction[];
  duplicates: Transaction[];
  imported: number;
  skipped: number;
}

export async function importCSV(
  filePath: string,
  source: string,
  options: {
    dateColumn?: string;
    descriptionColumn?: string;
    amountColumn?: string;
    typeColumn?: string;
    dateFormat?: string;
  } = {}
): Promise<ImportResult> {
  const content = await readFile(filePath, 'utf8');
  
  const records = parse(content, {
    columns: true,
    skip_empty_lines: true,
    trim: true,
  });
  
  const transactions: Transaction[] = [];
  const seenHashes = new Set<string>();
  const duplicates: Transaction[] = [];
  
  for (const record of records) {
    try {
      const tx = parseTransaction(record, source, options);
      
      if (seenHashes.has(tx.hash)) {
        duplicates.push(tx);
      } else {
        seenHashes.add(tx.hash);
        transactions.push(tx);
      }
    } catch (e) {
      // Skip invalid rows
      console.warn(`Skipping invalid row: ${e}`);
    }
  }
  
  return {
    transactions,
    duplicates,
    imported: transactions.length,
    skipped: duplicates.length,
  };
}

function parseTransaction(
  record: Record<string, string>,
  source: string,
  options: {
    dateColumn?: string;
    descriptionColumn?: string;
    amountColumn?: string;
    typeColumn?: string;
  }
): Transaction {
  // Auto-detect columns if not specified
  const dateCol = options.dateColumn || findColumn(record, ['date', 'transaction date', 'posted date', 'date posted']);
  const descCol = options.descriptionColumn || findColumn(record, ['description', 'memo', 'payee', 'name', 'transaction']);
  const amtCol = options.amountColumn || findColumn(record, ['amount', 'transaction amount', 'debit', 'credit']);
  const typeCol = options.typeColumn || findColumn(record, ['type', 'transaction type', 'category']);
  
  if (!dateCol || !descCol || !amtCol) {
    throw new TaxSnaxError('Could not identify required columns', 'IMPORT_ERROR');
  }
  
  const date = formatDate(record[dateCol]);
  const description = record[descCol];
  const amount = parseAmount(record[amtCol]);
  
  // Determine type from amount or explicit type column
  let type: 'income' | 'expense' | 'transfer' = 'expense';
  
  if (typeCol) {
    const typeValue = record[typeCol]?.toLowerCase() || '';
    if (typeValue.includes('income') || typeValue.includes('deposit')) {
      type = 'income';
    } else if (typeValue.includes('transfer')) {
      type = 'transfer';
    }
  } else {
    // Infer from amount sign
    type = amount < 0 ? 'expense' : 'income';
  }
  
  const category = autoCategorize(description);
  const vendor = extractVendor(description);
  
  const txData = {
    id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date,
    description,
    amount: Math.abs(amount),
    type,
    category,
    vendor,
    source,
  };
  
  return {
    ...txData,
    hash: hashTransaction(txData),
  };
}

function findColumn(record: Record<string, string>, possibleNames: string[]): string | undefined {
  const keys = Object.keys(record);
  
  for (const name of possibleNames) {
    const match = keys.find(k => k.toLowerCase().replace(/[^a-z]/g, '') === name.toLowerCase().replace(/[^a-z]/g, ''));
    if (match) return match;
  }
  
  // Fuzzy match
  for (const name of possibleNames) {
    const match = keys.find(k => k.toLowerCase().includes(name.toLowerCase()));
    if (match) return match;
  }
  
  return undefined;
}

function parseAmount(value: string): number {
  // Handle various formats: 1,234.56, $1,234.56, (1,234.56) for negative
  const cleaned = value
    .replace(/[$,]/g, '')
    .replace(/\(([^)]+)\)/, '-$1')
    .trim();
  
  const num = parseFloat(cleaned);
  
  if (isNaN(num)) {
    throw new TaxSnaxError(`Invalid amount: ${value}`, 'IMPORT_ERROR');
  }
  
  return num;
}

// Placeholder for XLSX import
export async function importXLSX(
  filePath: string,
  source: string
): Promise<ImportResult> {
  throw new TaxSnaxError('XLSX import not yet implemented. Export as CSV first.', 'NOT_IMPLEMENTED');
}

// Placeholder for PDF import  
export async function importPDF(
  filePath: string,
  source: string
): Promise<ImportResult> {
  throw new TaxSnaxError('PDF import not yet implemented. Export as CSV first.', 'NOT_IMPLEMENTED');
}
