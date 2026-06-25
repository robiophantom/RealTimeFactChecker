# Real-Time Fact Checker (RTFC)

Welcome to the **Real-Time Fact Checker**! This is a production-ready, full-stack SaaS application built to automatically extract and verify claims from audio, video, documents, and plain text. 

Instead of manually verifying information, you can simply upload a file, speak into your microphone, or paste a wall of text. Behind the scenes, an intelligent AI pipeline transcribes your audio, extracts objective factual claims, and uses web search agents to determine if those statements are **True**, **False**, or **Mixed**.

---

## ✨ Core Features

- **Multi-Format Processing**: Drag and drop audio files (MP3/WAV), video (MP4), PDFs, and Word documents (DOCX).
- **Blazing Fast Text Pasting**: Directly paste up to 5,000 characters into the dashboard. Text bypasses storage layers and instantly injects into the AI pipeline for maximum speed.
- **Multilingual Support**: The transcription engine automatically detects languages, offering flawless native support for English, Hindi, and dozens of other languages.
- **Auto-Saving Drafts**: Typing a long document and accidentally close the tab? No problem. The dashboard automatically caches your text locally so you never lose your work.
- **Smart AI Pipeline**: 
  - **Transcription**: Powered by Groq's insanely fast Whisper-large-v3 model.
  - **Extraction**: Uses Groq LLMs to isolate *objective* factual claims, explicitly ignoring opinions, fluff, and emotion.
  - **Verification Agent**: Searches the web to hunt down evidence and generates a confidence score for each claim.
- **Intelligent Token Management**: Uploading a massive document? The system automatically and intelligently truncates the text to maintain context without blowing past API token limits.
- **Dedicated Report Dashboards**: Every verification session gets a permanent, shareable URL detailing the executive summary and individual claim verdicts.
- **Native PDF Export**: Generate pristine, beautifully styled PDF reports of your results with a single click. No bloated backend PDF libraries—just clean native browser printing.
- **Bulk Data Management**: Select and batch-delete historical reports. Secure backend cascades ensure that when a report is deleted, all underlying files, transcripts, and AI records are completely wiped from your server to save space.
- **Admin Dashboard**: Easily manage your user base and monitor system-wide API token consumption in real time.

---

## 🛠️ Architecture & Tech Stack

This project uses a modern, scalable monorepo design, cleanly separating the client UI from the heavy-lifting AI workers.

**Frontend (`apps/web`)**
- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS & Framer Motion (for sleek micro-animations)
- **Language**: TypeScript

**Backend (`apps/api`)**
- **Framework**: FastAPI (Python)
- **Background Workers**: Dramatiq (Task Queue)
- **Document Parsing**: PyMuPDF & python-docx
- **Cache/Broker**: Redis (Dockerized)
- **Data Sharing**: Shared Docker Volumes allow the API and Worker to instantly hand off files without network latency.

**Database & Auth**
- **Provider**: Supabase (PostgreSQL, Auth, Storage)

---

## 🚀 Getting Started (Local Development)

Follow these steps to get the app running on your own machine.

### 1. Prerequisites
Make sure you have these installed:
- [Node.js](https://nodejs.org/) (v18 or higher)
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (Required for the backend workers)
- A free account on [Supabase](https://supabase.com/), [Groq](https://groq.com/), and [Tavily](https://tavily.com/).

### 2. Database Setup
1. Create a new project in Supabase.
2. Go to the **SQL Editor** in your Supabase dashboard.
3. Copy the contents of the `supabase/migrations/00001_initial_schema.sql` file from this project and run it. This will create all the necessary tables, relationships, and cascading delete rules.

### 3. Environment Variables
You need to tell the app how to connect to your services. Create two `.env` files:

**File 1: `apps/web/.env.local`**
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

**File 2: `apps/api/.env`**
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

GROQ_API_KEY=your_groq_key
TAVILY_API_KEY=your_tavily_key
```
*(Note: Never commit these keys to version control!)*

### 4. Booting Up
Open a terminal in the root of the project and start the backend using Docker:
```bash
docker-compose build
docker-compose up -d
```
*This spins up FastAPI, Redis, and the background dramatiq workers, fully linking their shared storage volumes.*

Open a **second terminal**, go into the frontend folder, and start Next.js:
```bash
cd apps/web
npm install
npm run dev
```

Finally, open your browser and head over to **[http://localhost:3000](http://localhost:3000)**!

---

## 👑 Admin Access

For security reasons, there is no public sign-up page for admins. To become an admin:
1. Go to the app and sign up for a normal user account.
2. Log into your **Supabase Dashboard** online.
3. Go to the **Table Editor** -> `users` table.
4. Find your newly created account and manually change the `role` column from `user` to `admin`.
5. The next time you log into the app, you will have access to the Admin Panel to monitor system usage!

---

## 🚢 Preparing for Production

When you are ready to put this on the internet for real users, you'll need to break the pieces out of local Docker containers:

1. **Frontend**: Deploy the `apps/web` folder to a host like Vercel. Make sure to update the `NEXT_PUBLIC_SITE_URL` environment variable to your actual domain.
2. **Backend**: Deploy the `apps/api` folder to a service like Render, AWS, or DigitalOcean. You will need to spin up *two* instances:
   - The Web Server (Start Command: `uvicorn app.main:app`)
   - The Background Worker (Start Command: `dramatiq app.workers.tasks`)
3. **Redis**: Swap out the local Docker Redis container for a managed Redis service (like Upstash or Redis Cloud), and update your backend `.env` variables to point to it.
4. **Auth**: Add your live domain to Supabase's authentication settings so logins and redirects work correctly.