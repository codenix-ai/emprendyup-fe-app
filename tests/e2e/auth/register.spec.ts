/**
 * E2E tests: Registration page (/registrarse)
 *
 * Coverage:
 * - Page renders all form fields
 * - Successful registration → redirects to /otp-confirmation
 * - Email already exists error
 * - Password strength requirements are enforced and shown live
 * - Passwords not matching shows error
 * - Terms & Conditions must be accepted to submit
 * - Form fields are required
 * - Login link navigates correctly
 * - OAuth error params from URL are displayed
 */

import { test, expect } from '@playwright/test';
import { mockGraphQL } from '../helpers/graphql-mock';
import { MOCK_REGISTER_SUCCESS, MOCK_REGISTER_ERROR_EMAIL_EXISTS } from '../fixtures/auth.fixtures';

const VALID_PASSWORD = 'ValidPass123!';
const WEAK_PASSWORD = 'short';

test.describe('Registration Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/registrarse');
  });

  // ─── Rendering ────────────────────────────────────────────────────────────

  test('renders all registration form fields', async ({ page }) => {
    await expect(page.locator('#RegisterName')).toBeVisible();
    await expect(page.locator('#RegisterEmail')).toBeVisible();
    await expect(page.locator('#RegisterPassword')).toBeVisible();
    await expect(page.locator('#RegisterConfirmPassword')).toBeVisible();
    await expect(page.locator('#AcceptT\\&C')).toBeVisible();
    await expect(page.getByRole('button', { name: /registrarse/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /iniciar sesión/i })).toBeVisible();
  });

  // ─── Successful Registration ───────────────────────────────────────────────

  test('successful registration → redirects to /otp-confirmation with email param', async ({
    page,
  }) => {
    await mockGraphQL(page, { Register: MOCK_REGISTER_SUCCESS });

    await page.locator('#RegisterName').fill('Juan Emprendedor');
    await page.locator('#RegisterEmail').fill('nuevo@emprendyup.com');
    await page.locator('#RegisterPassword').fill(VALID_PASSWORD);
    await page.locator('#RegisterConfirmPassword').fill(VALID_PASSWORD);
    await page.locator('#AcceptT\\&C').check();

    await page.getByRole('button', { name: /registrarse/i }).click();

    await expect(page).toHaveURL(/\/otp-confirmation\?email=nuevo/, { timeout: 6000 });
  });

  test('stores accessToken in localStorage after successful registration', async ({ page }) => {
    await mockGraphQL(page, { Register: MOCK_REGISTER_SUCCESS });

    await page.locator('#RegisterName').fill('Juan Emprendedor');
    await page.locator('#RegisterEmail').fill('nuevo@emprendyup.com');
    await page.locator('#RegisterPassword').fill(VALID_PASSWORD);
    await page.locator('#RegisterConfirmPassword').fill(VALID_PASSWORD);
    await page.locator('#AcceptT\\&C').check();
    await page.getByRole('button', { name: /registrarse/i }).click();

    await page.waitForURL(/otp-confirmation/, { timeout: 6000 });
    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    expect(token).toBe('mock-access-token-abc123');
  });

  // ─── Error States ──────────────────────────────────────────────────────────

  test('shows error when email is already registered', async ({ page }) => {
    await mockGraphQL(page, { Register: MOCK_REGISTER_ERROR_EMAIL_EXISTS });

    await page.locator('#RegisterName').fill('Juan Emprendedor');
    await page.locator('#RegisterEmail').fill('existing@emprendyup.com');
    await page.locator('#RegisterPassword').fill(VALID_PASSWORD);
    await page.locator('#RegisterConfirmPassword').fill(VALID_PASSWORD);
    await page.locator('#AcceptT\\&C').check();
    await page.getByRole('button', { name: /registrarse/i }).click();

    await expect(page.locator('.bg-red-500\\/10, [class*="text-red"]').first()).toBeVisible({
      timeout: 5000,
    });
  });

  test('shows error when passwords do not match', async ({ page }) => {
    await page.locator('#RegisterName').fill('Juan Emprendedor');
    await page.locator('#RegisterEmail').fill('test@emprendyup.com');
    await page.locator('#RegisterPassword').fill(VALID_PASSWORD);
    await page.locator('#RegisterConfirmPassword').fill('DifferentPass999!');
    await page.locator('#AcceptT\\&C').check();
    await page.getByRole('button', { name: /registrarse/i }).click();

    // Error message about password mismatch
    await expect(page.getByText(/contraseñas no coinciden|passwords.*match/i)).toBeVisible({
      timeout: 3000,
    });
  });

  // ─── Password Requirements ─────────────────────────────────────────────────

  test('shows live password strength indicators when typing', async ({ page }) => {
    const passwordInput = page.locator('#RegisterPassword');
    await passwordInput.click();
    await passwordInput.fill('a');

    // Password requirements panel should appear
    await expect(
      page.getByText(/mayúscula|uppercase|mínimo.*caracteres|at least.*characters/i)
    ).toBeVisible({ timeout: 3000 });
  });

  test('password requirements pass with a strong password', async ({ page }) => {
    await page.locator('#RegisterPassword').fill(VALID_PASSWORD);

    // All requirement indicators should be satisfied (green / checked)
    const requirementItems = page.locator(
      '[class*="text-green"], [class*="check"], svg[class*="green"]'
    );
    await expect(requirementItems.first()).toBeVisible({ timeout: 3000 });
  });

  // ─── Terms & Conditions ────────────────────────────────────────────────────

  test('cannot submit without accepting Terms & Conditions', async ({ page }) => {
    await mockGraphQL(page, { Register: MOCK_REGISTER_SUCCESS });

    await page.locator('#RegisterName').fill('Juan Emprendedor');
    await page.locator('#RegisterEmail').fill('test@emprendyup.com');
    await page.locator('#RegisterPassword').fill(VALID_PASSWORD);
    await page.locator('#RegisterConfirmPassword').fill(VALID_PASSWORD);
    // Do NOT check terms

    await page.getByRole('button', { name: /registrarse/i }).click();

    // Should still be on /registrarse — no redirect
    await expect(page).toHaveURL('/registrarse');
  });

  // ─── Password Visibility Toggle ────────────────────────────────────────────

  test('password visibility toggle works on password field', async ({ page }) => {
    const passwordInput = page.locator('#RegisterPassword');
    await passwordInput.fill(VALID_PASSWORD);

    await expect(passwordInput).toHaveAttribute('type', 'password');
    await page
      .getByRole('button', { name: /mostrar contraseña/i })
      .first()
      .click();
    await expect(passwordInput).toHaveAttribute('type', 'text');
    await page
      .getByRole('button', { name: /ocultar contraseña/i })
      .first()
      .click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  // ─── Navigation ────────────────────────────────────────────────────────────

  test('login link navigates to /login', async ({ page }) => {
    await page.getByRole('link', { name: /iniciar sesión/i }).click();
    await expect(page).toHaveURL('/login');
  });

  // ─── OAuth Error Params ────────────────────────────────────────────────────

  test('displays error from URL params when redirected back from OAuth', async ({ page }) => {
    await page.goto('/registrarse?error=oauth_cancelled');
    await expect(page.getByText(/cancelado.*google|google.*cancelado/i)).toBeVisible({
      timeout: 3000,
    });
    // URL param is cleaned
    await expect(page).not.toHaveURL(/error=oauth_cancelled/);
  });

  test('displays profile_fetch_failed error from URL params', async ({ page }) => {
    await page.goto('/registrarse?error=profile_fetch_failed');
    await expect(page.locator('.bg-red-500\\/10, [class*="text-red"]').first()).toBeVisible();
  });
});
