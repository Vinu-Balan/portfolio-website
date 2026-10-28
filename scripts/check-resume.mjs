// Detects the generated placeholder resume so it is never deployed by accident.
// Usage: node scripts/check-resume.mjs [--strict]   (strict exits 1 on a placeholder)
import { existsSync, readFileSync } from 'node:fs';

const MARKER = 'Placeholder resume';
const file = new URL('../public/resume.pdf', import.meta.url);
const strict = process.argv.includes('--strict');

function fail(message) {
  console.warn(`\n[resume] ${message}\n`);
  process.exit(strict ? 1 : 0);
}

if (!existsSync(file)) fail('public/resume.pdf is missing. Add your resume PDF there.');
else if (readFileSync(file, 'latin1').includes(MARKER))
  fail('public/resume.pdf is still the placeholder. Replace it with your real resume PDF.');
else console.log('[resume] public/resume.pdf looks like a real resume.');
