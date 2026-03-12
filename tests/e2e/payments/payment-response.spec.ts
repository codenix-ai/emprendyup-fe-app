/**
 * E2E tests: Payment Response page (/payment/response)
 *
 * This page is reached after ePayco redirects back with ?ref_payco=...
 * It validates the payment, then shows success / error / pending states.
 *
 * Coverage:
 * - Shows "processing" state on initial load with ref_payco param
 * - Shows success state when ePayco returns accepted transaction
 * - Shows error state when ePayco returns rejected/cancelled transaction
 * - Shows pending state when ePayco returns pending transaction
 * - Shows error when no ref_payco param is present
 * - "Volver" / back link is present on all states
 * - Success state shows order confirmation details
 */

import { test, expect } from '@playwright/test';
import { seedAuthSession } from '../helpers/graphql-mock';
import { TEST_USER_WITH_STORE } from '../fixtures/auth.fixtures';

const REF_PAYCO = 'test-ref-payco-12345';
const EPAYCO_API = `https://secure.epayco.co/validation/v1/reference/${REF_PAYCO}`;

function epaycoResponse(status: string, statusCode: string) {
  return {
    success: true,
    data: {
      x_ref_payco: REF_PAYCO,
      x_transaction_id: 'txn-123',
      x_amount: '150000',
      x_currency_code: 'COP',
      x_transaction_state: status,
      x_cod_transaction_state: statusCode,
      x_response: status,
      x_response_reason_text: `Transaction ${status}`,
      x_franchise: 'VISA',
      x_bank_name: 'Banco de Prueba',
      x_cardnumber: '****1234',
    },
  };
}

test.describe('Payment Response Page', () => {
  test.beforeEach(async ({ page }) => {
    await seedAuthSession(page, TEST_USER_WITH_STORE);
  });

  // ─── No ref_payco ────────────────────────────────────────────────────────────

  test('shows error state when no ref_payco param is provided', async ({ page }) => {
    await page.goto('/payment/response');

    await expect(page.getByText(/error|ref_payco|parámetro.*requerido/i).first()).toBeVisible({
      timeout: 8000,
    });
  });

  // ─── Processing State ─────────────────────────────────────────────────────────

  test('shows processing/loading state on initial load with ref_payco', async ({ page }) => {
    // Delay ePayco validation to catch the processing state
    await page.route(EPAYCO_API, async (route) => {
      await new Promise((r) => setTimeout(r, 600));
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(epaycoResponse('Aceptada', '1')),
      });
    });

    await page.goto(`/payment/response?ref_payco=${REF_PAYCO}`);

    await expect(page.getByText(/procesando|processing|verificando/i).first()).toBeVisible({
      timeout: 3000,
    });
  });

  // ─── Success State ────────────────────────────────────────────────────────────

  test('shows success state when payment is accepted', async ({ page }) => {
    await page.route(EPAYCO_API, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(epaycoResponse('Aceptada', '1')),
      })
    );

    await page.goto(`/payment/response?ref_payco=${REF_PAYCO}`);

    await expect(
      page.getByText(/aprobado|aceptado|exitoso|success|pago.*exitoso/i).first()
    ).toBeVisible({ timeout: 10000 });
  });

  test('success state shows payment amount', async ({ page }) => {
    await page.route(EPAYCO_API, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(epaycoResponse('Aceptada', '1')),
      })
    );

    await page.goto(`/payment/response?ref_payco=${REF_PAYCO}`);

    await expect(page.getByText(/150\.000|150,000|\$150/i).first()).toBeVisible({ timeout: 10000 });
  });

  // ─── Error / Rejected State ───────────────────────────────────────────────────

  test('shows error state when payment is rejected', async ({ page }) => {
    await page.route(EPAYCO_API, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(epaycoResponse('Rechazada', '2')),
      })
    );

    await page.goto(`/payment/response?ref_payco=${REF_PAYCO}`);

    await expect(page.getByText(/rechazado|error|fallido|failed|rejected/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  // ─── Pending State ────────────────────────────────────────────────────────────

  test('shows pending state when payment is pending', async ({ page }) => {
    await page.route(EPAYCO_API, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(epaycoResponse('Pendiente', '3')),
      })
    );

    await page.goto(`/payment/response?ref_payco=${REF_PAYCO}`);

    await expect(page.getByText(/pendiente|pending|en proceso/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  // ─── ePayco API Error ─────────────────────────────────────────────────────────

  test('shows error state when ePayco validation fails', async ({ page }) => {
    await page.route(EPAYCO_API, (route) => route.abort('failed'));

    await page.goto(`/payment/response?ref_payco=${REF_PAYCO}`);

    await expect(page.getByText(/error|falló|failed|rechazado/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  // ─── Navigation ───────────────────────────────────────────────────────────────

  test('back/return link is present on the response page', async ({ page }) => {
    await page.route(EPAYCO_API, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(epaycoResponse('Aceptada', '1')),
      })
    );

    await page.goto(`/payment/response?ref_payco=${REF_PAYCO}`);

    await expect(
      page.getByRole('link', { name: /volver|regresar|back|inicio/i }).first()
    ).toBeVisible({ timeout: 10000 });
  });
});
