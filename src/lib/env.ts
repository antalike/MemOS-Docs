import { z } from 'zod';

/**
 * Client-visible config (NEXT_PUBLIC_*), inlined at `next build` time.
 * Values mirror the legacy Nuxt `envConfig/config.{dev,pre,prod}.ts` files.
 *
 * Load order follows Next.js defaults:
 *   - `next dev`  → `.env.development` (+ `.env.local`)
 *   - `next build` → `.env.production` (+ `.env.local`); use `pnpm build:pre`
 *     to bake pre values via `node --env-file=.env.pre`.
 */
const envSchema = z.object({
  NEXT_PUBLIC_APP_ENV: z.enum(['dev', 'pre', 'prod']),
  NEXT_PUBLIC_SITE_URL: z.url(),
  NEXT_PUBLIC_API_BASE: z.url(),
  NEXT_PUBLIC_DASHBOARD_API_BASE: z.url(),
  NEXT_PUBLIC_DASHBOARD_URL: z.url(),
  NEXT_PUBLIC_AUTH_COOKIE_NAME: z.string().min(1),
});

function loadEnv() {
  const raw = {
    NEXT_PUBLIC_APP_ENV: process.env.NEXT_PUBLIC_APP_ENV,
    NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
    NEXT_PUBLIC_API_BASE: process.env.NEXT_PUBLIC_API_BASE,
    NEXT_PUBLIC_DASHBOARD_API_BASE: process.env.NEXT_PUBLIC_DASHBOARD_API_BASE,
    NEXT_PUBLIC_DASHBOARD_URL: process.env.NEXT_PUBLIC_DASHBOARD_URL,
    NEXT_PUBLIC_AUTH_COOKIE_NAME: process.env.NEXT_PUBLIC_AUTH_COOKIE_NAME,
  };

  const result = envSchema.safeParse(raw);
  if (!result.success) {
    const missing = result.error.issues
      .map((issue) => issue.path.join('.'))
      .join(', ');
    throw new Error(
      `Missing or invalid NEXT_PUBLIC_* environment variables: ${missing}. ` +
        'See fuma/.env.example and ensure .env.development / .env.production exist.',
    );
  }
  return result.data;
}

export const env = loadEnv();

export const runtimeConfig = {
  apiBase: env.NEXT_PUBLIC_API_BASE,
  dashboardApiBase: env.NEXT_PUBLIC_DASHBOARD_API_BASE,
  dashboardUrl: env.NEXT_PUBLIC_DASHBOARD_URL,
  authCookieName: env.NEXT_PUBLIC_AUTH_COOKIE_NAME,
} as const;

export const siteUrl = env.NEXT_PUBLIC_SITE_URL;
export const appEnv = env.NEXT_PUBLIC_APP_ENV;
