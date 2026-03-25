'use client';

import React, { useEffect, useState } from 'react';
import { gql, useQuery } from '@apollo/client';
import {
  Users,
  ShoppingCart,
  DollarSign,
  Package,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Store,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Barlow_Condensed, Outfit } from 'next/font/google';
import { motion } from 'framer-motion';
import LineChart from '../components/LineChart';
import BarChart from '../components/BarChart';
import { ChartData, Customer, UserProfile } from '@/lib/schemas/dashboard';
import { useSessionStore } from '@/lib/store/dashboard';
import { SectionLoader } from '@/app/components/Loader';

// ─── Fonts ───────────────────────────────────────────────────────────────────
const barlowCondensed = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '600', '700', '800', '900'],
  variable: '--font-barlow',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600'],
  variable: '--font-outfit',
  display: 'swap',
});

// ─── StatCard sub-component ───────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  trend?: number;
  isPositive?: boolean;
  loading?: boolean;
  accent: string;
  icon: React.ComponentType<{ size?: number; strokeWidth?: number }>;
  index: number;
}

function StatCard({
  label,
  value,
  trend,
  isPositive,
  loading,
  accent,
  icon: Icon,
  index,
}: StatCardProps) {
  const hasTrend = trend !== undefined && trend !== 0;
  const TrendIcon = !hasTrend ? Minus : isPositive ? ArrowUpRight : ArrowDownRight;
  const trendColor = !hasTrend ? '#9ca3af' : isPositive ? '#00B077' : '#F04E23';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.08 + index * 0.07, duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
      className="relative bg-white dark:bg-[#13151F] border border-gray-200 dark:border-white/[0.07] overflow-hidden group cursor-default"
      style={{ borderLeftWidth: 3, borderLeftColor: accent }}
    >
      {loading ? (
        <div className="p-6 animate-pulse space-y-4">
          <div className="flex justify-between">
            <div className="h-2.5 bg-gray-200 dark:bg-white/10 rounded w-28" />
            <div className="h-5 w-5 bg-gray-200 dark:bg-white/10 rounded" />
          </div>
          <div className="h-12 bg-gray-200 dark:bg-white/10 rounded w-36" />
          <div className="h-2.5 bg-gray-200 dark:bg-white/10 rounded w-24" />
        </div>
      ) : (
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <p
              className="text-[10.5px] font-semibold tracking-[0.18em] uppercase select-none text-gray-500 dark:text-[rgba(240,238,233,0.38)]"
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              {label}
            </p>
            <div
              style={{ color: accent, opacity: 0.55 }}
              className="group-hover:opacity-90 transition-opacity duration-200 mt-0.5"
            >
              <Icon size={16} strokeWidth={2} />
            </div>
          </div>

          <p
            className="font-black leading-none mb-4 select-none text-gray-900 dark:text-[#F0EEE9]"
            style={{
              fontFamily: 'var(--font-barlow)',
              fontSize: 'clamp(2.1rem, 3.5vw, 2.8rem)',
              letterSpacing: '-0.025em',
            }}
          >
            {typeof value === 'number' ? value.toLocaleString('es-CO') : value}
          </p>

          <div className="flex items-center gap-1.5">
            <TrendIcon size={13} strokeWidth={2.5} style={{ color: trendColor }} />
            <span
              className="text-[11px] font-medium select-none"
              style={{ fontFamily: 'var(--font-outfit)', color: trendColor }}
            >
              {!hasTrend ? 'Sin variación' : `${isPositive ? '+' : ''}${trend}% vs mes anterior`}
            </span>
          </div>
        </div>
      )}

      {/* Animated bottom accent on hover */}
      <div
        className="absolute bottom-0 left-0 h-[2px] w-0 group-hover:w-full transition-all duration-500 ease-out"
        style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }}
      />
    </motion.div>
  );
}

const TOTAL_PRODUCTS_QUERY = gql`
  query {
    totalProducts
  }
`;

