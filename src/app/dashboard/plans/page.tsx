'use client';

import { useState, useEffect, useMemo } from 'react';
import { useApolloClient, useMutation, useQuery } from '@apollo/client';
import PricingPlans, { Plan } from '../components/PricingPlans';
import { getUserFromLocalStorage } from '@/lib/utils/localAuth';
import CheckoutModal from '../components/CheckoutModal';
import { GET_SUBSCRIPTION_PRODUCTS, GET_USER, UPDATE_USER } from '@/lib/graphql/queries';
import { readReferralAttribution } from '@/lib/referrals/attribution';
import {
  listPendingCommissionCandidates,
  PendingCommissionCandidate,
  payoutAffiliateCommission,
  registerAffiliateConversion,
  resolveReferralCodeByNewUserId,
  validateAffiliateLinkByCode,
} from '@/lib/referrals/api';
import { registerConversionWithRetry } from '@/lib/referrals/attribution';

type PendingCandidateView = PendingCommissionCandidate & {
  referredUserName?: string;
  referredUserEmail?: string;
};
import { SectionLoader } from '@/app/components/Loader';

interface PlanConfig {
  planId: string;
  amount: number;
  description: string;
  productId?: string;
  features?: string[];
  name?: string;
}

const PLATFORM_MEMBERSHIP_PLANS: Record<
  'basic' | 'pro' | 'partner',
  {
    name: string;
    description: string;
    monthly: number;
    annual: number;
    color: string;
    popular?: boolean;
    features: string[];
  }
> = {
  basic: {
    name: 'Basic',
    description: 'Perfecto para emprender y testear tu idea de negocio',
    monthly: 19900,
    annual: 166440,
    color: 'from-blue-400 to-blue-600',
    features: [
      'Tienda básica con subdominio .emprendy',
      'CRM básico para gestionar clientes',
      'Plantillas básicas personalizables',
      'Soporte por email',
      'Analytics básicos',
    ],
  },
  pro: {
    name: 'Pro',
    description: 'El plan más popular para emprendedores que quieren escalar',
    monthly: 129000,
    annual: 1083600,
    color: 'from-purple-500 to-pink-600',
    popular: true,
    features: [
      'Todo lo incluido en Basic',
      'Chatbot integrado WhatsApp',
      'Automatizaciones de WhatsApp',
      'Agente IA conversacional de ventas',
      'CRM avanzado con automatizaciones',
      'Integración de productos en marketplace',
      'Marketing automation',
    ],
  },
  partner: {
    name: 'Emprendy Partner',
    description: 'Para emprendedores serios que buscan el máximo crecimiento',
    monthly: 189000,
    annual: 1587600,
    color: 'from-emerald-400 to-teal-600',
    features: [
      'Todo lo incluido en Pro',
      'Acceso directo y prioritario a ferias anticipadas',
      'Prioridad en asesorías personalizadas',
      'Automatización a la medida de procesos',
      'Capacitación continua personalizada',
      'Gestor de cuenta dedicado',
      'Integración APIs personalizadas',
    ],
  },
};

