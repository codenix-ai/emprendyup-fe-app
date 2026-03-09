/**
 * Playwright GraphQL network interception helpers.
 * Intercepts requests to the GraphQL endpoint and returns mock responses.
 */
import { Page, Route } from '@playwright/test';

const GRAPHQL_URL = 'https://api.emprendy.ai/graphql';

type MockHandler = (body: Record<string, unknown>) => Record<string, unknown>;

/**
 * Intercepts ALL GraphQL requests and routes them to per-operation handlers.
 *
 * @param page      Playwright Page instance
 * @param handlers  Map of { operationName: mockResponseOrHandler }
 *
 * Example:
 *   await mockGraphQL(page, {
 *     Login: MOCK_LOGIN_SUCCESS,
 *     Register: (body) => body.variables.input.email.includes('existing') ? MOCK_REGISTER_ERROR : MOCK_REGISTER_SUCCESS,
 *   });
 */
export async function mockGraphQL(
  page: Page,
  handlers: Record<string, Record<string, unknown> | MockHandler>
) {
  await page.route(GRAPHQL_URL, async (route: Route) => {
    const request = route.request();
    let body: Record<string, unknown> = {};

    try {
      body = JSON.parse(request.postData() || '{}');
    } catch {
      // ignore parse errors
    }

    const operationName = body.operationName as string;
    const handler = handlers[operationName];

    if (handler) {
      const response = typeof handler === 'function' ? (handler as MockHandler)(body) : handler;
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify(response),
      });
    } else {
      // Pass through unmatched operations (e.g. Apollo introspection)
      await route.continue();
    }
  });
}

/**
 * Intercepts REST API calls (for password reset, etc.)
 */
export async function mockRestAPI(
  page: Page,
  handlers: Record<string, { status: number; body: Record<string, unknown> }>
) {
  const BASE = 'https://api.emprendy.ai';

  await page.route(`${BASE}/**`, async (route) => {
    const url = route.request().url().replace(BASE, '');
    const match = Object.keys(handlers).find((path) => url.includes(path));

    if (match) {
      const { status, body } = handlers[match];
      await route.fulfill({
        status,
        contentType: 'application/json',
        body: JSON.stringify(body),
      });
    } else {
      await route.continue();
    }
  });
}

/**
 * Seeds localStorage with a valid authenticated session.
 * Useful as an auth setup helper so tests don't need to go through login UI.
 */
export async function seedAuthSession(
  page: Page,
  user: Record<string, unknown>,
  token = 'mock-access-token-abc123'
) {
  await page.goto('/');
  await page.evaluate(
    ({ user, token }) => {
      localStorage.setItem('accessToken', token);
      localStorage.setItem('user', JSON.stringify(user));
    },
    { user, token }
  );
}
