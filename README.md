# UI Testing - RentivoMK Web Application

**Course:** Software Testing and Analysis   
**Faculty:** CST, SEE University  
**Semester:** 8th Semester (2025/2026)  

## About

This project implements a comprehensive E2E UI testing suite for RentivoMK
(https://rentivomk-frontend.vercel.app), a vehicle rental management platform built
with React.js on the frontend and a .NET 10 Web API on the backend, with Supabase
as the database. The suite covers end-to-end functional testing across all major
user-facing workflows, with both happy and sad paths, organized using the
Page Object Model (POM) pattern.

The goal was to apply real-world testing methodologies to a full-stack web application
and demonstrate how thorough E2E tests can validate authentication, role-based access
control, vehicle management, and reservation workflows from the user's perspective.

## What Is Being Tested

- **Authentication flows** — login, registration, logout, redirects for authenticated
  and unauthenticated users, loading states, and error messages
- **Role-based access control** — Admin, Worker, and Customer roles each see different
  navigation items, pages, and action buttons; unauthorized access redirects are verified
- **Vehicle management (Admin)** — adding, editing, and deleting vehicles; tab filtering
  between All Vehicles and Available Only; form validation
- **Vehicle browsing (Customer)** — browsing the fleet, navigating to detail pages,
  filtering to available vehicles, absence of admin controls
- **Reservation workflows (Customer)** — end-to-end reservation creation, date
  validation, cancellation, and viewing reservation history
- **Reservation management (Admin/Worker)** — approving, rejecting, completing, and
  searching reservations; status filters; summary stat cards
- **User management (Admin)** — viewing, searching, filtering, editing roles, and
  deleting users; self-deletion prevention; "you" badge on own account

## Test Structure

```
ui-testing/
├── pages/
│   ├── DashboardPage.ts          # Greeting, role badge, logout
│   ├── LoginPage.ts              # Email/password login, error state
│   ├── RegisterPage.ts           # Registration form, error state
│   ├── VehiclesPage.ts           # Vehicle listing, add/edit/delete forms, tabs
│   ├── VehicleDetailPage.ts      # Detail view, reservation modal
│   ├── ReservationsPage.ts       # Admin/Worker reservation management
│   ├── MyReservationsPage.ts     # Customer reservation history, cancel
│   └── UsersPage.ts              # Admin user management, search, edit, delete
├── tests/
│   ├── auth.spec.ts              # Login, register, logout, redirects
│   ├── vehicles.spec.ts          # Vehicle CRUD, browsing, access control
│   ├── reservations-customer.spec.ts  # Customer reservation workflows
│   ├── reservations-admin.spec.ts     # Admin/Worker reservation management
│   └── users.spec.ts             # Admin user management
├── .github/
│   └── workflows/
│       └── playwright.yml        # CI/CD pipeline (GitHub Actions)
├── playwright.config.ts
├── package.json
└── tsconfig.json
```

## Tech Stack

- **Playwright** (^1.44.0 / resolved 1.60.0) — browser automation, multi-step
  interaction, screenshot capture on failure, video and trace retention
- **TypeScript** (via `@types/node`) — type-safe test and POM authoring
- **dotenv** — environment variable management for credentials and base URL
- **Chromium** — tests run on Desktop Chrome (headless)
- **GitHub Actions** — automated CI pipeline triggered on push and pull requests

## Page Object Model

All page interactions are encapsulated in dedicated page classes under `pages/`.
Each class exposes typed locators and async methods so test files stay readable
and changes to the UI only need to be fixed in one place.

| Page Class | Responsibility |
|---|---|
| `LoginPage` | Fill credentials, submit, assert errors |
| `RegisterPage` | Fill registration form, assert errors and redirects |
| `DashboardPage` | Assert URL, greeting, role badge, logout |
| `VehiclesPage` | List vehicles, open add/edit forms, delete, tab switching |
| `VehicleDetailPage` | Open reservation modal, fill dates, assert success/error |
| `ReservationsPage` | Admin/Worker list, search, filter, approve/reject/complete |
| `MyReservationsPage` | Customer reservation list, cancel flow |
| `UsersPage` | Search, filter by role, edit role, delete, assert visibility |

## Environment Variables

Tests read credentials and the base URL from environment variables. Create a
`.env` file at the project root for local runs:

```
BASE_URL=https://rentivomk-frontend.vercel.app
ADMIN_EMAIL=admin@rentivomk.com
ADMIN_PASSWORD=Admin@123
WORKER_EMAIL=an30847@seeu.edu.mk
WORKER_PASSWORD=Test1234!
CUSTOMER_EMAIL=sg30841@seeu.edu.mk
CUSTOMER_PASSWORD=Test1234!
```

In CI these are provided as GitHub Actions secrets (see `.github/workflows/playwright.yml`).

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

### 4. Run in headed mode (watch the browser)

```
npm run test:headed
```

### 5. View the HTML report

```
npm run test:report
```

This opens the Playwright HTML report with pass/fail results, error details,
and screenshots, videos, and traces captured on any failures.

## CI/CD — GitHub Actions

The pipeline is defined in `.github/workflows/playwright.yml` and runs automatically
on every push or pull request to `main` or `master`. It installs Node 20, installs
dependencies, installs the Chromium browser, and runs the full test suite. The HTML
report is uploaded as an artifact retained for 14 days. Screenshots, videos, and
traces from failures are uploaded separately and retained for 7 days.

All secrets (`BASE_URL`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `WORKER_EMAIL`,
`WORKER_PASSWORD`, `CUSTOMER_EMAIL`, `CUSTOMER_PASSWORD`) are configured in the
GitHub repository's Settings → Secrets and variables → Actions.

## Test Configuration

Tests run serially (`workers: 1`, `fullyParallel: false`) to avoid interference
between tests that share database state. The global timeout is 45 seconds per test,
with a 10-second assertion timeout. Retries are enabled in CI (1 retry) but disabled
locally. On failure, screenshots, videos, and traces are automatically captured.

## What We Learned

- The Page Object Model makes a significant difference in maintainability. When
  locators or selectors need updating, there is a single place to change them
  rather than hunting through every test file.
- Testing role-based access control end-to-end reveals edge cases that are easy
  to miss — for example, verifying that navigation items themselves are hidden
  rather than just that pages redirect.
- Tests that depend on shared database state need to be written carefully. Since
  multiple tests create and consume reservations, the order of execution and
  cleanup matters.
- Dynamic content such as vehicle names and reservation dates requires helper
  functions (like `futureDate()`) and unique identifiers (like `Date.now()` in
  email addresses) to keep tests deterministic and independent.
- Playwright's `waitForTimeout` is sometimes necessary when dealing with a backend
  deployed on a free-tier service (Render), which can have cold-start delays that
  cause otherwise correct tests to time out.

## Challenges

The biggest challenge was that the backend is deployed on Render's free tier, which
spins down after inactivity. This introduced occasional latency that required generous
timeouts in certain tests to remain stable without becoming flaky.

Managing test isolation was also difficult since all tests share the same live
database. Tests that create reservations as a customer and then check them as an
admin need careful sequencing, and some tests defensively skip themselves if the
expected preconditions (such as an available vehicle or a pending reservation) are
not present.

## Future Improvements

- Add accessibility (WCAG) testing with axe-core across the main pages
- Add performance metric checks for page load and First Contentful Paint
- Add visual regression snapshot tests for key pages
- Run tests against a dedicated staging environment with a seeded database
  to eliminate dependency on shared live data and remove the need for
  `waitForTimeout` workarounds
- Expand coverage to include the complete booking-to-completion flow with
  admin approval in a single end-to-end scenario
- Add cross-browser testing on Firefox and WebKit once the suite is stable

## License

This project was created for educational purposes as part of university coursework.
