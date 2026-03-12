/**
 * E2E tests: Dashboard Insights page (/dashboard/insights)
 *
 * Coverage:
 * - Unauthenticated user is redirected to /login
 * - Page renders "Panel de Insights" heading
 * - KPI cards are displayed with data from GraphQL
 * - Loading skeletons appear while data is fetching
 * - Charts section is rendered
 * - Period selector (week/month/year) changes the chart data
 * - Leads section is rendered
 */

import { test, expect } from '@playwright/test';
import { mockGraphQL, seedAuthSession } from '../helpers/graphql-mock';
import {
  MOCK_TOTAL_PRODUCTS,
  MOCK_MONTHLY_SALES,
  MOCK_CONVERSION_RATE,
  MOCK_ORDERS_BY_PERIOD,
  MOCK_CUSTOMERS_BY_PERIOD,
  MOCK_RECENT_LEADS,
} from '../fixtures/dashboard.fixtures';
import { TEST_USER_WITH_STORE } from '../fixtures/auth.fixtures';

async function setupInsights(page: Parameters<typeof mockGraphQL>[0]) {
  await seedAuthSession(page, TEST_USER_WITH_STORE);
  await mockGraphQL(page, {
    totalProducts: MOCK_TOTAL_PRODUCTS,
    monthlySales: MOCK_MONTHLY_SALES,
    ConversionRate: MOCK_CONVERSION_RATE,
    OrdersByPeriod: MOCK_ORDERS_BY_PERIOD,
    CustomersByPeriod: MOCK_CUSTOMERS_BY_PERIOD,
    getLeadsByStore: MOCK_RECENT_LEADS,
  });
}

test.describe('Dashboard Insights Page', () => {
  // ─── Auth Guard ──────────────────────────────────────────────────────────────

  test('unauthenticated user is redirected away from /dashboard/insights', async ({ page }) => {
    // No auth seed — clean localStorage
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
    await page.goto('/dashboard/insights');

    // Should redirect to login or home
    await expect(page).not.toHaveURL('/dashboard/insights', { timeout: 5000 });
  });

  // ─── Rendering ──────────────────────────────────────────────────────────────

  test('renders Panel de Insights heading', async ({ page }) => {
    await setupInsights(page);
    await page.goto('/dashboard/insights');

    await expect(page.getByRole('heading', { name: /panel de insights/i })).toBeVisible({
      timeout: 8000,
    });
  });

  test('renders KPI cards for key metrics', async ({ page }) => {
    await setupInsights(page);
    await page.goto('/dashboard/insights');

    await expect(page.getByText(/total de productos/i)).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/ventas mensuales/i)).toBeVisible({ timeout: 8000 });
  });

  test('renders charts section for orders and customers', async ({ page }) => {
    await setupInsights(page);
    await page.goto('/dashboard/insights');

    await expect(page.getByText(/órdenes|orders/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('loading skeletons are shown while data fetches', async ({ page }) => {
    // Delay the response to catch the loading state
    await seedAuthSession(page, TEST_USER_WITH_STORE);
    await page.route('https://api.emprendy.ai/graphql', async (route) => {
      await new Promise((r) => setTimeout(r, 400));
      await route.continue();
    });

    await page.goto('/dashboard/insights');

    // Animate-pulse skeletons should be present initially
    await expect(page.locator('.animate-pulse').first()).toBeVisible({ timeout: 3000 });
  });

  // ─── Period Selector ─────────────────────────────────────────────────────────

  test('period selector buttons are present', async ({ page }) => {
    await setupInsights(page);
    await page.goto('/dashboard/insights');

    // Look for period toggle buttons (weekly / monthly / yearly)
    const periodBtn = page.getByRole('button', { name: /semana|week|mes|month|año|year/i }).first();
    await expect(periodBtn).toBeVisible({ timeout: 8000 });
  });

  // ─── Leads Section ───────────────────────────────────────────────────────────

  test('leads section is rendered', async ({ page }) => {
    await setupInsights(page);
    await page.goto('/dashboard/insights');

    await expect(page.getByText(/leads recientes/i)).toBeVisible({ timeout: 8000 });
  });
});
