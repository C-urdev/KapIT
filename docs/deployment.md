# Deployment Setup

## Frontend

The production frontend domain is:

- `https://kap-it.vercel.app`

Set these variables in the Vercel project for the frontend:

- `NEXT_PUBLIC_SITE_URL=https://kap-it.vercel.app`
- `EXPRESS_API_URL=https://<your-backend-domain>/api`
- `NEXT_PUBLIC_EXPRESS_API_URL=https://<your-backend-domain>/api`

After changing environment variables, redeploy the Vercel project.

## Backend

This repo's auth and API are provided by the Express server in `server/server.js`.
Supabase is only the PostgreSQL database host. It is not the backend API domain.

Use `render.yaml` to deploy the backend on Render.

### Render step by step

1. Push this repo to GitHub if your latest backend changes are not there yet.
2. Go to Render and click `New +` -> `Blueprint`.
3. Select this GitHub repository.
4. Render will detect `render.yaml` and propose a web service named `kap-it-api`.
5. Continue the setup and fill in the secret environment variables Render asks for.
6. Create the service and wait for the first deployment to finish.
7. Open the generated Render domain and append `/api/health`.
8. If the health check returns JSON, copy the base domain for Vercel.

Expected backend health endpoint:

- `https://<your-backend-domain>/api/health`

Set these backend environment variables:

- `NODE_ENV=production`
- `DATABASE_URL=<your-supabase-postgres-connection-string>`
- `DB_SSL=true`
- `JWT_SECRET=<strong-random-secret>`
- `JWT_REFRESH_SECRET=<strong-random-secret>`
- `CLIENT_URL=https://kap-it.vercel.app`
- `NEXT_PUBLIC_SITE_URL=https://kap-it.vercel.app`
- `CORS_ALLOWED_ORIGINS=https://kap-it.vercel.app`

Optional backend variables:

- `STRIPE_SECRET_KEY`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_ENV`

### Which values to copy from your local files

From your local `.env`, copy these into Render:

- `DATABASE_URL`
- `JWT_SECRET`
- `STRIPE_SECRET_KEY` if you use Stripe
- `PAYPAL_CLIENT_ID` if you use PayPal
- `PAYPAL_CLIENT_SECRET` if you use PayPal

Create a new strong value for:

- `JWT_REFRESH_SECRET`

Set these directly in Render:

- `NODE_ENV=production`
- `DB_SSL=true`
- `CLIENT_URL=https://kap-it.vercel.app`
- `NEXT_PUBLIC_SITE_URL=https://kap-it.vercel.app`
- `CORS_ALLOWED_ORIGINS=https://kap-it.vercel.app`

### Connect the deployed backend to Vercel

After Render gives you a domain such as `https://kap-it-api.onrender.com`, add these in Vercel:

- `EXPRESS_API_URL=https://kap-it-api.onrender.com/api`
- `NEXT_PUBLIC_EXPRESS_API_URL=https://kap-it-api.onrender.com/api`
- `NEXT_PUBLIC_SITE_URL=https://kap-it.vercel.app`

## Verification

1. Open `https://<your-backend-domain>/api/health` and confirm it returns JSON.
2. Add the backend URL to the frontend Vercel env vars.
3. Redeploy the frontend.
4. Open `https://kap-it.vercel.app/auth/login`.
5. Confirm login requests no longer fail with `DNS_HOSTNAME_NOT_FOUND`.
