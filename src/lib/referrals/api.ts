import { ApolloClient } from '@apollo/client';
import {
  AFFILIATE_COMMISSIONS_BY_STATUS,
  AFFILIATE_LINK_BY_CODE,
  PENDING_AFFILIATE_COMMISSIONS,
  PAYOUT_AFFILIATE_COMMISSION_BY_INPUT,
  REFERRAL_BY_NEW_USER_ID,
  REGISTER_AFFILIATE_CONVERSION,
} from '@/lib/graphql/referrals';
import { ReferralConversionInput } from '@/lib/referrals/attribution';

type AffiliateLinkStatus = 'ACTIVE' | 'INACTIVE' | 'DISABLED' | string;

interface AffiliateLinkByCodeResponse {
  affiliateLinkByCode?: {
    id?: string;
    referralCode?: string;
    status?: AffiliateLinkStatus;
  } | null;
}

interface RegisterAffiliateConversionResponse {
  registerAffiliateConversion?: {
    id?: string;
    status?: string;
  } | null;
}

interface RegisterAffiliateConversionVars {
  input: Record<string, unknown>;
}

interface ReferralByNewUserIdResponse {
  referralByNewUserId?: {
    id?: string;
    newUserId?: string;
    referrerUserId?: string;
    affiliateLinkId?: string;
    referralCode?: string;
    status?: string;
    createdAt?: string;
  } | null;
}

interface PayoutAffiliateCommissionResponse {
  payoutAffiliateCommission?: {
    id?: string;
    status?: string;
    amount?: number;
    currency?: string;
    paidAt?: string;
  } | null;
}

interface PendingAffiliateCommissionsResponse {
  pendingAffiliateCommissions?: Array<{
    commissionId?: string;
    conversionId?: string;
    affiliateLinkId?: string;
    referrerUserId?: string;
    referrerEmail?: string;
    referrerName?: string;
    referredUserId?: string;
    status?: string;
    amount?: number;
    currency?: string;
    createdAt?: string;
  }>;
}

interface AffiliateCommissionsByStatusResponse {
  affiliateCommissionsByStatus?: Array<{
    id?: string;
    status?: string;
    amount?: number;
    createdAt?: string;
    conversion?: {
      id?: string;
      newUserId?: string;
      referralCode?: string;
    } | null;
  }>;
}

export interface PendingCommissionCandidate {
  commissionId?: string;
  conversionId?: string;
  newUserId: string;
  referralCode?: string;
  amount?: number;
  currency?: string;
  status?: string;
  createdAt?: string;
  referrerUserId?: string;
  referrerEmail?: string;
  referrerName?: string;
}

export const resolveReferralCodeByNewUserId = async (
  client: ApolloClient<object>,
  newUserId: string
): Promise<string | null> => {
  if (!newUserId) return null;

  const response = await client.query<ReferralByNewUserIdResponse>({
    query: REFERRAL_BY_NEW_USER_ID,
    variables: { newUserId },
    fetchPolicy: 'network-only',
  });

  const referralCode = String(response.data?.referralByNewUserId?.referralCode || '')
    .trim()
    .toUpperCase();

  return referralCode || null;
};

export const getReferralByNewUserId = async (
  client: ApolloClient<object>,
  newUserId: string
): Promise<{
  id?: string;
  newUserId?: string;
  referrerUserId?: string;
  affiliateLinkId?: string;
  referralCode?: string;
  status?: string;
  createdAt?: string;
} | null> => {
  if (!newUserId) return null;

  const response = await client.query<ReferralByNewUserIdResponse>({
    query: REFERRAL_BY_NEW_USER_ID,
    variables: { newUserId },
    fetchPolicy: 'network-only',
  });

  const referral = response.data?.referralByNewUserId;
  if (!referral) return null;

  return {
    id: referral.id,
    newUserId: referral.newUserId,
    referrerUserId: referral.referrerUserId,
    affiliateLinkId: referral.affiliateLinkId,
    referralCode: referral.referralCode,
    status: referral.status,
    createdAt: referral.createdAt,
  };
};

export const payoutAffiliateCommission = async (
  client: ApolloClient<object>,
  params: { commissionId?: string; notes?: string }
): Promise<{
  id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  paidAt?: string;
}> => {
  const runMutation = async (mutation: any, variables: Record<string, unknown>) => {
    const response = await client.mutate<PayoutAffiliateCommissionResponse>({
      mutation,
      variables,
    });

    return {
      id: response.data?.payoutAffiliateCommission?.id,
      status: response.data?.payoutAffiliateCommission?.status,
      amount: response.data?.payoutAffiliateCommission?.amount,
      currency: response.data?.payoutAffiliateCommission?.currency,
      paidAt: response.data?.payoutAffiliateCommission?.paidAt,
    };
  };

  const commissionId = String(params.commissionId || '').trim();
  const notes = String(params.notes || '').trim();

  if (commissionId) {
    return runMutation(PAYOUT_AFFILIATE_COMMISSION_BY_INPUT, {
      input: {
        commissionId,
        ...(notes ? { notes } : {}),
      },
    });
  }

  throw new Error('Se requiere commissionId para ejecutar payout.');
};

