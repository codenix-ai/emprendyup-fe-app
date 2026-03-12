// ─────────────────────────────────────────────
//  emprendy.ai — E2E: Crear Restaurante
// ─────────────────────────────────────────────
import { test, expect, Page } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

async function login(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.fill('[data-testid="email"]', process.env.TEST_USER_EMAIL!);
  await page.fill('[data-testid="password"]', process.env.TEST_USER_PASSWORD!);
  await page.click('[data-testid="login-btn"]');
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
}

test.describe('Módulo: Crear Restaurante', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('TC-REST-001: Crear restaurante con info básica', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/restaurants/new`);

    await page.fill('[data-testid="restaurant-name"]', 'Restaurante Test Emprendy');
    await page.fill('[data-testid="restaurant-description"]', 'El mejor restaurante de la ciudad');
    await page.fill('[data-testid="restaurant-address"]', 'Calle 123 #45-67, Bogotá');
    await page.fill('[data-testid="restaurant-phone"]', '+57 300 000 0000');
    await page.selectOption('[data-testid="restaurant-cuisine"]', 'colombian');

    // Horarios
    await page.check('[data-testid="open-monday"]');
    await page.fill('[data-testid="open-time-monday"]', '09:00');
    await page.fill('[data-testid="close-time-monday"]', '21:00');

    await page.click('[data-testid="save-restaurant-btn"]');
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible({ timeout: 8000 });
  });

  test('TC-REST-002: Agregar productos al menú', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/restaurants`);
    await page.click('[data-testid="restaurant-item"]:first-child [data-testid="manage-menu-btn"]');

    await page.click('[data-testid="add-product-btn"]');
    await page.fill('[data-testid="product-name"]', 'Bandeja Paisa');
    await page.fill('[data-testid="product-description"]', 'El plato más representativo');
    await page.fill('[data-testid="product-price"]', '28000');
    await page.selectOption('[data-testid="product-category"]', 'platos-principales');

    await page.click('[data-testid="save-product-btn"]');
    await expect(
      page.locator('[data-testid="product-item"]').filter({ hasText: 'Bandeja Paisa' })
    ).toBeVisible();
  });

  test('TC-REST-003: Configurar variantes (tamaños)', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/restaurants`);
    await page.click('[data-testid="restaurant-item"]:first-child [data-testid="manage-menu-btn"]');
    await page.click('[data-testid="product-item"]:first-child [data-testid="edit-product-btn"]');

    await page.click('[data-testid="add-variant-btn"]');
    await page.fill('[data-testid="variant-name-0"]', 'Pequeño');
    await page.fill('[data-testid="variant-price-0"]', '15000');

    await page.click('[data-testid="add-variant-btn"]');
    await page.fill('[data-testid="variant-name-1"]', 'Grande');
    await page.fill('[data-testid="variant-price-1"]', '25000');

    await page.click('[data-testid="save-product-btn"]');
    await expect(page.locator('[data-testid="variant-item"]')).toHaveCount(2);
  });

  test('TC-REST-004: Configurar zona de entrega', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/restaurants`);
    await page.click(
      '[data-testid="restaurant-item"]:first-child [data-testid="delivery-settings-btn"]'
    );

    await page.fill('[data-testid="delivery-radius"]', '5');
    await page.fill('[data-testid="min-order-amount"]', '20000');
    await page.fill('[data-testid="delivery-fee"]', '5000');
    await page.check('[data-testid="enable-delivery"]');

    await page.click('[data-testid="save-delivery-btn"]');
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible({ timeout: 5000 });
  });

  test('TC-REST-005: Vista previa del menú digital y QR', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/restaurants`);
    await page.click('[data-testid="restaurant-item"]:first-child');

    await page.click('[data-testid="preview-menu-btn"]');
    await expect(page.locator('[data-testid="menu-preview-modal"]')).toBeVisible();
    await expect(page.locator('[data-testid="qr-code-image"]')).toBeVisible();

    const qrSrc = await page.locator('[data-testid="qr-code-image"]').getAttribute('src');
    expect(qrSrc).toBeTruthy();
  });

  test('TC-REST-006: Sincronización de inventario en tiempo real', async ({ page, context }) => {
    await page.goto(`${BASE}/dashboard/restaurants`);
    await page.click('[data-testid="restaurant-item"]:first-child [data-testid="manage-menu-btn"]');
    await page.click(
      '[data-testid="product-item"]:first-child [data-testid="toggle-availability"]'
    );

    // Verificar en página pública
    const storeSlug = await page
      .locator('[data-testid="restaurant-slug"]')
      .getAttribute('data-slug');
    const pubPage = await context.newPage();
    await pubPage.goto(`${BASE}/menu/${storeSlug}`);

    await expect(pubPage.locator('[data-testid="product-unavailable"]').first()).toBeVisible({
      timeout: 5000,
    });
    await pubPage.close();
  });
});
