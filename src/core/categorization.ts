import type { Transaction } from './types.js';
import { EXPENSE_CATEGORIES } from './types.js';

interface CategoryRule {
  pattern: RegExp;
  category: string;
  weight: number;
}

interface VendorHistory {
  vendor: string;
  category: string;
  count: number;
  totalAmount: number;
}

interface RecurringPattern {
  description: string;
  amount: number;
  frequency: 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  lastDate: string;
}

// Built-in rules with weights
const BUILT_IN_RULES: CategoryRule[] = [
  // Advertising & Marketing
  { pattern: /facebook|instagram|google ads|linkedin|twitter|tiktok|snapchat|pinterest/i, category: 'Advertising', weight: 10 },
  { pattern: /adwords|ads manager|marketing|promotion|campaign/i, category: 'Advertising', weight: 9 },
  
  // Software & Tools
  { pattern: /github|gitlab|bitbucket/i, category: 'Software & Tools', weight: 10 },
  { pattern: /aws|amazon web|ec2|s3|rds|lambda/i, category: 'Software & Tools', weight: 10 },
  { pattern: /vercel|netlify|heroku|digitalocean|linode|vultr/i, category: 'Software & Tools', weight: 10 },
  { pattern: /stripe|paypal|square|payment processor/i, category: 'Software & Tools', weight: 9 },
  { pattern: /slack|zoom|notion|asana|trello|monday|clickup/i, category: 'Software & Tools', weight: 9 },
  { pattern: /atlassian|jira|confluence|trello/i, category: 'Software & Tools', weight: 9 },
  { pattern: /figma|sketch|adobe|creative cloud|photoshop|illustrator/i, category: 'Software & Tools', weight: 9 },
  { pattern: /vscode|jetbrains|intellij|webstorm/i, category: 'Software & Tools', weight: 8 },
  
  // Legal & Professional
  { pattern: /legal|attorney|lawyer|law firm|counsel/i, category: 'Legal & Professional', weight: 10 },
  { pattern: /accountant|cpa|bookkeeping|tax preparation/i, category: 'Legal & Professional', weight: 10 },
  { pattern: /consulting|consultant|advisor/i, category: 'Legal & Professional', weight: 8 },
  
  // Office Expenses
  { pattern: /office depot|staples|office max/i, category: 'Office Expense', weight: 10 },
  { pattern: /printer|ink|toner|paper|envelope|folder/i, category: 'Office Expense', weight: 8 },
  { pattern: /desk|chair|furniture|filing cabinet/i, category: 'Office Expense', weight: 8 },
  
  // Travel
  { pattern: /airline|flight|delta|united|american airlines|southwest/i, category: 'Travel', weight: 10 },
  { pattern: /hotel|marriott|hilton|hyatt|airbnb|vrbo/i, category: 'Travel', weight: 10 },
  { pattern: /uber|lyft|taxi|car service/i, category: 'Travel', weight: 10 },
  { pattern: /rental car|enterprise|hertz|avis/i, category: 'Travel', weight: 9 },
  { pattern: /gas station|exxon|shell|bp|chevron/i, category: 'Travel', weight: 7 },
  
  // Meals
  { pattern: /restaurant|cafe|coffee shop|bakery/i, category: 'Meals', weight: 8 },
  { pattern: /doordash|ubereats|grubhub|postmates|delivery/i, category: 'Meals', weight: 9 },
  { pattern: /starbucks|dunkin|peets|coffee/i, category: 'Meals', weight: 8 },
  { pattern: /lunch|dinner|breakfast|brunch/i, category: 'Meals', weight: 7 },
  
  // Insurance
  { pattern: /insurance|geico|state farm|progressive|allstate/i, category: 'Insurance', weight: 10 },
  { pattern: /health insurance|dental|vision|life insurance/i, category: 'Insurance', weight: 10 },
  
  // Rent/Lease
  { pattern: /rent|lease|property management|landlord/i, category: 'Rent', weight: 9 },
  { pattern: /we work|wework|coworking|shared office/i, category: 'Rent', weight: 9 },
  
  // Bank Fees
  { pattern: /bank fee|overdraft|atm fee|service charge|monthly fee/i, category: 'Bank Fees', weight: 10 },
  
  // Contract Labor / Freelancers
  { pattern: /upwork|fiverr|freelancer|toptal|guru/i, category: 'Contract Labor', weight: 10 },
  { pattern: /contractor|consultant|freelance|1099/i, category: 'Contract Labor', weight: 8 },
  
  // Education & Training
  { pattern: /course|training|workshop|certification|udemy|coursera|linkedin learning|pluralskill/i, category: 'Education & Training', weight: 9 },
  { pattern: /conference|summit|seminar|webinar/i, category: 'Education & Training', weight: 8 },
  { pattern: /book|ebook|kindle|publication/i, category: 'Education & Training', weight: 6 },
  
  // Utilities
  { pattern: /electric|gas|water|sewer|trash/i, category: 'Utilities', weight: 8 },
  { pattern: /internet|broadband|wifi|comcast|verizon|att|spectrum/i, category: 'Utilities', weight: 9 },
  { pattern: /phone|cell|mobile|wireless|t-mobile|at&t|verizon/i, category: 'Utilities', weight: 9 },
  
  // Repairs & Maintenance
  { pattern: /repair|fix|maintenance|service call/i, category: 'Repairs & Maintenance', weight: 8 },
  
  // Taxes & Licenses
  { pattern: /tax|license|permit|registration|filing fee/i, category: 'Taxes & Licenses', weight: 8 },
  
  // Shipping & Postage
  { pattern: /shipping|postage|usps|ups|fedex|dhl|mail/i, category: 'Shipping', weight: 9 },
  
  // Subscriptions
  { pattern: /subscription|membership|monthly plan|annual plan/i, category: 'Subscriptions', weight: 7 },
];

