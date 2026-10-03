// src/config.js
// ─────────────────────────────────────────────────────────────────────────────
// Central configuration. Values come from CLI flags → .env → defaults.
// ─────────────────────────────────────────────────────────────────────────────
import 'dotenv/config';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const DEFAULT_CONFIG = {
  mode:         process.env.MODE           || 'profile',
  target:       process.env.TARGET         || '',
  maxItems:     Number(process.env.MAX_ITEMS ?? 50),
  outputFormat: process.env.OUTPUT_FORMAT  || 'both',
  outputDir:    path.resolve(__dirname, '..', process.env.OUTPUT_DIR || './output'),
  headless:     process.env.HEADLESS !== 'false',
  scrollDelay:  Number(process.env.SCROLL_DELAY ?? 1200),
  proxyUrl:     process.env.PROXY_URL      || null,
};

/**
 * Merge CLI-provided overrides on top of the defaults.
 * @param {Partial<typeof DEFAULT_CONFIG>} overrides
 */
export function buildConfig(overrides = {}) {
  return { ...DEFAULT_CONFIG, ...Object.fromEntries(
    Object.entries(overrides).filter(([, v]) => v !== undefined && v !== null && v !== ''),
  )};
}
