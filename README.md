# CasaHub

CasaHub — A shared home management hub to organize daily life: groceries, tasks, notes, calendar events and household reminders.

## Repository structure

```
casahub/
├── apps/
│   └── web/          # Next.js web application (main app)
├── packages/
│   └── shared/       # Shared types, schemas and utilities (placeholder)
├── docs/
│   └── design/       # Design documentation
└── public/
    └── screenshots/  # Reference screenshots
```

## Getting started

### Prerequisites

- Node.js v18+
- npm v9+

### Install dependencies

```bash
cd apps/web
npm install
```

### Run the web app

From the repository root:

```bash
npm run dev
```

Or from `apps/web` directly:

```bash
cd apps/web
npm run dev
```

The app is available at [http://localhost:3000](http://localhost:3000).

## Available scripts (from root)

| Script | Description |
|--------|-------------|
| `npm run dev` | Start the Next.js dev server |
| `npm run build` | Build the web app for production |
| `npm run lint` | Run ESLint on the web app |

## Stack

- **Framework**: Next.js (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase *(coming soon)*
- **Deployment**: Vercel *(coming soon)*
