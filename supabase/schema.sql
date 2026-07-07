-- ============================================================
-- StyleAI — Supabase schema
-- Run this once in Supabase Dashboard → SQL Editor → New query
-- ============================================================

-- 1. Profiles (one row per auth user) ------------------------------------
create table if not exists public.profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  username                text unique not null,
  name                    text default '',
  city                    text default 'Mumbai',
  gender                  text,
  body_type               text default 'average',
  face_shape              text default 'oval',
  body_photo_url          text,
  profile_photo_url       text,
  avatar_config           jsonb,
  is_demo                 boolean default false,
  trial_ends_at           timestamptz default (now() + interval '7 days'),
  subscription_active     boolean default false,
  subscription_expires_at timestamptz,
  created_at              timestamptz default now()
);

alter table public.profiles enable row level security;

create policy "read own profile"   on public.profiles for select using (auth.uid() = id);
create policy "update own profile" on public.profiles for update using (auth.uid() = id);
-- No insert/delete policy for the client: rows are created by the trigger
-- below, and deleted (if ever) only via deleteAccount()'s own-row delete.
create policy "delete own profile" on public.profiles for delete using (auth.uid() = id);

-- 2. Wardrobe / saved outfits / calendar — one JSON blob per user --------
--    (mirrors the shape the app already used in localStorage; simplest
--    thing that works well at MVP scale. Normalize into per-item rows
--    later if wardrobes get large or you need cross-item queries.)

create table if not exists public.wardrobe (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  items      jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);
alter table public.wardrobe enable row level security;
create policy "own wardrobe" on public.wardrobe for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.saved_outfits (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  outfits    jsonb not null default '[]'::jsonb,
  updated_at timestamptz default now()
);
alter table public.saved_outfits enable row level security;
create policy "own saved_outfits" on public.saved_outfits for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

create table if not exists public.calendar_entries (
  user_id    uuid primary key references public.profiles(id) on delete cascade,
  entries    jsonb not null default '{}'::jsonb,
  updated_at timestamptz default now()
);
alter table public.calendar_entries enable row level security;
create policy "own calendar" on public.calendar_entries for all
  using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- 3. Auto-create profile + empty data rows on signup ---------------------
--    Reads the metadata passed in supabaseClient.auth.signUp({options:{data:...}})

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, username, name, city, gender, body_type, face_shape, is_demo)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    coalesce(new.raw_user_meta_data->>'name', ''),
    coalesce(new.raw_user_meta_data->>'city', 'Mumbai'),
    new.raw_user_meta_data->>'gender',
    coalesce(new.raw_user_meta_data->>'bodyType', 'average'),
    coalesce(new.raw_user_meta_data->>'faceShape', 'oval'),
    coalesce((new.raw_user_meta_data->>'isDemo')::boolean, false)
  )
  on conflict (id) do nothing;

  insert into public.wardrobe (user_id) values (new.id) on conflict do nothing;
  insert into public.saved_outfits (user_id) values (new.id) on conflict do nothing;
  insert into public.calendar_entries (user_id) values (new.id) on conflict do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- 4. TEST-ONLY mock payment activation ------------------------------------
--    ⚠️ Replace this before charging real money. It has NO payment
--    verification — anyone who calls it (e.g. from devtools) gets a free
--    "subscription". It exists only so you can build/demo the paywall UI
--    before your Razorpay account is ready. See SETUP.md → "Going live
--    with real billing" for the Edge Function that should replace it.

create or replace function public.mock_activate_subscription()
returns void
language plpgsql
security definer set search_path = public
as $$
begin
  update public.profiles
  set subscription_active = true,
      subscription_expires_at = now() + interval '30 days'
  where id = auth.uid();
end;
$$;

-- ============================================================
-- After running this file:
-- 1. Storage → New bucket → name it "avatars" → toggle "Public bucket" ON.
-- 2. Authentication → Providers → Email → turn OFF "Confirm email"
--    (usernames map to fake @styleai.local addresses that can't receive mail).
-- ============================================================
