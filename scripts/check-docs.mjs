import fs from 'fs';

const required = [
  'README.md',
  'COMMAND_MAP.md',
  'SKILL.md',
  'AGENTS.md',
  'CHANGELOG.md',
  'RELEASE_CHECKLIST.md',
  'LICENSE',
];

const missing = required.filter((f) => !fs.existsSync(f));
if (missing.length) {
  console.error('Missing required docs:', missing.join(', '));
  process.exit(1);
}

const readme = fs.readFileSync('README.md', 'utf8');
const mustInclude = ['Getting Started', '--json', '-d, --dir'];
const missingReadme = mustInclude.filter((s) => !readme.includes(s));
if (missingReadme.length) {
  console.error('README missing required sections/flags:', missingReadme.join(', '));
  process.exit(1);
}

const skill = fs.readFileSync('SKILL.md', 'utf8');
if (skill.toLowerCase().includes('json file') && skill.toLowerCase().includes('sqlite')) {
  console.error('SKILL.md has conflicting storage docs (json vs sqlite).');
  process.exit(1);
}

console.log('✅ docs check passed');
