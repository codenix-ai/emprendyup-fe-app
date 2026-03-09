/**
 * E2E tests: Forgot Password page (/olvido-contrasena)
 *
 * Coverage:
 * - Page renders email request form
 * - Successful email request shows confirmation message
 * - Shows error for invalid/unregistered email (API error)
 * - Network error is handled gracefully
 * - Empty email shows validation error
 * - Password reset form renders when token is in URL
 * - Password reset: passwords not matching shows error
 * - Password reset: success redirects to /login
 * - Password strength indicators are shown live
 */

import { test, expect } from '@playwright/test';
import { mockRestAPI } from '../helpers/graphql-mock';

test.describe('Forgot Password Page', () => {
  // ─── Email Request Form ────────────────────────────────────────────────────

  test.describe('Email request form (no token)', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/olvido-contrasena');
    });

    test('renders the forgot password form', async ({ page }) => {
      await expect(page.getByRole('heading', { name: /contraseña|password/i })).toBeVisible();
      await expect(page.locator('input[type="email"]')).toBeVisible();
      await expect(page.getByRole('button', { name: /enviar|send|solicitar/i })).toBeVisible();
    });

    test('successful email request shows confirmation message', async ({ page }) => {
      await mockRestAPI(page, {
        '/auth/request-password-reset': {
          status: 200,
          body: { message: 'Email sent' },
        },
      });

      await page.locator('input[type="email"]').fill('test@emprendyup.com');
      await page.getByRole('button', { name: /enviar|send|solicitar/i }).click();

      await expect(
        page.getByText(/recibirás instrucciones|check your email|correo enviado/i)
      ).toBeVisible({ timeout: 5000 });
    });

    test('empty email shows browser validation or inline error', async ({ page }) => {
      await page.getByRole('button', { name: /enviar|send|solicitar/i }).click();

      // Either HTML5 validation fires OR the component shows its own error
      const emailInput = page.locator('input[type="email"]');
      const isInvalid = await emailInput.evaluate((el: HTMLInputElement) => !el.validity.valid);
      const hasInlineError = await page.locator('.text-red-500, [class*="text-red"]').isVisible();
      expect(isInvalid || hasInlineError).toBeTruthy();
    });

    test('API error response shows error message', async ({ page }) => {
      await mockRestAPI(page, {
        '/auth/request-password-reset': {
          status: 400,
          body: { message: 'Email no encontrado' },
        },
      });

      await page.locator('input[type="email"]').fill('notregistered@example.com');
      await page.getByRole('button', { name: /enviar|send|solicitar/i }).click();

      await expect(
        page.locator('.text-red-500, [class*="error"], [class*="text-red"]').first()
      ).toBeVisible({ timeout: 5000 });
    });

    test('network error is handled gracefully', async ({ page }) => {
      await page.route('https://api.emprendy.ai/auth/request-password-reset', (r) =>
        r.abort('failed')
      );

      await page.locator('input[type="email"]').fill('test@emprendyup.com');
      await page.getByRole('button', { name: /enviar|send|solicitar/i }).click();

      await expect(
        page.locator('.text-red-500, [class*="error"], [class*="text-red"]').first()
      ).toBeVisible({ timeout: 8000 });
    });

    test('submit button shows loading state while request is in flight', async ({ page }) => {
      await page.route('https://api.emprendy.ai/auth/request-password-reset', async (route) => {
        await new Promise((r) => setTimeout(r, 600));
        await route.fulfill({ status: 200, body: JSON.stringify({ message: 'ok' }) });
      });

      await page.locator('input[type="email"]').fill('test@emprendyup.com');
      await page.getByRole('button', { name: /enviar|send|solicitar/i }).click();

      await expect(page.getByRole('button', { name: /enviando|cargando|loading/i })).toBeDisabled({
        timeout: 3000,
      });
    });
  });

  // ─── Password Reset Form (with token) ─────────────────────────────────────

  test.describe('Password reset form (with token in URL)', () => {
    const RESET_TOKEN = 'valid-reset-token-xyz';

    test.beforeEach(async ({ page }) => {
      await page.goto(`/olvido-contrasena?token=${RESET_TOKEN}`);
    });

    test('renders the new password form when token is present', async ({ page }) => {
      await expect(page.locator('input[type="password"]').first()).toBeVisible();
      await expect(page.getByRole('button', { name: /restablecer|reset|cambiar/i })).toBeVisible();
    });

    test('shows password strength indicators live when typing', async ({ page }) => {
      const passwordInput = page.locator('input[type="password"]').first();
      await passwordInput.fill('A');

      // Lowercase requirement should be flagged
      await expect(page.getByText(/minúscula|lowercase|letra minúscula/i)).toBeVisible({
        timeout: 3000,
      });
    });

    test('shows error when new passwords do not match', async ({ page }) => {
      const inputs = page.locator('input[type="password"]');
      await inputs.nth(0).fill('ValidPass123!');
      await inputs.nth(1).fill('DifferentPass999!');
      await page.getByRole('button', { name: /restablecer|reset|cambiar/i }).click();

      await expect(page.getByText(/contraseñas no coinciden|do not match/i)).toBeVisible({
        timeout: 3000,
      });
    });

    test('successful password reset redirects to /login', async ({ page }) => {
      await mockRestAPI(page, {
        '/auth/reset-password': {
          status: 200,
          body: { message: 'Password reset successful' },
        },
      });

      const inputs = page.locator('input[type="password"]');
      await inputs.nth(0).fill('NewValidPass123!');
      await inputs.nth(1).fill('NewValidPass123!');
      await page.getByRole('button', { name: /restablecer|reset|cambiar/i }).click();

      await expect(page).toHaveURL('/login', { timeout: 6000 });
    });

    test('shows error when reset token is invalid (API 400)', async ({ page }) => {
      await mockRestAPI(page, {
        '/auth/reset-password': {
          status: 400,
          body: { message: 'Token inválido o expirado' },
        },
      });

      const inputs = page.locator('input[type="password"]');
      await inputs.nth(0).fill('NewValidPass123!');
      await inputs.nth(1).fill('NewValidPass123!');
      await page.getByRole('button', { name: /restablecer|reset|cambiar/i }).click();

      await expect(page.locator('.text-red-500, [class*="error"]').first()).toBeVisible({
        timeout: 5000,
      });
    });
  });
});
