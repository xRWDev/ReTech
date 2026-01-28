# ReTech Marketplace

Production-ready used electronics marketplace with iOS-inspired glassmorphism UI, full cart/checkout flow, and admin tooling.

## Stack
- Vite + React + TypeScript
- Tailwind CSS + shadcn/ui + Framer Motion
- Supabase (Postgres + Auth)
- React Query + Zustand

## Local Setup

1) Install dependencies
```sh
npm install
```

2) Configure env
Create a `.env` file (or update the existing one) with:
```sh
VITE_SUPABASE_PROJECT_ID="your_project_ref"
VITE_SUPABASE_PUBLISHABLE_KEY="your_anon_key"
VITE_SUPABASE_URL="https://your_project_ref.supabase.co"
```

3) Apply database schema
- Using Supabase CLI:
```sh
supabase link --project-ref <your_project_ref>
supabase db push
```
- Or run SQL from `supabase/migrations/*.sql` in the Supabase SQL editor.

4) Seed demo data
Run `supabase/seed.sql` in the Supabase SQL editor (or via CLI with `supabase db reset` if running locally).

5) Start the dev server
```sh
npm run dev
```

## Admin Access
Sign up a user, then promote to admin:
```sql
insert into public.user_roles (user_id, role)
values ('<user_uuid>', 'admin');
```

## Notes
- Guest cart persists in local storage and migrates to server on login.
- Checkout uses mock payments but creates real orders and updates stock.
- Product images use public placeholder URLs; you can replace with real assets.
