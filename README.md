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
