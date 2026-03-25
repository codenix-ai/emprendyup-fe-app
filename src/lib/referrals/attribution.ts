const REFERRAL_STORAGE_KEY = 'affiliate_attribution_v1';
const CHECKOUT_CONTEXT_KEY = 'affiliate_checkout_context_v1';
const CONVERSION_LOCK_PREFIX = 'affiliate_conversion_lock_v1:';
const CONVERSION_DONE_PREFIX = 'affiliate_conversion_done_v1:';
const LAST_CONVERSION_KEY = 'affiliate_last_conversion_v1';
const REGISTRATION_DONE_PREFIX = 'affiliate_registration_done_v1:';
const REGISTRATION_LOCK_PREFIX = 'affiliate_registration_lock_v1:';
const REFERRAL_COOKIE_NAME = 'affiliate_referral_code';
const REFERRAL_COOKIE_TTL_DAYS = 30;

export type ReferralValidationState = 'unknown' | 'valid' | 'invalid';

export interface ReferralAttributionState {
  referralCode: string;
  capturedAt: string;
  expiresAt: string;
  validationState: ReferralValidationState;
  referralApplied: boolean;
  affiliateLinkId?: string;
}

export interface ReferralCheckoutContext {
  orderId: string;
  planType: string;
  planDurationMonths: number;
  amount: number;
  currency: string;
  createdAt: string;
}

export interface ReferralConversionInput {
  referralCode: string;
  convertedUserId: string;
  transactionId: string;
  planType: string;
  planDurationMonths: number;
  commissionAmount?: number;
  currency: string;
  conversionDate: string;
  referralAmount: number;
  commissionPercentage?: number;
  status?: 'REGISTERED' | 'PAID' | string;
  commissionStatus?: 'COMMISSION_PENDING' | 'COMMISSION_PAID' | string;
}

export interface ReferralConversionResult {
  ok: boolean;
  duplicate: boolean;
  message?: string;
}

export interface ReferralConversionSummary {
  transactionId: string;
  convertedAt: string;
}

const isBrowser = () => typeof window !== 'undefined';

const computeExpiresAt = (now: Date = new Date()): string => {
  const expiresAt = new Date(now.getTime());
  expiresAt.setDate(expiresAt.getDate() + REFERRAL_COOKIE_TTL_DAYS);
  return expiresAt.toISOString();
};

const writeCookie = (referralCode: string, expiresAtIso: string) => {
  if (!isBrowser()) return;
  const secure = window.location.protocol === 'https:' ? '; Secure' : '';
  document.cookie = `${REFERRAL_COOKIE_NAME}=${encodeURIComponent(referralCode)}; Path=/; Expires=${new Date(
    expiresAtIso
  ).toUTCString()}; SameSite=Lax${secure}`;
};

