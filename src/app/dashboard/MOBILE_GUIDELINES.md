# Emprendy.ai Dashboard – Mobile Friendly Guidelines

This document outlines the requirements for **mobile and responsive design** of the Dashboard module.

---

## 🎯 Goal

Ensure the dashboard is **fully usable on mobile devices** (≤768px width) while keeping parity with desktop features.  
Users and admins should be able to manage their stores, orders, bonuses, and settings without needing a desktop.

---

## 🧩 Layout Rules

### Sidebar & Navigation

- **Desktop:** persistent sidebar on the left.
- **Mobile (≤768px):**
  - Sidebar collapses into a **bottom or top navigation bar**.
  - Provide a **hamburger menu** in the topbar to toggle the full menu.
  - Use icons with short labels for nav items.

### Topbar

- Mobile topbar must include:
  - **Hamburger menu** (opens sidebar drawer).
  - **Store switcher** (combobox).
  - **User avatar menu**.
- Collapse search (Cmd/Ctrl+K) into an icon-only button.

---

## 📊 Pages Mobile Adaptations

### Store Creation Wizard

- Step forms should be **single-column**.
- Progress indicator should collapse into a top progress bar or step counter.
- File upload (logo) → use full-width drag/drop area or a button.

### Insights (CRM Lite)

- KPI cards → **stack vertically** with swipe support.
- Charts → use responsive containers (`<ResponsiveContainer>` in Recharts).
- Lead table → turn into a **stacked list** with key fields (name, status, last contact).

### Orders

- Orders table → stacked list (Order #, Customer, Status, Total).
- Filters collapse into a **drawer modal**.
- Order details open in a **bottom drawer** instead of side drawer.

### Bonuses

- Rules shown as **cards** with name, type, active status.
- Wallets table → stacked cards with client name + balance.

### Profile Settings

- Tabs collapse into a **dropdown selector** at the top.
- Forms use full-width inputs with larger tap targets.

### Admin

- Metrics → stacked KPI cards.
- Tables → stacked lists with action buttons (Suspend/Upgrade) as inline icons.

---

## 🎨 Styling & UX

- **Touch targets:** minimum 44x44px.
- **Spacing:** increase vertical padding (`py-3`) for list items.
- **Buttons:** full width where possible (`w-full`).
- **Typography:** Tailwind responsive text (`text-sm md:text-base`).
- **Empty states:** centered with illustration + CTA button.

---

## 🔄 Responsive Breakpoints (Tailwind)

```js
// tailwind.config.js
module.exports = {
  theme: {
    screens: {
      sm: '640px',
      md: '768px',
      lg: '1024px',
      xl: '1280px',
    },
  },
};
```
