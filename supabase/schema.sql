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


-- =====================================================================================================================
-- «حسابي» / PROFILES + PER-GAME STATS (Nov 2026). Safe to run again. If you already ran the part above before,
-- you can run ONLY from here down (it adds what is missing and replaces add_xp_batch with the version that also counts stats).
-- Reading stays public. Writes only through add_xp_batch() and save_profile() (SECURITY DEFINER, clamped).
-- Honest note: the site uses the public (anon) key and has no server login, so save_profile() can't prove WHO is calling:
-- someone who knows the API could edit another person's profile text / picture. It CAN'T unlock items early (every frame,
-- colour, banner and skin is re-checked here against the XP / wins this database holds) and pictures are size-capped.
-- To tie edits strongly to the owner you would need Supabase Auth (a real login on the server) — a later step.
-- =====================================================================================================================

alter table public.players   add column if not exists played      integer not null default 0;
alter table public.players   add column if not exists wins        integer not null default 0;
alter table public.players   add column if not exists streak      integer not null default 0;
alter table public.players   add column if not exists best_streak integer not null default 0;
alter table public.players   add column if not exists created_at  timestamptz not null default now();
alter table public.streamers add column if not exists players     integer not null default 0;
alter table public.streamers add column if not exists created_at  timestamptz not null default now();

-- the game keys the site uses (data-game on each page)
create or replace function public.lamma_game_ok(g text) returns boolean language sql immutable as $$
  select g = any (array['fast','trivia','guess','charades','chain','codenames','likely','wheel-classic','wheel',
                        'battle-arena','battle-colors','hero','tnt']) $$;

create table if not exists public.game_stats (
  id          text not null check (id ~ '^(twitch|discord|google|guest):[^\s:<>"'']{1,64}$'),
  kind        text not null check (kind in ('viewer','streamer')),   -- viewer = played in it, streamer = hosted it
  game        text not null check (public.lamma_game_ok(game)),
  played      integer not null default 0,   -- rounds played (viewer) / rounds hosted (streamer)
  wins        integer not null default 0,   -- rounds won (viewer)
  xp          integer not null default 0,
  players     integer not null default 0,   -- players hosted (streamer)
  last_at     timestamptz not null default now(),
  updated_at  timestamptz not null default now(),
  primary key (id, kind, game)
);
create index if not exists game_stats_id_idx on public.game_stats (id);

