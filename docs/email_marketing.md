You are a Senior Frontend Developer for Emprendy.ai, a SaaS platform for
entrepreneurs.
Your task is to build a complete Email Marketing Campaign Management UI.

---

## 🎯 Goal

Build an admin-only section at /admin/email-marketing that lets platform admins
create, manage, and monitor email marketing campaigns sent via SendGrid.

---

## 🔌 Backend API

GraphQL endpoint: POST /graphql
Authentication: All queries/mutations require header → Authorization: Bearer
<ADMIN_JWT>

### Enums available from the API:

CampaignStatus: DRAFT | ACTIVE | PAUSED | COMPLETED
UserSegmentType: ALL | NEW_USERS | ACTIVE_USERS | INACTIVE_USERS | STORE_OWNERS |
VERIFIED | ENTREPRENEURS
EmailLogStatus: PENDING | SENT | FAILED | OPENED | CLICKED | BOUNCED |
UNSUBSCRIBED
RecipientType: USER | ENTREPRENEUR

### Queries:

# List all campaigns

query GetEmailCampaigns {
emailCampaigns {
id name description status segmentType templateId
intervalDays totalSent totalOpened totalClicked
lastRunAt nextRunAt createdAt updatedAt
}
}

# Single campaign

query GetEmailCampaign($id: ID!) {
emailCampaign(id: $id) {
id name description status segmentType templateId
intervalDays dynamicTemplateData
totalSent totalOpened totalClicked
lastRunAt nextRunAt createdAt updatedAt
}
}

# Metrics (open rate, click rate, failures)

query GetCampaignMetrics($id: ID!) {
emailCampaignMetrics(id: $id) {
id name totalSent totalOpened totalClicked
openRate clickRate failedCount
}
}

# Send logs (recipient-level detail)

query GetCampaignLogs($id: ID!, $limit: Int) {
emailCampaignLogs(id: $id, limit: $limit) {
id email status recipientType
sentAt openedAt clickedAt failureReason retryCount createdAt
}
}

### Mutations:

# Create

mutation CreateCampaign($input: CreateCampaignInput!) {
createEmailCampaign(input: $input) {
id name status nextRunAt
}
}

# CreateCampaignInput fields:

# name: String!

# description: String

# templateId: String! ← SendGrid template ID (d-xxxxxxxx)

# segmentType: UserSegmentType (default: ALL)

# intervalDays: Int (default: 2, minimum: 1)

# dynamicTemplateData: String ← JSON.stringify({ offer: "20% OFF", cta: "Start

now" })

# status: CampaignStatus (default: DRAFT)

# Update

mutation UpdateCampaign($input: UpdateCampaignInput!) {
updateEmailCampaign(input: $input) {
id name status intervalDays segmentType
}
}

# UpdateCampaignInput: same fields as Create + required id: ID!

# Lifecycle

mutation ActivateCampaign($id: ID!) {
     activateEmailCampaign(id: $id) { id status nextRunAt }
   }
   mutation PauseCampaign($id: ID!) {
pauseEmailCampaign(id: $id) { id status }
   }
   mutation ResumeCampaign($id: ID!) {
resumeEmailCampaign(id: $id) { id status nextRunAt }
}

# Manual test run

mutation RunCampaign($id: ID!) {
runEmailCampaign(id: $id) { sent skipped failed }
}

# Delete

mutation DeleteCampaign($id: ID!) {
deleteEmailCampaign(id: $id) { success message }
}

---

## 🖥️ Pages & Components to Build

### 1. /admin/email-marketing — Campaign List Page

- Table/card list of all campaigns with columns:
  Name | Segment | Status badge | Interval | Sent | Open Rate | Click Rate |
  Next Run | Actions
- Status badges with colors:
  DRAFT=gray ACTIVE=green PAUSED=yellow COMPLETED=blue
- Action buttons per row:
  [Activate] (only if DRAFT)
  [Pause] (only if ACTIVE)
  [Resume] (only if PAUSED)
  [Run Now] (any status — triggers test send with confirmation modal)
  [View] → navigates to detail page
  [Edit] → opens edit drawer/modal
  [Delete] → confirmation dialog
- Top-right: [+ New Campaign] button → opens create drawer/modal
- Show a toast/notification after every mutation

### 2. /admin/email-marketing/:id — Campaign Detail Page

- Header: Campaign name + status badge + action buttons (Pause/Resume/Activate/Run
  Now)
- Metrics cards row:
  📤 Total Sent | 👁 Opens (openRate%) | 🖱 Clicks (clickRate%) | ❌ Failed
- Campaign info section:
  Template ID | Segment | Interval | Last Run | Next Run | Dynamic Variables
  (pretty-printed JSON)
- Logs table (paginated, limit 100):
  Email | Recipient Type | Status | Sent At | Opened At | Clicked At | Failure
  Reason - Color-code status: SENT=green, FAILED=red, OPENED=blue, CLICKED=purple,
  BOUNCED=orange, UNSUBSCRIBED=gray, PENDING=yellow
- Refresh button to reload metrics + logs

### 3. Create / Edit Campaign Drawer or Modal

Fields: - Name _ (text input) - Description (textarea) - SendGrid Template ID _ (text input, hint: "Starts with d-") - Target Segment _ (select dropdown with all UserSegmentType values + human
labels:
ALL → "All Users"
NEW_USERS → "New Users (last 7 days)"
ACTIVE_USERS → "Active Buyers (last 30 days)"
INACTIVE_USERS → "Inactive Users (60+ days)"
STORE_OWNERS → "Store Owners"
VERIFIED → "Verified Users"
ENTREPRENEURS → "Entrepreneurs" - Send Interval (days) _ (number input, min 1, default 2) - Dynamic Variables (JSON editor or key-value builder)
→ stored as JSON.stringify(obj) before sending to API
→ parsed and shown as key-value pairs in the UI
→ example keys: offer, cta, firstName, companyName

---

## 📊 Dynamic Variables — UX Guidance

Dynamic variables are injected into every SendGrid email template.
The backend always injects these automatically (no need to add them manually): - firstName, fullName, email, campaignName, unsubscribeUrl

User-defined extras (shown in the form) examples: - offer: "20% OFF this week" - cta: "Start your free trial" - discount: "50"

Build a simple key-value pair editor (+ Add Variable / ✕ Remove) that
serializes to JSON string before submitting.

---

## 🔒 Access Control

- This entire section is admin-only
- If the user's role is not ADMIN, redirect to /dashboard or show 403 page
- The JWT token must be sent as Authorization: Bearer <token> on every request

---

## 🎨 Design Guidelines

- Use the existing design system / component library already in the project
- Status badges should use colored pills/chips
- Metrics cards should be prominent (large numbers, icon + label)
- The logs table should support client-side filtering by status (EmailLogStatus)
- Empty states: show friendly message when no campaigns exist or no logs found
- Loading skeletons while data is fetching
- Error states with retry button

---

## ✅ Acceptance Criteria

1.  Can create a campaign with all fields and it appears in the list
2.  Can activate a DRAFT campaign → status changes to ACTIVE
3.  Can pause/resume campaigns
4.  Can trigger a manual run and see a result toast: "Sent: 42, Skipped: 5, Failed:
    0"
5.  Campaign detail shows correct metrics (openRate, clickRate)
6.  Logs table shows per-recipient status with correct color coding
7.  Delete shows confirmation dialog and removes from list
8.  Dynamic variables form serializes/deserializes correctly
9.  All mutations show success/error toasts
10. Admin-only route guard works correctly
