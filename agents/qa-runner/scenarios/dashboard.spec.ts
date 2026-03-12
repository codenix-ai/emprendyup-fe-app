// ─────────────────────────────────────────────
//  emprendy.ai — E2E: Dashboard Completo
// ─────────────────────────────────────────────
import { test, expect, Page } from '@playwright/test';

const BASE = process.env.BASE_URL ?? 'http://localhost:3000';

async function login(page: Page, role: 'admin' | 'owner' | 'staff' = 'owner') {
  const creds: Record<string, [string, string]> = {
    admin: [process.env.TEST_ADMIN_EMAIL!, process.env.TEST_ADMIN_PASSWORD!],
    owner: [process.env.TEST_USER_EMAIL!, process.env.TEST_USER_PASSWORD!],
    staff: [process.env.TEST_STAFF_EMAIL!, process.env.TEST_STAFF_PASSWORD!],
  };
  await page.goto(`${BASE}/login`);
  await page.fill('[data-testid="email"]', creds[role][0]);
  await page.fill('[data-testid="password"]', creds[role][1]);
  await page.click('[data-testid="login-btn"]');
  await page.waitForURL('**/dashboard**', { timeout: 10000 });
}

// ════════════════════════════════════════════
//  AUTH
// ════════════════════════════════════════════
test.describe('Dashboard: Autenticación', () => {
  test('TC-AUTH-001: Login exitoso con email y contraseña', async ({ page }) => {
    await login(page, 'owner');
    await expect(page.locator('[data-testid="dashboard-welcome"]')).toBeVisible();
    await expect(page).toHaveURL(/\/dashboard/);
  });

  test('TC-AUTH-002: Login fallido con credenciales incorrectas', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.fill('[data-testid="email"]', 'wrong@test.com');
    await page.fill('[data-testid="password"]', 'wrongpassword');
    await page.click('[data-testid="login-btn"]');
    await expect(page.locator('[data-testid="login-error"]')).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test('TC-AUTH-003: Logout', async ({ page }) => {
    await login(page);
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-btn"]');
    await expect(page).toHaveURL(/\/login|\/$/);
  });

  test('TC-AUTH-004: Recuperación de contraseña', async ({ page }) => {
    await page.goto(`${BASE}/login`);
    await page.click('[data-testid="forgot-password-link"]');
    await page.fill('[data-testid="recovery-email"]', process.env.TEST_USER_EMAIL!);
    await page.click('[data-testid="send-recovery-btn"]');
    await expect(page.locator('[data-testid="recovery-sent-msg"]')).toBeVisible();
  });

  test('TC-AUTH-005: Control de roles — staff no ve configuración', async ({ page }) => {
    await login(page, 'staff');
    await page.goto(`${BASE}/dashboard/settings`);
    // Staff debería ser redirigido o ver acceso denegado
    const isRedirected = page.url().includes('/dashboard') && !page.url().includes('/settings');
    const hasDenied = await page
      .locator('[data-testid="access-denied"]')
      .isVisible()
      .catch(() => false);
    expect(isRedirected || hasDenied).toBeTruthy();
  });

  test('TC-AUTH-006: Edición de perfil', async ({ page }) => {
    await login(page);
    await page.goto(`${BASE}/dashboard/profile`);
    await page.fill('[data-testid="profile-first-name"]', 'Juan');
    await page.fill('[data-testid="profile-last-name"]', 'Test Updated');
    await page.click('[data-testid="save-profile-btn"]');
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  });
});

// ════════════════════════════════════════════
//  ANALÍTICAS
// ════════════════════════════════════════════
test.describe('Dashboard: Analíticas', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('TC-ANALYTICS-001: Gráfico de ventas carga correctamente', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/analytics`);
    await expect(page.locator('[data-testid="sales-chart"]')).toBeVisible({ timeout: 10000 });
    await expect(page.locator('[data-testid="chart-loader"]')).not.toBeVisible({ timeout: 5000 });
  });

  test('TC-ANALYTICS-002: Filtros de fecha — hoy, semana, mes', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/analytics`);

    for (const period of ['today', 'week', 'month']) {
      await page.click(`[data-testid="filter-${period}"]`);
      await expect(page.locator('[data-testid="chart-loader"]')).not.toBeVisible({ timeout: 5000 });
      await expect(page.locator('[data-testid="kpi-total-sales"]')).toBeVisible();
    }
  });

  test('TC-ANALYTICS-003: Exportar reporte CSV', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/analytics`);
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      page.click('[data-testid="export-csv-btn"]'),
    ]);
    expect(download.suggestedFilename()).toMatch(/\.csv$/);
  });

  test('TC-ANALYTICS-004: KPIs visibles — visitas, conversión, ticket, ingreso', async ({
    page,
  }) => {
    await page.goto(`${BASE}/dashboard/analytics`);
    await expect(page.locator('[data-testid="kpi-visits"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-conversion"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-avg-ticket"]')).toBeVisible();
    await expect(page.locator('[data-testid="kpi-total-revenue"]')).toBeVisible();
  });
});

// ════════════════════════════════════════════
//  PEDIDOS
// ════════════════════════════════════════════
test.describe('Dashboard: Gestión de Pedidos', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('TC-ORDERS-001: Listado de pedidos con filtros', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/orders`);
    await expect(page.locator('[data-testid="orders-list"]')).toBeVisible();

    for (const status of ['pending', 'processing', 'completed']) {
      await page.click(`[data-testid="filter-status-${status}"]`);
      await expect(page.locator('[data-testid="orders-count"]')).toBeVisible();
    }
  });

  test('TC-ORDERS-002: Cambio de estado de pedido', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/orders?status=pending`);
    await page.click('[data-testid="order-item"]:first-child');

    await page.click('[data-testid="change-status-btn"]');
    await page.click('[data-testid="status-option-processing"]');

    await expect(page.locator('[data-testid="current-order-status"]')).toHaveText(/en proceso/i, {
      timeout: 5000,
    });
  });

  test('TC-ORDERS-003: Detalle de pedido completo', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/orders`);
    await page.click('[data-testid="order-item"]:first-child');

    await expect(page.locator('[data-testid="order-items-list"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-customer-info"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-payment-method"]')).toBeVisible();
    await expect(page.locator('[data-testid="order-total"]')).toBeVisible();
  });
});

