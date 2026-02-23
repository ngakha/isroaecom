# PRShark Base UI Kits — Storybook Variants

> Ecommerce-oriented UI Kit-ები Storybook-ით. თითოეული kit-ი დამოუკიდებელი პროექტია, deploy: `kit1.prshark.online`, `kit2.prshark.online`

---

## Tech Stack (საერთო ორივესთვის)

- **Framework:** React 18 + Vite
- **Styling:** Tailwind CSS 3.4+
- **Storybook:** 8.x
- **Icons:** Lucide React
- **Animations:** Framer Motion (optional)
- **Deploy:** Vercel / Cloudflare Pages → subdomain CNAME

---

---

# Kit 1 — "Minimal" (მინიმალისტური)

**კონცეფცია:** სუფთა, თანამედროვე, Apple Store / Muji ესთეტიკა. თეთრი სივრცე, თხელი ხაზები, დახვეწილი ანიმაციები. პრემიუმ პროდუქტების მაღაზიებისთვის.

**Subdomain:** `kit1.prshark.online`

---

## 1.1 Design Tokens

### Colors

```js
colors: {
  primary: {
    50:  '#f8f8f8',
    100: '#f0f0f0',
    200: '#e4e4e4',
    300: '#d1d1d1',
    400: '#a0a0a0',
    500: '#737373',
    600: '#525252',
    700: '#404040',
    800: '#262626',
    900: '#171717',
    950: '#0a0a0a',
  },
  accent: {
    DEFAULT: '#1a1a1a',
    hover:   '#333333',
    light:   '#f5f5f5',
  },
  success: '#22c55e',
  warning: '#f59e0b',
  error:   '#ef4444',
  info:    '#3b82f6',
  background: '#ffffff',
  surface:    '#fafafa',
  border:     '#e5e5e5',
  muted:      '#a3a3a3',
}
```

### Typography

```js
fontFamily: {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  mono: ['JetBrains Mono', 'monospace'],
}

fontSize: {
  xs:    ['0.75rem',  { lineHeight: '1rem' }],
  sm:    ['0.8125rem', { lineHeight: '1.25rem' }],
  base:  ['0.875rem', { lineHeight: '1.5rem' }],
  lg:    ['1rem',     { lineHeight: '1.75rem' }],
  xl:    ['1.125rem', { lineHeight: '1.75rem' }],
  '2xl': ['1.5rem',   { lineHeight: '2rem' }],
  '3xl': ['1.875rem', { lineHeight: '2.25rem' }],
  '4xl': ['2.5rem',   { lineHeight: '3rem', letterSpacing: '-0.02em' }],
}
```

### Spacing & Radius

```js
borderRadius: {
  none: '0',
  sm:   '4px',
  md:   '6px',
  lg:   '8px',
  xl:   '12px',
  full: '9999px',
}

// Spacing: Tailwind default 4px scale
```

### Shadows

```js
boxShadow: {
  sm:   '0 1px 2px rgba(0, 0, 0, 0.04)',
  md:   '0 2px 8px rgba(0, 0, 0, 0.06)',
  lg:   '0 4px 16px rgba(0, 0, 0, 0.08)',
  xl:   '0 8px 32px rgba(0, 0, 0, 0.10)',
}
```

---

## 1.2 Core Components

### Button

| Variant | Description |
|---------|-------------|
| `primary` | შავი ფონი, თეთრი ტექსტი, hover: ნაცრისფერი |
| `secondary` | თეთრი ფონი, შავი border, hover: ღია ნაცრისფერი |
| `ghost` | უფონო, hover: ღია ფონი |
| `danger` | წითელი ფონი, თეთრი ტექსტი |
| `link` | underline ტექსტი, padding-ის გარეშე |

**Sizes:** `xs`, `sm`, `md`, `lg`
**States:** default, hover, active, disabled, loading (spinner)
**Extras:** icon-only, icon+text (left/right), full-width

```jsx
<Button variant="primary" size="md" loading={false}>
  Add to Cart
</Button>
<Button variant="secondary" size="sm" icon={<Heart />} iconPosition="left">
  Wishlist
</Button>
<Button variant="ghost" size="xs" iconOnly>
  <MoreHorizontal />
</Button>
```

---

### Input

| Variant | Description |
|---------|-------------|
| `default` | ნაცრისფერი border, focus: შავი border |
| `filled` | ღია ნაცრისფერი ფონი, border-ის გარეშე |
| `underline` | მხოლოდ ქვედა ხაზი |

