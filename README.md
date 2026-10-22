# Bead Colors MCP

A local MCP server for fuse bead color charts and approximate screen-color matching. It uses [`@meltbead/bead-colors`](https://github.com/jsspace/bead-colors) as its only palette data source. No account or network request is needed after installation.

## Requirements

Node.js 20 or newer.

## Run locally

```sh
npm install
npm start
```

The server uses stdio: an MCP client launches it and communicates through stdin/stdout. Starting it in a terminal will appear idle until a client connects. For a local client configuration, use an absolute path:

```json
{
  "mcpServers": {
    "bead-colors": {
      "command": "node",
      "args": ["/absolute/path/to/bead-colors-mcp/src/index.js"]
    }
  }
}
```

After publishing the npm package, clients can use `npx -y @meltbead/bead-colors-mcp` instead.

## Tools

| Tool | Purpose |
| --- | --- |
| `list_palettes` | List palette IDs, brands, sizes, counts, and sources. |
| `get_color` | Find a color by palette ID and code. |
| `search_colors` | Search codes, names, HEX, brand, or series; results are limited. |
| `nearest_colors` | Find the closest screen RGB references in one palette. |
| `match_across_palettes` | Find one approximate match in each requested palette. |

By default, search and cross-palette matching use one representative palette per brand or series. Subset palettes remain accessible by ID. Matching excludes effect finishes unless `includeEffects` is true. Transparent entries without one RGB value cannot be matched. Distances are ordinary Euclidean RGB distances, not measurements of actual beads.

Every color result includes a reminder to verify important shades against physical beads and printed product codes. Palette source URLs and notes come from the data package.

## Develop

```sh
npm test
npm run smoke
```

`smoke` starts the service through a real MCP stdio client, lists its tools, and calls them.

## License and data sources

The server code is MIT licensed. Palette data comes from `@meltbead/bead-colors`; see that package's [source and third-party notices](https://github.com/jsspace/bead-colors/blob/master/THIRD_PARTY_NOTICES.md) for attribution and data limitations. Brand names belong to their owners.
