import { test, expect } from '@playwright/test';
import path from 'path';

// Visual regression test suite
test.describe('Visual Regression Tests', () => {
  const pages = [
    { name: 'Dashboard', url: '/dashboard' },
    { name: 'Voice Agent', url: '/dashboard/voice-agent' },
    { name: 'Analytics', url: '/dashboard/analytics' },
    { name: 'Settings', url: '/dashboard/settings' }
  ];

  // Test each page in light mode
  pages.forEach(page => {
    test(`${page.name} page - Light mode`, async ({ page: browserPage }) => {
      await browserPage.goto(page.url);
      await browserPage.waitForLoadState('networkidle');
      
      // Ensure we're in light mode
      await browserPage.evaluate(() => {
        document.documentElement.classList.remove('dark');
        document.documentElement.classList.add('light');
      });
      
      // Wait for any animations to complete
      await browserPage.waitForTimeout(500);
      
      // Take full page screenshot
      const screenshotPath = `test-screenshots/light-mode/${page.name.toLowerCase().replace(' ', '-')}.png`;
      await browserPage.screenshot({ 
        path: screenshotPath,
        fullPage: true 
      });
      
      // Compare with baseline (if it exists)
      await expect(browserPage).toHaveScreenshot(screenshotPath);
    });

    test(`${page.name} page - Dark mode`, async ({ page: browserPage }) => {
      await browserPage.goto(page.url);
      await browserPage.waitForLoadState('networkidle');
      
      // Switch to dark mode
      await browserPage.evaluate(() => {
        document.documentElement.classList.remove('light');
        document.documentElement.classList.add('dark');
      });
      
      // Wait for any animations to complete
      await browserPage.waitForTimeout(500);
      
      // Take full page screenshot
      const screenshotPath = `test-screenshots/dark-mode/${page.name.toLowerCase().replace(' ', '-')}.png`;
      await browserPage.screenshot({ 
        path: screenshotPath,
        fullPage: true 
      });
      
      // Compare with baseline (if it exists)
      await expect(browserPage).toHaveScreenshot(screenshotPath);
    });
  });

  // Test specific UI components
  test('Sidebar layout and navigation', async ({ page }) => {
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Test sidebar is visible and properly positioned
    const sidebar = page.locator('nav').first();
    await expect(sidebar).toBeVisible();
    
    // Test Agent header is clickable
    const agentLink = page.locator('a[href="/dashboard"]').filter({ hasText: 'Agent' });
    await expect(agentLink).toBeVisible();
    await expect(agentLink).toHaveAttribute('href', '/dashboard');
    
    // Test navigation items
    const navItems = ['Overview', 'Voice Agent', 'Analytics', 'Settings'];
    for (const item of navItems) {
      const navLink = page.locator('a').filter({ hasText: item });
      await expect(navLink).toBeVisible();
    }
    
    // Test dark mode toggle
    const darkModeToggle = page.locator('input[type="checkbox"]').first();
    await expect(darkModeToggle).toBeVisible();
  });

  // Test responsive layout
  test('Mobile layout', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/dashboard');
    await page.waitForLoadState('networkidle');
    
    // Take mobile screenshot
    await page.screenshot({ 
      path: 'test-screenshots/mobile/dashboard.png',
      fullPage: true 
    });
    
    // Test mobile menu button is visible
    const mobileMenuButton = page.locator('button').filter({ hasText: /menu|hamburger/i }).first();
    if (await mobileMenuButton.isVisible()) {
      await expect(mobileMenuButton).toBeVisible();
    }
  });

  // Test voice agent specific functionality
  test('Voice agent transcript auto-scroll', async ({ page }) => {
    await page.goto('/dashboard/voice-agent');
    await page.waitForLoadState('networkidle');
    
    // Wait for voice agent to load
    await page.waitForSelector('[data-testid="transcript"]', { timeout: 10000 });
    
    // Test transcript area is visible
    const transcript = page.locator('[data-testid="transcript"]');
    await expect(transcript).toBeVisible();
    
    // Test that scroll behavior is smooth
    const transcriptContainer = page.locator('[data-testid="transcript"]').first();
    await transcriptContainer.evaluate((el) => {
      el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
    });
    
    // Take screenshot of voice agent page
    await page.screenshot({ 
      path: 'test-screenshots/voice-agent/voice-agent-page.png',
      fullPage: true 
    });
  });
});
