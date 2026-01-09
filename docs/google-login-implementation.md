# Google OAuth Implementation Guide

## Overview

This implementation uses `@react-oauth/google` to handle Google OAuth authentication with a token-based flow. The client obtains Google tokens (access_token/id_token) and POSTs them to backend endpoints, which respond with authentication cookies.

## Architecture

### Flow Diagram

```
User clicks "Sign in with Google"
    ↓
Google OAuth popup opens
    ↓
User authenticates with Google
    ↓
Client receives credential response (id_token)
    ↓
Client POSTs tokens to backend (/auth/google/login or /auth/google/signup)
    ↓
Backend validates tokens with Google
    ↓
Backend returns user data + sets auth_token cookie
    ↓
Client stores user data in localStorage
    ↓
Client redirects to dashboard
```

## Files Structure

### 1. Helper Utility: `src/lib/utils/googleAuth.ts`

**Purpose**: Centralized helper functions for Google OAuth token handling.

**Key Features**:

- Always uses `credentials: 'include'` to ensure cookies are stored
- Handles POST requests to backend endpoints
- Provides unified error handling
- Parses Google credential responses

**Main Functions**:

```typescript
// Send tokens to any backend endpoint
sendGoogleTokens(endpoint: string, params: GoogleAuthParams)

// Specific endpoint helpers
handleGoogleSignup(params: GoogleAuthParams)
handleGoogleLogin(params: GoogleAuthParams)
handleGoogleAuth(params: GoogleAuthParams)

// Parse Google credential response
parseGoogleCredential(credentialResponse: any)
```

**Usage Example**:

```typescript
import { handleGoogleLogin, parseGoogleCredential } from '@/lib/utils/googleAuth';

const onSuccess = async (credentialResponse: CredentialResponse) => {
  const tokens = parseGoogleCredential(credentialResponse);
  const response = await handleGoogleLogin(tokens);

  if (response.success) {
    // Store user data and redirect
  } else {
    // Handle error
  }
};
```

### 2. Provider Component: `src/app/components/GoogleOAuthProvider.tsx`

**Purpose**: Wraps components with Google OAuth context.

**Key Features**:

- Uses `NEXT_PUBLIC_GOOGLE_CLIENT_ID` from environment variables
- Provides Google OAuth context to child components
- Gracefully handles missing configuration

**Usage**:

```tsx
import GoogleOAuthProvider from '../components/GoogleOAuthProvider';

<GoogleOAuthProvider>{/* Your components that use Google Login */}</GoogleOAuthProvider>;
```

### 3. Login Page: `src/app/login/page.tsx`

**Implementation Details**:

- Wraps entire page with `GoogleOAuthProvider`
- Uses `<GoogleLogin>` component from `@react-oauth/google`
- Handles success and error callbacks
- Shows loading state during authentication
- Displays success/error messages to user

**Key Components**:

```tsx
<GoogleLogin
  onSuccess={onGoogleLoginSuccess}
  onError={onGoogleLoginError}
  useOneTap={false}
  text="signin_with"
  size="large"
  width="100%"
  theme="outline"
/>
```

**Error Handling**:

- "No account found" → Prompts user to register first
- "User already exists" → Suggests logging in
- "Token validation" → Suggests retrying
- Generic errors → Shows backend error message

### 4. Signup Page: `src/app/registrarse/page.tsx`

**Implementation Details**:

Similar to login page but:

- Uses `/auth/google/signup` endpoint
- Shows different error messages
- Text says "signup_with" instead of "signin_with"

## Backend Endpoints

The implementation expects the following backend endpoints:

### POST `/auth/google/login`

**Request Body**:

```json
{
  "accessToken": "string (optional)",
  "idToken": "string",
  "sub": "string (optional)"
}
```

**Success Response** (200):

```json
{
  "user": {
    "id": "string",
    "email": "string",
    "name": "string",
    "storeId": "string (optional)",
    "role": "string (optional)"
  },
  "access_token": "string"
}
```

**Sets Cookie**:

```
auth_token=<jwt_token>; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=604800
```

**Error Response** (400/401/404):

```json
{
  "error": "string",
  "message": "No account found" | "User already exists" | "token validation failed"
}
```

### POST `/auth/google/signup`

Same structure as login endpoint.

### POST `/auth/google`

Generic endpoint that handles both signup and login.

## Error Messages

The implementation handles these specific error messages from the backend:

| Backend Message       | User-Facing Message                                                        |
| --------------------- | -------------------------------------------------------------------------- |
| `No account found`    | "No se encontró una cuenta con este correo. Por favor regístrate primero." |
| `User not found`      | Same as above                                                              |
| `User already exists` | "Ya existe una cuenta con este correo."                                    |
| `already registered`  | "Ya existe una cuenta con este correo. Por favor inicia sesión."           |
| `token validation`    | "Error al validar el token de Google. Por favor intenta nuevamente."       |
| Other errors          | Shows backend error message directly                                       |

