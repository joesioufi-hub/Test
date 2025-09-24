Figma JSON Renderer (Static)

How to use

1. Open `figma-data.js` and assign your Figma JSON root node to `window.FIGMA_DATA`.
   - The root node should generally be a `FRAME` (e.g., your iPhone frame) and contain `children`.
   - If your design uses image fills with `imageHash`, add entries to `window.IMAGE_MAP` that map those hashes to image URLs under `./assets` or remote URLs.
2. Open `index.html` in a browser, or serve the folder with any static server.

Notes

- Supported node types: `FRAME`, `GROUP`, `RECTANGLE`, `TEXT`, `INSTANCE`, `VECTOR` (basic support).
- Styles: fills (SOLID, IMAGE via mapping, basic linear gradient), strokes, corner radii, opacity, rotation, clipping, text styles (font size, weight, line height, alignment, color via fills).
- Positioning uses `absoluteBoundingBox` when available; otherwise `x`, `y`, `width`, `height`.
- Viewport size is set from the root node; fallback is 390×844.

Quick local server (optional)

```
python3 -m http.server 5173
# then open http://localhost:5173
```

Troubleshooting

- If nothing appears, ensure `window.FIGMA_DATA` is set in `figma-data.js`.
- For missing images, add mappings to `window.IMAGE_MAP` using the paint's `imageHash` as the key.
- Check the DevTools console for warnings.

