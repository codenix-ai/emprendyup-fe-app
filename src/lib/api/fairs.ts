import { getAuthToken } from '@/lib/utils/authToken';

export type PaymentMethod =
  | 'CASH'
  | 'NEQUI'
  | 'DAVIPLATA'
  | 'PSE'
  | 'CREDIT_CARD'
  | 'DEBIT_CARD'
  | 'TRANSFER'
  | 'OTHER';

export interface Fair {
  id: string;
  storeId: string;
  name: string;
  startsAt: string;
  endsAt: string;
  status?: string;
  isActive?: boolean;
  closedAt?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface CreateFairInput {
  name: string;
  startsAt: string;
  endsAt: string;
}

export interface FairSaleItemInput {
  productId: string;
  quantity: number;
}

export interface CreateFairSaleInput {
  paymentMethod: PaymentMethod | string;
  items: FairSaleItemInput[];
  customerName?: string;
  customerContact?: string;
}

export interface FairSale {
  id: string;
  fairId?: string;
  storeId?: string;
  paymentMethod?: string;
  total?: number;
  currency?: string;
  customerName?: string | null;
  customerContact?: string | null;
  createdAt?: string;
  items?: Array<{
    productId: string;
    quantity: number;
    unitPrice?: number;
    productName?: string;
  }>;
}

export interface FairSummary {
  totalSold: number;
  numberOfSales: number;
  currency?: string;
}

export class FairsApiError extends Error {
  status: number;
  data: any;

  constructor(message: string, status: number, data?: any) {
    super(message);
    this.name = 'FairsApiError';
    this.status = status;
    this.data = data;
  }
}

function getApiBase(): string {
  const base = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
  return base.replace(/\/$/, '');
}

async function parseJsonSafe(res: Response): Promise<any> {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

async function fairsFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const token = getAuthToken();
  const res = await fetch(`${getApiBase()}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers || {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  });

  if (!res.ok) {
    const data = await parseJsonSafe(res);
    const message =
      data?.message || data?.error || data?.detail || res.statusText || 'Request failed';
    throw new FairsApiError(message, res.status, data);
  }

  if (res.status === 204) return null as T;
  return (await parseJsonSafe(res)) as T;
}

export const fairsApi = {
  createFair: (input: CreateFairInput) =>
    fairsFetch<Fair>('/fairs', { method: 'POST', body: JSON.stringify(input) }),

  listMyFairs: () => fairsFetch<Fair[]>('/fairs', { method: 'GET' }),

  listActiveFairs: () => fairsFetch<Fair[]>('/fairs/active', { method: 'GET' }),

  getFairById: (fairId: string) => fairsFetch<Fair>(`/fairs/${fairId}`, { method: 'GET' }),

  closeFair: (fairId: string) => fairsFetch<Fair>(`/fairs/${fairId}/close`, { method: 'PATCH' }),

  createSale: (fairId: string, input: CreateFairSaleInput) =>
    fairsFetch<FairSale>(`/fairs/${fairId}/sales`, {
      method: 'POST',
      body: JSON.stringify(input),
    }),

  listSales: (fairId: string) =>
    fairsFetch<FairSale[]>(`/fairs/${fairId}/sales`, { method: 'GET' }),

  getSummary: (fairId: string) =>
    fairsFetch<FairSummary>(`/fairs/${fairId}/summary`, { method: 'GET' }),
};
