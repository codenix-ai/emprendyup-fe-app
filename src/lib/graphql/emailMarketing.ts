import { gql } from '@apollo/client';

// ─── Queries ──────────────────────────────────────────────────────────────────

export const GET_EMAIL_CAMPAIGNS = gql`
  query GetEmailCampaigns {
    emailCampaigns {
      id
      name
      description
      status
      segmentType
      templateId
      intervalDays
      totalSent
      totalOpened
      totalClicked
      lastRunAt
      nextRunAt
      createdAt
      updatedAt
    }
  }
`;

export const GET_EMAIL_CAMPAIGN = gql`
  query GetEmailCampaign($id: ID!) {
    emailCampaign(id: $id) {
      id
      name
      description
      status
      segmentType
      templateId
      intervalDays
      dynamicTemplateData
      totalSent
      totalOpened
      totalClicked
      lastRunAt
      nextRunAt
      createdAt
      updatedAt
    }
  }
`;

export const GET_CAMPAIGN_METRICS = gql`
  query GetCampaignMetrics($id: ID!) {
    emailCampaignMetrics(id: $id) {
      id
      name
      totalSent
      totalOpened
      totalClicked
      openRate
      clickRate
      failedCount
    }
  }
`;

export const GET_CAMPAIGN_LOGS = gql`
  query GetCampaignLogs($id: ID!, $limit: Int) {
    emailCampaignLogs(id: $id, limit: $limit) {
      id
      email
      status
      recipientType
      sentAt
      openedAt
      clickedAt
      failureReason
      retryCount
      createdAt
    }
  }
`;

// ─── Mutations ────────────────────────────────────────────────────────────────

export const CREATE_EMAIL_CAMPAIGN = gql`
  mutation CreateCampaign($input: CreateCampaignInput!) {
    createEmailCampaign(input: $input) {
      id
      name
      status
      nextRunAt
    }
  }
`;

export const UPDATE_EMAIL_CAMPAIGN = gql`
  mutation UpdateCampaign($input: UpdateCampaignInput!) {
    updateEmailCampaign(input: $input) {
      id
      name
      status
      intervalDays
      segmentType
    }
  }
`;

export const ACTIVATE_EMAIL_CAMPAIGN = gql`
  mutation ActivateCampaign($id: ID!) {
    activateEmailCampaign(id: $id) {
      id
      status
      nextRunAt
    }
  }
`;

export const PAUSE_EMAIL_CAMPAIGN = gql`
  mutation PauseCampaign($id: ID!) {
    pauseEmailCampaign(id: $id) {
      id
      status
    }
  }
`;

export const RESUME_EMAIL_CAMPAIGN = gql`
  mutation ResumeCampaign($id: ID!) {
    resumeEmailCampaign(id: $id) {
      id
      status
      nextRunAt
    }
  }
`;

export const RUN_EMAIL_CAMPAIGN = gql`
  mutation RunCampaign($id: ID!) {
    runEmailCampaign(id: $id) {
      sent
      skipped
      failed
    }
  }
`;

export const DELETE_EMAIL_CAMPAIGN = gql`
  mutation DeleteCampaign($id: ID!) {
    deleteEmailCampaign(id: $id) {
      success
      message
    }
  }
`;

// ─── TypeScript types ─────────────────────────────────────────────────────────

export type CampaignStatus = 'DRAFT' | 'ACTIVE' | 'PAUSED' | 'COMPLETED';
export type UserSegmentType =
  | 'ALL'
  | 'NEW_USERS'
  | 'ACTIVE_USERS'
  | 'INACTIVE_USERS'
  | 'STORE_OWNERS'
  | 'VERIFIED'
  | 'ENTREPRENEURS';
export type EmailLogStatus =
  | 'PENDING'
  | 'SENT'
  | 'FAILED'
  | 'OPENED'
  | 'CLICKED'
  | 'BOUNCED'
  | 'UNSUBSCRIBED';
export type RecipientType = 'USER' | 'ENTREPRENEUR';

export interface EmailCampaign {
  id: string;
  name: string;
  description?: string;
  status: CampaignStatus;
  segmentType: UserSegmentType;
  templateId: string;
  intervalDays: number;
  dynamicTemplateData?: string;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  lastRunAt?: string;
  nextRunAt?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CampaignMetrics {
  id: string;
  name: string;
  totalSent: number;
  totalOpened: number;
  totalClicked: number;
  openRate: number;
  clickRate: number;
  failedCount: number;
}

export interface EmailCampaignLog {
  id: string;
  email: string;
  status: EmailLogStatus;
  recipientType: RecipientType;
  sentAt?: string;
  openedAt?: string;
  clickedAt?: string;
  failureReason?: string;
  retryCount: number;
  createdAt: string;
}

export const SEGMENT_LABELS: Record<UserSegmentType, string> = {
  ALL: 'All Users',
  NEW_USERS: 'New Users (last 7 days)',
  ACTIVE_USERS: 'Active Buyers (last 30 days)',
  INACTIVE_USERS: 'Inactive Users (60+ days)',
  STORE_OWNERS: 'Store Owners',
  VERIFIED: 'Verified Users',
  ENTREPRENEURS: 'Entrepreneurs',
};
