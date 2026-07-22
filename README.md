# TOAST UI Image Editor - Fabric 7 fork

This repository is a maintained fork of
[`nhn/tui.image-editor`](https://github.com/nhn/tui.image-editor). It keeps the original TOAST UI
Image Editor API and UI while updating its rendering engine from Fabric 4 to Fabric 7 and adding
image-editing tools developed for this fork.

This fork is published separately from the upstream `tui-image-editor` package. Replace
`your-tui-image-editor-package` in the examples below with the current published package name. The
authoritative name is also available in [`apps/image-editor/package.json`](./apps/image-editor/package.json).

- [Original project](https://github.com/nhn/tui.image-editor)
- [Original documentation](https://github.com/nhn/tui.image-editor/tree/master/docs)
- [Fabric migration notes](./FABRIC_UPGRADE.md)

## Installation

```sh
npm install your-tui-image-editor-package
```

```js
import ImageEditor from 'your-tui-image-editor-package';
import 'your-tui-image-editor-package/dist/tui-image-editor.css';

const editor = new ImageEditor('#image-editor', {
  cssMaxWidth: 900,
  cssMaxHeight: 700,
  usageStatistics: false,
});
```

The published entry point is the browser-ready `dist/tui-image-editor.js` bundle. Fabric is embedded
in that file, so applications using the package root do not install or resolve Fabric separately.
The package requires Node.js 20 or newer for installation and development.

## Fork Changes

### Fabric 7

The rendering engine has been migrated in stages from Fabric 4 through Fabric 5 and 6 to
`fabric@7.4.0`. The migration preserves the editor's existing origins, selection behavior, object
stacking, pointer interactions, filters, brushes, undo/redo behavior, and Promise-based public API.

Fabric is a development dependency of this package because Webpack includes it in the published UMD
bundle. Import the package root shown above. Direct imports from the published `src/` directory are
not a supported consumer entry point and require the source dependencies to be installed separately.

### Copy Stamp

The `copyStamp` menu clones pixels from one part of the canvas and paints them elsewhere. It is
included in the default UI menu list and has a brush-size range from 1 to 350 pixels.

```js
const editor = new ImageEditor('#image-editor', {
  includeUI: {
    menu: ['crop', 'draw', 'filter', 'copyStamp'],
    initMenu: 'copyStamp',
  },
});
```

Copy-stamp controls:

1. Open **Copy Stamp** and select the brush size.
2. Ctrl-click on Windows/Linux or Command-click on macOS to select the source point.
3. Click and drag at the destination to paint cloned pixels.

The existing drawing-mode API can also activate it programmatically:

```js
editor.startDrawingMode('COPY_STAMP', { width: 50 });
editor.setBrush({ width: 80 });
editor.stopDrawingMode();
```

No separate `copyStamp()` public method was added. The feature intentionally uses the existing
`startDrawingMode`, `setBrush`, and `stopDrawingMode` APIs.

### Draw Opacity

The Draw submenu has an opacity control in addition to color and brush width. Its range is 0 to 1,
with a default of 0.9. Changes apply immediately to free-drawing and line brushes. The maximum draw
brush width is 300 pixels in this fork.

This is a UI extension rather than a new public function. Programmatic callers can continue to pass
an alpha channel in the brush color through the existing drawing API.

```js
editor.startDrawingMode('FREE_DRAWING', {
  width: 20,
  color: 'rgba(255, 0, 0, 0.5)',
});
```

### Additional Filters

The fork adds Contrast, Saturation, and per-channel Gamma controls to the Filter submenu. They also
work through the existing `applyFilter`, `removeFilter`, and `hasFilter` functions.

```js
await editor.applyFilter('contrast', { contrast: 0.25 });
await editor.applyFilter('saturation', { saturation: 0.4 });
await editor.applyFilter('gamma', {
  gammaR: 1.1,
  gammaG: 1.0,
  gammaB: 0.9,
});

editor.hasFilter('gamma');
await editor.removeFilter('gamma');
```

Filter value ranges:

| Filter     | Options                      | Range              | Default |
| ---------- | ---------------------------- | ------------------ | ------- |
| Contrast   | `contrast`                   | -1 to 1            | 0       |
| Saturation | `saturation`                 | -1 to 1            | 0       |
| Gamma      | `gammaR`, `gammaG`, `gammaB` | 0 to 2 per channel | 1       |

The Noise control's maximum value is 200 in this fork.

### Other Fork Adjustments

- `copyStamp` is part of the default full-UI menu list and has icons for all bundled themes.
- `undo()` and `redo()` correctly expose their optional iteration count in the TypeScript types.
- SVG generation and package naming were adjusted for the scoped fork package.
- Real-browser regression coverage exercises canvas pixels, filters, object manipulation, keyboard,
  pointer, touch, and full-UI workflows.

## Core Features

- Load and export images
- Crop, resize, rotate, and flip
- Undo and redo
- Free drawing, line drawing, and copy stamp
- Shapes, icons, and text
- Mask and image filters
- Configurable full UI and themes

The original tutorials and API reference remain applicable except where this README documents fork
behavior. See the
[`apps/image-editor` documentation](./apps/image-editor/README.md) for the original setup examples.

## Development

```sh
npm ci --omit=optional
npm test --workspace apps/image-editor -- --runInBand
npm run test:types --workspace apps/image-editor
npm run test:browser
npm run build:prod --workspace apps/image-editor
npm run test:package-install --workspace apps/image-editor
```

The package-install test packs the release artifact, performs a normal isolated consumer install,
and fails if the install emits a deprecation warning or installs Fabric for the consumer.

## Attribution and License

TOAST UI Image Editor was created by NHN Cloud and contributors. The additional functionality
described above is maintained by this fork's contributors.

Released under the [MIT License](./LICENSE).
