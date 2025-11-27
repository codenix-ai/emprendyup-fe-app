import React from 'react';
import { UserProfile } from '@/lib/schemas/dashboard';

export type Role = 'MODERATOR' | 'STORE_ADMIN' | 'ADMIN' | 'USER' | 'CUSTOMER';

export interface RolePermissions {
  canViewDashboard: boolean;
  canCreateStore: boolean;
  canManageOrders: boolean;
  canManageBonuses: boolean;
  canViewInsights: boolean;
  canAccessAdmin: boolean;
  canManageUsers: boolean;
  canManageStores: boolean;
}

const rolePermissions: Record<Role, RolePermissions> = {
  USER: {
    canViewDashboard: true,
    canCreateStore: true,
    canManageOrders: true,
    canManageBonuses: true,
    canViewInsights: true,
    canAccessAdmin: false,
    canManageUsers: false,
    canManageStores: false,
  },
  ADMIN: {
    canViewDashboard: true,
    canCreateStore: true,
    canManageOrders: true,
    canManageBonuses: true,
    canViewInsights: true,
    canAccessAdmin: true,
    canManageUsers: true,
    canManageStores: true,
  },
  STORE_ADMIN: {
    canViewDashboard: true,
    canCreateStore: false,
    canManageOrders: true,
    canManageBonuses: true,
    canViewInsights: true,
    canAccessAdmin: false,
    canManageUsers: false,
    canManageStores: true,
  },
  MODERATOR: {
    canViewDashboard: true,
    canCreateStore: false,
    canManageOrders: false,
    canManageBonuses: false,
    canViewInsights: true,
    canAccessAdmin: false,
    canManageUsers: true,
    canManageStores: false,
  },
  CUSTOMER: {
    canViewDashboard: false,
    canCreateStore: false,
    canManageOrders: false,
    canManageBonuses: false,
    canViewInsights: false,
    canAccessAdmin: false,
    canManageUsers: false,
    canManageStores: false,
  },
};

export function hasRole(user: UserProfile | null, role: Role): boolean {
  if (!user) return false;
  return user.role === role;
}

export function hasPermission(
  user: UserProfile | null,
  permission: keyof RolePermissions
): boolean {
  if (!user) return false;
  const permissions = rolePermissions[user.role];
  return permissions[permission];
}

export function requireRole(user: UserProfile | null, role: Role): void {
  if (!hasRole(user, role)) {
    throw new Error(`Access denied: ${role} role required`);
  }
}

export function requirePermission(
  user: UserProfile | null,
  permission: keyof RolePermissions
): void {
  if (!hasPermission(user, permission)) {
    throw new Error(`Access denied: ${permission} permission required`);
  }
}

export function getPermissions(user: UserProfile | null): RolePermissions {
  if (!user) {
    return {
      canViewDashboard: false,
      canCreateStore: false,
      canManageOrders: false,
      canManageBonuses: false,
      canViewInsights: false,
      canAccessAdmin: false,
      canManageUsers: false,
      canManageStores: false,
    };
  }
  return rolePermissions[user.role];
}

// Higher-order component for route protection - moved to separate tsx file
// export function withRoleGuard<T extends {}>(
//   Component: React.ComponentType<T>,
//   requiredRole: Role
// ) {
//   return function GuardedComponent(props: T) {
//     const user = getCurrentUser();

//     if (!hasRole(user, requiredRole)) {
//       return (
//         <div className="flex items-center justify-center min-h-screen">
//           <div className="text-center">
//             <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
//             <p className="text-gray-600 mt-2">
//               You don't have permission to access this page.
//             </p>
//           </div>
//         </div>
//       );
//     }

//     return <Component {...props} />;
//   };
// }

// Hook for checking permissions in components
export function usePermissions(user: UserProfile | null) {
  return getPermissions(user);
}

function getCookie(name: string): string {
  const nameEQ = name + '=';
  const decodedCookie = decodeURIComponent(document.cookie);
  const ca = decodedCookie.split(';');

  for (let i = 0; i < ca.length; i++) {
    let c = ca[i];
    while (c.charAt(0) === ' ') {
      c = c.substring(1);
    }
    if (c.indexOf(nameEQ) === 0) {
      return c.substring(nameEQ.length, c.length);
    }
  }
  return ''; // Return empty string if cookie not found
}

// Mock function to get current user (in real app, this would come from context/session)
export function getCurrentUser(): UserProfile | null {
  // This is a mock - in a real app you'd get this from NextAuth, context, etc.
  if (typeof window !== 'undefined') {
    // 1) Prefer explicit stored user in localStorage
    const a = getCookie('auth_token');
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        return JSON.parse(userStr) as UserProfile;
      } catch {
        // fall through to cookie check
      }
    }

    // 2) Fallback: try to read an auth token from cookies (non-HttpOnly)
    try {
      const match = document.cookie.match('(?:^|; )auth_token=([^;]*)');
      const token = match ? decodeURIComponent(match[1]) : null;
      if (token) {
        // decode JWT payload (base64url)
        const parts = token.split('.');
        if (parts.length === 3) {
          const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
          try {
            const json = decodeURIComponent(
              atob(base64)
                .split('')
                .map(function (c) {
                  return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
                })
                .join('')
            );
            const payload = JSON.parse(json);

            // Mapear el rol correctamente
            let mappedRole: 'MODERATOR' | 'STORE_ADMIN' | 'ADMIN' | 'USER' | 'CUSTOMER' = 'USER';
            if (payload.role) {
              const role = payload.role.toUpperCase();
              if (['ADMIN', 'STORE_ADMIN', 'MODERATOR', 'USER', 'CUSTOMER'].includes(role)) {
                mappedRole = role as any;
              } else if (role === 'admin') {
                mappedRole = 'ADMIN';
              } else if (role === 'user') {
                mappedRole = 'USER';
              }
            }

            const user: UserProfile = {
              id: payload.sub || payload.user_id || payload.id || '',
              name: payload.name || payload.username || payload.email || '',
              email: payload.email || '',
              role: mappedRole,
              serviceProviderId: payload.serviceProviderId,
              restaurantId: payload.restaurantId,
              storeId: payload.storeId,
            };
            return user;
          } catch {
            return null;
          }
        }
      }
    } catch (e) {
      // ignore and return null
    }
  }
  return null;
}
