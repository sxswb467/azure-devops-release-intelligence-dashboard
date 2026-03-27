# Azure DevOps Release Intelligence Dashboard

A locally testable release dashboard that demonstrates:
- React dashboard UI
- Node.js / Express service layer
- SQL-based snapshot persistence using SQL.js
- Azure DevOps integration hooks
- AI-generated release summary with mock fallback

## Features

- Project selector
- Build health and deployment status cards
- Work item and pull request rollup
- AI-generated release narrative
- Risk flag panel
- Mock mode works without any credentials

## Architecture overview

- `client/`: Vite + React frontend for the dashboard workspace
- `client/src/components/`: reusable UI building blocks for metrics, sections, and status badges
- `client/src/lib/`: frontend helpers for formatting and derived dashboard metrics
- `server/`: Express API and SQL.js persistence layer
- `server/src/seed.js`: demo snapshot data used when no live credentials are configured

## Requirements

- Node.js 22 or newer
- npm 10 or newer
- WSL/Linux shell when running from a Windows host

## Run locally

### Backend
```bash
cd server
cp .env.example .env
npm install
npm run dev
```

Backend runs at `http://localhost:4100`.

### Frontend
Open another terminal:

```bash
cd client
npm install
npm run dev
```

Frontend runs at `http://localhost:5175`.

## Build and validation

### Frontend production build
```bash
cd client
npm run build
```

### Backend syntax check
```bash
cd server
node --check src/index.js
node --check src/services.js
node --check src/db.js
node --check src/seed.js
```

## Optional live integrations

Edit `server/.env`:

```env
AZDO_ORG_URL=https://dev.azure.com/your-org
AZDO_PROJECT=your-project
AZDO_PAT=your_pat
OPENAI_API_KEY=your_key
OPENAI_MODEL=gpt-5.4-mini
```

Without those values, the app uses realistic demo data.

## Repository structure

```text
.
├── client/
│   ├── src/
│   │   ├── components/
│   │   ├── lib/
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── styles.css
│   └── vite.config.js
├── server/
│   └── src/
│       ├── db.js
│       ├── index.js
│       ├── seed.js
│       └── services.js
└── README.md
```
