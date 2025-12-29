import { z } from 'zod';

// Store schema
export const StoreSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  brandColor: z.string(),
  logoUrl: z.string().optional(),
  currency: z.string(),
  ownerId: z.string(),
  industry: z.string(),
  country: z.string(),
  subdomain: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const CreateStoreSchema = z.object({
  name: z.string().min(1, 'Store name is required'),
  industry: z.string().min(1, 'Industry is required'),
  country: z.string().min(1, 'Country is required'),
  currency: z.string().min(1, 'Currency is required'),
  brandColor: z.string().min(1, 'Brand color is required'),
  logoUrl: z.string().optional(),
  subdomain: z.string().min(1, 'Subdomain is required'),
});

// Order schema
export const OrderSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  customerEmail: z.string(),
  items: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      quantity: z.number(),
      price: z.number(),
    })
  ),
  total: z.number(),
  status: z.enum(['pending', 'processing', 'shipped', 'delivered', 'cancelled']),
  createdAt: z.string(),
  updatedAt: z.string(),
});

// Customer/Lead schema
export const CustomerSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  phone: z.string().optional(),
  status: z.enum(['lead', 'customer', 'vip']),
  lastContactAt: z.string(),
  totalSpent: z.number().default(0),
  ordersCount: z.number().default(0),
  createdAt: z.string(),
});

// Bonus Rule schema
export const BonusRuleSchema = z.object({
  id: z.string(),
  storeId: z.string(),
  name: z.string(),
  type: z.enum(['percentage', 'fixed', 'points']),
  value: z.number(),
  conditions: z.object({
    minOrderValue: z.number().optional(),
    maxUses: z.number().optional(),
    validUntil: z.string().optional(),
  }),
  isActive: z.boolean(),
  createdAt: z.string(),
});

export const CreateBonusRuleSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  type: z.enum(['percentage', 'fixed', 'points']),
  value: z.number().min(0, 'Value must be positive'),
  conditions: z
    .object({
      minOrderValue: z.number().optional(),
      maxUses: z.number().optional(),
      validUntil: z.string().optional(),
    })
    .optional(),
});

// Client Wallet schema
export const ClientWalletSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  customerName: z.string(),
  balance: z.number(),
  points: z.number(),
  lastUpdated: z.string(),
});

// KPI schema
export const KPISchema = z.object({
  totalCustomers: z.number(),
  totalOrders: z.number(),
  monthlyRevenue: z.number(),
  conversionRate: z.number(),
  averageOrderValue: z.number(),
});

// Chart data schema
export const ChartDataSchema = z.object({
  customersGrowth: z.array(
    z.object({
      date: z.string(),
      customers: z.number(),
    })
  ),
  topSources: z.array(
    z.object({
      source: z.string(),
      customers: z.number(),
      percentage: z.number(),
    })
  ),
  salesFunnel: z.array(
    z.object({
      stage: z.string(),
      count: z.number(),
      percentage: z.number(),
    })
  ),
  ordersByPeriod: z
    .array(
      z.object({
        date: z.string(),
        count: z.number(),
      })
    )
    .optional(),
  salesByPeriod: z
    .array(
      z.object({
        date: z.string(),
        totalSales: z.number(),
        totalOrders: z.number(),
        averageOrderValue: z.number(),
      })
    )
    .optional(),
});

// User profile schema
export const UserProfileSchema = z.object({
  id: z.string(),
  name: z.string(),
  email: z.string().email(),
  role: z.enum(['MODERATOR', 'STORE_ADMIN', 'ADMIN', 'USER', 'CUSTOMER']),
  avatar: z.string().optional(),
  phone: z.string().optional(),
  company: z.string().optional(),
  timezone: z.string().optional(),
  storeId: z.string().optional(),
  serviceProviderId: z.string().optional(),
  restaurantId: z.string().optional(),
});

export const UpdateProfileSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Valid email is required'),
  phone: z.string().optional(),
  company: z.string().optional(),
  timezone: z.string().optional(),
});

// Export types
export type Store = z.infer<typeof StoreSchema>;
export type CreateStore = z.infer<typeof CreateStoreSchema>;
export type Order = z.infer<typeof OrderSchema>;
export type Customer = z.infer<typeof CustomerSchema>;
export type BonusRule = z.infer<typeof BonusRuleSchema>;
export type CreateBonusRule = z.infer<typeof CreateBonusRuleSchema>;
export type ClientWallet = z.infer<typeof ClientWalletSchema>;
export type KPI = z.infer<typeof KPISchema>;
export type ChartData = z.infer<typeof ChartDataSchema>;
export type UserProfile = z.infer<typeof UserProfileSchema>;
export type UpdateProfile = z.infer<typeof UpdateProfileSchema>;
