import test from 'node:test';
import assert from 'node:assert/strict';
import { findNearestColors, listPalettes, lookupColor, matchAcrossPalettes, searchColors } from '../src/catalog.js';

test('lists published palettes and source metadata', () => {
  const result = listPalettes();
  assert.equal(result.palettes.length, 11);
  assert.equal(result.palettes.find(p => p.id === 'perler').colorCount, 118);
  assert.ok(result.palettes.find(p => p.id === 'perler').source.length);
});

test('looks up a code case-insensitively and reports absent codes', () => {
  assert.equal(lookupColor('perler', 'per17647').color.code, 'PER17647');
  assert.throws(() => lookupColor('perler', 'missing'), /not found/);
});

test('searches representative palettes by default and caps results', () => {
  const result = searchColors({ query: 'white', limit: 2 });
  assert.equal(result.colors.length, 2);
  assert.ok(result.total >= 2);
  assert.ok(result.colors.every(color => typeof color.code === 'string'));
  assert.throws(() => searchColors({ query: '  ' }), /empty/);
});

test('matches RGB references and handles transparent source colors', () => {
  assert.equal(findNearestColors({ hex: '#D06134', paletteId: 'perler', limit: 1 }).colors[0].code, 'PER17647');
  const result = matchAcrossPalettes({ sourcePaletteId: 'perler', code: 'PER17647', targetPaletteIds: ['hama', 'artkal-m'] });
  assert.deepEqual(result.matches.map(match => match.paletteId), ['hama', 'artkal-m']);
  assert.throws(() => matchAcrossPalettes({ sourcePaletteId: 'artkal-m', code: 'MH1' }), /no single HEX/);
  assert.throws(() => matchAcrossPalettes({ hex: '#FFFFFF', code: 'PER17647' }), /either hex/);
});
