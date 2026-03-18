'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  BarChart3,
  ShoppingCart,
  Users,
  Gift,
  Store,
  Menu,
  X,
  ChevronLeft,
  ChevronRight,
  LogOut,
  FileText,
  Loader,
  CreditCard,
  Package,
  Star,
  MessageCircle,
  BookOpen,
  Layers,
  List,
  BookUser,
  UtensilsCrossed,
  Briefcase,
  Calendar,
  Receipt,
  UserCheck,
  ClipboardList,
  Mail,
} from 'lucide-react';
import Image from 'next/image';
import { useSessionStore } from '@/lib/store/dashboard';
import { getCurrentUser } from '@/lib/utils/rbac';
import { useAuth } from '../hooks/useAuth';
import { toast } from 'sonner';
import { PageLoader } from '@/app/components/Loader';

// Estructura de navegación agrupada para ADMIN
const adminNavigationGroups = [
  { name: 'Negocios', icon: Briefcase, href: '/dashboard/business', isSingle: true },
  { name: 'Tiendas', icon: Store, href: '/dashboard/business/stores', isSingle: true },
  {
    name: 'Restaurantes',
    icon: UtensilsCrossed,
    href: '/dashboard/business/restaurants',
    isSingle: true,
  },
  { name: 'Servicios', icon: Briefcase, href: '/dashboard/business/services', isSingle: true },
  { name: 'Pedidos', icon: ShoppingCart, href: '/dashboard/orders', isSingle: true },
  { name: 'Productos', icon: Package, href: '/dashboard/products', isSingle: true },
  { name: 'Categorías', icon: List, href: '/dashboard/categoriesAdmin', isSingle: true },
  { name: 'Usuarios', icon: Users, href: '/dashboard/users', isSingle: true },
  { name: 'Emprendedores', icon: Star, href: '/dashboard/entrepeneurs', isSingle: true },
  { name: 'Asistentes', icon: BookUser, href: '/dashboard/events', isSingle: true },
  { name: 'Mensajes', icon: MessageCircle, href: '/dashboard/whatsapp-messages', isSingle: true },
  { name: 'Templates', icon: BookOpen, href: '/dashboard/whatsapp-templates', isSingle: true },
  { name: 'Email Marketing', icon: Mail, href: '/dashboard/email-marketing', isSingle: true },
  { name: 'Bonos', icon: Gift, href: '/dashboard/bonuses', isSingle: true },
  { name: 'Blog', icon: FileText, href: '/dashboard/blog', isSingle: true },
  { name: 'Estadísticas', icon: BarChart3, href: '/dashboard/insights', isSingle: true },
  { name: 'Ferias', icon: Calendar, href: '/dashboard/fairs', isSingle: true },
  { name: 'Pagos', icon: CreditCard, href: '/dashboard/payments', isSingle: true },
  { name: 'Mi suscripción', icon: Layers, href: '/dashboard/plans', isSingle: true },
];

// Navegación para Tiendas
const getStoreNavigationGroups = () => {
  return [
    { name: 'Dashboard', icon: BarChart3, href: '/dashboard', isSingle: true },
    { name: 'Mi Tienda', icon: Store, href: '/dashboard/store', isSingle: true },
    { name: 'Pedidos', icon: ShoppingCart, href: '/dashboard/orders', isSingle: true },
    { name: 'Productos', icon: Package, href: '/dashboard/products', isSingle: true },
    { name: 'Categorías', icon: List, href: '/dashboard/categories', isSingle: true },
    { name: 'Cotizaciones', icon: ClipboardList, href: '/dashboard/quotes', isSingle: true },
    { name: 'Usuarios', icon: Users, href: '/dashboard/user-by-store', isSingle: true },
    { name: 'Bonos', icon: Gift, href: '/dashboard/bonuses', isSingle: true },
    { name: 'Ferias', icon: Calendar, href: '/dashboard/fairs', isSingle: true },
    { name: 'Pagos', icon: CreditCard, href: '/dashboard/payments', isSingle: true },
    { name: 'Mi suscripción', icon: Layers, href: '/dashboard/plans', isSingle: true },
  ];
};

