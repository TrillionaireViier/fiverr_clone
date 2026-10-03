// src/utils/export.js
// ─────────────────────────────────────────────────────────────────────────────
// Saves collected data to JSON and/or CSV files.
// ─────────────────────────────────────────────────────────────────────────────
import fs   from 'fs/promises';
import path from 'path';
import { createObjectCsvWriter } from 'csv-writer';

/**
 * Ensure the output directory exists.
 * @param {string} dir
 */
async function ensureDir(dir) {
  await fs.mkdir(dir, { recursive: true });
}

/**
 * Write data to a JSON file with pretty formatting.
 * @param {string} filePath
 * @param {any}    data
 */
export async function writeJson(filePath, data) {
  await ensureDir(path.dirname(filePath));
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
}

/**
 * Derive CSV column headers from the keys of the first record.
 * @param {Record<string, any>[]} records
 */
function inferHeaders(records) {
  if (!records.length) return [];
  return Object.keys(records[0]).map((key) => ({ id: key, title: key.toUpperCase() }));
}

/**
 * Write an array of flat objects to a CSV file.
 * Nested objects are JSON-stringified so they don't break the CSV.
 * @param {string}               filePath
 * @param {Record<string, any>[]} records
 */
export async function writeCsv(filePath, records) {
  if (!records.length) return;
  await ensureDir(path.dirname(filePath));

  // Flatten nested values
  const flat = records.map((r) =>
    Object.fromEntries(
      Object.entries(r).map(([k, v]) => [
        k,
        v !== null && typeof v === 'object' ? JSON.stringify(v) : v,
      ]),
    ),
  );

  const writer = createObjectCsvWriter({
    path: filePath,
    header: inferHeaders(flat),
  });
  await writer.writeRecords(flat);
}

/**
 * Persist data according to the configured output format.
 *
 * @param {object} opts
 * @param {string}                opts.outputDir    – directory to write files into
 * @param {string}                opts.filename     – base name without extension
 * @param {Record<string, any>[]} opts.records      – array of data records
 * @param {'json'|'csv'|'both'}   opts.format       – which formats to write
 * @param {(msg: string) => void} [opts.log]        – optional logger
 * @returns {{ json?: string, csv?: string }}       – paths of written files
 */
export async function saveResults({ outputDir, filename, records, format = 'both', log = console.log }) {
  const written = {};

  if (!records.length) {
    log('⚠️  No records to save.');
    return written;
  }

  if (format === 'json' || format === 'both') {
    const p = path.join(outputDir, `${filename}.json`);
    await writeJson(p, records);
    written.json = p;
    log(`✅  JSON saved → ${p}  (${records.length} records)`);
  }

  if (format === 'csv' || format === 'both') {
    const p = path.join(outputDir, `${filename}.csv`);
    await writeCsv(p, records);
    written.csv = p;
    log(`✅  CSV  saved → ${p}  (${records.length} records)`);
  }

  return written;
}