const normalizePendingCommissionCandidate = (item: {
  commissionId?: string;
  conversionId?: string;
  affiliateLinkId?: string;
  referrerUserId?: string;
  referrerEmail?: string;
  referrerName?: string;
  referredUserId?: string;
  id?: string;
  status?: string;
  amount?: number;
  currency?: string;
  createdAt?: string;
  conversion?: {
    id?: string;
    newUserId?: string;
    referralCode?: string;
  } | null;
}): PendingCommissionCandidate | null => {
  const newUserId = String(item.referredUserId || item.conversion?.newUserId || '').trim();
  if (!newUserId) return null;

  return {
    commissionId: item.commissionId || item.id,
    conversionId: item.conversionId || item.conversion?.id,
    newUserId,
    referralCode: item.conversion?.referralCode,
    amount: typeof item.amount === 'number' ? item.amount : undefined,
    currency: item.currency,
    status: item.status,
    createdAt: item.createdAt,
    referrerUserId: item.referrerUserId,
    referrerEmail: item.referrerEmail,
    referrerName: item.referrerName,
  };
};

export const listPendingCommissionCandidates = async (
  client: ApolloClient<object>
): Promise<PendingCommissionCandidate[]> => {
  try {
    const response = await client.query<PendingAffiliateCommissionsResponse>({
      query: PENDING_AFFILIATE_COMMISSIONS,
      fetchPolicy: 'network-only',
    });

    const mapped = (response.data?.pendingAffiliateCommissions || [])
      .map(normalizePendingCommissionCandidate)
      .filter((item): item is PendingCommissionCandidate => Boolean(item));

    if (mapped.length > 0) return mapped;
  } catch {
    // Fallback to generic status query below.
  }

  const fallbackResponse = await client.query<AffiliateCommissionsByStatusResponse>({
    query: AFFILIATE_COMMISSIONS_BY_STATUS,
    variables: { status: 'COMMISSION_PENDING' },
    fetchPolicy: 'network-only',
  });

  return (fallbackResponse.data?.affiliateCommissionsByStatus || [])
    .map(normalizePendingCommissionCandidate)
    .filter((item): item is PendingCommissionCandidate => Boolean(item));
};

export const validateAffiliateLinkByCode = async (
  client: ApolloClient<object>,
  referralCode: string
): Promise<{ valid: boolean; affiliateLinkId?: string }> => {
  const response = await client.query<AffiliateLinkByCodeResponse>({
    query: AFFILIATE_LINK_BY_CODE,
    variables: { referralCode },
    fetchPolicy: 'network-only',
  });

  const link = response.data?.affiliateLinkByCode;
  if (!link?.id) {
    return { valid: false };
  }

  const status = String(link.status || '').toUpperCase();
  if (status !== 'ACTIVE') {
    return { valid: false };
  }

  return { valid: true, affiliateLinkId: link.id };
};

const buildPaymentPayload = (conversion: ReferralConversionInput) => ({
  referralCode: conversion.referralCode,
  newUserId: conversion.convertedUserId,
  subscriptionId: conversion.transactionId,
  status: conversion.status || 'COMMISSION_PENDING',
  referralAmount: conversion.referralAmount,
  commissionPercentage: conversion.commissionPercentage,
});

const buildFallbackPayload = (conversion: ReferralConversionInput) => ({
  referralCode: conversion.referralCode,
  newUserId: conversion.convertedUserId,
  status: conversion.status || 'COMMISSION_PENDING',
  referralAmount: conversion.referralAmount,
  commissionPercentage: conversion.commissionPercentage,
});

const buildMinimalPayload = (conversion: ReferralConversionInput) => ({
  referralCode: conversion.referralCode,
  newUserId: conversion.convertedUserId,
  status: conversion.status || 'COMMISSION_PENDING',
});

export const registerAffiliateRegistration = async (
  client: ApolloClient<object>,
  input: { referralCode: string; newUserId: string }
): Promise<{ id?: string; status?: string }> => {
  const tryMutation = async (variables: RegisterAffiliateConversionVars) => {
    const response = await client.mutate<
      RegisterAffiliateConversionResponse,
      RegisterAffiliateConversionVars
    >({
      mutation: REGISTER_AFFILIATE_CONVERSION,
      variables,
    });

    return {
      id: response.data?.registerAffiliateConversion?.id,
      status: response.data?.registerAffiliateConversion?.status,
    };
  };

  const minimalPayload = {
    referralCode: input.referralCode,
    newUserId: input.newUserId,
    status: 'REGISTERED',
  };

  const fallbackPayload = {
    referralCode: input.referralCode,
    newUserId: input.newUserId,
    conversionType: 'SUBSCRIPTION',
    status: 'REGISTERED',
    referralAmount: 0,
    commissionPercentage: 0,
  };

  try {
    return await tryMutation({ input: minimalPayload });
  } catch {
    return tryMutation({ input: fallbackPayload });
  }
};

export const registerAffiliateConversion = async (
  client: ApolloClient<object>,
  conversion: ReferralConversionInput
): Promise<{ id?: string; status?: string }> => {
  const tryMutation = async (variables: RegisterAffiliateConversionVars) => {
    const response = await client.mutate<
      RegisterAffiliateConversionResponse,
      RegisterAffiliateConversionVars
    >({
      mutation: REGISTER_AFFILIATE_CONVERSION,
      variables,
    });

    return {
      id: response.data?.registerAffiliateConversion?.id,
      status: response.data?.registerAffiliateConversion?.status,
    };
  };

  try {
    return await tryMutation({ input: buildPaymentPayload(conversion) });
  } catch {
    try {
      return await tryMutation({ input: buildFallbackPayload(conversion) });
    } catch {
      return tryMutation({ input: buildMinimalPayload(conversion) });
    }
  }
};