export class CategorizationEngine {
  private customRules: CategoryRule[] = [];
  private vendorHistory: Map<string, VendorHistory> = new Map();
  private recurringPatterns: Map<string, RecurringPattern> = new Map();

  addCustomRule(pattern: string, category: string, weight: number = 5): void {
    this.customRules.push({
      pattern: new RegExp(pattern, 'i'),
      category,
      weight,
    });
  }

  learnFromTransaction(tx: Transaction): void {
    if (!tx.vendor || !tx.category) return;
    
    const existing = this.vendorHistory.get(tx.vendor);
    if (existing) {
      existing.count++;
      existing.totalAmount += tx.amount;
      // If category changed, update to most common
      if (existing.category !== tx.category) {
        // Simple: keep the new one (could be smarter)
        existing.category = tx.category;
      }
    } else {
      this.vendorHistory.set(tx.vendor, {
        vendor: tx.vendor,
        category: tx.category,
        count: 1,
        totalAmount: tx.amount,
      });
    }
  }

  categorize(description: string, amount?: number): { category: string; confidence: number } {
    const scores: Map<string, number> = new Map();
    
    // Check built-in rules
    for (const rule of BUILT_IN_RULES) {
      if (rule.pattern.test(description)) {
        const current = scores.get(rule.category) || 0;
        scores.set(rule.category, current + rule.weight);
      }
    }
    
    // Check custom rules
    for (const rule of this.customRules) {
      if (rule.pattern.test(description)) {
        const current = scores.get(rule.category) || 0;
        scores.set(rule.category, current + rule.weight);
      }
    }
    
    // Check vendor history
    const vendor = this.extractVendorForLearning(description);
    const history = this.vendorHistory.get(vendor);
    if (history) {
      const current = scores.get(history.category) || 0;
      scores.set(history.category, current + 15); // High weight for learned vendors
    }
    
    // Find best match
    let bestCategory = 'Other';
    let bestScore = 0;
    
    for (const [category, score] of scores) {
      if (score > bestScore) {
        bestScore = score;
        bestCategory = category;
      }
    }
    
    // Calculate confidence (0-1)
    const confidence = Math.min(bestScore / 20, 1);
    
    return { category: bestCategory, confidence };
  }

