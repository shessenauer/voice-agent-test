# E2E Testing Suite

This directory contains end-to-end tests for the voice agent application.

## Test Types

### 1. Smoke Tests (`smoke.spec.ts`)

Basic functionality tests that verify:

- All pages load without errors
- Navigation works correctly
- API endpoints are accessible
- Dark mode toggle functions
- Error handling works properly

### 2. Visual Regression Tests (`visual-regression.spec.ts`)

Comprehensive visual testing that:

- Captures screenshots of all pages in light and dark modes
- Tests responsive layouts (mobile, tablet, desktop)
- Validates UI component positioning and styling
- Detects visual regressions automatically
- Generates baseline screenshots for comparison

## Running Tests

### Smoke Tests

```bash
# Run all smoke tests
npm run test:e2e:smoke

# Run with UI
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed
```

### Visual Regression Tests

```bash
# Run visual regression tests
npm run test:visual

# Run with UI
npm run test:visual:ui

# Update baseline screenshots
npm run test:visual:update
```

## Screenshots

Visual regression tests generate screenshots and snapshots in the following structure:

```
test-screenshots/        # Manual screenshots for debugging
├── light-mode/          # Light mode screenshots
├── dark-mode/           # Dark mode screenshots
├── mobile/              # Mobile layout screenshots
└── voice-agent/         # Voice agent specific screenshots

test-snapshots/          # Playwright baseline snapshots
├── test-screenshots-light-mode-*.png
├── test-screenshots-dark-mode-*.png
└── ...                  # All baseline comparison images
```

**Note**: Both screenshots and snapshots are automatically excluded from git commits via `.gitignore`.

## CI/CD Integration

Visual regression tests run automatically:

- On every push to main/develop branches
- On pull requests
- Daily at 2 AM UTC (scheduled)

Failed tests will:

- Upload screenshots as artifacts
- Generate detailed reports
- Notify the team of visual regressions

## Best Practices

1. **Update baselines** when making intentional UI changes
2. **Review screenshots** before committing visual changes
3. **Test on multiple viewports** for responsive design
4. **Keep tests fast** by avoiding unnecessary waits
5. **Use data-testid** attributes for reliable element selection

## Troubleshooting

### Tests failing due to timing issues

- Increase wait timeouts
- Use `waitForLoadState('networkidle')`
- Add explicit waits for animations

### Screenshots not matching

- Check for dynamic content (timestamps, random IDs)
- Ensure consistent test data
- Update baselines with `npm run test:visual:update`

### Mobile tests failing

- Verify viewport settings
- Check for mobile-specific UI elements
- Test on actual mobile devices if needed