## Environment Variables

Required environment variables:

```env
# Frontend (.env.local)
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-google-client-id.apps.googleusercontent.com
NEXT_PUBLIC_API_URL=https://api.emprendy.ai

# Backend
GOOGLE_CLIENT_ID=same-as-frontend
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

## User Flow Examples

### Successful Login Flow

1. User clicks Google login button
2. Google popup opens
3. User selects Google account
4. Client receives id_token
5. Client POSTs to `/auth/google/login` with `credentials: 'include'`
6. Backend validates token with Google
7. Backend returns user data + sets `auth_token` cookie
8. Client stores user in localStorage
9. Client shows success message
10. Client redirects to dashboard after 1 second

### Error Flow - No Account

1. User clicks Google login button
2. Google authentication succeeds
3. Client POSTs to `/auth/google/login`
4. Backend responds with `{ message: "No account found" }`
5. Client shows: "No se encontró una cuenta. Por favor regístrate primero."
6. User stays on login page

### Error Flow - User Already Exists (Signup)

1. User clicks Google signup button
2. Google authentication succeeds
3. Client POSTs to `/auth/google/signup`
4. Backend responds with `{ message: "User already exists" }`
5. Client shows: "Ya existe una cuenta. Por favor inicia sesión."
6. User stays on signup page

## Testing Checklist

### Login Page

- [ ] Google button displays correctly
- [ ] Google popup opens on click
- [ ] Successful login stores user data
- [ ] Successful login sets auth_token cookie
- [ ] Successful login redirects to correct dashboard
- [ ] "No account" error shows correct message
- [ ] Network errors show appropriate message
- [ ] Loading state shows during authentication

### Signup Page

- [ ] Google button displays correctly
- [ ] Google popup opens on click
- [ ] Successful signup creates account
- [ ] Successful signup sets auth_token cookie
- [ ] Successful signup redirects to store creation
- [ ] "User exists" error shows correct message
- [ ] Network errors show appropriate message
- [ ] Loading state shows during authentication

### General

- [ ] `credentials: 'include'` is set on all requests
- [ ] Cookies are stored in browser
- [ ] User data is stored in localStorage
- [ ] Error messages are user-friendly
- [ ] All flows work in production environment
- [ ] Environment variables are configured

## Troubleshooting

### Google Button Not Showing

**Problem**: Google button doesn't appear.

**Solution**: Check that `NEXT_PUBLIC_GOOGLE_CLIENT_ID` is set in `.env.local`.

### Cookie Not Being Set

**Problem**: auth_token cookie is not stored.

**Solution**: Verify `credentials: 'include'` is set in fetch requests. Check backend CORS settings allow credentials.

### Token Validation Errors

**Problem**: Backend returns "token validation failed".

**Solution**: Ensure `GOOGLE_CLIENT_ID` matches on frontend and backend. Verify token is being sent correctly.

### Redirect Issues

**Problem**: User not redirected after successful auth.

**Solution**: Check user object has correct fields (storeId, role, etc.). Verify router.push() is called.

## Migration from Old Flow

The old implementation used a redirect-based flow:

```typescript
// OLD - Redirect flow
const handleGoogleSignIn = () => {
  window.location.href = `${apiBase}/auth/google/redirect`;
};
```

The new implementation uses a token-based flow:

```typescript
// NEW - Token flow
const onGoogleLoginSuccess = async (credentialResponse) => {
  const tokens = parseGoogleCredential(credentialResponse);
  const response = await handleGoogleLogin(tokens);
  // Handle response
};
```

**Advantages of New Flow**:

- No page reload required
- Better error handling on client side
- More control over user experience
- Ability to show loading states
- Can handle errors without URL parameters

## Security Considerations

1. **HttpOnly Cookies**: Auth tokens are stored in HttpOnly cookies, preventing XSS attacks.

2. **Credentials Include**: Always using `credentials: 'include'` ensures cookies are sent with requests.

3. **Token Validation**: Backend validates id_token with Google before creating session.

4. **HTTPS**: Production environment must use HTTPS for secure cookie transmission.

5. **SameSite**: Cookies use `SameSite=Lax` to prevent CSRF attacks.

6. **Short-Lived Tokens**: Google tokens are short-lived and validated immediately.

## Additional Resources

- [@react-oauth/google Documentation](https://www.npmjs.com/package/@react-oauth/google)
- [Google Identity Services](https://developers.google.com/identity/gsi/web)
- [OAuth 2.0 Best Practices](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-security-topics)
