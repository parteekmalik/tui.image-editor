/* eslint-disable jest/no-done-callback */
const { test, expect } = require('@playwright/test');

async function openUI(page) {
  await page.goto('/fixture.html?ui');
  await page.evaluate(() => window.ready);
}

test.beforeEach(async ({ page }) => {
  await openUI(page);
});

test('switches editor menus and exposes their controls', async ({ page }) => {
  await page.locator('.tie-btn-shape').click();
  await expect(page.locator('.tie-btn-shape')).toHaveClass(/active/);
  await expect(page.locator('.tui-image-editor-menu-shape .rect')).toBeVisible();

  await page.locator('.tie-btn-text').click();
  await expect(page.locator('.tie-btn-text')).toHaveClass(/active/);
  await expect(page.locator('.tui-image-editor-menu-text .bold')).toBeVisible();

  await page.locator('.tie-btn-filter').click();
  await expect(page.locator('.tie-btn-filter')).toHaveClass(/active/);
  await expect(page.locator('.tui-image-editor-menu-filter .tie-grayscale')).toBeVisible();
});

test('loads a local image through the UI file input', async ({ page }) => {
  const onePixelPng = Buffer.from(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAFgQIA' +
      '0aZzNwAAAABJRU5ErkJggg==',
    'base64'
  );

  await page.locator('.tui-image-editor-load-btn').first().setInputFiles({
    name: 'replacement.png',
    mimeType: 'image/png',
    buffer: onePixelPng,
  });
  await expect
    .poll(() => page.evaluate(() => window.editor.getImageName()))
    .toBe('replacement.png');
  expect(await page.evaluate(() => window.editor.getCanvasSize())).toEqual({ width: 1, height: 1 });
});

test('opens the rendered image from the full UI', async ({ page }) => {
  const popupPromise = page.waitForEvent('popup');
  await page.locator('.tui-image-editor-download-btn:visible').click();
  const popup = await popupPromise;
  await popup.waitForLoadState('domcontentloaded');

  await expect(popup.locator('img')).toHaveAttribute('src', /^data:image\/png;base64,/);
});

test.describe('touch viewport', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    isMobile: true,
  });

  test('opens a menu and selects a canvas object by touch', async ({ page }) => {
    await page.locator('.tie-btn-shape').tap();
    await expect(page.locator('.tie-btn-shape')).toHaveClass(/active/);

    const id = await page.evaluate(async () => {
      const shape = await window.editor.addShape('rect', {
        left: 40,
        top: 30,
        width: 20,
        height: 12,
        fill: '#ff00ff',
      });
      window.editor.discardSelection();

      return shape.id;
    });
    const { center } = await page.evaluate((objectId) => window.getObjectControls(objectId), id);
    await page.touchscreen.tap(center.x, center.y);

    const selected = await page.evaluate((objectId) => {
      const graphics = window.editor._graphics;

      return graphics.getCanvas().getActiveObject() === graphics.getObject(objectId);
    }, id);
    expect(selected).toBe(true);
  });
});
