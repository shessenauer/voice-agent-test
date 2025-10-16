import { test, expect } from '@playwright/test';

// Define the pages to test
const pages = [
  {
    name: 'Dashboard',
    path: '/dashboard',
    expectedTitle: 'Dashboard Overview',
    expectedElements: ['Active Sessions', 'Total Interactions', 'Response Time', 'Success Rate']
  },
  {
    name: 'Analytics',
    path: '/dashboard/analytics',
    expectedTitle: 'Analytics',
    expectedElements: ['Usage Statistics', 'Performance Metrics', 'Recent Activity Chart']
  },
  {
    name: 'Settings',
    path: '/dashboard/settings',
    expectedTitle: 'Settings',
    expectedElements: ['Voice Agent Configuration', 'API Configuration', 'Save Settings']
  },
  {
    name: 'Voice Agent',
    path: '/dashboard/voice-agent',
    expectedTitle: undefined, // This page uses Suspense and may not have a specific title
    expectedElements: ['Loading Voice Agent...', 'Realtime API'] // We'll check for the loading state or main content
  }
];

test.describe('Smoke Tests - Page Loading', () => {
  for (const page of pages) {
    test(`${page.name} page loads without errors`, async ({ page: browserPage }) => {
      // Navigate to the page
      await browserPage.goto(page.path);
      
      // Wait for the page to load completely
      await browserPage.waitForLoadState('networkidle');
      
      // Check that the page loaded successfully (no 404, 500, etc.)
      expect(browserPage.url()).toContain(page.path);
      
      // Check for console errors
      const consoleErrors: string[] = [];
      browserPage.on('console', msg => {
        if (msg.type() === 'error') {
          consoleErrors.push(msg.text());
        }
      });
      
      // Wait a bit more to catch any delayed errors
      await browserPage.waitForTimeout(1000);
      
      // Verify no console errors occurred
      expect(consoleErrors).toHaveLength(0);
      
      // Check for specific content if expected
      if (page.expectedTitle) {
        await expect(browserPage.locator('h1').filter({ hasText: page.expectedTitle })).toBeVisible();
      }
      
      // Check for expected elements (with longer timeout for voice agent)
      for (const element of page.expectedElements) {
        try {
          await expect(browserPage.locator('text=' + element).first()).toBeVisible({ timeout: 10000 });
        } catch (error) {
          // For voice agent page, if we don't see loading, check for main content
          if (page.name === 'Voice Agent' && element === 'Loading Voice Agent...') {
            // Check if we can see the main interface instead
            const hasMainContent = await browserPage.locator('text=Realtime API').isVisible();
            if (hasMainContent) {
              console.log('Voice agent loaded successfully, skipping loading check');
              continue;
            }
          }
          throw error;
        }
      }
      
      // Check that the page is interactive (no loading spinners stuck)
      const loadingSpinners = await browserPage.locator('[data-testid="loading"], .loading, [class*="loading"]').count();
      if (loadingSpinners > 0) {
        // If there are loading spinners, wait for them to disappear
        await expect(browserPage.locator('[data-testid="loading"], .loading, [class*="loading"]').first()).not.toBeVisible({ timeout: 5000 });
      }
    });
  }
});

test.describe('Smoke Tests - Navigation', () => {
  test('Root page redirects to dashboard', async ({ page }) => {
    await page.goto('/');
    
    // Wait for redirect
    await page.waitForURL('**/dashboard');
    
    // Verify we're on the dashboard
    expect(page.url()).toContain('/dashboard');
    await expect(page.locator('h1')).toContainText('Dashboard Overview');
  });

  test('Navigation between pages works', async ({ page }) => {
    // Start at dashboard
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Navigate to analytics
    await page.goto('/dashboard/analytics');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Analytics');
    
    // Navigate to settings
    await page.goto('/dashboard/settings');
    await page.waitForLoadState('networkidle');
    await expect(page.locator('h1')).toContainText('Settings');
    
    // Navigate to voice agent
    await page.goto('/dashboard/voice-agent');
    await page.waitForLoadState('networkidle');
    
    // Voice agent page should load (even if it shows loading initially)
    expect(page.url()).toContain('/dashboard/voice-agent');
  });
});

test.describe('Smoke Tests - API Health', () => {
  test('Health endpoint responds', async ({ request }) => {
    const response = await request.get('/api/health');
    expect(response.status()).toBe(200);
  });

  test('API endpoints are accessible', async ({ request }) => {
    // Test various API endpoints to ensure they don't throw 500 errors
    const endpoints = [
      '/api/calendar/events',
      '/api/email/drafts',
      '/api/github/issues',
      '/api/home/devices',
      '/api/responses',
      '/api/session',
      '/api/search/web'
    ];

    for (const endpoint of endpoints) {
      const response = await request.get(endpoint);
      // We expect these to return 200 or 405 (method not allowed) but not 500
      expect(response.status()).toBeLessThan(500);
    }
  });
});

test.describe('Smoke Tests - Error Handling', () => {
  test('404 page handles gracefully', async ({ page }) => {
    await page.goto('/non-existent-page');
    
    // Should not crash the app
    await page.waitForLoadState('networkidle');
    
    // Check for console errors
    const consoleErrors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        consoleErrors.push(msg.text());
      }
    });
    
    await page.waitForTimeout(1000);
    
    // Should not have critical errors (404 is expected)
    const criticalErrors = consoleErrors.filter(error => 
      !error.includes('404') && 
      !error.includes('Not Found') &&
      !error.includes('Failed to load resource')
    );
    expect(criticalErrors).toHaveLength(0);
  });
});
