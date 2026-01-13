/**
 * Google OAuth Helper Utility
 *
 * Handles Google OAuth token flow by POSTing tokens to backend endpoints:
 * - /auth/google/signup
 * - /auth/google/login
 * - /auth/google
 *
 * Always uses credentials: 'include' to ensure auth_token cookies are stored.
 */

export interface GoogleAuthResponse {
  success: boolean;
  user?: {
    id: string;
    email: string;
    name: string;
    storeId?: string;
    restaurantId?: string;
    serviceProviderId?: string;
    role?: string;
    [key: string]: any;
  };
  access_token?: string;
  error?: string;
  message?: string;
}

export interface GoogleAuthParams {
  accessToken?: string;
  idToken?: string;
  googleSub?: string;
}

/**
 * Post Google tokens to a specific backend endpoint
 * @param endpoint - Backend endpoint path (e.g., '/auth/google/signup')
 * @param params - Google OAuth tokens and optional sub
 * @returns Promise with auth response
 */
export async function sendGoogleTokens(
  endpoint: string,
  params: GoogleAuthParams
): Promise<GoogleAuthResponse> {
  const apiBase = (process.env.NEXT_PUBLIC_API_URL || 'https://api.emprendy.ai').replace(/\/$/, '');
  const url = `${apiBase}${endpoint}`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // Critical: ensures auth_token cookie is stored
      body: JSON.stringify({
        accessToken: params.accessToken,
        idToken: params.idToken,
        sub: params.googleSub,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return {
        success: false,
        error: data.error || data.message || 'Authentication failed',
        message: data.message,
      };
    }

    return {
      success: true,
      user: data.user,
      access_token: data.access_token || data.accessToken || data.token,
      ...data,
    };
  } catch (error) {
    console.error('Google auth request failed:', error);
    return {
      success: false,
      error: 'Network error or server unavailable',
      message: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Handle Google signup with tokens
 */
export async function handleGoogleSignup(params: GoogleAuthParams): Promise<GoogleAuthResponse> {
  return sendGoogleTokens('/auth/google/signup', params);
}

/**
 * Handle Google login with tokens
 */
export async function handleGoogleLogin(params: GoogleAuthParams): Promise<GoogleAuthResponse> {
  return sendGoogleTokens('/auth/google/login', params);
}

/**
 * Handle Google auth (generic endpoint that handles both signup and login)
 */
export async function handleGoogleAuth(params: GoogleAuthParams): Promise<GoogleAuthResponse> {
  return sendGoogleTokens('/auth/google', params);
}

/**
 * Parse Google credential response to extract tokens
 */
export function parseGoogleCredential(credentialResponse: any): GoogleAuthParams {
  return {
    idToken: credentialResponse.credential,
    accessToken: credentialResponse.access_token,
    googleSub: credentialResponse.sub,
  };
}
