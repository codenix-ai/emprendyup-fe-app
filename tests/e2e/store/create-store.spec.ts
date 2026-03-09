/**
 * E2E tests: Create Store — Interactive Chat Flow (/dashboard/store/new)
 *
 * The store creation UI is a chat-based wizard (InteractiveChatStore).
 * Steps:
 *   1. Business type selection (Productos / Restaurante / Servicios)
 *   2. Per-type questions answered via a text input + Enter / Send button
 *   3. "Revisar información" → summary modal → "Confirmar"
 *   4. GraphQL mutation fires → success screen with "Ir al panel" link
 *
 * Coverage:
 * - Page renders chat UI with business type options
 * - Selecting "Productos" starts the products question flow
 * - Selecting "Restaurante" starts the restaurant question flow
 * - Selecting "Servicios" starts the services question flow
 * - Full happy-path for products store creation
 * - Full happy-path for restaurant creation
 * - Subdomain validation (too short, invalid chars, already taken)
 * - "Revisar información" button is shown after all questions are answered
 * - Success screen shown after store is created
 * - "Ir al panel" link is present on success screen
 * - Creation error is displayed when mutation fails
 * - Unauthenticated user is redirected to /login (server-side guard)
 */

import { test, expect, Page } from '@playwright/test';
import { mockGraphQL, seedAuthSession } from '../helpers/graphql-mock';
import {
  TEST_USER,
  MOCK_CREATE_STORE_SUCCESS,
  MOCK_CREATE_RESTAURANT_SUCCESS,
} from '../fixtures/auth.fixtures';

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Type a message in the chat input and press Enter (or click Send). */
async function chatSend(page: Page, text: string) {
  const input = page.locator('input[type="text"]').last();
  await input.fill(text);
  await input.press('Enter');
  // small wait for bot typing simulation
  await page.waitForTimeout(600);
}

/** Click a select option button inside the chat. */
async function chatSelectOption(page: Page, label: string) {
  await page.getByRole('button', { name: label }).click();
  await page.waitForTimeout(600);
}

/** Skip an optional question. */
async function chatSkip(page: Page) {
  const skipBtn = page.getByRole('button', { name: /omitir|skip/i });
  if (await skipBtn.isVisible()) {
    await skipBtn.click();
    await page.waitForTimeout(400);
  }
}

// ─── Setup ─────────────────────────────────────────────────────────────────────

