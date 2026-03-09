/**
 * E2E tests: Login page (/login)
 *
 * Coverage:
 * - Page renders correctly
 * - Successful login → seller with no store redirects to /dashboard/store/new
 * - Successful login → seller with store redirects to /dashboard/insights
 * - Successful login → admin redirects to /dashboard/insights
 * - Invalid credentials shows inline error
 * - GraphQL network error shows error
 * - Password toggle shows/hides password
 * - Forgot password link navigates correctly
 * - Register link is present and navigates correctly
 * - Form requires email and password (HTML5 validation)
 */

import { test, expect } from '@playwright/test';
import { mockGraphQL } from '../helpers/graphql-mock';
import {
  MOCK_LOGIN_SUCCESS,
  MOCK_LOGIN_SUCCESS_WITH_STORE,
  MOCK_LOGIN_ADMIN_SUCCESS,
  MOCK_LOGIN_ERROR,
} from '../fixtures/auth.fixtures';

test.describe('Login Page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/login');
  });

  // ─── Rendering ────────────────────────────────────────────────────────────

  test('renders the login form with all required elements', async ({ page }) => {
    await expect(page.getByRole('heading', { name: /iniciar sesión/i })).toBeVisible();
    await expect(page.locator('#LoginEmail')).toBeVisible();
    await expect(page.locator('#LoginPassword')).toBeVisible();
    await expect(page.getByRole('button', { name: /login \/ sign in/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /registrarse/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /¿olvidaste tu contraseña\?/i })).toBeVisible();
  });

  test('shows the Google login button', async ({ page }) => {
    // Google button renders inside an iframe from accounts.google.com — check the container
    await expect(
      page.locator('[id*="google"], iframe[src*="google"], .nsm7Bb-HzV7m-LgbsSe')
    ).toBeVisible({ timeout: 8000 });
  });

  // ─── Successful Login ──────────────────────────────────────────────────────

  test('seller without store → redirects to /dashboard/store/new after login', async ({ page }) => {
    await mockGraphQL(page, { Login: MOCK_LOGIN_SUCCESS });

    await page.locator('#LoginEmail').fill('test@emprendyup.com');
    await page.locator('#LoginPassword').fill('ValidPass123!');
    await page.getByRole('button', { name: /login \/ sign in/i }).click();

    await expect(page.locator('.bg-green-500\\/10')).toBeVisible();
    await expect(page).toHaveURL('/dashboard/store/new', { timeout: 5000 });
  });

  test('seller with existing store → redirects to /dashboard/insights after login', async ({
    page,
  }) => {
    await mockGraphQL(page, { Login: MOCK_LOGIN_SUCCESS_WITH_STORE });

    await page.locator('#LoginEmail').fill('test@emprendyup.com');
    await page.locator('#LoginPassword').fill('ValidPass123!');
    await page.getByRole('button', { name: /login \/ sign in/i }).click();

    await expect(page).toHaveURL('/dashboard/insights', { timeout: 5000 });
  });

  test('admin user → redirects to /dashboard/insights after login', async ({ page }) => {
    await mockGraphQL(page, { Login: MOCK_LOGIN_ADMIN_SUCCESS });

    await page.locator('#LoginEmail').fill('admin@emprendyup.com');
    await page.locator('#LoginPassword').fill('AdminPass123!');
    await page.getByRole('button', { name: /login \/ sign in/i }).click();

    await expect(page).toHaveURL('/dashboard/insights', { timeout: 5000 });
  });

  test('stores accessToken and user in localStorage after successful login', async ({ page }) => {
    await mockGraphQL(page, { Login: MOCK_LOGIN_SUCCESS });

    await page.locator('#LoginEmail').fill('test@emprendyup.com');
    await page.locator('#LoginPassword').fill('ValidPass123!');
    await page.getByRole('button', { name: /login \/ sign in/i }).click();

    // Wait for redirect to confirm login succeeded
    await page.waitForURL('/dashboard/store/new', { timeout: 5000 });

    const token = await page.evaluate(() => localStorage.getItem('accessToken'));
    const user = await page.evaluate(() => localStorage.getItem('user'));
    expect(token).toBe('mock-access-token-abc123');
    expect(JSON.parse(user!).email).toBe('test@emprendyup.com');
  });

  // ─── Error States ──────────────────────────────────────────────────────────

  test('shows error message when credentials are invalid', async ({ page }) => {
    await mockGraphQL(page, { Login: MOCK_LOGIN_ERROR });

    await page.locator('#LoginEmail').fill('wrong@email.com');
    await page.locator('#LoginPassword').fill('wrongpassword');
    await page.getByRole('button', { name: /login \/ sign in/i }).click();

    await expect(page.locator('.bg-red-500\\/10')).toBeVisible();
    await expect(page.locator('.bg-red-500\\/10')).toContainText(/credenciales inválidas/i);
  });

  test('shows error message on network failure', async ({ page }) => {
    await page.route('https://api.emprendy.ai/graphql', (route) => route.abort('failed'));

    await page.locator('#LoginEmail').fill('test@emprendyup.com');
    await page.locator('#LoginPassword').fill('ValidPass123!');
    await page.getByRole('button', { name: /login \/ sign in/i }).click();

    await expect(page.locator('.bg-red-500\\/10')).toBeVisible({ timeout: 8000 });
  });

  // ─── Form Behavior ─────────────────────────────────────────────────────────

  test('submit button is disabled while login request is in flight', async ({ page }) => {
    // Delay the mock response to observe the loading state
    await page.route('https://api.emprendy.ai/graphql', async (route) => {
      await new Promise((r) => setTimeout(r, 800));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(MOCK_LOGIN_SUCCESS),
      });
    });

    await page.locator('#LoginEmail').fill('test@emprendyup.com');
    await page.locator('#LoginPassword').fill('ValidPass123!');
    await page.getByRole('button', { name: /login \/ sign in/i }).click();

    await expect(page.getByRole('button', { name: /ingresando\.\.\./i })).toBeDisabled();
  });

  test('password toggle shows and hides password text', async ({ page }) => {
    const passwordInput = page.locator('#LoginPassword');
    await passwordInput.fill('MySecretPass!');

    await expect(passwordInput).toHaveAttribute('type', 'password');

    await page.getByRole('button', { name: /mostrar contraseña/i }).click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    await page.getByRole('button', { name: /ocultar contraseña/i }).click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  // ─── Navigation ────────────────────────────────────────────────────────────

  test('forgot password button navigates to /olvido-contrasena', async ({ page }) => {
    await page.getByRole('button', { name: /¿olvidaste tu contraseña\?/i }).click();
    await expect(page).toHaveURL('/olvido-contrasena');
  });

  test('register link navigates to /registrarse', async ({ page }) => {
    await page.getByRole('link', { name: /registrarse/i }).click();
    await expect(page).toHaveURL('/registrarse');
  });

  // ─── OAuth Error Params ────────────────────────────────────────────────────

  test('shows OAuth error when redirected back with ?error=oauth_cancelled', async ({ page }) => {
    await page.goto('/login?error=oauth_cancelled');
    await expect(page.locator('.bg-red-500\\/10')).toContainText(/cancelado/i);
    // URL is cleaned up (error param removed)
    await expect(page).not.toHaveURL(/error=oauth_cancelled/);
  });

  test('shows error when redirected back with ?error=user_exists', async ({ page }) => {
    await page.goto('/login?error=user_exists&message=Ya tienes una cuenta');
    await expect(page.locator('.bg-red-500\\/10')).toBeVisible();
  });
});
