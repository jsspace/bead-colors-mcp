#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import {
  findNearestColors,
  listMardKits,
  listPalettes,
  lookupColor,
  matchAcrossPalettes,
  searchColors,
} from './catalog.js';

const hexSchema = z.string().regex(/^#[0-9a-fA-F]{6}$/, 'Use a six-digit HEX value such as #E8A0B0');
const paletteIdSchema = z.string().min(1).describe('Palette ID from list_palettes, such as perler or artkal-m');

function result(action) {
  try {
    const data = action();
    return { content: [{ type: 'text', text: JSON.stringify(data) }], structuredContent: data };
  } catch (error) {
    return { content: [{ type: 'text', text: error instanceof Error ? error.message : String(error) }], isError: true };
  }
}

export function createServer() {
  const server = new McpServer({ name: 'bead-colors-mcp', version: '0.1.0' });

  server.registerTool('list_palettes', {
    description: 'List craft color palettes with counts, source links, license, and data confidence status.',
    inputSchema: z.object({}),
  }, async () => result(listPalettes));

  server.registerTool('list_mard_kits', {
    description: 'List MARD retail box sizes and the exact bead codes included in each box; optionally select one size.',
    inputSchema: z.object({ size: z.number().int().positive().optional() }),
  }, async ({ size }) => result(() => listMardKits(size)));

  server.registerTool('get_color', {
    description: 'Look up one craft color by palette ID and product code. Accepts common code separators and Delica shorthand.',
    inputSchema: z.object({ paletteId: paletteIdSchema, code: z.string().min(1) }),
  }, async ({ paletteId, code }) => result(() => lookupColor(paletteId, code)));

  server.registerTool('search_colors', {
    description: 'Search codes, names, HEX values, brands, or series. Without paletteId, searches representative palettes to avoid subset duplicates.',
    inputSchema: z.object({
      query: z.string().trim().min(1),
      paletteId: paletteIdSchema.optional(),
      limit: z.number().int().min(1).max(100).default(20),
    }),
  }, async (args) => result(() => searchColors(args)));

  server.registerTool('nearest_colors', {
    description: 'Find nearest screen reference colors in one palette by CIEDE2000 (ΔE00). Excludes effect finishes by default.',
    inputSchema: z.object({
      hex: hexSchema,
      paletteId: paletteIdSchema,
      limit: z.number().int().min(1).max(20).default(5),
      includeEffects: z.boolean().default(false),
    }),
  }, async (args) => result(() => findNearestColors(args)));

  server.registerTool('match_across_palettes', {
    description: 'Find one approximate screen-color match per selected craft palette, starting from HEX or a product code. Uses CIEDE2000 (ΔE00).',
    inputSchema: z.object({
      hex: hexSchema.optional(),
      sourcePaletteId: paletteIdSchema.optional(),
      code: z.string().min(1).optional(),
      targetPaletteIds: z.array(paletteIdSchema).min(1).max(19).optional(),
      includeEffects: z.boolean().default(false),
    }),
  }, async (args) => result(() => matchAcrossPalettes(args)));

  return server;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  serveStdio(createServer);
}
