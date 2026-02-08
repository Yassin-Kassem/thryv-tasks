# Thryv Tasks

Collaborative task manager for tracking fitness app development progress. Built with React + Supabase with real-time sync across all team members.

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` with your Supabase credentials:
   ```
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. Start the dev server:
   ```bash
   npm run dev
   ```

## Deploy to Vercel

1. Push this repo to GitHub
2. Import the repository in [Vercel](https://vercel.com)
3. Add environment variables in the Vercel dashboard:
   - `VITE_SUPABASE_URL` — your Supabase project URL
   - `VITE_SUPABASE_ANON_KEY` — your Supabase anon/publishable key
4. Deploy — Vercel auto-detects Vite and builds with `npm run build`

## Supabase Setup

The database requires two tables (`categories` and `tasks`) with RLS enabled and the `tasks` table added to the `supabase_realtime` publication. See the migration in the Supabase dashboard for the full schema.

## Tech Stack

- **Frontend:** React 18 + Vite
- **Backend:** Supabase (Postgres + Realtime)
- **Deployment:** Vercel
