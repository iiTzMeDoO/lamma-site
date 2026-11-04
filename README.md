# لَمّة | Lamma — كل ألعاب الشات بمكان واحد

All your chat games in one place. (Formerly "ALL IN 1"; localStorage keys moved from `allin1-*` to `lamma-*` with a one-time copy on load.)

Twitch chat games in one place, for any channel. Static site, no build step, no backend, no login: chat is read anonymously (read-only) over `wss://irc-ws.chat.twitch.tv`.

Live: https://lamma.sites.tab.bot/

## Games
| Page | Game | Chat | Streamer/mod commands |
|---|---|---|---|
| charades.html | تمثيل / Charades — secret word only on the control panel | type guesses | `!charades` `!skip` `!stop` |
| party.html | معركة البلوك / Block Brawl — Minecraft-style elimination party | `!join` / `!join <MinecraftName>`, `!1`–`!4`, any message to run | `!party` `!start` `!stop` |
| wheels.html | العجلات / Wheels section: lists every wheel in `tools/wheels.json` | | |
| wheel-classic.html | العجلة الكلاسيك / Classic wheel: the landed name wins | `!join` | `!spin` `!respin` `!clear` `!open` `!close` |
| wheel-pick.html | عجلة الشخصنة / Personal wheel: elimination with an on-screen kick list, shields optional (old `wheel-shield.html` and `wheel.html` forward here, query kept) | `!join` `!kick 3` / `!kick name` (`!revive name` with shields on) | `!spin` `!newround` `!clear` `!pause` / `!stop` `!skip` `!undo` |
| codenames.html | كلمات سرية / Secret Words (Codenames-style) | `!red` `!blue` `!pick 7` | `!codenames` `!endturn` |
| fast.html | أسرع واحد / Fastest typer | type the word | `!fast` `!stop` |
| guess.html | خمّن الرقم / Guess the number | numbers | `!guess` `!stop` |
| vote.html | تصويت الشات / Chat vote | `!1`–`!4` | `!vote question | a | b` `!end` `!stop` |
| trivia.html | أسئلة سريعة / Quick trivia | `!1`–`!4` | `!trivia` `!next` `!stop` |
| likely.html | مين الأرجح؟ / Most likely | `!1`–`!4` | `!likely` `!stop` |
| chain.html | سلسلة كلمات / Word chain | words | `!chain` `!undo` `!stop` |

Mod commands work for chatters with the broadcaster or moderator badge.

## URL options
- `?channel=name` — any Twitch channel (also remembered in localStorage from the home page).
- `?demo=1` — fake chatters, to try everything offline.
- `?lang=en` — English (Arabic RTL is the default).
- `?obs=1` — OBS overlay: transparent, no controls, never shows a secret (charades word, codenames key, guess-the-number secret). Add `&sound=1` for sounds from the overlay.

## OBS setup
1. Add the game's OBS link (copy it from the "OBS link" box on each game page) as a **Browser Source**, 1920×1080.
2. Open the same game page (without `obs=1`) as a **Custom Browser Dock** in OBS (Docks → Custom Browser Docks). The overlay follows the control panel step by step (same browser profile → BroadcastChannel/localStorage).
3. Without the dock, the non-secret games (Block Brawl, wheel, fastest, guess, vote, trivia, likely, chain) can still run inside the overlay on their own, started by mod chat commands.

## Editing
- Word lists, trivia, "most likely" prompts: `site/words.js`.
- Pages are generated from one template: `python3 tools/build_pages.py` (games list in `tools/games.json`, per-game stage/controls in `tools/parts/`).
- Minecraft skins load from mc-heads.net (public, CORS-enabled); everything else is local.
- Tests: `node --test test/site.test.js test/games2.test.js`

Cloudflare Pages: upload the `site` folder (Direct Upload), or connect a repo with output directory `site`.