export default function PlansPage() {
  const apolloClient = useApolloClient();
  const [updateUserMutation] = useMutation(UPDATE_USER);
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'annual'>('annual');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(() => getUserFromLocalStorage());
  const [useEnvCatalogFallback, setUseEnvCatalogFallback] = useState(false);
  const [selectedPlanData, setSelectedPlanData] = useState<{
    planId: string;
    billingCycle: 'monthly' | 'annual';
    planConfig: any;
  } | null>(null);
  const [referralUi, setReferralUi] = useState<{ applied: boolean; message: string }>({
    applied: false,
    message: '',
  });
  const [payoutTargetCommissionId, setPayoutTargetCommissionId] = useState('');
  const [payoutLoading, setPayoutLoading] = useState(false);
  const [pendingCandidates, setPendingCandidates] = useState<PendingCandidateView[]>([]);
  const [pendingCandidatesLoading, setPendingCandidatesLoading] = useState(false);
  const [pendingCandidatesError, setPendingCandidatesError] = useState('');
  const user = currentUser;
  const envStoreId = process.env.NEXT_PUBLIC_DEFAULT_STORE_ID;
  const userStoreId = user?.storeId ? String(user.storeId) : '';
  const resolvedStoreId =
    useEnvCatalogFallback && envStoreId ? String(envStoreId) : userStoreId || envStoreId || '';
  const allowReferralTestMode =
    String(process.env.NEXT_PUBLIC_REFERRAL_TEST_MODE || '').toLowerCase() === 'true';
  const isAdminUser = String(user?.role || '').toUpperCase() === 'ADMIN';

  const formatMoney = (amount?: number, currency?: string) => {
    if (typeof amount !== 'number') return 'N/A';
    return new Intl.NumberFormat('es-CO', {
      style: 'currency',
      currency: currency || 'COP',
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatDateTime = (value?: string) => {
    if (!value) return 'N/A';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return 'N/A';
    return new Intl.DateTimeFormat('es-CO', {
      dateStyle: 'short',
      timeStyle: 'short',
    }).format(date);
  };

  const normalizeMembershipKey = (value?: string | null) => {
    const normalized = String(value || '')
      .trim()
      .toLowerCase()
      .replace(/\s+/g, '');

    if (!normalized) return '';
    if (normalized.includes('partner')) return 'partner';
    if (normalized.includes('pro')) return 'pro';
    if (normalized.includes('basic')) return 'basic';
    return normalized;
  };

  // Fetch subscription products from database
  const shouldQueryProducts = Boolean(resolvedStoreId) && !allowReferralTestMode;
  const {
    data: productsData,
    loading: loadingProducts,
    error: errorProducts,
  } = useQuery(GET_SUBSCRIPTION_PRODUCTS, {
    variables: { storeId: resolvedStoreId },
    skip: !shouldQueryProducts,
    errorPolicy: 'all',
  });

  // Read authoritative user membership state from backend user query.
  const userId = user?.id ? String(user.id) : '';
  const { data: backendUserData, refetch: refetchBackendUser } = useQuery(GET_USER, {
    variables: { id: userId },
    skip: !userId,
    fetchPolicy: 'network-only',
    errorPolicy: 'all',
  });

  const backendUser = backendUserData?.user;
  const authoritativePlanName = String(backendUser?.membershipLevel || '');
  const authoritativePlanStatus = String(backendUser?.status || '').toUpperCase();
  const authoritativePlanPeriod = String((user as any)?.planPeriod || '').toUpperCase();

  // Transform products into Plan[] format for PricingPlans component
  const transformedPlans = useMemo(() => {
    const parseMetadata = (raw: unknown): Record<string, any> => {
      if (!raw) return {};
      if (typeof raw === 'object') return raw as Record<string, any>;
      if (typeof raw !== 'string') return {};
      try {
        return JSON.parse(raw);
      } catch {
        return {};
      }
    };

    const normalizeCycle = (product: any, metadata: Record<string, any>) => {
      const byMetadata = String(metadata.billingCycle || '').toLowerCase();
      if (byMetadata === 'annual' || byMetadata === 'yearly' || byMetadata === 'anual') {
        return 'annual';
      }
      if (byMetadata === 'monthly' || byMetadata === 'mensual') {
        return 'monthly';
      }

      const haystack = `${product.name || ''} ${product.title || ''}`.toLowerCase();
      if (haystack.includes('anual') || haystack.includes('annual') || haystack.includes('year')) {
        return 'annual';
      }
      return 'monthly';
    };

    const isLikelySubscription = (product: any, metadata: Record<string, any>) => {
      if (metadata.type === 'subscription' || metadata.isSubscription) return true;
      const text =
        `${product.name || ''} ${product.title || ''} ${product.description || ''}`.toLowerCase();
      return (
        text.includes('plan') ||
        text.includes('suscrip') ||
        text.includes('membres') ||
        text.includes('partner') ||
        text.includes('basic') ||
        text.includes('pro')
      );
    };

    const getDefaultFeatures = (planType: string): string[] => {
      const defaultFeatures: { [key: string]: string[] } = {
        basic: [
          'Tienda básica con subdominio .emprendy',
          'CRM básico para gestionar clientes',
          'Plantillas básicas personalizables',
          'Soporte por email',
          'Analytics básicos',
        ],
        pro: [
          'Todo lo incluido en Basic',
          'Chatbot integrado WhatsApp',
          'Automatizaciones de WhatsApp',
          'Agente IA conversacional de ventas',
          'CRM avanzado con automatizaciones',
          'Integración de productos en marketplace',
          'Marketing automation',
        ],
        partner: [
          'Todo lo incluido en Pro',
          'Acceso directo a ferias anticipadas',
          'Prioridad en asesorías personalizadas',
          'Automatización a la medida de procesos',
          'Capacitación continua personalizada',
          'Gestor de cuenta dedicado',
          'Integración APIs personalizadas',
        ],
      };
      return defaultFeatures[planType] || [];
    };

    const getPlanColor = (planType: string): string => {
      const colors: { [key: string]: string } = {
        basic: 'from-blue-400 to-blue-600',
        pro: 'from-purple-500 to-pink-600',
        partner: 'from-emerald-400 to-teal-600',
      };
      return colors[planType] || 'from-gray-400 to-gray-600';
    };

    // Fallback: platform membership plans should exist even without store subscription products
    if (!productsData?.productsByStore?.items || productsData.productsByStore.items.length === 0) {
      return Object.entries(PLATFORM_MEMBERSHIP_PLANS).map(([id, plan]) => ({
        id,
        name: plan.name,
        price: String(selectedCycle === 'annual' ? plan.annual : plan.monthly),
        period: selectedCycle === 'annual' ? 'año' : 'mes',
        description: plan.description,
        features: plan.features,
        popular: Boolean(plan.popular),
        color: plan.color,
        stripeMonthlyPriceId: id,
        stripeAnnualPriceId: id,
      }));
    }

    const allProducts = productsData.productsByStore.items;

    const subscriptionCandidates = allProducts.filter((product: any) =>
      isLikelySubscription(product, parseMetadata(product.metadata))
    );

    const filteredProducts = subscriptionCandidates.filter(
      (product: any) => normalizeCycle(product, parseMetadata(product.metadata)) === selectedCycle
    );

    const sourceProducts = filteredProducts.length > 0 ? filteredProducts : subscriptionCandidates;

    if (sourceProducts.length === 0) {
      return Object.entries(PLATFORM_MEMBERSHIP_PLANS).map(([id, plan]) => ({
        id,
        name: plan.name,
        price: String(selectedCycle === 'annual' ? plan.annual : plan.monthly),
        period: selectedCycle === 'annual' ? 'año' : 'mes',
        description: plan.description,
        features: plan.features,
        popular: Boolean(plan.popular),
        color: plan.color,
        stripeMonthlyPriceId: id,
        stripeAnnualPriceId: id,
      }));
    }

    // Transform each product into a plan card
    const plans = sourceProducts.map((product: any) => {
      const metadata = parseMetadata(product.metadata);
      const planType = (
        (metadata.planType as string | undefined) || product.name.toLowerCase().split('-')[0]
      ).toLowerCase();
      const billingCycle = normalizeCycle(product, metadata);
      const displayName = metadata.displayName || product.title || product.name;
      const features = metadata.features || getDefaultFeatures(planType);

      return {
        id: product.id,
        name: displayName,
        price: product.price.toString(),
        period: billingCycle === 'annual' ? 'año' : 'mes',
        description: product.description || product.title || product.name,
        features: features,
        popular: planType === 'pro',
        color: getPlanColor(planType),
        stripeMonthlyPriceId: product.id,
        stripeAnnualPriceId: product.id,
      };
    });

    // Sort plans by price (ascending order)
    const sortedPlans = plans.sort((a: Plan, b: Plan) => parseFloat(a.price) - parseFloat(b.price));

    return sortedPlans.length > 0 ? sortedPlans : null; // null = fall back to PricingPlans defaults
  }, [productsData, selectedCycle]);

  useEffect(() => {
    if (errorProducts) {
      console.error('Error loading products:', errorProducts);
    }
  }, [errorProducts]);

  useEffect(() => {
    if (loadingProducts) return;

    if (
      !useEnvCatalogFallback &&
      Boolean(userStoreId) &&
      Boolean(envStoreId) &&
      String(userStoreId) !== String(envStoreId) &&
      transformedPlans.length === 0
    ) {
      setUseEnvCatalogFallback(true);
    }
  }, [loadingProducts, useEnvCatalogFallback, userStoreId, envStoreId, transformedPlans.length]);

  useEffect(() => {
    const attribution = readReferralAttribution();
    if (!attribution) {
      setReferralUi({ applied: false, message: '' });
      return;
    }

    if (attribution.validationState === 'valid' && attribution.referralApplied) {
      setReferralUi({ applied: true, message: 'Codigo de referido aplicado.' });
      return;
    }

    setReferralUi({ applied: false, message: 'Codigo invalido o expirado.' });
  }, []);

  const loadPendingCandidates = async () => {
    if (!isAdminUser) return;

    setPendingCandidatesLoading(true);
    setPendingCandidatesError('');
    try {
      const items = await listPendingCommissionCandidates(apolloClient);

      const idsToResolve = Array.from(
        new Set(
          items
            .flatMap((item) => [item.referrerUserId, item.newUserId])
            .map((value) => String(value || '').trim())
            .filter(Boolean)
        )
      );

      const profiles = await Promise.all(
        idsToResolve.map(async (id) => {
          try {
            const response = await apolloClient.query<{
              user?: { id?: string; name?: string; email?: string } | null;
            }>({
              query: GET_USER,
              variables: { id },
              fetchPolicy: 'network-only',
            });
            const user = response.data?.user;
            return {
              id,
              name: String(user?.name || '').trim(),
              email: String(user?.email || '').trim(),
            };
          } catch {
            return { id, name: '', email: '' };
          }
        })
      );

      const profileById = new Map(profiles.map((profile) => [profile.id, profile]));

      const enriched = items.map((item) => {
        const referrer = profileById.get(String(item.referrerUserId || '').trim());
        const referred = profileById.get(String(item.newUserId || '').trim());

        return {
          ...item,
          referrerName: referrer?.name || item.referrerName,
          referrerEmail: referrer?.email || item.referrerEmail,
          referredUserName: referred?.name || undefined,
          referredUserEmail: referred?.email || undefined,
        };
      });

      const sorted = [...enriched].sort((a, b) => {
        const dateA = new Date(a.createdAt || 0).getTime();
        const dateB = new Date(b.createdAt || 0).getTime();
        return dateB - dateA;
      });
      setPendingCandidates(sorted);
    } catch (error) {
      console.error('Error cargando conversiones pendientes para payout', error);
      setPendingCandidates([]);
      setPendingCandidatesError('No se pudieron cargar conversiones pendientes para payout.');
    } finally {
      setPendingCandidatesLoading(false);
    }
  };

  useEffect(() => {
    if (!isAdminUser) return;
    loadPendingCandidates();
  }, [isAdminUser]);

  const handlePlanSelect = async (planId: string, billingCycle: 'monthly' | 'annual') => {
    try {
      const selectedPlan = transformedPlans.find((p: Plan) => String(p.id) === String(planId));

      if (!selectedPlan) {
        console.error('Plan not found:', planId, 'Available plans:', transformedPlans);
        throw new Error('Plan no encontrado');
      }

      // Create plan config from product
      const planConfig = {
        planId: selectedPlan.id,
        productId: selectedPlan.id,
        amount: Number(selectedPlan.price || 0),
        description: selectedPlan.description,
        name: selectedPlan.name,
        features: selectedPlan.features || [],
      };

      const userId = user?.id ? String(user.id) : '';
      const attribution = readReferralAttribution();
      let referralCode = attribution?.referralCode || '';
      if (!referralCode && userId) {
        referralCode = (await resolveReferralCodeByNewUserId(apolloClient, userId)) || '';
      }
      const currentMembership = normalizeMembershipKey(authoritativePlanName);
      const nextMembership = normalizeMembershipKey(selectedPlan.name || selectedPlan.id);
      const isMembershipChange = Boolean(nextMembership) && currentMembership !== nextMembership;

      const persistMembershipInBackend = async () => {
        const userId = user?.id ? String(user.id) : '';
        if (!userId) {
          throw new Error('Usuario sin id para persistir membresia');
        }

        await updateUserMutation({
          variables: {
            id: userId,
            input: {
              name: user?.name || 'Usuario',
              email: user?.email || '',
              role: user?.role || 'STORE_ADMIN',
              membershipLevel: nextMembership.toUpperCase(),
            },
          },
        });
      };

      if (allowReferralTestMode && isMembershipChange && Boolean(referralCode)) {
        if (!userId) {
          alert('No se pudo simular comision: usuario sin sesion.');
          return;
        }

        const revalidation = await validateAffiliateLinkByCode(apolloClient, referralCode);
        if (!revalidation.valid) {
          alert('No se pudo simular comision: codigo de referido invalido o expirado.');
          return;
        }

        const referralAmount = Number(selectedPlan.price || 0);
        const commissionPercentage = 20;
        const commissionAmount = Number(((referralAmount * commissionPercentage) / 100).toFixed(2));
        const transactionId = `membership-change-${userId}-${currentMembership || 'none'}-${nextMembership}-${Date.now()}`;

        const result = await registerConversionWithRetry(
          async (payload) => registerAffiliateConversion(apolloClient, payload),
          {
            referralCode,
            convertedUserId: userId,
            transactionId,
            planType: nextMembership || 'SUBSCRIPTION',
            planDurationMonths: billingCycle === 'annual' ? 12 : 1,
            commissionAmount,
            currency: 'COP',
            conversionDate: new Date().toISOString(),
            referralAmount,
            commissionPercentage,
            status: 'COMMISSION_PENDING',
            commissionStatus: 'COMMISSION_PENDING',
          },
          2
        );

        if (!result.ok) {
          alert('No se pudo simular la comision.');
          return;
        }

        try {
          await persistMembershipInBackend();
          await refetchBackendUser();
        } catch (e) {
          console.error('No se pudo persistir membresia en backend', e);
          alert('La comision se simulo, pero no se pudo guardar la membresia en base de datos.');
          return;
        }

        setCurrentUser((prev: any) => {
          const updated = {
            ...(prev || {}),
            membershipLevel: nextMembership.toUpperCase(),
            plan: nextMembership,
            planStatus: 'ACTIVE',
            planPeriod: billingCycle === 'annual' ? 'ANNUAL' : 'MONTHLY',
          };
          try {
            localStorage.setItem('user', JSON.stringify(updated));
          } catch (e) {
            console.warn('No se pudo persistir membresia simulada en localStorage', e);
          }
          return updated;
        });

        alert('Comision de referido simulada por cambio de membresia (modo test).');
        return;
      }

      if (allowReferralTestMode && isMembershipChange && !referralCode) {
        alert(
          'Modo test activo, pero no se encontro referralCode para este usuario en storage ni en base de datos.'
        );
      }

      // Guardar datos del plan seleccionado y abrir modal
      setSelectedPlanData({
        planId: selectedPlan.id,
        billingCycle,
        planConfig,
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error al seleccionar el plan:', error);
      alert('Error al seleccionar el plan. Por favor intenta nuevamente.');
    }
  };

  const handleAdminPayout = async (params?: { commissionId?: string }) => {
    const targetCommissionId = String(params?.commissionId || '').trim();
    const manualCommissionId = String(payoutTargetCommissionId || '').trim();
    const commissionIdToPay = targetCommissionId || manualCommissionId;

    if (!commissionIdToPay) {
      alert('Debes ingresar un commissionId para pagar comision.');
      return;
    }

    setPayoutLoading(true);
    try {
      const payout = await payoutAffiliateCommission(apolloClient, {
        commissionId: commissionIdToPay,
        notes: 'Payout from dashboard admin flow',
      });
      alert(
        `Payout ejecutado. Status: ${String(payout.status || 'N/A')} | Amount: ${String(payout.amount ?? 'N/A')} ${String(payout.currency || '')}`
      );
      setPayoutTargetCommissionId('');
      await loadPendingCandidates();
    } catch (error) {
      console.error('Error ejecutando payout de comision', error);
      alert('No se pudo ejecutar payoutAffiliateCommission. Revisa permisos y schema del backend.');
    } finally {
      setPayoutLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900">
      {referralUi.message && (
        <div
          className={`rounded-xl p-4 mx-4 my-4 ${
            referralUi.applied
              ? 'bg-green-500/10 text-green-400 border border-green-500/40'
              : 'bg-yellow-500/10 text-yellow-300 border border-yellow-500/40'
          }`}
        >
          {referralUi.message}
        </div>
      )}
      {(authoritativePlanStatus === 'ACTIVE' || Boolean(authoritativePlanName)) && (
        <div className="rounded-xl bg-green-500/10 p-4 text-green-400 mx-4 my-4">
          🙌 Gracias por confiar en <b>EmprendyUp</b> y ser parte de la comunidad.
          <br />
          Tu plan actual es <b>{authoritativePlanName || 'N/A'}</b> (
          {authoritativePlanPeriod === 'MONTHLY'
            ? 'Mensual'
            : authoritativePlanPeriod === 'ANNUAL'
              ? 'Anual'
              : '—'}
          ).
        </div>
      )}
      {loadingProducts ? (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 border-4 border-fourth-base border-t-transparent rounded-full animate-spin mx-auto"></div>
            <p className="text-gray-400">Cargando planes...</p>
          </div>
        </div>
      ) : (
        <>
          {isAdminUser && (
            <div className="mx-4 mb-4 rounded-2xl border border-sky-400/30 bg-gradient-to-br from-slate-900 via-slate-900 to-sky-950/60 p-4 text-sky-100 shadow-lg shadow-sky-900/20">
              <div className="mb-3 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div>
                  <p className="text-sm font-semibold tracking-wide">
                    Comisiones pendientes de pago
                  </p>
                  <p className="text-xs text-sky-200/80">
                    Selecciona una comision por ID y ejecuta payout.
                  </p>
                </div>
                <button
                  onClick={loadPendingCandidates}
                  disabled={pendingCandidatesLoading || payoutLoading}
                  className="rounded-lg border border-sky-300/50 bg-sky-400/5 px-3 py-1.5 text-xs font-semibold text-sky-100 hover:bg-sky-400/15 disabled:opacity-60"
                >
                  {pendingCandidatesLoading ? 'Actualizando...' : 'Actualizar pendientes'}
                </button>
              </div>
              {pendingCandidatesError && (
                <p className="mb-3 rounded-lg border border-red-400/40 bg-red-500/10 px-3 py-2 text-xs text-red-200">
                  {pendingCandidatesError}
                </p>
              )}
              {pendingCandidatesLoading ? (
                <p className="mb-3 text-xs text-sky-100/80">Cargando conversiones pendientes...</p>
              ) : pendingCandidates.length > 0 ? (
                <div className="mb-4 overflow-x-auto rounded-2xl border border-sky-300/20 bg-slate-950/60 shadow-[0_8px_30px_rgba(2,132,199,0.12)]">
                  <table className="min-w-full text-left text-xs text-sky-100">
                    <thead className="bg-gradient-to-r from-slate-900 to-slate-800 text-sky-100">
                      <tr>
                        <th className="px-4 py-3 font-semibold">commissionId</th>
                        <th className="px-4 py-3 font-semibold">newUserId</th>
                        <th className="px-4 py-3 font-semibold">referredName</th>
                        <th className="px-4 py-3 font-semibold">referredEmail</th>
                        <th className="px-4 py-3 font-semibold">referrerName</th>
                        <th className="px-4 py-3 font-semibold">referrerEmail</th>
                        <th className="px-4 py-3 font-semibold">monto</th>
                        <th className="px-4 py-3 font-semibold">fecha</th>
                        <th className="px-4 py-3 font-semibold">estado</th>
                        <th className="px-4 py-3 font-semibold">accion</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pendingCandidates.map((candidate) => (
                        <tr
                          key={`${candidate.commissionId || 'no-commission'}-${candidate.newUserId}`}
                          className="border-t border-sky-400/10 odd:bg-slate-900/35 even:bg-slate-900/55 hover:bg-sky-500/10 transition-colors"
                        >
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-md border border-sky-300/30 bg-sky-400/15 px-2 py-1 font-mono text-[11px] text-sky-50">
                              {candidate.commissionId || 'N/A'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-[11px] text-sky-100/90">
                            {candidate.newUserId}
                          </td>
                          <td className="px-4 py-3 text-sky-50">
                            {candidate.referredUserName || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sky-100/90">
                            {candidate.referredUserEmail || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sky-50">
                            {candidate.referrerName || 'N/A'}
                          </td>
                          <td className="px-4 py-3 text-sky-100/90">
                            {candidate.referrerEmail || 'N/A'}
                          </td>
                          <td className="px-4 py-3 font-semibold text-emerald-300">
                            {formatMoney(candidate.amount, candidate.currency)}
                          </td>
                          <td className="px-4 py-3 text-sky-100/80">
                            {formatDateTime(candidate.createdAt)}
                          </td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full border border-amber-300/40 bg-amber-400/15 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                              {candidate.status || 'COMMISSION_PENDING'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() =>
                                handleAdminPayout({
                                  commissionId: candidate.commissionId,
                                })
                              }
                              disabled={payoutLoading}
                              className="rounded-lg bg-emerald-500 px-3 py-1.5 font-semibold text-white shadow-sm hover:bg-emerald-400 disabled:opacity-60"
                            >
                              Pagar comision
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="mb-4 text-xs text-sky-100/80">
                  No hay conversiones en COMMISSION_PENDING para payout.
                </p>
              )}
              <div className="flex flex-col gap-2 md:flex-row md:items-center">
                <input
                  type="text"
                  value={payoutTargetCommissionId}
                  onChange={(e) => setPayoutTargetCommissionId(e.target.value)}
                  placeholder="commissionId manual (si quieres pagarlo directo)"
                  className="w-full rounded-lg border border-sky-400/40 bg-slate-900/70 px-3 py-2 text-sm text-sky-100 placeholder:text-sky-200/60 md:max-w-xl"
                />
                <button
                  onClick={() => handleAdminPayout()}
                  disabled={payoutLoading}
                  className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-semibold text-white hover:bg-sky-400 disabled:opacity-60"
                >
                  {payoutLoading ? 'Procesando...' : 'Pagar comision'}
                </button>
              </div>
            </div>
          )}
          <PricingPlans
            mode="landing"
            onPlanSelect={handlePlanSelect}
            selectedCycle={selectedCycle}
            onCycleChange={setSelectedCycle}
            customPlans={transformedPlans}
          />

          {/* Modal de checkout de membresia */}
          {selectedPlanData && (
            <CheckoutModal
              open={isModalOpen}
              onClose={() => {
                setIsModalOpen(false);
                setSelectedPlanData(null);
              }}
              planId={selectedPlanData.planId}
              planName={selectedPlanData.planConfig.name || selectedPlanData.planId}
              price={selectedPlanData.planConfig.amount}
              billingCycle={selectedPlanData.billingCycle}
            />
          )}
        </>
      )}
    </div>
  );
}
