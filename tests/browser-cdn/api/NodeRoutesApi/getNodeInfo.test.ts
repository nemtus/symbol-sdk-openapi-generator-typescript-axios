import { test, expect } from '@playwright/test';
import * as path from 'path';
import * as fixtures from '../../../_shared/fixtures.cjs';

test('getNodeInfo returns valid response via console.log', async ({ page }) => {
  // Arrange
  const messages: any[] = [];
  const browserErrors: any[] = [];
  page.on('console', async (msg) => {
    const args = await Promise.all(msg.args().map((arg) => arg.jsonValue()));
    if (msg.type() === 'error') {
      browserErrors.push(args[0] || msg.text());
    } else if (msg.type() === 'log') {
      if (args.length > 0 && typeof args[0] === 'object') {
        messages.push(args[0]);
      }
    }
  });
  const htmlPath = path.resolve(__dirname, 'getNodeInfo.html');

  // Act
  await page.goto(`file://${htmlPath}`);
  await expect
    .poll(() => messages.length + browserErrors.length, { timeout: 10000, message: 'Timed out waiting for getNodeInfo console payload' })
    .toBeGreaterThan(0);
  if (browserErrors.length > 0) {
    throw new Error(`Browser console error from getNodeInfo: ${JSON.stringify(browserErrors[0])}`);
  }

  // Assert (shared fixture; volatile fields relaxed there)
  expect(messages).toHaveLength(1);
  fixtures.assertNodeInfo(expect, messages[0]);
});
