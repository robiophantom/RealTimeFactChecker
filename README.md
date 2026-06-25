# Real-Time Fact Checker (RTFC)

Welcome to the **Real-Time Fact Checker**! This is a production-grade, full-stack SaaS application designed to take in audio, video, or documents and automatically fact-check the claims made within them. 

Instead of manually verifying information, you can simply upload a file or speak directly into your microphone. Behind the scenes, a small army of AI agents will transcribe your audio, extract the objective claims, and scour the internet for evidence to tell you if the statements are **True**, **False**, or **Partially True**.

---

## ✨ Features

- **Multi-Format Uploads**: Drag and drop audio files, videos, PDFs, or Word documents.
- **Live Microphone Streaming**: Speak directly into your browser and get real-time verifications.
- **AI-Powered Pipeline**: 
  - **Transcription**: Uses Groq's Whisper API for lightning-fast speech-to-text.
  - **Extraction**: Uses Groq LLMs to pull out *only* objective factual claims (ignoring opinions and emotions).
  - **Verification Agent**: Uses the Tavily Search API to hunt down evidence across the web and generate a confidence score.
- **Real-Time UI**: Watch claims get verified live on your screen as the background workers process them, powered by Supabase Realtime.
- **Admin Dashboard**: Manage users and monitor system-wide API token usage and verification statistics.

---

## 🛠️ Tech Stack

This project is built using a modern, scalable monorepo architecture:

**Frontend (`apps/web`)**
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS & Framer Motion (for sleek animations)
- **Language**: TypeScript

**Backend (`apps/api`)**
- **Framework**: FastAPI (Python)
- **Background Workers**: Dramatiq (Task Queue)
- **Cache/Broker**: Redis (Dockerized)

**Database & Auth**
- **Provider**: Supabase (PostgreSQL, Auth, Realtime, Storage)

---

## 🚀 Getting Started (Local Development)

Follow these steps to get the app running on your own machine.

### 1. Prerequisites
Make sure you have these installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Required for the backend)
- A free account on [Supabase](https://supabase.com/), [Groq](https://groq.com/), and [Tavily](https://tavily.com/).

### 2. Database Setup
1. Create a new project in Supabase.
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of the `supabase/migrations/00001_initial_schema.sql` file from this project and run it. This will create all the necessary tables and security rules.

### 3. Environment Variables
You need to tell the app how to connect to your services. Create two `.env` files:

**File 1: `apps/web/.env.local`**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**File 2: `apps/api/.env`**
```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-keep-this-secret

GROQ_API_KEY=gsk_your_groq_key
TAVILY_API_KEY=tvly-your_tavily_key
```

### 4. Booting Up
Open a terminal in the root of the project and start the backend using Docker:
```bash
docker-compose up --build
```
*This starts FastAPI, Redis, and your background workers.*

Open a **second terminal**, go into the frontend folder, and start Next.js:
```bash
cd apps/web
npm install
npm run dev
```

Finally, open your browser and go to **[http://localhost:3000](http://localhost:3000)**!

---

## 👑 How to Access the Admin Dashboard

For security reasons, there is no public sign-up page for admins. To become an admin:
1. Go to `http://localhost:3000/login` and sign up for a normal user account.
2. Log into your **Supabase Dashboard** online.
3. Go to the **Table Editor** -> `users` table.
4. Find your newly created account and manually change the `role` column from `user` to `admin`.
5. The next time you log into the app, you will have access to the Admin Panel!

---

## 🚢 Preparing for Production

When you are ready to put this on the internet for real users:

1. **Frontend**: Deploy `apps/web` to [Vercel](https://vercel.com). Make sure to update the `NEXT_PUBLIC_SITE_URL` environment variable to your new `.com` domain.
2. **Backend**: Deploy the `apps/api/Dockerfile` to a service like Render, AWS, or DigitalOcean. You will need to spin up *two* instances:
   - One for the web server (Start Command: `uvicorn app.main:app`)
   - One for the background workers (Start Command: `dramatiq app.workers.tasks`)
3. **Redis**: Use a managed Redis service (like Upstash) instead of Docker, and update your backend `.env` variables to point to it.
4. **Auth**: Add your live domain to Supabase's authentication settings so Google OAuth and email links work correctly.

---
*Built with ❤️ and AI.*
