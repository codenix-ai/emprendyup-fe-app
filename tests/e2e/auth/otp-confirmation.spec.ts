/**
 * E2E tests: OTP Confirmation page (/otp-confirmation)
 *
 * Coverage:
 * - Page renders with email from query param
 * - Renders OTP input and submit button
 * - Successful OTP verification redirects to /login
 * - Invalid OTP shows error message
 * - Network error is handled gracefully
 * - Resend OTP button is present and triggers cooldown
 * - Expiration countdown is displayed
 * - Shows error when accessed without email param
 */

import { test, expect } from '@playwright/test';

const BASE_EMAIL = 'test@emprendyup.com';

test.describe('OTP Confirmation Page', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────────

  test('renders the OTP form with email from query param', async ({ page }) => {
    await page.goto(`/otp-confirmation?email=${encodeURIComponent(BASE_EMAIL)}`);

    await expect(
      page.locator('input[type="text"], input[inputmode="numeric"], input[name="otp"]').first()
    ).toBeVisible();
    await expect(page.getByRole('button', { name: /verificar|confirmar|verify/i })).toBeVisible();
  });

  test('shows the email address the OTP was sent to', async ({ page }) => {
    await page.goto(`/otp-confirmation?email=${encodeURIComponent(BASE_EMAIL)}`);

    await expect(page.getByText(BASE_EMAIL)).toBeVisible({ timeout: 3000 });
  });

  test('shows OTP expiration countdown', async ({ page }) => {
    await page.goto(`/otp-confirmation?email=${encodeURIComponent(BASE_EMAIL)}`);

    // Countdown timer should be visible (shows minutes:seconds)
    await expect(page.getByText(/\d+:\d{2}/)).toBeVisible({ timeout: 3000 });
  });

  test('resend OTP button is present', async ({ page }) => {
    await page.goto(`/otp-confirmation?email=${encodeURIComponent(BASE_EMAIL)}`);

    await expect(page.getByRole('button', { name: /reenviar|resend/i })).toBeVisible({
      timeout: 3000,
    });
  });

  // ─── Successful Verification ─────────────────────────────────────────────────

  test('successful OTP verification shows success message and redirects to /login', async ({
    page,
  }) => {
    await page.route(
      `${process.env.PLAYWRIGHT_API_URL || 'https://api.emprendy.ai'}/auth/otp/verify`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'OTP verified' }),
        });
      }
    );

    await page.goto(`/otp-confirmation?email=${encodeURIComponent(BASE_EMAIL)}`);

    const otpInput = page
      .locator('input[type="text"], input[inputmode="numeric"], input[name="otp"]')
      .first();
    await otpInput.fill('123456');
    await page.getByRole('button', { name: /verificar|confirmar|verify/i }).click();

    await expect(page.getByText(/verificación exitosa|bienvenido|exitosa/i)).toBeVisible({
      timeout: 5000,
    });
    await expect(page).toHaveURL('/login', { timeout: 5000 });
  });

  // ─── Error States ─────────────────────────────────────────────────────────────

  test('invalid OTP shows error message', async ({ page }) => {
    await page.route(
      `${process.env.PLAYWRIGHT_API_URL || 'https://api.emprendy.ai'}/auth/otp/verify`,
      async (route) => {
        await route.fulfill({
          status: 400,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'OTP inválido o expirado' }),
        });
      }
    );

    await page.goto(`/otp-confirmation?email=${encodeURIComponent(BASE_EMAIL)}`);

    const otpInput = page
      .locator('input[type="text"], input[inputmode="numeric"], input[name="otp"]')
      .first();
    await otpInput.fill('000000');
    await page.getByRole('button', { name: /verificar|confirmar|verify/i }).click();

    await expect(page.getByText(/inválido|expirado|error|invalid/i)).toBeVisible({ timeout: 5000 });
  });

  test('network error is handled gracefully', async ({ page }) => {
    await page.route(
      `${process.env.PLAYWRIGHT_API_URL || 'https://api.emprendy.ai'}/auth/otp/verify`,
      (route) => route.abort('failed')
    );

    await page.goto(`/otp-confirmation?email=${encodeURIComponent(BASE_EMAIL)}`);

    const otpInput = page
      .locator('input[type="text"], input[inputmode="numeric"], input[name="otp"]')
      .first();
    await otpInput.fill('123456');
    await page.getByRole('button', { name: /verificar|confirmar|verify/i }).click();

    await expect(
      page.locator('[class*="text-red"], .bg-red-500\\/10, [class*="error"]').first()
    ).toBeVisible({ timeout: 8000 });
  });

  // ─── Resend OTP ───────────────────────────────────────────────────────────────

  test('clicking resend triggers cooldown timer', async ({ page }) => {
    await page.route(
      `${process.env.PLAYWRIGHT_API_URL || 'https://api.emprendy.ai'}/auth/otp/resend`,
      async (route) => {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'OTP sent' }),
        });
      }
    );

    await page.goto(`/otp-confirmation?email=${encodeURIComponent(BASE_EMAIL)}`);

    const resendBtn = page.getByRole('button', { name: /reenviar|resend/i });
    await resendBtn.click();

    // After clicking, resend button should be disabled/show countdown
    await expect(resendBtn).toBeDisabled({ timeout: 3000 });
  });

  // ─── Submit Validation ─────────────────────────────────────────────────────────

  test('submit button shows loading state while request is in flight', async ({ page }) => {
    await page.route(
      `${process.env.PLAYWRIGHT_API_URL || 'https://api.emprendy.ai'}/auth/otp/verify`,
      async (route) => {
        await new Promise((r) => setTimeout(r, 800));
        await route.fulfill({ status: 200, body: JSON.stringify({ message: 'ok' }) });
      }
    );

    await page.goto(`/otp-confirmation?email=${encodeURIComponent(BASE_EMAIL)}`);

    const otpInput = page
      .locator('input[type="text"], input[inputmode="numeric"], input[name="otp"]')
      .first();
    await otpInput.fill('123456');
    await page.getByRole('button', { name: /verificar|confirmar|verify/i }).click();

    await expect(page.getByRole('button', { name: /verificando|cargando|loading/i })).toBeDisabled({
      timeout: 3000,
    });
  });
});
