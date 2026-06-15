# TESTRIG-E-SHOP Project Instructions

## Architecture & Conventions
- **Framework:** Next.js (App Router, TypeScript)
- **Styling:** Tailwind CSS
- **State Management:** React Context API (CartContext)
- **Icons:** Lucide React
- **Data:** Mock products stored in `src/data/products.ts`

## Key Paths
- `src/app`: Application routes and pages.
- `src/components`: Reusable UI components.
- `src/context`: React Context providers.
- `src/types`: TypeScript interfaces.
- `src/lib`: Utility functions and helpers.
- `playwright/`: Consolidated directory for end-to-end tests, configuration, reports, and results.

## Development Workflows
- **Running locally:** `npm run dev`
- **Building:** `npm run build`
- **Linting:** `npm run lint`

## Style Guide
- Use functional components and hooks.
- Prefer Tailwind CSS utility classes.
- Ensure all components are properly typed with TypeScript.
- Follow the existing multi-step checkout pattern in `src/app/checkout/page.tsx`.
