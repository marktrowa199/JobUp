This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Philippine job search

The frontend uses SerpApi's Google Jobs engine for listings. Set `SERPAPI_API_KEY` in
`frontend/.env.local` using a key from [SerpApi](https://serpapi.com/manage-api-key).
The server sends job keywords, location, and the Philippines country code to Google Jobs.
The key is only read by the server route and must not use a `NEXT_PUBLIC_` prefix. Restart the frontend after changing it.

## Security and deployment

- Keep `DATABASE_URL`, SMTP credentials, and API keys only in server-side environment variables. Never use `NEXT_PUBLIC_` for secrets. The browser calls Next.js or FastAPI; it does not connect to the database.
- Set `BACKEND_API_URL` and the same `SESSION_COOKIE_NAME` in the frontend and backend environments. Use a private service network or TLS for the frontend-to-backend connection in production.
- Set `ENVIRONMENT=production`, a production `DATABASE_URL`, `ALLOWED_ORIGINS` to the exact frontend origin(s), and `TRUSTED_PROXY_IPS` to the private Next.js/reverse-proxy addresses in the backend environment. These list settings use JSON array syntax, for example `ALLOWED_ORIGINS=["https://jobs.example.com"]`.
- Production must be served over HTTPS; the session cookie is marked Secure in production, and the frontend sends HSTS in production.
- Ensure the reverse proxy overwrites incoming `X-Forwarded-For` headers and add the Next.js server's private address to `TRUSTED_PROXY_IPS`; rate-limit keys use this address only when the request comes from a configured trusted proxy.
- Configure the database provider's encrypted scheduled backups and point-in-time recovery where available. Keep backups outside the web root and source repository, restrict access, and test restores into an isolated database on a regular schedule.
- Login, registration, resume analysis, job search, and application writes have basic in-process rate limits. For a multi-instance production deployment, also enforce limits at a shared gateway or distributed store; process memory does not coordinate limits across instances.
- Passwords use the password hasher provided by `pwdlib`. Session cookies are HttpOnly and SameSite=Lax, Secure in production, and the database stores a SHA-256 digest of each random session token. Existing raw session rows are upgraded to digests when their owner next authenticates.
- Resume files are size/type checked, parsed in server memory, and not written to public storage. Extracted resume details remain in the page's React state and clear when the user leaves that page; the user must upload again after navigating away or reloading.

### Security checks

With two test accounts, verify that each account sees only its own `/api/applications` records and that changing an application ID in a PATCH request returns 404 for another user's record. Check that logout makes the previous cookie unusable, a wrong password and unknown email return the same login response, duplicate registration does not reveal account existence, malformed passwords are not echoed in validation responses, and repeated login/search/upload requests return 429. Confirm browser responses include the configured security headers and that a request with a different `Origin` is rejected.

This project currently has no password-reset endpoint, server-stored resume endpoint, or saved-jobs table. Rate limiting remains process-local unless a shared production gateway/store is configured. Configure and periodically test database backups with the selected database provider.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
