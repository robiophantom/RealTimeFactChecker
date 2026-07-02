# Real-Time Fact Checker - Web Frontend

This is the frontend application for the Real-Time Fact Checker, built with Next.js 15 (App Router).

## Tech Stack
- **Framework:** Next.js 15
- **Styling:** Tailwind CSS & Framer Motion
- **Language:** TypeScript
- **Auth & Database Client:** Supabase SSR

## Getting Started

First, make sure you have installed the dependencies from the root of the project:

```bash
npm install
```

Make sure your environment variables are properly configured in `.env.local` as described in the root `README.md`.

Then, start the Next.js development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to interact with the web interface.

## Build for Production

To build the application for production:

```bash
npm run build
```

Then start the production server:

```bash
npm start
```

## Deployment

The easiest way to deploy this frontend is to use [Vercel](https://vercel.com).
Ensure you configure the following environment variables in your Vercel project settings:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `NEXT_PUBLIC_SITE_URL`
