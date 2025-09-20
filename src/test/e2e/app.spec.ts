import { test, expect } from '@playwright/test';

test.describe('Application E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app before each test
    await page.goto('/');
  });

  test('should load the homepage successfully', async ({ page }) => {
    // Check if the page loads without errors
    await expect(page).toHaveTitle(/Studio Treiax/i);
    
    // Check if main content is visible
    await expect(page.locator('body')).toBeVisible();
    
    // Check for no console errors
    const errors: string[] = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    // Wait for page to be fully loaded
    await page.waitForLoadState('networkidle');
    
    // Assert no console errors
    expect(errors).toHaveLength(0);
  });

  test('should navigate between pages', async ({ page }) => {
    // Test navigation if there are multiple pages
    const navigationLinks = page.locator('nav a, [role="navigation"] a');
    const linkCount = await navigationLinks.count();
    
    if (linkCount > 0) {
      // Click on the first navigation link
      await navigationLinks.first().click();
      
      // Wait for navigation to complete
      await page.waitForLoadState('networkidle');
      
      // Check that we're on a different page
      const currentUrl = page.url();
      expect(currentUrl).not.toBe('http://localhost:5173/');
    }
  });

  test('should be responsive on mobile devices', async ({ page }) => {
    // Test mobile viewport
    await page.setViewportSize({ width: 375, height: 667 });
    
    // Check if the page is still functional on mobile
    await expect(page.locator('body')).toBeVisible();
    
    // Check if mobile navigation works (if exists)
    const mobileMenu = page.locator('[data-testid="mobile-menu"], .mobile-menu, .hamburger');
    if (await mobileMenu.count() > 0) {
      await mobileMenu.first().click();
      await expect(page.locator('[data-testid="mobile-nav"], .mobile-nav')).toBeVisible();
    }
  });

  test('should handle form interactions', async ({ page }) => {
    // Look for forms on the page
    const forms = page.locator('form');
    const formCount = await forms.count();
    
    if (formCount > 0) {
      const firstForm = forms.first();
      
      // Find input fields
      const inputs = firstForm.locator('input[type="text"], input[type="email"], textarea');
      const inputCount = await inputs.count();
      
      if (inputCount > 0) {
        // Fill the first input
        await inputs.first().fill('Test input');
        
        // Check if the input was filled
        await expect(inputs.first()).toHaveValue('Test input');
      }
      
      // Look for submit button
      const submitButton = firstForm.locator('button[type="submit"], input[type="submit"]');
      if (await submitButton.count() > 0) {
        // Note: We're not actually submitting to avoid side effects
        await expect(submitButton.first()).toBeVisible();
      }
    }
  });

  test('should load and display dynamic content', async ({ page }) => {
    // Wait for any dynamic content to load
    await page.waitForTimeout(2000);
    
    // Check for loading states
    const loadingElements = page.locator('[data-testid="loading"], .loading, .spinner');
    
    // Wait for loading to complete (if any)
    if (await loadingElements.count() > 0) {
      await expect(loadingElements.first()).toBeHidden({ timeout: 10000 });
    }
    
    // Check for error states
    const errorElements = page.locator('[data-testid="error"], .error, .alert-error');
    await expect(errorElements).toHaveCount(0);
  });

  test('should handle accessibility requirements', async ({ page }) => {
    // Check for basic accessibility features
    
    // Check if page has a main landmark
    const main = page.locator('main, [role="main"]');
    if (await main.count() > 0) {
      await expect(main.first()).toBeVisible();
    }
    
    // Check for heading structure
    const h1 = page.locator('h1');
    if (await h1.count() > 0) {
      await expect(h1.first()).toBeVisible();
    }
    
    // Check for alt text on images
    const images = page.locator('img');
    const imageCount = await images.count();
    
    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const img = images.nth(i);
      const alt = await img.getAttribute('alt');
      
      // Images should have alt text (can be empty for decorative images)
      expect(alt).not.toBeNull();
    }
  });

  test('should perform well', async ({ page }) => {
    // Start performance monitoring
    await page.goto('/', { waitUntil: 'networkidle' });
    
    // Measure page load time
    const performanceMetrics = await page.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
      return {
        loadTime: navigation.loadEventEnd - navigation.loadEventStart,
        domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
        firstPaint: performance.getEntriesByName('first-paint')[0]?.startTime || 0,
        firstContentfulPaint: performance.getEntriesByName('first-contentful-paint')[0]?.startTime || 0
      };
    });
    
    // Assert reasonable performance metrics
    expect(performanceMetrics.loadTime).toBeLessThan(5000); // 5 seconds
    expect(performanceMetrics.domContentLoaded).toBeLessThan(3000); // 3 seconds
    
    console.log('Performance Metrics:', performanceMetrics);
  });
});