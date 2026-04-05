import type { Contractor, Transaction } from './types.js';
import { ContractorSchema } from './types.js';
import { formatCurrency } from './utils.js';

export interface Contractor1099Info {
  contractor: Contractor;
  missingInfo: string[];
  readyToFile: boolean;
}

export interface PaymentHistory {
  year: number;
  quarters: {
    q1: number;
    q2: number;
    q3: number;
    q4: number;
  };
  total: number;
  transactions: Transaction[];
}

export function calculate1099Threshold(contractor: Contractor): boolean {
  return contractor.totalPaid2025 >= 600;
}

export function getMissing1099Info(contractor: Contractor): string[] {
  const missing: string[] = [];
  
  if (!contractor.name || contractor.name === 'Unknown') {
    missing.push('Legal name');
  }
  
  if (!contractor.address) {
    missing.push('Mailing address');
  }
  
  if (!contractor.email) {
    missing.push('Email address (recommended)');
  }
  
  if (!contractor.ssn && !contractor.ein) {
    missing.push('SSN or EIN (from W-9)');
  }
  
  return missing;
}

export function isReadyToFile(contractor: Contractor): boolean {
  const missing = getMissing1099Info(contractor);
  return missing.length === 0 && contractor.needs1099 && !contractor.issued1099;
}

export function generate1099Checklist(contractors: Contractor[]): string {
  const lines: string[] = [];
  
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('                    1099-NEC CHECKLIST');
  lines.push('                        2025 Tax Year');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');
  
  const needing1099 = contractors.filter(c => c.needs1099);
  
  if (needing1099.length === 0) {
    lines.push('No contractors require 1099s for 2025.');
    lines.push('');
    lines.push('Note: Only contractors paid $600+ need 1099s.');
  } else {
    lines.push(`Total contractors needing 1099s: ${needing1099.length}`);
    lines.push('');
    
    // Group by status
    const ready = needing1099.filter(c => isReadyToFile(c));
    const incomplete = needing1099.filter(c => !isReadyToFile(c) && !c.issued1099);
    const issued = needing1099.filter(c => c.issued1099);
    
    if (ready.length > 0) {
      lines.push('✅ READY TO FILE:');
      lines.push('');
      for (const c of ready) {
        lines.push(`   ${c.name}`);
        lines.push(`      Amount: ${formatCurrency(c.totalPaid2025)}`);
        lines.push(`      TIN: ${c.ein ? 'EIN ' + c.ein : 'SSN on file'}`);
        lines.push('');
      }
    }
    
    if (incomplete.length > 0) {
      lines.push('⚠️  INCOMPLETE (Need W-9):');
      lines.push('');
      for (const c of incomplete) {
        lines.push(`   ${c.name}`);
        lines.push(`      Amount: ${formatCurrency(c.totalPaid2025)}`);
        const missing = getMissing1099Info(c);
        for (const m of missing) {
          lines.push(`      ❌ ${m}`);
        }
        lines.push('');
      }
    }
    
    if (issued.length > 0) {
      lines.push('📤 ALREADY ISSUED:');
      lines.push('');
      for (const c of issued) {
        lines.push(`   ${c.name} - ${formatCurrency(c.totalPaid2025)}`);
      }
      lines.push('');
    }
    
    lines.push('═══════════════════════════════════════════════════════════════');
    lines.push('');
    lines.push('DEADLINE: January 31, 2026');
    lines.push('');
    lines.push('Next Steps:');
    if (incomplete.length > 0) {
      lines.push(`1. Request W-9 forms from ${incomplete.length} contractor(s)`);
    }
    if (ready.length > 0) {
      lines.push(`2. File 1099-NEC for ${ready.length} ready contractor(s)`);
    }
    lines.push('3. Send Copy B to contractors by Jan 31');
    lines.push('4. File Copy A with IRS by Jan 31');
  }
  
  lines.push('');
  lines.push('═══════════════════════════════════════════════════════════════');
  
  return lines.join('\n');
}

export function generateW9RequestEmail(contractor: Contractor): string {
  const lines: string[] = [];
  
  lines.push(`Subject: W-9 Request for 2025 Tax Filing`);
  lines.push('');
  lines.push(`Dear ${contractor.name},`);
  lines.push('');
  lines.push('For tax year 2025, we have recorded payments to you totaling');
  lines.push(`${formatCurrency(contractor.totalPaid2025)}. As this exceeds the $600`);
  lines.push('threshold, we are required to issue a Form 1099-NEC.');
  lines.push('');
  lines.push('To ensure accurate tax reporting, please provide a completed');
  lines.push('Form W-9 at your earliest convenience.');
  lines.push('');
  lines.push('Required information:');
  lines.push('  • Legal name (as shown on your tax return)');
  lines.push('  • Business name (if different)');
  lines.push('  • Federal tax classification');
  lines.push('  • Address');
  lines.push('  • SSN or EIN');
  lines.push('');
  lines.push('You can download Form W-9 here:');
  lines.push('https://www.irs.gov/pub/irs-pdf/fw9.pdf');
  lines.push('');
  lines.push('Please return the completed form by January 15, 2026.');
  lines.push('');
  lines.push('Thank you,');
  lines.push('[Your Name]');
  lines.push('[Your Business]');
  
  return lines.join('\n');
}

