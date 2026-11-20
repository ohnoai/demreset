const { test, expect } = require('@playwright/test');
const { toConsole, preview, channel, goTo, edit, stored, draftKey, axe } = require('./helpers');

test('the House status is visible above the steps with its sources', async ({ page }) => {
  await page.goto('/');
  const status = page.locator('#status');
  await expect(status).toBeVisible();
  await expect(status.getByRole('heading', { level: 2 })).toHaveText('Jeffries is nominated. Not elected.');
  await expect(status).toContainText('251 to 11');
  await expect(status).toContainText('If any Washington State representative voted no, they have not said so.');
  await expect(status.locator('a')).toHaveCount(3);
  const box = await status.boundingBox(), steps = await page.locator('#steps').boundingBox();
  expect(box.y).toBeLessThan(steps.y);
});

test('the Van Hollen ask is a visible choice that changes Senate and state copy, not House copy', async ({ page }) => {
  await page.goto('/');
  await toConsole(page, 'WA-07');
  const ask = page.locator('#askRow');
  await expect(ask).toBeVisible();
  await expect(ask.getByRole('button', { name: 'Oppose Schumer', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await goTo(page, 'Patty Murray'); await channel(page, 'letter');
  await expect(preview(page)).not.toContainText('Van Hollen');
  await ask.getByRole('button', { name: 'Oppose Schumer, back Van Hollen' }).click();
  await expect(preview(page)).toContainText('Back Chris Van Hollen for Senate Democratic leader');
  await expect(page.locator('#subjectText')).toHaveText('Oppose Chuck Schumer, back Chris Van Hollen');
  await channel(page, 'call'); await expect(preview(page)).toContainText('back Chris Van Hollen');
  await goTo(page, 'Shasti Conrad'); await channel(page, 'letter');
  await expect(preview(page)).toContainText('back Chris Van Hollen for Senate leader');
  await goTo(page, 'Pramila Jayapal');
  await expect(preview(page)).not.toContainText('Van Hollen');
  await expect(preview(page)).toContainText('floor');
  expect((await stored(page, draftKey)).ask).toBe('vanhollen');
  await page.reload();
  await expect(page.getByRole('button', { name: 'Oppose Schumer, back Van Hollen' })).toHaveAttribute('aria-pressed', 'true');
  await axe(page);
});

test('switching the ask never rewrites a letter the visitor edited', async ({ page }) => {
  await page.goto('/');
  await toConsole(page, 'WA-07');
  await goTo(page, 'Maria Cantwell'); await channel(page, 'letter');
  await edit(page, { body: 'My own words to the Senator.' });
  await page.getByRole('button', { name: 'Oppose Schumer, back Van Hollen' }).click();
  await expect(preview(page)).toHaveText('My own words to the Senator.');
});