**Features:** label, helper text, error state, prefix/suffix icons, clearable
**Sizes:** `sm`, `md`, `lg`

```jsx
<Input
  label="Email"
  placeholder="you@example.com"
  error="Invalid email"
  prefix={<Mail size={16} />}
  size="md"
/>
```

---

### Select

- Custom dropdown (არა native)
- Search/filter support
- Multi-select variant
- Grouped options
- Clear button

---

### Checkbox / Radio / Toggle

- Minimal square checkbox (შავი check)
- Round radio (შავი dot)
- Toggle switch (slide animation)
- Label support, disabled state

---

### Badge / Tag

| Variant | Use |
|---------|-----|
| `neutral` | Default ნაცრისფერი |
| `success` | მწვანე (In Stock, Active) |
| `warning` | ყვითელი (Low Stock) |
| `error` | წითელი (Out of Stock, Cancelled) |
| `info` | ლურჯი (New, Processing) |
| `outline` | Border-only |

**Sizes:** `sm`, `md`
**Extras:** dismissible (X button), dot indicator

---

### Card

```jsx
<Card padding="lg" hover shadow="md">
  <Card.Header>
    <Card.Title>Title</Card.Title>
    <Card.Action><Button variant="ghost" size="xs">Edit</Button></Card.Action>
  </Card.Header>
  <Card.Body>Content</Card.Body>
  <Card.Footer>Footer actions</Card.Footer>
</Card>
```

- Variants: `default`, `bordered`, `elevated`, `flat`
- Hover effect: subtle lift shadow

---

### Modal / Dialog

- Centered overlay with backdrop blur
- Sizes: `sm` (400px), `md` (500px), `lg` (640px), `xl` (800px), `full`
- Close button (X), ESC to close, click outside to close
- Header, body (scrollable), footer
- Transition: fade + scale

---

### Table / DataTable

- Striped / clean variants
- Sortable column headers
- Row hover highlight
- Checkbox selection
- Pagination bar
- Empty state
- Loading skeleton

---

### Toast / Notification

- Position: top-right
- Variants: success, error, warning, info
- Auto-dismiss (configurable)
- Minimal style: thin left border + icon

---

### Tabs

- Underline style (active: bottom border)
- Pill style (active: filled background)
- Icon + text support
- Scrollable on mobile

---

### Avatar

- Sizes: `xs` (24), `sm` (32), `md` (40), `lg` (48), `xl` (64)
- Image, initials fallback, icon fallback
- Status dot (online/offline)
- Avatar group (stacked)

---

### Dropdown Menu

- Trigger: button click
- Items: icon + label, divider, nested submenu
- Keyboard navigation

---

### Skeleton / Loading

- Pulse animation
- Shapes: text line, circle, rectangle, card

---

### Tooltip

- Position: top, bottom, left, right
- Dark background, white text
- Arrow pointer
- Delay on hover

---

### Breadcrumb

- Slash or chevron separator
- Truncate with ellipsis for long paths
- Current page highlighted

---

### Pagination

- Page numbers with prev/next
- Compact mode (prev/next only)
- "Showing X-Y of Z" text

---

## 1.3 Ecommerce-Specific Components

### ProductCard

```
+---------------------------+
|  [Image]           [Heart]|
|                           |
+---------------------------+
| Category                  |
| Product Name              |
| ★★★★☆ (24)               |
| ̶1̶9̶.̶9̶9̶  14.99 GEL        |
| [Add to Cart]             |
+---------------------------+
```

- Variants: `grid` (vertical), `list` (horizontal), `compact`
- Hover: image zoom, quick-view button
- Badge: "New", "Sale -30%", "Sold Out"
- Wishlist heart toggle

---

### ProductGallery

- Main image + thumbnails (bottom or side)
- Lightbox zoom on click
- Swipe on mobile
- Video thumbnail support

---

### QuantitySelector

- `[-] [2] [+]` format
- Min/max limits
- Disabled state

---

### PriceDisplay

```jsx
<PriceDisplay price={19.99} salePrice={14.99} currency="GEL" />
// Renders: ̶1̶9̶.̶9̶9̶  14.99 GEL
```

- Strikethrough original, highlighted sale price
- "From X.XX" for variants
- Tax inclusion note

---

### CartItem

- Image thumbnail, name, variant info, quantity selector, price, remove button
- Compact and full variants

---

### OrderStatusBadge

- Status-specific colors and icons
- Pipeline/stepper view

---

