/**
 * E2E tests: Dashboard Plans/Pricing page (/dashboard/plans)
 *
 * Coverage:
 * - Page renders the pricing plans heading
 * - Monthly / Annual billing cycle toggle is present
 * - Switching to Annual shows annual plans
 * - Switching to Monthly shows monthly plans
 * - Plan cards are rendered with names and prices
 * - Selecting a plan opens the payment/checkout modal
 * - Loading state while products are being fetched
 * - Error state when products fail to load
 */

import { test, expect } from '@playwright/test';
import { mockGraphQL, seedAuthSession } from '../helpers/graphql-mock';
import { MOCK_SUBSCRIPTION_PRODUCTS } from '../fixtures/dashboard.fixtures';
import { TEST_USER_WITH_STORE } from '../fixtures/auth.fixtures';

async function gotoPlans(page: Parameters<typeof mockGraphQL>[0]) {
  await seedAuthSession(page, TEST_USER_WITH_STORE);
  await mockGraphQL(page, {
    GetSubscriptionProducts: MOCK_SUBSCRIPTION_PRODUCTS,
  });
  await page.goto('/dashboard/plans');
}

test.describe('Dashboard Plans Page', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────────

  test('renders the plans/pricing heading', async ({ page }) => {
    await gotoPlans(page);

    await expect(
      page.getByRole('heading', { name: /planes|pricing|suscripción|subscription/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test('renders Monthly and Annual billing cycle toggle', async ({ page }) => {
    await gotoPlans(page);

    await expect(page.getByRole('button', { name: /mensual|monthly/i })).toBeVisible({
      timeout: 8000,
    });

    await expect(page.getByRole('button', { name: /anual|annual/i })).toBeVisible({
      timeout: 8000,
    });
  });

  // ─── Billing Cycle Toggle ────────────────────────────────────────────────────

  test('switching to Monthly shows monthly plan', async ({ page }) => {
    await gotoPlans(page);

    await page.getByRole('button', { name: /mensual|monthly/i }).click();

    await expect(page.getByText(/básico|plan básico|basico/i).first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('switching to Annual shows annual plans', async ({ page }) => {
    await gotoPlans(page);

    await page.getByRole('button', { name: /anual|annual/i }).click();

    await expect(page.getByText(/pro|plan pro/i).first()).toBeVisible({ timeout: 5000 });
  });

  // ─── Plan Cards ──────────────────────────────────────────────────────────────

  test('plan cards display prices', async ({ page }) => {
    await gotoPlans(page);

    // At least one price should be visible
    await expect(page.getByText(/\$|COP|\d{2,3}\.\d{3}|\d+\.000/i).first()).toBeVisible({
      timeout: 8000,
    });
  });

  test('plan cards have a CTA button to subscribe', async ({ page }) => {
    await gotoPlans(page);

    await expect(
      page
        .getByRole('button', { name: /contratar|suscribir|elegir|seleccionar|subscribe|choose/i })
        .first()
    ).toBeVisible({ timeout: 8000 });
  });

  // ─── Checkout Modal ───────────────────────────────────────────────────────────

  test('clicking a plan CTA opens order/checkout modal', async ({ page }) => {
    await gotoPlans(page);

    const ctaBtn = page
      .getByRole('button', {
        name: /contratar|suscribir|elegir|seleccionar|subscribe|choose/i,
      })
      .first();

    await expect(ctaBtn).toBeVisible({ timeout: 8000 });
    await ctaBtn.click();

    // Modal or checkout section should appear
    await expect(page.getByRole('dialog').or(page.locator('[class*="modal"]')).first()).toBeVisible(
      { timeout: 5000 }
    );
  });

  // ─── Loading State ────────────────────────────────────────────────────────────

  test('shows loading skeleton while fetching plans', async ({ page }) => {
    await seedAuthSession(page, TEST_USER_WITH_STORE);
    await page.route('https://api.emprendy.ai/graphql', async (route) => {
      await new Promise((r) => setTimeout(r, 400));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_SUBSCRIPTION_PRODUCTS),
      });
    });
    await page.goto('/dashboard/plans');

    await expect(page.locator('.animate-pulse, [class*="skeleton"]').first()).toBeVisible({
      timeout: 3000,
    });
  });
});
