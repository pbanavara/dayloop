# DayLoop

A zero-friction daily planning loop. Plan tomorrow each evening, get a morning email with one-click done buttons. No app to install — email is the interface.

## The Loop

```
9:30 PM  →  Evening email: yesterday's recap + planning link
             └─ Click → planning page (magic link, no password)
             └─ Add tasks via text or voice
             └─ Tasks saved to Supabase

7:30 AM  →  Morning email: today's tasks
             └─ One-click [Done] button per task
             └─ Or open the dashboard
```

## Stack

| Layer | Choice |
|---|---|
| Frontend + API | Next.js 16 (App Router) |
| Database + Auth | Supabase |
| Email | Resend |
| AI task parsing | OpenAI gpt-5-mini |
| Voice input | Web Speech API |
| Hosting + Cron | Vercel (Hobby plan) |

## Getting Started

### 1. Clone and install

```bash
git clone https://github.com/pbanavara/dayloop.git
cd dayloop
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
RESEND_API_KEY=
OPENAI_API_KEY=
NEXT_PUBLIC_APP_URL=http://localhost:3000
CRON_SECRET=any-random-string
```

### 3. Set up Supabase

Run the migration in your Supabase project's SQL editor:

```
supabase/migrations/001_initial_schema.sql
```

In Supabase → Authentication → URL Configuration:
- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: `http://localhost:3000/auth/callback`

### 4. Run locally

```bash
npm run dev
```

## Deployment (Vercel)

1. Push to GitHub and import the repo on [vercel.com/new](https://vercel.com/new)
2. Set all environment variables in the Vercel dashboard
3. Set `NEXT_PUBLIC_APP_URL` to your Vercel domain
4. Update Supabase redirect URLs to your production domain

Cron jobs run daily — no Pro plan required:
- `30 15 * * *` UTC → Morning email (7:30 AM PST)
- `30 5 * * *` UTC → Evening email (9:30 PM PST)

## Project Structure

```
├── emails/                  # React Email templates
│   ├── MorningEmail.tsx
│   └── EveningEmail.tsx
├── src/
│   ├── app/
│   │   ├── page.tsx          # Landing + signup
│   │   ├── plan/             # Evening planning page
│   │   ├── dashboard/        # Today's tasks
│   │   ├── action-confirm/   # One-click email action result
│   │   └── api/
│   │       ├── tasks/        # Task CRUD
│   │       ├── action/       # Email token handler (public)
│   │       ├── voice/        # Voice → OpenAI → tasks
│   │       ├── profile/      # Timezone update
│   │       └── cron/         # Morning + evening email jobs
│   ├── components/
│   ├── hooks/
│   └── lib/
└── supabase/migrations/
```
