-- schema.sql — levels + «لوحة الصدارة» for لَمّة | Lamma (Supabase / Postgres).
-- Run once: Supabase → SQL Editor → New query → paste all of this → Run. Safe to run again.
--
-- Reading is public (the leaderboard page uses the anon key).
-- Nobody can INSERT / UPDATE / DELETE the tables directly with the anon key: every write goes through
-- add_xp() / add_xp_batch(), SECURITY DEFINER functions that clamp each call (max 200 XP per item, max 100 items per call)
-- and each id (max 3000 XP per hour), and check the id / name / avatar formats.
-- Honest note: the games run in the browser, so a determined person can still call these functions with fake numbers.
-- The clamps keep that small; they can't make it impossible without a server that watches the chat itself.

create table if not exists public.players (
  id          text primary key check (id ~ '^(twitch|discord|google|guest):[^\s:<>"'']{1,64}$'),
  display     text not null default '',
  avatar      text not null default '',
  provider    text not null default 'twitch',
  xp          integer not null default 0 check (xp >= 0),
  level       integer not null default 1,
  rounds      integer not null default 0,
  win_start   timestamptz not null default now(),   -- start of the current 1-hour anti-spam window
  win_xp      integer not null default 0,           -- XP added in that window
  updated_at  timestamptz not null default now()
);
create table if not exists public.streamers (
  id          text primary key check (id ~ '^twitch:[a-z0-9_]{2,25}$'),
  display     text not null default '',
  avatar      text not null default '',
  xp          integer not null default 0 check (xp >= 0),
  level       integer not null default 1,
  rounds      integer not null default 0,
  win_start   timestamptz not null default now(),
  win_xp      integer not null default 0,
  updated_at  timestamptz not null default now()
);
create index if not exists players_xp_idx   on public.players   (xp desc);
create index if not exists streamers_xp_idx on public.streamers (xp desc);

-- Row Level Security: public read, no direct writes
alter table public.players   enable row level security;
alter table public.streamers enable row level security;
drop policy if exists "public read players"   on public.players;
drop policy if exists "public read streamers" on public.streamers;
create policy "public read players"   on public.players   for select to anon, authenticated using (true);
create policy "public read streamers" on public.streamers for select to anon, authenticated using (true);
revoke insert, update, delete on public.players, public.streamers from anon, authenticated;
grant select on public.players, public.streamers to anon, authenticated;

-- level n needs 100·(n−1)^1.5 cumulative XP (same curve as shared/js/levels.js)
create or replace function public.lamma_level(p_xp integer) returns integer
language sql immutable as $$ select 1 + floor(power(greatest(p_xp,0) / 100.0, 2.0/3.0) + 1e-9)::int $$;

-- add_xp(kind, id, display, avatar, amount [, rounds]) — kind = 'player' | 'streamer'
create or replace function public.add_xp(kind text, id text, display text, avatar text, amount integer, rounds integer default 0)
returns integer   -- the new level (null when the call was refused)
language plpgsql security definer set search_path = public as $$
declare
  a integer := least(greatest(coalesce(amount,0),0),200);    -- max 200 XP per call
  r integer := least(greatest(coalesce(rounds,0),0),1);
  d text := left(regexp_replace(coalesce(display,''),'[[:cntrl:]<>]','','g'),40);
  av text := case when length(coalesce(avatar,'')) <= 300 and coalesce(avatar,'') ~ '^https://[^\s"''<>]+$' then avatar else '' end;
  lv integer;
begin
  if a = 0 and r = 0 then return null; end if;
  if kind = 'streamer' then
    if id !~ '^twitch:[a-z0-9_]{2,25}$' then return null; end if;
    insert into streamers as s (id, display, avatar) values (id, coalesce(nullif(d,''),substr(id,8)), av)
      on conflict on constraint streamers_pkey do nothing;
    update streamers s set
      win_xp    = case when s.win_start < now() - interval '1 hour' then 0 else s.win_xp end,
      win_start = case when s.win_start < now() - interval '1 hour' then now() else s.win_start end
      where s.id = add_xp.id;
    update streamers s set
      xp = s.xp + least(a, greatest(0, 3000 - s.win_xp)),
      win_xp = s.win_xp + least(a, greatest(0, 3000 - s.win_xp)),
      rounds = s.rounds + r,
      display = coalesce(nullif(d,''), s.display),
      avatar = coalesce(nullif(av,''), s.avatar),
      updated_at = now()
      where s.id = add_xp.id;
    update streamers s set level = lamma_level(s.xp) where s.id = add_xp.id returning s.level into lv;
  elsif kind = 'player' then
    if id !~ '^(twitch|discord|google|guest):[^\s:<>"'']{1,64}$' then return null; end if;
    insert into players as p (id, display, avatar, provider) values (id, coalesce(nullif(d,''),split_part(id,':',2)), av, split_part(id,':',1))
      on conflict on constraint players_pkey do nothing;
    update players p set
      win_xp    = case when p.win_start < now() - interval '1 hour' then 0 else p.win_xp end,
      win_start = case when p.win_start < now() - interval '1 hour' then now() else p.win_start end
      where p.id = add_xp.id;
    update players p set
      xp = p.xp + least(a, greatest(0, 3000 - p.win_xp)),
      win_xp = p.win_xp + least(a, greatest(0, 3000 - p.win_xp)),
      rounds = p.rounds + r,
      display = coalesce(nullif(d,''), p.display),
      avatar = coalesce(nullif(av,''), p.avatar),
      updated_at = now()
      where p.id = add_xp.id;
    update players p set level = lamma_level(p.xp) where p.id = add_xp.id returning p.level into lv;
  else
    return null;
  end if;
  return lv;
end $$;

-- add_xp_batch(items) — what the site calls: one request per finished round.
-- items = [{"kind":"player","id":"twitch:someone","display":"Someone","avatar":"","amount":15,"rounds":0}, …] (max 100)
create or replace function public.add_xp_batch(items jsonb)
returns integer   -- how many items were applied
language plpgsql security definer set search_path = public as $$
declare it jsonb; n integer := 0;
begin
  if jsonb_typeof(items) <> 'array' then return 0; end if;
  for it in select * from jsonb_array_elements(items) limit 100 loop
    if public.add_xp(it->>'kind', it->>'id', it->>'display', it->>'avatar',
                     coalesce((it->>'amount')::int,0), coalesce((it->>'rounds')::int,0)) is not null then
      n := n + 1;
    end if;
  end loop;
  return n;
end $$;

revoke all on function public.add_xp(text,text,text,text,integer,integer) from public;
revoke all on function public.add_xp_batch(jsonb) from public;
grant execute on function public.add_xp(text,text,text,text,integer,integer) to anon, authenticated;
grant execute on function public.add_xp_batch(jsonb) to anon, authenticated;
grant execute on function public.lamma_level(integer) to anon, authenticated;
