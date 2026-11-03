import { readFileSync } from 'node:fs';
import { palettes as beadPalettes, primaryPaletteIds as beadPrimaryIds } from '@meltbead/bead-colors';
import { deltaE2000, hexToRgb, rgbToLab } from './color-distance.js';

export const MATCH_NOTE = 'HEX/RGB and ΔE00 compare approximate screen references, not physical materials. Check printed product codes and important shades against real materials.';
const importedIds = ['miyuki-delica', 'dmc-floss', 'dmc-diamond', 'red-heart-super-saver', 'lego', 'minecraft-blocks', 'minecraft-map', 'pixel-art-256'];
const mardKits = JSON.parse(readFileSync(new URL('../data/sets/mard-kits.json', import.meta.url), 'utf8'));
const importedPalettes = Object.fromEntries(importedIds.map(id => {
  const raw = JSON.parse(readFileSync(new URL(`../data/palettes/${id}.json`, import.meta.url), 'utf8'));
  return [id, {
    ...raw, series: raw.product, beadSizeMm: null,
    source: ['https://meltbead.com/'],
    references: raw.sources.map(item => item.url.startsWith('./')
      ? { ...item, url: 'https://meltbead.com/' }
      : item),
    origin: 'Meltbead',
    colors: raw.colors.map(color => ({
      ...color,
      rgb: color.rgb ? { r: color.rgb[0], g: color.rgb[1], b: color.rgb[2] } : null,
      finish: color.glass && color.glass !== 'opaque' ? 'effect' : 'solid',
    })),
  }];
}));

export const palettes = Object.freeze({ ...beadPalettes, ...importedPalettes });
export const paletteIds = Object.keys(palettes);
export const primaryPaletteIds = [...beadPrimaryIds, ...importedIds.filter(id => id !== 'pixel-art-256')];

function requirePalette(id) {
  const palette = palettes[id];
  if (!palette) throw new RangeError(`Unknown palette: ${id}. Available palettes: ${paletteIds.join(', ')}`);
  return palette;
}

function paletteInfo(palette) {
  return {
    id: palette.id, brand: palette.brand, series: palette.series,
    product: palette.product ?? null, craft: palette.craft ?? 'fuse beads',
    beadSizeMm: palette.beadSizeMm, colorCount: palette.colors.length,
    status: palette.status ?? 'see source notes',
    license: palette.license ?? 'MIT (see @meltbead/bead-colors notices)',
    source: ['https://meltbead.com/'],
    references: palette.references ?? palette.source.map(url => ({ name: 'Underlying reference', url })),
    origin: 'Meltbead', originUrl: 'https://meltbead.com/',
    notes: palette.notes,
  };
}

function normalizeCode(code) { return code.trim().toUpperCase().replace(/[\s_-]/g, ''); }

function findColor(palette, code) {
  const normalized = normalizeCode(code);
  let color = palette.colors.find(item => normalizeCode(item.code) === normalized);
  if (!color && palette.id === 'miyuki-delica') {
    const digits = normalized.replace(/^DB/, '');
    if (/^\d{1,4}$/.test(digits)) color = palette.colors.find(item => item.code === `DB${digits.padStart(4, '0')}`);
  }
  return color;
}

function indexedColor(palette, color) {
  return { paletteId: palette.id, brand: palette.brand, series: palette.series,
    dataOrigin: 'Meltbead', dataSourceUrl: 'https://meltbead.com/', ...color };
}
function candidates(palette, includeEffects) {
  return palette.colors.filter(color => color.hex && (includeEffects || color.finish === 'solid') && color.discontinued !== true && color.buildable !== false);
}
function nearest(hex, palette, limit, includeEffects) {
  const inputLab = rgbToLab(hexToRgb(hex));
  return candidates(palette, includeEffects)
    .map(color => ({ ...indexedColor(palette, color), deltaE: deltaE2000(inputLab, rgbToLab(hexToRgb(color.hex))) }))
    .sort((a, b) => a.deltaE - b.deltaE || a.code.localeCompare(b.code))
    .slice(0, limit);
}

export function listPalettes() { return { palettes: Object.values(palettes).map(paletteInfo), primaryPaletteIds }; }
export function listMardKits(size) {
  const selected = size === undefined ? mardKits.sets : mardKits.sets.filter(set => set.size === size);
  const sets = selected.map(set => ({ ...set,
    codes: set.codes === 'all' ? beadPalettes.mard.colors.map(color => color.code) : set.codes }));
  if (size !== undefined && !sets.length) throw new RangeError(`Unknown MARD box size: ${size}`);
  return {
    description: mardKits.description,
    sets,
    dataOrigin: 'Meltbead',
    source: 'https://meltbead.com/',
    license: 'CC-BY-4.0',
  };
}
export function lookupColor(paletteId, code) {
  const palette = requirePalette(paletteId);
  const color = findColor(palette, code);
  if (!color) throw new RangeError(`Color code ${code} was not found in ${paletteId}`);
  return { palette: paletteInfo(palette), color, note: MATCH_NOTE };
}
export function searchColors({ query, paletteId, limit = 20 }) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) throw new RangeError('query must not be empty');
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new RangeError('limit must be between 1 and 100');
  const selected = paletteId ? [requirePalette(paletteId)] : primaryPaletteIds.map(id => palettes[id]);
  const results = selected.flatMap(palette => palette.colors
    .filter(color => [color.code, color.name, color.hex ?? '', palette.brand, palette.series].some(value => value.toLowerCase().includes(normalized)))
    .map(color => indexedColor(palette, color)));
  return { query, paletteId: paletteId ?? null, total: results.length, colors: results.slice(0, limit), note: MATCH_NOTE };
}
export function findNearestColors({ hex, paletteId, limit = 5, includeEffects = false }) {
  const palette = requirePalette(paletteId);
  if (!Number.isInteger(limit) || limit < 1 || limit > 20) throw new RangeError('limit must be between 1 and 20');
  return { inputHex: hex.toUpperCase(), palette: paletteInfo(palette), colors: nearest(hex, palette, limit, includeEffects), distanceMetric: 'CIEDE2000 (ΔE00)', note: MATCH_NOTE };
}
export function matchAcrossPalettes({ hex, sourcePaletteId, code, targetPaletteIds, includeEffects = false }) {
  const hasHex = hex !== undefined;
  const hasSource = sourcePaletteId !== undefined || code !== undefined;
  if (hasHex === hasSource || (hasSource && (!sourcePaletteId || !code))) throw new TypeError('Provide either hex or both sourcePaletteId and code');
  let inputHex = hex;
  if (hasSource) {
    const source = findColor(requirePalette(sourcePaletteId), code);
    if (!source) throw new RangeError(`Color code ${code} was not found in ${sourcePaletteId}`);
    if (!source.hex) throw new RangeError(`Color has no single HEX reference: ${sourcePaletteId}/${code}`);
    inputHex = source.hex;
  }
  hexToRgb(inputHex);
  const ids = targetPaletteIds ?? primaryPaletteIds;
  ids.forEach(requirePalette);
  return { input: hasHex ? hex : { paletteId: sourcePaletteId, code },
    matches: [...new Set(ids)].flatMap(id => nearest(inputHex, palettes[id], 1, includeEffects)),
    distanceMetric: 'CIEDE2000 (ΔE00)', note: MATCH_NOTE };
}
