import { readFile } from 'fs/promises';
import { parse } from 'csv-parse/sync';
import * as XLSX from 'xlsx';
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
  source: string
): Promise<ImportResult> {
  const content = await readFile(filePath, 'utf8');

  let records: Record<string, string>[] = [];
  try {
    records = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true, // Allow inconsistent column counts
    });
  } catch (e) {
    // If parsing fails, return empty result
    return {
      transactions: [],
      duplicates: [],
      imported: 0,
      skipped: 0,
    };
  }

  const transactions: Transaction[] = [];
  const seenHashes = new Set<string>();
  const duplicates: Transaction[] = [];

  for (const record of records) {
    try {
      const tx = parseTransaction(record, source);

      if (seenHashes.has(tx.hash)) {
        duplicates.push(tx);
      } else {
        seenHashes.add(tx.hash);
        transactions.push(tx);
      }
    } catch (e) {
      // Skip invalid rows
      continue;
    }
  }

  return {
    transactions,
    duplicates,
    imported: transactions.length,
    skipped: duplicates.length,
  };
}

export async function importXLSX(
  filePath: string,
  source: string
): Promise<ImportResult> {
  const buffer = await readFile(filePath);
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  
  // Try to find the sheet with transaction data
  const sheetName = workbook.SheetNames[0];
  const worksheet = workbook.Sheets[sheetName];
  
  const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
  
  if (jsonData.length < 2) {
    throw new TaxSnaxError('XLSX file appears empty or invalid', 'IMPORT_ERROR');
  }
  
  // First row is headers
  const headers = jsonData[0].map(h => h.toString().toLowerCase().trim());
  const rows = jsonData.slice(1);
  
  const transactions: Transaction[] = [];
  const seenHashes = new Set<string>();
  const duplicates: Transaction[] = [];
  
  for (const row of rows) {
    if (row.length === 0) continue;
    
    try {
      const record: Record<string, string> = {};
      headers.forEach((header, index) => {
        record[header] = row[index]?.toString() || '';
      });
      
      const tx = parseTransaction(record, source);
      
      if (seenHashes.has(tx.hash)) {
        duplicates.push(tx);
      } else {
        seenHashes.add(tx.hash);
        transactions.push(tx);
      }
    } catch (e) {
      // Skip invalid rows
      continue;
    }
  }
  
  return {
    transactions,
    duplicates,
    imported: transactions.length,
    skipped: duplicates.length,
  };
}

export async function importPDF(
  filePath: string,
  source: string
): Promise<ImportResult> {
  // Dynamic import to handle potential issues
  const pdfModule = await import('pdf-parse');
  const pdfParse = (pdfModule as any).default || pdfModule;
  const buffer = await readFile(filePath);
  const data = await pdfParse(buffer);
  
  const text = data.text;
  const transactions: Transaction[] = [];
  const seenHashes = new Set<string>();
  const duplicates: Transaction[] = [];
  
  // Common patterns for bank statements
  // Date Description Amount
  const patterns = [
    // MM/DD/YYYY Description $0.00
    /(\d{1,2}\/\d{1,2}\/\d{2,4})\s+(.+?)\s+([\$\-]?[\d,]+\.\d{2})/g,
    // MM-DD-YYYY Description $0.00
    /(\d{1,2}-\d{1,2}-\d{2,4})\s+(.+?)\s+([\$\-]?[\d,]+\.\d{2})/g,
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      try {
        const date = formatDate(match[1]);
        const description = match[2].trim();
        const amountStr = match[3].replace(/[$,]/g, '');
        const amount = parseFloat(amountStr);
        const txType: 'income' | 'expense' = amount < 0 ? 'expense' : 'income';
        
        const txData = {
          id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          date,
          description,
          amount: Math.abs(amount),
          type: txType,
          category: autoCategorize(description),
          vendor: extractVendor(description),
          source,
        };
        
        const tx: Transaction = {
          ...txData,
          hash: hashTransaction(txData),
        };
        
        if (seenHashes.has(tx.hash)) {
          duplicates.push(tx);
        } else {
          seenHashes.add(tx.hash);
          transactions.push(tx);
        }
      } catch {
        continue;
      }
    }
  }
  
  if (transactions.length === 0) {
    throw new TaxSnaxError('Could not extract transactions from PDF. Try converting to CSV.', 'IMPORT_ERROR');
  }
  
  return {
    transactions,
    duplicates,
    imported: transactions.length,
    skipped: duplicates.length,
  };
}

export async function importQBO(
  filePath: string,
  source: string
): Promise<ImportResult> {
  const { parseStringPromise } = await import('xml2js');
  const content = await readFile(filePath, 'utf8');
  
  const result = await parseStringPromise(content);
  const transactions: Transaction[] = [];
  const seenHashes = new Set<string>();
  const duplicates: Transaction[] = [];
  
  // QBO format parsing
  const bankTransactions = result?.OFX?.BANKMSGSRSV1?.[0]?.STMTTRNRS?.[0]?.STMTRS?.[0]?.BANKTRANLIST?.[0]?.STMTTRN || [];
  
  for (const txn of bankTransactions) {
    try {
      const date = formatDate(txn.DTPOSTED?.[0] || '');
      const description = txn.NAME?.[0] || txn.MEMO?.[0] || 'Unknown';
      const amount = parseFloat(txn.TRNAMT?.[0] || '0');
      const type = amount < 0 ? 'expense' : 'income' as const;
      
      const txData = {
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        date,
        description,
        amount: Math.abs(amount),
        type: type as 'income' | 'expense' | 'transfer',
        category: autoCategorize(description),
        vendor: extractVendor(description),
        source,
      };
      
      const tx: Transaction = {
        ...txData,
        hash: hashTransaction(txData),
      };
      
      if (seenHashes.has(tx.hash)) {
        duplicates.push(tx);
      } else {
        seenHashes.add(tx.hash);
        transactions.push(tx);
      }
    } catch {
      continue;
    }
  }
  
  return {
    transactions,
    duplicates,
    imported: transactions.length,
    skipped: duplicates.length,
  };
}

export async function importOFX(
  filePath: string,
  source: string
): Promise<ImportResult> {
  // OFX is similar to QBO
  return importQBO(filePath, source);
}

function parseTransaction(record: Record<string, string>, source: string): Transaction {
  const dateCol = findColumn(record, ['date', 'transaction date', 'posted date', 'date posted']);
  const descCol = findColumn(record, ['description', 'memo', 'payee', 'name', 'transaction']);
  const amtCol = findColumn(record, ['amount', 'transaction amount', 'debit', 'credit']);
  
  if (!dateCol || !descCol || !amtCol) {
    throw new TaxSnaxError('Could not identify required columns', 'IMPORT_ERROR');
  }
  
  const date = formatDate(record[dateCol]);
  const description = record[descCol];
  const amount = parseAmount(record[amtCol]);
  const type = amount < 0 ? 'expense' : 'income' as const;
  
  const category = autoCategorize(description);
  const vendor = extractVendor(description);
  
  const txData = {
    id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    date,
    description,
    amount: Math.abs(amount),
    type: type as 'income' | 'expense' | 'transfer',
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
    const match = keys.find(k => 
      k.toLowerCase().replace(/[^a-z]/g, '') === name.toLowerCase().replace(/[^a-z]/g, '')
    );
    if (match) return match;
  }
  
  for (const name of possibleNames) {
    const match = keys.find(k => k.toLowerCase().includes(name.toLowerCase()));
    if (match) return match;
  }
  
  return undefined;
}

function parseAmount(value: string): number {
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
