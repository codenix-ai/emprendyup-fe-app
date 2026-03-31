# Landing Renderer — Block Props Specification

> **Version:** 2.0  
> **Source of truth:** `emprendyup-fe-app/src/features/landing-editor/blocks/*/`  
> **Purpose:** Implement these interfaces in the renderer repo to render `draftConfig` / `publishedConfig` from the GraphQL `pages` query.

---

## How the data arrives

The GraphQL query returns:

```graphql
query GetPages($storeId: String) {
  pages(storeId: $storeId) {
    id
    slug
    draftConfig # JSON — use for preview
    publishedConfig # JSON — use for public site
    createdAt
    updatedAt
  }
}
```

`draftConfig` / `publishedConfig` are a `LandingPageJSON` object:

```ts
interface LandingPageJSON {
  version: '2.0';
  theme: ThemeConfig;
  craftState: CraftSerializedNodes; // Craft.js serialized tree
}
```

The `craftState` is a Craft.js serialized node tree. Each node has:

```ts
{
  [nodeId: string]: {
    type: { resolvedName: string }; // block name e.g. "HeroBanner"
    props: <BlockProps>;            // typed props below
    parent: string | null;
    children: string[];
    hidden: boolean;
    isCanvas: boolean;
  }
}
```

Walk the tree starting from node `"ROOT"` and render children in order.

---

## Shared CSS variables (ThemeConfig)

Apply these on `:root` or a wrapper element before rendering blocks:

```ts
interface ThemeConfig {
  colorPrimary: string; // --color-primary
  colorBg: string; // --color-bg
  colorSurface: string; // --color-surface
  colorText: string; // --color-text
  colorTextMuted: string; // --color-text-muted
  fontHeading: string; // --font-heading  (Google Font name)
  fontBody: string; // --font-body     (Google Font name)
  borderRadius: string; // --radius        e.g. "8px"
}
```

---

## Block: `NavigationBar`

```ts
type NavVariant = 'minimal' | 'centered' | 'with-cta';

interface NavLink {
  label: string;
  href: string;
}

interface NavigationBarProps {
  variant: NavVariant;
  logoText: string;
  logoUrl: string; // empty string = show text only
  links: NavLink[];
  ctaText: string; // only rendered when variant === 'with-cta'
  ctaHref: string;
  showCart: boolean; // show shopping cart icon
  cartHref: string; // href for cart icon
  sticky: boolean; // position: sticky; top: 0; z-index: 50
  visible: boolean;
}
```

**Rendering notes:**

- `sticky: true` → `position: sticky; top: 0; z-index: 50`
- Cart icon (ShoppingCart, 20px) only when `showCart === true`
- CTA button only when `variant === 'with-cta'`
- `visible === false` → render `null`

---

## Block: `HeroBanner`

```ts
type HeroBannerVariant = 'gradient-overlay' | 'split-image' | 'minimal';

interface HeroBannerCTA {
  text: string;
  href: string;
  variant: 'primary' | 'secondary' | 'outline';
}

interface HeroColumnItem {
  title: string;
  text: string;
}

interface HeroBannerProps {
  variant: HeroBannerVariant;
  title: string;
  subtitle: string;
  cta: HeroBannerCTA[]; // can be empty array
  backgroundImage: string; // empty = no background image
  overlayColor: string; // hex e.g. "#000000"
  overlayOpacity: number; // 0–1
  minHeight: string; // CSS value e.g. "80vh"
  contentPosition: 'left' | 'center' | 'right';
  textAlign: 'left' | 'center' | 'right';
  showColumns: boolean;
  columns: 2 | 3; // grid columns for columnItems
  columnItems: HeroColumnItem[]; // rendered below CTA when showColumns=true
  visible: boolean;
}
```

**Rendering notes:**

- `gradient-overlay`: full-width div with `backgroundImage`, overlay div with `overlayColor + overlayOpacity`, content positioned by `contentPosition`
- `split-image`: flex row — text left, image right
- `minimal`: centered text, no background image
- CTA button styles:
  - `primary` → `background: var(--color-primary); color: #fff`
  - `outline` → `border: 2px solid currentColor; background: transparent`
  - `secondary` → `background: var(--color-surface); color: var(--color-text)`
- `showColumns === true` → render `columnItems` in a CSS grid below CTA buttons

---

## Block: `FooterSection`

```ts
interface FooterLink {
  label: string;
  href: string;
}

interface FooterColumn {
  title: string;
  links: FooterLink[];
}

interface FooterSectionProps {
  companyName: string;
  tagline: string;
  columns: FooterColumn[]; // 1–4 link columns
  socialFacebook: string; // URL or empty
  socialInstagram: string; // @handle or empty
  socialTiktok: string; // @handle or empty
  socialWhatsapp: string; // phone number e.g. "+573001234567"
  showWhatsappFloat: boolean;
  whatsappFloatMessage: string;
  copyrightText: string;
  visible: boolean;
}
```

