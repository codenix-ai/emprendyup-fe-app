'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UseAuthOptions {
  noRedirect?: boolean;
}

export function useAuth(options: UseAuthOptions = {}) {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const checkAuth = () => {
      try {
        const user = JSON.parse(localStorage.getItem('user') || '{}');

        if (!user || !user.email || !user.name) {
          setIsAuthenticated(false);
          setIsLoading(false);
          if (!options.noRedirect) {
            router.push('/');
          }
          return;
        }

        setIsAuthenticated(true);
        setIsLoading(false);
      } catch {
        setIsAuthenticated(false);
        setIsLoading(false);
        if (!options.noRedirect) {
          router.push('/');
        }
      }
    };

    checkAuth();
  }, [router, options.noRedirect]);

  return { isAuthenticated, isLoading };
}