const MONTHLY_SALES_QUERY = gql`
  query {
    monthlySales {
      totalSales
      percentageChange
    }
  }
`;
const CONVERSION_RATE_QUERY = gql`
  query ConversionRate($storeId: String) {
    conversionRate(storeId: $storeId) {
      rate
      percentageChange
    }
  }
`;

const ORDERS_BY_PERIOD = gql`
  query OrdersByPeriod($period: Period!, $storeId: String, $limit: Float) {
    ordersByPeriod(period: $period, storeId: $storeId, limit: $limit) {
      period
      count
      periodLabel
      startDate
      endDate
    }
  }
`;

const CUSTOMERS_BY_PERIOD = gql`
  query CustomersByPeriod($period: Period!, $storeId: String, $limit: Float) {
    customersByPeriod(period: $period, storeId: $storeId, limit: $limit) {
      period
      count
      periodLabel
      startDate
      endDate
    }
  }
`;

const SALES_BY_PERIOD = gql`
  query SalesByPeriod($period: Period!, $storeId: String, $limit: Float) {
    salesByPeriod(period: $period, storeId: $storeId, limit: $limit) {
      period
      totalSales
      totalOrders
      averageOrderValue
      periodLabel
      startDate
      endDate
    }
  }
`;

const ACTIVE_USERS_QUERY = gql`
  query ActiveUsers($storeId: String, $daysBack: Float) {
    activeUsers(storeId: $storeId, daysBack: $daysBack) {
      count
      percentageChange
      lastActiveDate
    }
  }
`;

const CONTACT_LEADS_BY_STORE = gql`
  query ContactLeadsByStore($storeId: ID!) {
    contactLeadsByStore(storeId: $storeId) {
      id
      firstName
      lastName
      email
      phoneNumber
      createdAt
      updatedAt
      store {
        id
        name
      }
    }
  }
`;

// ─── Raw API types ────────────────────────────────────────────────────────────
interface RawLeadRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phoneNumber?: string;
  createdAt: string;
  updatedAt?: string;
  store?: { id: string; name: string };
}

interface RawCustomerPeriod {
  period: string;
  count: number;
  periodLabel: string;
  startDate: string;
  endDate: string;
}

interface RawSalesPeriod {
  period: string;
  totalSales: number;
  totalOrders: number;
  averageOrderValue: number;
  periodLabel: string;
  startDate: string;
  endDate: string;
}

interface RawOrderPeriod {
  period: string;
  count: number;
  periodLabel: string;
  startDate: string;
  endDate: string;
}

// ─── Lead badge helper ────────────────────────────────────────────────────────
const LEAD_BADGE: Record<string, { bg: string; text: string; border: string; label: string }> = {
  lead: {
    bg: 'rgba(255,210,51,0.12)',
    text: '#FFD233',
    border: 'rgba(255,210,51,0.22)',
    label: 'LEAD',
  },
  customer: {
    bg: 'rgba(0,176,119,0.12)',
    text: '#00B077',
    border: 'rgba(0,176,119,0.22)',
    label: 'CLIENTE',
  },
  vip: {
    bg: 'rgba(240,78,35,0.12)',
    text: '#F04E23',
    border: 'rgba(240,78,35,0.22)',
    label: 'VIP',
  },
};

