# Parcel Tracker Application

A real-time parcel tracking application built with
[Next.js 14 (App Router)](https://nextjs.org/),
[Appwrite](https://appwrite.io/), and
[Tailwind CSS](https://tailwindcss.com/).

## Project structure

```
app/
  layout.tsx                  Root layout + global metadata
  page.tsx                    Home page (Server Component) with <SearchForm />
  globals.css                 Global styles (Tailwind directives)
  error.tsx                   Root error boundary
  loading.tsx                 Root loading UI
  tracker/[trackingId]/
    page.tsx                  Dynamic tracker route
    error.tsx                 Route-specific error boundary
  api/hello/route.ts          Sample Route Handler (replaces pages/api/hello.js)
components/
  SearchForm.tsx              Client Component – tracking number search
  ParcelTracker.tsx           Client Component – parcel info + realtime events
hooks/
  useParcelTracking.ts        Fetch a single parcel by tracking ID
  useParcelEvents.ts          List + subscribe to ParcelEvents in realtime
lib/
  appwrite.ts                 Appwrite Client + Databases singletons
  config.ts                   Environment variable mapping
  types.ts                    Shared TypeScript types
```

## Setting up the project on Appwrite

  - Create a database and collections (Parcels, ParcelEvents).
  - Add attributes to the collections.
  - Create an Index to query ParcelEvents by `parcelId`.
  - Set the appropriate collection permissions for your client.

## Environment variables

The app reads the following `NEXT_PUBLIC_*` variables (see `.env`):

- `NEXT_PUBLIC_API_ENDPOINT` – Appwrite API endpoint URL
- `NEXT_PUBLIC_PROJECT_ID` – Appwrite project ID
- `NEXT_PUBLIC_DATABASE_ID` – Database ID
- `NEXT_PUBLIC_PARCELS_ID` – Parcels collection ID
- `NEXT_PUBLIC_PARCELEVENTS_ID` – ParcelEvents collection ID

## Scripts

```bash
npm install      # install dependencies
npm run dev      # start the dev server (http://localhost:3000)
npm run build    # production build
npm run start    # serve the production build
npm run lint     # ESLint via next lint
npm run typecheck # TypeScript --noEmit check
```

## Deploy on Vercel

The easiest way to deploy a Next.js app is the
[Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme).
See the [Next.js deployment docs](https://nextjs.org/docs/deployment) for more.
