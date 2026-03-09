# EmprendYup Frontend — Product Roadmap

## Vision

EmprendYup empowers Latin American entrepreneurs by providing a complete digital business platform — e-commerce, operations management, customer engagement, and analytics — adapted to their business type.

---

## Business Types Supported

| Type         | Description                                       |
| ------------ | ------------------------------------------------- |
| `store`      | Online retail store with product catalog          |
| `restaurant` | Restaurant with menu, reservations, and orders    |
| `service`    | Service business with calendar scheduling and CRM |
| `event`      | Event/fair management with ticket selling         |

---

## User Roles

| Role       | Description                                          |
| ---------- | ---------------------------------------------------- |
| `customer` | End consumer browsing and purchasing                 |
| `seller`   | Entrepreneur managing their business on EmprendYup   |
| `admin`    | Platform administrator managing users and categories |

---

## Milestone 1: Core E-Commerce (Completed ✅)

- [x] User registration and authentication (local + Google OAuth)
- [x] Product catalog browsing with search and filters
- [x] Shopping cart and checkout
- [x] ePayco payment integration
- [x] Order confirmation and receipt
- [x] Favorites system
- [x] Seller dashboard — store and product management
- [x] RBAC with customer, seller, and admin roles

## Milestone 2: Multi-Tenant Dashboard (Completed ✅)

- [x] Dashboard modules for stores (product, orders, payments, insights)
- [x] Restaurant modules (menu, reservations, expenses, payroll)
- [x] Service modules (calendar, CRM, expenses, service management)
- [x] Event/fair modules (fair management, selling)
- [x] Blog with Editor.js (rich text, images, embeds)
- [x] WhatsApp message templates
- [x] Customer management (CRM)
- [x] Quotation generation

## Milestone 3: Growth & Engagement (In Progress 🚧)

- [ ] Advanced analytics and KPI dashboard
- [ ] Loyalty program / bonuses management
- [ ] Multi-product import (bulk CSV upload)
- [ ] Seller wallet and payout management
- [ ] Subscription plan management
- [ ] Admin panel improvements (category management, entrepreneur directory)

## Milestone 4: Scaling & Performance (Planned 📋)

- [ ] End-to-end test suite (E2E with Playwright or Cypress)
- [ ] Unit and integration test coverage baseline
- [ ] Performance optimization (Core Web Vitals)
- [ ] SEO improvements for product pages
- [ ] Multi-language support (Spanish first, then Portuguese)
- [ ] PWA capabilities for mobile sellers

## Milestone 5: AI-Enhanced Features (Planned 📋)

- [ ] AI chat assistant integration (ChatWidget with `NEXT_PUBLIC_AGENT_API`)
- [ ] AI-powered product descriptions
- [ ] Smart WhatsApp automation
- [ ] Demand forecasting insights

---

## How to Add a New Feature

1. The **Product Agent** creates a spec in `specs/<feature-name>.md`
2. The **Architecture Agent** reviews for technical feasibility
3. The **Product Agent** creates task files in `tasks/NN-<feature-name>.md`
4. Update `NEXT_TASK.md` to point to the first task
5. Assign tasks to the appropriate agents and begin implementation
