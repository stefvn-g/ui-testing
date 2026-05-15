# UI Testing - PHPTravels Web Application

**Course:** Software Testing and Analysis
**Faculty:** CST, SEE University
**Semester:** 8th Semester (2025/2026)

## About

This project implements a comprehensive UI testing suite for the PHPTravels demo web
application (https://phptravels.net), a travel booking platform supporting stays, flights,
tours, and car rentals. The suite covers five distinct categories of UI testing:
end-to-end functional testing, accessibility (WCAG compliance), performance metrics,
responsive layout validation, and visual regression testing.

The goal was to apply real-world testing methodologies to an existing web application
and demonstrate how different types of UI tests complement each other to provide full
coverage of a frontend system.

## What Is Being Tested

- **Authentication flows** - login, signup, validation, redirects, and error states
- **Navigation and search widgets** - hero search tabs, navbar dropdowns, service pages,
  footer links, language and currency switchers
- **Accessibility (WCAG 2.0 A/AA)** - critical violations, keyboard navigability, input
  labels, image alt attributes, heading structure
- **Performance** - DOM content loaded time, full page load time, First Contentful Paint
  across key pages
- **Responsive layout** - correct rendering across mobile (375px), tablet (768px), and
  desktop (1280px) viewports; horizontal overflow checks
- **Visual regression** - snapshot-based comparison for homepage, login, signup, stays,
  and flights pages

## Test Structure

```
ui-testing/
├── tests/
│   ├── e2e/
│   │   ├── auth.spec.ts           # Login, signup, validation flows
│   │   └── search.spec.ts         # Navigation, search widgets, page loads
│   ├── a11y/
│   │   └── accessibility.spec.ts  # WCAG 2.0 A/AA compliance via axe-core
│   ├── performance/
│   │   └── performance.spec.ts    # Load time and paint metrics
│   ├── responsive/
│   │   └── responsive.spec.ts     # Multi-viewport layout checks
│   └── visual-regression/
│       └── visual.spec.ts         # Screenshot snapshot comparison
├── snapshots/                     # Stored visual baselines
├── playwright.config.ts
├── package.json
└── tsconfig.json
```

## Tech Stack

- **Playwright** (^1.44.0) - browser automation, multi-browser testing, screenshot comparison
- **axe-core / @axe-core/playwright** (^4.9.0) - automated WCAG accessibility auditing
- **TypeScript** (^5.4.5) - type-safe test authoring
- **Chromium, Firefox, WebKit** - tests run across all three browser engines

## Running the Project

### 1. Install dependencies

```
npm install
```

### 2. Install Playwright browsers

```
npx playwright install
```

### 3. Run all tests

```
npm test
```

### 4. Run a specific test category

```
npm run test:e2e
npm run test:a11y
npm run test:performance
npm run test:responsive
npm run test:visual
```

### 5. Update visual regression baselines

Run this the first time, or whenever you intentionally change the UI:

```
npm run test:update-snapshots
```

### 6. View the HTML report

After any test run:

```
npm run report
```

This opens the Playwright HTML report in your browser with pass/fail results,
error details, and screenshots for any failures.

## Notes on Visual Regression

The first time you run the visual tests, Playwright will generate baseline snapshots
and store them in the `snapshots/` directory. Subsequent runs compare against these
baselines with a maximum allowed pixel difference ratio of 3%. If the site's UI changes,
re-run with `--update-snapshots` to accept the new baseline.

Visual tests are sensitive to the environment (OS font rendering, screen resolution).
For consistent results, run them in headless mode on the same OS and resolution each
time - the config already enforces this.

## What We Learned

Working on this project taught us a few things that weren't obvious going in:

- Automated accessibility testing with axe-core catches real issues that are easy to miss
  manually - WCAG violations like missing input labels would be invisible to a developer
  just looking at the screen.
- Performance metrics vary a lot depending on network conditions and machine speed, so
  thresholds need to be loose enough to avoid flaky tests while still being meaningful.
- Visual regression tests break easily when the site has dynamic content like animations
  or live prices, so we had to suppress those before taking snapshots.
- Playwright behaves slightly differently across Chromium, Firefox, and WebKit - especially
  around focus management - which required some test adjustments per browser.

## Challenges

The biggest challenge was that we were testing a third-party website we don't control.
This meant we couldn't test internal API responses or reliably maintain session state,
so some tests had to be written defensively.

Keeping the visual regression tests stable was also tricky since PHPTravels occasionally
updates its UI, which invalidates the stored snapshots and requires rerunning the baseline.

## Future Improvements

- Test on real physical devices instead of simulated viewports, since emulators do not
  always reflect how a real phone or tablet actually renders the page
- Add tests for more pages and longer user flows such as completing a full booking from search
  to checkout
- Run the tests automatically on a schedule so any changes to the live site are caught
  immediately without having to trigger them manually

## License

This project was created for educational purposes as part of university coursework.