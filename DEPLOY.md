# Deploy Limitrum (Cloud Run + Vercel)

This guide deploys:

- `apps/api` to **Google Cloud Run**
- `apps/web` to **Vercel**
- database to either local file (dev) or **Turso (LibSQL)** for production

## 1) Database setup (Turso recommended)

SQLite files are ephemeral on Cloud Run. For production persistence, use Turso.

1. Create a Turso database and token in the Turso dashboard/CLI.
2. Collect:
   - `DATABASE_URL` (example: `libsql://your-db-name.turso.io`)
   - `DATABASE_AUTH_TOKEN`
3. Keep these as deployment secrets/env vars.

If you are only testing locally, you can continue with `LIMITRUM_DB_PATH=./limitrum.sqlite`.

## 2) Deploy API to Google Cloud Run

From repository root:

```bash
chmod +x gcp-deploy.sh
PROJECT_ID="your-gcp-project-id" \
REGION="us-central1" \
SERVICE_NAME="limitrum-api" \
DATABASE_URL="libsql://your-db-name.turso.io" \
DATABASE_AUTH_TOKEN="your-token" \
LIMITRUM_API_URL="" \
./gcp-deploy.sh
```

Notes:

- `gcp-deploy.sh` builds the Docker image with Cloud Build.
- It deploys the image to Cloud Run.
- It prints the final Cloud Run URL at the end.

## 3) Deploy web app to Vercel

1. Import the repository in Vercel.
2. Configure project root to `apps/web`.
3. Set environment variable:
   - `NEXT_PUBLIC_LIMITRUM_API_URL=https://<your-cloud-run-url>`
4. Deploy.

For CLI-based deploy:

```bash
pnpm dlx vercel --cwd apps/web
```

## 4) Post-deploy checks

1. API health:

```bash
curl https://<your-cloud-run-url>/health
```

2. Web sandbox:

- Open your Vercel URL
- Run simulation in the sandbox
- Confirm decisions/reasons return from Cloud Run API