  detectRecurring(transactions: Transaction[]): RecurringPattern[] {
    const byDescription: Map<string, Transaction[]> = new Map();
    
    // Group by normalized description
    for (const tx of transactions) {
      const normalized = this.normalizeDescription(tx.description);
      if (!byDescription.has(normalized)) {
        byDescription.set(normalized, []);
      }
      byDescription.get(normalized)!.push(tx);
    }
    
    const patterns: RecurringPattern[] = [];
    
    for (const [desc, txs] of byDescription) {
      if (txs.length < 2) continue;
      
      // Sort by date
      txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      // Check for consistent amounts
      const amounts = txs.map(t => t.amount);
      const avgAmount = amounts.reduce((a, b) => a + b, 0) / amounts.length;
      const variance = amounts.reduce((sum, amt) => sum + Math.pow(amt - avgAmount, 2), 0) / amounts.length;
      
      // If variance is low, it's likely recurring
      if (variance < 1) { // Within $1
        const frequency = this.estimateFrequency(txs);
        
        patterns.push({
          description: txs[0].description,
          amount: avgAmount,
          frequency,
          lastDate: txs[txs.length - 1].date,
        });
      }
    }
    
    return patterns.sort((a, b) => b.amount - a.amount);
  }

  suggestSplitTransactions(description: string, amount: number): { shouldSplit: boolean; suggestions?: { category: string; amount: number; note: string }[] } {
    // Common split scenarios
    const splits: { pattern: RegExp; suggestions: { category: string; percentage: number; note: string }[] }[] = [
      {
        pattern: /amazon|amzn/i,
        suggestions: [
          { category: 'Office Expense', percentage: 0.5, note: 'Office supplies' },
          { category: 'Software & Tools', percentage: 0.3, note: 'Tech equipment' },
          { category: 'Other', percentage: 0.2, note: 'Miscellaneous' },
        ],
      },
      {
        pattern: /costco|sam.s club|wholesale/i,
        suggestions: [
          { category: 'Meals', percentage: 0.3, note: 'Food/snacks' },
          { category: 'Office Expense', percentage: 0.4, note: 'Bulk supplies' },
          { category: 'Other', percentage: 0.3, note: 'General merchandise' },
        ],
      },
    ];
    
    for (const split of splits) {
      if (split.pattern.test(description) && amount > 100) {
        return {
          shouldSplit: true,
          suggestions: split.suggestions.map(s => ({
            category: s.category,
            amount: Math.round(amount * s.percentage * 100) / 100,
            note: s.note,
          })),
        };
      }
    }
    
    return { shouldSplit: false };
  }

  private extractVendorForLearning(description: string): string {
    // Simple vendor extraction
    const match = description.match(/^([A-Z][A-Z\s]+)/);
    return match ? match[1].trim() : description.split(/\s+/)[0];
  }

  private normalizeDescription(description: string): string {
    return description
      .toLowerCase()
      .replace(/\d+/g, '')
      .replace(/[^a-z]/g, ' ')
      .trim()
      .replace(/\s+/g, ' ');
  }

  private estimateFrequency(txs: Transaction[]): 'weekly' | 'monthly' | 'quarterly' | 'yearly' {
    if (txs.length < 2) return 'monthly';
    
    const intervals: number[] = [];
    for (let i = 1; i < txs.length; i++) {
      const days = (new Date(txs[i].date).getTime() - new Date(txs[i-1].date).getTime()) / (1000 * 60 * 60 * 24);
      intervals.push(days);
    }
    
    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    
    if (avgInterval < 10) return 'weekly';
    if (avgInterval < 40) return 'monthly';
    if (avgInterval < 100) return 'quarterly';
    return 'yearly';
  }

  getVendorStats(): VendorHistory[] {
    return Array.from(this.vendorHistory.values())
      .sort((a, b) => b.totalAmount - a.totalAmount);
  }

  exportRules(): string {
    return JSON.stringify({
      customRules: this.customRules.map(r => ({
        pattern: r.pattern.source,
        category: r.category,
        weight: r.weight,
      })),
      vendorHistory: Array.from(this.vendorHistory.entries()),
    }, null, 2);
  }

  importRules(json: string): void {
    const data = JSON.parse(json);
    
    if (data.customRules) {
      this.customRules = data.customRules.map((r: any) => ({
        pattern: new RegExp(r.pattern, 'i'),
        category: r.category,
        weight: r.weight,
      }));
    }
    
    if (data.vendorHistory) {
      this.vendorHistory = new Map(data.vendorHistory);
    }
  }
}

// Singleton instance
export const categorizationEngine = new CategorizationEngine();
