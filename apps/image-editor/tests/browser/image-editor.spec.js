/* eslint-disable jest/no-done-callback */
const { test, expect } = require('@playwright/test');

async function openEditor(page) {
  await page.goto('/fixture.html');
  await page.evaluate(() => window.ready);
}

function getExport(page) {
  return page.evaluate(async () => {
    const image = new Image();
    image.src = window.editor.toDataURL();
    await image.decode();

    const canvas = document.createElement('canvas');
    canvas.width = image.naturalWidth;
    canvas.height = image.naturalHeight;
    const context = canvas.getContext('2d');
    context.drawImage(image, 0, 0);

    const pixel = (x, y) => Array.from(context.getImageData(x, y, 1, 1).data);

    return {
      width: canvas.width,
      height: canvas.height,
      topLeft: pixel(5, 5),
      topRight: pixel(canvas.width - 6, 5),
      bottomLeft: pixel(5, canvas.height - 6),
      bottomRight: pixel(canvas.width - 6, canvas.height - 6),
    };
  });
}

test.beforeEach(async ({ page }) => {
  await openEditor(page);
});

test('loads and exports pixels using the real browser canvas', async ({ page }) => {
  await expect(page.locator('canvas.lower-canvas')).toBeVisible();
  await expect(page.locator('canvas.upper-canvas')).toBeVisible();

  expect(await page.evaluate(() => window.editor.getCanvasSize())).toEqual({
    width: 80,
    height: 60,
  });
  expect(await getExport(page)).toEqual({
    width: 80,
    height: 60,
    topLeft: [255, 0, 0, 255],
    topRight: [0, 255, 0, 255],
    bottomLeft: [0, 0, 255, 255],
    bottomRight: [255, 255, 0, 255],
  });
});

test('creates and mutates Fabric-backed shapes and text', async ({ page }) => {
  const properties = await page.evaluate(async () => {
    const shape = await window.editor.addShape('rect', {
      left: 20,
      top: 15,
      width: 24,
      height: 16,
      fill: '#ff00ff',
      stroke: '#000000',
      strokeWidth: 2,
    });
    await window.editor.setObjectProperties(shape.id, { left: 30, top: 20, angle: 25 });

    const text = await window.editor.addText('Fabric baseline', {
      position: { x: 10, y: 10 },
      styles: { fill: '#ffffff', fontFamily: 'sans-serif', fontSize: 12 },
      autofocus: false,
    });
    await window.editor.changeText(text.id, 'Updated');
    await window.editor.changeTextStyle(text.id, { fontStyle: 'italic' });

    return {
      shape: window.editor.getObjectProperties(shape.id, [
        'type',
        'left',
        'top',
        'angle',
        'fill',
        'stroke',
      ]),
      text: window.editor.getObjectProperties(text.id, [
        'type',
        'text',
        'fill',
        'fontFamily',
        'fontSize',
        'fontStyle',
        'width',
        'height',
      ]),
    };
  });

  expect(properties.shape).toEqual({
    type: 'rect',
    left: 30,
    top: 20,
    angle: 25,
    fill: '#ff00ff',
    stroke: '#000000',
  });
  expect(properties.text).toMatchObject({
    type: 'i-text',
    text: 'Updated',
    fill: '#ffffff',
    fontFamily: 'sans-serif',
    fontSize: 12,
    fontStyle: 'italic',
  });
  expect(properties.text.width).toBeGreaterThan(0);
  expect(properties.text.height).toBeGreaterThan(0);
});

test('restores Fabric object state through undo and redo', async ({ page }) => {
  const states = await page.evaluate(async () => {
    const shape = await window.editor.addShape('rect', {
      left: 10,
      top: 10,
      width: 20,
      height: 20,
      fill: '#ff00ff',
    });
    await window.editor.setObjectProperties(shape.id, { left: 35, angle: 45 });
    const changed = window.editor.getObjectProperties(shape.id, ['left', 'angle']);
    await window.editor.undo();
    const undone = window.editor.getObjectProperties(shape.id, ['left', 'angle']);
    await window.editor.redo();
    const redone = window.editor.getObjectProperties(shape.id, ['left', 'angle']);

    return { changed, undone, redone };
  });

  expect(states.changed).toEqual({ left: 35, angle: 45 });
  expect(states.undone).toEqual({ left: 10, angle: 0 });
  expect(states.redone).toEqual(states.changed);
});

test('renders a registered SVG path as a Fabric icon', async ({ page }) => {
  const icon = await page.evaluate(async () => {
    window.editor.registerIcons({ baselineTriangle: 'M 0 20 L 10 0 L 20 20 z' });
    const added = await window.editor.addIcon('baselineTriangle', {
      left: 40,
      top: 30,
      fill: '#00ffff',
    });

    return window.editor.getObjectProperties(added.id, [
      'type',
      'left',
      'top',
      'fill',
      'width',
      'height',
    ]);
  });

  expect(icon).toMatchObject({
    type: 'icon',
    left: 40,
    top: 30,
    fill: '#00ffff',
  });
  expect(icon.width).toBeGreaterThan(0);
  expect(icon.height).toBeGreaterThan(0);
});

test('rotates, flips, and crops with deterministic output geometry', async ({ page }) => {
  const transforms = await page.evaluate(async () => {
    const flipped = await window.editor.flipX();
    const reset = await window.editor.resetFlip();
    const rotated = await window.editor.rotate(90);
    const rotatedSize = window.editor.getCanvasSize();
    await window.editor.crop({ left: 0, top: 0, width: 30, height: 40 });

    return {
      flipped,
      reset,
      rotated,
      rotatedSize,
      croppedSize: window.editor.getCanvasSize(),
    };
  });

  expect(transforms.flipped).toMatchObject({ flipX: true, flipY: false });
  expect(transforms.reset).toMatchObject({ flipX: false, flipY: false });
  expect(transforms.rotated).toBe(90);
  expect(transforms.rotatedSize).toEqual({ width: 80, height: 60 });
  expect(transforms.croppedSize).toEqual({ width: 30, height: 40 });

  const exported = await getExport(page);
  expect(exported.width).toBe(30);
  expect(exported.height).toBe(40);
});

test('applies and removes a filter in the browser', async ({ page }) => {
  const filtered = await page.evaluate(async () => {
    await window.editor.applyFilter('Grayscale');

    return window.editor.hasFilter('Grayscale');
  });
  expect(filtered).toBe(true);

  const filteredExport = await getExport(page);
  expect(filteredExport.topLeft[0]).toBe(filteredExport.topLeft[1]);
  expect(filteredExport.topLeft[1]).toBe(filteredExport.topLeft[2]);

  const removed = await page.evaluate(async () => {
    await window.editor.removeFilter('Grayscale');

    return window.editor.hasFilter('Grayscale');
  });
  expect(removed).toBe(false);
  expect((await getExport(page)).topLeft).toEqual([255, 0, 0, 255]);
});
