# SDD Proposal: frontend-overhaul

## Executive Summary
This proposal outlines a comprehensive redesign of the Solar ERP frontend to achieve a "premium/industrial" aesthetic driven by minimalism, clear visual hierarchy, and systemic consistency, alongside the creation of a public presentation Landing Page.

## Architectural Changes

1. **New Public Landing Page**:
   - Convert `src/app/page.tsx` into a highly polished, public-facing presentation page.
   - Utilize a dark-mode inspired industrial aesthetic (deep slate grays and sky-blue gradients) for maximum impact.
   - Relocate the existing Login functionality to a dedicated `src/app/login/page.tsx` route.

2. **Establish Atomic Design System**:
   Create a `src/components/ui/` directory containing strictly typed, highly reusable components that encapsulate our design token rules:
   - `Button`: `rounded-xl`, `from-sky-500 to-sky-600` gradient, integrated Framer Motion hover states.
   - `Card`: `rounded-2xl`, `bg-white`, `border-slate-100`, `shadow-sm`, and smooth lift on hover.
   - `Badge`: Status indicators using the strict background/text mappings (e.g., `emerald-100`/`emerald-700`).
   - `Input`: Standardized form fields (`bg-slate-50`, `rounded-xl`).

3. **Motion & Interaction Framework**:
   - Embed Framer Motion into the new UI components.
   - Apply staggered entrances (`initial="hidden" animate="visible"`) to list/grid layouts across all Dashboard pages.
   - Standardize `transition-all duration-300` for basic CSS hovers, reserving Framer `spring` for heavier interactive elements.

## Risks & Considerations
- **Scope Creep**: Replacing components across ALL dashboard pages (`installations`, `clients`, `inventory`, etc.) is time-consuming. We will execute this iteratively, starting with the Global Layout and main Dashboard, then upgrading sub-pages.
- **Authentication Flow**: Moving the auth check from `page.tsx` to `login/page.tsx` requires ensuring the auth guards in the `dashboard/layout.tsx` robustly handle unauthenticated states.

## Next Steps
Upon user approval of this proposal, we will proceed to generate the exact technical specifications (`sdd-spec`) and component designs (`sdd-design`), followed by task execution (`sdd-apply`).