// ─── Main page ────────────────────────────────────────────────────────────────
export default function InsightsPage() {
  const router = useRouter();
  const [chartData, setChartData] = useState<ChartData | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);
  const currentStore = useSessionStore((s) => s.currentStore);

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const parsed = JSON.parse(userData) as UserProfile;
        setUser(parsed);
        if (parsed?.serviceProviderId) {
          router.replace('/dashboard/service-dashboard');
        }
      } catch {
        // ignore parse errors
      }
    }
  }, [router]);

  const storeId = currentStore?.id || user?.storeId;

  // ── Queries ──────────────────────────────────────────────────────────────────
  const {
    data: totalProductsData,
    loading: loadingProducts,
    error: errorProducts,
  } = useQuery(TOTAL_PRODUCTS_QUERY);
  const {
    data: activeUsersData,
    loading: loadingActiveUsers,
    error: errorActiveUsers,
  } = useQuery(ACTIVE_USERS_QUERY);
  const {
    data: monthlySalesData,
    loading: loadingMonthlySales,
    error: errorMonthlySales,
  } = useQuery(MONTHLY_SALES_QUERY);
  const {
    data: conversionRateData,
    loading: loadingConversionRate,
    error: errorConversionRate,
  } = useQuery(CONVERSION_RATE_QUERY, { variables: { storeId } });
  const {
    data: ordersByPeriodData,
    loading: loadingOrdersByPeriod,
    error: errorOrdersByPeriod,
  } = useQuery(ORDERS_BY_PERIOD, {
    variables: { period: 'WEEK', storeId: storeId || null, limit: 12.0 },
    skip: !storeId,
  });
  const { data: customersByPeriodData } = useQuery(CUSTOMERS_BY_PERIOD, {
    variables: { period: 'MONTH', storeId: storeId || null, limit: 6.0 },
    skip: !storeId,
  });
  const { data: salesByPeriodData } = useQuery(SALES_BY_PERIOD, {
    variables: { period: 'MONTH', storeId: storeId || null, limit: 6.0 },
    skip: !storeId,
  });
  const {
    data: leadsData,
    loading: loadingLeads,
    error: errorLeads,
  } = useQuery(CONTACT_LEADS_BY_STORE, { variables: { storeId: storeId || '' }, skip: !storeId });

  useEffect(() => {
    if (errorProducts) console.error('Products query error:', errorProducts);
    if (errorActiveUsers) console.error('Active users query error:', errorActiveUsers);
    if (errorMonthlySales) console.error('Monthly sales query error:', errorMonthlySales);
    if (errorConversionRate) console.error('Conversion rate query error:', errorConversionRate);
    if (errorOrdersByPeriod) console.error('Orders by period error:', errorOrdersByPeriod);
    if (errorLeads) console.error('Leads query error:', errorLeads);
  }, [
    errorProducts,
    errorActiveUsers,
    errorMonthlySales,
    errorConversionRate,
    errorOrdersByPeriod,
    errorLeads,
  ]);

  const leads: Customer[] =
    leadsData?.contactLeadsByStore?.map((lead: RawLeadRecord) => ({
      id: lead.id,
      name: `${lead.firstName} ${lead.lastName}`,
      email: lead.email,
      phone: lead.phoneNumber,
      status: 'lead' as const,
      lastContactAt: lead.updatedAt ?? lead.createdAt,
      totalSpent: 0,
      ordersCount: 0,
      createdAt: lead.createdAt,
    })) ?? [];

  useEffect(() => {
    setChartData({
      customersGrowth: (customersByPeriodData?.customersByPeriod ?? []).map(
        (c: RawCustomerPeriod) => ({
          date: c.periodLabel,
          customers: c.count,
        })
      ),
      salesByPeriod: (salesByPeriodData?.salesByPeriod ?? []).map((s: RawSalesPeriod) => ({
        date: s.periodLabel,
        totalSales: s.totalSales,
        totalOrders: s.totalOrders,
        averageOrderValue: s.averageOrderValue,
      })),
      ordersByPeriod: ordersByPeriodData?.ordersByPeriod?.length
        ? ordersByPeriodData.ordersByPeriod.map((o: RawOrderPeriod) => ({
            date: o.periodLabel,
            count: o.count,
          }))
        : (salesByPeriodData?.salesByPeriod ?? []).map((s: RawSalesPeriod) => ({
            date: s.periodLabel,
            count: s.totalOrders ?? 0,
          })),
      topSources: [],
      salesFunnel: [],
    });
  }, [customersByPeriodData, salesByPeriodData, ordersByPeriodData]);

  // ── Derived values ───────────────────────────────────────────────────────────
  const latestOrders = (() => {
    const orders = ordersByPeriodData?.ordersByPeriod || [];
    return orders.length ? (orders[orders.length - 1]?.count ?? 0) : 0;
  })();

  const ordersTrend = (() => {
    const orders = ordersByPeriodData?.ordersByPeriod || [];
    if (orders.length < 2) return 0;
    const latest = orders[orders.length - 1];
    const prev = orders[orders.length - 2];
    if (!prev?.count) return 0;
    return Math.round(((latest.count - prev.count) / Math.max(prev.count, 1)) * 1000) / 10;
  })();

  const statCards: StatCardProps[] = [
    {
      label: 'Ventas Mensuales',
      value: monthlySalesData?.monthlySales
        ? `$${monthlySalesData.monthlySales.totalSales.toLocaleString('es-CO')}`
        : '$0',
      trend: monthlySalesData?.monthlySales?.percentageChange ?? 0,
      isPositive: (monthlySalesData?.monthlySales?.percentageChange ?? 0) >= 0,
      loading: loadingMonthlySales,
      accent: '#F04E23',
      icon: DollarSign,
      index: 0,
    },
    {
      label: 'Usuarios Activos',
      value: activeUsersData?.activeUsers?.count ?? 0,
      trend: activeUsersData?.activeUsers?.percentageChange ?? 0,
      isPositive: (activeUsersData?.activeUsers?.percentageChange ?? 0) >= 0,
      loading: loadingActiveUsers,
      accent: '#00B077',
      icon: Users,
      index: 1,
    },
    {
      label: 'Total Productos',
      value: totalProductsData?.totalProducts ?? 0,
      trend: 0,
      isPositive: true,
      loading: loadingProducts,
      accent: '#FFD233',
      icon: Package,
      index: 2,
    },
    {
      label: 'Órdenes Recientes',
      value: latestOrders,
      trend: ordersTrend,
      isPositive: ordersTrend >= 0,
      loading: loadingOrdersByPeriod,
      accent: '#00B2FF',
      icon: ShoppingCart,
      index: 3,
    },
  ];

  const today = new Date().toLocaleDateString('es-CO', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  // Unused but required to satisfy linter for conversionRateData
  void conversionRateData;
  void loadingConversionRate;

  // ── Loading state ────────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div
        className={`${barlowCondensed.variable} ${outfit.variable} min-h-[60vh] bg-gray-50 dark:bg-[#0B0C11] flex items-center justify-center`}
      >
        <div className="flex flex-col items-center gap-4">
          <div
            className="w-10 h-10 rounded-full border-2 border-transparent animate-spin"
            style={{ borderTopColor: '#F04E23', borderRightColor: '#F04E23' }}
          />
          <p
            className="text-[10px] tracking-[0.28em] uppercase text-gray-400 dark:text-[rgba(240,238,233,0.3)]"
            style={{ fontFamily: 'var(--font-outfit)' }}
          >
            Cargando panel
          </p>
        </div>
      </div>
    );
  }

  // ── No store state ───────────────────────────────────────────────────────────
  if (user && !storeId) {
    return (
      <div
        className={`${barlowCondensed.variable} ${outfit.variable} min-h-screen bg-gray-50 dark:bg-[#0B0C11] p-6 md:p-10`}
      >
        <div className="max-w-2xl">
          <p
            className="text-[10px] tracking-[0.3em] uppercase mb-3 text-gray-400 dark:text-[rgba(240,238,233,0.3)]"
            style={{ fontFamily: 'var(--font-outfit)' }}
          >
            Panel de Insights
          </p>
          <h1
            className="font-black mb-8 leading-tight text-gray-900 dark:text-[#F0EEE9]"
            style={{
              fontFamily: 'var(--font-barlow)',
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              letterSpacing: '-0.025em',
            }}
          >
            Bienvenido a <span style={{ color: '#F04E23' }}>Emprendy.ai</span>
          </h1>

          <div
            className="border border-gray-200 dark:border-white/[0.08] p-8"
            style={{ borderLeftWidth: 3, borderLeftColor: '#F04E23' }}
          >
            <div className="flex items-start gap-6">
              <div
                className="w-11 h-11 flex-shrink-0 flex items-center justify-center"
                style={{ background: 'rgba(240,78,35,0.1)', color: '#F04E23' }}
              >
                <Store size={22} />
              </div>
              <div>
                <h3
                  className="text-base font-semibold mb-2 text-gray-900 dark:text-[#F0EEE9]"
                  style={{ fontFamily: 'var(--font-outfit)' }}
                >
                  Crea tu primera tienda
                </h3>
                <p
                  className="text-sm mb-6 leading-relaxed text-gray-600 dark:text-[rgba(240,238,233,0.48)]"
                  style={{ fontFamily: 'var(--font-outfit)' }}
                >
                  Para ver tus métricas e insights, primero necesitas crear tu tienda online. Todo
                  el rendimiento de tu negocio aparecerá aquí.
                </p>
                <button
                  onClick={() => router.push('/dashboard/store/new')}
                  className="px-6 py-3 text-sm font-semibold tracking-wide transition-all duration-200 hover:opacity-90 active:scale-95"
                  style={{ fontFamily: 'var(--font-outfit)', background: '#F04E23', color: '#fff' }}
                >
                  Crear mi tienda →
                </button>
              </div>
            </div>
          </div>

          {/* Ghost KPI preview */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8 opacity-[0.18] pointer-events-none select-none">
            {(['Ventas', 'Usuarios', 'Productos', 'Órdenes'] as const).map((lbl, i) => (
              <div
                key={lbl}
                className="bg-gray-100 dark:bg-[#13151F] border border-gray-200 dark:border-white/[0.07] p-4"
                style={{
                  borderLeftWidth: 3,
                  borderLeftColor: ['#F04E23', '#00B077', '#FFD233', '#00B2FF'][i],
                }}
              >
                <p
                  className="text-[9px] tracking-widest uppercase mb-2 text-gray-400 dark:text-[rgba(240,238,233,0.3)]"
                  style={{ fontFamily: 'var(--font-outfit)' }}
                >
                  {lbl}
                </p>
                <p
                  className="text-3xl font-black text-gray-300 dark:text-[rgba(240,238,233,0.2)]"
                  style={{ fontFamily: 'var(--font-barlow)' }}
                >
                  —
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  // ── Dark chart container class ────────────────────────────────────────────────
  const darkChartClass = 'bg-white dark:bg-[#13151F] p-5 pt-4';

  // ── Main render ──────────────────────────────────────────────────────────────
  return (
    <div
      className={`${barlowCondensed.variable} ${outfit.variable} min-h-screen bg-gray-50 dark:bg-[#0B0C11]`}
    >
      <div className="p-5 md:p-8 lg:p-10 space-y-8 max-w-[1400px] mx-auto">
        {/* ── Header ── */}
        <motion.header
          initial={{ opacity: 0, y: -14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: [0.22, 1, 0.36, 1] }}
          className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-7 border-b border-gray-200 dark:border-white/[0.07]"
        >
          <div>
            <p
              className="text-[10px] tracking-[0.32em] uppercase mb-2 text-gray-400 dark:text-[rgba(240,238,233,0.32)]"
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              Panel de Insights
            </p>
            <h1
              className="font-black leading-none text-gray-900 dark:text-[#F0EEE9]"
              style={{
                fontFamily: 'var(--font-barlow)',
                fontSize: 'clamp(1.8rem, 3.5vw, 2.75rem)',
                letterSpacing: '-0.02em',
              }}
            >
              Pulso de tu <span style={{ color: '#F04E23' }}>negocio</span>
            </h1>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {currentStore?.name && (
              <div
                className="px-3 py-1.5 text-xs font-semibold tracking-wide"
                style={{
                  fontFamily: 'var(--font-outfit)',
                  background: 'rgba(240,78,35,0.1)',
                  color: '#F04E23',
                  border: '1px solid rgba(240,78,35,0.22)',
                }}
              >
                {currentStore.name}
              </div>
            )}
            <p
              className="text-[11px] capitalize text-gray-400 dark:text-[rgba(240,238,233,0.28)]"
              style={{ fontFamily: 'var(--font-outfit)' }}
            >
              {today}
            </p>
          </div>
        </motion.header>

        {/* ── KPI Grid ── */}
        <section>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-[3px] sm:gap-3">
            {statCards.map((card) => (
              <StatCard key={card.label} {...card} />
            ))}
          </div>
        </section>

        {/* ── Charts ── */}
        <section>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.42 }}
            className="text-[10px] tracking-[0.28em] uppercase mb-3 text-gray-400 dark:text-[rgba(240,238,233,0.28)]"
            style={{ fontFamily: 'var(--font-outfit)' }}
          >
            Tendencias
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.48, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-3"
          >
            {chartData ? (
              <>
                {/* Customers Growth */}
                <div className="bg-white dark:bg-[#13151F] border border-gray-200 dark:border-white/[0.07] overflow-hidden">
                  <div className="px-5 py-3.5 flex items-center gap-2 border-b border-gray-100 dark:border-white/[0.05]">
                    <div className="w-0.5 h-4" style={{ background: '#00B077' }} />
                    <p
                      className="text-[10.5px] font-semibold tracking-[0.14em] uppercase text-gray-500 dark:text-[rgba(240,238,233,0.42)]"
                      style={{ fontFamily: 'var(--font-outfit)' }}
                    >
                      Crecimiento de Clientes
                    </p>
                  </div>
                  <LineChart
                    data={chartData.customersGrowth}
                    xKey="date"
                    yKey="customers"
                    title=""
                    color="#00B077"
                    theme="dark"
                    containerClassName={darkChartClass}
                    height={240}
                  />
                </div>

                {/* Orders by period */}
                <div className="bg-white dark:bg-[#13151F] border border-gray-200 dark:border-white/[0.07] overflow-hidden">
                  <div className="px-5 py-3.5 flex items-center gap-2 border-b border-gray-100 dark:border-white/[0.05]">
                    <div className="w-0.5 h-4" style={{ background: '#00B2FF' }} />
                    <p
                      className="text-[10.5px] font-semibold tracking-[0.14em] uppercase text-gray-500 dark:text-[rgba(240,238,233,0.42)]"
                      style={{ fontFamily: 'var(--font-outfit)' }}
                    >
                      Órdenes por Periodo
                    </p>
                  </div>
                  <BarChart
                    data={chartData.ordersByPeriod || []}
                    xKey="date"
                    yKey="count"
                    title=""
                    color="#00B2FF"
                    containerClassName={darkChartClass}
                    height={240}
                  />
                </div>
              </>
            ) : (
              <>
                {[0, 1].map((i) => (
                  <div
                    key={i}
                    className="bg-white dark:bg-[#13151F] border border-gray-200 dark:border-white/[0.07] p-5"
                  >
                    <div className="animate-pulse space-y-3">
                      <div className="h-2.5 bg-gray-200 dark:bg-white/[0.08] rounded w-36" />
                      <div className="h-48 bg-gray-100 dark:bg-white/[0.04] rounded" />
                    </div>
                  </div>
                ))}
              </>
            )}
          </motion.div>
        </section>

        {/* ── Leads Table ── */}
        <motion.section
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.58, duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="bg-white dark:bg-[#13151F] border border-gray-200 dark:border-white/[0.07] overflow-hidden">
            {/* Table header */}
            <div className="px-6 py-4 flex items-center justify-between border-b border-gray-100 dark:border-white/[0.06]">
              <div className="flex items-center gap-3">
                <div className="w-0.5 h-5" style={{ background: '#FFD233' }} />
                <h3
                  className="text-sm font-semibold text-gray-900 dark:text-[#F0EEE9]"
                  style={{ fontFamily: 'var(--font-outfit)' }}
                >
                  Leads Recientes
                </h3>
              </div>
              {leads.length > 0 && (
                <span
                  className="text-[10px] font-semibold px-2.5 py-1 tracking-wide"
                  style={{
                    fontFamily: 'var(--font-outfit)',
                    background: 'rgba(255,210,51,0.1)',
                    color: '#FFD233',
                    border: '1px solid rgba(255,210,51,0.2)',
                  }}
                >
                  {leads.length} leads
                </span>
              )}
            </div>

            {loadingLeads ? (
              <div className="p-6">
                <SectionLoader text="Cargando leads..." />
              </div>
            ) : leads.length === 0 ? (
              <div
                className="px-6 py-14 text-center text-sm text-gray-400 dark:text-[rgba(240,238,233,0.25)]"
                style={{ fontFamily: 'var(--font-outfit)' }}
              >
                No hay leads disponibles.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-white/[0.05]">
                      {['Cliente', 'Estado', 'Email', 'Teléfono', 'Último Contacto'].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-3 text-left text-[10px] font-semibold tracking-[0.15em] uppercase text-gray-400 dark:text-[rgba(240,238,233,0.28)]"
                          style={{
                            fontFamily: 'var(--font-outfit)',
                          }}
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {leads.map((lead, i) => {
                      const badge =
                        LEAD_BADGE[lead.status as keyof typeof LEAD_BADGE] ?? LEAD_BADGE.lead;
                      return (
                        <motion.tr
                          key={lead.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: 0.62 + i * 0.035 }}
                          className="group transition-colors duration-150 border-b border-gray-50 dark:border-white/[0.04]"
                          onMouseEnter={(e) => {
                            (e.currentTarget as HTMLTableRowElement).style.background =
                              'rgba(255,255,255,0.025)';
                          }}
                          onMouseLeave={(e) => {
                            (e.currentTarget as HTMLTableRowElement).style.background =
                              'transparent';
                          }}
                        >
                          <td
                            className="px-6 py-4 text-sm font-medium text-gray-900 dark:text-[#F0EEE9]"
                            style={{ fontFamily: 'var(--font-outfit)' }}
                          >
                            {lead.name}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className="text-[10px] font-semibold px-2.5 py-1 tracking-wide"
                              style={{
                                fontFamily: 'var(--font-outfit)',
                                background: badge.bg,
                                color: badge.text,
                                border: `1px solid ${badge.border}`,
                              }}
                            >
                              {badge.label}
                            </span>
                          </td>
                          <td
                            className="px-6 py-4 text-sm text-gray-600 dark:text-[rgba(240,238,233,0.45)]"
                            style={{ fontFamily: 'var(--font-outfit)' }}
                          >
                            {lead.email}
                          </td>
                          <td
                            className="px-6 py-4 text-sm text-gray-600 dark:text-[rgba(240,238,233,0.45)]"
                            style={{ fontFamily: 'var(--font-outfit)' }}
                          >
                            {lead.phone}
                          </td>
                          <td
                            className="px-6 py-4 text-sm text-gray-400 dark:text-[rgba(240,238,233,0.32)]"
                            style={{ fontFamily: 'var(--font-outfit)' }}
                          >
                            {new Date(lead.lastContactAt).toLocaleDateString('es-CO')}
                          </td>
                        </motion.tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.section>
      </div>
    </div>
  );
}
