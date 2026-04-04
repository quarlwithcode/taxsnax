import { resolve } from 'path';

export function resolveDataDir(flag?: string): string {
  if (flag) return resolve(flag);
  if (process.env.TAXSNAX_DIR) return resolve(process.env.TAXSNAX_DIR);
  return resolve('.taxsnax');
}
