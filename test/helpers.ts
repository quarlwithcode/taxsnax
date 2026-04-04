/**
 * 🧾 Taxsnax — Test Helpers
 */

import fs from 'fs';
import path from 'path';
import os from 'os';

import { Taxsnax } from '../src/core/taxsnax.js';
import type { TaxsnaxConfig } from '../src/core/types.js';

export function makeTmpTaxsnax(config: Partial<TaxsnaxConfig> = {}): {
  taxsnax: Taxsnax;
  dir: string;
  cleanup: () => void;
} {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'taxsnax-test-'));
  const taxsnax = new Taxsnax({ data_dir: dir, ...config });
  return {
    taxsnax,
    dir,
    cleanup: () => {
      taxsnax.close();
      fs.rmSync(dir, { recursive: true, force: true });
    },
  };
}


export function isoNow(): string {
  return new Date().toISOString();
}

export function isoAgo(minutes: number): string {
  return new Date(Date.now() - minutes * 60 * 1000).toISOString();
}
