import { test, expect } from '@playwright/test';

// CI sets APP_URL per app under test. Locally, you can: APP_URL=http://localhost:5173 npm run smoke

test('app boots cleanly without console errors (iframe harness)', async ({ page }) => {
  const errors: string[] = [];
  const ignorePatterns = [/Cannot use App SDK outside of/i];
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const text = m.text();
    if (ignorePatterns.some((re) => re.test(text))) return;
    errors.push(text);
  });

  const appUrl = process.env.APP_URL || '/';
  await page.setContent(`<iframe src="${appUrl}" style="width:100vw;height:100vh;border:0" />`);
  const appFrame = page.frameLocator('iframe');

  // Heuristic: look for a common root marker inside the app frame.
  const root = appFrame.locator('[data-test-root], #root, main, [role="main"]');
  await expect(root.first()).toBeAttached({ timeout: 15_000 });

  // No console errors (common sign of runtime breakage after upgrades)
  expect(errors.join('\n')).toEqual('');
});
