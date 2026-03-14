---
description: Solar ERP frontend design system — UI consistency rules and patterns
---

# Solar ERP — Frontend Design Skill

## Visual Identity

The UI must evoke: **Sky · Clean Energy · Technology · Professional Engineering**

### Color Palette

- **Primary**: Sky blue (`sky-400` to `sky-600`)
- **Background**: White and slate grays
- **Accents**: Cyan, Emerald (success), Violet (maintenance)
- **⛔ NEVER use yellow**

### Gradients

- Buttons: `from-sky-500 to-sky-600`
- Stats cards: Category-specific gradients
- Background mesh: Subtle radial gradients with sky/cyan tones

### Typography

- Font: **Inter** (Google Fonts)
- Headings: `font-bold text-slate-900`
- Body: `text-sm text-slate-600`
- Muted: `text-xs text-slate-400`

## Component Patterns

### Cards
```tsx
<div className="rounded-2xl bg-white border border-slate-100 shadow-sm hover:shadow-md hover:border-sky-100 transition-all duration-300">
```

### Buttons (Primary)
```tsx
<button className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-sky-500 to-sky-600 text-white text-sm font-semibold shadow-md shadow-sky-500/20 hover:from-sky-400 hover:to-sky-500 transition-all hover:-translate-y-0.5">
```

### Status Badges
```tsx
<span className="px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-emerald-100 text-emerald-700">
```

### Inputs
```tsx
<input className="px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-sky-500/20 focus:border-sky-300 transition-all" />
```

## Animation Rules

- Use **Framer Motion** for all animations
- Use manual staggered delay: `transition={{ delay: i * 0.05 }}`
- Use `spring` transitions for interactive elements
- Use `hover:-translate-y-0.5` CSS class for card lift (avoid `whileHover`)
- Animated sidebar indicator: `layoutId="sidebar-indicator"`

## Page Structure

Every dashboard page must follow:
1. Header with title + description + action button
2. Filters/search bar
3. Content area (cards, tables, or timeline)
4. Animated entrance with `initial` → `animate`

## Glass Morphism (for overlays)

```css
background: rgba(255, 255, 255, 0.8);
backdrop-filter: blur(12px);
border: 1px solid rgba(255, 255, 255, 0.3);
```

## Spacing

- Page padding: `p-6 lg:p-8`
- Card gaps: `gap-4` or `gap-6`
- Section margins: `mb-6` or `mb-8`
