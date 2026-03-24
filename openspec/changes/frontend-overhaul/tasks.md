# SDD Tasks: frontend-overhaul

## Phase 1: Foundation (The System)
1. **Setup Utilities**:
   - Create `src/lib/utils.ts` with `clsx` and `tailwind-merge`.
   - Install `clsx` and `tailwind-merge` if missing.
2. **Build Atomic Components**:
   - Create `src/components/ui/Button.tsx`.
   - Create `src/components/ui/Card.tsx` and related sub-components (`CardHeader`, `CardTitle`, `CardContent`).
   - Create `src/components/ui/Badge.tsx`.
   - Create `src/components/ui/Input.tsx`.
   - Create `src/components/ui/PageHeader.tsx`.

## Phase 2: Route Restructuring & Landing
3. **Move Login**:
   - Move `app/page.tsx` to `app/login/page.tsx`.
   - Update any `/page` imports or path references if needed.
4. **Create New Landing**:
   - Develop the new `app/page.tsx` utilizing the dark industrial aesthetic and glassmorphism.

## Phase 3: Dashboard Rollout (Iterative)
5. **Update Layout**:
   - Modify `src/app/dashboard/layout.tsx` to ensure `p-6 lg:p-8` padding and incorporate a global page transition wrapper if appropriate.
6. **Apply to Core Pages**:
   - Migrate `src/app/dashboard/page.tsx` (Main Dashboard) to use `Card`, `Badge`, `PageHeader`. Add Framer animations.
   - Migrate `src/app/dashboard/installations/page.tsx`.
   - Migrate `src/app/dashboard/clients/page.tsx`.

## Phase 4: Final Polish
7. **Verify Interactions**: Test all hover states and stagger animations. Ensure rendering performance is maintained.