// Navegación para Servicios
const getServiceNavigationGroups = () => {
  return [
    {
      name: 'Panel de Control',
      icon: BarChart3,
      href: '/dashboard/service-dashboard',
      isSingle: true,
    },
    { name: 'Mi Servicio', icon: Briefcase, href: '/dashboard/service', isSingle: true },
    { name: 'Calendario', icon: Calendar, href: '/dashboard/service-calendar', isSingle: true },
    { name: 'Gastos', icon: Receipt, href: '/dashboard/service-expenses', isSingle: true },
    { name: 'Clientes CRM', icon: UserCheck, href: '/dashboard/service-crm', isSingle: true },
    { name: 'Imágenes', icon: Package, href: '/dashboard/service-images', isSingle: true },
    { name: 'Usuarios', icon: Users, href: '/dashboard/user-by-service', isSingle: true },
    { name: 'Bonos', icon: Gift, href: '/dashboard/bonuses', isSingle: true },
    { name: 'Ferias', icon: Calendar, href: '/dashboard/fairs', isSingle: true },
    { name: 'Mi suscripción', icon: Layers, href: '/dashboard/plans', isSingle: true },
  ];
};

// Navegación para Restaurantes
const getRestaurantNavigationGroups = () => {
  return [
    {
      name: 'Mi Restaurante',
      icon: UtensilsCrossed,
      href: '/dashboard/restaurant',
      isSingle: true,
    },
    { name: 'Reservaciones', icon: Calendar, href: '/dashboard/reservaciones', isSingle: true },
    {
      name: 'Gastos y Ganancias',
      icon: Receipt,
      href: '/dashboard/restaurant-expenses',
      isSingle: true,
    },
    { name: 'Nómina', icon: Users, href: '/dashboard/restaurant-payroll', isSingle: true },
    { name: 'Imágenes del Menú', icon: Package, href: '/dashboard/menu-images', isSingle: true },
    { name: 'Usuarios', icon: Users, href: '/dashboard/user-by-restaurant', isSingle: true },
    { name: 'Bonos', icon: Gift, href: '/dashboard/bonuses', isSingle: true },
    { name: 'Ferias', icon: Calendar, href: '/dashboard/fairs', isSingle: true },
    { name: 'Mi suscripción', icon: Layers, href: '/dashboard/plans', isSingle: true },
  ];
};

