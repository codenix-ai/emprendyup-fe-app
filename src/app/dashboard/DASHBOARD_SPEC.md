# Emprendy.ai Dashboard Module

This document defines the **Dashboard module** for Emprendy.ai.  
The dashboard will support **users** and **admins**, and will be integrated as a separate module into the existing **Next.js + Tailwind CSS** project.

## 🎯 Goal

Provide a multi-role dashboard that allows:

- **Users** to create and manage their store, view insights, manage orders, adjust settings, and handle client bonuses.
- **Admins** to see platform-wide analytics, manage users and stores.

---

## 🗂️ Routes & Pages

### Base

- `/dashboard` → redirects to `/dashboard/insights`

### User Flows

1. **Store Creation (Wizard Step 1)**
   - `/dashboard/store/new`
   - Collects: name, industry, country/currency, brand color, logo upload, subdomain.
   - Draft saved to local store (Zustand).

2. **Store Management**
   - `/dashboard/store/:id/overview`
   - Tabs: Overview, Catalog, Channels, Integrations.
   - Switcher for multiple stores.

3. **Insights (CRM Lite)**
   - `/dashboard/insights`
   - KPIs (clients, orders, MRR, conversion, etc.).
   - Charts: clients growth, top sources, funnel.
   - Table: leads with statuses.

4. **Orders View**
   - `/dashboard/orders`
   - Orders table with filters (status/date), CSV export.
   - Drawer for details.

5. **Bonus Management**
   - `/dashboard/bonuses`
   - Create/Edit bonus rules.
   - Client wallets view.

6. **Profile Settings**
   - `/dashboard/settings/profile`
   - Tabs: Profile, Security, Notifications, Billing.

### Admin Only

- `/dashboard/admin`
  - Metrics: total stores, users, orders, GMV.
  - Tables: Stores, Users, Integrations usage.
  - Actions: suspend, upgrade (mock).

---

## 📂 Project Structure

- /layout.tsx
- /page.tsx
- /insights/page.tsx
- /orders/page.tsx
- /bonuses/page.tsx
- /settings/profile/page.tsx
- /store/new/page.tsx
- /store/[id]/overview/page.tsx
- /store/[id]/catalog/page.tsx
- /store/[id]/channels/page.tsx
- /store/[id]/integrations/page.tsx
- /admin/page.tsx
- /components
- /ui/\*
- /dashboard/\*
- /lib
- /api/\*
- /store/\*
- /schemas/\*
- /utils/\*

---

## 🧩 Key Components

- `StoreWizardStepOne`
- `StoreSwitcher`
- `KPICard`
- `OrderDetailsDrawer`
- `DataTable` with filters/export
- `RuleBuilder` for bonuses
- `InviteMemberModal`
- `DateRangePicker`
- Chart wrappers: `LineChart`, `BarChart`, `FunnelChart`

---

## 📦 State Management

- **Zustand slices** for drafts, filters, and session.
- Role-based access control utilities (`hasRole`, `guardedRoute`).

---

## 📊 Data Schemas (Zod)

- **Store**: id, name, slug, brandColor, logoUrl, currency, ownerId.
- **Order**: id, storeId, customerId, items[], total, status.
- **Customer/Lead**: id, name, email/phone, status, lastContactAt.
- **BonusRule**: id, storeId, type, value, conditions, validity.
- **ClientWallet**: id, customerId, balance, points.

---

## 🌐 Mock API Endpoints

- `GET/POST /api/stores`
- `GET /api/stores/:id/overview`
- `GET /api/orders`, `PATCH /api/orders/:id`
- `GET/POST /api/leads`
- `GET/POST /api/bonuses/rules`
- `GET /api/bonuses/wallets`
- `GET /api/insights/kpis`
- `GET /api/insights/charts`

---

## 🎨 UI & Styling

- Tailwind CSS with extended radius/shadows.
- Dark mode (system default, toggle in menu).
- Mobile responsive.
- Empty states with friendly illustrations & CTA.

---

## ✅ Acceptance Criteria

- Navigable sidebar with role-based visibility.
- Store creation wizard works with mock API.
- Insights show KPIs + charts with filters.
- Orders page supports search, filters, details, bulk mock actions.
- Bonus rules CRUD works against mock API.
- Profile settings form validates and saves (mock).
- Admin page only accessible for `admin` role.
- Works in dark/light mode.

---

## 🛠️ Developer Notes

- Use `react-hook-form + zod` for forms.
- Use `recharts` for charts.
- Use `shadcn/ui` for basic UI components.
- Create `README.md` in the module with setup instructions.

---
