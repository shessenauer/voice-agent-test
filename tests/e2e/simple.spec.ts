import { test, expect } from '@playwright/test';

test.describe('Simple Smoke Tests', () => {
  test('Health endpoint responds', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
  });

  test('Dashboard page loads', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Check for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(2000);
    
    // Should not have critical errors
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('404') && 
      !error.includes('Not Found') &&
      !error.includes('Failed to load resource')
    );
    expect(criticalErrors).toHaveLength(0);
    
    // Check that we're on the dashboard
    expect(page.url()).toContain('/dashboard');
  });
});
