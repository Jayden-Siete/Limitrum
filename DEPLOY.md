# Limitrum Production Runbook (Firebase + GCP)

This runbook is written for leadership execution and production launch.

## 1) Database (Turso)

Cloud Run is stateless. A local SQLite file is not durable in production, so use Turso (LibSQL).

### Create the production DB

1. Install Turso CLI and authenticate:

```bash
curl -sSfL https://get.tur.so/install.sh | bash
turso auth login
```

2. Create database:

```bash
turso db create limitrum-prod
```

3. Get connection URL + auth token:

```bash
turso db show limitrum-prod --url
turso db tokens create limitrum-prod
```

4. Save these credentials securely:

- `DATABASE_URL=libsql://<db-name>.turso.io`
- `DATABASE_AUTH_TOKEN=<token>`

## 2) API (Google Cloud Run)

Use the repository deploy script from root.

### Deploy with script

```bash
chmod +x gcp-deploy.sh
PROJECT_ID="your-gcp-project-id" \
REGION="us-central1" \
SERVICE_NAME="limitrum-api" \
DATABASE_URL="libsql://<db-name>.turso.io" \
DATABASE_AUTH_TOKEN="<token>" \
LIMITRUM_API_URL="" \
./gcp-deploy.sh
```

### Verify deployment

```bash
gcloud run services describe limitrum-api --region us-central1 --format="value(status.url)"
```

### Map `api.limitrum.com` in GCP Console

1. Open **Google Cloud Console** -> **Cloud Run** -> `limitrum-api`.
2. Go to **Manage Custom Domains**.
3. Add domain mapping for `api.limitrum.com`.
4. Cloud Run will display DNS records (typically CNAME/TXT or load-balancer based records).
5. Copy those records for Namecheap (step 4 below).

## 3) Web (Firebase App Hosting)

Firebase App Hosting supports Next.js App Router natively.

### Deploy from Firebase Console

1. Open **Firebase Console** -> your Firebase project.
2. Go to **App Hosting**.
3. Connect GitHub repository: `Jayden-Siete/Limitrum`.
4. Set **Root Directory** to:
   - `apps/web`
5. Set environment variable:
   - `NEXT_PUBLIC_LIMITRUM_API_URL=https://api.limitrum.com`
   - (or temporary Cloud Run URL until domain mapping is complete)
6. Trigger first deploy from the UI.

Firebase will provide the hosting domain target + DNS instructions for your custom domain.

## 4) DNS (Namecheap)

Both Cloud Run and Firebase will provide the exact records required.

### Apply records in Namecheap

1. Open **Namecheap** -> **Domain List** -> `limitrum.com` -> **Advanced DNS**.
2. Paste records exactly as provided by:
   - Cloud Run custom domain setup (`api.limitrum.com`)
   - Firebase App Hosting custom domain setup (`limitrum.com` / `www.limitrum.com`)
3. Typical record types involved:
   - `A`
   - `TXT`
   - `CNAME`
4. Wait for DNS propagation, then re-run verification in both consoles.

## Go-Live Checklist

1. API health:

```bash
curl https://api.limitrum.com/health
```

2. Open web app domain and run sandbox.
3. Confirm decisions are returned from production API.
4. Confirm Turso receives new `intent_logs`.
