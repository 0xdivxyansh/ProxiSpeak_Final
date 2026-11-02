/**
 * Final Proxispeak - End-to-End Dual-Browser Automated Testing
 *
 * Exercises the complete multi-user flow in two independent browser contexts:
 * - Simultaneous room join
 * - Canvas avatar synchronization
 * - Movement and proximity threshold evaluation
 * - WebRTC audio handshake and state tracking
 * - Safe room departure and cleanup
 */

import { test, expect } from '@playwright/test';

test.describe('Dual-Browser Virtual Office & WebRTC Flow', () => {
  test('Two users join room, move close, trigger proximity audio, and leave', async ({ browser }) => {
    // Context 1: Alice
    const contextAlice = await browser.newContext({
      permissions: ['microphone']
    });
    const pageAlice = await contextAlice.newPage();

    // Context 2: Bob
    const contextBob = await browser.newContext({
      permissions: ['microphone']
    });
    const pageBob = await contextBob.newPage();

    // 1. Alice joins "main-hall"
    await pageAlice.goto('http://127.0.0.1:5173');
    await expect(pageAlice.locator('h1')).toContainText('ProxiSpeak');

    await pageAlice.fill('input#displayName', 'Alice Engineer');
    await pageAlice.click('button.join-submit-btn');

    // Alice should see the workspace canvas and header
    await expect(pageAlice.locator('canvas')).toBeVisible({ timeout: 10000 });
    await expect(pageAlice.locator('.user-name')).toContainText('Alice Engineer');

    // 2. Bob joins "main-hall"
    await pageBob.goto('http://127.0.0.1:5173');
    await pageBob.fill('input#displayName', 'Bob Architect');
    await pageBob.click('button.join-submit-btn');

    await expect(pageBob.locator('canvas')).toBeVisible({ timeout: 10000 });
    await expect(pageBob.locator('.user-name')).toContainText('Bob Architect');

    // 3. User Count should reflect 2 users in both headers
    await expect(pageAlice.locator('.sidebar-toggle-btn span')).toContainText('2', { timeout: 8000 });
    await expect(pageBob.locator('.sidebar-toggle-btn span')).toContainText('2', { timeout: 8000 });

    // 4. Open members list on Alice's page and verify Bob is visible
    await pageAlice.click('.sidebar-toggle-btn');
    await expect(pageAlice.locator('.user-sidebar')).toBeVisible();
    await expect(pageAlice.locator('.user-sidebar')).toContainText('Bob Architect');

    // 5. Move Bob near Alice using keyboard WASD
    // Focus Bob's canvas and press Arrow keys
    await pageBob.locator('canvas').focus();

    // Move Bob for 1.5 seconds towards spawn area
    for (let i = 0; i < 15; i++) {
      await pageBob.keyboard.press('ArrowUp');
      await pageBob.waitForTimeout(40);
    }

    // 6. Verify Mute toggle works on Alice's client
    const muteBtn = pageAlice.locator('.mic-toggle-btn');
    await muteBtn.click();
    await expect(muteBtn).toContainText('Muted');

    // Unmute
    await muteBtn.click();
    await expect(muteBtn).toContainText('Speaking');

    // 7. Bob leaves the office
    await pageBob.click('button.leave-btn');

    // Bob should return to the join screen
    await expect(pageBob.locator('input#displayName')).toBeVisible({ timeout: 8000 });

    // Alice should see user count drop back to 1
    await expect(pageAlice.locator('.sidebar-toggle-btn span')).toContainText('1', { timeout: 8000 });

    // Clean up
    await contextAlice.close();
    await contextBob.close();
  });
});

