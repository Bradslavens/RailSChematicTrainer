# Schematic JSON format

Each schematic is one `.json` file. It is the single source of truth: the app draws
the blank vector diagram **and** places the interactive markers from these same
coordinates, so hotspots always line up with the drawn lines.

## Shape

```jsonc
{
  "name": "La Mesa Branch (Milepost 11–13)",   // human-readable schematic name
  "viewBox": [0, 0, 800, 1000],                 // SVG coordinate space: [minX, minY, width, height]
  "tracks": [
    {
      "id": "main",                             // unique within this file
      "color": "#1f6feb",
      "polyline": [[400, 40], [400, 960]]       // ordered [x, y] points the line is drawn through
    }
  ],
  "points": [
    {
      "type": "signal",                         // signal | station | crossing | milepost | ss
      "label": "E18LA",                         // the answer the learner must recall
      "x": 345, "y": 95,                        // hotspot center, in viewBox coordinates
      "track": "main",                          // optional: which track it belongs to
      "order": 1                                 // optional: position along the track (for "Run the Line")
    },
    { "type": "station",  "label": "La Mesa Blvd",   "x": 430, "y": 255, "track": "main", "order": 2 },
    { "type": "crossing", "label": "University Ave", "x": 200, "y": 173, "track": "main", "order": 3 },
    { "type": "milepost", "label": "13", "x": 590, "y": 145 }
  ]
}
```

## Rules

- `viewBox` defines the coordinate system; all `x`/`y` and `polyline` values are in it.
- `type` is one of: `signal`, `station`, `crossing`, `milepost`, `ss`.
- `label` is required for everything except (optionally) `ss` markers.
- `track` and `order` are optional but required for the "Run the Line" sequence game.
- Coordinates are plain numbers (not normalized) for easy hand-authoring; the renderer
  scales the whole `viewBox` to fit the screen.

The server validates uploaded files against this schema and rejects anything malformed.
