# Craft Colors MCP

A local MCP server for craft color charts and approximate screen-color matching. It combines the existing [`@meltbead/bead-colors`](https://github.com/jsspace/bead-colors) fuse bead references with eight locally bundled palettes distributed by [Meltbead](https://meltbead.com/) under direct authorization. No account or network request is needed after installation.

## Requirements

Node.js 20 or newer.

## Install from npm

```sh
npx -y @meltbead/bead-colors-mcp
```

The server uses stdio: an MCP client launches it and communicates through stdin/stdout. Starting it in a terminal will appear idle until a client connects. Add this configuration to an MCP client:

```json
{
  "mcpServers": {
    "bead-colors": {
      "command": "npx",
      "args": ["-y", "@meltbead/bead-colors-mcp"]
    }
  }
}
```

Package: [@meltbead/bead-colors-mcp on npm](https://www.npmjs.com/package/@meltbead/bead-colors-mcp).

## Tools

| Tool | Purpose |
| --- | --- |
| `list_palettes` | List palette IDs, materials, counts, data origins, licenses, status, and sources. |
| `list_mard_kits` | List MARD retail-box sizes and their included codes; optionally filter by box size. |
| `get_color` | Find a color by palette ID and code. |
| `search_colors` | Search codes, names, HEX, brand, or series; results are limited. |
| `nearest_colors` | Find the closest screen references in one palette by CIEDE2000 (ΔE00). |
| `match_across_palettes` | Find one approximate match in each requested palette. |

The service exposes 19 palettes: 11 existing fuse bead palettes plus Miyuki Delica, DMC floss, DMC-coded diamond drills, Red Heart yarn, LEGO, Minecraft blocks, Minecraft map colors, and a generated pixel-art palette. Search and cross-palette matching use representative palettes by default; subset palettes and the generated palette remain accessible by ID. Matching excludes effect finishes unless `includeEffects` is true. Discontinued Delica colors and unbuildable Minecraft map colors are excluded from automatic matches but remain available by code. Transparent entries without one RGB value cannot be matched.

The eight bundled palettes are available as JSON in [`data/palettes/`](data/palettes/) and CSV in [`data/csv/`](data/csv/). MARD retail-box membership is also available as [`data/csv/mard-kits.csv`](data/csv/mard-kits.csv). CSV rows include Meltbead attribution, source URL, license, and status. Run `npm run build:csv` after editing JSON, then `npm run check:csv` to verify the exports.

The matching score is CIEDE2000 (`deltaE`), calculated from each palette's sRGB screen reference. Smaller scores mean closer screen colors. They are not physical measurements or guarantees of material equivalence. `get_color` accepts case-insensitive codes and common separators; Delica codes also accept shorthand such as `DB10`, `DB-010`, and `10` for `DB0010`.

Every color result includes a reminder to verify important shades against physical materials and printed product codes. Palette metadata includes the original data source and its status where supplied.

## Develop

```sh
npm install
npm start
npm test
npm run smoke
```

`npm start` runs the local source server. `smoke` starts it through a real MCP stdio client, lists its tools, and calls them.

## License and data sources

The server code is MIT licensed. The files in `data/` are published under [CC BY 4.0](LICENSE-DATA.md), with **[Meltbead](https://meltbead.com/)** as the attribution party. Suggested credit: `Color data: Meltbead (https://meltbead.com/)`. The additional palettes and MARD retail-box data are distributed under separate authorization from their rights holder. Underlying references and quality notes are in [`data/palettes/`](data/palettes/) and [`DATA_SOURCES.md`](DATA_SOURCES.md). The existing `@meltbead/bead-colors` dependency retains its [third-party notices](https://github.com/jsspace/bead-colors/blob/master/THIRD_PARTY_NOTICES.md). Brand names belong to their owners.
