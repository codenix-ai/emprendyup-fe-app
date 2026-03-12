/**
 * Shared GraphQL mock data for dashboard E2E tests.
 */

// ─── Insights / KPIs ──────────────────────────────────────────────────────────

export const MOCK_TOTAL_PRODUCTS = {
  data: { totalProducts: 42 },
};

export const MOCK_MONTHLY_SALES = {
  data: {
    monthlySales: { totalSales: 3500000, percentageChange: 12.5 },
  },
};

export const MOCK_CONVERSION_RATE = {
  data: {
    conversionRate: { rate: 3.8, percentageChange: 0.5 },
  },
};

export const MOCK_ORDERS_BY_PERIOD = {
  data: {
    ordersByPeriod: [
      {
        period: 'Jan',
        count: 12,
        periodLabel: 'Enero',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      },
      {
        period: 'Feb',
        count: 18,
        periodLabel: 'Febrero',
        startDate: '2025-02-01',
        endDate: '2025-02-28',
      },
      {
        period: 'Mar',
        count: 25,
        periodLabel: 'Marzo',
        startDate: '2025-03-01',
        endDate: '2025-03-31',
      },
    ],
  },
};

export const MOCK_CUSTOMERS_BY_PERIOD = {
  data: {
    customersByPeriod: [
      {
        period: 'Jan',
        count: 5,
        periodLabel: 'Enero',
        startDate: '2025-01-01',
        endDate: '2025-01-31',
      },
      {
        period: 'Feb',
        count: 8,
        periodLabel: 'Febrero',
        startDate: '2025-02-01',
        endDate: '2025-02-28',
      },
    ],
  },
};

export const MOCK_RECENT_LEADS = {
  data: {
    getLeadsByStore: [],
  },
};

// ─── Products ─────────────────────────────────────────────────────────────────

export const MOCK_PRODUCTS_LIST = {
  data: {
    productsByStore: {
      items: [
        {
          id: 'prod-1',
          name: 'Camiseta Estampada',
          title: 'Camiseta Estampada Premium',
          description: 'Camiseta de alta calidad',
          price: 45000,
          currency: 'COP',
          available: true,
          inStock: true,
          stock: 20,
          landing: false,
          externalSKU: 'SKU-001',
          images: [{ id: 'img-1', url: 'https://via.placeholder.com/150', order: 1 }],
          colors: [],
          sizes: [],
          categories: [{ id: 'cat-1', name: 'Ropa' }],
          variants: [],
        },
        {
          id: 'prod-2',
          name: 'Pantalón Casual',
          title: 'Pantalón Casual Moderno',
          description: 'Pantalón cómodo y elegante',
          price: 80000,
          currency: 'COP',
          available: true,
          inStock: false,
          stock: 0,
          landing: false,
          externalSKU: 'SKU-002',
          images: [],
          colors: [],
          sizes: [],
          categories: [],
          variants: [],
        },
      ],
      total: 2,
      page: 1,
      pageSize: 10,
    },
  },
};

export const MOCK_PRODUCTS_EMPTY = {
  data: {
    productsByStore: { items: [], total: 0, page: 1, pageSize: 10 },
  },
};

export const MOCK_DELETE_PRODUCT_SUCCESS = {
  data: { deleteProduct: { id: 'prod-1' } },
};

// ─── Orders ───────────────────────────────────────────────────────────────────

