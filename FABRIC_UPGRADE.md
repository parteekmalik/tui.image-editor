# Fabric upgrade

Upgrade Fabric one major version at a time. Keep the browser suite green before starting the next major.

## Upgrade guides

- [Fabric 5 breaking changes](https://fabricjs.com/docs/old-docs/v5-breaking-changes/)
- [Upgrade to Fabric 6](https://fabricjs.com/docs/upgrading/upgrading-to-fabric-60/)
- [Upgrade to Fabric 7](https://fabricjs.com/docs/upgrading/upgrading-to-fabric-70/)

## Browser baseline

Install Chromium once, then run the browser suite:

```sh
npx playwright install chromium
npm run test:browser
```

The suite exercises the installed Fabric version in a real browser and verifies:

- Image loading, canvas creation, PNG export, dimensions, and pixel colors
- Shape and text creation and mutation
- Pointer-driven selection, movement, resizing, and rotation
- Inline text editing through browser keyboard input
- Free drawing through browser pointer input
- Undo and redo state restoration
- Registered SVG path rendering
- Flip, rotation, and crop geometry
- Filter application, rendered pixels, and filter removal
- Full-UI menu switching, local file loading, and rendered image output
- Menu and object selection in a mobile touch viewport

The fixture is local and deterministic. It does not use remote images, CDN scripts, or mocked canvas rendering.

The legacy Jest suite uses `jest-canvas-mock` and should be installed without Fabric's optional native Canvas dependency:

```sh
npm ci --omit=optional
npm test --workspace @parteekmalik/tui-image-editor -- --runInBand
```

## Acceptance gate

For each Fabric major:

1. Follow only that major's upgrade guide.
2. Keep `npm run test:browser` green.
3. Keep `npm run test:types --workspace @parteekmalik/tui-image-editor` green.
4. Keep the core production bundle green with `npm run build:prod --workspace @parteekmalik/tui-image-editor`.
5. Test the editor UI manually in Brezel before publishing.
6. Publish and integrate the new editor version before proceeding to the next Fabric major.

## Fabric 5 status

The core image editor is upgraded to Fabric 5.5.2. The migration replaces the removed
`target` property on selection events with `selected[0]` and accepts Fabric 5's updated
serialized text defaults.

## Fabric 6 status

The core image editor is upgraded to Fabric 6.9.1. The migration uses Fabric's named
module exports, native classes for custom objects and filters, Promise-based loading and
cloning, explicit free-drawing brushes, and the new pointer, stack, selection, and group
APIs. The editor keeps its existing lowercase public object types while Fabric uses its
new internal class names. Jest, browser, type, lint, format, and production build checks
pass. Manual Brezel validation and publishing remain before starting Fabric 7.

## Fabric 7 status

The core image editor is upgraded to Fabric 7.4.0 and now requires Node 20 or newer.
The migration preserves the editor's left/top positioning, primary-click behavior, and
legacy object stacking defaults, replaces the removed point rotation helper, and moves
all GitHub workflows to Node 22 and the current GitHub Actions runtime. The obsolete
external Selenium runtime-error workflow is replaced by the maintained Playwright gate.
Jest, browser, type, lint, format, and production build checks pass. Manual Brezel
validation remains before publishing.
