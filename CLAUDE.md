# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Kawasaki Kyushoku Navi is a Next.js application that displays school lunch menus for Kawasaki City schools. The app fetches menu data from Firestore and displays it with a clean, accessible interface using the Solarized color scheme.

## Development Commands

```bash
# Development
npm run dev          # Start development server on http://localhost:3000
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Firebase
firebase deploy      # Deploy Firestore rules and indexes
firebase emulators:start  # Start local Firebase emulators

# Deployment
npx vercel --prod    # Deploy to Vercel production
```

## Architecture

### Data Flow
- **Firestore Database**: Central data store with collection `kawasaki_menus`
- **Document Structure**: `{date}-{district}` format (e.g., "2025-07-15-A")
- **Districts**: A (川崎区・中原区), B (幸区・多摩区・麻生区), C (高津区・宮前区)
- **Real-time Data**: Custom hooks (`useKawasakiMenu.js`) fetch today's menu and monthly data

### Component Architecture
- **Pages Router**: Uses Next.js pages router (not App Router)
- **Main Page**: `src/pages/index.js` - displays today's menu and monthly calendar
- **Components**: 
  - `MenuCard` - Displays individual menu with nutrition info and accessibility features
  - `Header` - Navigation with district selection and notifications
  - `StatsCards` - Monthly statistics display
  - Common components for loading, errors, and UI elements

### API Layer
- **Security**: Rate limiting (10 req/min), referrer checking, input validation
- **Endpoints**:
  - `/api/menu/today` - Today's menu for specified district
  - `/api/menu/monthly` - Monthly menu listing
- **Data Import**: Admin interface at `/admin/import` for uploading menu data

### Styling System
- **Tailwind CSS** with custom Solarized color palette
- **Colors**: Use `solarized-*` classes (e.g., `solarized-blue`, `solarized-base2`)
- **Responsive Design**: Mobile-first approach with sm/md/lg breakpoints
- **Accessibility**: ARIA labels, high contrast, semantic HTML

### Firebase Configuration
- **Security Rules**: Read-only access (write: false)
- **Environment Variables**: All Firebase config uses `NEXT_PUBLIC_*` prefix
- **JST Timezone**: Custom date handling for Japan Standard Time
- **Collection Structure**: 
  ```
  kawasaki_menus/{date-district}
  ├── date: string (YYYY-MM-DD)
  ├── district: string (A/B/C)
  ├── menu: { items: string[], description: string }
  ├── nutrition: { energy: number, protein: number }
  └── notes: string (optional learning points)
  ```

## Key Development Patterns

### Data Fetching
- Use `useKawasakiMenu` hooks for consistent data access
- Handle loading states and errors in components
- JST timezone conversion in date calculations

### Component Patterns
- Props follow `{ data, loading, error }` pattern
- Accessibility-first: proper ARIA labels and semantic markup
- Responsive design with consistent spacing and typography

### Firebase Integration
- Environment variables for all config
- Firestore emulator support for development
- Document ID pattern: `{YYYY-MM-DD}-{district}`

### Testing Color Changes
When modifying colors, test across:
- All component states (loading, error, success)
- Different menu types (today's menu, special menus, weekend display)
- All responsive breakpoints
- High contrast and accessibility requirements

## Data Import Process
Menu data is imported via admin interface using JSON files with format:
```json
{
  "date": "2025-07-15",
  "district": "A", 
  "menu": { "items": ["item1", "item2"] },
  "nutrition": { "energy": 650, "protein": 25 }
}
```