export const MOCK_ORDERS_LIST = {
  data: {
    ordersByStore: [
      {
        id: 'order-1',
        status: 'pending',
        total: 125000,
        subtotal: 110000,
        tax: 15000,
        shipping: 0,
        createdAt: '2025-03-01T10:00:00Z',
        userName: 'María García',
        items: [
          {
            id: 'item-1',
            productName: 'Camiseta Estampada',
            quantity: 2,
            price: 45000,
            product: { name: 'Camiseta Estampada', images: [{ url: '' }] },
          },
        ],
        address: { name: 'María García', street: 'Calle 80 #10-20' },
        store: { id: 'store-1', name: 'Mi Tienda', logoUrl: '' },
      },
      {
        id: 'order-2',
        status: 'confirmed',
        total: 80000,
        subtotal: 70000,
        tax: 10000,
        shipping: 0,
        createdAt: '2025-03-02T14:00:00Z',
        userName: 'Carlos López',
        items: [],
        address: { name: 'Carlos López', street: 'Av. Carrera 15' },
        store: { id: 'store-1', name: 'Mi Tienda', logoUrl: '' },
      },
    ],
  },
};

export const MOCK_ORDERS_EMPTY = {
  data: { ordersByStore: [] },
};

// ─── Events ───────────────────────────────────────────────────────────────────

export const MOCK_EVENTS_LIST = {
  data: {
    eventsByServiceProvider: [
      {
        id: 'evt-1',
        title: 'Feria Emprendedora Bogotá',
        description: 'Gran feria de emprendimiento',
        eventType: 'FAIR',
        startDate: '2025-06-01T08:00:00Z',
        endDate: '2025-06-03T18:00:00Z',
        timezone: 'America/Bogota',
        location: 'Centro de Convenciones',
        venue: 'Salón Principal',
        address: 'Carrera 37 No. 24-67',
        city: 'Bogotá',
        country: 'Colombia',
        isVirtual: false,
        maxAttendees: 500,
        registrationFee: 0,
        currency: 'COP',
        organizerName: 'EmprendYup',
        organizerEmail: 'eventos@emprendyup.com',
        organizerPhone: '3001234567',
        createdAt: '2025-01-15T00:00:00Z',
      },
    ],
  },
};

export const MOCK_CREATE_EVENT_SUCCESS = {
  data: {
    createEvent: {
      id: 'evt-new',
      title: 'Mi Nuevo Evento',
      description: 'Descripción del evento',
      eventType: 'CONFERENCE',
      startDate: '2025-07-01T09:00:00Z',
      endDate: '2025-07-01T18:00:00Z',
      timezone: 'America/Bogota',
      location: 'Bogotá',
      venue: '',
      address: '',
      city: 'Bogotá',
      country: 'Colombia',
      isVirtual: false,
      maxAttendees: 100,
      registrationFee: 50000,
      currency: 'COP',
      organizerName: 'Organizador Test',
      organizerEmail: 'org@test.com',
      organizerPhone: '3009999999',
      createdAt: '2025-03-12T00:00:00Z',
    },
  },
};

// ─── Subscription Plans ────────────────────────────────────────────────────────

export const MOCK_SUBSCRIPTION_PRODUCTS = {
  data: {
    productsByStore: {
      items: [
        {
          id: 'plan-basic-monthly',
          name: 'basico-mensual',
          title: 'Plan Básico Mensual',
          description: 'Acceso básico a EmprendYup',
          price: 49000,
          currency: 'COP',
          metadata: JSON.stringify({
            planType: 'basico',
            features: ['5 productos', 'Soporte básico'],
          }),
          available: true,
          inStock: true,
          stock: 9999,
          landing: false,
          externalSKU: '',
          images: [],
          colors: [],
          sizes: [],
          categories: [],
          variants: [],
        },
        {
          id: 'plan-pro-annual',
          name: 'pro-anual',
          title: 'Plan Pro Anual',
          description: 'Acceso profesional a EmprendYup',
          price: 490000,
          currency: 'COP',
          metadata: JSON.stringify({
            planType: 'pro',
            features: ['Productos ilimitados', 'Soporte prioritario'],
          }),
          available: true,
          inStock: true,
          stock: 9999,
          landing: false,
          externalSKU: '',
          images: [],
          colors: [],
          sizes: [],
          categories: [],
          variants: [],
        },
      ],
      total: 2,
      page: 1,
      pageSize: 20,
    },
  },
};
