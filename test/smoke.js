import assert from 'node:assert/strict';
import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';

const client = new Client({ name: 'bead-colors-mcp-smoke', version: '0.1.0' });
const transport = new StdioClientTransport({ command: process.execPath, args: ['src/index.js'] });

try {
  await client.connect(transport);
  const { tools } = await client.listTools();
  assert.deepEqual(tools.map(tool => tool.name), [
    'list_palettes', 'get_color', 'search_colors', 'nearest_colors', 'match_across_palettes',
  ]);
  const paletteResult = await client.callTool({ name: 'list_palettes', arguments: {} });
  assert.equal(paletteResult.isError, undefined);
  assert.equal(JSON.parse(paletteResult.content[0].text).palettes.length, 11);
  const matchResult = await client.callTool({ name: 'nearest_colors', arguments: { hex: '#D06134', paletteId: 'perler', limit: 1 } });
  assert.equal(JSON.parse(matchResult.content[0].text).colors[0].code, 'PER17647');
  const invalidResult = await client.callTool({ name: 'get_color', arguments: { paletteId: 'perler', code: 'missing' } });
  assert.equal(invalidResult.isError, true);
  console.log('MCP stdio handshake and tool calls passed');
} finally {
  await client.close();
}
