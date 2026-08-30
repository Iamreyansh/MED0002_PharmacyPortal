#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const ASSETS = path.join(ROOT, 'dist', 'assets');
const HOST_ENTRY_BUDGET_BYTES = 800_000;

if (!fs.existsSync(ASSETS)) {
  console.error(
    'Bundle budget: dist/assets is missing. Run pnpm build first; remotes must stay split.',
  );
  process.exit(1);
}

const jsFiles = fs
  .readdirSync(ASSETS)
  .filter((name) => name.endsWith('.js'))
  .map((name) => {
    const filePath = path.join(ASSETS, name);
    return { name, size: fs.statSync(filePath).size };
  })
  .sort((a, b) => b.size - a.size);

if (jsFiles.length === 0) {
  console.error('Bundle budget: no JS assets in dist/assets.');
  process.exit(1);
}

const largest = jsFiles[0];
if (largest.size > HOST_ENTRY_BUDGET_BYTES) {
  console.error(
    `Bundle budget miss (${largest.name} ${largest.size} bytes > ${HOST_ENTRY_BUDGET_BYTES}). Fail until remotes stay split.`,
  );
  process.exit(1);
}

console.log(
  `Bundle budget OK: ${largest.name} ${largest.size} bytes <= ${HOST_ENTRY_BUDGET_BYTES}`,
);
