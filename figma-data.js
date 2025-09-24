// Provide your Figma JSON root node here as a JavaScript object assigned to window.FIGMA_DATA.
// Example structure (replace with your real data):
// window.FIGMA_DATA = {
//   type: 'FRAME',
//   name: 'iPhone Frame',
//   width: 390,
//   height: 844,
//   fills: [{ type: 'SOLID', color: { r: 1, g: 1, b: 1, a: 1 } }],
//   children: [
//     { type: 'RECTANGLE', name: 'Header', x: 0, y: 0, width: 390, height: 88, fills: [{ type: 'SOLID', color: { r: 0.96, g: 0.96, b: 0.98, a: 1 } }] },
//     { type: 'TEXT', name: 'Title', x: 24, y: 44, width: 200, height: 28, characters: 'Hello', style: { fontSize: 22, fontWeight: 600 }, fills: [{ type: 'SOLID', color: { r: 0.07, g: 0.07, b: 0.07, a: 1 } }] }
//   ]
// };

// Paste your actual data below
window.FIGMA_DATA = window.FIGMA_DATA || null;

// Map Figma imageHash values to local asset URLs if your design uses image fills
// Example:
// window.IMAGE_MAP = {
//   'a1b2c3d4': './assets/hero.jpg'
// };
window.IMAGE_MAP = window.IMAGE_MAP || {};