### AddressCard

- Display address with edit/delete actions
- "Default" badge
- Selectable (radio) for checkout

---

### EmptyState

- Centered illustration/icon
- Title + description
- CTA button

---

### StarRating

- Display only (filled stars)
- Interactive (clickable)
- Half-star support
- Review count

---

## 1.4 Layout Components

### Container

- max-width: 1280px, centered, px-4/px-6

### Grid

- CSS Grid wrapper: `cols={3}` `gap={6}`
- Responsive breakpoints

### Sidebar Layout

- Fixed sidebar (240px) + scrollable main
- Collapsible on mobile

### Section

- Title + subtitle + optional action button
- Divider

---

## 1.5 Storybook Organization

```
stories/
  foundations/
    Colors.stories.jsx
    Typography.stories.jsx
    Spacing.stories.jsx
    Shadows.stories.jsx
    Icons.stories.jsx
  components/
    Button.stories.jsx
    Input.stories.jsx
    Select.stories.jsx
    Checkbox.stories.jsx
    Badge.stories.jsx
    Card.stories.jsx
    Modal.stories.jsx
    Table.stories.jsx
    Toast.stories.jsx
    Tabs.stories.jsx
    Avatar.stories.jsx
    Dropdown.stories.jsx
    Skeleton.stories.jsx
    Tooltip.stories.jsx
    Breadcrumb.stories.jsx
    Pagination.stories.jsx
  ecommerce/
    ProductCard.stories.jsx
    ProductGallery.stories.jsx
    QuantitySelector.stories.jsx
    PriceDisplay.stories.jsx
    CartItem.stories.jsx
    OrderStatusBadge.stories.jsx
    AddressCard.stories.jsx
    EmptyState.stories.jsx
    StarRating.stories.jsx
  layouts/
    AdminDashboard.stories.jsx
    StorefrontPage.stories.jsx
    CheckoutFlow.stories.jsx
  pages/ (composed examples)
    ProductListingPage.stories.jsx
    ProductDetailPage.stories.jsx
    CartPage.stories.jsx
    AdminProductsPage.stories.jsx
```

---

---

# Kit 2 — "Bold" (თამამი / ენერგიული)

**კონცეფცია:** ფერადი, ენერგიული, თანამედროვე ბრენდინგი. Gradient აქცენტები, rounded კუთხეები, ჩრდილები. Fashion, lifestyle, streetwear ბრენდებისთვის.

**Subdomain:** `kit2.prshark.online`

---

## 2.1 Design Tokens

### Colors

```js
colors: {
  primary: {
    50:  '#faf5ff',
    100: '#f3e8ff',
    200: '#e9d5ff',
    300: '#d8b4fe',
    400: '#c084fc',
    500: '#a855f7',
    600: '#9333ea',
    700: '#7e22ce',
    800: '#6b21a8',
    900: '#581c87',
    950: '#3b0764',
  },
  secondary: {
    50:  '#fff1f2',
    100: '#ffe4e6',
    200: '#fecdd3',
    300: '#fda4af',
    400: '#fb7185',
    500: '#f43f5e',
    600: '#e11d48',
    700: '#be123c',
    800: '#9f1239',
    900: '#881337',
  },
  accent: {
    DEFAULT: '#f97316', // orange
    light:   '#fff7ed',
  },
  success: '#10b981',
  warning: '#f59e0b',
  error:   '#ef4444',
  info:    '#06b6d4',
  background: '#ffffff',
  surface:    '#fafafa',
  border:     '#e5e7eb',
  muted:      '#9ca3af',
  dark:       '#111827',

  // Gradients (CSS custom properties)
  // --gradient-primary: linear-gradient(135deg, #9333ea, #f43f5e)
  // --gradient-warm:    linear-gradient(135deg, #f43f5e, #f97316)
  // --gradient-cool:    linear-gradient(135deg, #06b6d4, #9333ea)
}
```

### Typography

```js
fontFamily: {
  sans:    ['Plus Jakarta Sans', 'system-ui', 'sans-serif'],
  display: ['Outfit', 'sans-serif'],       // headings
  mono:    ['Fira Code', 'monospace'],
}

fontSize: {
  xs:    ['0.75rem',  { lineHeight: '1rem' }],
  sm:    ['0.8125rem', { lineHeight: '1.25rem' }],
  base:  ['0.9rem',   { lineHeight: '1.5rem' }],
  lg:    ['1.05rem',  { lineHeight: '1.75rem' }],
  xl:    ['1.2rem',   { lineHeight: '1.75rem' }],
  '2xl': ['1.6rem',   { lineHeight: '2rem', letterSpacing: '-0.01em' }],
  '3xl': ['2rem',     { lineHeight: '2.5rem', letterSpacing: '-0.02em' }],
  '4xl': ['2.75rem',  { lineHeight: '3.25rem', letterSpacing: '-0.03em' }],
  '5xl': ['3.5rem',   { lineHeight: '4rem', letterSpacing: '-0.03em' }],
}
```

