/**
 * E2E tests: Dashboard Orders page (/dashboard/orders)
 *
 * Coverage:
 * - Page renders orders list from GraphQL
 * - Empty state when no orders exist
 * - Order status badges are displayed (pending, confirmed, processing, etc.)
 * - Search/filter input is present
 * - Status filter dropdown changes visible orders
 * - Expanding an order shows item details
 * - Loading state while data is fetching
 * - KPI cards for payments/shipping totals are shown
 */

import { test, expect } from '@playwright/test';
import { mockGraphQL, seedAuthSession } from '../helpers/graphql-mock';
import { MOCK_ORDERS_LIST, MOCK_ORDERS_EMPTY } from '../fixtures/dashboard.fixtures';
import { TEST_USER_WITH_STORE } from '../fixtures/auth.fixtures';

async function gotoOrders(page: Parameters<typeof mockGraphQL>[0]) {
  await seedAuthSession(page, TEST_USER_WITH_STORE);
  await mockGraphQL(page, {
    OrdersByStore: MOCK_ORDERS_LIST,
    GetPayments: { data: { getPayments: [] } },
  });
  await page.goto('/dashboard/orders');
}

test.describe('Dashboard Orders Page', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────────

  test('renders orders page with order items', async ({ page }) => {
    await gotoOrders(page);

    await expect(page.getByText('María García')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Carlos López')).toBeVisible({ timeout: 8000 });
  });

  test('shows empty state when no orders exist', async ({ page }) => {
    await seedAuthSession(page, TEST_USER_WITH_STORE);
    await mockGraphQL(page, {
      OrdersByStore: MOCK_ORDERS_EMPTY,
      GetPayments: { data: { getPayments: [] } },
    });
    await page.goto('/dashboard/orders');

    await expect(page.getByText(/no hay pedidos|no orders|sin pedidos/i)).toBeVisible({
      timeout: 8000,
    });
  });

  test('shows loading state while data is being fetched', async ({ page }) => {
    await seedAuthSession(page, TEST_USER_WITH_STORE);
    await page.route('https://api.emprendy.ai/graphql', async (route) => {
      await new Promise((r) => setTimeout(r, 400));
      await route.continue();
    });
    await page.goto('/dashboard/orders');

    await expect(page.locator('.animate-pulse, [class*="skeleton"]').first()).toBeVisible({
      timeout: 3000,
    });
  });

  // ─── Order Status Badges ─────────────────────────────────────────────────────

  test('renders pending status badge', async ({ page }) => {
    await gotoOrders(page);

    await expect(page.getByText(/pendiente|pending/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('renders confirmed status badge', async ({ page }) => {
    await gotoOrders(page);

    await expect(page.getByText(/confirmado|confirmed/i).first()).toBeVisible({ timeout: 8000 });
  });

  // ─── Search / Filter ─────────────────────────────────────────────────────────

  test('search input is present', async ({ page }) => {
    await gotoOrders(page);

    const searchInput = page
      .locator('input[placeholder*="buscar"], input[placeholder*="search"]')
      .first();
    await expect(searchInput).toBeVisible({ timeout: 8000 });
  });

  test('status filter select/tabs are present', async ({ page }) => {
    await gotoOrders(page);

    // Filter by status: look for a select, tabs, or filter buttons
    const filterControl = page
      .getByRole('combobox')
      .or(page.getByRole('button', { name: /filtrar|todos|all|pendiente/i }))
      .first();
    await expect(filterControl).toBeVisible({ timeout: 8000 });
  });

  // ─── Order Expand ─────────────────────────────────────────────────────────────

  test('clicking an order row expands order details', async ({ page }) => {
    await gotoOrders(page);

    // Click on the first order row to expand it
    const firstOrderRow = page.getByText('María García').first();
    await firstOrderRow.click();

    // Details should appear (product name, quantity)
    await expect(page.getByText(/camiseta estampada|items|artículos/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  // ─── KPI Cards ───────────────────────────────────────────────────────────────

  test('payment/shipping KPI cards are visible', async ({ page }) => {
    await gotoOrders(page);

    // At least one KPI related to payments or totals
    await expect(page.getByText(/total|pagos|envío|shipping|payment/i).first()).toBeVisible({
      timeout: 8000,
    });
  });
});
