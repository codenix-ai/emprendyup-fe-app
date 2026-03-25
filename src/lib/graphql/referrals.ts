import { gql } from '@apollo/client';

export const AFFILIATE_LINK_BY_CODE = gql`
  query AffiliateLinkByCode($referralCode: String!) {
    affiliateLinkByCode(referralCode: $referralCode) {
      id
      userId
      referralCode
      fullUrl
      status
    }
  }
`;

export const REGISTER_AFFILIATE_CONVERSION = gql`
  mutation RegisterAffiliateConversion($input: RegisterAffiliateConversionInput!) {
    registerAffiliateConversion(input: $input) {
      id
      status
      affiliateLinkId
      newUserId
      referralAmount
      commissionPercentage
      commissionAmount
      createdAt
    }
  }
`;

export const REFERRAL_BY_NEW_USER_ID = gql`
  query ReferralByNewUserId($newUserId: String!) {
    referralByNewUserId(newUserId: $newUserId) {
      newUserId
      referrerUserId
      affiliateLinkId
      referralCode
      status
      createdAt
    }
  }
`;

export const PAYOUT_AFFILIATE_COMMISSION_BY_INPUT = gql`
  mutation PayoutAffiliateCommissionByInput($input: PayoutAffiliateCommissionInput!) {
    payoutAffiliateCommission(input: $input) {
      id
      status
      amount
      currency
      paidAt
    }
  }
`;

export const AFFILIATE_COMMISSIONS_BY_STATUS = gql`
  query AffiliateCommissionsByStatus($status: String!) {
    affiliateCommissionsByStatus(status: $status) {
      id
      status
      amount
      paidAt
      createdAt
      conversion {
        id
        newUserId
        referralCode
      }
    }
  }
`;

export const PENDING_AFFILIATE_COMMISSIONS = gql`
  query PendingAffiliateCommissions {
    pendingAffiliateCommissions {
      commissionId
      conversionId
      affiliateLinkId
      referrerUserId
      referrerEmail
      referrerName
      referredUserId
      status
      amount
      currency
      createdAt
    }
  }
`;
