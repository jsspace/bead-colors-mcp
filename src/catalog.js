import {
  allColors,
  getColor,
  getPalette,
  matchColorAcrossPalettes,
  nearestColors,
  palettes,
  primaryPaletteIds,
} from '@meltbead/bead-colors';

export const MATCH_NOTE = 'HEX and RGB values are approximate screen references, not physical bead measurements. Check the printed code and compare important shades with real beads; transparent and effect finishes may not match faithfully.';

export const paletteIds = Object.keys(palettes);

function requirePalette(id) {
  const palette = getPalette(id);
  if (!palette) throw new RangeError(`Unknown palette: ${id}. Available palettes: ${paletteIds.join(', ')}`);
  return palette;
}

function paletteInfo(palette) {
  return {
    id: palette.id,
    brand: palette.brand,
    series: palette.series,
    beadSizeMm: palette.beadSizeMm,
    colorCount: palette.colors.length,
    source: palette.source,
    notes: palette.notes,
  };
}

export function listPalettes() {
  return { palettes: Object.values(palettes).map(paletteInfo), primaryPaletteIds };
}

export function lookupColor(paletteId, code) {
  const palette = requirePalette(paletteId);
  const color = getColor(paletteId, code);
  if (!color) throw new RangeError(`Color code ${code} was not found in ${paletteId}`);
  return { palette: paletteInfo(palette), color, note: MATCH_NOTE };
}

export function searchColors({ query, paletteId, limit = 20 }) {
  const normalized = query.trim().toLowerCase();
  if (!normalized) throw new RangeError('query must not be empty');
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) throw new RangeError('limit must be between 1 and 100');
  const selectedIds = paletteId ? [requirePalette(paletteId).id] : primaryPaletteIds;
  const results = allColors.filter(color =>
    selectedIds.includes(color.paletteId) &&
    [color.code, color.name, color.hex ?? '', color.brand, color.series].some(value => value.toLowerCase().includes(normalized)),
  );
  return { query, paletteId: paletteId ?? null, total: results.length, colors: results.slice(0, limit), note: MATCH_NOTE };
}

export function findNearestColors({ hex, paletteId, limit = 5, includeEffects = false }) {
  const palette = requirePalette(paletteId);
  const colors = nearestColors(hex, paletteId, { limit, includeEffects });
  return { inputHex: hex.toUpperCase(), palette: paletteInfo(palette), colors, distanceMetric: 'Euclidean RGB distance', note: MATCH_NOTE };
}

export function matchAcrossPalettes({ hex, sourcePaletteId, code, targetPaletteIds, includeEffects = false }) {
  const hasHex = hex !== undefined;
  const hasSource = sourcePaletteId !== undefined || code !== undefined;
  if (hasHex === hasSource || (hasSource && (!sourcePaletteId || !code))) {
    throw new TypeError('Provide either hex or both sourcePaletteId and code');
  }
  if (sourcePaletteId) requirePalette(sourcePaletteId);
  const ids = targetPaletteIds ?? primaryPaletteIds;
  ids.forEach(requirePalette);
  const input = hasHex ? hex : { paletteId: sourcePaletteId, code };
  return {
    input,
    matches: matchColorAcrossPalettes(input, { paletteIds: ids, includeEffects }),
    distanceMetric: 'Euclidean RGB distance',
    note: MATCH_NOTE,
  };
}