**Rendering notes:**

- Top section grid: `gridTemplateColumns: 1fr repeat(N, 1fr)` where N = `columns.length`
  - First column: brand (name, tagline, social icons)
  - Remaining columns: link columns
- Social icons row (brand column only — NOT WhatsApp):
  - Instagram `#E1306C` → `https://instagram.com/{handle}`
  - Facebook `#1877F2` → value as-is
  - TikTok `#010101` → `https://tiktok.com/@{handle}`
- **Floating WhatsApp button** — render when `showWhatsappFloat === true && socialWhatsapp !== ""`:
  ```css
  position: fixed;
  bottom: 24px;
  right: 24px;
  z-index: 9999;
  width: 56px;
  height: 56px;
  border-radius: 50%;
  background-color: #25d366;
  box-shadow: 0 4px 16px rgba(37, 211, 102, 0.45);
  ```

  - Link: `https://wa.me/{digitsOnly}?text={encodeURIComponent(whatsappFloatMessage)}`
  - Icon: WhatsApp (FaWhatsapp from react-icons/fa, size 28)

---

## Block: `ProductGrid`

```ts
type ProductGridVariant = 'grid' | 'grid-3' | 'grid-4' | 'list' | 'featured';

interface ProductGridProps {
  variant: ProductGridVariant;
  title: string;
  subtitle: string;
  maxItems: number;
  showPrices: boolean;
  showAddToCart: boolean;
  visible: boolean;
}
```

**Rendering notes:**

- Fetch products from tenant's store API (use `storeId` from page context)
- `grid` / `grid-3` → 3-column CSS grid
- `grid-4` → 4-column CSS grid
- `list` → horizontal scroll / slider
- `featured` → 1 large card + remaining in 4-col grid
- Limit to `maxItems`
- Image container: `aspect-ratio: 1 / 1; object-fit: cover`

---

## Block: `CTABanner`

```ts
type CTAVariant = 'gradient' | 'boxed' | 'minimal';

interface CTABannerProps {
  variant: CTAVariant;
  title: string;
  subtitle: string;
  ctaText: string;
  ctaHref: string;
  ctaVariant: 'primary' | 'secondary' | 'outline';
  backgroundColor: string; // hex
  textColor: string; // hex
  visible: boolean;
}
```

---

## Block: `TestimonialsSection`

```ts
type TestimonialsVariant = 'cards' | 'minimal' | 'featured';

interface TestimonialItem {
  name: string;
  role: string;
  text: string;
  rating: number; // 1–5 stars
  avatar: string; // URL or empty → show initials fallback
}

interface TestimonialsSectionProps {
  variant: TestimonialsVariant;
  title: string;
  subtitle: string;
  items: TestimonialItem[];
  visible: boolean;
}
```

---

## Block: `GallerySection`

```ts
type GalleryVariant = 'grid' | 'masonry' | 'slider';

interface GalleryImage {
  url: string;
  alt: string;
}

interface GallerySectionProps {
  variant: GalleryVariant;
  title: string;
  columns: 2 | 3 | 4;
  images: GalleryImage[];
  visible: boolean;
}
```

---

## Block: `AboutSection`

```ts
type AboutVariant = 'default' | 'timeline' | 'team' | 'side-by-side' | 'centered' | 'with-stats';

interface AboutStat {
  label: string;
  value: string;
}

interface AboutSectionProps {
  variant: AboutVariant;
  title: string;
  description: string;
  image: string; // URL or empty
  stats: AboutStat[];
  visible: boolean;
}
```

---

## Block: `BrandSection`

```ts
type BrandVariant = 'horizontal' | 'stacked' | 'minimal';

interface BrandSectionProps {
  variant: BrandVariant;
  logoUrl: string;
  name: string;
  tagline: string;
  description: string;
  socialFacebook: string;
  socialInstagram: string;
  socialWhatsapp: string;
  visible: boolean;
}
```

---

## Block: `ContactSection`

```ts
type ContactVariant = 'card' | 'split' | 'minimal';

interface ContactSectionProps {
  variant: ContactVariant;
  title: string;
  subtitle: string;
  email: string;
  phone: string;
  address: string;
  showForm: boolean;
  submitText: string;
  visible: boolean;
}
```

---

## Block: `BookingForm`

```ts
type BookingVariant = 'card' | 'fullwidth';

interface BookingField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'date' | 'time' | 'select' | 'textarea';
  required: boolean;
  options?: string[]; // only for type === 'select'
}

interface BookingFormProps {
  variant: BookingVariant;
  title: string;
  subtitle: string;
  fields: BookingField[];
  submitText: string;
  successMessage: string;
  visible: boolean;
}
```

---

## Renderer component map