const clearCookie = () => {
  if (!isBrowser()) return;
  document.cookie = `${REFERRAL_COOKIE_NAME}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
};

export const sanitizeReferralCode = (rawCode: string | null | undefined): string | null => {
  if (!rawCode) return null;
  const normalized = rawCode.trim().toUpperCase();
  return normalized.length > 0 ? normalized : null;
};

export const getReferralCodeFromUrl = (urlValue: string | null | undefined): string | null => {
  return sanitizeReferralCode(urlValue);
};

const isExpired = (expiresAt: string): boolean => {
  return new Date(expiresAt).getTime() <= Date.now();
};

const parseAttribution = (raw: string | null): ReferralAttributionState | null => {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as ReferralAttributionState;
    if (!parsed.referralCode || !parsed.expiresAt || isExpired(parsed.expiresAt)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const readReferralAttribution = (): ReferralAttributionState | null => {
  if (!isBrowser()) return null;
  const parsed = parseAttribution(localStorage.getItem(REFERRAL_STORAGE_KEY));
  if (!parsed) {
    clearReferralAttribution();
    return null;
  }
  return parsed;
};

export const persistReferralAttribution = (
  referralCode: string,
  overrides?: Partial<ReferralAttributionState>
): ReferralAttributionState | null => {
  if (!isBrowser()) return null;

  const sanitized = sanitizeReferralCode(referralCode);
  if (!sanitized) return null;

  const existing = readReferralAttribution();
  const baseDate = new Date();
  const nextState: ReferralAttributionState = {
    referralCode: sanitized,
    capturedAt: existing?.capturedAt || baseDate.toISOString(),
    expiresAt: computeExpiresAt(baseDate),
    validationState: existing?.validationState || 'unknown',
    referralApplied: existing?.referralApplied || false,
    affiliateLinkId: existing?.affiliateLinkId,
    ...overrides,
  };

  localStorage.setItem(REFERRAL_STORAGE_KEY, JSON.stringify(nextState));
  writeCookie(sanitized, nextState.expiresAt);
  return nextState;
};

export const markReferralValidated = (
  params:
    | { valid: true; affiliateLinkId?: string; referralCode?: string }
    | { valid: false; referralCode?: string }
): ReferralAttributionState | null => {
  const targetCode = params.referralCode || readReferralAttribution()?.referralCode;
  if (!targetCode) return null;

  if (!params.valid) {
    clearReferralAttribution();
    return null;
  }

  return persistReferralAttribution(targetCode, {
    validationState: 'valid',
    referralApplied: true,
    affiliateLinkId: params.affiliateLinkId,
  });
};

export const clearReferralAttribution = () => {
  if (!isBrowser()) return;
  localStorage.removeItem(REFERRAL_STORAGE_KEY);
  localStorage.removeItem(CHECKOUT_CONTEXT_KEY);
  clearCookie();
};

export const persistCheckoutContext = (context: Omit<ReferralCheckoutContext, 'createdAt'>) => {
  if (!isBrowser()) return;
  const payload: ReferralCheckoutContext = {
    ...context,
    createdAt: new Date().toISOString(),
  };
  localStorage.setItem(CHECKOUT_CONTEXT_KEY, JSON.stringify(payload));
};

export const readCheckoutContext = (): ReferralCheckoutContext | null => {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(CHECKOUT_CONTEXT_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as ReferralCheckoutContext;
    if (!parsed.orderId || !parsed.planType || !parsed.currency) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

export const clearCheckoutContext = () => {
  if (!isBrowser()) return;
  localStorage.removeItem(CHECKOUT_CONTEXT_KEY);
};

const lockKey = (transactionId: string) => `${CONVERSION_LOCK_PREFIX}${transactionId}`;
const doneKey = (transactionId: string) => `${CONVERSION_DONE_PREFIX}${transactionId}`;

export const hasCompletedConversion = (transactionId: string): boolean => {
  if (!isBrowser()) return false;
  return localStorage.getItem(doneKey(transactionId)) === '1';
};

export const markConversionCompleted = (transactionId: string) => {
  if (!isBrowser()) return;
  localStorage.setItem(doneKey(transactionId), '1');
  const summary: ReferralConversionSummary = {
    transactionId,
    convertedAt: new Date().toISOString(),
  };
  localStorage.setItem(LAST_CONVERSION_KEY, JSON.stringify(summary));
  localStorage.removeItem(lockKey(transactionId));
};

export const readLastConversionSummary = (): ReferralConversionSummary | null => {
  if (!isBrowser()) return null;
  const raw = localStorage.getItem(LAST_CONVERSION_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as ReferralConversionSummary;
    if (!parsed.transactionId || !parsed.convertedAt) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const registrationDoneKey = (userId: string) => `${REGISTRATION_DONE_PREFIX}${userId}`;
const registrationLockKey = (userId: string) => `${REGISTRATION_LOCK_PREFIX}${userId}`;

export const hasRegisteredReferralConversion = (userId: string): boolean => {
  if (!isBrowser()) return false;
  return localStorage.getItem(registrationDoneKey(userId)) === '1';
};

export const markRegisteredReferralConversion = (userId: string) => {
  if (!isBrowser()) return;
  localStorage.setItem(registrationDoneKey(userId), '1');
  localStorage.removeItem(registrationLockKey(userId));
};

export const acquireReferralRegistrationLock = (userId: string): boolean => {
  if (!isBrowser()) return true;
  const key = registrationLockKey(userId);
  if (localStorage.getItem(key) === '1') {
    return false;
  }
  localStorage.setItem(key, '1');
  return true;
};

export const releaseReferralRegistrationLock = (userId: string) => {
  if (!isBrowser()) return;
  localStorage.removeItem(registrationLockKey(userId));
};

export const acquireConversionLock = (transactionId: string): boolean => {
  if (!isBrowser()) return true;
  const key = lockKey(transactionId);
  if (localStorage.getItem(key) === '1') {
    return false;
  }
  localStorage.setItem(key, '1');
  return true;
};

export const releaseConversionLock = (transactionId: string) => {
  if (!isBrowser()) return;
  localStorage.removeItem(lockKey(transactionId));
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const shouldTreatAsDuplicate = (error: unknown): boolean => {
  const message = String((error as { message?: string })?.message || '').toLowerCase();
  return (
    message.includes('already') ||
    message.includes('duplic') ||
    message.includes('exists') ||
    message.includes('registrad')
  );
};

export const registerConversionWithRetry = async (
  execute: (conversion: ReferralConversionInput) => Promise<{
    status?: string;
  }>,
  conversion: ReferralConversionInput,
  maxRetries: number = 3
): Promise<ReferralConversionResult> => {
  let attempt = 0;
  let lastError: unknown = null;

  while (attempt < maxRetries) {
    try {
      const response = await execute(conversion);
      const responseStatus = String(response?.status || '').toUpperCase();
      if (responseStatus.includes('DUPLIC')) {
        return { ok: true, duplicate: true, message: 'Conversion already registered' };
      }
      return { ok: true, duplicate: false };
    } catch (error) {
      if (shouldTreatAsDuplicate(error)) {
        return { ok: true, duplicate: true, message: 'Conversion already registered' };
      }
      lastError = error;
      attempt += 1;
      if (attempt < maxRetries) {
        await sleep(350 * attempt);
      }
    }
  }

  return {
    ok: false,
    duplicate: false,
    message: String((lastError as { message?: string })?.message || 'Unknown conversion error'),
  };
};
