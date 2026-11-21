const { test, expect } = require('@playwright/test');
const { axe } = require('./helpers');

test('the Strickland box sits beside the status on wide screens and below it on phones, and links to its page', async ({ page }) => {
  await page.goto('/');
  const box = page.locator('#callout');
  await expect(box).toBeVisible();
  await expect(box.getByRole('heading', { level: 2 })).toHaveText("Strickland didn't show up.");
  for (const text of ['211 to 204', 'Rep. Marilyn Strickland (D-Pierce County)', 'motorcade', '$291,000', 'So who is she beholden to?', 'It passed by seven votes.']) await expect(box).toContainText(text);
  await expect(box.locator('#calloutSources a')).toHaveCount(4);
  await expect(page.locator('#calloutOpen')).toHaveAttribute('href', '/strickland');
  const a = await page.locator('#status').boundingBox(), b = await box.boundingBox(), steps = await page.locator('#steps').boundingBox();
  if ((page.viewportSize()?.width || 0) >= 900) { expect(Math.abs(a.y - b.y)).toBeLessThan(2); expect(b.x).toBeGreaterThan(a.x + a.width - 1); }
  else expect(b.y).toBeGreaterThanOrEqual(a.y + a.height - 1);
  expect(b.y + b.height).toBeLessThanOrEqual(steps.y + 1);
  await page.click('#calloutOpen');
  await expect(page).toHaveURL(/\/strickland$/);
  await expect(page.getByRole('heading', { level: 1 })).toHaveText("Strickland didn't show up.");
});

test('/strickland stands alone: sourced box, letter with her greeting, her contact links, and no page scroll sideways', async ({ page }) => {
  await page.goto('/strickland');
  await expect(page).toHaveTitle("Strickland didn't show up · DEM RESET");
  await expect(page.locator('#calloutSources a')).toHaveCount(4);
  await expect(page.locator('#calloutSubject')).toHaveValue('You missed the Hegseth vote');
  const body = await page.locator('#calloutBody').inputValue();
  expect(body).toMatch(/^Dear Representative Strickland,\n\nI'm writing to repudiate your absence on November 10/);
  expect(body).toMatch(/\[Your name\]\n\[Your location\]$/);
  expect(body).toContain('Tell us who you are beholden to: your constituents, or AIPAC?');
  expect(body).not.toMatch(/—/);
  const strickland = await page.evaluate(() => window.CAMPAIGN.officials.find(o => o.id === 'strickland'));
  await expect(page.locator('#calloutForm')).toHaveAttribute('href', strickland.website);
  await expect(page.locator('#calloutCall')).toHaveAttribute('href', 'tel:+1' + strickland.phone.replace(/\D/g, ''));
  await page.fill('#letterName', 'Alex Smith'); await page.fill('#letterCity', 'Lacey'); await page.fill('#letterZip', '98503');
  expect(await page.locator('#calloutBody').inputValue()).toMatch(/Alex Smith\nLacey, WA 98503$/);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await axe(page);
});

test('/strickland fills in details saved on the main page and never writes storage', async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => localStorage.setItem('leadership-wa-drafts-v3', JSON.stringify({ details: { name: 'Sam Lee', city: 'Olympia', county: 'Thurston', zip: '98501' } })));
  const before = await page.evaluate(() => JSON.stringify(localStorage));
  await page.goto('/strickland');
  expect(await page.locator('#calloutBody').inputValue()).toMatch(/Sam Lee\nOlympia, Thurston County, WA 98501$/);
  await expect(page.locator('#letterName')).toHaveValue('Sam Lee');
  // A personal edit to the letter is not overwritten by later detail changes.
  await page.locator('#calloutBody').fill('My own letter');
  await page.fill('#letterName', 'Someone Else');
  await expect(page.locator('#calloutBody')).toHaveValue('My own letter');
  expect(await page.evaluate(() => JSON.stringify(localStorage))).toBe(before);
});

test('/strickland warns about the district and offers the call before the letter, not after', async ({ page }) => {
  await page.goto('/strickland');
  const call = page.locator('.callout-call');
  await expect(call.locator('p')).toHaveText('House contact forms usually take messages only from people in the district. Not in WA-10? Call her office instead.');
  await expect(call.locator('#calloutCall')).toHaveText(/^Call /);
  const warning = await call.boundingBox(), name = await page.locator('#letterName').boundingBox(), letter = await page.locator('#calloutBody').boundingBox();
  expect(warning.y + warning.height).toBeLessThanOrEqual(name.y);
  expect(warning.y + warning.height).toBeLessThanOrEqual(letter.y);
});

test('on phones both update boxes start collapsed to their headline and expand on tap; on desktop they are open', async ({ page }) => {
  await page.goto('/');
  const phone = (page.viewportSize()?.width || 0) < 900;
  for (const id of ['status', 'callout']) {
    const box = page.locator('#' + id), toggle = box.locator('.status-toggle'), items = box.locator('dl');
    await expect(box.getByRole('heading', { level: 2 })).toBeVisible();
    if (!phone) { await expect(toggle).toBeHidden(); await expect(items).toBeVisible(); continue; }
    await expect(items).toBeHidden();
    await expect(toggle).toHaveAttribute('aria-expanded', 'false');
    await toggle.click();
    await expect(items).toBeVisible();
    await expect(box.locator('.note a').first()).toBeVisible();
    await expect(toggle).toHaveAttribute('aria-expanded', 'true');
    await expect(toggle).toHaveText('Hide details');
  }
  await expect(page.locator('#calloutOpen')).toBeVisible();
  await axe(page);
});