create table if not exists public.profiles (
  id          text primary key check (id ~ '^(twitch|discord|google|guest):[^\s:<>"'']{1,64}$'),
  display     text not null default '',
  avatar      text not null default '',     -- '' | https://… | data:image/jpeg;base64,… (≤ 200 000 chars)
  banner      text not null default '',     -- '' | b:<built-in> | https://… | data:image/…
  bio         text not null default '',     -- ≤ 160 characters
  frame       text not null default '',
  name_color  text not null default '',
  skin        text not null default '',     -- '' | alex | villager | … | mc:<MinecraftName>
  fav_game    text not null default '',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

alter table public.game_stats enable row level security;
alter table public.profiles   enable row level security;
drop policy if exists "public read game_stats" on public.game_stats;
drop policy if exists "public read profiles"   on public.profiles;
create policy "public read game_stats" on public.game_stats for select to anon, authenticated using (true);
create policy "public read profiles"   on public.profiles   for select to anon, authenticated using (true);
revoke insert, update, delete on public.game_stats, public.profiles from anon, authenticated;
grant select on public.game_stats, public.profiles to anon, authenticated;

-- add_xp_batch(items) — same as before, plus per-game stats when an item carries "game":
--   viewer item:  {"kind":"player","id":…,"amount":15,"game":"trivia","played":1,"won":1}
--   host item:    {"kind":"streamer"|"player","id":…,"amount":26,"rounds":1,"game":"trivia","host":1,"players":3}
create or replace function public.add_xp_batch(items jsonb)
returns integer
language plpgsql security definer set search_path = public as $$
declare it jsonb; n integer := 0; g text; a integer; pl integer; wn integer; hp integer; hst boolean; sid text;
begin
  if jsonb_typeof(items) <> 'array' then return 0; end if;
  for it in select * from jsonb_array_elements(items) limit 100 loop
    if public.add_xp(it->>'kind', it->>'id', it->>'display', it->>'avatar',
                     coalesce((it->>'amount')::int,0), coalesce((it->>'rounds')::int,0)) is not null then
      n := n + 1;
      g := it->>'game';
      if g is not null and public.lamma_game_ok(g) then
        sid := it->>'id';
        a  := least(greatest(coalesce((it->>'amount')::int,0),0),200);
        pl := least(greatest(coalesce((it->>'played')::int,0),0),1);
        wn := least(greatest(coalesce((it->>'won')::int,0),0),pl);
        hp := least(greatest(coalesce((it->>'players')::int,0),0),50);
        hst := coalesce((it->>'host')::int,0) = 1 or it->>'kind' = 'streamer';
        if hst then
          if least(greatest(coalesce((it->>'rounds')::int,0),0),1) = 1 then
            insert into game_stats as s (id, kind, game, played, xp, players) values (sid, 'streamer', g, 1, a, hp)
              on conflict (id, kind, game) do update set played = s.played + 1, xp = s.xp + a, players = s.players + hp,
                 last_at = now(), updated_at = now();
            if it->>'kind' = 'streamer' then update streamers set players = streamers.players + hp where streamers.id = sid; end if;
          end if;
        elsif pl = 1 then
          insert into game_stats as s (id, kind, game, played, wins, xp) values (sid, 'viewer', g, 1, wn, a)
            on conflict (id, kind, game) do update set played = s.played + 1, wins = s.wins + wn, xp = s.xp + a,
               last_at = now(), updated_at = now();
          update players p set played = p.played + 1, wins = p.wins + wn,
                 streak = case when wn = 1 then p.streak + 1 else 0 end,
                 best_streak = greatest(p.best_streak, case when wn = 1 then p.streak + 1 else 0 end)
            where p.id = sid;
        end if;
      end if;
    end if;
  end loop;
  return n;
end $$;

-- the unlock rules (same as LammaProfile.COS in shared/js/levels.js): is item <v> of <kind> open at level <lv> / <w> wins?
create or replace function public.lamma_unlocked(kind text, v text, lv integer, w integer) returns boolean
language sql immutable as $$
  select case kind
    when 'frame' then case v when 'bronze' then lv >= 3 when 'silver' then lv >= 5 when 'gold' then lv >= 10
                             when 'emerald' then lv >= 15 when 'diamond' then lv >= 20
                             when 'champion' then w >= 10 when 'legend' then w >= 50 else false end
    when 'color' then case v when 'periwinkle' then true when 'steel' then lv >= 2 when 'ice' then lv >= 4
                             when 'emerald' then lv >= 6 when 'coral' then lv >= 8 when 'gold' then lv >= 10
                             when 'aurora' then lv >= 20 else false end
    when 'banner' then case v when 'grid' then true when 'waves' then lv >= 2 when 'steel' then lv >= 3
                             when 'aurora' then lv >= 5 when 'emerald' then lv >= 8 when 'ember' then lv >= 12
                             when 'gold' then lv >= 15 else false end
    when 'skin' then case when v like 'mc:%' then lv >= 10 and substr(v,4) ~ '^[A-Za-z0-9_]{3,16}$' else
                        case v when 'alex' then true when 'villager' then w >= 1 when 'zombie' then w >= 3
                               when 'skeleton' then w >= 5 when 'creeper' then w >= 10 when 'enderman' then w >= 25
                               when 'blaze' then w >= 50 else false end end
    else false end $$;

-- a picture field: '' or https://… (≤ 300) or data:image/(jpeg|png|webp);base64,… (≤ 200 000 characters)
create or replace function public.lamma_img_ok(v text) returns boolean language sql immutable as $$
  select coalesce(v,'') = ''
      or (length(v) <= 300 and v ~ '^https://[^\s"''<>()]+$')
      or (length(v) <= 200000 and v ~ '^data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$') $$;

-- save_profile(…) — the profile page's "save". Locked items are dropped (set back to the default), not trusted.
create or replace function public.save_profile(p_id text, p_display text default '', p_avatar text default '', p_banner text default '',
  p_bio text default '', p_frame text default '', p_name_color text default '', p_skin text default '', p_fav_game text default '')
returns public.profiles
language plpgsql security definer set search_path = public as $$
declare lv integer := 1; w integer := 0; r public.profiles;
  d text := left(regexp_replace(coalesce(p_display,''),'[[:cntrl:]<>]','','g'),40);
  b text := left(regexp_replace(coalesce(p_bio,''),'[[:cntrl:]<>]',' ','g'),160);
  bn text := coalesce(p_banner,''); av text := coalesce(p_avatar,'');
  fr text := coalesce(p_frame,''); nc text := coalesce(p_name_color,''); sk text := coalesce(p_skin,''); fg text := coalesce(p_fav_game,'');
begin
  if p_id is null or p_id !~ '^(twitch|discord|google|guest):[^\s:<>"'']{1,64}$' then raise exception 'bad id'; end if;
  select greatest(coalesce((select level from players where id = p_id),1), coalesce((select level from streamers where id = p_id),1)),
         coalesce((select wins from players where id = p_id),0) into lv, w;
  if not public.lamma_img_ok(av) then av := ''; end if;
  if bn ~ '^b:[a-z]+$' then
    if not public.lamma_unlocked('banner', substr(bn,3), lv, w) then bn := ''; end if;   -- b:night = '' (the default)
  elsif not public.lamma_img_ok(bn) then bn := ''; end if;
  if fr <> '' and not public.lamma_unlocked('frame', fr, lv, w) then fr := ''; end if;
  if nc <> '' and not public.lamma_unlocked('color', nc, lv, w) then nc := ''; end if;
  if sk <> '' and not public.lamma_unlocked('skin', sk, lv, w) then sk := ''; end if;
  if fg <> '' and not public.lamma_game_ok(fg) then fg := ''; end if;
  insert into profiles as p (id, display, avatar, banner, bio, frame, name_color, skin, fav_game)
    values (p_id, d, av, bn, b, fr, nc, sk, fg)
    on conflict (id) do update set display = coalesce(nullif(excluded.display,''), p.display), avatar = excluded.avatar,
      banner = excluded.banner, bio = excluded.bio, frame = excluded.frame, name_color = excluded.name_color,
      skin = excluded.skin, fav_game = excluded.fav_game, updated_at = now()
    returning * into r;
  return r;
end $$;

revoke all on function public.save_profile(text,text,text,text,text,text,text,text,text) from public;
grant execute on function public.save_profile(text,text,text,text,text,text,text,text,text) to anon, authenticated;
revoke all on function public.add_xp_batch(jsonb) from public;
grant execute on function public.add_xp_batch(jsonb) to anon, authenticated;
grant execute on function public.lamma_unlocked(text,text,integer,integer) to anon, authenticated;
grant execute on function public.lamma_game_ok(text) to anon, authenticated;
grant execute on function public.lamma_img_ok(text) to anon, authenticated;
