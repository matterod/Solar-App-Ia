# SDD Design: frontend-overhaul

## Visual Identity System

### Color Application
- **Base Background**: `bg-slate-50` for the dashboard body, allowing white cards to pop.
- **Card Background**: `bg-white` with `border-slate-100`.
- **Primary Action (Call to Action)**: `bg-gradient-to-r from-sky-500 to-sky-600`.
- **Text Hierarchy**:
  - Title: `text-slate-900 font-bold text-2xl`
  - Subtitle/Muted: `text-slate-500 text-sm`
  - Body: `text-slate-600`

### Micro-interactions & Physics
- Buttons: `hover:-translate-y-0.5 transition-all duration-300` + `shadow-md shadow-sky-500/20`.
- Cards: `transition-all duration-300 hover:shadow-md hover:border-sky-100`.
- Page Mounts:
  ```tsx
  initial={{ opacity: 0, y: 10 }}
  animate={{ opacity: 1, y: 0 }}
  ```

## Page Blueprints

### 1. Landing Page (`app/page.tsx`)
- **Hero Section**: Dark gradient background (`from-slate-900 via-sky-950 to-slate-900`).
- **Typography**: Large white headers, `text-cyan-400` accents.
- **Graphic**: Floating UI cards showing abstract metrics (glassmorphism effect).
- **Navigation**: Simple top bar with Logo and "Ingresar" button routing to `/login`.

### 2. Login Page (`app/login/page.tsx`)
- Retain the current design from the old `page.tsx` but simplified.
- Centered card on a `bg-slate-50` background.

### 3. Dashboard Screens
- **Header**: Left: Title + Subtitle. Right: Primary Action Button.
- **Body**: Grid layouts (`grid-cols-1 md:grid-cols-2 lg:grid-cols-3` or `4`). All content housed in `Card` components.
