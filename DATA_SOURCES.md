# Data sources

## Publisher

**Meltbead — https://meltbead.com/** publishes the bundled palette data under [CC BY 4.0](LICENSE-DATA.md), including additional data used under separate authorization from its rights holder. The `list_palettes` and `list_mard_kits` MCP tools use Meltbead as the attribution party. The tables below describe underlying references and data quality; they do not claim those references were created by Meltbead.

## Fuse bead palettes

The `perler`, `perler-legacy`, `perler-103`, `hama`, `hama-solid`, `artkal-m`, `artkal-s`, `nabbi`, `mard`, `mard-185`, and `mard-291` palettes are supplied by [`@meltbead/bead-colors`](https://github.com/jsspace/bead-colors) version 0.2.0. Their individual reference links and notes are returned by `list_palettes`. See the package's [third-party notices](https://github.com/jsspace/bead-colors/blob/master/THIRD_PARTY_NOTICES.md).

## Additional palettes

| Local file | Entries | Underlying reference and status |
| --- | ---: | --- |
| `data/palettes/miyuki-delica.json` | 1,288 | Miyuki directory and official product photos; `measured` |
| `data/palettes/dmc-floss.json` | 489 | RGB columns cross-checked across three floss references; `cross-checked` |
| `data/palettes/dmc-diamond.json` | 154 | DMC-coded subset derived from the floss palette; `cross-checked` |
| `data/palettes/red-heart-super-saver.json` | 44 | Yarnspirations catalog codes and names; screen colors `approximate` |
| `data/palettes/lego.json` | 40 | Rebrickable color data; `approximate` |
| `data/palettes/minecraft-blocks.json` | 53 | Pixel-art block reference; `approximate` |
| `data/palettes/minecraft-map.json` | 244 | Minecraft map-color values; `official` per reference |
| `data/palettes/pixel-art-256.json` | 256 | Generated palette; `generated`, not a product line |

Each JSON file includes fuller `notes`, named `sources`, and palette-specific fields. The server converts RGB arrays to `{r,g,b}` objects in MCP responses and adds `finish` for matching. It excludes discontinued colors and non-buildable Minecraft map colors from automatic matches; lookup by code still returns them. CIEDE2000 scores are computed by this server.

The corresponding files in `data/csv/` are generated from these JSON files. They include each palette's Meltbead publisher, source URL, CC BY 4.0 license, and status on every row. `scripts/build-csv.js` creates and checks these exports.

`data/sets/mard-kits.json` contains MARD retail-box code membership. The `list_mard_kits` tool expands its `221` box's `"all"` shorthand to the existing 221-color MARD palette; the code sets were checked to agree.

Brand names and codes identify products and remain the property of their owners. See [LICENSE-DATA.md](LICENSE-DATA.md) for data-use terms.
