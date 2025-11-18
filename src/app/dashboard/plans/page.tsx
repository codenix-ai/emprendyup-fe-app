'use client';

import { useState, useEffect, useMemo } from 'react';
import Script from 'next/script';
import { useQuery } from '@apollo/client';
import PricingPlans, { Plan } from '../components/PricingPlans';
import { getUserFromLocalStorage } from '@/lib/utils/localAuth';
import OrderCreationModal from '../components/OrderCreationModal';
import { GET_SUBSCRIPTION_PRODUCTS } from '@/lib/graphql/queries';

interface PlanConfig {
  planId: string;
  amount: number;
  description: string;
  productId?: string;
  features?: string[];
  name?: string;
}

interface EPaycoPlans {
  [key: string]: {
    monthly?: PlanConfig;
    annual?: PlanConfig;
  };
}

declare global {
  interface Window {
    ePayco: any;
  }
}

export default function PlansPage() {
  const [selectedCycle, setSelectedCycle] = useState<'monthly' | 'annual'>('annual');
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedPlanData, setSelectedPlanData] = useState<{
    planId: string;
    billingCycle: 'monthly' | 'annual';
    planConfig: any;
  } | null>(null);
  const user = getUserFromLocalStorage();
  const storeId = process.env.NEXT_PUBLIC_DEFAULT_STORE_ID;

  // Fetch subscription products from database
  const {
    data: productsData,
    loading: loadingProducts,
    error: errorProducts,
  } = useQuery(GET_SUBSCRIPTION_PRODUCTS, {
    variables: { storeId },
    skip: !storeId,
  });

  // Get subscription products directly from DB
  const subscriptionProducts = useMemo(() => {
    if (!productsData?.productsByStore?.items) {
      return [];
    }

    const products = productsData.productsByStore.items;

    // Filter only subscription products
    return products.filter((product: any) => {
      const metadata = product.metadata ? JSON.parse(product.metadata) : {};
      return metadata.type === 'subscription' || metadata.isSubscription;
    });
  }, [productsData]);

  // Transform products into Plan[] format for PricingPlans component
  const transformedPlans = useMemo(() => {
    console.log(
      'Building transformedPlans from productsData:',
      productsData?.productsByStore?.items
    );

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

    // Use productsData directly, not filtered subscriptionProducts
    if (!productsData?.productsByStore?.items || productsData.productsByStore.items.length === 0) {
      console.log('No products data available, returning empty array');
      return [];
    }

    const allProducts = productsData.productsByStore.items;
    console.log('Total products from endpoint:', allProducts.length);
    console.log(
      'All product names:',
      allProducts.map((p: any) => p.name)
    );

    // Filter products by selected billing cycle (monthly or annual)
    const filteredProducts = allProducts.filter((product: any) => {
      const productName = product.name.toLowerCase();
      if (selectedCycle === 'annual') {
        // Check for both 'anual' (Spanish) and 'annual' (English)
        return productName.includes('anual') || productName.includes('annual');
      } else {
        // Check for both 'mensual' (Spanish) and 'monthly' (English)
        return productName.includes('mensual') || productName.includes('monthly');
      }
    });

    console.log(`Selected cycle: ${selectedCycle}`);
    console.log(`Filtered products for ${selectedCycle}:`, filteredProducts.length);
    console.log(
      'Filtered product names:',
      filteredProducts.map((p: any) => p.name)
    );

    // Transform each product into a plan card
    const plans = filteredProducts.map((product: any) => {
      const metadata = product.metadata ? JSON.parse(product.metadata) : {};
      const planType = (
        metadata.planType || product.name.toLowerCase().split('-')[0]
      ).toLowerCase();
      const billingCycle =
        metadata.billingCycle ||
        (product.name.toLowerCase().includes('annual') ? 'annual' : 'monthly');
      const displayName = metadata.displayName || product.title || product.name;
      const features = metadata.features || getDefaultFeatures(planType);

      console.log('Transforming product:', product.name, '-> Plan ID:', product.id);

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

    console.log('Total transformed plans:', sortedPlans.length);
    return sortedPlans;
  }, [productsData, selectedCycle]);

  useEffect(() => {
    if (errorProducts) {
      console.error('Error loading products:', errorProducts);
    }
    if (productsData) {
      console.log('Products loaded:', productsData.productsByStore?.items);
      console.log('Subscription products:', subscriptionProducts);
      console.log('Transformed plans:', transformedPlans);
    }
  }, [productsData, errorProducts, subscriptionProducts, transformedPlans]);

  // Verificar periódicamente si ePayco está disponible
  useEffect(() => {
    const checkEpayco = () => {
      if (window.ePayco) {
        console.log('ePayco está disponible:', window.ePayco);
        setScriptLoaded(true);
        return true;
      }
      return false;
    };

    // Verificar inmediatamente
    if (checkEpayco()) return;

    // Si no está disponible, verificar cada 500ms hasta 10 segundos
    const interval = setInterval(() => {
      if (checkEpayco()) {
        clearInterval(interval);
      }
    }, 500);

    // Limpiar después de 10 segundos
    const timeout = setTimeout(() => {
      clearInterval(interval);
      if (!window.ePayco) {
        console.error('ePayco script failed to load after 10 seconds');
      }
    }, 10000);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, []);

  const handlePlanSelect = async (planId: string, billingCycle: 'monthly' | 'annual') => {
    console.log('Script loaded:', scriptLoaded);
    console.log('window.ePayco:', window.ePayco);
    console.log('Selected plan ID:', planId);

    if (!scriptLoaded || !window.ePayco) {
      console.error('ePayco script not loaded yet');
      alert(
        'El sistema de pagos aún se está cargando. Por favor espera un momento e intenta nuevamente.'
      );
      return;
    }

    try {
      // Find the selected product from all products in productsData
      const allProducts = productsData?.productsByStore?.items || [];
      const selectedProduct = allProducts.find((p: any) => p.id === planId);

      if (!selectedProduct) {
        console.error('Product not found:', planId, 'Available products:', allProducts);
        throw new Error('Plan no encontrado');
      }

      const metadata = selectedProduct.metadata ? JSON.parse(selectedProduct.metadata) : {};
      const productBillingCycle =
        metadata.billingCycle ||
        (selectedProduct.name.toLowerCase().includes('annual') ? 'annual' : 'monthly');

      // Create plan config from product
      const planConfig = {
        planId: selectedProduct.id,
        productId: selectedProduct.id,
        amount: selectedProduct.price,
        description: selectedProduct.description || selectedProduct.title || selectedProduct.name,
        name: metadata.displayName || selectedProduct.title || selectedProduct.name,
        features: metadata.features || [],
      };

      console.log('Selected plan config:', planConfig);

      // Guardar datos del plan seleccionado y abrir modal
      setSelectedPlanData({
        planId,
        billingCycle: productBillingCycle as 'monthly' | 'annual',
        planConfig,
      });
      setIsModalOpen(true);
    } catch (error) {
      console.error('Error al seleccionar el plan:', error);
      alert('Error al seleccionar el plan. Por favor intenta nuevamente.');
    }
  };

  const handleOrderCreated = async (orderId: string) => {
    console.log('Order created with ID:', orderId);

    if (!selectedPlanData) {
      console.error('No plan data available');
      return;
    }

    try {
      const { planConfig } = selectedPlanData;

      // Usar el orderId como referencia
      const reference = orderId;

      // Obtener datos del usuario o usar valores por defecto
      const customerData = {
        name: user?.name || 'Cliente',
        email: user?.email || 'cliente@example.com',
        phone: (user as any)?.phone || '3000000000',
        document: (user as any)?.document || '12345678',
        documentType: (user as any)?.documentType || 'CC',
      };

      // Datos del checkout - usando el formato correcto de ePayco
      const checkoutData = {
        // API Key
        key: process.env.NEXT_PUBLIC_EPAYCO_PUBLIC_KEY || '',
        test: true,
        // Información del comercio
        name: 'EmprendyUp',
        description: planConfig.description || 'Suscripción EmprendyUp',
        invoice: reference,
        currency: 'cop',
        amount: planConfig.amount.toString(),
        tax_base: '0',
        tax: '0',
        country: 'co',
        lang: 'es',

        // Información del cliente - usando formato correcto
        external: 'false',

        // Datos de facturación
        name_billing: customerData.name || 'Cliente',
        address_billing: 'Calle 1 # 1-1',
        type_doc_billing: customerData.documentType || 'CC',
        mobilephone_billing: customerData.phone || '3000000000',
        number_doc_billing: customerData.document || '12345678',

        // URLs de respuesta - pasar el orderId como parámetro
        response: `${window.location.origin}/payment/response?orderId=${orderId}`,
        confirmation: `${window.location.origin}/api/payments/epayco/confirmation?orderId=${orderId}`,

        // Método de confirmación
        methodconfirmation: 'post',
      };

      console.log('Opening ePayco checkout with data:', checkoutData);
      console.log('Customer data:', customerData);

      // Validar que todos los campos requeridos estén presentes
      const requiredFields = [
        'key',
        'name',
        'description',
        'invoice',
        'currency',
        'amount',
        'country',
        'name_billing',
        'type_doc_billing',
        'mobilephone_billing',
        'number_doc_billing',
      ];
      const missingFields = requiredFields.filter(
        (field) => !checkoutData[field as keyof typeof checkoutData]
      );

      if (missingFields.length > 0) {
        console.error('Missing required fields:', missingFields);
        throw new Error(`Faltan campos requeridos: ${missingFields.join(', ')}`);
      }

      // Abrir el checkout de ePayco directamente
      const handler = window.ePayco.checkout.configure(checkoutData);
      handler.open();
    } catch (error) {
      console.error('Error al procesar el pago:', error);
      alert('Error al procesar el pago. Por favor intenta nuevamente.');
    }
  };

  console.log('transformedPlans', transformedPlans, selectedPlanData);
  return (
    <>
      {/* Script de ePayco */}
      <Script
        src="https://checkout.epayco.co/checkout.js"
        strategy="afterInteractive"
        onLoad={() => {
          console.log('Script de ePayco cargado exitosamente');
          setScriptLoaded(true);
        }}
        onError={(error) => {
          console.error('Error cargando el script de ePayco:', error);
          alert('Error cargando el sistema de pagos. Por favor recarga la página.');
        }}
      />

      <div className="min-h-screen bg-slate-900">
        {loadingProducts ? (
          <div className="flex items-center justify-center min-h-screen">
            <div className="text-center space-y-4">
              <div className="w-16 h-16 border-4 border-fourth-base border-t-transparent rounded-full animate-spin mx-auto"></div>
              <p className="text-gray-400">Cargando planes...</p>
            </div>
          </div>
        ) : (
          <>
            <PricingPlans
              mode="landing"
              onPlanSelect={handlePlanSelect}
              selectedCycle={selectedCycle}
              onCycleChange={setSelectedCycle}
              customPlans={transformedPlans}
            />

            {/* Modal de creación de orden */}
            {selectedPlanData && (
              <OrderCreationModal
                isOpen={isModalOpen}
                onClose={() => {
                  setIsModalOpen(false);
                  setSelectedPlanData(null);
                }}
                planId={selectedPlanData.planId}
                onOrderCreated={handleOrderCreated}
                planName={selectedPlanData.planConfig.name || selectedPlanData.planId}
                planAmount={selectedPlanData.planConfig.amount}
                billingCycle={selectedPlanData.billingCycle}
              />
            )}
          </>
        )}
      </div>
    </>
  );
}
