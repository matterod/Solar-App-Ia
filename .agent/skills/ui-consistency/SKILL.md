---
description: Solar ERP UI consistency rules — ensure all pages follow the design system
---

# Solar ERP — UI Consistency Skill

## Golden Rules

1. **Sky blue is the primary color**. Never use yellow.
2. **All cards use `rounded-2xl`** with `border-slate-100` and `shadow-sm`
3. **All buttons use `rounded-xl`** with gradient backgrounds
4. **All inputs use `rounded-xl`** with `bg-slate-50` backgrounds
5. **All pages have animated entrance** using Framer Motion
6. **All hover states use smooth transitions** (`transition-all duration-300`)

## Checklist for Every New Page

- [ ] Page header with `text-2xl font-bold` title
- [ ] Subtitle in `text-sm text-slate-500`
- [ ] Action button in top-right (if applicable)
- [ ] `max-w-[1600px] mx-auto` container
- [ ] `p-6 lg:p-8` padding
- [ ] Framer Motion `initial` → `animate` on main elements
- [ ] Staggered animation for lists/grids
- [ ] Hover effects on interactive elements
- [ ] Status badges with color coding
- [ ] Responsive grid layout

## Status Color Mapping

| Status             | Background       | Text               |
| ------------------ | ---------------- | ------------------ |
| completed          | `bg-emerald-100` | `text-emerald-700` |
| in_progress        | `bg-sky-100`     | `text-sky-700`     |
| pending            | `bg-slate-100`   | `text-slate-600`   |
| maintenance        | `bg-violet-100`  | `text-violet-700`  |
| cancelled/inactive | `bg-red-100`     | `text-red-700`     |

## Priority Color Mapping

| Priority | Color                         |
| -------- | ----------------------------- |
| urgent   | `bg-red-500` (animated pulse) |
| high     | `bg-orange-500`               |
| medium   | `bg-sky-500`                  |
| low      | `bg-slate-300`                |

## Font Sizes

| Element        | Size                                                 |
| -------------- | ---------------------------------------------------- |
| Page title     | `text-2xl`                                           |
| Section titles | `text-base font-semibold`                            |
| Card titles    | `text-sm font-semibold` or `text-base font-semibold` |
| Body text      | `text-sm`                                            |
| Labels/meta    | `text-xs`                                            |
| Badges         | `text-[11px]`                                        |

## Shadows

- Cards at rest: `shadow-sm`
- Cards on hover: `shadow-md` or `shadow-lg`
- Buttons: `shadow-md shadow-sky-500/20`
- No shadow on inputs until focused
