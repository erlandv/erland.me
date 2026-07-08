import { existsSync } from 'node:fs';
import { resolve } from 'node:path';

function assert(condition, message) {
  if (!condition) {
    console.error(`Smoke Test Failed: ${message}`);
    process.exit(1);
  }
}

console.log('Running smoke tests...');

const distPath = resolve(process.cwd(), 'dist');
const indexPath = resolve(distPath, 'index.html');
const searchIndexPath = resolve(process.cwd(), 'public/search-index.json');

assert(
  existsSync(indexPath),
  'dist/index.html is missing. Build might have failed or not run yet.',
);
assert(
  existsSync(searchIndexPath),
  'public/search-index.json is missing. Pre-build/Search generation might have failed.',
);

console.log('Smoke tests passed. Important artifacts exist.');