### Spacing & Radius

```js
borderRadius: {
  none: '0',
  sm:   '6px',
  md:   '10px',
  lg:   '14px',
  xl:   '18px',
  '2xl': '24px',
  full: '9999px',
}
```

### Shadows

```js
boxShadow: {
  sm:      '0 2px 4px rgba(0, 0, 0, 0.04)',
  md:      '0 4px 12px rgba(0, 0, 0, 0.08)',
  lg:      '0 8px 24px rgba(0, 0, 0, 0.12)',
  xl:      '0 16px 48px rgba(0, 0, 0, 0.16)',
  glow:    '0 0 20px rgba(147, 51, 234, 0.3)',     // primary glow
  'glow-secondary': '0 0 20px rgba(244, 63, 94, 0.3)', // secondary glow
}
```

---

## 2.2 Core Components

### Button

| Variant | Description |
|---------|-------------|
| `primary` | Gradient ფონი (purple→pink), თეთრი ტექსტი, hover: glow shadow |
| `secondary` | Solid secondary color (pink/rose) |
| `outline` | Gradient border, transparent ფონი |
| `ghost` | უფონო, hover: ღია primary ფონი |
| `danger` | წითელი solid |
| `glass` | Glassmorphism (backdrop-blur, semi-transparent) |

**Sizes:** `xs`, `sm`, `md`, `lg`, `xl`
**States:** default, hover (scale 1.02 + glow), active (scale 0.98), disabled, loading
**Extras:** pill shape, icon-only circle, animated gradient border

```jsx
<Button variant="primary" size="lg" rounded="full">
  Shop Now
</Button>
<Button variant="glass" size="md" icon={<ShoppingBag />}>
  Add to Bag
</Button>
<Button variant="outline" size="sm" gradient>
  Explore
</Button>
```

---

### Input

| Variant | Description |
|---------|-------------|
| `default` | Rounded border, focus: gradient border + glow |
| `filled` | ღია ფონი, rounded, no border |
| `floating` | Floating label animation |

**Features:** label (animated float), error shake animation, success checkmark, character count
**Extras:** gradient focus ring

```jsx
<Input
  variant="floating"
  label="Search products..."
  prefix={<Search size={18} />}
  suffix={<Kbd>Ctrl+K</Kbd>}
/>
```

---

### Select

- Custom styled, rounded
- Animated dropdown (spring animation)
- Colored option tags for multi-select
- Search with highlight

---

### Checkbox / Radio / Toggle

- Checkbox: rounded-md, gradient fill when checked
- Radio: gradient dot
- Toggle: gradient track, smooth spring animation
- Animated check/uncheck transitions

---

### Badge / Tag

| Variant | Use |
|---------|-----|
| `solid` | Colored fill |
| `soft` | Light background + colored text |
| `outline` | Colored border |
| `gradient` | Gradient background |
| `glass` | Glassmorphism |

**Extras:** pulse animation for "Live", dot indicator, dismissible with scale-out animation

```jsx
<Badge variant="gradient" gradient="primary">NEW</Badge>
<Badge variant="soft" color="success" dot pulse>In Stock</Badge>
<Badge variant="glass">Featured</Badge>
```

---

### Card

```jsx
<Card variant="elevated" hover="lift" rounded="xl">
  <Card.Image src="..." overlay gradient />
  <Card.Body>
    <Card.Title>Product Name</Card.Title>
    <Card.Description>Description</Card.Description>
  </Card.Body>
  <Card.Footer>
    <PriceDisplay ... />
    <Button variant="primary" size="sm">Add</Button>
  </Card.Footer>
</Card>
```

- Variants: `default`, `bordered`, `elevated`, `glass`, `gradient-border`
- Hover effects: `lift` (translateY + shadow), `glow`, `border-gradient`
- Image overlay options: gradient, dark, blur

---

### Modal / Dialog

