/**
 * Shared auth fixture data and GraphQL mock helpers for E2E tests.
 */

export const TEST_USER = {
  id: 'test-user-id-123',
  email: 'test@emprendyup.com',
  name: 'Test User',
  role: 'SELLER',
  membershipLevel: 'FREE',
  storeId: null,
  restaurantId: null,
  serviceProviderId: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  updatedAt: '2024-01-01T00:00:00.000Z',
};

export const TEST_USER_WITH_STORE = {
  ...TEST_USER,
  storeId: 'store-id-123',
};

export const TEST_ADMIN_USER = {
  ...TEST_USER,
  id: 'admin-id-123',
  email: 'admin@emprendyup.com',
  name: 'Admin User',
  role: 'ADMIN',
};

export const TEST_ACCESS_TOKEN = 'mock-access-token-abc123';

export const MOCK_LOGIN_SUCCESS = {
  data: {
    login: {
      access_token: TEST_ACCESS_TOKEN,
      user: TEST_USER,
    },
  },
};

export const MOCK_LOGIN_SUCCESS_WITH_STORE = {
  data: {
    login: {
      access_token: TEST_ACCESS_TOKEN,
      user: TEST_USER_WITH_STORE,
    },
  },
};

export const MOCK_LOGIN_ADMIN_SUCCESS = {
  data: {
    login: {
      access_token: TEST_ACCESS_TOKEN,
      user: TEST_ADMIN_USER,
    },
  },
};

export const MOCK_LOGIN_ERROR = {
  errors: [{ message: 'Credenciales inválidas' }],
};

export const MOCK_REGISTER_SUCCESS = {
  data: {
    register: {
      user: { id: 'new-user-id', email: 'new@emprendyup.com', name: 'New User', storeId: null },
      access_token: TEST_ACCESS_TOKEN,
    },
  },
};

export const MOCK_REGISTER_ERROR_EMAIL_EXISTS = {
  errors: [{ message: 'El correo ya está registrado' }],
};

export const MOCK_CREATE_STORE_SUCCESS = {
  data: {
    createStore: {
      id: 'new-store-id-456',
      name: 'Mi Tienda Test',
      subdomain: 'mitiendatest',
      status: 'ACTIVE',
    },
  },
};

export const MOCK_CREATE_RESTAURANT_SUCCESS = {
  data: {
    createRestaurantWithBranding: {
      id: 'new-restaurant-id-789',
      name: 'Mi Restaurante Test',
      status: 'ACTIVE',
    },
  },
};