export function calculatePaymentHistory(
  contractor: Contractor,
  transactions: Transaction[]
): PaymentHistory {
  const year = 2025;
  
  const quarters = {
    q1: 0,
    q2: 0,
    q3: 0,
    q4: 0,
  };
  
  const contractorTxs = transactions.filter(tx => 
    contractor.transactions.includes(tx.id)
  );
  
  for (const tx of contractorTxs) {
    const date = new Date(tx.date);
    const month = date.getMonth(); // 0-11
    
    if (month < 3) quarters.q1 += tx.amount;
    else if (month < 6) quarters.q2 += tx.amount;
    else if (month < 9) quarters.q3 += tx.amount;
    else quarters.q4 += tx.amount;
  }
  
  return {
    year,
    quarters,
    total: quarters.q1 + quarters.q2 + quarters.q3 + quarters.q4,
    transactions: contractorTxs,
  };
}

export function generateContractorReport(contractor: Contractor, history: PaymentHistory): string {
  const lines: string[] = [];
  
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('                    CONTRACTOR REPORT');
  lines.push('═══════════════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Contractor: ${contractor.name}`);
  if (contractor.email) lines.push(`Email: ${contractor.email}`);
  if (contractor.address) lines.push(`Address: ${contractor.address}`);
  lines.push('');
  lines.push('PAYMENT SUMMARY - 2025');
  lines.push(`  Q1 (Jan-Mar):  ${formatCurrency(history.quarters.q1).padStart(12)}`);
  lines.push(`  Q2 (Apr-Jun):  ${formatCurrency(history.quarters.q2).padStart(12)}`);
  lines.push(`  Q3 (Jul-Sep):  ${formatCurrency(history.quarters.q3).padStart(12)}`);
  lines.push(`  Q4 (Oct-Dec):  ${formatCurrency(history.quarters.q4).padStart(12)}`);
  lines.push('  ─────────────────────────────────────');
  lines.push(`  TOTAL:         ${formatCurrency(history.total).padStart(12)}`);
  lines.push('');
  lines.push('1099 STATUS:');
  lines.push(`  Threshold Met: ${contractor.needs1099 ? 'YES ($600+)' : 'NO (under $600)'}`);
  lines.push(`  Form Issued:   ${contractor.issued1099 ? 'YES' : 'NO'}`);
  lines.push('');
  
  if (contractor.needs1099 && !contractor.issued1099) {
    const missing = getMissing1099Info(contractor);
    if (missing.length > 0) {
      lines.push('MISSING INFORMATION:');
      for (const m of missing) {
        lines.push(`  ❌ ${m}`);
      }
      lines.push('');
    }
  }
  
  lines.push('═══════════════════════════════════════════════════════════════');
  
  return lines.join('\n');
}

export function consolidateContractorPayments(
  transactions: Transaction[],
  existingContractors: Contractor[]
): Contractor[] {
  const contractors = new Map<string, Contractor>();
  
  // Load existing
  for (const c of existingContractors) {
    contractors.set(c.name.toLowerCase(), c);
  }
  
  // Group transactions by vendor
  const vendorTxs: Map<string, Transaction[]> = new Map();
  
  for (const tx of transactions) {
    if (tx.type !== 'expense') continue;
    if (tx.category !== 'Contract Labor') continue;
    
    const vendor = tx.vendor || 'Unknown';
    if (!vendorTxs.has(vendor)) {
      vendorTxs.set(vendor, []);
    }
    vendorTxs.get(vendor)!.push(tx);
  }
  
  // Update or create contractors
  for (const [vendor, txs] of vendorTxs) {
    const total = txs.reduce((sum, tx) => sum + tx.amount, 0);
    const existing = contractors.get(vendor.toLowerCase());
    
    if (existing) {
      existing.totalPaid2025 = total;
      existing.transactions = txs.map(t => t.id);
      existing.needs1099 = total >= 600;
    } else {
      const newContractor: Contractor = {
        id: `contractor-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: vendor,
        totalPaid2025: total,
        transactions: txs.map(t => t.id),
        needs1099: total >= 600,
        issued1099: false,
      };
      contractors.set(vendor.toLowerCase(), newContractor);
    }
  }
  
  return Array.from(contractors.values());
}
