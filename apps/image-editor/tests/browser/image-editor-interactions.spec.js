/* eslint-disable jest/no-done-callback */
const { test, expect } = require('@playwright/test');

async function openEditor(page) {
  await page.goto('/fixture.html');
  await page.evaluate(() => window.ready);
}

test.beforeEach(async ({ page }) => {
  await openEditor(page);
});

test('selects, moves, scales, and rotates an object with pointer input', async ({ page }) => {
  const id = await page.evaluate(async () => {
    const shape = await window.editor.addShape('rect', {
      left: 40,
      top: 52,
      width: 20,
      height: 12,
      fill: '#ff00ff',
    });
    window.editor.discardSelection();

    return shape.id;
  });

  let controls = await page.evaluate((objectId) => window.getObjectControls(objectId), id);
  await page.mouse.move(controls.center.x, controls.center.y);
  await page.mouse.down();
  await page.mouse.move(controls.center.x + 8, controls.center.y + 1, { steps: 5 });
  await page.mouse.up();

  const moved = await page.evaluate((objectId) => {
    return window.editor.getObjectProperties(objectId, ['left', 'top']);
  }, id);
  expect(moved.left).toBeGreaterThan(40);
  expect(moved.top).toBeGreaterThan(52);

  controls = await page.evaluate((objectId) => window.getObjectControls(objectId), id);
  await page.mouse.click(controls.center.x, controls.center.y);
  controls = await page.evaluate((objectId) => window.getObjectControls(objectId), id);
  await page.mouse.move(controls.middleRight.x, controls.middleRight.y);
  await page.mouse.down();
  await page.mouse.move(controls.middleRight.x + 8, controls.middleRight.y, { steps: 5 });
  await page.mouse.up();

  const scaled = await page.evaluate((objectId) => {
    return window.editor.getObjectProperties(objectId, ['width', 'height']);
  }, id);
  expect(scaled.width).toBeGreaterThan(20);
  expect(scaled.height).toBe(12);

  controls = await page.evaluate((objectId) => window.getObjectControls(objectId), id);
  await page.mouse.click(controls.center.x, controls.center.y);
  controls = await page.evaluate((objectId) => window.getObjectControls(objectId), id);
  await page.mouse.move(controls.rotation.x, controls.rotation.y);
  await page.mouse.down();
  await page.mouse.move(controls.center.x + 12, controls.center.y, { steps: 8 });
  await page.mouse.up();

  const rotated = await page.evaluate((objectId) => {
    return window.editor.getObjectProperties(objectId, ['angle']);
  }, id);
  expect(Math.abs(rotated.angle)).toBeGreaterThan(45);
});

test('edits IText through the browser keyboard', async ({ page }) => {
  const id = await page.evaluate(async () => {
    const text = await window.editor.addText('Original', {
      position: { x: 40, y: 30 },
      styles: { fill: '#ffffff', fontFamily: 'sans-serif', fontSize: 12 },
      autofocus: false,
    });

    return text.id;
  });
  const { center } = await page.evaluate((objectId) => window.getObjectControls(objectId), id);

  await page.mouse.dblclick(center.x, center.y);
  await page.keyboard.press('ControlOrMeta+A');
  await page.keyboard.type('Edited text');
  await page.keyboard.press('Escape');

  const text = await page.evaluate((objectId) => {
    return window.editor.getObjectProperties(objectId, ['text']);
  }, id);
  expect(text.text).toBe('Edited text');
});

test('creates a free-drawing path from pointer input', async ({ page }) => {
  const canvas = page.locator('canvas.upper-canvas');
  const bounds = await canvas.boundingBox();

  await page.evaluate(() => {
    window.editor.startDrawingMode('FREE_DRAWING');
    window.editor.setBrush({ width: 4, color: '#ffffff' });
  });
  await page.mouse.move(bounds.x + bounds.width * 0.25, bounds.y + bounds.height * 0.25);
  await page.mouse.down();
  await page.mouse.move(bounds.x + bounds.width * 0.75, bounds.y + bounds.height * 0.75, {
    steps: 10,
  });
  await page.mouse.up();
  await page.evaluate(() => window.editor.stopDrawingMode());

  const paths = await page.evaluate(() => {
    return window.editor._graphics
      .getCanvas()
      .getObjects()
      .filter((object) => object.type === 'path').length;
  });
  expect(paths).toBe(1);
});
