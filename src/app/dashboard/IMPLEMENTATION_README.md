# Emprendy.ai Dashboard Module

A comprehensive dashboard module for the Emprendy.ai platform, built with Next.js 15, TypeScript, and Tailwind CSS.

## 🚀 Features

### User Features

- **Insights Dashboard**: KPI tracking, analytics charts, customer management
- **Order Management**: Order tracking, filtering, CSV export, order details
- **Store Management**: Store creation wizard, store switching, configuration
- **Bonus System**: Create and manage customer bonus rules and wallets
- **Profile Settings**: User profile management with tabs for different sections

### Admin Features

- **Platform Analytics**: Platform-wide metrics and insights
- **User Management**: View and manage all platform users
- **Store Management**: Monitor and manage all stores on the platform

### Technical Features

- **Mobile-First Design**: Fully responsive with mobile-optimized layouts
- **State Management**: Zustand for client-side state management
- **Form Validation**: React Hook Form + Zod for robust form handling
- **Chart Visualization**: Recharts for interactive data visualization
- **Type Safety**: Full TypeScript coverage with Zod schemas

## 📂 Structure

```
/app/dashboard/
├── layout.tsx                 # Main dashboard shell
├── page.tsx                   # Redirect to insights
├── insights/page.tsx          # CRM lite dashboard
├── orders/page.tsx            # Orders management
├── bonuses/page.tsx           # Bonus rules management
├── store/
│   ├── new/page.tsx          # Store creation wizard
│   └── [id]/
│       ├── overview/page.tsx  # Store overview
│       ├── catalog/page.tsx   # Product catalog
│       ├── channels/page.tsx  # Sales channels
│       └── integrations/page.tsx # Third-party integrations
├── settings/
│   └── profile/page.tsx      # User profile settings
├── admin/page.tsx            # Admin dashboard
└── components/
    ├── KPICard.tsx           # Reusable KPI display component
    ├── LineChart.tsx         # Line chart wrapper
    ├── BarChart.tsx          # Bar chart wrapper
    ├── StoreWizardStepOne.tsx # Store creation form
    └── ... (other components)

/lib/
├── schemas/dashboard.ts       # Zod schemas for type validation
├── store/dashboard.ts         # Zustand state management
└── utils/rbac.ts             # Role-based access control
```

## 🛠️ Setup & Installation

### Prerequisites

- Node.js 18+
- Next.js 15
- Required dependencies already installed

### Dependencies Added

```bash
npm install zustand zod @tanstack/react-query recharts @radix-ui/react-icons
```

### Development

1. Navigate to dashboard routes: `/dashboard`
2. The dashboard will redirect to `/dashboard/insights`
3. Authentication is handled through localStorage (mock implementation)

## 🎨 Design System

### Colors

- Primary: `fourth-base` (defined in Tailwind config)
- Status colors: Green (success), Red (error), Yellow (warning), Blue (info)

### Components

- **KPICard**: Displays key metrics with trend indicators
- **Charts**: Responsive chart components using Recharts
- **Tables**: Mobile-responsive tables that convert to cards on small screens
- **Forms**: React Hook Form with Zod validation

### Responsive Breakpoints

- `sm`: 640px
- `md`: 768px (tablet breakpoint for layout changes)
- `lg`: 1024px
- `xl`: 1280px

## 📱 Mobile Responsiveness

### Layout Adaptations

- **Sidebar**: Collapses to hamburger menu on mobile
- **Tables**: Convert to stacked cards on mobile devices
- **Charts**: Use ResponsiveContainer for automatic scaling
- **Forms**: Full-width inputs with larger touch targets

### Mobile-Specific Features

- Touch-friendly 44px minimum tap targets
- Swipe support for KPI cards
- Bottom navigation for easy thumb access
- Collapsible filters in drawer modals

## 🔐 Authentication & Authorization

### Roles

- **User**: Can manage their own stores, orders, and customers
- **Admin**: Can access platform-wide analytics and manage all stores

### Implementation

- Mock authentication using localStorage
- Role-based route protection
- Permission checking utilities

### Current Mock Users

```typescript
// User role (default)
{ role: 'user', name: 'Usuario', email: 'user@example.com' }

// Admin role (for testing admin features)
{ role: 'admin', name: 'Admin', email: 'admin@example.com' }
```

## 📊 State Management

### Zustand Stores

1. **StoreDraftStore**: Manages store creation wizard state
2. **DashboardFiltersStore**: Manages filter states across pages
3. **SessionStore**: User session and current store state
4. **DashboardUIStore**: UI state (sidebar, modals, drawers)

### Usage Example

```typescript
import { useSessionStore } from '@/lib/store/dashboard';

function MyComponent() {
  const { user, currentStore } = useSessionStore();
  // Component logic
}
```

## 🌐 API Integration

### Mock API Routes

All API routes return typed responses using Zod schemas:

- `GET /api/dashboard/insights/kpis` - Dashboard KPIs
- `GET /api/dashboard/insights/charts` - Chart data
- `GET /api/dashboard/orders` - Orders list
- `GET /api/dashboard/customers` - Customer/leads list

### Real API Integration

To connect to real APIs:

1. Replace mock data in API routes with actual database calls
2. Update authentication to use NextAuth or similar
3. Add error handling and loading states
4. Implement real-time updates with WebSockets if needed

## 🧪 Testing

### Manual Testing Checklist

- [ ] Dashboard loads and redirects to insights
- [ ] KPI cards display with loading states
- [ ] Charts render responsively
- [ ] Store creation wizard works end-to-end
- [ ] Orders page filters and search work
- [ ] Mobile layout adaptations function correctly
- [ ] Role-based access control works
- [ ] State persists across page refreshes

### Component Testing

Each component is designed to be testable with mock props and isolated state.

## 🚀 Deployment Notes

### Environment Variables

- Authentication providers (NextAuth)
- Database connection strings
- API endpoints for production

### Build Optimization

- All images should use Next.js Image component
- Charts use dynamic imports for code splitting
- State persistence uses localStorage (consider moving to server sessions for production)

## 🔮 Future Enhancements

### Planned Features

1. **Real-time Notifications**: WebSocket integration for live updates
2. **Advanced Analytics**: More detailed reporting and export options
3. **Team Management**: Multi-user store management
4. **Inventory Management**: Product and stock tracking
5. **Payment Integration**: Stripe/PayPal integration for real transactions

### Performance Improvements

1. **Virtualization**: For large data tables
2. **Caching**: React Query for server state management
3. **Lazy Loading**: Component-level code splitting

## 📝 Contributing

### Code Style

- Use TypeScript for all new files
- Follow existing naming conventions
- Add Zod schemas for new data types
- Include proper error handling
- Write responsive CSS with mobile-first approach

### Adding New Pages

1. Create page component in appropriate directory
2. Add route to navigation in `layout.tsx`
3. Create corresponding API routes if needed
4. Add Zod schemas for data validation
5. Update RBAC if access control needed

## 📞 Support

For questions or issues with the dashboard module:

1. Check the console for TypeScript errors
2. Verify all required dependencies are installed
3. Ensure localStorage has proper mock user data
4. Check responsive breakpoints in browser dev tools
