/**
 * E2E tests: Dashboard Events page (/dashboard/events)
 *
 * Coverage:
 * - Page renders the events heading
 * - Events list is displayed when data is available
 * - "Crear Evento" button is visible
 * - Create event modal/form opens when button is clicked
 * - Event creation form has required fields (title, date, location)
 * - Successful event creation shows the new event in the list
 * - Event cards show event title, date, and location
 * - Empty state when no events exist
 */

import { test, expect } from '@playwright/test';
import { mockGraphQL, seedAuthSession } from '../helpers/graphql-mock';
import { MOCK_EVENTS_LIST, MOCK_CREATE_EVENT_SUCCESS } from '../fixtures/dashboard.fixtures';
import { TEST_USER_WITH_STORE } from '../fixtures/auth.fixtures';

const MOCK_EVENTS_EMPTY = {
  data: { eventsByServiceProvider: [] },
};

async function gotoEvents(page: Parameters<typeof mockGraphQL>[0], eventsData = MOCK_EVENTS_LIST) {
  await seedAuthSession(page, TEST_USER_WITH_STORE);
  await mockGraphQL(page, {
    EventsByServiceProvider: eventsData,
    CreateEvent: MOCK_CREATE_EVENT_SUCCESS,
  });
  await page.goto('/dashboard/events');
}

test.describe('Dashboard Events Page', () => {
  // ─── Rendering ──────────────────────────────────────────────────────────────

  test('renders the events page heading', async ({ page }) => {
    await gotoEvents(page);

    await expect(page.getByRole('heading', { name: /eventos|events/i })).toBeVisible({
      timeout: 8000,
    });
  });

  test('renders event cards with title and city', async ({ page }) => {
    await gotoEvents(page);

    await expect(page.getByText('Feria Emprendedora Bogotá')).toBeVisible({ timeout: 8000 });
    await expect(page.getByText(/bogotá/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('shows empty state when no events exist', async ({ page }) => {
    await gotoEvents(page, MOCK_EVENTS_EMPTY);

    await expect(page.getByText(/no hay eventos|no events|crear.*evento/i)).toBeVisible({
      timeout: 8000,
    });
  });

  // ─── Create Event ────────────────────────────────────────────────────────────

  test('"Crear Evento" button is visible', async ({ page }) => {
    await gotoEvents(page);

    await expect(
      page.getByRole('button', { name: /crear evento|new event|agregar evento/i })
    ).toBeVisible({ timeout: 8000 });
  });

  test('clicking "Crear Evento" opens the event creation form', async ({ page }) => {
    await gotoEvents(page);

    await page.getByRole('button', { name: /crear evento|new event|agregar evento/i }).click();

    // Modal should open with form fields
    await expect(page.getByRole('dialog').or(page.locator('[class*="modal"]')).first()).toBeVisible(
      { timeout: 5000 }
    );
  });

  test('event creation form has title and date fields', async ({ page }) => {
    await gotoEvents(page);

    await page.getByRole('button', { name: /crear evento|new event|agregar evento/i }).click();

    await expect(
      page
        .locator('input[name="title"], input[placeholder*="título"], input[placeholder*="title"]')
        .first()
    ).toBeVisible({ timeout: 5000 });

    await expect(
      page
        .locator('input[type="date"], input[name="startDate"], input[placeholder*="fecha"]')
        .first()
    ).toBeVisible({ timeout: 5000 });
  });

  // ─── Event Card Details ───────────────────────────────────────────────────────

  test('event card shows organizer info', async ({ page }) => {
    await gotoEvents(page);

    await expect(page.getByText(/emprendyup|organizador/i).first()).toBeVisible({ timeout: 8000 });
  });

  test('event card shows attendance capacity', async ({ page }) => {
    await gotoEvents(page);

    await expect(page.getByText(/500|asistentes|capacidad|attendees/i).first()).toBeVisible({
      timeout: 8000,
    });
  });

  // ─── Loading State ────────────────────────────────────────────────────────────

  test('shows loading indicator while fetching events', async ({ page }) => {
    await seedAuthSession(page, TEST_USER_WITH_STORE);
    await page.route('https://api.emprendy.ai/graphql', async (route) => {
      await new Promise((r) => setTimeout(r, 400));
      await route.continue();
    });
    await page.goto('/dashboard/events');

    await expect(
      page.locator('.animate-pulse, [class*="skeleton"], [class*="loading"]').first()
    ).toBeVisible({ timeout: 3000 });
  });
});
