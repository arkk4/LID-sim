#!/usr/bin/env node
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import readline from 'node:readline';

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, '..');

const versionFile = resolve(repoRoot, 'version.json');
const packageFile = resolve(repoRoot, 'package.json');

const versionData = JSON.parse(readFileSync(versionFile, 'utf-8'));
const packageData = JSON.parse(readFileSync(packageFile, 'utf-8'));

const currentVersion = versionData.version || '1.0.0';

// Calculate default next patch: e.g. 1.0.1 -> 1.0.2
function nextPatch(v) {
  const parts = v.split('.').map(Number);
  if (parts.length === 3 && parts.every((n) => !Number.isNaN(n))) {
    return `${parts[0]}.${parts[1]}.${parts[2] + 1}`;
  }
  return `${v}-next`;
}

const defaultNext = nextPatch(currentVersion);

async function askVersion() {
  const arg = process.argv[2];
  if (arg && !arg.startsWith('-')) {
    return arg;
  }
  if (!process.stdin.isTTY) {
    return defaultNext;
  }

  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(`Current version: ${currentVersion}\nNew version [default: ${defaultNext}]: `, (ans) => {
      rl.close();
      const trimmed = ans.trim();
      resolve(trimmed || defaultNext);
    });
  });
}

const newVersion = await askVersion();

// 1. Update version.json
versionData.version = newVersion;
versionData.date = new Date().toISOString().slice(0, 10);
writeFileSync(versionFile, JSON.stringify(versionData, null, 2) + '\n');

// 2. Update package.json
packageData.version = newVersion;
writeFileSync(packageFile, JSON.stringify(packageData, null, 2) + '\n');

console.log(`✓ Updated version to ${newVersion} in version.json and package.json`);

// 3. Regenerate logos & badges
console.log('Generating logo and badge...');
execFileSync('node', [resolve(__dirname, 'generate_logo.mjs')], { stdio: 'inherit' });

// 4. Git add and commit
execFileSync('git', ['add', 'version.json', 'package.json', 'public/logo.svg', 'public/badge.svg'], {
  cwd: repoRoot,
  stdio: 'inherit',
});

const commitMsg = `chore(release): v${newVersion}`;
execFileSync('git', ['commit', '-m', commitMsg], {
  cwd: repoRoot,
  stdio: 'inherit',
});

console.log(`\n🎉 Successfully bumped and committed v${newVersion}!\nRun 'git push' to publish.`);
