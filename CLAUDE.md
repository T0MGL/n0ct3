# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

NOCTE is a landing page for red-tinted blue-light blocking glasses designed to improve sleep quality. This is a React-based single-page application built with Vite, TypeScript, and shadcn-ui components.

## Commands

### Development
```bash
npm run dev        # Start development server on http://localhost:8080
npm run build      # Production build
npm run build:dev  # Development build
npm run lint       # Run ESLint
npm run preview    # Preview production build lo
cally
```

### Package Manager
This project uses npm. There's also a `bun.lockb` file present, indicating Bun may have been used, but npm should be preferred based on the README.

## Architecture

### Tech Stack
- **Build Tool**: Vite (with SWC for React)
- **Framework**: React 18 with TypeScript
- **Router**: React Router DOM
- **UI Components**: shadcn-ui (Radix UI primitives)
- **Styling**: Tailwind CSS with CSS variables for theming
- **State Management**: TanStack Query (React Query)
- **Form Handling**: React Hook Form with Zod validation
- **Icons**: Lucide React

### Application Structure

**Entry Point**: `src/main.tsx` → `src/App.tsx`

**Routing**: Single-page app with catch-all 404 handling in App.tsx. Add new routes ABOVE the catch-all "*" route.

**Page Structure**:
- Main landing page: `src/pages/Index.tsx`
- 404 page: `src/pages/NotFound.tsx`

The Index page is composed of modular section components that render in sequence:
1. HeroSection - Main hero with CTA and countdown timer
2. ProductGallery - Product images showcase
3. BenefitsSection - Product benefits
4. ComparisonTable - Product comparison
5. TestimonialsSection - Customer testimonials
6. FAQSection - Frequently asked questions
7. GuaranteeSection - Money-back guarantee CTA

### Import Aliases

Path alias `@/` is configured to resolve to `src/`:
- `@/components` → `src/components`
- `@/lib/utils` → `src/lib/utils`
- `@/hooks` → `src/hooks`
- `@/assets` → `src/assets`

### Component Organization

**UI Components** (`src/components/ui/`): shadcn-ui components - these are auto-generated and should not be manually edited unless necessary. Add new shadcn components using the appropriate CLI commands.

**Feature Components** (`src/components/`): Custom business logic components like HeroSection, ProductGallery, BenefitsSection, etc.

**Utilities** (`src/lib/utils.ts`): Contains `cn()` helper for merging Tailwind classes with clsx and tailwind-merge.

### Styling Patterns

- Uses Tailwind CSS with a mobile-first responsive approach
- Color scheme: Dark theme (black background) with red/primary accent
- Custom Tailwind configuration in `tailwind.config.ts`
- CSS variables defined for theme colors (see `src/index.css`)
- Responsive breakpoints: sm, md, lg (follow Tailwind defaults)

### shadcn-ui Configuration

Configuration in `components.json`:
- Style: default
- Base color: slate
- CSS variables enabled
- TypeScript enabled
- No RSC (React Server Components)

## Development Workflow

When adding new features:
1. Create new section components in `src/components/` if needed
2. Import and use UI components from `src/components/ui/`
3. Add new routes in `src/App.tsx` ABOVE the "*" catch-all route
4. Use the `cn()` utility for conditional className merging
5. Follow the existing responsive design patterns (mobile-first)
6. Use Framer Motion for animations (fade-in, slide-up with stagger)
7. Use Heroicons for all iconography (not emojis or Lucide)

## Design System

**Colors** (Exact hex values in CSS variables):
- Primary Red: `#EF4444` (HSL: 0 91% 59%)
- Gold/Accent: `#D4AF37` (HSL: 43 74% 52%)
- Background: `#0F172A` (HSL: 222 47% 11%)
- Secondary: `#1F2937` (HSL: 217 33% 17%)

**Spacing Scale**:
- xs: 8px
- sm: 12px
- md: 16px
- lg: 24px
- xl: 32px

**Border Radius**: Maximum 8px for professional look (no extreme rounding)

**Shadows**: Use realistic shadows, not bright glows
- Cards: `shadow-[0_4px_6px_rgba(0,0,0,0.1)]`
- Hover: `hover:shadow-lg`

**Buttons**:
- Professional gradients: `from-[#EF4444] to-[#DC2626]`
- Smooth 300ms transitions
- Subtle shadows, not neon glows
- Active state: `active:scale-[0.98]`

**Cards**:
- Border: `border-gold/30` (1px with 30% opacity)
- Background: `bg-secondary/30` with backdrop blur
- Hover: Transition shadow only (duration-300)

**Typography**:
- Line height: 1.6 for body text, 1.2 for headings
- Letter spacing: 0.02em
- Bold for headings, medium for body

**Animations** (Framer Motion):
- Fade-in + slide-up: `y: 20 → 0`, `duration: 0.6s`
- Stagger children: `200ms` delay between items
- Use `whileInView` with `viewport={{ once: true }}`
- Easing: `easeOut`

**Icons**:
- Use `@heroicons/react/24/outline` for line icons
- Use `@heroicons/react/24/solid` for filled icons (stars, etc.)
- Consistent size: `w-6 h-6` for most contexts
- Colors: Primary red or Gold accent

## Important Notes

- Development server runs on port 8080 (not the default Vite 5173)
- Uses SWC for faster compilation
- Professional design: NO bright neon glows, NO extreme border-radius, NO emojis
- All animations should be subtle and smooth (600ms max duration)
