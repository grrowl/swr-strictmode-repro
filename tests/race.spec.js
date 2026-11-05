import { test, expect } from '@playwright/test';
test('a completed mutation survives an older GET', async ({ page }) => {
  const version = process.env.SWR_VERSION ?? 'unpatched';
  const strict = process.env.STRICT_MODE ?? 'true';
  await page.goto(`${process.env.DEMO_PATH ?? '/'}?version=${version}&strict=${strict}`);
  const value = page.getByRole('status', { name: 'Cached value' });
  await page.getByRole('button', { name: 'Complete initial GET', exact: true }).click();
  await expect(value).toHaveText('enabled');
  await page.getByRole('button', { name: 'Start refresh GET', exact: true }).click();
  await page.getByRole('button', { name: 'Start mutation', exact: true }).click();
  await page.getByRole('button', { name: 'Complete mutation', exact: true }).click();
  await expect(value).toHaveText('disabled');
  await page.getByRole('button', { name: 'Complete older GET', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Expected final value' })).toBeVisible();
  await expect(page.getByText('Read: idle; write: idle.', { exact: true })).toBeVisible();
  await page.screenshot({ path: `evidence/${version}-strict-${strict}.png`, fullPage: true });
  await expect(value).toHaveText('disabled');
});
