// ─────────────────────────────────────────────
//  emprendy.ai — E2E: Crear Tienda
// ─────────────────────────────────────────────
import { test, expect, Page } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

async function login(page: Page) {
  await page.goto(`${BASE}/login`);
  await page.fill('[data-testid="email"]', process.env.TEST_USER_EMAIL ?? 'test@emprendy.ai');
  await page.fill('[data-testid="password"]', process.env.TEST_USER_PASSWORD ?? 'Test123!');
  await page.click('[data-testid="login-btn"]');
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
}

test.describe('Módulo: Crear Tienda', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('TC-STORE-001: Crear tienda con datos mínimos', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/stores/new`);

    await page.fill('[data-testid="store-name"]', 'Mi Tienda Test');
    await page.fill('[data-testid="store-description"]', 'Descripción de prueba para tienda');
    await page.selectOption('[data-testid="store-category"]', 'retail');
    await page.fill('[data-testid="store-email"]', 'tienda@test.com');

    await page.click('[data-testid="save-store-btn"]');

    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible({ timeout: 8000 });
    await expect(page).toHaveURL(/\/dashboard\/stores\/\d+/);
  });

  test('TC-STORE-002: Validación de campos obligatorios', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/stores/new`);

    await page.click('[data-testid="save-store-btn"]');

    await expect(page.locator('[data-testid="error-store-name"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-store-category"]')).toBeVisible();
    await expect(page.locator('[data-testid="error-store-email"]')).toBeVisible();
  });

  test('TC-STORE-003: Subida de logo e imagen de portada', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/stores/new`);

    await page.fill('[data-testid="store-name"]', 'Tienda con Imagen');
    await page.selectOption('[data-testid="store-category"]', 'retail');
    await page.fill('[data-testid="store-email"]', 'img@test.com');

    // Upload logo
    const logoInput = page.locator('[data-testid="logo-upload"]');
    await logoInput.setInputFiles('tests/fixtures/logo-test.png');
    await expect(page.locator('[data-testid="logo-preview"]')).toBeVisible({ timeout: 5000 });

    // Upload cover
    const coverInput = page.locator('[data-testid="cover-upload"]');
    await coverInput.setInputFiles('tests/fixtures/cover-test.jpg');
    await expect(page.locator('[data-testid="cover-preview"]')).toBeVisible({ timeout: 5000 });

    await page.click('[data-testid="save-store-btn"]');
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible({ timeout: 8000 });
  });

  test('TC-STORE-004: Persistencia — datos guardados sobreviven recarga', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/stores/new`);

    const storeName = `Tienda Persistencia ${Date.now()}`;
    await page.fill('[data-testid="store-name"]', storeName);
    await page.selectOption('[data-testid="store-category"]', 'services');
    await page.fill('[data-testid="store-email"]', 'persist@test.com');
    await page.fill('[data-testid="store-phone"]', '+57 300 000 0000');

    await page.click('[data-testid="save-store-btn"]');
    await page.waitForURL(/\/dashboard\/stores\/\d+/);

    const url = page.url();
    await page.reload();

    await expect(page.locator('[data-testid="store-name-display"]')).toHaveText(storeName);
    await expect(page).toHaveURL(url);
  });

  test('TC-STORE-005: Editar tienda existente', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/stores`);

    await page.click('[data-testid="store-item"]:first-child [data-testid="edit-btn"]');
    await page.waitForURL(/\/dashboard\/stores\/\d+\/edit/);

    const newName = `Tienda Editada ${Date.now()}`;
    await page.fill('[data-testid="store-name"]', newName);
    await page.click('[data-testid="save-store-btn"]');

    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible({ timeout: 8000 });
    await expect(page.locator('[data-testid="store-name-display"]')).toHaveText(newName);
  });

  test('TC-STORE-006: Desactivar y reactivar tienda', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/stores`);
    await page.click('[data-testid="store-item"]:first-child');
    await page.waitForURL(/\/dashboard\/stores\/\d+/);

    await page.click('[data-testid="deactivate-store-btn"]');
    await page.click('[data-testid="confirm-deactivate-btn"]');
    await expect(page.locator('[data-testid="store-status"]')).toHaveText(/inactiv/i);

    await page.click('[data-testid="activate-store-btn"]');
    await expect(page.locator('[data-testid="store-status"]')).toHaveText(/activ/i);
  });

  test('TC-STORE-007: Tienda aparece en listado público', async ({ page, context }) => {
    // Ir al perfil público
    const storeSlug = await page.locator('[data-testid="store-slug"]').first().textContent();
    const publicPage = await context.newPage();
    await publicPage.goto(`${BASE}/store/${storeSlug}`);

    await expect(publicPage.locator('[data-testid="public-store-name"]')).toBeVisible();
    await expect(publicPage.locator('[data-testid="public-store-products"]')).toBeVisible();
    await publicPage.close();
  });
});
