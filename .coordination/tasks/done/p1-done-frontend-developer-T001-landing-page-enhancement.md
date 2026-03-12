---
id: T001
agent: frontend-developer
priority: 1
status: done
depends_on: []
created: 2026-03-12
---

## Task: Landing Page & Login Enhancement

### Context

The current `page.tsx` just re-exports the login page — there is no proper marketing
landing page. The app has rich components already built (NewHeroSection, FeaturesSection,
HowItWorksSection, TestimonialsSection, LeadCaptureSectionNew, EnhancedFooter) that are
not wired up on a public-facing route. The login UI also needs visual polish.

### Acceptance Criteria

- [ ] `page.tsx` renders a full marketing landing page (not login redirect)
- [ ] Landing page includes: LandingNavbar, Hero, Stats, Features, HowItWorks, Testimonials, CTA, Footer
- [ ] New `LandingNavbar` component with logo + Login/Registrarse CTAs and mobile menu
- [ ] Login page visual polish: better form inputs, smooth animations, back-to-home link
- [ ] All components are fully typed (TypeScript, no `any`)
- [ ] Responsive across mobile/tablet/desktop
- [ ] Accessible (semantic HTML, ARIA labels, keyboard nav)
- [ ] No regressions to dashboard or auth flows

### Notes

- Design tokens: fourth-base=#00B2FF, secondary=#00B077, primary=#F04E23, font=DM Sans
- Dark theme is default (defaultTheme="dark" in ThemeProvider)
- Auth flow: login → dashboard/insights (existing store) or dashboard/store/new (new user)
- Existing components to reuse: FeaturesSection, HowItWorksSection, TestimonialsSection,
  LeadCaptureSectionNew, EnhancedFooter, NewHeroSection