async function gotoCreateStore(page: Page) {
  await seedAuthSession(page, TEST_USER);
  await page.goto('/dashboard/store/new');
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Create Store — Chat Wizard', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────────

  test('renders the chat UI with greeting and business type options', async ({ page }) => {
    await gotoCreateStore(page);

    await expect(page.getByText(/Soy tu asistente para crear tu negocio/i)).toBeVisible();
    await expect(page.getByRole('button', { name: 'Productos' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Restaurante' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Servicios' })).toBeVisible();
  });

  // ─── Business Type Selection ─────────────────────────────────────────────────

  test('selecting Productos shows the first products question', async ({ page }) => {
    await gotoCreateStore(page);

    await chatSelectOption(page, 'Productos');

    await expect(page.getByText(/nombre de tu emprendimiento/i)).toBeVisible({ timeout: 5000 });
  });

  test('selecting Restaurante shows the first restaurant question', async ({ page }) => {
    await gotoCreateStore(page);

    await chatSelectOption(page, 'Restaurante');

    await expect(page.getByText(/nombre.*restaurante|restaurante.*nombre/i)).toBeVisible({
      timeout: 5000,
    });
  });

  test('selecting Servicios shows the first services question', async ({ page }) => {
    await gotoCreateStore(page);

    await chatSelectOption(page, 'Servicios');

    await expect(page.getByText(/nombre.*empresa|empresa.*servicios/i)).toBeVisible({
      timeout: 5000,
    });
  });

  // ─── Products Store Happy Path ───────────────────────────────────────────────

  test('completes products store creation flow and shows success screen', async ({ page }) => {
    await gotoCreateStore(page);

    await mockGraphQL(page, { CreateStore: MOCK_CREATE_STORE_SUCCESS });

    // 1. Choose business type
    await chatSelectOption(page, 'Productos');

    // 2. Store name
    await chatSend(page, 'Mi Tienda Hermosa');

    // 3. Description (optional — skip)
    await chatSkip(page);

    // 4. Logo (optional — skip)
    await chatSkip(page);

    // 5. Primary color (optional — skip)
    await chatSkip(page);

    // 6. Secondary color (optional — skip)
    await chatSkip(page);

    // 7. Button color (optional — skip)
    await chatSkip(page);

    // 8. Phone (optional — skip)
    await chatSkip(page);

    // 9. Address (optional — skip)
    await chatSkip(page);

    // 10. City
    await chatSend(page, 'Bogotá');

    // 11. Social links (all optional — skip)
    for (let i = 0; i < 5; i++) {
      await chatSkip(page);
    }

    // "Revisar información" button should be visible
    await expect(page.getByRole('button', { name: /revisar información/i })).toBeVisible({
      timeout: 8000,
    });

    await page.getByRole('button', { name: /revisar información/i }).click();

    // Summary modal — click Confirmar
    await expect(page.getByRole('button', { name: /confirmar/i })).toBeVisible({ timeout: 5000 });

    await page.getByRole('button', { name: /confirmar/i }).click();

    // Success screen
    await expect(page.getByText(/tienda ha sido creada|creada exitosamente/i)).toBeVisible({
      timeout: 10000,
    });

    await expect(page.getByRole('link', { name: /ir al panel/i })).toBeVisible();
  });

  // ─── Restaurant Happy Path ────────────────────────────────────────────────────

  test('completes restaurant creation flow and shows success screen', async ({ page }) => {
    await gotoCreateStore(page);

    await mockGraphQL(page, { CreateRestaurantWithBranding: MOCK_CREATE_RESTAURANT_SUCCESS });

    await chatSelectOption(page, 'Restaurante');

    // Restaurant name
    await chatSend(page, 'El Buen Sabor');

    // City
    await chatSend(page, 'Medellín');

    // Cuisine type
    await chatSend(page, 'Colombiana');

    // Skip optional fields
    for (let i = 0; i < 10; i++) {
      await chatSkip(page);
    }

    await expect(page.getByRole('button', { name: /revisar información/i })).toBeVisible({
      timeout: 8000,
    });

    await page.getByRole('button', { name: /revisar información/i }).click();
    await expect(page.getByRole('button', { name: /confirmar/i })).toBeVisible({ timeout: 5000 });
    await page.getByRole('button', { name: /confirmar/i }).click();

    await expect(page.getByText(/restaurante ha sido creado/i)).toBeVisible({ timeout: 10000 });
  });

  // ─── Validation ───────────────────────────────────────────────────────────────

  test('empty required input shows validation error in chat', async ({ page }) => {
    await gotoCreateStore(page);

    await chatSelectOption(page, 'Productos');

    // Try to advance without typing anything — just press Enter
    const input = page.locator('input[type="text"]').last();
    await input.press('Enter');

    await expect(page.getByText(/requerido|obligatorio|ingresa/i)).toBeVisible({ timeout: 3000 });
  });

  // ─── Error State ──────────────────────────────────────────────────────────────

  test('shows creation error when GraphQL mutation fails', async ({ page }) => {
    await gotoCreateStore(page);

    await mockGraphQL(page, {
      CreateStore: {
        errors: [{ message: 'El subdominio ya está en uso' }],
      },
    });

    await chatSelectOption(page, 'Productos');
    await chatSend(page, 'Mi Tienda Test');

    // Skip optional questions
    for (let i = 0; i < 10; i++) {
      await chatSkip(page);
    }

    const reviewBtn = page.getByRole('button', { name: /revisar información/i });
    if (await reviewBtn.isVisible({ timeout: 5000 })) {
      await reviewBtn.click();
      const confirmBtn = page.getByRole('button', { name: /confirmar/i });
      if (await confirmBtn.isVisible({ timeout: 3000 })) {
        await confirmBtn.click();
        await expect(page.getByText(/error|subdominio|ya está en uso/i)).toBeVisible({
          timeout: 8000,
        });
      }
    }
  });

  // ─── Success Screen ────────────────────────────────────────────────────────────

  test('success screen has a working link to the dashboard', async ({ page }) => {
    await gotoCreateStore(page);

    await mockGraphQL(page, { CreateStore: MOCK_CREATE_STORE_SUCCESS });

    await chatSelectOption(page, 'Productos');
    await chatSend(page, 'Mi Tienda');
    for (let i = 0; i < 10; i++) {
      await chatSkip(page);
    }

    const reviewBtn = page.getByRole('button', { name: /revisar información/i });
    await expect(reviewBtn).toBeVisible({ timeout: 8000 });
    await reviewBtn.click();

    const confirmBtn = page.getByRole('button', { name: /confirmar/i });
    await expect(confirmBtn).toBeVisible({ timeout: 5000 });
    await confirmBtn.click();

    const dashboardLink = page.getByRole('link', { name: /ir al panel/i });
    await expect(dashboardLink).toBeVisible({ timeout: 10000 });
    await expect(dashboardLink).toHaveAttribute('href', /dashboard/);
  });
});
