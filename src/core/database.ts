import { mkdir, writeFile, readFile, access } from 'fs/promises';
import { join } from 'path';
import { constants } from 'fs';
import type { Transaction, Contractor, BusinessInfo, PersonalInfo, TaxSummary } from './types.js';
import { TransactionSchema, ContractorSchema, BusinessInfoSchema, PersonalInfoSchema, TaxSummarySchema } from './types.js';

export class TaxDatabase {
  private dataDir: string;

  constructor(dataDir: string) {
    this.dataDir = dataDir;
  }

  async init(): Promise<void> {
    await mkdir(this.dataDir, { recursive: true });
    await mkdir(join(this.dataDir, 'transactions'), { recursive: true });
  }

  private txPath(id: string): string {
    return join(this.dataDir, 'transactions', `${id}.json`);
  }

  async saveTransaction(tx: Transaction): Promise<void> {
    const path = this.txPath(tx.id);
    await writeFile(path, JSON.stringify(tx, null, 2), 'utf8');
  }

  async getTransaction(id: string): Promise<Transaction | null> {
    try {
      const path = this.txPath(id);
      await access(path, constants.F_OK);
      const content = await readFile(path, 'utf8');
      return TransactionSchema.parse(JSON.parse(content));
    } catch {
      return null;
    }
  }

  async getAllTransactions(): Promise<Transaction[]> {
    const { readdir } = await import('fs/promises');
    const dir = join(this.dataDir, 'transactions');
    
    try {
      await access(dir, constants.F_OK);
    } catch {
      return [];
    }
    
    const files = await readdir(dir);
    const transactions: Transaction[] = [];
    
    for (const file of files) {
      if (file.endsWith('.json')) {
        const id = file.replace('.json', '');
        const tx = await this.getTransaction(id);
        if (tx) transactions.push(tx);
      }
    }
    
    return transactions.sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }

  async saveContractor(contractor: Contractor): Promise<void> {
    const path = join(this.dataDir, 'contractors.json');
    const contractors = await this.getAllContractors();
    const idx = contractors.findIndex(c => c.id === contractor.id);
    
    if (idx >= 0) {
      contractors[idx] = contractor;
    } else {
      contractors.push(contractor);
    }
    
    await writeFile(path, JSON.stringify(contractors, null, 2), 'utf8');
  }

  async getAllContractors(): Promise<Contractor[]> {
    try {
      const path = join(this.dataDir, 'contractors.json');
      await access(path, constants.F_OK);
      const content = await readFile(path, 'utf8');
      const data = JSON.parse(content);
      return data.map((c: unknown) => ContractorSchema.parse(c));
    } catch {
      return [];
    }
  }

  async saveBusinessInfo(info: BusinessInfo): Promise<void> {
    const path = join(this.dataDir, 'business.json');
    await writeFile(path, JSON.stringify(info, null, 2), 'utf8');
  }

  async getBusinessInfo(): Promise<BusinessInfo | null> {
    try {
      const path = join(this.dataDir, 'business.json');
      await access(path, constants.F_OK);
      const content = await readFile(path, 'utf8');
      return BusinessInfoSchema.parse(JSON.parse(content));
    } catch {
      return null;
    }
  }

  async savePersonalInfo(info: PersonalInfo): Promise<void> {
    const path = join(this.dataDir, 'personal.json');
    await writeFile(path, JSON.stringify(info, null, 2), 'utf8');
  }

  async getPersonalInfo(): Promise<PersonalInfo | null> {
    try {
      const path = join(this.dataDir, 'personal.json');
      await access(path, constants.F_OK);
      const content = await readFile(path, 'utf8');
      return PersonalInfoSchema.parse(JSON.parse(content));
    } catch {
      return null;
    }
  }

  async saveSummary(summary: TaxSummary): Promise<void> {
    const path = join(this.dataDir, 'summary.json');
    await writeFile(path, JSON.stringify(summary, null, 2), 'utf8');
  }

  async getSummary(): Promise<TaxSummary | null> {
    try {
      const path = join(this.dataDir, 'summary.json');
      await access(path, constants.F_OK);
      const content = await readFile(path, 'utf8');
      return TaxSummarySchema.parse(JSON.parse(content));
    } catch {
      return null;
    }
  }
}