```ts
// blocks/index.ts in renderer repo
export const BLOCK_REGISTRY: Record<string, React.ComponentType<unknown>> = {
  NavigationBar: NavigationBarRenderer,
  HeroBanner: HeroBannerRenderer,
  FooterSection: FooterSectionRenderer,
  ProductGrid: ProductGridRenderer,
  CTABanner: CTABannerRenderer,
  TestimonialsSection: TestimonialsSectionRenderer,
  GallerySection: GallerySectionRenderer,
  AboutSection: AboutSectionRenderer,
  BrandSection: BrandSectionRenderer,
  ContactSection: ContactSectionRenderer,
  BookingForm: BookingFormRenderer,
};
```

---

## Tree walker (pseudo-code)

```tsx
function renderNode(nodeId: string, nodes: CraftSerializedNodes): ReactNode {
  const node = nodes[nodeId];
  if (!node || node.hidden) return null;

  const blockName = node.type.resolvedName;
  const Component = BLOCK_REGISTRY[blockName];

  if (!Component) {
    // Unknown block or canvas wrapper (ROOT) — render children
    return <>{node.children.map((id) => renderNode(id, nodes))}</>;
  }

  const props = node.props as Record<string, unknown>;
  if (props.visible === false) return null;

  return <Component key={nodeId} {...props} />;
}

// Entry point
export function LandingRenderer({ config }: { config: LandingPageJSON }) {
  applyTheme(config.theme); // set CSS variables on :root
  return <>{renderNode('ROOT', config.craftState)}</>;
}
```

---

## Important notes

| Note                | Detail                                                                                                   |
| ------------------- | -------------------------------------------------------------------------------------------------------- |
| `visible === false` | Skip rendering entirely — return `null`                                                                  |
| `ROOT` node         | Plain canvas wrapper, no component — render children only                                                |
| Node ID casing      | Always `"ROOT"` uppercase. Older drafts may have `"root"` — normalize before rendering                   |
| CSS variables       | Must be applied before first paint to avoid flash of unstyled content                                    |
| Floating WhatsApp   | Must render **outside** normal flow (`position: fixed`) — not clipped by any `overflow: hidden` ancestor |
| Product data        | `ProductGrid` needs tenant `storeId` injected via React context — not stored in block props              |

---

## GraphQL queries for the renderer

### 1. Resolve tenant + pages by custom domain

Use this as the **primary data fetch** — returns everything needed in a single query:

```graphql
query StoreByCustomDomain($customDomain: String!) {
  storeByCustomDomain(customDomain: $customDomain) {
    id
    storeId
    name
    description
    logoUrl
    faviconUrl
    bannerUrl
    primaryColor
    secondaryColor
    accentColor
    status
    restaurantId
    serviceProviderId
    siteConfig
    createdAt
    updatedAt
    pages {
      id
      slug
      entityType
      draftConfig
      publishedConfig
      createdAt
      updatedAt
    }
    storeImages {
      id
      url
      slug
      altText
      order
    }
  }
}
```

**Variables:**

```json
{ "customDomain": "yourdomain.com" }
```

**Usage in Next.js ISR:**

```ts
// app/[...path]/page.tsx  OR  middleware.ts domain resolution

const { data } = await apolloClient.query({
  query: STORE_BY_CUSTOM_DOMAIN,
  variables: { customDomain: host }, // host from request headers
});

const store = data.storeByCustomDomain;
const page = store.pages.find((p) => p.slug === 'home');
const config = page?.publishedConfig as LandingPageJSON | null;
```

### 2. Resolve by storeId (fallback / subdomain routing)

```graphql
query GetPages($storeId: String) {
  pages(storeId: $storeId) {
    id
    slug
    publishedConfig
    updatedAt
  }
}
```

---

## Routing strategy

```
Request: mitienda.com/          → customDomain = "mitienda.com"  → storeByCustomDomain
Request: slug.emprendyup.com/   → storeId = "slug"               → pages(storeId)
```

**Next.js Middleware** (`middleware.ts`):

```ts
export async function middleware(req: NextRequest) {
  const host = req.headers.get('host') ?? '';
  const isSubdomain = host.endsWith('.emprendyup.com');

  if (isSubdomain) {
    const slug = host.replace('.emprendyup.com', '');
    return NextResponse.rewrite(new URL(`/s/${slug}`, req.url));
  }
  // Custom domain — rewrite to /d/[domain] handler
  return NextResponse.rewrite(new URL(`/d/${host}`, req.url));
}
```

---

## TenantContext shape (for ProductGrid and other data-dependent blocks)

```ts
interface RendererTenantContext {
  storeId: string; // storeId field (slug)
  id: string; // internal DB id
  name: string;
  logoUrl: string | null;
  primaryColor: string | null;
  restaurantId: string | null;
  serviceProviderId: string | null;
  siteConfig: Record<string, unknown> | null;
}
```

Provide this via React context so `ProductGrid` and other blocks can fetch live data.
