const { test, expect } = require('@playwright/test');
const { axe } = require('./helpers');

test('the Strickland box sits beside the status on wide screens and below it on phones, with sources', async ({ page }) => {
  await page.goto('/');
  const box = page.locator('#callout');
  await expect(box).toBeVisible();
  await expect(box.getByRole('heading', { level: 2 })).toHaveText("Strickland didn't show up.");
  for (const text of ['211 to 204', 'Rep. Marilyn Strickland (D-Pierce County)', 'motorcade', '$291,000', "So who is she beholden to?", 'It passed by seven votes.']) await expect(box).toContainText(text);
  await expect(box.locator('#calloutSources a')).toHaveCount(4);
  const a = await page.locator('#status').boundingBox(), b = await box.boundingBox(), steps = await page.locator('#steps').boundingBox();
  if ((page.viewportSize()?.width || 0) >= 900) { expect(Math.abs(a.y - b.y)).toBeLessThan(2); expect(b.x).toBeGreaterThan(a.x + a.width - 1); }
  else expect(b.y).toBeGreaterThanOrEqual(a.y + a.height - 1);
  expect(b.y + b.height).toBeLessThanOrEqual(steps.y + 1);
});

test('the separate Strickland letter opens with her greeting, the visitor details and her contact links', async ({ page }) => {
  await page.goto('/');
  await page.fill('#detailName', 'Alex Smith'); await page.fill('#detailCity', 'Lacey'); await page.fill('#detailZip', '98503');
  await page.click('#calloutOpen');
  const dialog = page.locator('#calloutDialog');
  await expect(dialog).toBeVisible();
  await expect(page.locator('#calloutSubject')).toHaveValue('You missed the Hegseth vote');
  const body = await page.locator('#calloutBody').inputValue();
  expect(body).toMatch(/^Dear Representative Strickland,\n\nI'm writing to repudiate your absence on November 10/);
  expect(body).toMatch(/Alex Smith\nLacey, WA 98503$/);
  expect(body).toContain('Reply to this letter');
  expect(body).toContain('Tell us who you are beholden to: your constituents, or AIPAC?');
  expect(body).not.toMatch(/—/);
  const strickland = await page.evaluate(() => window.CAMPAIGN.officials.find(o => o.id === 'strickland'));
  await expect(page.locator('#calloutForm')).toHaveAttribute('href', strickland.website);
  await expect(page.locator('#calloutCall')).toHaveAttribute('href', 'tel:+1' + strickland.phone.replace(/\D/g, ''));
  await axe(page);
  await page.click('#closeCallout');
  await expect(dialog).toBeHidden();
});