- Backdrop blur (strong)
- Slide-up + fade animation (spring physics)
- Gradient header accent line
- Sizes: `sm`, `md`, `lg`, `xl`, `fullscreen`
- Rounded corners (xl)

---

### Table / DataTable

- Rounded container, no outer border
- Soft row hover (primary-50)
- Colored status cells
- Animated sort indicators
- Gradient header option
- Card-based mobile view

---

### Toast / Notification

- Position: bottom-center (slide up)
- Rounded-xl, shadow-lg
- Colored left accent or icon
- Progress bar for auto-dismiss
- Swipe to dismiss

---

### Tabs

- Pill style with gradient active (default)
- Underline with gradient line
- Animated sliding indicator (Framer Motion)
- Badge count on tabs

---

### Avatar

- Gradient border ring
- Status indicator (animated pulse for online)
- Sizes: same as Kit 1
- Group with "+3 more" counter
- Initials with gradient background

---

### Dropdown Menu

- Rounded-xl, shadow-xl
- Animated entrance (scale + fade)
- Icon items, colored shortcuts
- Divider with label

---

### Skeleton / Loading

- Shimmer gradient animation (left to right)
- Rounded shapes matching component radius
- Stagger animation for lists

---

### Tooltip

- Rounded, shadow-lg
- Gradient variant
- Animated scale entrance
- Rich tooltip (title + description)

---

### Breadcrumb

- Chevron separators
- Current item: gradient text
- Chip style option (each segment is a pill)

---

### Pagination

- Rounded pill buttons
- Active: gradient background
- Animated page transition

---

## 2.3 Ecommerce-Specific Components

### ProductCard

```
+----------------------------------+
|  [Image — full bleed]    [-30%]  |
|                          [Heart] |
|                                  |
|  [Quick View on hover overlay]   |
+----------------------------------+
|  ★★★★★ 4.8                      |
|  Product Name                    |
|  ̶1̶9̶.̶9̶9̶  14.99 GEL              |
|                                  |
|  [● Red  ● Blue  ● Black]       |
|  [ + Add to Bag ————————— ]     |
+----------------------------------+
```

- Hover: image scale 1.05, overlay with "Quick View"
- Color swatches (circles with border)
- Animated "Added!" state on button
- Variants: `default`, `featured` (larger, gradient border), `compact`
- Sale badge: gradient ribbon

---

### ProductGallery

- Main image with rounded corners
- Thumbnails: rounded, active: gradient border
- Lightbox with backdrop blur
- Swipe gestures (Framer Motion)
- Zoom on hover (loupe effect)

---

### QuantitySelector

- Rounded-full buttons
- Animated number change (slide up/down)
- Gradient border on focus

---

### PriceDisplay

```jsx
<PriceDisplay price={29.99} salePrice={19.99} currency="GEL" badge="-33%" />
```

- Sale badge: gradient pill
- Original price: strikethrough, muted
- Sale price: bold, gradient text option

---

### CartItem

- Rounded card with image
- Swipe-to-delete on mobile
- Animated quantity change
- Subtotal auto-recalculation animation

---

### CartSummary

- Sticky sidebar
- Animated total on change
- Gradient "Checkout" button
- Coupon code input
- Free shipping progress bar

---

### OrderStatusBadge

- Gradient badges per status
- Stepper with animated progress line
- Icon per status (package, truck, check)

---

### CategoryCard

```
+---------------------------+
|  [Background Image]       |
|  [Gradient Overlay]       |
|                           |
|     CATEGORY NAME         |
|     24 Products →         |
+---------------------------+
```

- Full-bleed image with gradient overlay
- Hover: parallax/zoom effect
- Rounded-xl

---

### PromoBar / Banner

- Full-width gradient background
- Animated text (slide/fade)
- Countdown timer
- Dismissible

---

### FilterSidebar

- Accordion sections with animated toggle
- Color swatch filter
- Price range slider
- Checkbox groups with count
- Active filter chips

---

### EmptyState

- Illustrated (or gradient icon container)
- Animated entrance
- CTA button with gradient

---

### NewsletterSignup

- Gradient background card
- Email input + subscribe button inline
- Success animation (confetti or checkmark)

---

## 2.4 Layout Components

### Container

- max-width: 1360px

### Grid

- CSS Grid with responsive auto-fit
- Masonry option for variable heights

### Sidebar Layout

- Rounded sidebar, shadow
- Animated collapse/expand

### Hero Section

- Full-width gradient background
- Centered content
- Floating product images

---

## 2.5 Storybook Organization

