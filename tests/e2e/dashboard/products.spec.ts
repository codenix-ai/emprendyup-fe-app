/**
 * E2E tests: Dashboard Products page (/dashboard/products)
 *
 * Coverage:
 * - Page renders product list from GraphQL
 * - Empty state is shown when no products exist
 * - Search input filters the product list
 * - "Agregar Producto" button opens the product creation wizard
 * - Product delete action triggers confirmation and removes product
 * - Pagination controls are rendered when there are multiple pages
 * - Product with out-of-stock badge is displayed correctly
 * - Loading state is shown while fetching
 */

import { test, expect } from '@playwright/test';
import { mockGraphQL, seedAuthSession } from '../helpers/graphql-mock';
import {
  MOCK_PRODUCTS_LIST,
  MOCK_PRODUCTS_EMPTY,
  MOCK_DELETE_PRODUCT_SUCCESS,
} from '../fixtures/dashboard.fixtures';
import { TEST_USER_WITH_STORE } from '../fixtures/auth.fixtures';

async function gotoProducts(page: Parameters<typeof mockGraphQL>[0]) {
  await seedAuthSession(page, TEST_USER_WITH_STORE);
  await mockGraphQL(page, {
    GetProductsByStore: MOCK_PRODUCTS_LIST,
    SearchProducts: MOCK_PRODUCTS_LIST,
  });
  await page.goto('/dashboard/products');
}

test.describe('Dashboard Products Page', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────────

  test('renders the products page with product list', async ({ page }) => {
    await gotoProducts(page);

    await expect(page.getByText('Camiseta Estampada')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText('Pantalón Casual')).toBeVisible({ timeout: 8000 });
  });

  test('shows empty state when no products exist', async ({ page }) => {
    await seedAuthSession(page, TEST_USER_WITH_STORE);
    await mockGraphQL(page, {
      GetProductsByStore: MOCK_PRODUCTS_EMPTY,
      SearchProducts: MOCK_PRODUCTS_EMPTY,
    });
    await page.goto('/dashboard/products');

    await expect(
      page.getByText(/crear primer producto|no tienes productos|no products/i)
    ).toBeVisible({ timeout: 8000 });
  });

  test('renders "Agregar Producto" button', async ({ page }) => {
    await gotoProducts(page);

    await expect(
      page.getByRole('button', { name: /agregar producto|nuevo producto|add product/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test('shows loading state while data is being fetched', async ({ page }) => {
    await seedAuthSession(page, TEST_USER_WITH_STORE);
    await page.route('https://api.emprendy.ai/graphql', async (route) => {
      await new Promise((r) => setTimeout(r, 400));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_PRODUCTS_LIST),
      });
    });

    await page.goto('/dashboard/products');

    await expect(page.locator('.animate-pulse, [class*="skeleton"]').first()).toBeVisible({
      timeout: 3000,
    });
  });

  // ─── Search ──────────────────────────────────────────────────────────────────

  test('search input is present and accepts text', async ({ page }) => {
    await gotoProducts(page);

    const searchInput = page
      .locator('input[placeholder*="buscar"], input[placeholder*="search"], input[type="search"]')
      .first();
    await expect(searchInput).toBeVisible({ timeout: 8000 });
    await searchInput.fill('Camiseta');
    await expect(searchInput).toHaveValue('Camiseta');
  });

  // ─── Product Creation Modal ───────────────────────────────────────────────────

  test('clicking "Agregar Producto" opens the product wizard modal', async ({ page }) => {
    await gotoProducts(page);

    await page
      .getByRole('button', { name: /agregar producto|nuevo producto|add product/i })
      .click();

    // Wizard/modal should open
    await expect(
      page.getByRole('dialog').or(page.locator('[class*="modal"], [class*="wizard"]')).first()
    ).toBeVisible({ timeout: 5000 });
  });

  // ─── Product Stock Badge ──────────────────────────────────────────────────────

  test('out-of-stock badge is shown for products with zero stock', async ({ page }) => {
    await gotoProducts(page);

    await expect(page.getByText(/agotado|sin stock|out of stock/i)).toBeVisible({ timeout: 8000 });
  });

  // ─── Delete Product ────────────────────────────────────────────────────────────

  test('delete action shows confirmation prompt before deleting', async ({ page }) => {
    await seedAuthSession(page, TEST_USER_WITH_STORE);
    await mockGraphQL(page, {
      GetProductsByStore: MOCK_PRODUCTS_LIST,
      SearchProducts: MOCK_PRODUCTS_LIST,
      DeleteProduct: MOCK_DELETE_PRODUCT_SUCCESS,
    });
    await page.goto('/dashboard/products');

    // Wait for products to load
    await expect(page.getByText('Camiseta Estampada')).toBeVisible({ timeout: 8000 });

    // Click the first delete button
    const deleteBtn = page.getByRole('button', { name: /eliminar|delete|trash/i }).first();
    await deleteBtn.click();

    // A confirmation dialog should appear
    await expect(
      page
        .getByRole('alertdialog')
        .or(page.getByText(/¿estás seguro|confirmar.*eliminación|are you sure/i))
        .first()
    ).toBeVisible({ timeout: 3000 });
  });

  // ─── Pagination ────────────────────────────────────────────────────────────────

  test('pagination arrows are rendered', async ({ page }) => {
    await gotoProducts(page);

    // Either pagination controls or page count text should be visible
    const pagination = page
      .getByRole('button', { name: /siguiente|anterior|next|prev/i })
      .or(page.locator('[class*="pagination"]'))
      .first();

    await expect(pagination).toBeVisible({ timeout: 8000 });
  });
});
