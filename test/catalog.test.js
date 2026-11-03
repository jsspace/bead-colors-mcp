import test from 'node:test';
import assert from 'node:assert/strict';
import { findNearestColors, listMardKits, listPalettes, lookupColor, matchAcrossPalettes, searchColors } from '../src/catalog.js';
import { deltaE2000 } from '../src/color-distance.js';

test('lists published palettes and source metadata', () => {
  const result = listPalettes();
  assert.equal(result.palettes.length, 19);
  assert.equal(result.palettes.find(p => p.id === 'perler').colorCount, 118);
  assert.ok(result.palettes.find(p => p.id === 'perler').source.length);
  const dmc = result.palettes.find(p => p.id === 'dmc-floss');
  assert.equal(dmc.colorCount, 489);
  assert.equal(dmc.status, 'cross-checked');
  assert.equal(dmc.license, 'CC-BY-4.0');
  assert.deepEqual(dmc.source, ['https://meltbead.com/']);
  assert.equal(dmc.origin, 'Meltbead');
  assert.ok(dmc.references.some(item => item.url.includes('maxxmint')));
});

test('looks up a code case-insensitively and reports absent codes', () => {
  assert.equal(lookupColor('perler', 'per17647').color.code, 'PER17647');
  assert.equal(lookupColor('miyuki-delica', 'DB-010').color.code, 'DB0010');
  assert.equal(lookupColor('miyuki-delica', '10').color.code, 'DB0010');
  assert.throws(() => lookupColor('perler', 'missing'), /not found/);
});

test('searches representative palettes by default and caps results', () => {
  const result = searchColors({ query: 'white', limit: 2 });
  assert.equal(result.colors.length, 2);
  assert.ok(result.total >= 2);
  assert.ok(result.colors.every(color => typeof color.code === 'string'));
  assert.ok(result.colors.every(color => color.dataSourceUrl === 'https://meltbead.com/'));
  assert.ok(searchColors({ query: 'Rose Dark' }).colors.some(color => color.paletteId === 'dmc-floss'));
  assert.throws(() => searchColors({ query: '  ' }), /empty/);
});

test('matches perceptual screen references and handles transparent source colors', () => {
  assert.equal(findNearestColors({ hex: '#D06134', paletteId: 'perler', limit: 1 }).colors[0].code, 'PER17647');
  const result = matchAcrossPalettes({ sourcePaletteId: 'perler', code: 'PER17647', targetPaletteIds: ['hama', 'artkal-m'] });
  assert.deepEqual(result.matches.map(match => match.paletteId), ['hama', 'artkal-m']);
  assert.ok(result.matches.every(match => Number.isFinite(match.deltaE)));
  assert.throws(() => matchAcrossPalettes({ sourcePaletteId: 'artkal-m', code: 'MH1' }), /no single HEX/);
  assert.throws(() => matchAcrossPalettes({ hex: '#FFFFFF', code: 'PER17647' }), /either hex/);
});

test('CIEDE2000 agrees with published Sharma test pairs', () => {
  // Sharma, Wu & Dalal (2005), pairs 1, 2, 9 and 25.
  const pairs = [
    [[50, 2.6772, -79.7751], [50, 0, -82.7485], 2.0425],
    [[50, 3.1571, -77.2803], [50, 0, -82.7485], 2.8615],
    [[50, 2.49, -0.001], [50, -2.49, 0.0009], 7.1792],
    [[60.2574, -34.0099, 36.2677], [60.4626, -34.1751, 39.4387], 1.2644],
  ];
  for (const [a, b, expected] of pairs) assert.ok(Math.abs(deltaE2000(a, b) - expected) < 0.0001);
});

test('MARD retail box codes agree with their declared size', () => {
  const kits = listMardKits();
  assert.ok(kits.sets.length > 0);
  assert.ok(kits.sets.every(set => set.codes.length === set.size));
  assert.equal(listMardKits(24).sets[0].codes.length, 24);
});