```
stories/
  foundations/
    Colors.stories.jsx          (swatches + gradient previews)
    Typography.stories.jsx      (font families + scale)
    Spacing.stories.jsx
    Shadows.stories.jsx         (includes glow variants)
    Gradients.stories.jsx       (all gradient combinations)
    Icons.stories.jsx
    Animations.stories.jsx      (spring configs, transitions)
  components/
    Button.stories.jsx
    Input.stories.jsx
    Select.stories.jsx
    Checkbox.stories.jsx
    Badge.stories.jsx
    Card.stories.jsx
    Modal.stories.jsx
    Table.stories.jsx
    Toast.stories.jsx
    Tabs.stories.jsx
    Avatar.stories.jsx
    Dropdown.stories.jsx
    Skeleton.stories.jsx
    Tooltip.stories.jsx
    Breadcrumb.stories.jsx
    Pagination.stories.jsx
  ecommerce/
    ProductCard.stories.jsx
    ProductGallery.stories.jsx
    QuantitySelector.stories.jsx
    PriceDisplay.stories.jsx
    CartItem.stories.jsx
    CartSummary.stories.jsx
    OrderStatusBadge.stories.jsx
    CategoryCard.stories.jsx
    PromoBar.stories.jsx
    FilterSidebar.stories.jsx
    EmptyState.stories.jsx
    NewsletterSignup.stories.jsx
    StarRating.stories.jsx
    AddressCard.stories.jsx
  layouts/
    AdminDashboard.stories.jsx
    StorefrontHome.stories.jsx
    ProductListing.stories.jsx
    CheckoutFlow.stories.jsx
  pages/
    HomePage.stories.jsx
    ProductDetailPage.stories.jsx
    CartPage.stories.jsx
    CheckoutPage.stories.jsx
    AdminProductsPage.stories.jsx
    AdminOrdersPage.stories.jsx
```

---

---

# Kit 1 vs Kit 2 — შედარება

| თვისება | Kit 1 — Minimal | Kit 2 — Bold |
|---------|-----------------|--------------|
| **ფონტი** | Inter | Plus Jakarta Sans + Outfit |
| **ფერები** | Monochrome (შავ-თეთრი) | Gradient (purple → pink → orange) |
| **Radius** | 4-8px (sharp) | 10-24px (rounded) |
| **ჩრდილები** | Subtle, minimal | Deep, glow effects |
| **ანიმაციები** | Fade, subtle transitions | Spring physics, scale, slide |
| **Hover ეფექტი** | Border/background change | Lift + glow + scale |
| **Target** | Premium, luxury, electronics | Fashion, lifestyle, streetwear |
| **მაგალითები** | Apple Store, Muji, Aesop | Nike, ASOS, Zara |
| **კომპლექსურობა** | დაბალი (სწრაფი იმპლემენტაცია) | მაღალი (ანიმაციები, gradients) |

---

# Setup / Scaffold (ორივესთვის)

```bash
# Init project
npm create vite@latest prshark-ui-kit1 -- --template react
cd prshark-ui-kit1

# Dependencies
npm install tailwindcss @tailwindcss/vite lucide-react
npm install -D storybook @storybook/react-vite

# Init Storybook
npx storybook@latest init

# Framer Motion (Kit 2 only)
npm install framer-motion

# Fonts
# Kit 1: Inter (Google Fonts)
# Kit 2: Plus Jakarta Sans + Outfit (Google Fonts)
```

### Deploy

```bash
# Build Storybook
npm run build-storybook

# Deploy to Vercel
vercel --prod

# DNS: kit1.prshark.online → CNAME → vercel project
```

---

# Development Priority

### Phase 1 — Foundations (2 days)
- Design tokens setup (colors, typography, spacing)
- Tailwind config
- Storybook theme/branding
- Colors, Typography, Spacing stories

### Phase 2 — Core Components (3 days)
- Button, Input, Select
- Checkbox, Radio, Toggle
- Badge, Card, Modal
- Table, Toast, Tabs
- Avatar, Dropdown, Tooltip

### Phase 3 — Ecommerce Components (3 days)
- ProductCard, ProductGallery
- PriceDisplay, QuantitySelector
- CartItem, OrderStatusBadge
- EmptyState, StarRating

### Phase 4 — Layouts & Pages (2 days)
- Layout compositions
- Full page examples
- Responsive testing

### Phase 5 — Polish & Deploy (1 day)
- Animation fine-tuning
- Accessibility audit
- Storybook docs
- Deploy to subdomains
