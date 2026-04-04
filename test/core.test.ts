import { describe, it, expect } from 'vitest';
import { hashTransaction, autoCategorize, extractVendor, formatCurrency } from '../src/core/utils.js';
import { detectDuplicates } from '../src/core/utils.js';

describe('utils', () => {
  it('hashes transactions consistently', () => {
    const tx = {
      date: '2025-01-15',
      description: 'Office Depot',
      amount: 45.67,
      type: 'expense' as const,
      source: 'test.csv',
    };
    const hash1 = hashTransaction(tx);
    const hash2 = hashTransaction(tx);
    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(16);
  });

  it('auto-categorizes common vendors', () => {
    expect(autoCategorize('Facebook Ads')).toBe('Advertising');
    expect(autoCategorize('GitHub subscription')).toBe('Software & Tools');
    expect(autoCategorize('Uber ride')).toBe('Travel');
    expect(autoCategorize('Unknown vendor')).toBe('Other');
  });

  it('extracts vendor names', () => {
    expect(extractVendor('STARBUCKS #1234')).toContain('STARBUCKS');
    expect(extractVendor('AMAZON.COM')).toContain('AMAZON');
  });

  it('formats currency', () => {
    expect(formatCurrency(1234.56)).toBe('$1,234.56');
    expect(formatCurrency(0)).toBe('$0.00');
  });

  it('detects duplicate transactions', () => {
    const txs = [
      { id: '1', date: '2025-01-01', description: 'Test', amount: 100, type: 'expense' as const, source: 'a.csv', hash: 'abc123' },
      { id: '2', date: '2025-01-01', description: 'Test', amount: 100, type: 'expense' as const, source: 'a.csv', hash: 'abc123' },
      { id: '3', date: '2025-01-02', description: 'Other', amount: 200, type: 'expense' as const, source: 'b.csv', hash: 'def456' },
    ];
    const { unique, duplicates } = detectDuplicates(txs);
    expect(unique).toHaveLength(2);
    expect(duplicates).toHaveLength(1);
  });
});
