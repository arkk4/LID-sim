#!/usr/bin/env node
/**
 * tools/generate_logo.mjs
 *
 * Single source worker for generating public/logo.svg, public/logo.png and public/badge.svg.
 * Reads configuration directly from version.json.
 */
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { execFileSync } from 'node:child_process';

const repoRoot = resolve(import.meta.dirname, '..');
const versionFile = resolve(repoRoot, 'version.json');
// Prefer vendor/logogen submodule; fall back to LOGOGEN_PATH env
const submodulePath = resolve(repoRoot, 'vendor', 'logogen', 'cli', 'logogen.mjs');
const envPath       = process.env.LOGOGEN_PATH;
const logogenPath   = existsSync(submodulePath) ? submodulePath
                    : envPath && existsSync(envPath) ? envPath
                    : null;

if (!logogenPath) {
  console.warn('[generate_logo] logogen not found. Run: git submodule update --init');
  process.exit(0);
}

const config = JSON.parse(readFileSync(versionFile, 'utf-8'));
const name = config.name || 'LID-sim';
const version = `v${config.version || '1.0.0'}`;
const pattern = config.logo?.pattern || 'rings';
const palette = Array.isArray(config.logo?.palette)
  ? config.logo.palette.join(',')
  : (config.logo?.palette || '#09090b,#27272a,#52525b,#a1a1aa,#fafafa');
const shape = config.logo?.shape || 'squircle';
const font = config.logo?.font || 'sans';

const logoSvg  = resolve(repoRoot, 'public/logo.svg');
const logoPng  = resolve(repoRoot, 'public/logo.png');
const badgeOut = resolve(repoRoot, 'public/badge.svg');

// 1. Generate logo.svg
execFileSync('node', [
  logogenPath,
  '--name', name,
  '--version', version,
  '--pattern', pattern,
  '--palette', palette,
  '--shape', shape,
  '--font', font,
  '--out', logoSvg,
], { stdio: 'inherit' });

// 2. Rasterize logo.svg → logo.png (128×128, crisp for favicon & in-app use)
execFileSync('rsvg-convert', ['-w', '128', '-h', '128', '-f', 'png', logoSvg, '-o', logoPng]);

// 3. Generate badge.svg
execFileSync('node', [
  logogenPath,
  '--badge',
  '--name', name,
  '--version', version,
  '--pattern', pattern,
  '--palette', palette,
  '--font', font,
  '--out', badgeOut,
], { stdio: 'inherit' });

console.log(`✓ Generated public/logo.svg + logo.png + badge.svg (${name} ${version})`);
