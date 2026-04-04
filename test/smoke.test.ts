import { describe, it, expect } from 'vitest';
import { execSync } from 'child_process';

describe('Taxsnax CLI smoke', () => {
  it('shows help', () => {
    const out = execSync('node dist/cli/index.js --help', { encoding: 'utf8' });
    expect(out.toLowerCase()).toContain('taxsnax');
  });

  it('status works in json mode', () => {
    const out = execSync('node dist/cli/index.js status --json -d ./.tmp-smoke', { encoding: 'utf8' });
    expect(() => JSON.parse(out)).not.toThrow();
  });

  it('exits non-zero for unknown command', () => {
    let code = 0;
    try {
      execSync('node dist/cli/index.js __definitely_unknown__', { encoding: 'utf8', stdio: 'pipe' });
    } catch (err: any) {
      code = err.status || 1;
    }
    expect(code).not.toBe(0);
  });
});