// Función para obtener la navegación según el tipo de negocio del usuario
const getStoreAdminNavigationGroups = (user: any) => {
  if (user?.serviceProviderId) {
    return getServiceNavigationGroups();
  } else if (user?.restaurantId) {
    return getRestaurantNavigationGroups();
  }
  // Default: tienda
  return getStoreNavigationGroups();
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const { user, setUser } = useSessionStore();
  const [mounted, setMounted] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const hideDashboardChrome = Boolean(pathname && pathname.includes('/dashboard/store/new'));

  useEffect(() => {
    setMounted(true);
    const currentUser = getCurrentUser();
    if (currentUser) {
      setUser(currentUser);
    }
  }, [setUser]);

  const handleLogout = () => {
    toast.success('Sesión cerrada exitosamente', {
      description: 'Has cerrado sesión correctamente. Redirigiendo...',
      duration: 2000,
    });

    localStorage.removeItem('user');
    localStorage.removeItem('accessToken');

    setTimeout(() => {
      window.location.href = '/';
    }, 1500);
  };

  if (!user) {
    return <PageLoader />;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader className="h-8 w-8 animate-spin text-fourth-base" />
      </div>
    );
  }

  const isStoreNewPage = pathname === '/dashboard/store/new';

  if (!isStoreNewPage && (!user || !['ADMIN', 'STORE_ADMIN', 'USER'].includes(user.role))) {
    return null;
  }

  if (!isAuthenticated) {
    return null;
  }

  if (hideDashboardChrome) {
    return <div className="min-h-screen bg-slate-50 dark:bg-slate-900">{children}</div>;
  }

  const navigationGroups =
    user.role === 'ADMIN' ? adminNavigationGroups : getStoreAdminNavigationGroups(user);
  const displayName = user.name || user.email || 'Usuario';
  const initialsSource = displayName.trim();
  const initialsWords = initialsSource.split(' ').filter(Boolean);
  const userInitials =
    initialsWords.length >= 2
      ? `${initialsWords[0][0]}${initialsWords[1][0]}`.toUpperCase()
      : initialsSource.substring(0, 2).toUpperCase();
  const membershipPlan = (user.plan || user.membershipLevel) as string | undefined;
  const membershipPlanBadgeClass =
    membershipPlan === 'PRO'
      ? 'bg-blue-500'
      : membershipPlan === 'PARTNER'
        ? 'bg-purple-600'
        : membershipPlan === 'BASIC'
          ? 'bg-green-600'
          : 'bg-gray-600';

  return (
    <div
      className={`h-screen bg-slate-900 dark:bg-gray-900 grid grid-rows-[auto_1fr] transition-all duration-300 
      ${collapsed ? 'lg:grid-cols-[96px_1fr]' : 'lg:grid-cols-[256px_1fr]'}`}
    >
      {/* Barra lateral para escritorio */}
      <aside
        className={`hidden lg:block fixed inset-y-0 left-0 z-50 ${
          collapsed ? 'w-24' : 'w-64'
        } bg-white dark:bg-gray-800 shadow-lg transform transition-all duration-300 ease-in-out`}
      >
        <div className="flex h-full flex-col">
          {/* Logo y botón para colapsar */}
          <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
            <Link href="/dashboard" className="flex items-center space-x-2">
              <Image
                src="/images/logo.svg"
                width={48}
                height={48}
                className="h-12 w-12 min-w-[48px] min-h-[48px] object-contain"
                alt="Logo de EmprendyUp"
                priority
              />
              {!collapsed && (
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  EmprendyUp
                </span>
              )}
            </Link>
            <button
              onClick={() => setCollapsed(!collapsed)}
              className="p-1 rounded-md text-gray-400 hover:text-gray-500"
            >
              {collapsed ? (
                <ChevronRight className="h-6 w-6" />
              ) : (
                <ChevronLeft className="h-6 w-6" />
              )}
            </button>
          </div>

          {/* Navegación */}
          <div className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
            {navigationGroups.map((group) => {
              const g = group as {
                name: string;
                icon: React.ElementType;
                href: string;
                isSingle: boolean;
              };
              const isActive = pathname === g.href || pathname.startsWith(g.href + '/');
              return (
                <Link
                  key={g.name}
                  href={g.href}
                  className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                    isActive
                      ? 'bg-fourth-base/10 text-black dark:text-white'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                  }`}
                >
                  <g.icon
                    className={`mr-0 pl-3 md:mr-3 h-8 w-8 flex-shrink-0 ${
                      isActive
                        ? 'text-black dark:text-white'
                        : 'text-gray-400 group-hover:text-gray-500'
                    }`}
                  />
                  {!collapsed && <span className="truncate flex-1 text-left">{g.name}</span>}
                </Link>
              );
            })}
          </div>
          {/* Pie de barra lateral: usuario y acciones */}
          <div className="px-4 py-4 border-t border-gray-200 dark:border-gray-700">
            {!collapsed ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 min-w-0">
                  {/* Avatar con iniciales y badge centrada debajo (vista expandida) */}
                  <div className="relative flex-shrink-2">
                    <div className="w-10 h-10 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-semibold text-sm">
                      {userInitials}
                    </div>

                    {membershipPlan ? (
                      <span
                        className={`absolute left-1/2 -bottom-1 -translate-x-1/2 px-2 py-[1px] text-[10px] font-medium tracking-wide text-white rounded-full ${membershipPlanBadgeClass}`}
                      >
                        {membershipPlan}
                      </span>
                    ) : null}
                  </div>

                  {/* badge rendered inside avatar - inline badges removed */}

                  <div className="min-w-0">
                    <div className="text-sm font-medium text-gray-800 dark:text-gray-200 truncate">
                      {displayName}
                    </div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">Mi cuenta</div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  data-testid="logout-button"
                  className="p-2 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-2">
                {/* Avatar colapsado con badge superpuesto */}
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-semibold text-xs">
                    {userInitials}
                  </div>

                  {membershipPlan ? (
                    <span
                      className={`absolute -bottom-1 left-1/2 -translate-x-1/2 inline-flex items-center px-1.5 py-0.5 text-[9px] font-bold text-white rounded-full shadow-lg ${membershipPlanBadgeClass} whitespace-nowrap`}
                    >
                      {membershipPlan}
                    </span>
                  ) : null}
                </div>

                <button
                  type="button"
                  onClick={handleLogout}
                  data-testid="logout-button-collapsed"
                  className="p-1 rounded-md text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                  title="Cerrar Sesión"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* Menú móvil */}
      {mobileMenuOpen && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black bg-opacity-75">
          <div className="absolute inset-y-0 left-0 w-64 bg-white dark:bg-gray-800 shadow-lg">
            <div className="flex h-16 items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
              <Link href="/dashboard" className="flex items-center space-x-2">
                <Image
                  src="/images/logo.svg"
                  width={48}
                  height={48}
                  className="h-12 w-12 min-w-[48px] min-h-[48px] object-contain"
                  alt="Logo de EmprendyUp"
                  priority
                />
                <span className="text-lg font-semibold text-gray-900 dark:text-white">
                  EmprendyUp
                </span>
              </Link>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1 rounded-md text-gray-400 hover:text-gray-500"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="flex-1 px-4 py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-8rem)]">
              {navigationGroups.map((group) => {
                const g = group as { name: string; icon: React.ElementType; href: string };
                const isActive = pathname === g.href || pathname.startsWith(g.href + '/');
                return (
                  <Link
                    key={g.name}
                    href={g.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors ${
                      isActive
                        ? 'bg-fourth-base text-black'
                        : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  >
                    <g.icon
                      className={`mr-3 h-5 w-5 flex-shrink-0 ${
                        isActive
                          ? 'text-black dark:text-white'
                          : 'text-gray-400 group-hover:text-gray-500'
                      }`}
                    />
                    <span className="truncate flex-1 text-left">{g.name}</span>
                  </Link>
                );
              })}

              <button
                type="button"
                onClick={() => {
                  setMobileMenuOpen(false);
                  handleLogout();
                }}
                data-testid="logout-button-mobile"
                className="group flex items-center w-full px-2 py-2 text-sm font-medium rounded-md transition-colors text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 mt-4"
              >
                <LogOut className="mr-3 h-5 w-5 text-red-500 group-hover:text-red-600" />
                <span className="truncate">Cerrar Sesión</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Contenido principal */}
      <div className="lg:col-start-2 lg:row-start-1 lg:row-span-2 grid grid-rows-[auto_1fr] min-h-screen">
        <header className="bg-white dark:bg-gray-800 shadow-sm border-b border-gray-200 dark:border-gray-700">
          <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="p-2 rounded-md text-gray-400 hover:text-gray-500 lg:hidden"
              >
                <Menu className="h-6 w-6" />
              </button>

              <div className="text-sm text-gray-500 dark:text-gray-400">
                {mounted &&
                  new Date().toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
              </div>
            </div>
          </div>
        </header>

        <main className="overflow-auto bg-gray-50 dark:bg-gray-900">
          <div className="grid grid-cols-1 gap-6 p-4 sm:p-6 lg:p-8 auto-rows-max">{children}</div>
        </main>
      </div>
    </div>
  );
}
