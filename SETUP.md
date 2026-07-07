# StyleAI — Setup & Launch Guide

This app is now a **static frontend (GitHub Pages) backed by Supabase**
(auth + database + storage). Supabase is accessed directly from the
browser via its JS SDK, so no Node server is needed — GitHub Pages can
host it as-is.

## 1. Create your Supabase project
1. Go to https://supabase.com → New project (free tier is fine to start).
2. Wait for it to finish provisioning.

## 2. Run the schema
1. Open your project → **SQL Editor** → New query.
2. Paste the entire contents of `supabase/schema.sql` and run it.
   This creates the `profiles`, `wardrobe`, `saved_outfits`,
   `calendar_entries` tables with Row Level Security, a trigger that
   auto-creates a profile on signup, and a test-mode subscription
   activator.

## 3. Create the Storage bucket
1. **Storage** → New bucket → name it exactly `avatars` → toggle
   **Public bucket** ON → Create.
   (Body/profile photos are uploaded here.)

## 4. Turn off email confirmation
Because the app only asks for a username (not a real email), it signs
people up with a synthetic `username@styleai.local` address that can't
receive mail.
1. **Authentication → Providers → Email** → turn **OFF** "Confirm email".

## 5. Connect the frontend
1. **Project Settings → API** → copy the **Project URL** and the
   **anon public** key.
2. Open `js/supabase-client.js` and paste them in:
   ```js
   const SUPABASE_URL = 'https://xxxxx.supabase.co';
   const SUPABASE_ANON_KEY = 'eyJ...';
   ```

## 6. Deploy to GitHub Pages
1. Push this whole folder to a GitHub repo (keep the folder structure —
   `index.html` must stay at the repo root, per GitHub Pages' requirement).
2. Repo → **Settings → Pages → Source → Deploy from branch → main / root**.
3. Open `https://yourusername.github.io/reponame/`.

## 7. Test it
- Click **Demo Login** — this seeds and signs into a shared demo account.
- Register a real account, add a wardrobe item, refresh the page, and
  confirm the item is still there (proof it's reading from Supabase,
  not just the browser).
- Open the same account in a different browser/incognito window — your
  wardrobe should follow you. That's the core thing localStorage could
  never do.

---

## Free trial & the paywall

Every new signup gets a **7-day free trial** (`profiles.trial_ends_at`).
After that, every page except Profile redirects to `pages/upgrade.html`
until the person subscribes. The demo account never sees the paywall.

Right now, the **Subscribe** button calls a Supabase function called
`mock_activate_subscription()` that flips a switch with **no real
payment** — this is intentionally there so you can build and demo the
whole flow before your payment gateway is ready. Anyone who knows to
call that function from the browser console could unlock a free plan,
so:

> ⚠️ **Do not announce this publicly or take real signups at scale until
> you replace the mock activation with real, server-verified billing.**

## Going live with real billing (Razorpay)

Razorpay is the standard choice for INR/UPI recurring billing in India
(Stripe doesn't support Indian recurring payments well). Rough steps:

1. Create a Razorpay account and complete KYC (needed before you can
   accept live payments) at https://razorpay.com.
2. In Razorpay Dashboard, create a **Plan** (₹99/month) if using
   Subscriptions, or just a one-time **Order** per billing cycle.
3. Add the Razorpay Checkout script to `pages/upgrade.html` and open it
   from `startCheckout()` in `js/upgrade.js` — the commented-out block
   in that file shows where this goes.
4. **Critical:** never mark a user as subscribed directly from the
   browser after checkout. Payments must be verified server-side.
   Supabase gives you **Edge Functions** for exactly this — write one
   that:
   - Receives Razorpay's webhook (or the payment id from the client),
   - Verifies the signature using your Razorpay **key secret** (never
     put this in frontend code),
   - Only then updates `profiles.subscription_active` /
     `subscription_expires_at` using the Supabase **service role** key.
5. Once that Edge Function is live, delete `mock_activate_subscription`
   from the database (`drop function public.mock_activate_subscription;`)
   so the free-unlock loophole is gone.

## Troubleshooting "can't log in"

The app now shows a clear on-screen message instead of silently
bouncing back to the login page. The most common causes, in order:

1. **`js/supabase-client.js` still has placeholder values** — the app
   will say so directly. Fill in your real URL/key (step 5).
2. **"Confirm email" is still ON** in Supabase (it's on by default) —
   registering or using Demo Login will create the account but *not*
   sign you in, since Supabase is waiting for an email confirmation
   that can never arrive (the address is a fake `@styleai.local` one).
   Turn it off per step 4, then try again.
3. **`supabase/schema.sql` wasn't run**, or was only partially run — the
   error banner will say "Could not load your account" with the
   underlying database error. Re-run the SQL file.
4. **Wrong Storage bucket name** — photo uploads need a bucket named
   exactly `avatars`, set to Public.

If you still see something confusing, open the browser console
(F12 → Console) — every failure is logged there with detail beyond
what's shown on screen.



- **Login is username-based**, mapped internally to a fake email
  address. Password-reset-by-email won't work until you collect real
  emails at signup — fine for an MVP, worth revisiting before scaling.
- **Deleting an account** removes the person's data and profile, but
  fully deleting the underlying Supabase Auth user needs the service
  role key (server-side / Edge Function only) — it's not something the
  browser should ever be trusted to do.
- **Wardrobe photos** are still stored as base64 inside the database
  (in a `jsonb` column), same as before — simplest thing that works.
  If wardrobes get large across many users, moving clothing photos to
  the `avatars`-style Storage bucket (like body/profile photos already
  are) will keep the database lean.
- Free tier Supabase projects pause after a week of no API requests and
  have row/storage limits generous enough for early testing but worth
  checking before a real launch.
