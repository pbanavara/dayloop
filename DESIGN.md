# DayLoop — Design Document

## What It Is

A zero-friction daily planning loop. Every evening you plan tomorrow. Every morning you get a reminder. Every evening you're held accountable and plan again.

No app to open. Email does the work.

---

## The Loop

```
9:30 PM  →  Email: "Plan tomorrow + yesterday's recap"
             └─ User clicks link → planning page (magic link, no login)
             └─ Text box or voice (Web Speech API) to add tasks
             └─ Tasks saved to Supabase

9:00 AM  →  Email: "Here are today's 4 tasks"
             └─ Each task has a [Done] button (one-click, no login)
             └─ Or click through to full dashboard

Throughout  →  Tasks tracked in Supabase

9:30 PM  →  Cycle repeats with yesterday's completion summary
```

---

## Zero Friction Principles

- **Email is the primary interface** — no push notifications, no app install required
- **Magic links** — emails land user directly on the right page, already authenticated
- **One-click [Done] buttons** in email — tokenized GET links, no login needed
- **Voice input** via Web Speech API — browser-native, zero cost, works on planning page
- **No friction onboarding** — just email + timezone, done

---

## Tech Stack

| Layer | Choice |
|---|---|
| Frontend + API | Next.js 15 (App Router) |
| Hosting | Vercel |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth (magic link email) |
| Scheduled Jobs | Vercel Cron |
| Email | Resend |
| Voice | Web Speech API (browser-native) |
| AI (task parsing) | Claude API (`claude-sonnet-4-6`) |

---

## Database Schema (Simplified)

```sql
-- Extends Supabase auth.users
CREATE TABLE profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users,
  timezone    TEXT NOT NULL DEFAULT 'America/New_York'
);

-- All tasks live here
CREATE TABLE tasks (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES profiles(id),
  title        TEXT NOT NULL,
  plan_date    DATE NOT NULL,        -- the day this task is FOR
  status       TEXT NOT NULL DEFAULT 'planned', -- 'planned' | 'done' | 'skipped'
  created_at   TIMESTAMPTZ DEFAULT now(),
  completed_at TIMESTAMPTZ
);

-- One-time-use tokens for email action links
CREATE TABLE action_tokens (
  token      TEXT PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id    UUID NOT NULL REFERENCES tasks(id),
  action     TEXT NOT NULL,          -- 'complete' | 'skip' | 'carry_forward'
  used_at    TIMESTAMPTZ,
  expires_at TIMESTAMPTZ DEFAULT now() + INTERVAL '24 hours'
);
```

That's it. Three tables.

---

## Email Design

### Evening Email (9:30 PM)
```
Subject: Plan tomorrow, [Name] — 2 min

Yesterday:  ✓ 3 done  ✗ 2 incomplete
  └─ "Review Q3 report"   [Carry forward] [Drop it]
  └─ "Call dentist"       [Carry forward] [Drop it]

What's on for tomorrow?
  [Open planning page →]
```

### Morning Email (9:00 AM)
```
Subject: Your 4 tasks for today

  ☐ Review Q3 report      [Done]
  ☐ Prep standup slides   [Done]
  ☐ Call dentist          [Done]
  ☐ 1:1 with Sarah        [Done]

  [Open dashboard →]
```

Action buttons are tokenized URLs:
```
GET /api/action?token=<one-time-token>
→ marks task done/skipped in Supabase
→ redirects to a "Done! ✓" confirmation page
```

---

## App Pages

```
/                    Landing + signup (just email + timezone)
/plan                Evening planning page — text/voice input
/dashboard           Today's tasks — check off, add, reorder
/api/cron/morning    Vercel Cron — sends morning emails
/api/cron/evening    Vercel Cron — sends evening emails
/api/action          Handles one-click email action tokens
/api/tasks           CRUD for tasks
/api/voice           (optional) Claude parses raw voice text → task list
```

---

## Vercel Cron

```json
{
  "crons": [
    { "path": "/api/cron/morning", "schedule": "0 * * * *" },
    { "path": "/api/cron/evening", "schedule": "30 * * * *" }
  ]
}
```

Runs every hour. Handler checks which users have their local time matching the alert time (converting UTC → user timezone).

---

## Voice Input Flow

```
User clicks mic on /plan
  → Web Speech API transcribes in real time
  → Raw text sent to /api/voice
  → Claude parses: "call dentist, finish report, lunch with mom"
      → [{ title: "Call dentist" }, { title: "Finish report" }, { title: "Lunch with mom" }]
  → Tasks rendered as editable cards
  → User confirms → saved to Supabase
```

---

## Build Phases

```
Phase 1 — Foundation
  - Next.js + Supabase setup
  - Auth (magic link)
  - DB schema + migrations
  - Profiles (email + timezone)

Phase 2 — Core Task CRUD
  - /plan page with text input
  - /dashboard with check-off
  - /api/tasks CRUD

Phase 3 — Email Loop
  - Resend integration
  - Morning + evening email templates
  - Vercel Cron jobs
  - /api/action token handler

Phase 4 — Voice + AI
  - Web Speech API on /plan
  - Claude task parsing endpoint

Phase 5 — Polish
  - Completion streaks / history
  - Carry-forward logic in evening email
  - Mobile-responsive UI
```
