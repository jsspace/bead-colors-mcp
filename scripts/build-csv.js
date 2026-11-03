import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { palettes } from '@meltbead/bead-colors';

const root = dirname(dirname(fileURLToPath(import.meta.url)));
const dataDir = join(root, 'data');
const csvDir = join(dataDir, 'csv');
const check = process.argv.includes('--check');
const common = ['code', 'name', 'hex', 'rgb'];

function csvValue(value) {
  const text = value == null ? '' : String(value);
  return /[",\r\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function csv(headers, rows) {
  return [headers, ...rows].map(row => row.map(csvValue).join(',')).join('\r\n') + '\r\n';
}

function save(filename, content) {
  const path = join(csvDir, filename);
  if (check) {
    if (readFileSync(path, 'utf8') !== content) throw new Error(`CSV is out of date: ${filename}`);
  } else {
    writeFileSync(path, content);
  }
}

mkdirSync(csvDir, { recursive: true });
for (const filename of readdirSync(join(dataDir, 'palettes')).filter(name => name.endsWith('.json')).sort()) {
  const palette = JSON.parse(readFileSync(join(dataDir, 'palettes', filename), 'utf8'));
  const extra = [...new Set(palette.colors.flatMap(color => Object.keys(color)))].filter(key => !common.includes(key));
  const headers = ['code', 'name', 'hex', 'r', 'g', 'b', ...extra, 'publisher', 'source_url', 'license', 'status'];
  const rows = palette.colors.map(color => [
    color.code, color.name, color.hex, ...(color.rgb ?? [null, null, null]),
    ...extra.map(key => color[key]), palette.publisher, palette.publisherUrl, palette.license, palette.status,
  ]);
  if (rows.length !== palette.count) throw new Error(`Count mismatch: ${filename}`);
  save(filename.replace(/\.json$/, '.csv'), csv(headers, rows));
}

const kits = JSON.parse(readFileSync(join(dataDir, 'sets', 'mard-kits.json'), 'utf8'));
const kitRows = kits.sets.flatMap(set => {
  const codes = set.codes === 'all' ? palettes.mard.colors.map(color => color.code) : set.codes;
  if (codes.length !== set.size || new Set(codes).size !== codes.length) throw new Error(`Invalid MARD kit: ${set.size}`);
  return codes.map(code => [set.size, set.palette, code, kits.publisher, kits.publisherUrl, kits.license]);
});
save('mard-kits.csv', csv(['size', 'palette', 'code', 'publisher', 'source_url', 'license'], kitRows));
console.log(`${check ? 'Verified' : 'Generated'} 9 CSV files`);
