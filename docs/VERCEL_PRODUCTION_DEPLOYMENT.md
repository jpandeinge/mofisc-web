# Vercel production deployment

## Supported production boundary

Deploy the React frontend to Vercel. Keep the current FastAPI service on a
container/server runtime until its background processing has been moved to a
durable queue and scheduler.

```text
Browser
  |
  v
Vercel CDN (React static build)
  |
  v
https://api.mofisc.com (FastAPI container)
  |                         |
  v                         v
Supabase               Hugging Face endpoint (optional)
```

The frontend is a strong Vercel fit: it builds to static assets, needs no
server process, and benefits from Vercel's CDN, TLS, preview deployments, and
rollbacks.

The API is not ready for Vercel Functions because it currently:

- starts 15-minute and daily infinite asyncio loops during application
  lifespan;
- performs important classification and notification work with FastAPI
  `BackgroundTasks` after the HTTP response;
- includes database migrations as a release step;
- loads large Python/OCR/ML dependencies; and
- retains optional container-oriented Celery and Redis paths.

Request-scoped functions do not provide a permanently running process.
Moving the API unchanged risks lost jobs, duplicate schedulers, slow cold
starts, and partial statement processing.

## Cost position

Choose a Vercel plan that permits the project's intended use, then configure a
spend budget and hard limit. Pricing and plan terms change, so verify them in
the official documentation before deployment.

The cheapest reliable first production shape is normally:

1. Vercel Pro for the frontend;
2. the existing Supabase project for database/auth/realtime;
3. the FastAPI container with minimum instances set to zero where acceptable;
4. either the verified model inside that container, or a private Hugging Face
   endpoint if its cold-start/cost profile is better after measurement.

Do not assume a separate Hugging Face endpoint is cheaper. An always-on AWS
CPU `x1` is about `$24.09/month` at `$0.033/hour`, before the API host. Keeping
the 127 MB model inside a request-billed, scale-to-zero Cloud Run container can
cost less at low traffic because Cloud Run has a monthly free tier. Measure
both using production-like statement batches.

Current official pricing:

- [Vercel plans and pricing](https://vercel.com/pricing)
- [Vercel Hobby commercial-use restriction](https://vercel.com/docs/plans/hobby)
- [Hugging Face Inference Endpoint pricing](https://huggingface.co/docs/inference-endpoints/en/pricing)
- [Cloud Run pricing and free tier](https://cloud.google.com/run/pricing)
- [Supabase pricing](https://supabase.com/pricing)

## 1. Create the Vercel project

Import the `mofisc-web` Git repository and configure:

```text
Framework preset: Vite
Root directory:   repository root
Build command:    npm run build
Output directory: build
Node version:     22.x (matching CI and Docker)
Production branch: main
```

`vercel.json` already declares the framework, build, output directory, SPA
rewrite, immutable caching for hashed static assets, CSP, HSTS, clickjacking,
MIME-sniffing, referrer, and browser-permission headers.

The SPA rewrite is required so direct visits to routes such as `/sign-in`,
`/planning`, and `/settings` return `index.html` instead of a 404.

## Release checks

Before production promotion, repeat the tests, dependency audit, production
build, and browser smoke tests. Rotate and validate deployment credentials
through the relevant provider; repository checks cannot inspect live secrets.

## 2. Add frontend environment variables

Add values separately for Production and Preview:

```dotenv
REACT_APP_API_URL=https://api.mofisc.com/api
REACT_APP_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
REACT_APP_SUPABASE_ANON_KEY=YOUR_PUBLIC_OR_LEGACY_ANON_KEY
REACT_APP_FIREBASE_API_KEY=YOUR_PUBLIC_WEB_KEY
REACT_APP_FIREBASE_AUTH_DOMAIN=YOUR_PROJECT.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=YOUR_PROJECT
REACT_APP_FIREBASE_STORAGE_BUCKET=YOUR_BUCKET
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=YOUR_SENDER_ID
REACT_APP_FIREBASE_APP_ID=YOUR_APP_ID
REACT_APP_FIREBASE_VAPID_KEY=YOUR_PUBLIC_VAPID_KEY
REACT_APP_ENABLE_NOTIFICATIONS=true
REACT_APP_ENABLE_GAMIFICATION=true
GENERATE_SOURCEMAP=false
```

All `REACT_APP_*` values are public and compiled into JavaScript. Never add:

- `SUPABASE_SERVICE_ROLE_KEY`;
- database URLs or passwords;
- JWT/API signing secrets;
- Firebase Admin credentials;
- Hugging Face tokens;
- SendGrid, Twilio, Dodo webhook, or Sentry auth tokens.

Changing a Vercel environment variable requires a new deployment.

Official reference:
[Vercel environment variables](https://vercel.com/docs/environment-variables).

## 3. Configure domains and cross-service allowlists

Attach the intended production domains, for example:

```text
mofisc.com
www.mofisc.com
app.mofisc.com
```

Then update all external systems together:

- FastAPI `ALLOWED_ORIGINS` and `CORS_ORIGINS`;
- FastAPI `ALLOWED_HOSTS`;
- Supabase Auth site URL and allowed redirect URLs;
- Firebase authorized domains;
- Dodo Payments success/cancel URLs;
- Sentry allowed origins/releases; and
- the frontend CSP `connect-src` when the API origin changes.

Do not allow `*.vercel.app` in credentialed API CORS. Use a stable branch
domain for staging or explicitly allow only the preview domain being tested.

## 4. Deploy safely

1. deploy a Preview from a branch;
2. verify sign-in and OAuth callback;
3. upload one small test statement;
4. verify classification completes after the response;
5. verify Supabase Realtime notifications;
6. verify browser refresh on every protected route;
7. inspect browser console for CSP or CORS violations;
8. test Dodo checkout only in its test environment;
9. run Lighthouse and inspect bundle/network size; and
10. promote the exact tested deployment to Production.

## 5. Production controls

- Set Vercel Spend Management close to the expected base cost and enable the
  hard limit.
- Keep production and preview Supabase/Firebase projects separate if previews
  can mutate data.
- Require review before production promotion.
- Keep source maps disabled unless they are uploaded privately to Sentry.
- Enable uptime checks for both the frontend and `/health`.
- Alert when the selected transaction model is not ready.
- Test rollback for Vercel, the API image, database migration, and Hugging Face
  model revision independently.

## What must change before the API can move to Vercel

Treat a full backend move as a separate engineering project:

1. replace FastAPI `BackgroundTasks` with a durable queue and idempotent jobs;
2. replace lifespan loops with authenticated cron-triggered jobs;
3. guarantee one scheduler execution rather than one per warm function;
4. split heavy local ML dependencies out of the API bundle;
5. use serverless-safe database pooling;
6. send uploads directly to durable object storage;
7. run Alembic in a separate, single-writer release job;
8. make rate limiting shared rather than process-local;
9. load-test function duration, memory, bundle size, and cold starts; and
10. prove that a function termination cannot lose or half-apply a statement.

Until those items are complete, Vercel should replace GCP only for the
frontend—not for the FastAPI process.
