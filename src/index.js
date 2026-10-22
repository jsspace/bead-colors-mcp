#!/usr/bin/env node
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';
import {
  findNearestColors,
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
    description: 'List available fuse bead palettes, brand, series, bead size, entry count, and source links.',
    inputSchema: z.object({}),
  }, async () => result(listPalettes));

  server.registerTool('get_color', {
    description: 'Look up one fuse bead by palette ID and printed code. Includes approximate HEX/RGB and finish.',
    inputSchema: z.object({ paletteId: paletteIdSchema, code: z.string().min(1) }),
  }, async ({ paletteId, code }) => result(() => lookupColor(paletteId, code)));

  server.registerTool('search_colors', {
    description: 'Search color codes, names, HEX values, brands, or series. Without paletteId, searches representative palettes only to avoid subset duplicates.',
    inputSchema: z.object({
      query: z.string().trim().min(1),
      paletteId: paletteIdSchema.optional(),
      limit: z.number().int().min(1).max(100).default(20),
    }),
  }, async (args) => result(() => searchColors(args)));

  server.registerTool('nearest_colors', {
    description: 'Find the nearest approximate RGB screen colors in one palette. Excludes effect and transparent finishes by default.',
    inputSchema: z.object({
      hex: hexSchema,
      paletteId: paletteIdSchema,
      limit: z.number().int().min(1).max(20).default(5),
      includeEffects: z.boolean().default(false),
    }),
  }, async (args) => result(() => findNearestColors(args)));

  server.registerTool('match_across_palettes', {
    description: 'Find one approximate screen-color match per selected palette, starting from a HEX value or an existing bead code.',
    inputSchema: z.object({
      hex: hexSchema.optional(),
      sourcePaletteId: paletteIdSchema.optional(),
      code: z.string().min(1).optional(),
      targetPaletteIds: z.array(paletteIdSchema).min(1).max(11).optional(),
      includeEffects: z.boolean().default(false),
    }),
  }, async (args) => result(() => matchAcrossPalettes(args)));

  return server;
}

if (process.argv[1] && import.meta.url === new URL(`file://${process.argv[1]}`).href) {
  serveStdio(createServer);
}
