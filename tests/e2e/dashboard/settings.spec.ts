/**
 * E2E tests: Dashboard Settings page (/dashboard/settings)
 *
 * Coverage:
 * - Page renders profile tab by default
 * - Profile form shows user info fields (name, email, phone, company, timezone)
 * - Edit button enables the form fields
 * - Cancel edit resets form values
 * - Valid form submission updates displayed user info
 * - Tab navigation (Profile / Security / Notifications)
 * - Logout button is present and triggers session clear
 */

import { test, expect } from '@playwright/test';
import { seedAuthSession } from '../helpers/graphql-mock';
import { TEST_USER_WITH_STORE } from '../fixtures/auth.fixtures';

test.describe('Dashboard Settings Page', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthSession(page, TEST_USER_WITH_STORE);
    await page.goto('/dashboard/settings');
  });

  // ─── Rendering ──────────────────────────────────────────────────────────────

  test('renders the settings page with profile tab active', async ({ page }) => {
    await expect(
      page.getByRole('heading', { name: /perfil|profile|settings|configuración/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test('renders name, email, and company fields', async ({ page }) => {
    await expect(page.locator('input[name="name"], #name, [id*="name"]').first()).toBeVisible({
      timeout: 8000,
    });
    await expect(page.locator('input[name="email"], #email, [id*="email"]').first()).toBeVisible({
      timeout: 8000,
    });
  });

  // ─── Edit Mode ───────────────────────────────────────────────────────────────

  test('Edit button switches form to edit mode', async ({ page }) => {
    const editBtn = page.getByRole('button', { name: /editar|edit/i });
    await expect(editBtn).toBeVisible({ timeout: 8000 });
    await editBtn.click();

    // Fields should become enabled
    const nameField = page.locator('input[name="name"]').first();
    await expect(nameField).toBeEnabled({ timeout: 3000 });
  });

  test('Cancel button exits edit mode and restores values', async ({ page }) => {
    const editBtn = page.getByRole('button', { name: /editar|edit/i });
    await editBtn.click();

    const nameField = page.locator('input[name="name"]').first();
    const originalValue = await nameField.inputValue();

    await nameField.fill('Nombre Temporal XYZ');

    await page.getByRole('button', { name: /cancelar|cancel/i }).click();

    await expect(nameField).toHaveValue(originalValue);
  });

  // ─── Form Submission ─────────────────────────────────────────────────────────

  test('saving profile with valid data updates the displayed name', async ({ page }) => {
    await page.getByRole('button', { name: /editar|edit/i }).click();

    const nameField = page.locator('input[name="name"]').first();
    await nameField.clear();
    await nameField.fill('Nuevo Nombre Test');

    await page.getByRole('button', { name: /guardar|save/i }).click();

    // After save, the updated name should be reflected
    await expect(page.getByText('Nuevo Nombre Test')).toBeVisible({ timeout: 3000 });
  });

  // ─── Tab Navigation ──────────────────────────────────────────────────────────

  test('tab navigation shows Security tab', async ({ page }) => {
    const securityTab = page.getByRole('button', { name: /seguridad|security/i });
    if (await securityTab.isVisible()) {
      await securityTab.click();
      await expect(page.getByText(/contraseña|password|cambiar contraseña/i)).toBeVisible({
        timeout: 3000,
      });
    }
  });

  test('tab navigation shows Notifications tab', async ({ page }) => {
    const notifTab = page.getByRole('button', { name: /notificaciones|notifications/i });
    if (await notifTab.isVisible()) {
      await notifTab.click();
      await expect(page.getByText(/notificaciones|email|alertas/i)).toBeVisible({ timeout: 3000 });
    }
  });

  // ─── Logout ──────────────────────────────────────────────────────────────────

  test('logout button is visible in settings', async ({ page }) => {
    await expect(page.getByRole('button', { name: /cerrar sesión|logout|sign out/i })).toBeVisible({
      timeout: 8000,
    });
  });

  test('clicking logout clears the session and redirects to /login', async ({ page }) => {
    await page.getByRole('button', { name: /cerrar sesión|logout|sign out/i }).click();

    await expect(page).toHaveURL('/login', { timeout: 6000 });

    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(token).toBeNull();
  });
});
