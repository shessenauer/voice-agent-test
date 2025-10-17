import { test, expect } from '@playwright/test';

test.describe('Voice Agent Connection Tests', () => {
  test('Voice agent connect button works without immediate disconnection', async ({ page }) => {
    // Set a desktop viewport to ensure we get the desktop layout
    await page.setViewportSize({ width: 1024, height: 768 });
    
    // Navigate to voice agent page
    await page.goto('/dashboard/voice-agent');
    await page.waitForLoadState('networkidle');
    
    // Wait for the page to fully load
    await page.waitForTimeout(2000);
    
    // Check for console errors before clicking
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    // Find the desktop connect button specifically
    const connectButton = page.locator('div.hidden.sm\\:flex button').filter({ hasText: /Connect|Disconnect/ });
    await expect(connectButton).toBeVisible({ timeout: 10000 });
    
    // Check initial state - should show "Connect"
    await expect(connectButton).toContainText('Connect');
    
    // Click the connect button
    console.log('Clicking connect button...');
    await connectButton.click();
    
    // Wait a moment for the connection process to start
    await page.waitForTimeout(1000);
    
    // Check that we don't immediately get disconnected
    // The button should either show "Connecting..." or "Disconnect" (if connected)
    const buttonText = await connectButton.textContent();
    console.log('Button text after click:', buttonText);
    
    // Should not show "Connect" again immediately (which would indicate instant disconnection)
    expect(buttonText).not.toBe('Connect');
    
    // Should show either "Connecting..." or "Disconnect"
    expect(['Connecting...', 'Disconnect']).toContain(buttonText);
    
    // Wait a bit more to see if connection stabilizes
    await page.waitForTimeout(2000);
    
    // Check final state
    const finalButtonText = await connectButton.textContent();
    console.log('Final button text:', finalButtonText);
    
    // Should not have reverted to "Connect" (indicating disconnection)
    if (finalButtonText === 'Connect') {
      console.log('❌ Connection failed - button reverted to Connect');
      
      // Check for specific error messages in console
      const connectionErrors = consoleErrors.filter(error => 
        error.includes('InvalidStateError') || 
        error.includes('RTCPeerConnection') ||
        error.includes('addTrack') ||
        error.includes('signalingState')
      );
      
      if (connectionErrors.length > 0) {
        console.log('Connection errors found:', connectionErrors);
        throw new Error(`Voice agent connection failed with errors: ${connectionErrors.join(', ')}`);
      }
    }
    
    // If we get here, the connection either succeeded or is still connecting
    expect(['Connecting...', 'Disconnect']).toContain(finalButtonText);
  });

  test('Voice agent connection state changes properly', async ({ page }) => {
    // Set a desktop viewport to ensure we get the desktop layout
    await page.setViewportSize({ width: 1024, height: 768 });
    
    await page.goto('/dashboard/voice-agent');
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);
    
    const connectButton = page.locator('div.hidden.sm\\:flex button').filter({ hasText: /Connect|Disconnect/ });
    await expect(connectButton).toBeVisible();
    
    // Initial state
    await expect(connectButton).toContainText('Connect');
    
    // Click to connect
    await connectButton.click();
    await page.waitForTimeout(500);
    
    // Should show connecting or connected
    const connectingText = await connectButton.textContent();
    expect(['Connecting...', 'Disconnect']).toContain(connectingText);
    
    // If it shows "Disconnect", click to disconnect
    if (connectingText === 'Disconnect') {
      await connectButton.click();
      await page.waitForTimeout(500);
      
      // Should go back to "Connect"
      await expect(connectButton).toContainText('Connect');
    }
  });

  test('Voice agent page loads with all required elements', async ({ page }) => {
    // Set a desktop viewport to ensure we get the desktop layout
    await page.setViewportSize({ width: 1024, height: 768 });
    
    await page.goto('/dashboard/voice-agent');
    await page.waitForLoadState('networkidle');
    
    // Check for main interface elements
    await expect(page.locator('text=Realtime API')).toBeVisible();
    
    // Check for connect button (desktop version)
    const connectButton = page.locator('div.hidden.sm\\:flex button').filter({ hasText: /Connect|Disconnect/ });
    await expect(connectButton).toBeVisible();
    
    // Check for other controls
    await expect(page.locator('text=Push to talk')).toBeVisible();
    await expect(page.locator('text=Audio playback')).toBeVisible();
    await expect(page.locator('text=Talk')).toBeVisible();
    await expect(page.locator('text=Codec:')).toBeVisible();
  });
});
