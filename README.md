# Parcel Tracker Application

This is a application built with [Next.js](https://nextjs.org/), [Appwrite](https://appwrite.io/), and [Tailwind CSS](https://tailwindcss.com/) for tracking parcels in **real-time**.

## Setting up the project on Appwrite
This involves the following:
  - Creating a database and collections.
  - Adding attributes to the collections.  
  - Creating an Index to query the data from the collection.
  - Setting Collection persmissions
  
## Setting Environment Variables
Building the project required the use of some environment variables, remember to include in your cloned project. They include:
- API Endpoint URL
- Database ID
- Parcels Collection ID
- Project ID

A complete list with documentation lives in [`.env.example`](./.env.example).
Copy it to `.env` and fill in the values for your environment. `.env`
itself is git-ignored.

## Running the Project
To run the project in development environment, you can run the following commands:

```bash
npm run dev
# or
yarn dev
```

## Viewing the Project 
To view the project on your browser, use this URL - [http://localhost:3000](http://localhost:3000).

You can start editing the page by modifying `pages/index.js`. The page auto-updates as you edit the file.

[API routes](https://nextjs.org/docs/api-routes/introduction) can be accessed on [http://localhost:3000/api/hello](http://localhost:3000/api/hello). This endpoint can be edited in `pages/api/hello.js`.

The `pages/api` directory is mapped to `/api/*`. Files in this directory are treated as [API routes](https://nextjs.org/docs/api-routes/introduction) instead of React pages.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.

## Security

The application ships with a set of defensive controls to limit the
blast radius of abuse and DDoS attacks. See [`docs/monitoring.md`](./docs/monitoring.md)
for the full operational runbook.

### Rate limiting

`middleware.js` enforces per-IP rate limits at the edge:

* **Lookup routes** (`/tracker`, `/api/parcel*`): 10 requests / minute / IP.
* **General routes**: 30 requests / minute / IP.
* `/api/health` and `/api/metrics` are exempt so probes are not throttled.

Responses include `X-RateLimit-Limit`, `X-RateLimit-Remaining`,
`X-RateLimit-Reset`, and `X-RateLimit-Scope` headers. When the limit is
crossed the middleware returns `429 Too Many Requests` with a
`Retry-After` header.

The default store is an in-memory `Map`. For multi-instance deployments
swap it out for a Redis-backed store — see [`docs/monitoring.md`](./docs/monitoring.md#rate-limit-store).

### Input validation

Tracking numbers are validated client- and server-side via
[`utils/validation.js`](./utils/validation.js):

* Length 8–20 characters
* Allowed characters: `A–Z`, `a–z`, `0–9`, `-`, `_`
* Whitespace is trimmed before validation

Invalid input never reaches Appwrite; users see an inline error and the
request budget for the IP is preserved.

### Security headers

`next.config.js` sets the standard hardening headers on every response:

* `X-Frame-Options: DENY`
* `X-Content-Type-Options: nosniff`
* `X-XSS-Protection: 1; mode=block`
* `Referrer-Policy: strict-origin-when-cross-origin`
* `Permissions-Policy` denying camera, microphone, geolocation, FLoC
* A baseline `Content-Security-Policy` that allows Appwrite over `https`
  and `wss`

### Observability

* [`/api/health`](./pages/api/health.js) — readiness probe with config
  and Appwrite reachability checks. Returns `503` when degraded.
* [`/api/metrics`](./pages/api/metrics.js) — Prometheus text format.
* [`utils/logger.js`](./utils/logger.js) — structured JSON logger used
  by every error path. Set `LOG_LEVEL=debug` to enable verbose output.

### Load testing

[`scripts/load-test.js`](./scripts/load-test.js) is a k6 script that
runs the five rollback scenarios (baseline, normal, spike, sustained,
WebSocket stress) documented in [`docs/monitoring.md`](./docs/monitoring.md).
Run it against staging before any release:

```bash
BASE_URL=https://staging.example.com k6 run scripts/load-test.js
```

### Incident response

See [`docs/monitoring.md#recovery-procedures`](./docs/monitoring.md#recovery-procedures)
for the on-call runbook covering sustained 5xx, DDoS, WebSocket growth,
and false-positive rate-limit scenarios.