## Update (Nov 2026)
- **Themes**: picker in the top bar (theme.js + theme.css): قناتي/Channel (default), نيون/Neon (original look), ذهبي/Gold, أخضر ماين/Minecraft, نار/Fire. Saved in localStorage (`lamma-theme`); OBS links carry `&theme=` (overlay reads `?theme=`). Only the site chrome takes the theme; game cards and games keep their own colours.
- **Login with Twitch** (auth.js / auth.html, off until `TWITCH_CLIENT_ID` is set in auth.js). Redirect URL: `https://lamma.sites.tab.bot/auth.html`. gate.js hides controls for anyone but the channel owner when it is on.
- **Layout editor** (site/layout.js + layout.css, used by both wheels; reusable): the streamer panel's "تعديل الشكل / Edit layout" button (also in the bar above the stage) turns on edit mode — drag any piece, drag the corners to resize, × or the chip list to hide / add back, ↺ to reset. Saved per channel+page in localStorage (`lamma-lay-<channel>-<game>`) and carried in the OBS link as `&lay=<code>` (version `a`, 10 chars per piece, omitted when default). Another game adopts it by wrapping its stage pieces in `<div class="lay-el" data-lay="id"><div class="lay-c">…</div></div>` and calling `LammaLayout.init({root,stage,key,items})`.
- **Background toggle** above the stage (مع خلفية / بلا خلفية), OBS link `&bg=1` / `&bg=0`; an overlay link without `bg` stays transparent (as before).
- The old camera spot is removed everywhere (cam.js, the cam frame, Block Brawl's cut-out). Old OBS links that still carry `&cam=` / `&cs=` load normally; the params are ignored.
- Chat commands in any text ("!join", "!طرد", chat lines in the feed) are isolated left-to-right by app.js (`fixCmds` + a MutationObserver), so the "!" stays in front of the command in Arabic sentences.
- **Block Brawl** rewrite: Kukoro-style pixel arena (arena.js), cave mode (dodge / counters / chests / volunteer + final) and colour-floor mode, XP/levels per channel, pause.
- **Wheel** (elimination + shields, `!kick` / `!طرد`, `!revive` / `!رجع`), **Guess** (1–1000, anti-spam, narrowing range), **Fastest typer** (أذكار / أسئلة / كلمات, fastdata.js), **Secret Words** (Codenames rules, teams split by the streamer, spymaster + captain, private `spymaster.html` link).
- Chat vote game removed (`/vote` redirects to the hub).
- Build: `python3 tools/build_pages.py` · tests: `node --test test/site.test.js test/games2.test.js test/battle.test.js` · deploy folder: `sh tools/make_dist.sh` → `dist/`.

## Wheels section (Nov 2026)
- `wheels.html` lists the wheel modes from `tools/wheels.json` (data-driven: cards, titles and both languages come from that file).
- Each wheel is its own page built from `tools/parts/wheel.*.html` + `wheel.js`, with the mode fixed by `<body data-wmode>`:
  - `wheel-classic.html` (`data-wmode="classic"`, sync/storage key `wheel-classic`): chat joins, spin, the landed name wins (+1 leaderboard point). Remove-winner toggle (removed winners go to "won and removed", "put the winners back" returns them), re-spin (throws the last result away, takes the point back), spin time, winners list on the overlay.
  - `wheel-shield.html` (`data-wmode="elim"`, key `wheel`, so the saved list and OBS sync from the old page carry over): the elimination + shields wheel, unchanged (+3 points for the winner).
  - `wheel.html` is a redirect to `wheel-shield.html` keeping `?obs=1&channel=…` (the Worker answers it with a 302; the static file does the same client-side).
- To add a wheel type: add an entry to `tools/wheels.json` (`id` = page name, `mode`, `game` = its own sync key, colours, `desc`/`desc_en`, commands), teach `wheel.js` the new mode (or give the entry its own `part`/`js`), add the page name to `PAGES` in `tools/_worker.js`, then `python3 tools/build_pages.py`.

## Wheel editor, themes and colours (Nov 2026, round 3)
- **Default layout** of both wheels: one slim sidebar on the LEFT (players list with the count on top, then the out / winners list, the event line and the join box), the wheel big in the centre of the rest, the title in the wheel's centre badge. The لَمّة / LAMMA logo is fixed at the stage's top-right (also in OBS and transparent mode): it is not a layout piece, cannot be moved or hidden. The classic wheel hides the (unused) event line by default.
- **Snapping** (layout.js): while dragging, a piece snaps to the stage edges and centre lines, to other pieces' edges / centres and to the wheel centre, with guide lines; any piece dropped over the middle of the wheel (item `snapCenter:true`) lands exactly centred on it (yellow ring + cross). Hold Alt to place freely. Edge grips snap too.
- **Box pieces** (join box, event line, players list, out / winners list) have edge grips top / bottom / left / right: they change only that side and the text keeps its size. Corner grips resize the whole box proportionally and the text scales with it (stored separately as `s`).
- **Layout codec "b"**: `&lay=b…`, 12 chars per piece (code, v/h, x, y, w, h, text scale). Old `a` links still decode (pieces that were "scale" pieces then get a height from their old scale; the old logo piece is ignored).
- **Title in the wheel centre**: the panel's "العنوان بنص العجلة" (empty = لَمّة), auto-fitted in the badge. Toggles: "صورة القناة بنص العجلة" (the channel's Twitch picture via decapi.me, cached per channel) and "الشرايح بلون اسم كل واحد بالشات" (each slice in the viewer's chat colour).
- On the control page, during a pick on the shield wheel, clicking a name in the stage's players list kicks it (shields count, same as ✖).
- **Wheel colours follow the theme** (`--wh-*` variables in theme.css): slices alternate the theme's two colours with the names in the opposite colour (Gold = gold / black, Channel = periwinkle / charcoal, Minecraft = green / dark, Fire = orange / black); an odd count gives the last slice a third shade so two equal colours never touch. Rim, lights, pointer and centre badge follow. Neon keeps the multi-colour wheel. On the wheel pages the stage panels take the theme colour too (Channel unchanged).
- **ألوانك / Custom theme** (theme.js): four colour pickers in the theme menu (main, second, background, text) drive the site chrome and the wheel; saved in localStorage (`lamma-theme-custom`) and carried in OBS links as `&theme=custom&tc=<24 hex digits>`.
- Commands render as `<bdi dir="ltr" class="cmd"><span class="bang">!</span>join</bdi>`: isolated left-to-right, with the "!" in the accent colour and a hair of space so it never sits on the "j".

## Wheel side panel, avatars, Arabic commands, fullscreen (Nov 2026, round 4 — v12)
- **One side panel** (layout piece `side`, a *stack*): players, out / winners, event line and join box are sections of ONE panel instead of four boxes. In edit mode × on a section (or its chip in the bar) hides it and the remaining sections grow to fill the panel; the lines between sections are dragged up / down (also outside edit mode on the control page) to give one section more room and the other less. The panel itself moves / resizes like any box. Saved per channel+page and carried in `&lay=` (codec "c": 12 chars per piece + 4 per section `CODE v/h share`; old "b"/"a" links still decode and their p/o/e/b boxes keep their shown / hidden state as sections). layout.js stacks are generic (`sections:[…]`, `[data-sec]` nodes).
- **Fullscreen** button at the stage's bottom-left (Fullscreen API on the stage area, kept 16:9; Esc or the button leaves). Never in OBS.
- The "🎨 الشكل" card is gone (edit / background / reset are in the bar above the stage). The wheel pages no longer carry the chat card or the leaderboard card (`no_feed` / `no_lb` in `wheel_game`); points are still awarded and shown on the hub.
- **Names**: smaller, in the viewer's Twitch chat colour, with their Twitch picture (`avatars.js`: one public Twitch GQL request per ≤35 logins, decapi.me as fallback, cached 7 days in localStorage, letter-circle fallback in the chat colour, demo chatters never looked up, nothing waits on it). Lists are numbered on the shield wheel (kick / revive by number). With "slices in each viewer's chat colour" on, the wheel slices carry the round picture next to the name (≤24 names).
- **Arabic chat commands** (`wheelcmds.js`, one table, compared after normalize()): `!join` = `!دخول` / `!ادخل` (a bare `دخول` or `join` also joins), `!leave` = `!خروج`, `!kick` = `!طرد` (name or list number, e.g. `!طرد 3`), `!revive` = `!رجع`, mods: `!spin` = `!لف`, `!respin` = `!اعادة`, `!clear` = `!مسح`, `!open` / `!close` = `!فتح` / `!سكر`, `!newround` = `!جديد`, `!pause` = `!وقف`, `!undo` = `!تراجع`; mods can also `!طرد 2` / `!رجع 1` outside a pick. The join box says "اكتب !دخول أو !join". English commands render left-to-right, Arabic ones right-to-left with their "!" first (`cmdEl`, `cmd_html`).

## Personal wheel, kick list, shields toggle, custom timers (Nov 2026, round 5 — v13)
- The shield wheel is now **عجلة الشخصنة / Personal Wheel** at `wheel-pick.html` (`tools/wheels.json` id `wheel-pick`, same storage / sync key `wheel`, so saved lists and the dock ↔ overlay sync carry over). `wheel-shield.html` and `wheel.html` forward to it with the query (static redirect page from the entry's `old` list + a 302 in `_worker.js`), so old OBS sources keep working.
- **No shields by default.** Settings → "إضافة شيلدات / Add shields" (off) turns the shield mechanics on (start count 1–3); shield wording (help text, hints, event-line placeholder, 🛡️ on slices / lists / kick list, the revive line) only appears while it is on (`STR_SH` / `STR_NOSH` in wheel.js, `body.w-sh-on`, `.sh-only`). Lists saved before v13 load without shields.
- **Kick list overlay** (`#whPicker`, also on the OBS overlay): when the wheel lands, a big card list of everyone still on the wheel opens on the stage (number, round Twitch picture, name in the chat colour, theme colours, pop-in animation, countdown ring or ∞). The landed player picks with `!طرد 3` / `!طرد name` / `!kick`; on the control page the streamer clicks a card (or uses its Random / Skip buttons). The chosen card is stamped "برّا! / OUT!" (or "محمي 🛡️") and the list closes; it also closes on time-out or skip. Setting "قائمة الطرد الكبيرة عالشاشة" turns it off (`&pk=0`). Hidden in edit mode; streamer buttons never on the overlay.
- **Timers** (settings, each "بدون وقت / No limit" or custom seconds): pick time (no limit = waits for a kick or a skip: panel button, kick-list button or mod `!skip` / `!تخطي`), spin time (no limit = turns until "وقّف العجلة" or mod `!stop` / `!وقف`, then eases out ~3.5 s), next spin by itself (no limit = manual), join window (joining closes N s after it opens; countdown in the join box). Saved per channel; OBS link `&tm=p20d6a7j0` (+ `&sh=N`, `&pk=0`). Pure logic in `site/wheelopts.js` (tested in Node).
- Join box: just "اكتب !دخول أو !join" / "Type !join", command pills slim (1 px, faint).

## The final (Nov 2026 — v15)
- On the personal wheel, when exactly 2 are left (setting "النهائي لما يضلو 2", on by default) the game becomes a first-to-N match ("الفوز بـ", default 3 = best of 5). No kicks: the streamer spins each round (or a mod with `!لف` / `!spin`), every landing is +1 for that player, nothing spins by itself.
- Wheel: two halves in the players' Twitch colours with their pictures. Scoreboard `#whFinal` on the stage and the OBS overlay: names + pictures, big "2 - 1", round, a pulse on each point, "نقطة الحسم!" at N−1, and a champion card (crown, "البطل", confetti) at N, then the normal winner flow (+3 points).
- `!تراجع` / Undo takes the last point back. The match survives a refresh (saved with the list). OBS link: `&fn=0` (off) or `&fn=N` (target). Logic in `wheelopts.js` (`finalStart / finalPoint / finalModel`, tested in Node).

## «المعركة» section (Nov 2026, Part 1)
- Block Brawl is renamed **المعركة / Battle**: the index card links `battle.html` (hub built from `tools/battle.json`, like the wheels). `/party.html` forwards with its query (Worker 302 + static redirect); `?obs=1` goes to `battle-arena.html`. The old `party.js` / `arena.js` stay in the tree, unused.
- A mode with `tools/parts/<id>.stage.html` gets its own page; the others show as "قريباً" cards (TNT Run, The Hero, Cave Raid = Part 2).
- `mc.js`: original blocky art drawn in code: procedural 16x16 block textures, an isometric voxel projector (textured, shaded, outlined boxes), players (shirt = Twitch colour, skin/hair from the login hash, Twitch picture as the face), mobs per map, the four bosses, dungeon rooms with torches / lava, darkness + light holes + vignette.
- `btcore.js`: commands AR+EN (`BT.cmd`), column numbers (`BT.colNum`), the colour engine `BT.Colors` and the raid engine `BT.Arena` (pure, tested in Node) + DOM helpers (∞/ث timers, "خيارات زيادة" memory, names in `<bdi>` via textContent).
- `battle-colors.html` (لعبة الألوان): Kukoro Colorblind — 20 columns drawn as ONE seamless gradient strip (no gaps / outlines / alternating shades), numbers `!1…!20` under the strip, target colour + timer, `!1…!20` or plain numbers, round 1 also saves the neighbour, 5 rounds narrowing, "آخر جولة!", winners card. OBS params `&pk= &rd= &map= &av= &au=`.
- `battle-arena.html` (معركة الساحة): Kukoro **Dungeon raid** flow on a wide open field (`MC.renderField`: angled voxel ground, a chasm / river / lava split with a bridge in the middle, scenery props kept out of where people stand, lamps + lava light). Lobby (`!دخول !قفز !اختبي !صوت`) → the streamer picks the party → rooms 3/5/7/∞ (boss room last; ∞: every 5th; mid-boss in the middle room with 8+). In each room the party **stands still** spread out on the left (name + HP + LV, ⬆ for !قفز, ★ votes) and the room's enemies on the right ("name Lv.N"). Nobody fights by themselves: the streamer clicks a fighter on the map or in the list (or "التالي" / mod `!التالي` = top !قفز → most votes → healthiest), that ONE fighter walks to the bridge and duels the front enemy 1v1, turn by turn (DODGE / CRIT / damage numbers); the winner walks back, the loser is out; resting fighters regain 0.5% per hit, +30% between rooms. `!قوة` = your power, once per duel, only while you fight; `!ركز زعيم|موب` picks your enemy; mods `!ابدأ !وقف !التالي !زعيم` (= jump to the boss room). Setting "قتال تلقائي" (off by default) sends the next fighter by itself. Win → map level +1, lose → −1; XP per kill / win → LV10–LV20. OBS params `&map= &wv= &df= &bs= &av= &af=`. Engine: `BT.Arena` (pure, normalised field positions `BT.partySlot / enemySlot`).
- Both pages: compact settings card, layout editor (`&lay=`), fullscreen, fixed logo, `&bg=0` transparent, no chat / leaderboard card. Tests: `test/battle.test.js`.


## «المعركة» depth — Kukoro dungeon-raid system, Minecraft names (Nov 2026, btrpg.js)
Studied from real Kukoro Dungeon raid footage (the `!getinfo` replies, the bestiary cards with HP / attack / defence / crit / agility bars, perks bound to one enemy type). All numbers live in `site/btrpg.js` (pure, tested in Node).
- **Damage types (6):** ضرب melee ⚔️ · سهام arrows 🏹 · نار fire 🔥 · انفجار blast 💥 · سم poison 🧪 · سحر magic ✨.
- **Enemy families (6):** الموتى undead · الحشرات arthropods · النذر nether · الإندر ender · الأشرار illagers · المخلوقات creatures.
- **27 mobs** (zombie, husk, drowned, skeleton, stray, wither skeleton, zombified piglin, phantom, spider, cave spider, silverfish, endermite, blaze, piglin, piglin brute, magma cube, ghast, hoglin, enderman, shulker, pillager, vindicator, evoker, witch, vex, ravager, creeper, slime, guardian). Each has a family, an attack type, HP / damage / defence / dodge / crit, a resistance table (0 = immune → only a scratch, .5 resists, 1.5 weak) and a trait: hunger, slow, wither, anger, swoop (strikes first), web, poison, swarm (hits twice), blink, burn, gold (extra loot), split (comes back once at half HP), knock (stun), teleport (arrows never hit), levitate (no dodge), fangs (ignore armour), potion (heals once), roar (stun every 3rd turn), explode (3rd turn ×2.5 and dies), thorns (reflects melee).
- **9 bosses**, rotating per map level (plains: Iron Guardian / Ravager King / Evoker Lord · desert: Zombie King / Evoker Lord / Ravager King · nether: Wither / Blaze King · end: Ender Dragon · cave: Deep Warden / Zombie King / Elder Guardian). Each has its own attacks and a **second phase at half HP** (banner "المرحلة التانية!"): wither armour (immune to arrows + double hit), end crystal (heal 15% + harder hits), rage (+40%), summon zombies (extra hit), charge (×2 every 3rd turn), totem of undying (rises once), fire storm (double hit), mining fatigue (your attack −25%). The Warden's sonic boom every 3rd turn ignores dodge and armour.
- **8 classes** (`!صنف` / `!class` محارب، رامي، ساحر، دبابة، نينجا، كيميائي، مفجّر، ساحر النار; default from the name): HP, ATK, DEF, SPD, dodge, crit and the class's attack type (the alchemist poisons, the pyromancer burns, the bomber blasts…). Levels LV10–20 raise HP / ATK / dodge / crit.
- **Perks (Kukoro):** two per viewer from their name, a third at LV18, upgraded to "II" at LV15. Each is bound to one family: ×dmg on it, less damage from it, sure crit when your HP is odd, survive a deadly hit, ×3 on the one that killed a teammate, always strike first, +dodge, heal on kill, +defence per kill, ×2 after a dodge.
- **Gear (saved per viewer per channel):** armour tier (leather → netherite) + one protection enchant (fire / blast / projectile / antidote / magic ward / thorns); weapon tier (wood → netherite) + one enchant (Smite ×1.5 undead, Bane ×1.5 arthropods, Ender Bane, Raid Breaker, Sharpness, Fire Aspect burns, Knockback stuns, Looting); up to 3 items (healing potion at <35% HP, strength potion vs a boss, totem of undying, golden apple +20% HP, fire resistance). Armour shows on the character (helmet + shoulder pads), the weapon is the class's own (sword, bow, staff, axe, dagger, flasks, TNT, wand) in its tier's colour.
- **Loot** after every cleared room (more kills in the room = better odds, treasure room = double, boss room = 2 drops + totem chance); banner "🎁 غنيمة".
- **Room events** (35% of rooms from room 2, icon on the room bar): ليل (undead +25%), مطر (fire ×0.5), ضباب (+10% dodge), نبع شفاء (party +25% HP), كنز (double loot), أرض حامية (5 fire to each fighter who walks out), قمر الدم (enemies +20%, XP +50%).
- **One blow** = ATK × type multiplier × perk / enchant multipliers × event × random 75–100% × crit 1.5, minus defence (a crit ignores defence). Floating words: "فعّال جداً!" (≥×1.4), "مقاوم" (≤×0.7), "مناعة!" (immune), status icons over heads (🔥 🧪 💀 💫).
- **`!معلومات` / `!getinfo` [name | enemy]:** our chat is read-only, so the answer is a big card ON STREAM next to that character for ~7 s (queued, one at a time, also in the OBS overlay): voxel portrait, name in Twitch colour, class, LV + XP bar, HP, ATK, DEF, SPD, dodge, crit, abilities, gear + enchants + items, resistances, power and whether it is used, kills. `!معلومات زومبي` (or clicking an enemy on the map) shows its bestiary card: family, attack type, stats, weak to / resists / immune, trait and its second phase.
- **`!stop` / `!الغي`** from a candidate takes back their `!jump` (from a mod, `!وقف`/`!stop` still pauses). **Candidates can speak:** a non-command chat line from someone on the field shows as a bubble over their head for 4 s (max 40 chars; setting, on by default).
- Settings (خيارات زيادة): candidates speak, room events, loot, reset gear and classes; the boss picker lists all 9.
