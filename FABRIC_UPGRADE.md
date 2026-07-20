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
- Undo and redo state restoration
- Registered SVG path rendering
- Flip, rotation, and crop geometry
- Filter application, rendered pixels, and filter removal

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
3. Keep the core production bundle green with `npm run build:prod --workspace @parteekmalik/tui-image-editor`.
4. Test the editor UI manually in Brezel before publishing.
5. Publish and integrate the new editor version before proceeding to the next Fabric major.

The type test currently uses TypeScript 3.9 and cannot parse current transitive type declarations. This baseline issue predates the browser suite and should be fixed separately rather than bypassed during a Fabric upgrade.
