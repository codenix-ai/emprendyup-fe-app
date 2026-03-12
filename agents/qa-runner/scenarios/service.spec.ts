// ─────────────────────────────────────────────
//  emprendy.ai — E2E: Crear Servicio
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

test.describe('Módulo: Crear Servicio', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('TC-SVC-001: Crear servicio profesional', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/services/new`);

    await page.fill('[data-testid="service-name"]', 'Consultoría Empresarial');
    await page.fill('[data-testid="service-description"]', 'Asesoría para emprendedores');
    await page.fill('[data-testid="service-price"]', '150000');
    await page.fill('[data-testid="service-duration"]', '60'); // minutos
    await page.selectOption('[data-testid="service-category"]', 'consulting');
    await page.selectOption('[data-testid="service-modality"]', 'remote');

    await page.click('[data-testid="save-service-btn"]');
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible({ timeout: 8000 });
  });

  test('TC-SVC-002: Configurar disponibilidad y calendario', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/services`);
    await page.click(
      '[data-testid="service-item"]:first-child [data-testid="manage-availability-btn"]'
    );

    // Configurar días disponibles
    await page.check('[data-testid="available-monday"]');
    await page.check('[data-testid="available-tuesday"]');
    await page.check('[data-testid="available-wednesday"]');
    await page.fill('[data-testid="start-time"]', '09:00');
    await page.fill('[data-testid="end-time"]', '17:00');
    await page.fill('[data-testid="slot-duration"]', '60');

    await page.click('[data-testid="save-availability-btn"]');
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible({ timeout: 5000 });
  });

  test('TC-SVC-003: Reserva de servicio (flujo cliente)', async ({ page, context }) => {
    // Obtener slug del servicio
    await page.goto(`${BASE}/dashboard/services`);
    const slug = await page
      .locator('[data-testid="service-item"]')
      .first()
      .getAttribute('data-slug');

    // Abrir página pública como cliente
    const clientPage = await context.newPage();
    await clientPage.goto(`${BASE}/service/${slug}`);

    await expect(clientPage.locator('[data-testid="service-name"]')).toBeVisible();
    await clientPage.click('[data-testid="book-service-btn"]');

    // Seleccionar fecha y hora disponibles
    await clientPage.click('[data-testid="calendar-day-available"]:first-child');
    await clientPage.click('[data-testid="time-slot"]:first-child');

    // Llenar datos del cliente
    await clientPage.fill('[data-testid="client-name"]', 'Juan Cliente');
    await clientPage.fill('[data-testid="client-email"]', 'cliente@test.com');
    await clientPage.fill('[data-testid="client-phone"]', '+57 310 000 0000');

    await clientPage.click('[data-testid="confirm-booking-btn"]');
    await expect(clientPage.locator('[data-testid="booking-confirmation"]')).toBeVisible({
      timeout: 10000,
    });
    await clientPage.close();
  });

  test('TC-SVC-004: Notificación al proveedor por nueva reserva', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/notifications`);

    // Verificar que llegó notificación de la reserva del test anterior
    await expect(
      page.locator('[data-testid="notification-item"]').filter({ hasText: /nueva reserva/i })
    ).toBeVisible({ timeout: 15000 });
  });

  test('TC-SVC-005: Cancelar y reagendar reserva', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/bookings`);
    await page.click('[data-testid="booking-item"]:first-child [data-testid="cancel-booking-btn"]');

    await page.fill('[data-testid="cancellation-reason"]', 'Cliente solicitó cambio de fecha');
    await page.click('[data-testid="confirm-cancellation-btn"]');

    await expect(
      page.locator('[data-testid="booking-item"]').first().locator('[data-testid="booking-status"]')
    ).toHaveText(/cancelad/i);
  });

  test('TC-SVC-006: Modalidades — presencial, remoto, híbrido', async ({ page }) => {
    for (const modality of ['in-person', 'remote', 'hybrid']) {
      await page.goto(`${BASE}/dashboard/services/new`);
      await page.fill('[data-testid="service-name"]', `Servicio ${modality}`);
      await page.fill('[data-testid="service-price"]', '50000');
      await page.fill('[data-testid="service-duration"]', '30');
      await page.selectOption('[data-testid="service-category"]', 'consulting');
      await page.selectOption('[data-testid="service-modality"]', modality);

      await page.click('[data-testid="save-service-btn"]');
      await expect(page.locator('[data-testid="success-toast"]')).toBeVisible({ timeout: 8000 });
    }
  });
});
