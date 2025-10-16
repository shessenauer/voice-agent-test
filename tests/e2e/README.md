# E2E Tests

This directory contains end-to-end tests for the voice agent application using Playwright.

## Test Structure

- `smoke.spec.ts` - Smoke tests that verify all pages can load without errors

## Running Tests

### Run all E2E tests

```bash
npm run test:e2e
```

### Run smoke tests only

```bash
npm run test:e2e:smoke
```

### Run tests with UI (interactive mode)

```bash
npm run test:e2e:ui
```

### Run tests in headed mode (see browser)

```bash
npm run test:e2e:headed
```

## Test Categories

### Smoke Tests

- **Page Loading**: Verifies all main pages load without console errors
- **Navigation**: Tests navigation between pages works correctly
- **API Health**: Checks that API endpoints respond appropriately
- **Error Handling**: Ensures 404 pages and other errors are handled gracefully

## Pages Tested

- `/` (root - redirects to dashboard)
- `/dashboard` (main dashboard)
- `/dashboard/analytics` (analytics page)
- `/dashboard/settings` (settings page)
- `/dashboard/voice-agent` (voice agent interface)

## API Endpoints Tested

- `/api/health`
- `/api/calendar/events`
- `/api/email/drafts`
- `/api/github/issues`
- `/api/home/devices`
- `/api/responses`
- `/api/session`
- `/api/search/web`

## Configuration

Tests are configured in `playwright.config.ts` in the project root. The configuration includes:

- Base URL: `http://localhost:3000`
- Test directory: `./tests/e2e`
- Browsers: Chromium, Firefox, WebKit
- Auto-start dev server before tests
- HTML reporter for test results