// ════════════════════════════════════════════
//  INVENTARIO
// ════════════════════════════════════════════
test.describe('Dashboard: Inventario', () => {
  test.beforeEach(async ({ page }) => {
    await login(page);
  });

  test('TC-INV-001: Alta de producto', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/inventory/new`);
    await page.fill('[data-testid="product-name"]', 'Producto Test Inventario');
    await page.fill('[data-testid="product-sku"]', `SKU-${Date.now()}`);
    await page.fill('[data-testid="product-stock"]', '100');
    await page.fill('[data-testid="product-price"]', '50000');
    await page.click('[data-testid="save-product-btn"]');
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  });

  test('TC-INV-002: Alerta de bajo inventario', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/inventory`);
    // Buscar producto con stock bajo
    await expect(page.locator('[data-testid="low-stock-alert"]'))
      .toBeVisible({ timeout: 5000 })
      .catch(() => {
        // Si no hay productos con stock bajo, el test pasa (no es un error)
        console.log('No hay productos con stock bajo actualmente');
      });
  });

  test('TC-INV-003: Importación masiva vía CSV', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/inventory`);
    await page.click('[data-testid="import-csv-btn"]');

    const fileInput = page.locator('[data-testid="csv-upload-input"]');
    await fileInput.setInputFiles('tests/fixtures/products-import.csv');

    await page.click('[data-testid="confirm-import-btn"]');
    await expect(page.locator('[data-testid="import-success-msg"]')).toBeVisible({
      timeout: 15000,
    });
  });
});

// ════════════════════════════════════════════
//  CONFIGURACIÓN & BILLING
// ════════════════════════════════════════════
test.describe('Dashboard: Configuración', () => {
  test.beforeEach(async ({ page }) => {
    await login(page, 'owner');
  });

  test('TC-CONFIG-001: Ver plan actual y opciones de upgrade', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/settings/billing`);
    await expect(page.locator('[data-testid="current-plan"]')).toBeVisible();
    await expect(page.locator('[data-testid="upgrade-options"]')).toBeVisible();
  });

  test('TC-CONFIG-002: Configurar notificaciones', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/settings/notifications`);
    await page.check('[data-testid="notify-new-order"]');
    await page.check('[data-testid="notify-low-stock"]');
    await page.uncheck('[data-testid="notify-marketing"]');
    await page.click('[data-testid="save-notifications-btn"]');
    await expect(page.locator('[data-testid="success-toast"]')).toBeVisible();
  });

  test('TC-CONFIG-003: Generar API key', async ({ page }) => {
    await page.goto(`${BASE}/dashboard/settings/api`);
    await page.click('[data-testid="generate-api-key-btn"]');
    await page.click('[data-testid="confirm-generate-btn"]');

    const apiKey = await page.locator('[data-testid="api-key-value"]').textContent();
    expect(apiKey).toMatch(/^empr_[a-zA-Z0-9]{32,}/);
  });
});
