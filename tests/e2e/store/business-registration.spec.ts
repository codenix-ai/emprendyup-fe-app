/**
 * E2E tests: Business/Entrepreneur Registration form (/registro)
 *
 * This is a public-facing form where entrepreneurs register their business
 * on the EmprendYup platform (separate from user account creation).
 *
 * Coverage:
 * - Page renders the registration form
 * - Required fields are validated on submit
 * - Successful submission shows confirmation state
 * - Category and referralSource dropdowns are present and selectable
 * - Network error is handled gracefully
 */

import { test, expect } from '@playwright/test';
import { mockGraphQL } from '../helpers/graphql-mock';

const MOCK_CREATE_ENTREPRENEUR_SUCCESS = {
  data: {
    createEntrepreneur: {
      id: 'entrepreneur-id-123',
      companyName: 'Mi Empresa Test',
      country: 'Colombia',
      city: 'Bogotá',
      name: 'Juan Test',
      description: 'Una empresa de prueba',
      phone: '3001234567',
      website: '',
      email: 'empresa@test.com',
      category: 'TECHNOLOGY',
      createdAt: '2024-01-01T00:00:00.000Z',
      referralSource: 'GOOGLE',
    },
  },
};

const MOCK_CREATE_ENTREPRENEUR_ERROR = {
  errors: [{ message: 'El correo ya está registrado' }],
};

test.describe('Business Registration Form (/registro)', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/registro');
  });

  // ─── Rendering ──────────────────────────────────────────────────────────────

  test('renders the business registration form with all key fields', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /registra tu emprendimiento/i })).toBeVisible();
    await expect(
      page.getByPlaceholder(/nombre del emprendimiento|mi emprendimiento/i)
    ).toBeVisible();
    await expect(page.getByPlaceholder(/nombre del emprendedor/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /registrar|registrarse|enviar/i })).toBeVisible();
  });

  test('renders category and referralSource select dropdowns', async ({ page }) => {
    // Category dropdown
    await expect(page.getByRole('combobox').first()).toBeVisible();
    // There should be at least 2 selects (category + referralSource)
    expect(await page.getByRole('combobox').count()).toBeGreaterThanOrEqual(2);
  });

  // ─── Successful Registration ─────────────────────────────────────────────────

  test('successful business registration shows confirmation', async ({ page }) => {
    await mockGraphQL(page, { CreateEntrepreneur: MOCK_CREATE_ENTREPRENEUR_SUCCESS });

    await page
      .getByPlaceholder(/nombre del emprendimiento|mi emprendimiento/i)
      .fill('Mi Empresa Test');
    await page.getByPlaceholder(/nombre del emprendedor/i).fill('Juan Test');

    // Fill optional fields if visible
    const emailInput = page.locator('input[type="email"]');
    if (await emailInput.isVisible()) {
      await emailInput.fill('empresa@test.com');
    }

    const phoneInput = page.locator(
      'input[placeholder*="telefono"], input[placeholder*="teléfono"], input[type="tel"]'
    );
    if (await phoneInput.isVisible()) {
      await phoneInput.fill('3001234567');
    }

    // Select category
    const selects = page.getByRole('combobox');
    await selects.nth(0).selectOption({ index: 1 });
    await selects.nth(1).selectOption({ index: 1 });

    await page.getByRole('button', { name: /registrar|registrarse|enviar/i }).click();

    // Should show success state
    await expect(page.getByText(/registrado.*exitosamente|éxito|gracias|enviado/i)).toBeVisible({
      timeout: 6000,
    });
  });

  // ─── Validation ───────────────────────────────────────────────────────────────

  test('shows validation errors when required fields are empty', async ({ page }) => {
    await page.getByRole('button', { name: /registrar|registrarse|enviar/i }).click();

    // React Hook Form required errors
    await expect(page.getByText(/campo.*requerido|requerido|required/i).first()).toBeVisible({
      timeout: 3000,
    });
  });

  test('shows error when companyName is missing', async ({ page }) => {
    await mockGraphQL(page, { CreateEntrepreneur: MOCK_CREATE_ENTREPRENEUR_SUCCESS });

    // Only fill name, leave companyName empty
    await page.getByPlaceholder(/nombre del emprendedor/i).fill('Juan Test');
    await page.getByRole('button', { name: /registrar|registrarse|enviar/i }).click();

    await expect(page.getByText(/requerido|required/i).first()).toBeVisible({ timeout: 3000 });
  });

  // ─── Error Handling ────────────────────────────────────────────────────────────

  test('shows error when GraphQL mutation fails', async ({ page }) => {
    await mockGraphQL(page, { CreateEntrepreneur: MOCK_CREATE_ENTREPRENEUR_ERROR });

    await page.getByPlaceholder(/nombre del emprendimiento|mi emprendimiento/i).fill('Mi Empresa');
    await page.getByPlaceholder(/nombre del emprendedor/i).fill('Juan Test');

    const selects = page.getByRole('combobox');
    await selects.nth(0).selectOption({ index: 1 });
    await selects.nth(1).selectOption({ index: 1 });

    await page.getByRole('button', { name: /registrar|registrarse|enviar/i }).click();

    await expect(page.getByText(/error|ya está registrado/i)).toBeVisible({ timeout: 6000 });
  });

  // ─── Category Options ──────────────────────────────────────────────────────────

  test('category dropdown contains expected options', async ({ page }) => {
    const categorySelect = page.getByRole('combobox').first();
    const options = await categorySelect.locator('option').allTextContents();

    const expectedCategories = ['Tecnología', 'Comida', 'Moda', 'Educación', 'Salud', 'Otro'];
    for (const cat of expectedCategories) {
      expect(options).toContain(cat);
    }
  });

  test('referralSource dropdown contains expected options', async ({ page }) => {
    const selects = page.getByRole('combobox');
    const referralSelect = selects.nth(1);
    const options = await referralSelect.locator('option').allTextContents();

    const expectedSources = ['Google', 'Redes Sociales', 'Amigo', 'Evento', 'Publicidad', 'Otro'];
    for (const source of expectedSources) {
      expect(options).toContain(source);
    }
  });
});
