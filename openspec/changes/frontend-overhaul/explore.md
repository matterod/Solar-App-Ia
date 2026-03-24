# SDD Exploration: frontend-overhaul

## Current State Analysis
A thorough review of the `frontend/src` directory reveals the following structural issues, confirming the user's assessment:

- **Lack of Componentization**: The `src/components/` folder only contains `InvitationBanner.tsx` and `Sidebar.tsx`. There is no Atomic Design system (no reusable Button, Card, Input, or Badge components).
- **Ad-Hoc Styling**: Pages in `src/app/dashboard/*` are using raw HTML tags (`div`, `button`, `span`) with inline Tailwind classes repeated constantly, leading to zero systemic consistency.
- **Missing Landing Page**: The current entry point `src/app/page.tsx` acts purely as a login portal (a two-column layout with Google auth). There is no "presentation page" for new users to understand what Solar ERP is before authenticating.
- **Absence of Micro-interactions**: While Framer Motion is installed (imported in page.tsx), it is barely utilized. The UI feels static rather than "alive/tactile".
- **Color Palette Spread**: The primary color rules (Sky blue, no yellow) are not enforced systematically via CSS variables or a central theme configuration.

## Conclusion
A full systemic overhaul is necessary. We must transition from page-level styling to a Design System (Tokens -> Atomic Components -> Layouts -> Pages).
