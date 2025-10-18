import { test, expect } from '@playwright/test';

test.describe('Voice Agent Debug Tests', () => {
  test('Debug voice agent connection state', async ({ page }) => {
    // Set a desktop viewport
    await page.setViewportSize({ width: 1024, height: 768 });
    
    // Navigate to voice agent page
    await page.goto('/dashboard/voice-agent');
    await page.waitForLoadState('networkidle');
    
    // Wait for the page to fully load
    await page.waitForTimeout(3000);
    
    // Capture console logs
    const consoleLogs: string[] = [];
    const consoleErrors: string[] = [];
    
    page.on('console', msg => {
      const text = msg.text();
      if (msg.type() === 'error') {
        consoleErrors.push(text);
      } else {
        consoleLogs.push(text);
      }
    });
    
    // Find the desktop connect button
    const connectButton = page.locator('div.hidden.sm\\:flex button').filter({ hasText: /Connect|Disconnect/ });
    await expect(connectButton).toBeVisible({ timeout: 10000 });
    
    // Check initial state
    const initialText = await connectButton.textContent();
    console.log('Initial button text:', initialText);
    
    // Click the connect button
    console.log('Clicking connect button...');
    await connectButton.click();
    
    // Wait and check state multiple times
    for (let i = 0; i < 10; i++) {
      await page.waitForTimeout(1000);
      const currentText = await connectButton.textContent();
      console.log(`After ${i + 1}s, button text:`, currentText);
      
      if (currentText === 'Disconnect') {
        console.log('✅ Successfully connected!');
        break;
      } else if (currentText === 'Connect') {
        console.log('❌ Connection failed and reverted to Connect');
        break;
      }
    }
    
    // Log any errors
    if (consoleErrors.length > 0) {
      console.log('Console errors:', consoleErrors);
    }
    
    // Log relevant console messages
    const relevantLogs = consoleLogs.filter(log => 
      log.includes('Connect') || 
      log.includes('Disconnect') || 
      log.includes('Connection') ||
      log.includes('Error') ||
      log.includes('Failed')
    );
    console.log('Relevant console logs:', relevantLogs);
  });
});

