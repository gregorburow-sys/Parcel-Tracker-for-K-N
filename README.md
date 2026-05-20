# Parcel Tracker

Real-time parcel tracking app built with [Next.js](https://nextjs.org/) (App Router),
[Appwrite](https://appwrite.io/), and [Tailwind CSS](https://tailwindcss.com/).

## Stack

- Next.js 16 (App Router, React Server Components)
- React 19
- TypeScript 6
- Tailwind CSS 4
- Appwrite Web SDK 25 (Databases + Realtime)

## Appwrite setup

You need an Appwrite project with:

1. A **database** containing two collections:
   - **Parcels** — one document per parcel. The document's `$id` is the tracking number. Custom attribute used: `parcel-name` (string).
   - **ParcelEvents** — one document per status change. Attributes used:
     - `parcelId` (string, indexed) — the `$id` of the related parcel.
     - `status` (string) — e.g. `created`, `in_transit`, `out_for_delivery`, `delivered`, `delayed`, `cancelled`, `returned`.
2. An **index** on `ParcelEvents.parcelId` so the timeline query is efficient.
3. **Collection permissions** that allow read access for the audience you want to expose the tracker to.

## Environment variables

Copy `.env.example` to `.env` and fill in your values:

```bash
cp .env.example .env
```

| Variable | Description |
| --- | --- |
| `NEXT_PUBLIC_API_ENDPOINT` | Appwrite REST endpoint, e.g. `https://cloud.appwrite.io/v1` |
| `NEXT_PUBLIC_PROJECT_ID` | Appwrite project ID |
| `NEXT_PUBLIC_DATABASE_ID` | Appwrite database ID |
| `NEXT_PUBLIC_PARCELS_ID` | Parcels collection ID |
| `NEXT_PUBLIC_PARCELEVENTS_ID` | ParcelEvents collection ID |

All variables are `NEXT_PUBLIC_*` because they are needed by the browser-side Appwrite SDK. Make sure your collection ACLs are scoped accordingly; do **not** rely on these IDs being secret.

## Running locally

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Production build |
| `npm run start` | Run the production build |
| `npm run lint` | ESLint via `next lint` |
| `npm run typecheck` | `tsc --noEmit` |

## Routes

- `/` — tracking-number search form.
- `/tracker/[id]` — live status timeline for a given parcel. Subscribes to the Appwrite Realtime channel `databases.<dbId>.collections.<parcelEventsId>.documents` and refetches on relevant events.

## Deployment

Deploy on [Vercel](https://vercel.com/new) or any platform that supports Next.js 16. Make sure the environment variables above are configured in your hosting provider.
