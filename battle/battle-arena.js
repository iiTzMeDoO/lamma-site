/* battle-arena.js — معركة الساحة / Arena Battle: Kukoro's dungeon-raid system drawn like Minecraft Dungeons
   (a wide open angled field split by a chasm with a bridge in the middle, chunky voxel fighters / mobs / bosses, lamp and lava light).
   Kukoro's flow: the party stands still on the left, the wave's enemies on the right; the streamer sends ONE fighter at a time
   (click on the map / the list, or "التالي") for a 1v1 duel in the middle with DODGE / CRIT / damage numbers.
   The engine (BT.Arena in btcore.js) runs on the control page (or on the overlay alone, from mods' chat commands) and is mirrored
   to the OBS overlay ~8 times a second; both sides draw the same scene from that state with smoothing in between. */
(function(){
'use strict';
var A=window.App,BT=window.BT,MC=window.MC,$=A.$;
var PW_AR={bolt:'صاعقة',fire:'كرة نار',shield:'درع',heal:'شفاء',arrows:'سهام',tnt:'TNT',freeze:'تجميد'},PW_EN={bolt:'Lightning',fire:'Fireball',shield:'Shield',heal:'Heal',arrows:'Arrow rain',tnt:'TNT',freeze:'Freeze'};
var PW_IC={bolt:'⚡',fire:'🔥',shield:'🛡',heal:'💚',arrows:'🏹',tnt:'💣',freeze:'❄'};

/* Minecraft-style hardcore heart (9x8 pixels): K outline, R blood, H highlight, D the hardcore horns */
var HH=['.KKK.KKK.','KHRRKRRRK','KHRRRRRRK','KRRRRRRRK','.KRRRRRK.','..KRRRK..','...KRK...','....K....'];
/* Mohammad Nov 4: brown heart (like his reference) — fills with brown from the bottom while the power recharges, warm glow when ready */
function drawHHeart(x,y,c,prog,act){var h=8*c,cut=y+h*(1-prog);ctx.save();
  if(prog>=1){ctx.shadowColor='rgba(255,190,110,.9)';ctx.shadowBlur=(act?9:5)+Math.sin(performance.now()/1000*6)*2.5;}
  for(var r=0;r<8;r++)for(var q=0;q<9;q++){var ch=HH[r][q];if(ch==='.')continue;var px=x+q*c,py=y+r*c,col;
    if(ch==='K')col='#1a0e04';else{var full=py+c>cut+.01;col=full?(ch==='H'?'#e8b070':(r<3?'#b8743a':'#9a5e2a')):'#6a5c54';}
    ctx.fillStyle=col;ctx.fillRect(Math.round(px),Math.round(py),Math.ceil(c),Math.ceil(c));}
  ctx.restore();}
var BTR=window.BTR,TYPE_COL={fire:'#ff9a3d',burn:'#ff9a3d',magic:'#d9a6ff',bolt:'#bfe8ff',poison:'#7dff5a',blast:'#ffcf5a',tnt:'#ffcf5a',arrow:'#e8e8e8',arrows:'#e8e8e8'};
var WMAP={sword:'sword',bow:'bow',staff:'staff',axe:'axe',dagger:'dagger',flask:'flask',tnt:'tnt',wand:'wand'};
var WCOL=['#a0743a','#9a9aa0','#d6f2fa','#ffd84a','#4fe0d8','#5a4a58'];
function L2(o){return o?(A.lang()==='en'?o.en:o.ar):'';}
/* a loot drop in words: "Diamond sword", "Fire Protection", "Healing potion"… */
function wName(cls,tier){var en=A.lang()==='en',W=BTR.WEAPON[tier],k=(BTR.CLASSES[cls]||BTR.CLASSES.warrior).w,wn=BTR.WPN_NAME[k];
  if(k==='tnt'||k==='flask'||k==='staff'||k==='wand')return (en?wn.en:wn.ar)+' · '+(en?'tier ':'مستوى ')+(tier+1)+'/6';return en?W.en+' '+wn.en:wn.ar+' '+W.ar;}
function lootName(it,cls){if(!it)return '';var en=A.lang()==='en';if(it.t==='w')return wName(cls,it.v);
  if(it.t==='a'){var R=BTR.ARMOUR[it.v];return en?R.en+' armour':'درع '+R.ar;}if(it.t==='ae')return '✨ '+L2(BTR.ARM_ENCH[it.v]);if(it.t==='we')return '✨ '+L2(BTR.WPN_ENCH[it.v]);if(it.t==='i'){var I=BTR.ITEMS[it.v];return I.ic+' '+L2(I);}return '';}
A.strings({
 ar:{g_title:'معركة الساحة',g_how:'الشات يدخل بـ !دخول فيصير في الفريق مباشرة.  وفي كل موجة تختار من يخرج ليقاتل واحدًا ضد واحد في المنتصف، وفي الآخر الزعيم. من يقاتل يطلق قوته بـ !قوة.',
  ba_start:'ابدأ المعركة',ba_again:'معركة جديدة',ba_pause:'وقف',ba_resume:'تابع',ba_next:'التالي ⚔️',ba_boss:'اذهب إلى الزعيم',ba_reset:'رجوع إلى اللوبي',ba_squad:'الفريق',ba_wait:'في الانتظار',
  ba_add_j:'أضف من قفزوا ⬆',ba_add_r:'أضف عشوائيًا',ba_empty:'أفرغ الفريق',ba_hint:'من يكتب !دخول يدخل الفريق مباشرة. قبل الغارة: اضغط على اسم لتطرده. وقت الغارة: اضغط على مقاتل (في الساحة أو هنا ⚔) ليخرج للقتال واحدًا ضد واحد. اضغط على وحش أو الزعيم لترى معلوماته.',ba_noleave:'لا يمكن الخروج بعد بدء المعركة',
  bt_settings:'الإعدادات',ba_wcard:'شاشة الموجة تُغلق تلقائيًا بعد',ba_bot:'الرد في الشات (يحتاج حساب بوت)',ba_bot_n:'عند التفعيل يرسل البوت ردّ !معلومات في شات تويتش بدل الشاشة. يلزم ربط حساب بوت يكتب في الشات، وحتى يُربط تبقى البطاقة على الشاشة.',ba_waves:'عدد الموجات',ba_diff:'الصعوبة',ba_d_easy:'سهل',ba_d_normal:'عادي',ba_d_hard:'صعب',ba_d_hell:'جحيم',ba_break:'الموجة القادمة تلقائيًا بعد',bt_more:'خيارات إضافية',
  ba_bosssel:'الزعيم',ba_b_auto:'حسب الخريطة',boss_wither:'الذابل',boss_dragon:'تنين النهاية',boss_golem:'الحارس الحديدي',boss_king:'ملك الزومبي',boss_warden:'حارس الأعماق',boss_ravagerk:'ملك المدمّرين',boss_evokerm:'سيد الاستحضار',boss_blazek:'ملك البليز',boss_elder:'الحارس العتيق',ba_size:'حجم الفريق',bt_join_t:'وقت الدخول',
  ba_autop:'تنطلق القوة تلقائيًا إذا لم يكتب !قوة',bt_av:'صور تويتش على الرأس',bt_map:'الخريطة',bt_nolimit:'بلا وقت',bt_manual:'أنت تضغط',bt_sec:'ث',
  map_plains:'سهول',map_desert:'صحراء',map_nether:'النذر',map_end:'النهاية',map_cave:'الكهف',
  ba_wave:'الموجة {w}/{n}',ba_wave_inf:'الموجة {w}',ba_lvl:'{m} · المستوى {l}',ba_lobby_t:'اللوبي',ba_boss_w:'موجة الزعيم!',ba_wave_b:'الموجة {w}',ba_cleared:'تم تطهير الموجة!',ba_won:'انتصار! 🏆',ba_lost:'خسرنا… 💀',
  ba_won_s:'أصبح المستوى {l}',ba_lost_s:'عاد المستوى إلى {l}',ba_mvp:'الأقوى',ba_kills:'القتلى',ba_join1:'اكتب {a} لتدخل',ba_join2:'{a} اخترني · {b} لا تخترني · {c} اسم',ba_inq:'في الانتظار: {n}',ba_picked:'الفريق ({n}/{m})',
  ba_fight_j:'{a} اخترني · {c} اسم · {b} أثناء قتالك',ba_none:'لم يدخل أحد بعد',ba_st_lobby:'اللوبي: {s} في الفريق. اضغط "ابدأ المعركة" حين تكون جاهزًا.',ba_st_fight:'الموجة {w}: اختر من يخرج للقتال (اضغط عليه في الساحة أو في القائمة، أو "التالي"). {a} أحياء، {m} أعداء.',ba_st_duel:'{f} يقاتل {m}…',ba_st_break:'استراحة… الموجة القادمة بعد قليل.',ba_st_break_m:'تم تطهير الموجة. اضغط "التالي".',ba_autof:'قتال تلقائي (التالي يظهر تلقائيًا)',ba_pick_t:'من يخرج للقتال؟',ba_dodge:'تفادى!',ba_crit:'ضربة حرجة!',ba_block:'صد!',ba_frozen:'متجمد',ba_party:'الفريق',
  ba_st_won:'انتصرنا! أصبح المستوى {l}.',ba_st_lost:'خسرنا. عاد المستوى إلى {l}.',ba_st_paused:'متوقفة',ba_need:'لا يوجد أحد في الفريق بعد',ba_power_ready:'القوة جاهزة',ba_gion:'كرت معلومات الشخصية على الشاشة',ba_gion_n:'أطفئه إذا كنت تعتمد على رد البوت في الشات. حين يظهر الكرت: ✥ لتحريكه، ⤡ لتكبيره أو تصغيره، ↺ لإرجاعه بجانب الشخصية. يُحفظ كل ذلك تلقائيًا.',ba_pwt:'وقت شحن القوة بعد استخدامها',ba_pwt_n:'{n} أدوار',
  bt_c_skin:'اختر سكن ماينكرافت الخاص بك، مثل !سكن Dream. يعمل بعد الوصول إلى المستوى الذي يحدده الستريمر، وإلا تبقى شخصيتك ستيف. !سكن وحدها تعيدك إلى ستيف.',bt_c_join:'اكتب !دخول لتدخل الفريق مباشرة وتظهر في الساحة.',bt_c_jump:'يقفز شخصك في الساحة لمدة 5 ثوانٍ ثم يتوقف.',bt_c_hide:'ليس أنا الآن: يصبح شخصك شبه شفاف وتخرج للمبارزة في الآخر.',bt_c_vote:'صوّت لمن يخرج للمبارزة التالية، مثل: !صوت محمد. يظهر عدد الأصوات ★ فوق رأسه.',bt_c_power:'أثناء مبارزتك فقط: تطلق قوتك الخاصة (برق، شفاء، TNT…). تبدأ المبارزة وقوتك جاهزة: أيقونتها تتوهج بجانب شريط صحتك. بعد استخدامها تُشحن من جديد خلال عدد من أدوارك يحدده الستريمر؛ تمتلئ الدائرة حول الأيقونة ويظهر عدد الأدوار الباقية، وحين تمتلئ تتوهج من جديد ويمكنك استخدامها مرة أخرى.',bt_c_focus:'اختر العدو الذي تريد مواجهته حين يخرجك الستريمر، مثل: !ركز زعيم أو !ركز هيكل.',bt_c_start:'ابدأ المعركة',bt_c_pause:'إيقاف / استئناف',bt_c_next:'أخرج المقاتل التالي',bt_c_boss:'اذهب إلى موجة الزعيم',ba_eff_super:'فعّال جدًا!',ba_eff_resist:'مقاوم',ba_eff_immune:'مناعة!',ba_st_burn:'🔥 احتراق',ba_st_poison:'🧪 تسمم',ba_st_wither:'💀 ذبول',ba_stun:'💫 دائخ',ba_split:'انقسم!',ba_totem:'🗿 قام من الموت!',ba_save:'❤ نجا!',ba_phase:'المرحلة الثانية!',ba_loot:'🎁 غنيمة:',ba_boom:'💥 انفجر!',ba_mheal:'🧪 شربت جرعة!',ba_sp_sonic:'صرخة صوتية!',ba_sp_roar:'زئير!',ba_sp_charge:'هجمة!',bt_c_info:'يعرض بطاقتك: الصنف والمستوى والصحة والهجوم والدفاع والقدرات والعدّة. واكتب اسم لاعب بعده لترى بطاقته.',bt_c_cancel:'',bt_c_class:'غيّر صنفك',ba_speak:'المرشحون يتحدثون (كلامهم فوق رؤوسهم)',ba_events:'أحداث الموجات (ليل، مطر، كنز…)',ba_lootopt:'غنائم بعد كل موجة',ba_resetgear:'امسح العدّة والأصناف',ba_resetq:'هل أنت متأكد؟ ستعود عدّة الجميع إلى البداية',gi_hp:'صحة',gi_atk:'هجوم',gi_def:'دفاع',gi_spd:'سرعة',gi_agi:'تفادي',gi_crit:'ضربة حرجة',gi_xp:'خبرة',gi_perks:'القدرات',gi_res:'مقاوم',gi_weak:'ضعيف أمام',gi_imm:'مناعة',gi_gear:'العدّة',gi_items:'أغراض',gi_power:'القوة',gi_used:'استُخدمت',gi_ready:'جاهزة',gi_kills:'القتلى',gi_fam:'الفصيلة',gi_trait:'ميزة',gi_p2:'بنصف صحته',gi_boss:'زعيم',gi_none:'لا شيء',gi_out:'ليس في الفريق',gi_dmg:'ضرر',gi_armour:'درع',gi_type:'ضربه',gi_max:'أعلى مستوى',ba_card_t:'!معلومات',bt_c_infomob:'',
  ba_help_t:'شرح اللعبة والأوامر',ba_help_how:'طريقة اللعب',ba_help_all:'أوامر الشات للجميع',ba_help_mod:'للستريمر والمشرفين',ba_help_keys:'اختصارات لوحة المفاتيح',ba_add_j2:'أضف من قفزوا',ba_lobby_b:'اللوبي',ba_next2:'التالي',ba_jcount:'تبدأ المعركة بعد {s} ث',
  ba_m_add:'➕ أضفه إلى الفريق',ba_m_rem:'⛔ طرد',ba_m_full:'الفريق ممتلئ',ba_gi_drag:'اسحب للتحريك',ba_gi_rs:'اسحب لتكبير البطاقة أو تصغيرها',ba_gi_rt:'أرجعها بجانب الشخصية',ba_fs:'شاشة كاملة',ba_fs_x:'الخروج من الشاشة الكاملة',ba_close:'إغلاق',
  ba_h1:'يكتب المشاهدون !دخول فيدخلون الفريق مباشرة ويظهرون في الساحة.',ba_h2:'تستطيع طرد أي لاعب: اضغط على اسمه في الساحة أو في ⚙ ثم «طرد». وحين تكون جاهزًا اضغط «ابدأ المعركة».',ba_h3:'كل موجة: تختار من يخرج إلى منتصف الجسر ليبارز وحشًا واحدًا ضد واحد، ضربة بضربة. ومن يبارز يطلق قوته بـ !قوة حين يتوهّج القلب البني.',ba_h4:'بعد كل موجة استراحة وغنائم، والموجة الأخيرة فيها الزعيم (له مرحلة ثانية عند نصف صحته).',ba_h5:'الفوز: اهزموا الزعيم فيرتفع مستوى الخريطة. وإذا سقط الفريق كله تخسرون ويرجع المستوى.'},
 en:{g_title:'Arena Battle',g_how:'Chat joins with !join and goes straight into the squad. In every wave you choose who walks out for a 1v1 duel in the middle, then the boss. The one fighting fires their power with !power.',
  ba_start:'Start battle',ba_again:'New battle',ba_pause:'Pause',ba_resume:'Resume',ba_next:'Next ⚔️',ba_boss:'Go to the boss',ba_reset:'Back to lobby',ba_squad:'Squad',ba_wait:'Waiting',
  ba_add_j:'Add jumpers ⬆',ba_add_r:'Add random',ba_empty:'Empty squad',ba_hint:'Whoever types !join is in the squad right away. Before the raid: click a name to kick it. During the raid: click a fighter (on the map or here ⚔) to send them out for a 1v1. Click a mob or the boss to see its stats.',ba_noleave:'can’t leave once the battle has started',
  bt_settings:'Settings',ba_wcard:'Wave screen closes by itself after',ba_bot:'Reply in chat (needs a bot account)',ba_bot_n:'When on, a bot posts the !getinfo answer in Twitch chat instead of the screen. It needs a bot account that can write in chat; until one is linked the card stays on screen.',ba_waves:'Waves',ba_diff:'Difficulty',ba_d_easy:'Easy',ba_d_normal:'Normal',ba_d_hard:'Hard',ba_d_hell:'Hell',ba_break:'Next wave by itself after',bt_more:'More options',
  ba_bosssel:'Boss',ba_b_auto:'From the map',boss_wither:'The Wither',boss_dragon:'Ender Dragon',boss_golem:'Iron Guardian',boss_king:'Zombie King',boss_warden:'Deep Warden',boss_ravagerk:'Ravager King',boss_evokerm:'Evoker Lord',boss_blazek:'Blaze King',boss_elder:'Elder Guardian',ba_size:'Squad size',bt_join_t:'Join time',
  ba_autop:'Power fires by itself if nobody types !power',bt_av:'Twitch pictures on heads',bt_map:'Map',bt_nolimit:'No limit',bt_manual:'You press',bt_sec:'s',
  map_plains:'Plains',map_desert:'Desert',map_nether:'Nether',map_end:'The End',map_cave:'Cave',
  ba_wave:'Wave {w}/{n}',ba_wave_inf:'Wave {w}',ba_lvl:'{m} · Level {l}',ba_lobby_t:'Lobby',ba_boss_w:'Boss wave!',ba_wave_b:'Wave {w}',ba_cleared:'Wave cleared!',ba_won:'Victory! 🏆',ba_lost:'Defeated… 💀',
  ba_won_s:'Level is now {l}',ba_lost_s:'Level back to {l}',ba_mvp:'MVP',ba_kills:'kills',ba_join1:'Type {a} to join',ba_join2:'{a} pick me · {b} not me · {c} name',ba_inq:'Waiting: {n}',ba_picked:'Squad ({n}/{m})',
  ba_fight_j:'{a} pick me · {c} name · {b} in your duel',ba_none:'Nobody joined yet',ba_st_lobby:'Lobby: {s} in the squad. Press "Start battle" when you are ready.',ba_st_fight:'Wave {w}: choose who walks out (click them on the map or in the list, or "Next"). {a} alive, {m} enemies.',ba_st_duel:'{f} is fighting {m}…',ba_st_break:'Break… next wave soon.',ba_st_break_m:'Wave cleared. Press "Next".',ba_autof:'Auto fight (next fighter goes by itself)',ba_pick_t:'Who walks out to fight?',ba_dodge:'DODGE',ba_crit:'CRIT',ba_block:'BLOCK',ba_frozen:'Frozen',ba_party:'Party',
  ba_st_won:'Victory! Level is now {l}.',ba_st_lost:'Defeated. Level back to {l}.',ba_st_paused:'Paused',ba_need:'Nobody in the squad yet',ba_power_ready:'Power ready',ba_gion:'Character info card on screen',ba_gion_n:'Turn it off if you rely on the bot reply in chat. When the card shows: ✥ moves it, ⤡ makes it bigger or smaller, ↺ puts it back beside the character. All saved automatically.',ba_pwt:'Power recharge after use',ba_pwt_n:'{n} turns',
  bt_c_skin:'Use your own Minecraft skin, e.g. !skin Dream. Works once you reach the level the streamer set; until then you are Steve. !skin alone goes back to Steve.',bt_c_join:'Type !join to go straight into the squad and appear on the field.',bt_c_jump:'Your character bounces on the field for 5 seconds, then stops.',bt_c_hide:'Not me for now: your character turns see-through and you fight last.',bt_c_vote:'Vote who goes out for the next duel, e.g. !vote Mohammad. The vote count ★ shows over their head.',bt_c_power:'Only during your duel: fire your own power (bolt, heal, TNT…). It starts ready: its icon glows next to your HP bar. After use it recharges over a number of your turns set by the streamer; the ring around the icon fills and shows the turns left, then it glows again and you can use it again.',bt_c_focus:'Choose which enemy you face when the streamer sends you out, e.g. !focus boss or !focus skeleton.',bt_c_start:'start the battle',bt_c_pause:'pause / resume',bt_c_next:'send the next fighter',bt_c_boss:'go to the boss wave',ba_eff_super:'Super effective!',ba_eff_resist:'Resisted',ba_eff_immune:'Immune!',ba_st_burn:'🔥 Burning',ba_st_poison:'🧪 Poisoned',ba_st_wither:'💀 Withering',ba_stun:'💫 Stunned',ba_split:'Split!',ba_totem:'🗿 Rose from death!',ba_save:'❤ Survived!',ba_phase:'Phase two!',ba_loot:'🎁 Loot:',ba_boom:'💥 Exploded!',ba_mheal:'🧪 Drank a potion!',ba_sp_sonic:'Sonic boom!',ba_sp_roar:'Roar!',ba_sp_charge:'Charge!',bt_c_info:'Shows your card: class, level, HP, attack, defence, abilities and gear. Add a player name to see theirs.',bt_c_cancel:'',bt_c_class:'Change your class',ba_speak:'Candidates can speak (their chat over their head)',ba_events:'Wave events (night, rain, treasure…)',ba_lootopt:'Loot after every wave',ba_resetgear:'Reset gear and classes',ba_resetq:'Sure? Everyone’s gear goes back to the start',gi_hp:'HP',gi_atk:'ATK',gi_def:'DEF',gi_spd:'SPD',gi_agi:'Dodge',gi_crit:'Crit',gi_xp:'XP',gi_perks:'Abilities',gi_res:'Resists',gi_weak:'Weak to',gi_imm:'Immune',gi_gear:'Gear',gi_items:'Items',gi_power:'Power',gi_used:'used',gi_ready:'ready',gi_kills:'kills',gi_fam:'Family',gi_trait:'Trait',gi_p2:'At half HP',gi_boss:'Boss',gi_none:'none',gi_out:'not in the squad',gi_dmg:'DMG',gi_armour:'Armour',gi_type:'Hits with',gi_max:'max level',ba_card_t:'!getinfo',bt_c_infomob:'',
  ba_help_t:'How to play & commands',ba_help_how:'How to play',ba_help_all:'Chat commands for everyone',ba_help_mod:'Streamer & mods',ba_help_keys:'Keyboard shortcuts',ba_add_j2:'Add jumpers',ba_lobby_b:'Lobby',ba_next2:'Next',ba_jcount:'Battle starts in {s} s',
  ba_m_add:'➕ Add to the squad',ba_m_rem:'⛔ Kick',ba_m_full:'The squad is full',ba_gi_drag:'Drag to move',ba_gi_rs:'Drag to make the card bigger or smaller',ba_gi_rt:'Back beside the character',ba_fs:'Fullscreen',ba_fs_x:'Exit fullscreen',ba_close:'Close',
  ba_h1:'Viewers type !join and go straight into the squad, on the field.',ba_h2:'You can kick anyone: click their name on the field or in ⚙, then «Kick». When you are ready press “Start battle”.',ba_h3:'Every wave you choose who walks to the middle of the bridge for a 1v1 duel with one mob, blow for blow. The fighter fires their power with !power when the brown heart glows.',ba_h4:'After each wave comes a short break and loot; the last wave holds the boss (it gets a second phase at half HP).',ba_h5:'To win: beat the boss and the map level goes up. If the whole squad falls you lose and the level drops back.'}
});
/* Nov 7 (round 5): power by hand, random loadouts, random map + 3 new maps, new mobs / bosses */
A.strings({
 ar:{map_snow:'الثلج',map_jungle:'الأدغال',map_ocean:'أطلال المحيط',map_random:'عشوائي',ba_rmap:'🎲 خريطة عشوائية:',boss_abom:'وحش الأدغال',boss_wraith:'الطيف الملعون',
  ba_pwr:'سرعة امتلاء القوة',ba_pwr_slow:'بطيئة',ba_pwr_normal:'عادية',ba_pwr_fast:'سريعة',ba_pw_ready:'اكتب !قوة',ba_pw_armed:'⚡ القوة جاهزة للمبارزة',ba_pw_full:'القوة امتلأت! اكتب !قوة',
  ba_sp_chill:'❄ كتلة جليد!',ba_sp_enrage:'😡 هاج!',ba_sp_leap:'🌿 قفزة!',ba_regen:'+{n}',ba_ph_fury:'الغضب الأخير',
  bt_c_power:'قوتك (القلب البني وشريطه تحت صحتك) تمتلئ ببطء: مع كل ضربة تضربها، وكل ضربة تتلقاها، وقليلًا وأنت تتفرج على فريقك. لا تنطلق وحدها أبدًا: حين تمتلئ يتوهّج القلب ويظهر «!قوة» فوق رأسك — اكتب !قوة لتطلقها في مبارزتك. إن كتبتها وأنت تنتظر، تنطلق أول دورك في مبارزتك التالية. بعد إطلاقها تبدأ تمتلئ من الصفر.',
  ba_h3:'كل موجة: تختار من يخرج إلى منتصف الجسر ليبارز وحشًا واحدًا ضد واحد، ضربة بضربة. القلب البني (القوة) يمتلئ ببطء، وحين يتوهّج يكتب صاحبه !قوة ليطلقها — لا تنطلق وحدها.',
  ba_h4:'بعد كل موجة استراحة وغنائم. والموجة الأخيرة فيها الزعيم: مرحلة ثانية عند نصف صحته، وغضب أخير عند الربع.',
  ba_h6:'كل لعبة جديدة: كل لاعب يأخذ صنفًا وسلاحًا وعدّة وقوة عشوائية (السهم، السيف، TNT، العصا…). المستوى والخبرة يبقيان.',
  ba_h7:'الخرائط: سهول، صحراء، النذر، النهاية، الكهف، الثلج، الأدغال، أطلال المحيط — أو «عشوائي» فتتغير الخريطة كل لعبة. كل فوز يرفع مستوى الخريطة فتصبح أصعب.',
  gi_pc:'{p}%'},
 en:{map_snow:'Snowy peaks',map_jungle:'Jungle',map_ocean:'Ocean ruins',map_random:'Random',ba_rmap:'🎲 Random map:',boss_abom:'Jungle Abomination',boss_wraith:'Wretched Wraith',
  ba_pwr:'Power fill speed',ba_pwr_slow:'Slow',ba_pwr_normal:'Normal',ba_pwr_fast:'Fast',ba_pw_ready:'type !power',ba_pw_armed:'⚡ power set for the duel',ba_pw_full:'Power full! Type !power',
  ba_sp_chill:'❄ Ice chunk!',ba_sp_enrage:'😡 Enraged!',ba_sp_leap:'🌿 Leap!',ba_regen:'+{n}',ba_ph_fury:'Last fury',
  bt_c_power:'Your power (the brown heart and its bar under your HP) fills slowly: with every blow you strike, every blow you take, and a little while you watch your team. It never fires by itself: when it is full the heart glows and “!power” shows over your head — type !power to fire it in your duel. Typed while you wait, it fires on your first turn of your next duel. After use it fills again from zero.',
  ba_h3:'Every wave you choose who walks to the middle of the bridge for a 1v1 duel with one mob, blow for blow. The brown heart (power) fills slowly; when it glows its owner types !power to fire it — it never fires by itself.',
  ba_h4:'After each wave comes a short break and loot. The last wave holds the boss: a second phase at half HP and a last fury at a quarter.',
  ba_h6:'Every new game each player gets a random class, weapon, gear and power (bow, sword, TNT, staff…). Level and XP carry over.',
  ba_h7:'Maps: Plains, Desert, Nether, The End, Cave, Snowy peaks, Jungle, Ocean ruins — or “Random” for a new map every game. Each win raises the map level, so it gets harder.',
  gi_pc:'{p}%'}
});
function T(k,o){var s=A.t(k);if(o)Object.keys(o).forEach(function(x){s=s.split('{'+x+'}').join(o[x])});return s;}
var EN=function(){return A.lang()==='en'};
var MAPS=['plains','desert','nether','end','cave','snow','jungle','ocean'];
var KEY='lamma-ba-'+A.channel,store=BT.store(KEY),sv=A.obs?null:store.get();
var CFG={card:0,bot:false,waves:5,diff:'normal',brk:4,map:'nether',boss:'auto',size:10,join:0,pwR:'normal',giOn:true,giX:null,giY:null,giW:0,giS:1,av:true,autoF:false,speak:true,events:true,loot:true};
if(sv&&sv.cfg)Object.keys(CFG).forEach(function(k){if(sv.cfg[k]!=null)CFG[k]=sv.cfg[k]});
var Q=A.Q;if(A.obs){if(Q.get('map')&&(MAPS.indexOf(Q.get('map'))>=0||Q.get('map')==='random'))CFG.map=Q.get('map');if(Q.get('wv')!=null)CFG.waves=+Q.get('wv')||0;if(Q.get('df'))CFG.diff=Q.get('df');if(Q.get('av'))CFG.av=Q.get('av')==='1';if(Q.get('bs'))CFG.boss=Q.get('bs');if(Q.get('af'))CFG.autoF=Q.get('af')==='1';if(Q.get('wc')!=null)CFG.card=+Q.get('wc')||0;if(Q.get('gi')==='0')CFG.giOn=false;if(Q.get('gx')!=null&&Q.get('gy')!=null){CFG.giX=+Q.get('gx');CFG.giY=+Q.get('gy');}if(Q.get('gw'))CFG.giW=+Q.get('gw');if(Q.get('gs'))CFG.giS=+Q.get('gs');}
var E=new BT.Arena({cfg:{cardSecs:+CFG.card||0,waves:CFG.waves,diff:CFG.diff,squadMax:+CFG.size||10,map:realMap(CFG.map),boss:CFG.boss,autoPower:false,pwRate:CFG.pwR||'normal',autoFight:!!CFG.autoF,breakSecs:CFG.brk,speak:CFG.speak,events:CFG.events,loot:CFG.loot}});
if(sv){E.levels=sv.levels||{};E.xp=sv.xp||{};} /* Nov 7: gear / classes no longer carry over — every game rolls a new loadout */
/* «عشوائي»: a real map is drawn at the start of every game (never the same one twice in a row) */
function realMap(m){return MAPS.indexOf(m)>=0?m:(E&&MAPS.indexOf(E.cfg.map)>=0?E.cfg.map:MAPS[Math.floor(Math.random()*MAPS.length)]);}
function pickMap(){if(CFG.map!=='random')return false;var last=E.cfg.map,pool=MAPS.filter(function(m){return m!==last});E.cfg.map=pool[Math.floor(Math.random()*pool.length)];return true;}
function applyCfg(){E.cfg.cardSecs=+CFG.card||0;E.cfg.autoFight=!!CFG.autoF;if(E.phase==='pick')E.toPick();E.cfg.waves=+CFG.waves;E.cfg.diff=CFG.diff;E.cfg.squadMax=+CFG.size||10;if(CFG.map!=='random')E.cfg.map=CFG.map;E.cfg.boss=CFG.boss;E.cfg.autoPower=false;E.cfg.pwRate=CFG.pwR||'normal';E.cfg.breakSecs=+CFG.brk;E.cfg.speak=!!CFG.speak;E.cfg.events=!!CFG.events;E.cfg.loot=!!CFG.loot;}
function save(){if(A.obs)return;store.set({cfg:CFG,levels:E.levels,xp:E.xp});A.updateObsUrl();}
A.obsExtra(function(){return '&map='+CFG.map+'&wv='+CFG.waves+'&df='+CFG.diff+'&bs='+CFG.boss+'&av='+(CFG.av?1:0)+'&af='+(CFG.autoF?1:0)+'&wc='+(+CFG.card||0)+(CFG.giOn===false?'&gi=0':'')+(CFG.giX!=null&&CFG.giY!=null?'&gx='+(+CFG.giX).toFixed(3)+'&gy='+(+CFG.giY).toFixed(3):'')+(CFG.giW?'&gw='+(+CFG.giW).toFixed(3):'')+(CFG.giS&&CFG.giS!==1?'&gs='+(+CFG.giS).toFixed(2):'');});
var P=E.pub(); /* the state both sides draw */
if(/[?&]qa=1(&|$)/.test(location.search))window.__BA={E:E,sync:function(){P=E.pub();A.publish(P);hud(true);},cfg:CFG,fxk:function(){return fx.map(function(f){return f.k+':'+(f.st||'')});},slow:function(k){QS=k;}}; /* test hook (only with ?qa=1) */
/* Nov 6: every publish from the control page carries where the host put the !معلومات card, so the OBS overlay follows live */
if(!A.obs&&A.publish){var _pub=A.publish;A.publish=function(s){if(s&&typeof s==='object'){s.gp=[CFG.giX,CFG.giY,CFG.giS||1];s.jp=jumpList();s.jc=joinEnd&&E.phase==='lobby'?Math.max(0,Math.ceil((joinEnd-Date.now())/1000)):0;}return _pub.apply(this,arguments);};}

/* ---------- engine loop (control, or overlay alone) ---------- */
var lastT=performance.now(),pubAt=0,joinEnd=0;
function engine(){return A.runsEngine();}
setInterval(function(){var now=performance.now(),dt=(now-lastT)/1000;lastT=now;if(!engine())return;
  var ph=E.phase;if(giHold&&E.info)E.info.until=Math.max(E.info.until||0,(E.ct||0)+1.5);E.step(dt*QS);if(E.phase!==ph&&(E.phase==='won'||E.phase==='lost'||E.phase==='break'))save();
  if(E.phase!==ph&&(E.phase==='won'||E.phase==='lost')){var sq=E.squad.map(function(u){return [u,(E.waiting[u]||{}).name||u]});A.roundEnd({players:sq,winners:E.phase==='won'?sq:[]});}
  P=E.pub();if(now-pubAt>120){pubAt=now;A.publish(P);}
  if(E.phase==='lobby'&&joinEnd&&Date.now()>=joinEnd){joinEnd=0;startBattle();}
},33);
A.onMirror(function(s){if(s&&s.f){P=s;if(s.jp){var nw=Date.now();JUMPM={};Object.keys(s.jp).forEach(function(u){JUMPM[u]=nw+(+s.jp[u]||0);});}if(s.gp&&A.obs){CFG.giX=s.gp[0];CFG.giY=s.gp[1];CFG.giS=s.gp[2]||1;}}});
/* Nov 6 (Mohammad): a click anywhere outside the !معلومات card closes it (inside it you move / resize it) */
if(!A.obs)document.addEventListener('pointerdown',function(ev){if(!P.gi)return;var el=$('baInfo');if(giEditing())return;if(!el||el.hidden||el.contains(ev.target))return;var t=ev.target;if(t.closest&&t.closest('#side,.ba-help,.ba-cmenu'))return;closeInfo();},true);
A.allowSolo();
function startBattle(){applyCfg();var rnd=pickMap();if(!E.start()){status(T('ba_need'));baToast(T('ba_need'));return;}A.roundStart();A.sfx('start');P=E.pub();A.publish(P);hud(true);if(rnd)setTimeout(function(){banner(T('ba_rmap')+' '+T('map_'+E.cfg.map),true);},400);}
function nextOrAgain(){var again=E.phase==='won'||E.phase==='lost',rnd=again&&pickMap();E.next();P=E.pub();A.publish(P);hud(true);if(rnd&&E.inRaid())setTimeout(function(){banner(T('ba_rmap')+' '+T('map_'+E.cfg.map),true);},400);}
function pauseT(){if(!E.inRaid())return;E.paused=!E.paused;P=E.pub();A.publish(P);hud(true);}
function toLobby(){var keep=E.squad.slice();if(E.phase!=='lobby'&&E.phase!=='won'&&E.phase!=='lost')E.gameNo++; /* a game stopped half-way also counts: the next one rolls new loadouts */E.reset();E.squad=keep;fillSquad();V={};P=E.pub();A.publish(P);hud(true);}
/* Nov 6 (Mohammad): no waiting list — whoever types !دخول / !join goes straight into the squad; the host can kick anyone.
   Someone who joins during a battle steps in when it is back in the lobby. A full squad = a short «الفريق ممتلئ» note. */
function baToast(t){if(A.obs)return;var el=$('baToast');if(!el){el=document.createElement('div');el.id='baToast';el.className='ba-toast';el.setAttribute('role','status');document.body.appendChild(el);}
  el.textContent=t;el.classList.add('on');clearTimeout(el._t);el._t=setTimeout(function(){el.classList.remove('on');},2600);}
function fullNote(n){baToast('⚠ '+T('ba_m_full')+(n?' — '+n:''));}
function joinNow(u,n,c){if(n!==undefined)E.join(u,n,c);var w=E.waiting[u];if(!w||E.squad.indexOf(u)>=0)return;if(E.phase!=='lobby')return;
  if(!E.pick(u)){fullNote(w.name);E.leave(u);}}
function fillSquad(){if(E.phase!=='lobby')return;E.order.slice().forEach(function(u){if(E.squad.indexOf(u)>=0)return;var w=E.waiting[u];if(!E.pick(u)){if(w)fullNote(w.name);E.leave(u);}});}
function kick(u){if(E.inRaid())return false;var ok=E.leave(u);if(ok){P=E.pub();A.publish(P);hud(true);}return ok;}
A.onChat(function(m){if(!engine())return;var c=BT.cmd(m.text);
  if(!c){if(E.say(m.user,m.text))hudSoon();return;}
  if(BT.MODK[c.k]&&A.isCtrl(m)){if(c.k==='start'){if(E.inRaid()){if(E.paused)pauseT();}else startBattle();}else if(c.k==='pause')pauseT();else if(c.k==='next'){nextOrAgain();}else if(c.k==='boss')E.summonBoss();else if(c.k==='reset')toLobby();return;}
  /* Nov 6 (Mohammad): !الغي / !stop are gone (a viewer's !وقف / !stop / !الغي does nothing; a mod's !وقف still pauses, above) */
  if(c.k==='cancel'||BT.MODK[c.k])return;
  if(c.k==='join')joinNow(m.user,m.name,m.color);
  else if(c.k==='leave'){ /* Nov 6 (Mohammad): once the battle has started nobody can leave; in the lobby !خروج still works */
    if(E.phase!=='lobby'){if(E.waiting[m.user])baToast('⛔ '+(E.waiting[m.user].name||m.name)+' — '+T('ba_noleave'));return;}E.leave(m.user);}
  else if(c.k==='jump'){jumpFx(m.user);return;} /* Nov 6 (Mohammad): !قفز = your character bounces for 5 s, nothing else */
  else if(c.k==='hide'){E.hide(m.user);joinNow(m.user);}
  else if(c.k==='vote')E.vote(m.user,c.arg);else if(c.k==='power')E.power(m.user);else if(c.k==='focus')E.focus(m.user,c.arg);else if(c.k==='info'){if(c.arg&&!playerArg(c.arg)){hudSoon();return;} /* Nov 6 (Mohammad): no more enemy cards — «!معلومات زومبي» does nothing; only your own card or a player's */if(!(CFG.bot&&BT.bot.ready()&&BT.bot.say(infoText(m.user,c.arg))))E.askInfo(m.user,c.arg,m.name,m.color);}
  hudSoon();});
/* the streamer sends one fighter into the middle (click on the map, the list, or "التالي") */
/* !معلومات <name>: only a player who joined (enemy / boss names are ignored since Nov 6) */
function playerArg(arg){var a=String(arg||'').trim().replace(/^@/,'');if(!a)return true;var n=BT.norm(a);return E.order.some(function(u){var w=E.waiting[u];return u===a.toLowerCase()||BT.norm(u)===n||(w&&BT.norm(w.name)===n);});}
/* !معلومات as one chat line, for the bot path (only used once a bot account is linked) */
function infoText(u,arg){var g=null;try{E.askInfo(u,arg,'','');g=E.infoQ.length?E.infoQ.pop():(E.info&&E.info.u===u?E.info:null);if(g===E.info)E.info=null;}catch(x){}
  if(!g)return '';if(g.t==='m'){var S=g.boss?BTR.BOSSES[g.kind]:BTR.MOBS[g.kind];return (S?(EN()?S.en:S.ar):g.kind)+' · LV '+g.lv+' · ❤️ '+g.hp+'/'+g.max+' · 🗡️ '+g.dmg+' · 🛡️ '+g.def+'%';}
  var C=BTR.CLASSES[g.cls]||{};return '@'+g.name+' · '+(C.ic||'')+' '+(EN()?C.en:C.ar)+' · LV '+g.lv+' · ❤️ '+g.hp+'/'+g.max+' · 🗡️ '+g.atk+' · 🛡️ '+g.def+'% · 🎯 '+g.crit+'%';}
/* !قفز / !jump: the player's character hops on the spot for 5 seconds, then stops. It changes nothing in the game.
   The control page holds the clock and every publish carries who is hopping (and for how long) so the OBS overlay hops too. */
var JUMP={},JUMPM={},JUMP_MS=5000;
function jumpFx(u){if(!E.waiting[u]&&!E.fOf(u))return false;JUMP[u]=Date.now()+JUMP_MS;P.jp=jumpList();return true;}
function jumpList(){var now=Date.now(),o={};Object.keys(JUMP).forEach(function(u){var r=JUMP[u]-now;if(r>0)o[u]=r;else delete JUMP[u];});return o;}
function isJumping(u){var now=Date.now();return engine()?(JUMP[u]||0)>now:(JUMPM[u]||0)>now;}
/* in the lobby the characters aren't on the field yet, so the name in the squad card hops instead */
setInterval(function(){var l=document.querySelectorAll('#baLobbyCard li[data-u]');for(var i=0;i<l.length;i++){var on=isJumping(l[i].getAttribute('data-u'));if(l[i].classList.contains('ba-hop')!==on)l[i].classList.toggle('ba-hop',on);}},150);
function sendF(u){if(E.phase!=='pick')return false;var ok=E.send(u);if(ok){P=E.pub();A.publish(P);hud(true);}return ok;}

/* ---------- view state ---------- */
var V={},lastEv=0,parts=[],nums=[],fx=[],shake=0,flashT=0,MIN={};
function bossP2(m){var k=String(m[1]||'').replace(/^boss:/,'');var B=BTR.BOSSES[k];return B?B.p2:'';}
var P2COL={fury:'rgba(255,40,30,A)',vines:'rgba(90,200,60,A)',blizzard:'rgba(190,230,255,A)',armour:'rgba(120,200,255,A)',crystal:'rgba(255,120,230,A)',rage:'rgba(255,60,40,A)',summon:'rgba(120,220,90,A)',charge:'rgba(255,170,40,A)',storm:'rgba(255,120,30,A)',fatigue:'rgba(120,200,160,A)',totem:'rgba(255,220,80,A)'};
function addParts(x,y,z,n,col,spd,size,life){for(var i=0;i<n;i++)parts.push({x:x,y:y,z:z,vx:(Math.random()-.5)*spd,vy:(Math.random()-.5)*spd,vz:Math.random()*spd*1.2+.5,life:life||(.5+Math.random()*.5),t:0,col:col[Math.floor(Math.random()*col.length)],s:size||(.06+Math.random()*.06)});}
function vOf(id){return V['f'+id]||V['m'+id]||null;}
function floatTxt(id,txt,col,big,small){var v=vOf(id);if(!v)return;var near=nums.filter(function(n){return n.id===id&&n.t<.35&&!!n.small===!!small}).length;nums.push({id:id,x:v.x,y:v.y,z:(v.h||2.2)+(V['f'+id]===v?1.25:.45)+near*.55,txt:txt,col:col,big:big,small:small,t:0,dx:(Math.random()-.5)*.25});}
/* ---------- Nov 7 (Mohammad: "the hits need work — arrows if I have a bow, a sword swing if I have a sword, TNT if I have explosives") ----------
   Every blow now has the attack of its weapon: bow → an arrow flies, sword / axe / dagger → a swing and a slash at the target,
   TNT → a thrown TNT block that explodes, staff → a magic orb, wand → a fireball, flasks → a thrown potion that splashes.
   Monsters too (skeletons shoot arrows, blazes fireballs, witches potions, evokers / guardians magic, ghasts / breezes blasts, melee mobs claw).
   The damage number, hit flash, knockback and sound land when the hit ARRIVES (the projectile's flight), not when it leaves. */
var PEND=[],PWH={};
var QS=1; /* view / engine speed (1 = real time; only the ?qa=1 test hook slows it to catch frames) */
function later(ms,fn){PEND.push({at:performance.now()+ms/QS,fn:fn});}
function fRow(id){var r=null;(P.f||[]).forEach(function(f){if(f[0]===id)r=f;});return r;}
function mRow(id){var r=null;(P.m||[]).forEach(function(m){if(m[0]===id)r=m;});return r;}
var WSTYLE={sword:'slash',axe:'chop',dagger:'stab',bow:'arrow',staff:'orb',wand:'fireball',tnt:'tnt',flask:'potion'};
var RANGED={arrow:1,orb:1,fireball:1,tnt:1,potion:1,morb:1,blastball:1,wind:1};
function styleOf(e){if(e.a==='f'){var r=fRow(e.from);var w=r?(BTR.CLASSES[r[18]]||BTR.CLASSES.warrior).w:'sword';return WSTYLE[w]||'slash';}
  var m=mRow(e.from),k=m?String(m[1]).replace(/^boss:/,''):'',t=e.how||'';
  if(k==='creeper')return 'claw';if(k==='breeze')return 'wind';
  return t==='arrow'?'arrow':t==='fire'?'fireball':t==='magic'?'morb':t==='poison'?'potion':t==='blast'?'blastball':'claw';}
function wTint(id){var r=fRow(id);return r?WCOL[r[21]||0]:'#ffffff';}
function impact(e,to,fr,st){
  if(e.dodge){floatTxt(e.to,T('ba_dodge'),'#bfe8ff',false);A.sfx('tick');if(to){to.dodgeT=1;to.dodgeS=Math.random()<.5?-1:1;}return;}
  if(e.block){floatTxt(e.to,'🛡 '+T('ba_block'),'#9fd8ff',false);if(to)fx.push({k:'ring',x:to.x,y:to.y,t:0,life:.4,col:'rgba(140,210,255,A)'});return;}
  if(to&&fr!==to){to.flash=.25;var ddx=to.x-fr.x,ddy=to.y-fr.y,dd=Math.sqrt(ddx*ddx+ddy*ddy)||1,kb=(e.c?.75:.42)*(st==='chop'||st==='tnt'||st==='blastball'?1.35:1);to.kbx=ddx/dd*kb;to.kby=ddy/dd*kb;to.kbt=1;
    addParts(to.x,to.y,1,e.c?12:6,e.a==='f'?['#fff','#ffe08a','#ff9a3d']:['#c22','#f55','#fff'],2.4,.06,.45);
    var hz=(to.h||2)*.55;
    if(st==='slash'||st==='chop'||st==='stab')fx.push({k:'slash',x:to.x,y:to.y,z:hz,t:0,life:st==='stab'?.18:.26,st:st,col:wTint(e.from),big:e.c?1:0});
    else if(st==='claw')fx.push({k:'claw',x:to.x,y:to.y,z:hz,t:0,life:.24,big:e.c?1:0});
    else if(st==='tnt'||st==='blastball'){fx.push({k:'boom',x:to.x,y:to.y,t:0,life:.5});fx.push({k:'ring',x:to.x,y:to.y,t:0,life:.45,col:'rgba(255,200,90,A)'});addParts(to.x,to.y,.4,26,['#fff','#ffd23d','#ff7a1a','#c33','#444'],4,.1,.8);shake=Math.max(shake,.55);A.sfx('boom');}
    else if(st==='potion'){fx.push({k:'ring',x:to.x,y:to.y,t:0,life:.5,col:'rgba(120,255,110,A)'});addParts(to.x,to.y,.6,18,['#5cd65c','#b6ff3b','#e8ffd0','#3a8a2a'],2.2,.07,.7);}
    else if(st==='orb'||st==='morb'){fx.push({k:'burst',x:to.x,y:to.y,z:hz,t:0,life:.3,col:st==='orb'?'rgba(150,170,255,A)':'rgba(200,110,255,A)'});addParts(to.x,to.y,.9,12,st==='orb'?['#bfc8ff','#fff','#7f8cff']:['#d9a6ff','#fff','#9a4ae0'],2,.06,.5);}
    else if(st==='fireball'){fx.push({k:'boom',x:to.x,y:to.y,t:0,life:.35});addParts(to.x,to.y,.8,16,['#ffd23d','#ff7a1a','#fff'],2.4,.07,.55);}
    else if(st==='wind'){fx.push({k:'ring',x:to.x,y:to.y,t:0,life:.4,col:'rgba(230,245,255,A)'});}
    else if(st==='arrow'){addParts(to.x,to.y,1.1,5,['#e8e8e8','#c8a060'],1.4,.05,.35);}}
  var hc=TYPE_COL[e.how]||null;
  if(e.c){floatTxt(e.to,T('ba_crit'),'#ffd23d',false,true);floatTxt(e.to,'-'+e.n,'#ffd23d',true);shake=Math.max(shake,.35);}else floatTxt(e.to,'-'+e.n,e.a==='f'?(hc||'#ffb347'):'#ff5a5a',false);
  if(e.eff==='super')floatTxt(e.to,T('ba_eff_super'),'#7dff7a',false,true);else if(e.eff==='resist')floatTxt(e.to,T('ba_eff_resist'),'#c8c8c8',false,true);else if(e.eff==='immune')floatTxt(e.to,T('ba_eff_immune'),'#9fd8ff',false,true);
  if(e.how==='thorns')floatTxt(e.to,'🌵','#7dff7a',false,true);
  if(st!=='tnt'&&st!=='blastball')A.sfx(e.c?'crit':'pop');}
function onEvent(e){
  if(e.k==='hit'){var to=vOf(e.to),fr=vOf(e.from);
    if(e.dot){var dc=e.how==='burn'?'#ff9a3d':e.how==='poison'?'#7dff5a':'#c9a0ff';if(to){to.flash=.12;addParts(to.x,to.y,1,4,e.how==='burn'?['#ffd23d','#ff7a1a']:e.how==='poison'?['#5cd65c','#b6ff3b']:['#3a2a4a','#8a6ab0'],1,.05,.5);}floatTxt(e.to,'-'+e.n,dc,false);return;}
    var pw=fr&&e.a==='f'&&PWH[e.from]&&performance.now()-PWH[e.from]<400;
    if(!fr||e.env||e.how==='thorns'||pw||fr===to){impact(e,to,fr||to,'');return;}
    var st=styleOf(e),ranged=!!RANGED[st];
    if(ranged){fr.cast=1;var fz=(fr.h||2)*.62,tz=(to?to.h||2:2)*.55;
      if(to){var dist=Math.sqrt((to.x-fr.x)*(to.x-fr.x)+(to.y-fr.y)*(to.y-fr.y));var thrown=st==='tnt'||st==='potion';var life=Math.max(.18,Math.min(.5,dist*(thrown?.075:.045)));
        fx.push({k:'proj',st:st,mob:e.a!=='f',x:fr.x,y:fr.y,z0:fz,tx:to.x+(e.dodge?(Math.random()<.5?-.9:.9):0),ty:to.y+(e.dodge?.6:0),z1:tz,arc:thrown?1.6:st==='arrow'?.35:.15,t:0,life:life,col:wTint(e.from),crit:e.c});
        later(life*1000,function(){impact(e,to,fr,st);});}
      else impact(e,to,fr,st);}
    else{fr.lunge=1;later(130,function(){impact(e,to,fr,st);});}}
  else if(e.k==='status'){floatTxt(e.to,T('ba_st_'+e.st),e.st==='burn'?'#ff9a3d':e.st==='poison'?'#7dff5a':'#c9a0ff',false,true);}
  else if(e.k==='immune'){floatTxt(e.to,T('ba_eff_immune'),'#9fd8ff',false,true);}
  else if(e.k==='stun'){floatTxt(e.to,T('ba_stun'),'#ffe680',false,true);}
  else if(e.k==='split'){var sv2=vOf(e.to);if(sv2)addParts(sv2.x,sv2.y,.5,18,['#7ad65c','#5cb848','#c84a1a'],2,.08,.7);floatTxt(e.to,T('ba_split'),'#b6ff3b',false,true);}
  else if(e.k==='totem'){var tv=vOf(e.to);if(tv)addParts(tv.x,tv.y,1,30,['#ffd23d','#7dff7a','#fff'],2.5,.08,1.1);floatTxt(e.to,T('ba_totem'),'#ffd23d',true);flashT=.2;A.sfx('win');}
  else if(e.k==='save'){floatTxt(e.to,T('ba_save'),'#ff7a9a',false,true);}
  else if(e.k==='phase'){banner(T('ba_phase')+' '+(EN()?BTR.PHASE2[e.p].en:BTR.PHASE2[e.p].ar),true);shake=1.2;flashT=.35;A.sfx('boom');
    /* Mohammad #18: every boss phase has its own visible animation */
    var bv=vOf(e.to);if(bv){var col=P2COL[e.p]||'rgba(255,255,255,A)';fx.push({k:'ring',x:bv.x,y:bv.y,t:0,life:.9,col:col});fx.push({k:'ring',x:bv.x,y:bv.y,t:-.25,life:.9,col:col});bv.flash=.6;
      var pc={armour:['#bfe8ff','#7fd0ff','#fff'],crystal:['#ff9ae8','#d070ff','#fff'],rage:['#ff4a2a','#ffb347','#fff'],summon:['#5cb848','#3a7a2a','#a07050'],charge:['#ffb347','#ffd23d'],storm:['#ff7a1a','#ffd23d','#c33'],fatigue:['#7ad6a0','#3a8a6a'],totem:['#ffd23d','#fff']}[e.p]||['#fff'];
      addParts(bv.x,bv.y,1,60,pc,3.4,.11,1.3);
      if(e.p==='summon'){MIN[e.to]=[{ox:-1.15,oy:.75,born:performance.now(),lunge:0},{ox:-1.15,oy:-.75,born:performance.now()+250,lunge:0}];MIN[e.to].forEach(function(mn){addParts(bv.x+mn.ox,bv.y+mn.oy,0,16,['#6b4a2a','#8a6a3a','#5cb848'],1.6,.09,.9);});}}}
  else if(e.k==='extra'){if(e.src==='raise'){var nv=vOf(e.from);if(nv){addParts(nv.x-1,nv.y+.6,.1,14,['#e8e4d8','#c8c4b8','#7a7a7a'],1.6,.07,.8);floatTxt(e.from,'💀','#e8e4d8',false,true);}}
    if(e.src==='minion'&&MIN[e.from]){var L2_=MIN[e.from];var mn=L2_[(L2_.ti=(L2_.ti||0)+1)%L2_.length];mn.lunge=1;}else{var fb=vOf(e.from);if(fb)fb.lunge=1;}}
  else if(e.k==='special'){floatTxt(e.to,T('ba_sp_'+e.sp),'#ffcf5a',true);shake=Math.max(shake,.6);A.sfx('boom');}
  else if(e.k==='boom'){var bv=vOf(e.to);if(bv){addParts(bv.x,bv.y,.4,50,['#fff','#ffd23d','#ff7a1a','#4fbf3a','#444'],4.5,.11,1);fx.push({k:'boom',x:bv.x,y:bv.y,t:0,life:.6});bv.gone=1;}shake=1;A.sfx('boom');floatTxt(e.to,T('ba_boom'),'#ffb347',true);}
  else if(e.k==='mheal'){floatTxt(e.to,T('ba_mheal'),'#7dff7a',false,true);}
  else if(e.k==='item'){floatTxt(e.to,(BTR.ITEMS[e.it]||{}).ic||'✨','#fff',true);}
  else if(e.k==='loot'){var lv=vOf(e.fid);if(lv)addParts(lv.x,lv.y,1.2,18,['#ffd23d','#fff','#7fe3ff'],1.6,.07,1);banner(T('ba_loot')+' '+lootName(e.it,e.cls),false,e.name,e.c);A.sfx('win');}
  else if(e.k==='frozen'){floatTxt(e.to,'❄ '+T('ba_frozen'),'#bff4ff',false);}
  else if(e.k==='send'){banner('⚔',false,e.name,e.c);A.sfx('go');}
  else if(e.k==='kill'){var mv=vOf(e.mid),kv=vOf(e.fid);if(mv){var kd=mv;later(260,function(){addParts(kd.x,kd.y,.7,e.boss?70:22,['#ddd','#bbb','#fff','#999'],e.boss?4:2.6,e.boss?.14:.09,e.boss?1.4:.8);fx.push({k:'poof',x:kd.x,y:kd.y,t:0,life:e.boss?1.2:.8,big:e.boss?1:0,seed:Math.random()*99});if(kv)for(var oi=0;oi<(e.boss?10:4);oi++)fx.push({k:'orb_xp',x:kd.x,y:kd.y,tx:kv.x,ty:kv.y,t:-oi*.06,life:.7});});mv.gone=1;}floatTxt(e.fid,'+'+e.xp+'xp','#7dff7a',false);if(e.boss){shake=1;flashT=.4;A.sfx('win');}else A.sfx('pop');}
  else if(e.k==='die'){var fv=vOf(e.fid);if(fv){var dv=fv;later(250,function(){addParts(dv.x,dv.y,.8,22,['#fff','#ddd','#f66'],2.8,.09,.9);fx.push({k:'poof',x:dv.x,y:dv.y,t:0,life:.8,seed:Math.random()*99});});}A.sfx('bad');}
  else if(e.k==='pwready'){floatTxt(e.fid,'⚡ '+T('ba_pw_full'),'#ffcf7a',false,true);var pv=vOf(e.fid);if(pv){addParts(pv.x,pv.y,1.6,10,['#ffd27a','#d9a066','#fff'],1.2,.06,.8);}A.sfx('tick');}
  else if(e.k==='armed'){floatTxt(e.fid,T('ba_pw_armed'),'#ffcf7a',false,true);}
  else if(e.k==='regen'){floatTxt(e.to,'+'+e.n,'#7dff7a',false,true);var rv=vOf(e.to);if(rv)addParts(rv.x,rv.y,.6,5,['#7dff7a','#3a8a2a'],.8,.05,.6);}
  else if(e.k==='power'){PWH[e.fid]=performance.now();A.sfx('go');var f1=vOf(e.fid),m1=vOf(e.mid);if(f1&&m1){fx.push({k:'p_'+e.p,x:f1.x,y:f1.y,tx:m1.x,ty:m1.y,t:0,life:e.p==='shield'?.8:e.p==='freeze'?1:.8});
    if(e.p==='bolt'){flashT=.25;shake=Math.max(shake,.5);addParts(m1.x,m1.y,.3,24,['#fff','#bfe8ff','#7fd0ff'],3.5,.08,.6);}
    if(e.p==='tnt'||e.p==='fire'){setTimeout(function(){addParts(m1.x,m1.y,.4,46,['#fff','#ffd23d','#ff7a1a','#c33','#444'],4.5,.11,1);shake=Math.max(shake,.8);A.sfx('boom');fx.push({k:'boom',x:m1.x,y:m1.y,t:0,life:.6});},e.p==='tnt'?650:380);}
    A.sfx(e.p==='heal'?'heal':'power');if(e.p==='heal')addParts(f1.x,f1.y,.5,14,['#5cd65c','#b6ff3b','#fff'],1.2,.08,1);
    if(e.p==='freeze')addParts(m1.x,m1.y,.6,16,['#bff4ff','#7fe3ff','#fff'],1.4,.08,.9);}
    banner((PW_IC[e.p]||'')+' '+(EN()?PW_EN[e.p]:PW_AR[e.p]),false,e.name,e.c);}
  else if(e.k==='wave'){A.sfx(e.boss?'boom':'start');hud(true);}
  else if(e.k==='cleared'){banner(T('ba_cleared'));}
  else if(e.k==='won'){A.sfx('win');A.confetti($('stage'),110);}
  else if(e.k==='lost'){A.sfx('bad');}
}
var bnT=null;
function banner(text,big,who,col){var el=$('baBanner');A.clear(el);if(who){el.appendChild(BT.name(who,col,'bt-nm'));el.appendChild(document.createTextNode(' '));}el.appendChild(document.createTextNode(text));el.className='bt-banner'+(big?' big':'')+(who?' who':'')+(String(text).length>26?' long':'');el.hidden=false;clearTimeout(bnT);bnT=setTimeout(function(){el.hidden=true},big?2600:1600);}
function status(t){var s=$('baStatus');if(s)s.textContent=t;}

/* ---------- canvas: the wide raid field ---------- */
var STG=$('stage'),cv=$('baCanvas'),ctx=cv.getContext('2d'),W=0,H=0,DPR=1,iso=new MC.Iso(ctx,{tw:40}),room=null,roomKey='',FLD=MC.FIELD;
var SC=1.15,SCP=1.28; /* Nov 7: the players stand a bit taller than the mobs so they read at stream size */
/* a viewer without their own !سكن no longer looks like everyone else's Steve: shirt in their chat colour, own hair / skin / trousers */
var LOOKS={};function lookFor(u,col){var lk=BT.lookOf(u,col);if(!lk||!lk.steve)return lk;var k=u+'|'+col;return LOOKS[k]||(LOOKS[k]=MC.look(u,col||''));}
function size(){var r=cv.parentNode.getBoundingClientRect();var w=Math.max(200,Math.round(r.width)),h=Math.max(120,Math.round(r.height));var d=Math.min(2,window.devicePixelRatio||1);
  if(w!==W||h!==H||d!==DPR){W=w;H=h;DPR=d;cv.width=Math.round(W*DPR);cv.height=Math.round(H*DPR);roomKey='';}}
/* the places people stand (kept free of scenery) */
function keepOut(){var k=[];for(var i=0;i<16;i++){var p=BT.partySlot(i,i<6?6:i<12?12:16);k.push([p[0],p[1],.05]);}for(var n=1;n<=6;n++)for(var j=0;j<n;j++){var q=BT.enemySlot(j,n,false);k.push([q[0],q[1],.05]);}k.push([.79,.58,.08]);
  for(var a=0;a<16;a++){[6,12,16].forEach(function(nn){if(a<nn){var p2=BT.partySlot(a,nn);k.push([p2[0],p2[1],.045]);}});}return k;}
function getRoom(map){var k=map+W+'x'+H+DPR;if(roomKey!==k||!room){FLD.layout(iso,W,H);iso.dpr=DPR;room=MC.renderField(map,W,H,iso,MC.hash(map)+7,keepOut());roomKey=k;}return room;}
function avatarImg(u){return BT.skinFace(u); /* Twitch pictures over the heads removed (Mohammad, Nov 4) */
if(!CFG.av)return null;var url=BT.avatar(u);if(!url)return null;return BT.img(url);}
function fs(px){return Math.max(W<600?7:10,Math.round(px*iso.tw/52));}
function label(x,y,txt,col,size,weight){ctx.font=(weight||800)+' '+size+'px Cairo,system-ui,sans-serif';ctx.lineWidth=Math.max(2.5,size*.28);ctx.strokeStyle='rgba(0,0,0,.85)';ctx.lineJoin='round';ctx.strokeText(txt,x,y);ctx.fillStyle=col;ctx.fillText(txt,x,y);}
function hpBar(x,y,w,frac,col){var h=Math.max(3,Math.round(iso.tw*.08));ctx.fillStyle='rgba(0,0,0,.8)';ctx.fillRect(Math.round(x-w/2)-1,Math.round(y)-1,Math.round(w)+2,h+2);ctx.fillStyle='#3a1a1a';ctx.fillRect(Math.round(x-w/2),Math.round(y),Math.round(w),h);ctx.fillStyle=col;ctx.fillRect(Math.round(x-w/2),Math.round(y),Math.round(w*Math.max(0,Math.min(1,frac))),h);return h;}
function rr(x,y,w,h,r){ctx.beginPath();if(ctx.roundRect)ctx.roundRect(x,y,w,h,r);else ctx.rect(x,y,w,h);}
function hexA(c,a){var h=MC.hx(c);return 'rgba('+h[0]+','+h[1]+','+h[2]+','+a+')';}
/* a framed bar: dark back, an optional white trail (recent damage), the fill with a lighter top line, a glow when pulsing */
function pbar(x,y,w,h,frac,col,hi,trail,glow){x=Math.round(x);y=Math.round(y);w=Math.round(w);h=Math.round(h);frac=Math.max(0,Math.min(1,frac));
  if(glow>0){ctx.save();ctx.shadowColor='rgba(255,200,120,'+(.6*glow+.2)+')';ctx.shadowBlur=10*glow+4;ctx.fillStyle='rgba(0,0,0,.01)';ctx.fillRect(x,y,w,h);ctx.restore();}
  ctx.fillStyle='rgba(6,6,10,.9)';ctx.fillRect(x-1,y-1,w+2,h+2);ctx.fillStyle='#2a1c1c';ctx.fillRect(x,y,w,h);
  if(trail!=null&&trail>frac){ctx.fillStyle='rgba(255,244,214,.85)';ctx.fillRect(x+Math.round(w*frac),y,Math.round(w*(trail-frac)),h);}
  var fw=Math.round(w*frac);if(fw>0){ctx.fillStyle=col;ctx.fillRect(x,y,fw,h);ctx.fillStyle=hi;ctx.fillRect(x,y,fw,Math.max(1,Math.round(h*.34)));}
  if(glow>0){ctx.strokeStyle='rgba(255,226,168,'+glow+')';ctx.lineWidth=1.5;ctx.strokeRect(x-1.5,y-1.5,w+3,h+3);}}
function mobLabel(k){var M=MC.MOBS[k]||MC.BOSSES[k];return M?(EN()?M.en:M.ar):k;}
function cube(x,y,z,s,col){var p=iso.p(x,y,z),r=s*iso.tw*.5;ctx.fillStyle=col;ctx.fillRect(p[0]-r,p[1]-r,r*2,r*2);ctx.fillStyle='rgba(0,0,0,.25)';ctx.fillRect(p[0],p[1]-r,r,r*2);}
var SPEED=.31; /* field widths per second while walking */
/* the pose each weapon strikes with (mc.js humanoid: swing / chop / stab / shoot / cast / throw) */
var CLASSH={mage:.45,archer:.1,tank:.15,pyro:.15};
var ASTY={sword:'swing',axe:'chop',dagger:'stab',bow:'shoot',staff:'cast',wand:'cast',tnt:'throw',flask:'throw'};
/* knockback after a hit and a quick side-step on a dodge, as an offset that eases back to the spot */
function kbOff(v,dt){var ox=0,oy=0;if(v.kbt>0){var k=Math.sin(Math.min(1,v.kbt)*Math.PI*.5);ox+=v.kbx*k;oy+=v.kby*k;v.kbt=Math.max(0,v.kbt-dt*4.2);}
  if(v.dodgeT>0){var s=Math.sin(v.dodgeT*Math.PI)*.55*(v.dodgeS||1);ox+=s*.7;oy-=s*.7;v.dodgeT=Math.max(0,v.dodgeT-dt*3);}return [ox,oy];}
function moveV(v,tx,ty,dt){var dx=(tx-v.nx)*W,dy=(ty-v.ny)*H*FLD.span,d=Math.sqrt(dx*dx+dy*dy);var st=SPEED*W*dt;var moving=d>.5;if(d<=st||d<.5){v.nx=tx;v.ny=ty;}else{v.nx+=dx/d*st/W;v.ny+=dy/d*st/(H*FLD.span);}if(moving){v.walk+=dt;v.dir=dx>.3?1:dx<-.3?-1:v.dir;}return moving;}
function drawArrowAt(p,prev,al){var dx=p[0]-prev[0],dy=p[1]-prev[1],d=Math.sqrt(dx*dx+dy*dy)||1,ux=dx/d,uy=dy/d,L=iso.tw*1.05;ctx.save();ctx.globalAlpha=al;ctx.lineCap='round';
  ctx.strokeStyle='rgba(0,0,0,.55)';ctx.lineWidth=Math.max(4,iso.tw*.11);ctx.beginPath();ctx.moveTo(p[0]-ux*L,p[1]-uy*L);ctx.lineTo(p[0],p[1]);ctx.stroke();ctx.strokeStyle='#8a6236';ctx.lineWidth=Math.max(2.5,iso.tw*.07);ctx.beginPath();ctx.moveTo(p[0]-ux*L,p[1]-uy*L);ctx.lineTo(p[0],p[1]);ctx.stroke();
  ctx.fillStyle='#d8d8de';ctx.beginPath();ctx.moveTo(p[0]+ux*iso.tw*.16,p[1]+uy*iso.tw*.16);ctx.lineTo(p[0]-uy*iso.tw*.08,p[1]+ux*iso.tw*.08);ctx.lineTo(p[0]+uy*iso.tw*.08,p[1]-ux*iso.tw*.08);ctx.closePath();ctx.fill();
  ctx.strokeStyle='#f4f4f4';ctx.lineWidth=Math.max(1.5,iso.tw*.04);var bx=p[0]-ux*L,by=p[1]-uy*L;ctx.beginPath();ctx.moveTo(bx,by);ctx.lineTo(bx-ux*iso.tw*.12-uy*iso.tw*.1,by-uy*iso.tw*.12+ux*iso.tw*.1);ctx.moveTo(bx,by);ctx.lineTo(bx-ux*iso.tw*.12+uy*iso.tw*.1,by-uy*iso.tw*.12-ux*iso.tw*.1);ctx.stroke();ctx.restore();}
/* one projectile in flight (u = 0 → 1 along its path, with an arc for thrown things) */
function projAt(f,u){return iso.p(f.x+(f.tx-f.x)*u,f.y+(f.ty-f.y)*u,f.z0+(f.z1-f.z0)*u+Math.sin(u*Math.PI)*f.arc);}
function drawProj(f,u){var p=projAt(f,u),pv=projAt(f,Math.max(0,u-.06)),tw=iso.tw*1.45; /* drawn bigger than life so they read at stream size */
  if(f.st==='arrow'){drawArrowAt(p,pv,1);if(f.crit)MC.glow(ctx,p[0],p[1],tw*.4,'rgba(255,220,120,A)',.6);}
  else if(f.st==='fireball'||f.st==='blastball'){var big=f.st==='blastball'?1.5:1;MC.glow(ctx,p[0],p[1],tw*.55*big,'rgba(255,140,40,A)',1);ctx.fillStyle=f.st==='blastball'?'#3a3a3a':'#ff7a1a';ctx.fillRect(p[0]-tw*.15*big,p[1]-tw*.15*big,tw*.3*big,tw*.3*big);ctx.fillStyle='#ffd23d';ctx.fillRect(p[0]-tw*.09*big,p[1]-tw*.09*big,tw*.18*big,tw*.18*big);
    if(Math.random()<.6){parts.push({x:f.x+(f.tx-f.x)*u,y:f.y+(f.ty-f.y)*u,z:f.z0+(f.z1-f.z0)*u+Math.sin(u*Math.PI)*f.arc,vx:0,vy:0,vz:.4,life:.3,t:0,col:Math.random()<.5?'#ff9a3d':'#ffd23d',s:.07});}}
  else if(f.st==='orb'||f.st==='morb'){var c1=f.st==='orb'?'rgba(140,160,255,A)':'rgba(200,110,255,A)';MC.glow(ctx,p[0],p[1],tw*.75,c1,1);ctx.fillStyle=f.st==='orb'?'#9aa8ff':'#c98aff';ctx.fillRect(p[0]-tw*.2,p[1]-tw*.05,tw*.4,tw*.1);ctx.fillRect(p[0]-tw*.05,p[1]-tw*.2,tw*.1,tw*.4);ctx.fillStyle='#fff';ctx.fillRect(p[0]-tw*.11,p[1]-tw*.11,tw*.22,tw*.22);
    if(Math.random()<.7)parts.push({x:f.x+(f.tx-f.x)*u,y:f.y+(f.ty-f.y)*u,z:f.z0+(f.z1-f.z0)*u,vx:(Math.random()-.5)*.6,vy:(Math.random()-.5)*.6,vz:.3,life:.35,t:0,col:f.st==='orb'?'#c8d0ff':'#e0b0ff',s:.05});}
  else if(f.st==='tnt'){var x=f.x+(f.tx-f.x)*u,y=f.y+(f.ty-f.y)*u,z=f.z0+(f.z1-f.z0)*u+Math.sin(u*Math.PI)*f.arc;iso.box(x-.27,y-.27,z,.54,.54,.54,{top:MC.tex('planks'),side:MC.tex('tnt_side')},{flash:Math.sin(f.t*40)>0?.55:0,outline:'rgba(0,0,0,.6)'});
    if(Math.random()<.5)parts.push({x:x,y:y,z:z+.5,vx:0,vy:0,vz:.6,life:.35,t:0,col:Math.random()<.5?'#ddd':'#ffd23d',s:.05});}
  else if(f.st==='potion'){var pk=f.mob?'#a04ae0':'#5cd65c';MC.glow(ctx,p[0],p[1],tw*.45,f.mob?'rgba(190,110,255,A)':'rgba(120,255,110,A)',.6);ctx.fillStyle='rgba(0,0,0,.6)';ctx.fillRect(p[0]-tw*.16,p[1]-tw*.3,tw*.32,tw*.44);ctx.fillStyle=pk;ctx.fillRect(p[0]-tw*.13,p[1]-tw*.12,tw*.26,tw*.24);ctx.fillStyle='#e8f8e8';ctx.fillRect(p[0]-tw*.06,p[1]-tw*.22,tw*.12,tw*.1);ctx.fillStyle='#8a5a2a';ctx.fillRect(p[0]-tw*.05,p[1]-tw*.28,tw*.1,tw*.06);ctx.fillStyle='rgba(255,255,255,.7)';ctx.fillRect(p[0]-tw*.09,p[1]-tw*.08,tw*.05,tw*.08);}
  else if(f.st==='wind'){ctx.save();ctx.strokeStyle='rgba(235,245,255,.9)';ctx.lineWidth=Math.max(2,tw*.06);for(var i=0;i<3;i++){ctx.beginPath();ctx.arc(p[0],p[1],tw*(.12+i*.1),f.t*14+i,f.t*14+i+Math.PI*1.2);ctx.stroke();}ctx.restore();}}
var hoverU='',t0=performance.now(),prev=t0,hudT=0;
function frame(now){requestAnimationFrame(frame);size();if(!W)return;var dt=Math.min(.05,(now-prev)/1000)*QS;prev=now;var t=(now-t0)/1000;
  var map=P.map||CFG.map;var R=getRoom(map);ctx.setTransform(DPR,0,0,DPR,0,0);ctx.imageSmoothingEnabled=false;
  var sx=0,sy=0;if(shake>0){sx=(Math.random()-.5)*shake*iso.tw*.22;sy=(Math.random()-.5)*shake*iso.tw*.22;shake=Math.max(0,shake-dt*2.2);}
  ctx.save();ctx.translate(sx,sy);
  var nobg=STG.classList.contains('lay-nobg')&&A.obs;if(nobg){ctx.clearRect(-20,-20,W+40,H+40);}else{ctx.drawImage(R.canvas,0,0,W,H);}
  /* liquid shimmer */
  if(!nobg)R.liquid.forEach(function(q){if(Math.random()<.2){var p=iso.p(q[0]+Math.random()-.5,q[1]+Math.random()-.5,-.55);ctx.fillStyle=R.fm.chasm==='water'||R.fm.chasm==='ice'?'rgba(220,240,255,.85)':'rgba(255,230,120,.9)';ctx.fillRect(p[0],p[1],2,2);}});
  if(P.ev&&P.ev.length&&P.ev[P.ev.length-1].id<lastEv-2)lastEv=P.ev[0].id-1; /* ids restarted (new engine): resync instead of going deaf */
  (P.ev||[]).forEach(function(e){if(e.id>lastEv){lastEv=e.id;if(performance.now()-t0>800)onEvent(e);}});
  if(PEND.length){var pn=performance.now();PEND=PEND.filter(function(q){if(pn>=q.at){try{q.fn();}catch(_){}return false;}return true;});}
  var duelF=P.d?P.d[0]:0,duelM=P.d?P.d[1]:0,ph=P.ph,list=[],seen={};
  (P.f||[]).forEach(function(f){var key='f'+f[0];seen[key]=1;var v=V[key];if(!v){v=V[key]={nx:f[4],ny:f[5],walk:0,dir:1,lunge:0,flash:0};}
    var mv=moveV(v,f[4],f[5],dt);var w=FLD.toWorld(v.nx,v.ny);v.x=w[0];v.y=w[1];v.h=2.05*SCP+(CLASSH[f[18]]||0);
    var dead=!f[10];if(dead){v.dead=(v.dead||0)+dt;}else v.dead=0;
    var face=mv?(v.dir<0?0:1):(f[12]==='duel'||f[12]==='out'||f[0]===duelF?1:1);
    var lx=0,ly=0;if(v.lunge>0){var m2=duelM&&V['m'+duelM];if(m2){var ddx=m2.x-v.x,ddy=m2.y-v.y,dd=Math.sqrt(ddx*ddx+ddy*ddy)||1;var l=Math.sin(v.lunge*Math.PI)*.75;lx=ddx/dd*l;ly=ddy/dd*l;}v.lunge=Math.max(0,v.lunge-dt*3.2);}
    var ko=kbOff(v,dt);lx+=ko[0];ly+=ko[1];v.cast=Math.max(0,(v.cast||0)-dt*2.6);v.flash=Math.max(0,v.flash-dt);var wk=(BTR.CLASSES[f[18]]||BTR.CLASSES.warrior).w;
    list.push({kind:'player',scale:SCP,cls:f[18],x:v.x+lx,y:v.y+ly,face:face,name:f[2],color:f[3],look:lookFor(f[1],f[3]),avatar:avatarImg(f[1]),weapon:WMAP[wk],wcol:WCOL[f[21]||0],armour:BTR.ARMOUR[f[20]||0].col,anim:{walk:mv?v.walk:0,atk:Math.max(v.lunge,v.cast||0),style:ASTY[wk]||'swing',idle:dead?0:1,seed:f[0],flash:v.flash>0?.6:0},z:(!dead&&isJumping(f[1]))?Math.abs(Math.sin(t*7.5+f[0]*1.7))*.85:0,F:f,V:v,dead:dead,glow:f[0]===duelF&&!f[16]?'#7fd0ff':null});});
  (P.m||[]).forEach(function(m){var key='m'+m[0];seen[key]=1;var v=V[key];if(!v){v=V[key]={nx:m[2],ny:m[3],walk:0,dir:-1,lunge:0,flash:0,born:now};}
    var mv=moveV(v,m[2],m[3],dt);var w=FLD.toWorld(v.nx,v.ny);v.x=w[0];v.y=w[1];v.h=(MC.MOBH[m[1]]||(m[7]?2.4:2.1))*SC*m[8];
    var lx=0,ly=0;if(v.lunge>0){var f2=duelF&&V['f'+duelF];if(f2){var ddx=f2.x-v.x,ddy=f2.y-v.y,dd=Math.sqrt(ddx*ddx+ddy*ddy)||1;var l=Math.sin(v.lunge*Math.PI)*.7;lx=ddx/dd*l;ly=ddy/dd*l;}v.lunge=Math.max(0,v.lunge-dt*3.2);}
    var ko2=kbOff(v,dt);lx+=ko2[0];ly+=ko2[1];v.cast=Math.max(0,(v.cast||0)-dt*2.6);v.flash=Math.max(0,v.flash-dt);var age=(now-v.born)/1000;
    list.push({kind:m[1],x:v.x+lx,y:v.y+ly,face:mv?(v.dir>0?1:0):0,scale:SC*m[8]*(age<.4?age/.4:1),anim:{walk:mv?v.walk:0,atk:Math.max(v.lunge,v.cast||0),flash:v.flash>0?.7:0},M:m,V:v,frozen:m[11]>0,z:age<.4?(.4-age)*2:0});});
  Object.keys(V).forEach(function(k){if(!seen[k]){var v=V[k];v.gone=(v.gone||0)+dt;if(v.gone>1.5)delete V[k];}});
  /* the Zombie King's summoned zombies stand beside him in phase 2 and strike after him */
  (P.m||[]).forEach(function(m){if(!m[7]||!m[13]||bossP2(m)!=='summon')return;var bv=V['m'+m[0]];if(!bv)return;if(!MIN[m[0]])MIN[m[0]]=[{ox:-1.15,oy:.75,born:now-2000,lunge:0},{ox:-1.15,oy:-.75,born:now-2000,lunge:0}];
    MIN[m[0]].forEach(function(mn){var age=(now-mn.born)/1000;if(age<0)return;var lx=0,ly=0;if(mn.lunge>0){var f2=duelF&&V['f'+duelF];if(f2){var tx=f2.x-(bv.x+mn.ox),ty=f2.y-(bv.y+mn.oy),dd=Math.sqrt(tx*tx+ty*ty)||1;var l=Math.sin(mn.lunge*Math.PI)*Math.min(dd-.6,2.2);lx=tx/dd*l;ly=ty/dd*l;}mn.lunge=Math.max(0,mn.lunge-dt*2.2);}
      list.push({kind:'zombie',x:bv.x+mn.ox+lx,y:bv.y+mn.oy+ly,face:0,scale:SC*.88,anim:{walk:mn.lunge>0?t*2:0,atk:mn.lunge,flash:0},V:{ny:bv.ny+mn.oy*.01},z:age<.6?(age-.6)*1.6:0,minion:1});});});
  list.sort(function(a,b){return a.V.ny-b.V.ny});
  /* duel ring on the bridge */
  if(P.d){var a1=FLD.toWorld(.5,.6);var pr=iso.p(a1[0],a1[1],0);ctx.strokeStyle='rgba(255,210,90,'+(.35+Math.sin(t*4)*.15)+')';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(pr[0],pr[1],iso.tw*2.2,iso.tw*1.1,0,0,Math.PI*2);ctx.stroke();}
  var canPick=!A.obs&&ph==='pick'&&!P.pa;
  list.forEach(function(e){var v=e.V;
    if(e.F&&e.dead){var g=iso.p(v.x,v.y,0);var gt=MC.tex('cobble',3);iso.box(v.x-.18,v.y-.08,0,.36,.16,.5,{top:gt,side:gt},{outline:'rgba(0,0,0,.5)'});if(v.dead>1.2)return;ctx.globalAlpha=Math.max(0,1-v.dead/1.2);}
    if(e.F&&canPick&&!e.dead){var pp=iso.p(v.x,v.y,0),hv=hoverU===e.F[1];ctx.strokeStyle=hv?'rgba(255,230,120,.95)':'rgba(255,230,120,'+(.35+Math.sin(t*5+e.F[0])*.2)+')';ctx.lineWidth=hv?3:2;ctx.beginPath();ctx.ellipse(pp[0],pp[1],iso.tw*.55,iso.tw*.28,0,0,Math.PI*2);ctx.stroke();}
    if(e.F&&e.F[15]&&!e.dead)ctx.globalAlpha=.55;
    if(e.M&&e.M[7]&&e.M[13]){var p2=bossP2(e.M),bp=iso.p(e.x,e.y,.9*(e.scale||1)),R=iso.tw*1.5*(e.scale||1),pu=.5+Math.sin(t*5)*.25;
      if(p2==='rage'){MC.glow(ctx,bp[0],bp[1],R*1.3,'rgba(255,40,30,A)',.35*pu+.15);}
      else if(p2==='armour'){MC.glow(ctx,bp[0],bp[1],R*1.2,'rgba(120,200,255,A)',.3);}
      else if(p2==='crystal'){for(var ci=0;ci<2;ci++){var cx_=e.x+(ci?1.6:-1.6),cy_=e.y-1.2,cp=iso.p(cx_,cy_,2.6+Math.sin(t*2+ci)*.3);ctx.strokeStyle='rgba(255,140,240,'+(.5+pu*.3)+')';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(cp[0],cp[1]);ctx.lineTo(bp[0],bp[1]);ctx.stroke();ctx.fillStyle='#ff9ae8';ctx.fillRect(cp[0]-iso.tw*.18,cp[1]-iso.tw*.18,iso.tw*.36,iso.tw*.36);ctx.strokeStyle='#fff';ctx.lineWidth=1.5;ctx.strokeRect(cp[0]-iso.tw*.18,cp[1]-iso.tw*.18,iso.tw*.36,iso.tw*.36);MC.glow(ctx,cp[0],cp[1],iso.tw*.8,'rgba(255,120,230,A)',.5);}}
      else if(p2==='storm'||p2==='charge'){MC.glow(ctx,bp[0],bp[1],R*1.1,p2==='storm'?'rgba(255,120,30,A)':'rgba(255,170,40,A)',.3*pu+.1);if(Math.random()<dt*14)addParts(e.x+(Math.random()-.5)*1.6,e.y+(Math.random()-.5)*1.2,.3,1,p2==='storm'?['#ff7a1a','#ffd23d']:['#ffb347'],1.2,.07,.7);}
      else if(p2==='summon'){MC.glow(ctx,bp[0],bp[1],R,'rgba(120,220,90,A)',.18);}
      else if(p2==='fatigue'){MC.glow(ctx,bp[0],bp[1],R,'rgba(120,200,160,A)',.22);}}
    if(e.minion){var mp=iso.p(e.x,e.y,0);ctx.fillStyle='rgba(0,0,0,.35)';ctx.beginPath();ctx.ellipse(mp[0],mp[1],iso.tw*.5,iso.tw*.25,0,0,Math.PI*2);ctx.fill();MC.glow(ctx,mp[0],mp[1]-iso.tw*.6,iso.tw*1.1,'rgba(120,230,90,A)',.32);}
    MC.drawEntity(iso,e,t);ctx.globalAlpha=1;
    if(e.frozen){var pf=iso.p(e.x,e.y,.9*(e.scale||1));ctx.fillStyle='rgba(150,230,255,.25)';ctx.fillRect(pf[0]-iso.tw*.3*(e.scale||1),pf[1]-iso.tw*.7*(e.scale||1),iso.tw*.6*(e.scale||1),iso.tw*1.2*(e.scale||1));}
    if(e.F&&e.F[17]>0&&!e.dead){var ps=iso.p(e.x,e.y,1);ctx.strokeStyle='rgba(120,200,255,'+(.5+Math.sin(t*6)*.2)+')';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(ps[0],ps[1]-iso.tw*.2,iso.tw*.5,iso.tw*.75,0,0,Math.PI*2);ctx.stroke();}});
  /* names, levels and HP bars over heads (Kukoro: always visible).
     Nov 7 (Mohammad: "the players are not okay"): a real nameplate — the name in its chat colour on a dark pill with the level,
     a framed HP bar with a white "damage trail", and under it the brown POWER bar that fills slowly, its hardcore heart at the end;
     when it is full the heart glows and a «!قوة» tag bobs over the name (it never fires by itself). */
  ctx.textAlign='center';ctx.textBaseline='bottom';
  list.forEach(function(e){var v=e.V;if(e.F&&e.dead){if(v.dead>1.2){var gp=iso.p(v.x,v.y,.6);ctx.globalAlpha=.6;label(gp[0],gp[1],e.F[2],'#bbb',fs(10),700);ctx.globalAlpha=1;}return;}
    var p=iso.p(e.x,e.y,v.h+(e.z||0)+(e.kind==='blaze'?.6:0)),y=p[1]-4;
    if(e.F){var f=e.F,frac=f[6]/Math.max(1,f[7]);v.hpT=v.hpT==null||v.hpT<frac?frac:Math.max(frac,v.hpT-dt*.5);
      var bw=Math.max(44,iso.tw*1.25),bh=Math.max(6,Math.round(fs(13)*.45)),pbh=Math.max(5,Math.round(bh*.85)),pc=Math.max(0,Math.min(1,(f[26]||0)/100)),full=pc>=1&&f[10];
      var hc=Math.max(1.9,(bh+pbh+8)/8),hw=9*hc;var pbw=bw,x0=p[0]-(bw+hw+3)/2;
      /* power bar + heart */
      var py=y-pbh;pbar(x0,py,pbw,pbh,pc,full?'#d9a066':'#9a5c28',full?'#ffd9a0':'#b8763a',null,full?(.6+Math.sin(t*6)*.4):0);
      var hx0=x0+bw+3,hy0=py+pbh-(bh+pbh+2)/2-4*hc;drawHHeart(hx0,hy0,hc,pc,full);
      /* HP bar */
      var hy=py-2-bh;pbar(x0,hy,pbw,bh,frac,frac>.6?'#4cc85a':frac>.3?'#f2c230':'#ff5a4a',frac>.6?'#8af08a':frac>.3?'#ffe27a':'#ff9a8a',v.hpT,0);
      /* name pill: LV + name in the chat colour */
      var nsz=fs(14),nmY=hy-3;ctx.font='800 '+nsz+'px Cairo,system-ui,sans-serif';ctx.direction='auto';var nw=ctx.measureText(f[2]).width;var lvT='LV'+f[8];ctx.font='900 '+Math.round(nsz*.78)+'px Cairo,system-ui,sans-serif';var lw2=ctx.measureText(lvT).width;
      var padX=nsz*.45,pillW=nw+lw2+padX*3,pillH=nsz*1.32,pX=p[0]-pillW/2,pY=nmY-pillH;var col=MC.readableColor(f[3]||'#cfd3ff');
      ctx.fillStyle='rgba(10,11,16,.72)';rr(pX,pY,pillW,pillH,pillH/2);ctx.fill();ctx.lineWidth=1.5;ctx.strokeStyle=hexA(col,.55);ctx.stroke();
      ctx.textBaseline='middle';ctx.textAlign='left';ctx.direction='ltr';ctx.fillStyle='#ffd23d';ctx.font='900 '+Math.round(nsz*.78)+'px Cairo,system-ui,sans-serif';ctx.fillText(lvT,pX+padX,pY+pillH/2+1);
      ctx.font='800 '+nsz+'px Cairo,system-ui,sans-serif';ctx.direction='auto';ctx.textAlign='center';ctx.fillStyle=col;ctx.fillText(f[2],pX+padX*2+lw2+nw/2,pY+pillH/2+1);ctx.textBaseline='bottom';ctx.direction='ltr';
      var topY=pY-2;
      var tag='';if(f[14])tag+='★'+f[14]; /* !قفز now makes the character really jump (no arrow over the head) */
      if(full){var bob=Math.abs(Math.sin(t*4+f[0]))*iso.tw*.07,rt=f[27]?T('ba_pw_armed'):(EN()?'⚡ !power':'⚡ !قوة'),rs=fs(12);ctx.font='900 '+rs+'px Cairo,system-ui,sans-serif';ctx.direction=f[27]&&!EN()?'rtl':'ltr';var rw=ctx.measureText(rt).width+rs*1.1,rh=rs*1.45,ry=topY-rh-bob;
        ctx.save();ctx.shadowColor='rgba(255,190,110,.9)';ctx.shadowBlur=8+Math.sin(t*6)*3;ctx.fillStyle='rgba(58,32,12,.92)';rr(p[0]-rw/2,ry,rw,rh,rh/2);ctx.fill();ctx.restore();ctx.strokeStyle='#e8be5a';ctx.lineWidth=1.5;rr(p[0]-rw/2,ry,rw,rh,rh/2);ctx.stroke();
        ctx.textBaseline='middle';ctx.fillStyle='#ffe2a8';ctx.fillText(rt,p[0],ry+rh/2+1);ctx.textBaseline='bottom';ctx.direction='ltr';topY=ry-2;}
      if(tag){var bob2=Math.abs(Math.sin(t*5+f[0]))*iso.tw*.08;label(p[0],topY-bob2,tag,'#ffd23d',fs(13),900);}}
    else if(e.M){var m=e.M,mf=m[4]/Math.max(1,m[5]),boss=!!m[7];v.hpT=v.hpT==null||v.hpT<mf?mf:Math.max(mf,v.hpT-dt*.5);
      var mbw=Math.max(32,iso.tw*(boss?2.2:1.0)),mbh=Math.max(5,Math.round(fs(boss?14:12)*.42));pbar(p[0]-mbw/2,y-mbh,mbw,mbh,mf,boss?(m[16]?'#ff3a2a':'#d8402e'):'#e04a4a',boss?'#ff8a6a':'#ff8a8a',v.hpT,boss&&m[16]?(.5+Math.sin(t*8)*.5):0);
      if(boss){/* the phase marks at 50% and 25% */ctx.fillStyle='rgba(0,0,0,.75)';[.5,.25].forEach(function(q){ctx.fillRect(Math.round(p[0]-mbw/2+mbw*q),Math.round(y-mbh),2,mbh);});}
      /* name and level drawn apart so Arabic names never get mixed up with «Lv» */
      var lz=fs(boss?11:9),nz=fs(boss?15:12),nm=mobLabel(boss?m[1].slice(5):m[1])+(m[9]?' 👑':'');ctx.textAlign='right';ctx.direction='ltr';ctx.textBaseline='middle';label(p[0]-mbw/2-3,y-mbh/2,'Lv'+m[6],'#ffd23d',lz,900);ctx.textBaseline='bottom';ctx.textAlign='center';ctx.direction='rtl';label(p[0],y-mbh-3,nm,boss?'#ffcf5a':'#ffe2e2',nz);ctx.direction='ltr';}});
  ctx.direction='ltr';
  /* statuses over heads (burn / poison / wither / stunned) and the boss's second phase */
  list.forEach(function(e){var v=e.V;if(e.F&&e.dead)return;var st=e.F?e.F[22]:e.M?e.M[15]:'',stun=e.F?e.F[23]:0;var p=iso.p(e.x,e.y,v.h+(e.kind==='blaze'?.6:0));
    var ic=(st==='burn'?'🔥':st==='poison'?'🧪':st==='wither'?'💀':'')+(stun?'💫':'');if(ic){ctx.font=fs(13)+'px system-ui';ctx.textAlign='center';var ox=e.F?Math.max(44,iso.tw*1.25)/2+fs(26):Math.max(26,iso.tw*.95)/2+fs(10);ctx.fillText(ic,p[0]+ox,p[1]-fs(4));}
    if(e.M&&e.M[7]&&e.M[13]){var gp=iso.p(e.x,e.y,1.2*(e.scale||1));MC.glow(ctx,gp[0],gp[1],iso.tw*2.4*(e.scale||1),'rgba(255,40,40,A)',.18+Math.sin(t*6)*.08);}});
  /* "candidates can speak": their last chat line in a bubble over their head for 4 s */
  (P.say||[]).forEach(function(s){var e=null;list.forEach(function(x){if(x.F&&x.F[1]===s[0]&&!x.dead)e=x;});if(!e)return;var v=e.V,p=iso.p(e.x,e.y,v.h),size=fs(12);
    ctx.font='700 '+size+'px Cairo,system-ui,sans-serif';ctx.direction='auto';var tw=Math.min(W*.3,ctx.measureText(s[1]).width)+size*1.1,bh=size*1.7,bx=p[0]-tw/2,by=p[1]-size*3.4-bh;
    ctx.fillStyle='rgba(255,255,255,.95)';ctx.strokeStyle='rgba(20,16,30,.9)';ctx.lineWidth=2;ctx.beginPath();if(ctx.roundRect)ctx.roundRect(bx,by,tw,bh,size*.5);else ctx.rect(bx,by,tw,bh);ctx.fill();ctx.stroke();
    ctx.beginPath();ctx.moveTo(p[0]-size*.4,by+bh-1);ctx.lineTo(p[0],by+bh+size*.6);ctx.lineTo(p[0]+size*.4,by+bh-1);ctx.closePath();ctx.fill();
    ctx.fillStyle='#1a1424';ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(s[1],p[0],by+bh/2,W*.3);ctx.textBaseline='bottom';ctx.direction='ltr';});
  /* effects */
  fx=fx.filter(function(f){f.t+=dt;if(f.t>f.life)return false;var a=1-f.t/f.life,p,q;
    if(f.k==='ring'){if(f.t<0)return true;p=iso.p(f.x,f.y,.05);ctx.strokeStyle=f.col.replace('A',(a*.9).toFixed(2));ctx.lineWidth=Math.max(3,iso.tw*.14*a);ctx.beginPath();ctx.ellipse(p[0],p[1],iso.tw*(.6+f.t*5),iso.tw*(.3+f.t*2.5),0,0,Math.PI*2);ctx.stroke();}
    else if(f.k==='boom'){p=iso.p(f.x,f.y,.3);MC.glow(ctx,p[0],p[1],iso.tw*(1+f.t*4),'rgba(255,200,90,A)',a*.9);}
    else if(f.k==='p_bolt'){p=iso.p(f.tx,f.ty,0);ctx.strokeStyle='rgba(220,240,255,'+a+')';ctx.lineWidth=4;ctx.shadowColor='#7fd0ff';ctx.shadowBlur=18;ctx.beginPath();var x=p[0],y=p[1]-H;ctx.moveTo(x,y);for(var i=1;i<=8;i++){x=p[0]+(Math.random()-.5)*iso.tw*.6*(1-i/8);y=p[1]-H+H*i/8;ctx.lineTo(x,y);}ctx.stroke();ctx.shadowBlur=0;MC.glow(ctx,p[0],p[1],iso.tw*1.6,'rgba(160,220,255,A)',a*.8);}
    else if(f.k==='p_fire'){var u2=Math.min(1,f.t/.38);p=iso.p(f.x+(f.tx-f.x)*u2,f.y+(f.ty-f.y)*u2,1.2+Math.sin(u2*Math.PI)*1.2);MC.glow(ctx,p[0],p[1],iso.tw*.6,'rgba(255,140,40,A)',1);ctx.fillStyle='#ffd23d';ctx.fillRect(p[0]-5,p[1]-5,10,10);}
    else if(f.k==='p_tnt'){if(f.t<.65){var u3=Math.min(1,f.t/.5);iso.box(f.x+(f.tx-f.x)*u3-.25,f.y+(f.ty-f.y)*u3-.25,Math.sin(u3*Math.PI)*1.8,.5,.5,.5,{top:MC.tex('planks'),side:MC.tex('tnt_side')},{flash:Math.sin(f.t*40)>0?.6:0});}}
    else if(f.k==='p_arrows'){for(var j=0;j<5;j++){var u4=Math.min(1,(f.t-j*.1)/.32);if(u4<0||u4>=1)continue;drawArrowAt(iso.p(f.tx+(j-2)*.28,f.ty+((j*3)%3-1)*.2,1+4.5*(1-u4)),iso.p(f.tx+(j-2)*.28+.25,f.ty+((j*3)%3-1)*.2,1+4.5*(1-u4)+1.2),1);}}
    else if(f.k==='p_shield'){p=iso.p(f.x,f.y,1);ctx.strokeStyle='rgba(120,200,255,'+a+')';ctx.lineWidth=4;ctx.beginPath();ctx.ellipse(p[0],p[1],iso.tw*(.5+f.t*2),iso.tw*(.3+f.t),0,0,Math.PI*2);ctx.stroke();}
    else if(f.k==='p_freeze'){p=iso.p(f.tx,f.ty,1);MC.glow(ctx,p[0],p[1],iso.tw*1.4,'rgba(170,235,255,A)',a*.7);}
    else if(f.k==='p_heal'){p=iso.p(f.x,f.y,1);MC.glow(ctx,p[0],p[1],iso.tw*1.4,'rgba(120,255,140,A)',a*.6);}
    else if(f.k==='proj'){if(f.t<0)return true;var u=Math.min(1,f.t/f.life);drawProj(f,u,a);if(u>=1)return false;}
    else if(f.k==='slash'){var sp=iso.p(f.x,f.y,f.z),u5=Math.min(1,f.t/f.life),R5=iso.tw*(f.st==='chop'?1.45:1.25)*(f.big?1.25:1);ctx.save();ctx.lineCap='round';
      if(f.st==='stab'){var L5=R5*1.3*u5;ctx.shadowColor='#fff';ctx.shadowBlur=8;ctx.strokeStyle='rgba(255,255,255,'+(1-u5)+')';ctx.lineWidth=Math.max(4,iso.tw*.16);ctx.beginPath();ctx.moveTo(sp[0]-R5*.8,sp[1]+R5*.1);ctx.lineTo(sp[0]-R5*.8+L5,sp[1]-R5*.1);ctx.stroke();}
      else{var a0=f.st==='chop'?-Math.PI*.95:-Math.PI*.8,sw5=Math.PI*(f.st==='chop'?.9:1.05),a1=a0+sw5*Math.min(1,u5*1.6),a2=a0+sw5*Math.max(0,u5*1.6-.6);
        ctx.shadowColor=f.col||'#fff';ctx.shadowBlur=10;ctx.strokeStyle='rgba(255,255,255,'+(.95*(1-u5*.6))+')';ctx.lineWidth=Math.max(5,iso.tw*(f.big?.28:.21))*(1-u5*.5);ctx.beginPath();ctx.arc(sp[0],sp[1],R5,a2,a1);ctx.stroke();
        ctx.shadowBlur=0;ctx.strokeStyle=hexA(f.col||'#d6f2fa',.9*(1-u5));ctx.lineWidth=Math.max(3,iso.tw*.09);ctx.beginPath();ctx.arc(sp[0],sp[1],R5*.8,a2,a1);ctx.stroke();}
      ctx.restore();}
    else if(f.k==='claw'){var cp5=iso.p(f.x,f.y,f.z),u6=Math.min(1,f.t/f.life),R6=iso.tw*.75*(f.big?1.3:1);ctx.save();ctx.lineCap='round';ctx.shadowColor='#ff3a2a';ctx.shadowBlur=8;ctx.strokeStyle='rgba(255,90,70,'+(1-u6)+')';ctx.lineWidth=Math.max(4,iso.tw*.13);
      for(var ci2=-1;ci2<=1;ci2++){var ox=ci2*R6*.38,ln=R6*2*Math.min(1,u6*2.2);ctx.beginPath();ctx.moveTo(cp5[0]+ox+R6*.6,cp5[1]-R6);ctx.lineTo(cp5[0]+ox+R6*.6-ln*.55,cp5[1]-R6+ln);ctx.stroke();}ctx.restore();}
    else if(f.k==='burst'){var bp5=iso.p(f.x,f.y,f.z);MC.glow(ctx,bp5[0],bp5[1],iso.tw*(.6+f.t*3),f.col,a*.9);ctx.strokeStyle=f.col.replace('A',(a*.9).toFixed(2));ctx.lineWidth=2;ctx.beginPath();ctx.arc(bp5[0],bp5[1],iso.tw*(.3+f.t*2.6),0,Math.PI*2);ctx.stroke();}
    else if(f.k==='poof'){/* the Minecraft death poof: grey-white puffs swelling and rising */var n7=f.big?14:9;for(var pi7=0;pi7<n7;pi7++){var ang=pi7/n7*Math.PI*2+f.seed,rad=(.25+f.t*1.4)*(f.big?1.8:1),pz=.3+f.t*1.6+((pi7*37)%5)*.12;var q7=iso.p(f.x+Math.cos(ang)*rad*.6,f.y+Math.sin(ang)*rad*.6,pz);var s7=iso.tw*(.16+f.t*.28)*(f.big?1.4:1);ctx.fillStyle='rgba('+(pi7%2?235:205)+','+(pi7%2?235:205)+','+(pi7%2?240:210)+','+(a*.85).toFixed(2)+')';ctx.fillRect(q7[0]-s7/2,q7[1]-s7/2,s7,s7);}}
    else if(f.k==='orb_xp'){if(f.t<0)return true;var u8=Math.min(1,f.t/f.life),e8=u8*u8;var q8=iso.p(f.x+(f.tx-f.x)*e8,f.y+(f.ty-f.y)*e8,.6+Math.sin(u8*Math.PI)*1.6);MC.glow(ctx,q8[0],q8[1],iso.tw*.3,'rgba(150,255,90,A)',.8);ctx.fillStyle='#d8ff7a';ctx.fillRect(q8[0]-2,q8[1]-2,4,4);}
    return true;});
  parts=parts.filter(function(q){q.t+=dt;if(q.t>q.life)return false;q.vz-=9*dt;q.x+=q.vx*dt;q.y+=q.vy*dt;q.z=Math.max(0,q.z+q.vz*dt);if(q.z===0){q.vx*=.8;q.vy*=.8;}ctx.globalAlpha=Math.min(1,(q.life-q.t)*3);cube(q.x,q.y,q.z,q.s,q.col);ctx.globalAlpha=1;return true;});
  if(parts.length>600)parts.splice(0,parts.length-600);
  /* light: torches / lamps / lava + a warm light on the duel */
  var dyn=[];fx.forEach(function(f){if(f.k==='p_fire'||f.k==='boom')dyn.push({x:f.tx||f.x,y:f.ty||f.y,z:.5,col:'#ffa040',r:3});if(f.k==='p_bolt')dyn.push({x:f.tx,y:f.ty,z:.5,col:'#a0dcff',r:4});});
  list.forEach(function(e){if(!e.dead)dyn.push({x:e.x,y:e.y,z:1,col:'#ffe6b0',r:e.M&&e.M[7]?2.6:1.7,ent:1});});
  if(P.d){var dc=FLD.toWorld(.5,.6);dyn.push({x:dc[0],y:dc[1],z:1,col:'#ffd27a',r:4.5,ent:1});}
  if(!nobg)MC.lighting(ctx,iso,R.lights,W,H,t,R.amb,dyn);
  /* damage numbers / DODGE / CRIT / +xp (after the light so they stay bright) */
  ctx.textAlign='center';ctx.textBaseline='bottom';ctx.direction='ltr';
  nums=nums.filter(function(n){n.t+=dt;if(n.t>1.1)return false;var p=iso.p(n.x+n.dx,n.y,n.z+n.t*1.2+(n.small?.95:0));var size=fs(n.big?27:n.small?13:19);var pop=n.t<.12?1+(.12-n.t)*3:1;ctx.globalAlpha=Math.min(1,(1.1-n.t)*3);label(p[0],p[1],n.txt,n.col,Math.round(size*pop),900);ctx.globalAlpha=1;return true;});
  if(nums.length>60)nums.splice(0,nums.length-60);
  /* "who walks out?" while the streamer chooses (viewers see it too) */
  if(ph==='pick'&&!P.pa){var py=H*.215,ps2=fs(17);ctx.textAlign='center';ctx.textBaseline='middle';ctx.direction='rtl';ctx.font='900 '+ps2+'px Cairo,system-ui,sans-serif';var txt='⚔️ '+T('ba_pick_t');var tw2=ctx.measureText(txt).width+ps2*1.4;ctx.globalAlpha=.85+Math.sin(t*4)*.15;ctx.fillStyle='rgba(10,8,16,.72)';ctx.fillRect(W/2-tw2/2,py-ps2*.85,tw2,ps2*1.7);ctx.globalAlpha=1;label(W/2,py,txt,'#ffd23d',ps2,900);ctx.direction='ltr';ctx.textBaseline='bottom';}
  if(flashT>0){ctx.fillStyle='rgba(255,255,255,'+flashT+')';ctx.fillRect(0,0,W,H);flashT=Math.max(0,flashT-dt*1.6);}
  ctx.restore();
  if(now-hudT>220){hudT=now;hud();}else placeInfo();
}
requestAnimationFrame(frame);
/* click a fighter on the map to send them (control page only, while choosing) */
function hitTest(ev){var r=cv.getBoundingClientRect(),mx=ev.clientX-r.left,my=ev.clientY-r.top,best=null,bd=1e9;
  (P.f||[]).forEach(function(f){if(!f[10])return;var v=V['f'+f[0]];if(!v)return;var p=iso.p(v.x,v.y,0),top=iso.p(v.x,v.y,v.h||2.6);var cx=p[0],cy=(p[1]+top[1])/2,hw=Math.max(18,iso.tw*.6),hh=Math.max(24,(p[1]-top[1])/2+12);
    if(Math.abs(mx-cx)<hw&&Math.abs(my-cy)<hh){var d=Math.abs(mx-cx)+Math.abs(my-cy);if(d<bd){bd=d;best=f[1];}}});return best;}
function hitMob(ev){var r=cv.getBoundingClientRect(),mx=ev.clientX-r.left,my=ev.clientY-r.top,best=null,bd=1e9;
  (P.m||[]).forEach(function(m){var v=V['m'+m[0]];if(!v)return;var p=iso.p(v.x,v.y,0),top=iso.p(v.x,v.y,v.h||2.2);var cx=p[0],cy=(p[1]+top[1])/2,hw=Math.max(18,iso.tw*.6*(m[8]||1)),hh=Math.max(24,(p[1]-top[1])/2+12);
    if(Math.abs(mx-cx)<hw&&Math.abs(my-cy)<hh){var d=Math.abs(mx-cx)+Math.abs(my-cy);if(d<bd){bd=d;best=m[0];}}});return best;}
/* Mohammad #4: a click on a character opens a small menu — «هجوم» (send them to duel) or «معلومات الشخصية»; the streamer chooses */
if(!A.obs){var lcEl=$('baLobbyCard');if(lcEl)lcEl.addEventListener('click',function(e){var li=e.target.closest&&e.target.closest('li[data-u]');if(!li||E.phase!=='lobby')return;var u=li.getAttribute('data-u');
  if(li.getAttribute('data-a')==='rem'){kick(u);return;}if(!E.pick(u)){baToast(T('ba_m_full'));return;}P=E.pub();A.publish(P);hud(true);});}
/* Nov 6: in the lobby a click on a candidate on the field puts them in the squad (or takes them out) — the lists live in ⚙ now */
function lobbyMenu(u,ev){var w=E.waiting[u],st=$('stage'),r0=st.getBoundingClientRect();var m=document.createElement('div');m.id='baCMenu';m.className='ba-cmenu';
  var hd=document.createElement('div');hd.className='cm-h';hd.appendChild(BT.name(w.name,w.color));m.appendChild(hd);
  function btn(txt,ok,fn,main){var b=document.createElement('button');b.type='button';b.className='btn btn-sm '+(main&&ok?'btn-main':'btn-ghost');b.textContent=txt;b.disabled=!ok;b.addEventListener('click',function(e){e.stopPropagation();closeCMenu();fn();});m.appendChild(b);}
  var inSq=E.squad.indexOf(u)>=0,full=E.squad.length>=E.cfg.squadMax;
  if(inSq)btn(T('ba_m_rem'),true,function(){kick(u);});
  else btn(T('ba_m_add'),!full,function(){E.pick(u);P=E.pub();A.publish(P);hud(true);},true);
  btn('ℹ '+(EN()?'Character info':'معلومات الشخصية'),true,function(){E.closeInfo();E.askInfo(u,'',w.name,w.color);P=E.pub();A.publish(P);hud(true);});
  if(!inSq&&full){var n=document.createElement('small');n.textContent=T('ba_m_full');m.appendChild(n);}
  st.appendChild(m);var x=ev.clientX-r0.left+10,y=ev.clientY-r0.top-10;var mw=m.offsetWidth,mh=m.offsetHeight;x=Math.max(6,Math.min(r0.width-mw-6,x));y=Math.max(6,Math.min(r0.height-mh-6,y));m.style.left=x+'px';m.style.top=y+'px';}
function closeCMenu(){var m=$('baCMenu');if(m)m.remove();}
function openCMenu(u,ev){closeCMenu();var f=E.fOf(u);if(E.phase==='lobby'&&E.waiting[u]){lobbyMenu(u,ev);return;}if(!f)return;var st=$('stage'),r0=st.getBoundingClientRect();var m=document.createElement('div');m.id='baCMenu';m.className='ba-cmenu';
  var hd=document.createElement('div');hd.className='cm-h';hd.appendChild(BT.name(f.name,f.color));m.appendChild(hd);
  function btn(txt,ok,fn){var b=document.createElement('button');b.type='button';b.className='btn btn-sm '+(ok?'btn-main':'btn-ghost');b.textContent=txt;b.disabled=!ok;b.addEventListener('click',function(e){e.stopPropagation();closeCMenu();fn();});m.appendChild(b);}
  var canAtk=E.phase==='pick'&&!E.paused&&f.alive;
  btn('⚔ '+(EN()?'Attack':'هجوم'),canAtk,function(){sendF(u);});
  btn('ℹ '+(EN()?'Character info':'معلومات الشخصية'),true,function(){E.closeInfo();E.askInfo(u,'',f.name,f.color);P=E.pub();A.publish(P);hud(true);});
  if(!canAtk){var n=document.createElement('small');n.textContent=!f.alive?(EN()?'Out of the fight':'خرج من القتال'):E.phase==='duel'?(EN()?'A duel is running':'مبارزة جارية الآن'):(EN()?'Attack opens when it is your pick':'الهجوم متاح وقت الاختيار');m.appendChild(n);}
  st.appendChild(m);var x=ev.clientX-r0.left+10,y=ev.clientY-r0.top-10;var mw=m.offsetWidth,mh=m.offsetHeight;x=Math.max(6,Math.min(r0.width-mw-6,x));y=Math.max(6,Math.min(r0.height-mh-6,y));m.style.left=x+'px';m.style.top=y+'px';}
if(!A.obs){document.addEventListener('pointerdown',function(ev){var m=$('baCMenu');if(m&&!m.contains(ev.target))closeCMenu();},true);
  cv.addEventListener('click',function(ev){if(document.body.classList.contains('lay-editing'))return;var u=hitTest(ev);if(u){openCMenu(u,ev);return;}
    /* Nov 6 (Mohammad, 10:06 PM): monster / boss stats are the streamer's alone — a click on a mob or the boss opens its card
       (chat has no command for it). Only on this control page, never from the OBS overlay. */
    var mid=hitMob(ev);if(mid&&engine()){E.closeInfo();if(E.enemyInfo(mid)){P=E.pub();A.publish(P);hud(true);}}});
  cv.addEventListener('mousemove',function(ev){var u=E.inRaid()||E.phase==='lobby'?hitTest(ev):null;hoverU=u||'';cv.style.cursor=(u||hitMob(ev))?'pointer':'';});}


/* ---------- !معلومات / !getinfo card: big and clear on stream, next to the character (Kukoro shows the same sheet) ---------- */
function portrait(ent,w,h){var c=document.createElement('canvas');var d=Math.min(2,window.devicePixelRatio||1);c.width=Math.round(w*d);c.height=Math.round(h*d);c.className='gi-pic';var g=c.getContext('2d');g.setTransform(d,d*0,0,d,0,0);g.imageSmoothingEnabled=false;
  var hh=(ent.h||2.2),tw=Math.min(w/1.45,h/(hh*.62+.75));var I=new MC.Iso(g,{tw:tw,ox:w/2,oy:h-tw*.42});I.dpr=d;ent.x=0;ent.y=0;MC.drawEntity(I,ent,performance.now()/1000);return c;}
function giRow(ic,label,val,bar,col){var r=document.createElement('div');r.className='gi-st';var i=document.createElement('span');i.className='gi-ic';i.textContent=ic;r.appendChild(i);var l=document.createElement('span');l.className='gi-l';l.textContent=label;r.appendChild(l);var v=document.createElement('b');v.textContent=val;r.appendChild(v);
  if(bar!=null){var b=document.createElement('span');b.className='gi-bar';var f=document.createElement('i');f.style.width=Math.round(Math.max(0,Math.min(1,bar))*100)+'%';if(col)f.style.background=col;b.appendChild(f);r.appendChild(b);}return r;}
function chips(host,label,list,cls){if(!list.length)return;var r=document.createElement('div');r.className='gi-chips '+(cls||'');var l=document.createElement('span');l.className='gi-cl';l.textContent=label;r.appendChild(l);list.forEach(function(x){var c=document.createElement('span');c.className='gi-chip';c.textContent=x;r.appendChild(c);});host.appendChild(r);}
function tname(t){var T0=BTR.TYPE[t];return T0?T0.ic+' '+L2(T0):t;}
function buildCard(g){var en=EN(),box=document.createElement('div');box.className='gi-in '+(g.t==='m'?'gi-mob'+(g.boss?' gi-boss':''):'gi-player');
  var hd=document.createElement('div');hd.className='gi-hd';
  if(g.t==='p'){var lk=BT.lookOf(g.u,g.c);hd.appendChild(portrait({kind:'player',scale:1,face:0,name:g.name,color:g.c,look:lk,avatar:CFG.av&&BT.avatar(g.u)?BT.img(BT.avatar(g.u)):null,weapon:WMAP[BTR.CLASSES[g.cls].w],wcol:WCOL[g.gear.w],armour:BTR.ARMOUR[g.gear.a].col,anim:{},h:2.05},120,150));
    var tx=document.createElement('div');tx.className='gi-tx';var nm=BT.name(g.name,g.c,'gi-nm');tx.appendChild(nm);var C=BTR.CLASSES[g.cls];var sub=document.createElement('div');sub.className='gi-sub';[C.ic+' '+L2(C),'LV '+g.lv,g.inSquad?'':T('gi_out')].filter(Boolean).forEach(function(x){var c=document.createElement('span');c.className='gi-chip';c.textContent=x;sub.appendChild(c);});tx.appendChild(sub);
    var xp=document.createElement('div');xp.className='gi-xp';var xb=document.createElement('span');xb.className='gi-bar xp';var xi=document.createElement('i');xi.style.width=(g.xpN?Math.round(g.xp/g.xpN*100):100)+'%';xb.appendChild(xi);xp.appendChild(document.createTextNode(T('gi_xp')+' '));xp.appendChild(xb);var xt=document.createElement('small');xt.textContent=g.xpN?g.xp+'/'+g.xpN:T('gi_max');xp.appendChild(xt);tx.appendChild(xp);hd.appendChild(tx);}
  else{var S=g.boss?BTR.BOSSES[g.kind]:BTR.MOBS[g.kind];hd.appendChild(portrait({kind:g.boss?'boss:'+g.kind:g.kind,scale:g.boss?.62:1,face:0,anim:{},h:(MC.MOBH[g.boss?'boss:'+g.kind:g.kind]||2.1)*(g.boss?.62:1)},120,150));
    var tx2=document.createElement('div');tx2.className='gi-tx';var nm2=document.createElement('div');nm2.className='gi-nm';nm2.textContent=(g.boss?'👑 ':'')+L2(S);tx2.appendChild(nm2);var F=BTR.FAM[g.fam];var sub2=document.createElement('div');sub2.className='gi-sub';[(g.boss?'👑 '+T('gi_boss'):''),'LV '+g.lv,F.ic+' '+L2(F)].filter(Boolean).forEach(function(x){var c=document.createElement('span');c.className='gi-chip';c.textContent=x;sub2.appendChild(c);});tx2.appendChild(sub2);
    var ty=document.createElement('div');ty.className='gi-sub';ty.className='gi-sub gi-type';ty.textContent=T('gi_type')+': '+tname(g.atkT)+(g.atk2?' + '+tname(g.atk2):'');tx2.appendChild(ty);hd.appendChild(tx2);}
  box.appendChild(hd);
  var st=document.createElement('div');st.className='gi-grid';
  if(g.t==='p'){st.appendChild(giRow('❤️',T('gi_hp'),g.hp+'/'+g.max,g.hp/g.max,g.hp/g.max>.35?'#5cd65c':'#ffb347'));st.appendChild(giRow('🗡️',T('gi_atk'),String(g.atk)+' '+BTR.TYPE[g.atkT].ic));st.appendChild(giRow('🛡️',T('gi_def'),g.def+'%'));
    st.appendChild(giRow('👟',T('gi_spd'),String(g.spd)));st.appendChild(giRow('💨',T('gi_agi'),g.agi+'%'));st.appendChild(giRow('🎯',T('gi_crit'),g.crit+'%'));st.appendChild(giRow('☠️',T('gi_kills'),String(g.kills)));}
  else{st.appendChild(giRow('❤️',T('gi_hp'),g.max?g.hp+'/'+g.max:'—',g.max?g.hp/g.max:null,'#e04a4a'));st.appendChild(giRow('🗡️',T('gi_dmg'),String(g.dmg)));st.appendChild(giRow('🛡️',T('gi_def'),g.def+'%'));
    st.appendChild(giRow('💨',T('gi_agi'),g.agi+'%'));st.appendChild(giRow('🎯',T('gi_crit'),g.crit+'%'));}
  box.appendChild(st);var rc=document.createElement('div');rc.className='gi-r';var main=box;box=rc;
  if(g.t==='p'){var pk=document.createElement('div');pk.className='gi-sec';var h=document.createElement('h5');h.textContent=T('gi_perks');pk.appendChild(h);
    g.perks.forEach(function(p){var r=document.createElement('div');r.className='gi-perk';var i=document.createElement('span');i.className='gi-pi';i.textContent=BTR.PERKS[p.t].ic+BTR.FAM[p.f].ic;r.appendChild(i);var t2=document.createElement('span');t2.textContent=BTR.perkText(p,en);r.appendChild(t2);if(p.tier===2){var tg=document.createElement('b');tg.className='gi-t2';tg.textContent='II';r.appendChild(tg);}pk.appendChild(r);});box.appendChild(pk);
    var ge=document.createElement('div');ge.className='gi-sec gi-gear';var h2=document.createElement('h5');h2.textContent=T('gi_gear');ge.appendChild(h2);
    var C2=BTR.CLASSES[g.cls],W=BTR.WEAPON[g.gear.w],wn=BTR.WPN_NAME[C2.w];var wl=document.createElement('div');wl.textContent=C2.ic+' '+wName(g.cls,g.gear.w)+(g.gear.we?' ✨ '+L2(BTR.WPN_ENCH[g.gear.we]):'');ge.appendChild(wl);
    var AR=BTR.ARMOUR[g.gear.a];var al=document.createElement('div');al.textContent='🛡️ '+(en?AR.en+' armour':'درع '+AR.ar)+(g.gear.ae?' ✨ '+L2(BTR.ARM_ENCH[g.gear.ae]):'');ge.appendChild(al);
    var it=g.gear.items.map(function(k){var I=BTR.ITEMS[k];return I.ic+' '+L2(I);});var il=document.createElement('div');il.textContent='🎒 '+(it.length?it.join(' · '):T('gi_none'));ge.appendChild(il);box.appendChild(ge);
    var res=[];BTR.TYPES.forEach(function(t){var v=g.res[t];if(v!=null&&v!==1)res.push(BTR.TYPE[t].ic+' ×'+v);});chips(box,T('gi_res'),res,'res');
    var ft=document.createElement('div');ft.className='gi-ft';var pw=BT.POWERS[g.pw];ft.textContent=T('gi_power')+': '+PW_IC[pw]+' '+(en?PW_EN[pw]:PW_AR[pw])+' ('+(g.pwUsed?T('gi_pc',{p:g.pc||0}):T('gi_ready'))+')';box.appendChild(ft);}
  else{var wl2=BTR.weakList(g.boss?BTR.BOSSES[g.kind]:BTR.MOBS[g.kind]);chips(box,T('gi_weak'),wl2.weak.map(tname),'weak');chips(box,T('gi_res'),wl2.res.map(tname),'res');chips(box,T('gi_imm'),wl2.immune.map(tname),'imm');
    if(g.trait){var tr=document.createElement('div');tr.className='gi-sec';var h3=document.createElement('h5');h3.textContent=T('gi_trait');tr.appendChild(h3);var d3=document.createElement('div');d3.textContent=L2(BTR.TRAIT[g.trait]);tr.appendChild(d3);box.appendChild(tr);}
    if(g.p2){var p2=document.createElement('div');p2.className='gi-sec'+(g.phase2?' on':'');var h4=document.createElement('h5');h4.textContent=T('gi_p2');p2.appendChild(h4);var d4=document.createElement('div');d4.textContent=L2(BTR.PHASE2[g.p2]);p2.appendChild(d4);box.appendChild(p2);}}
  var lc=document.createElement('div');lc.className='gi-l2';while(main.firstChild)lc.appendChild(main.firstChild);main.appendChild(lc);main.appendChild(rc);
  if(!A.obs){var xb=document.createElement('button');xb.type='button';xb.className='gi-x';xb.textContent='✕';xb.setAttribute('aria-label',EN()?'Close':'إغلاق');xb.addEventListener('click',function(ev){ev.stopPropagation();closeInfo();});main.appendChild(xb);}
  var cap=document.createElement('div');cap.className='gi-cap';cap.textContent=T('ba_card_t');main.appendChild(cap);
  return main;}

/* ---------- the wave screen: name + what is coming; it stays until the streamer / a mod skips it (button, !التالي, N) or after the set seconds ---------- */
function renderWave(){var el=$('baWave');if(!el)return;var wc=P.wc;if(!wc){if(!el.hidden){el.hidden=true;el._k='';}return;}
  var key=JSON.stringify([wc,(P.m||[]).length,EN()]);if(el._k===key)return;var same=el._w===wc[0]&&!el.hidden;el._k=key;el._w=wc[0];A.clear(el);
  var box=document.createElement('div');box.className='bw-in'+(wc[1]?' boss':'');if(same)box.style.animation='none';
  var h=document.createElement('div');h.className='bw-t';h.textContent=wc[1]?'👑 '+T('ba_boss_w'):(P.ws>0?T('ba_wave',{w:wc[0],n:P.ws}):T('ba_wave_inf',{w:wc[0]}));box.appendChild(h);
  var EV=wc[2]&&BTR.EVENTS[wc[2]];if(EV){var ev=document.createElement('div');ev.className='bw-ev';var b=document.createElement('b');b.textContent=EV.ic+' '+(EN()?EV.en:EV.ar);ev.appendChild(b);ev.appendChild(document.createTextNode(' — '+(EN()?EV.d.en:EV.d.ar)));box.appendChild(ev);}
  var cnt={},order=[];(P.m||[]).forEach(function(m){var k=(m[7]?'b:':'')+m[1];if(!cnt[k]){cnt[k]=0;order.push(k);}cnt[k]++;});
  var ul=document.createElement('div');ul.className='bw-mobs';order.forEach(function(k){var boss=k.indexOf('b:')===0,kind=boss?k.slice(2):k;var c=document.createElement('span');c.className='bw-mob'+(boss?' boss':'');
    var S=boss?BTR.BOSSES[kind]:BTR.MOBS[kind];var nm=S?(EN()?S.en:S.ar):mobName(kind);c.textContent=(boss?'👑 ':'')+nm+(cnt[k]>1?' ×'+cnt[k]:'');ul.appendChild(c);});box.appendChild(ul);
  if(wc[1]){var bk=order[0]&&order[0].slice(2),B=BTR.BOSSES[bk];if(B&&B.p2&&BTR.PHASE2[B.p2]){var p2=document.createElement('div');p2.className='bw-ev';p2.textContent=T('gi_p2')+': '+(EN()?BTR.PHASE2[B.p2].en:BTR.PHASE2[B.p2].ar);box.appendChild(p2);}}
  var ft=document.createElement('div');ft.className='bw-ft';
  if(!A.obs){var sk=document.createElement('button');sk.type='button';sk.className='btn btn-main btn-sm';sk.textContent=EN()?'Continue ▶':'متابعة ▶';sk.addEventListener('click',function(){if(engine()){E.skipCard();P=E.pub();A.publish(P);hud(true);}});ft.appendChild(sk);}
  var tx=document.createElement('span');if(wc[3]>=0)tx.textContent=EN()?'Starts in '+wc[3]+' s':'تبدأ بعد '+wc[3]+' ث';else{tx.appendChild(document.createTextNode(EN()?'The streamer or a mod continues: ':'يتابع الستريمر أو المشرف: '));tx.appendChild(BT.cmdEl(EN()?'!next':'!التالي'));}ft.appendChild(tx);box.appendChild(ft);
  el.appendChild(box);el.hidden=false;fitWave();}
/* centre the wave card on the map itself (not on map + side panel) */
function fitWave(){var el=$('baWave');if(!el||el.hidden)return;var r=cv.getBoundingClientRect(),r0=STG.getBoundingClientRect();if(!r.width)return;el.style.inset='auto';el.style.left=(r.left-r0.left)+'px';el.style.top=(r.top-r0.top)+'px';el.style.width=r.width+'px';el.style.height=r.height+'px';}
window.addEventListener('resize',function(){setTimeout(fitWave,50);});document.addEventListener('fullscreenchange',function(){setTimeout(fitWave,80);});
var giKey='';
function closeInfo(){if(engine()){E.closeInfo();P=E.pub();A.publish(P);}var el=$('baInfo');if(el){el.hidden=true;}giKey='';}
function renderInfo(){var el=$('baInfo');if(!el)return;var g=P.gi;if(!g){if(giKey){el.hidden=true;giKey='';}return;}
  if(CFG.giOn===false){if(!el.hidden){el.hidden=true;giKey='';}return;} /* «كرت المعلومات على الشاشة» off: rely on the bot's reply in chat */
  var k=JSON.stringify([g.key,g.hp,g.max,g.pwUsed,g.kills,g.phase2,EN(),CFG.av]);if(!A.obs&&giEditing()){return;}if(k!==giKey){var was=!el.hidden&&giKey;giKey=k;A.clear(el);var cd=buildCard(g);el.appendChild(cd);lastCard=cd;el.hidden=false;el.className='ba-info'+(g.t==='m'?' ba-info-mob':'') /* not «mob»: the site's global .mob class (styles.css) squashed the card */+(was?' no-anim':'');giTools(el);}
  placeInfo();}
function placeInfo(){var el=$('baInfo');if(!el||el.hidden||!P.gi)return;var px=0,gap=0;el.style.transform='';el.style.width='';el.style.fontSize='';
  var g=P.gi,v=g.id?V[(g.t==='p'?'f':'m')+g.id]:null,Ar=giArea(el),sw=Ar.w,sh=Ar.h,avH=Math.max(60,Ar.bot-Ar.top),cw=el.offsetWidth,ch=el.offsetHeight,x,y;
  var bh=0; /* no bar on top of the card any more (Nov 6, 10:33 PM) */
  if(v&&v.x!=null){var p=iso.p(v.x,v.y,(v.h||2)*.6);var r1=cv.getBoundingClientRect(),r0=(el.offsetParent||STG).getBoundingClientRect();px=p[0]+(r1.left-r0.left);var py=p[1]+(r1.top-r0.top);gap=Math.max(24,iso.tw*.9);
    x=px<sw/2?px+gap:px-gap-cw;y=py-ch/2;}else{x=(sw-cw)/2;y=Ar.top+avH*.12;}
  var fit=Math.min(1,(avH*.9)/Math.max(1,ch+bh),(sw*.96)/Math.max(1,cw)),kmax=Math.min((avH)/Math.max(1,ch+bh),(sw*.98)/Math.max(1,cw));
  var k=Math.min((CFG.giS||1)*fit,kmax);el._fit=fit;el._kmax=kmax;el._k=k;
  el.style.transform=Math.abs(k-1)>.001?'scale('+k.toFixed(3)+')':'';el.style.transformOrigin='0 0';cw*=k;ch*=k;var th=bh*k;
  if(v&&v.x!=null&&px>=sw/2)x=px-gap-cw;
  if(CFG.giX!=null&&CFG.giY!=null){x=CFG.giX*sw;y=CFG.giY*sh;}
  x=Math.max(4,Math.min(sw-cw-4,x));y=Math.max(Ar.top+th,Math.min(Ar.bot-ch,y));
  el.style.left=Math.round(x)+'px';el.style.top=Math.round(y)+'px';}
/* Mohammad Nov 4 (2nd pass): no buttons on the live card. In «تعديل الشكل» a fixed copy of the card appears (it does not close):
   drag it to move it, drag its corner to make it bigger/smaller, ↺ puts it back beside the character. Saved with the settings. */
var lastCard=null;
/* Nov 6 (Mohammad): the live card is a little window for the host — drag it by its top (picture + name), drag the ◢ corner to
   make it bigger / smaller, ↺ puts it back beside the character, a click outside closes it. The place and size are saved and go
   to the OBS overlay (live, and in the OBS link). While the pointer is on the card it doesn't time out. */
var giHold=false,giDrag=null;
/* Nov 6 (Mohammad, 10:06 PM: «بدي ياه يكون سهل التحكم فيه»): the card is a proper little window on the host's page.
   A bar on top of it: ⠿ drag here (mouse or finger), ↺ back beside the character, ✕ close. The ◢ corner resizes it.
   It always stays inside the screen, between the header and the bottom bar (also after the window is resized), and a click
   outside it closes it. Place and size are saved, so it opens where you left it, and go to the OBS overlay. */
function giTools(el){if(A.obs)return;
  /* Nov 6, 10:33 PM (Mohammad: «بدي ياه مثل قبل بس بقدر حركه براحتي بدون هاد الشريط»): the card looks exactly as before
     (no bar on top); grab it ANYWHERE to move it. A subtle ◢ corner (or the mouse wheel over the card) makes it bigger/smaller. */
  var rs=document.createElement('div');rs.className='gi-rs';rs.title=T('ba_gi_rs');rs.setAttribute('aria-hidden','true');el.appendChild(rs);
  var rt=document.createElement('button');rt.type='button';rt.className='gi-rt';rt.textContent='↺';rt.title=T('ba_gi_rt');rt.setAttribute('aria-label',T('ba_gi_rt'));rt.hidden=CFG.giX==null&&(CFG.giS||1)===1;el.appendChild(rt);
}
/* the free area for the card, in the card's own parent coordinates: the whole stage minus the header on top and the bar at the bottom */
function giArea(el){var op=(el&&el.offsetParent)||STG,r0=op.getBoundingClientRect(),top=0,bot=r0.height;
  if(!A.obs){var hd=document.querySelector('header.top');if(hd){var hr=hd.getBoundingClientRect();if(hr.height&&hr.bottom>r0.top)top=Math.max(top,hr.bottom-r0.top);}
    var dk=$('baDock');if(dk){var dr=dk.getBoundingClientRect();if(dr.height&&dr.top<r0.bottom)bot=Math.min(bot,dr.top-r0.top);}}
  return {w:r0.width,h:r0.height,top:top+6,bot:bot-6};}
if(!A.obs){(function(){var el=$('baInfo');if(!el)return;
  el.addEventListener('pointerenter',function(){giHold=true;});el.addEventListener('pointerleave',function(){if(!giDrag)giHold=false;});
  el.addEventListener('click',function(e){var t=e.target;
    if(t.closest&&t.closest('.gi-rt')){e.stopPropagation();CFG.giX=null;CFG.giY=null;CFG.giW=0;CFG.giS=1;var b=t.closest('.gi-rt');b.hidden=true;placeInfo();save();P.gp=[null,null,1];A.publish(P);}});
  el.addEventListener('pointerdown',function(e){if((e.pointerType==='mouse'&&e.button!==0)||giEditing())return;var t=e.target;if(t.closest('.gi-x,.gi-rt'))return;
    var rs=t.closest('.gi-rs'); /* anywhere else on the card = move it */
    e.preventDefault();e.stopPropagation();var A0=giArea(el),r=el.getBoundingClientRect();
    giDrag={rs:!!rs,id:e.pointerId,x:e.clientX,y:e.clientY,l:el.offsetLeft,t:el.offsetTop,vw:r.width,k:el._k||1,fit:el._fit||1,kmax:el._kmax||1.8,A:A0};
    giHold=true;el.classList.add('gi-drag');document.body.classList.add('gi-dragging');
    /* the card is only pinned once it really moves (a plain click on it changes nothing) */
    try{el.setPointerCapture(e.pointerId)}catch(_){}});
  el.addEventListener('pointermove',function(e){var d=giDrag;if(!d||e.pointerId!==d.id)return;e.preventDefault();var dx=e.clientX-d.x,dy=e.clientY-d.y;
    if(!d.rs&&!d.mv){if(Math.abs(dx)+Math.abs(dy)<3)return;d.mv=true;}
    if(d.rs){var want=d.k*Math.max(.3,(d.vw+(dx+dy)/2)/Math.max(1,d.vw));want=Math.min(want,d.kmax);CFG.giW=0;CFG.giS=Math.max(.6,Math.min(1.8,want/Math.max(.05,d.fit)));}
    else{CFG.giX=(d.l+dx)/Math.max(1,d.A.w);CFG.giY=(d.t+dy)/Math.max(1,d.A.h);}
    placeInfo();});
  function up(e){var d=giDrag;if(!d||(e&&e.pointerId!==d.id))return;giDrag=null;el.classList.remove('gi-drag');document.body.classList.remove('gi-dragging');
    try{el.releasePointerCapture(d.id)}catch(_){}
    if(!d.rs&&!d.mv){giHold=el.matches(':hover');return;}
    placeInfo();var A1=giArea(el);if(CFG.giX!=null){CFG.giX=Math.max(0,Math.min(1,el.offsetLeft/Math.max(1,A1.w)));CFG.giY=Math.max(0,Math.min(1,el.offsetTop/Math.max(1,A1.h)));}
    giHold=el.matches(':hover');var rb=el.querySelector('.gi-rt');if(rb)rb.hidden=CFG.giX==null&&(CFG.giS||1)===1;save();P.gp=[CFG.giX,CFG.giY,CFG.giS];A.publish(P);}
  el.addEventListener('pointerup',up);el.addEventListener('pointercancel',up);el.addEventListener('lostpointercapture',up);
  /* the mouse wheel over the card makes it bigger / smaller (no bar needed) */
  var wT=null;el.addEventListener('wheel',function(e){if(giEditing()||el.hidden)return;e.preventDefault();var k=el._k||1,fit=el._fit||1,kmax=el._kmax||1.8;
    var want=Math.min(kmax,k*(e.deltaY<0?1.08:1/1.08));CFG.giW=0;CFG.giS=Math.max(.6,Math.min(1.8,want/Math.max(.05,fit)));placeInfo();
    var rb=el.querySelector('.gi-rt');if(rb)rb.hidden=false;clearTimeout(wT);wT=setTimeout(function(){save();P.gp=[CFG.giX,CFG.giY,CFG.giS];A.publish(P);},250);},{passive:false});
  /* a window change (resize, fullscreen, rotate) never leaves the card off-screen or under the bar */
  function re(){setTimeout(placeInfo,30);}window.addEventListener('resize',re);document.addEventListener('fullscreenchange',re);window.addEventListener('orientationchange',re);})();}
function giEditing(){return STG.classList.contains('lay-editing')||document.body.classList.contains('lay-editing');}
function giGhost(){var gh=$('baInfoEd');if(gh)return gh;gh=document.createElement('div');gh.id='baInfoEd';gh.className='ba-info ba-info-ed';gh.hidden=true;STG.appendChild(gh);
  var body=document.createElement('div');body.className='gie-body';gh.appendChild(body);
  var cap=document.createElement('div');cap.className='gie-cap';gh.appendChild(cap);
  var rs=document.createElement('div');rs.className='gie-rs';rs.title=EN()?'Drag to resize':'اسحب للتكبير أو التصغير';gh.appendChild(rs);
  var rt=document.createElement('button');rt.type='button';rt.className='gie-rt';rt.textContent='↺';rt.title=EN()?'Back beside the character':'رجّعه جنب الشخصية';gh.appendChild(rt);
  function drag(h,fn,el0){h.addEventListener('pointerdown',function(e){if(e.button>0||e.target===rt)return;e.preventDefault();e.stopPropagation();var r=gh.getBoundingClientRect(),r0=STG.getBoundingClientRect(),s={x:e.clientX,y:e.clientY,l:r.left-r0.left,t:r.top-r0.top,w:r.width,gs:CFG.giS||1};gh.classList.add('gi-drag');try{h.setPointerCapture(e.pointerId)}catch(_){}
    function mv(ev){fn(ev,s,r0);ghostPlace();}function up(){h.removeEventListener('pointermove',mv);h.removeEventListener('pointerup',up);h.removeEventListener('pointercancel',up);gh.classList.remove('gi-drag');save();}
    h.addEventListener('pointermove',mv);h.addEventListener('pointerup',up);h.addEventListener('pointercancel',up);});}
  drag(gh,function(ev,s,r0){CFG.giX=(s.l+ev.clientX-s.x)/r0.width;CFG.giY=(s.t+ev.clientY-s.y)/r0.height;});
  drag(rs,function(ev,s,r0){var d=((ev.clientX-s.x)*(EN()?1:-1)+(ev.clientY-s.y))/2;CFG.giW=0;CFG.giS=Math.max(.6,Math.min(1.8,s.gs*(1+d/Math.max(120,s.w))));});
  rt.addEventListener('click',function(e){e.stopPropagation();CFG.giX=null;CFG.giY=null;CFG.giW=0;CFG.giS=1;save();ghostPlace();});
  return gh;}
function ghostShow(on){var gh=giGhost();if(!on||A.obs||CFG.giOn===false){gh.hidden=true;return;}
  var body=gh.querySelector('.gie-body');A.clear(body);
  if(lastCard){var cl=lastCard.cloneNode(true);var src=lastCard.querySelectorAll('canvas'),dst=cl.querySelectorAll('canvas');for(var ci=0;ci<dst.length&&ci<src.length;ci++){try{dst[ci].getContext('2d').drawImage(src[ci],0,0);}catch(_){}}body.appendChild(cl);}
  else{var ph=document.createElement('div');ph.className='gi-in gie-ph';ph.textContent=EN()?'Character info card':'كرت معلومات الشخصية';body.appendChild(ph);}
  gh.hidden=false;ghostPlace();}
function ghostPlace(){var gh=$('baInfoEd');if(!gh||gh.hidden)return;var sw=STG.clientWidth,sh=STG.clientHeight;gh.style.transform='';gh.style.transformOrigin='0 0';
  var cw=gh.offsetWidth,ch=gh.offsetHeight,k=Math.min((CFG.giS||1)*Math.min(1,(sh*.84)/Math.max(1,ch),(sw*.96)/Math.max(1,cw)),(sh*.92)/Math.max(1,ch),(sw*.96)/Math.max(1,cw));
  gh.style.transform=Math.abs(k-1)>.001?'scale('+k.toFixed(3)+')':'';cw*=k;ch*=k;var auto=CFG.giX==null||CFG.giY==null;
  var x=auto?(sw-cw)/2:CFG.giX*sw,y=auto?(sh-ch)/2:CFG.giY*sh;x=Math.max(0,Math.min(sw-cw,x));y=Math.max(0,Math.min(sh-ch,y));gh.style.left=Math.round(x)+'px';gh.style.top=Math.round(y)+'px';
  var cap=gh.querySelector('.gie-cap');cap.textContent=auto?(EN()?'Now: beside the character — drag to fix a place':'الآن: بجانب الشخصية — اسحبه لتثبيت مكان'):(EN()?'Drag to move · corner to resize · ↺ reset':'اسحب للتحريك · الزاوية للتكبير · ↺ للإرجاع');}
if(!A.obs&&window.MutationObserver){var giWas=false;new MutationObserver(function(){var on=giEditing();if(on===giWas)return;giWas=on;var el=$('baInfo');if(on&&el){el.hidden=true;}else{giKey='';}ghostShow(on);}).observe(STG,{attributes:true,attributeFilter:['class']});
  window.addEventListener('resize',function(){setTimeout(ghostPlace,60);});}

/* ---------- HUD (DOM) ---------- */
var hudKey='';
function headEl(u,col,name){var s=document.createElement('span');s.className='bt-head';var url=CFG.av?BT.avatar(u):null;
  if(url){var im=document.createElement('img');im.src=url;im.alt='';im.referrerPolicy='no-referrer';s.appendChild(im);}
  else{var lk=BT.lookOf(u,col);var c=document.createElement('canvas');c.width=8;c.height=8;c.getContext('2d').drawImage(MC.face('player',lk.skin,lk.hair,lk.style),0,0);s.appendChild(c);}return s;}
function bar(cls,v,col){var b=document.createElement('span');b.className='ba-bar '+cls;var i=document.createElement('i');i.style.width=Math.round(Math.max(0,Math.min(1,v))*100)+'%';if(col)i.style.background=col;b.appendChild(i);return b;}
function jcSecs(){if(P.ph!=='lobby')return 0;if(engine())return joinEnd?Math.max(0,Math.ceil((joinEnd-Date.now())/1000)):0;return +P.jc||0;}
function jcSync(){var lb=$('baLobby');if(!lb)return;var jc=lb.querySelector('.ba-jc'),js=jcSecs();
  if(js>0){if(!jc){jc=document.createElement('div');jc.className='ba-jc';lb.appendChild(jc);}var t='⏳ '+T('ba_jcount',{s:js});if(jc.textContent!==t)jc.textContent=t;}else if(jc)jc.remove();}
setInterval(jcSync,250);
/* Nov 6 (10:06 PM): the join pill never touches the bottom bar — on a short window it is lifted just above it */
function jbClear(){if(A.obs)return;var lb=$('baLobby'),lc=lb&&lb.parentNode,dk=$('baDock');if(!lc||!dk)return;if(giEditing()){lc.style.transform='';return;}
  lc.style.transform='';var r=lb.getBoundingClientRect(),d=dk.getBoundingClientRect();if(!r.height||!d.height)return;var over=r.bottom-(d.top-12);if(over>0)lc.style.transform='translateY('+(-Math.ceil(over))+'px)';}
setInterval(jbClear,500);window.addEventListener('resize',function(){setTimeout(jbClear,40);});
function hudSoon(){setTimeout(function(){hud(true)},30);}
function hud(force){var ph=P.ph,EN_=EN();renderInfo();renderWave();
  /* waves bar */
  var wt=$('baWaveT');wt.textContent=ph==='lobby'?T('ba_lobby_t'):P.ws>0?T('ba_wave',{w:Math.max(1,P.w),n:P.ws}):T('ba_wave_inf',{w:Math.max(1,P.w)});
  $('baMapT').textContent=T('ba_lvl',{m:(CFG.map==='random'&&(P.ph||'lobby')==='lobby'?'🎲 '+T('map_random'):T('map_'+(P.map||CFG.map))),l:P.lv||1});
  var wb=$('baWbar'),n=P.ws>0?P.ws:Math.max(5,Math.ceil((P.w||1)/5)*5),key=n+':'+P.w+':'+ph+':'+(P.rooms||[]).join(',');var live=ph==='pick'||ph==='duel';if(wb._k!==key){wb._k=key;A.clear(wb);for(var i=1;i<=n;i++){var s=document.createElement('span');var boss=P.ws>0?i===n:i%5===0;s.className='ba-ws'+(boss?' boss':'')+(i<P.w||(i===P.w&&(ph==='break'||ph==='won'))?' done':'')+(i===P.w&&live?' now':'');var evk=(P.rooms||[])[i-1];s.textContent=boss?'💀':(evk&&BTR.EVENTS[evk]?BTR.EVENTS[evk].ic:'');if(evk&&!boss)s.classList.add('ev');wb.appendChild(s);}}
  $('baWaves').classList.toggle('off',ph==='lobby'); /* Nov 6: the waves bar shows only once the battle runs */
  /* boss bar */
  var bm=(P.m||[]).find(function(m){return m[7]});var bb=$('baBoss');bb.classList.toggle('off',!bm);
  if(bm){var bk=bm[1].slice(5);$('baBname').textContent=T('boss_'+bk);$('baBhp').style.width=Math.round(bm[4]/bm[5]*100)+'%';$('baBhpT').textContent=bm[4]+' / '+bm[5];}
  /* squad */
  var sq=$('baSquad');var fs=P.f||[];var sk=JSON.stringify([ph,fs.map(function(f){return [f[0],f[6],f[16],f[11],f[10],f[13],f[14]]}),P.sq,EN_,CFG.av,P.d]);
  if(sq._k!==sk||force){sq._k=sk;A.clear(sq);
    var rows=ph==='lobby'?(P.sq||[]).map(function(s){return {u:s[0],name:s[1],col:s[2],lv:s[3],pw:s[4],cls:s[5],hp:1,max:1,ch:0,k:0,alive:1}}):fs.map(function(f){return {u:f[1],name:f[2],col:f[3],lv:f[8],pw:f[9],cls:f[18],hp:f[6],max:f[7],ch:f[16]?0:1,k:f[11],alive:f[10],duel:P.d&&P.d[0]===f[0]}});
    var h=document.createElement('div');h.className='ba-sqh';h.textContent=T('ba_picked',{n:rows.length,m:A.obs?rows.length:E.cfg.squadMax});sq.appendChild(h);
    if(!rows.length){var em=document.createElement('div');em.className='ba-empty';em.textContent=T('ba_none');sq.appendChild(em);}
    var ul=document.createElement('ul');ul.className='ba-sql'+(rows.length>6?' tight':'');rows.forEach(function(r){var li=document.createElement('li');if(!r.alive)li.className='dead';else if(r.duel)li.className='duel';
      li.appendChild(headEl(r.u,r.col,r.name));var mid=document.createElement('div');mid.className='ba-sqm';var top=document.createElement('div');top.className='ba-sqt';
      top.appendChild(BT.name(r.name,r.col));var lv=document.createElement('span');lv.className='ba-lv';lv.textContent=(r.cls&&BTR.CLASSES[r.cls]?BTR.CLASSES[r.cls].ic+' ':'')+'LV'+r.lv;top.appendChild(lv);mid.appendChild(top);
      mid.appendChild(bar('hp',r.hp/r.max));var pwn=BT.POWERS[r.pw];li.appendChild(mid);
      var side=document.createElement('div');side.className='ba-sqs';var ic=document.createElement('span');ic.className='ba-pic';ic.textContent=PW_IC[pwn];ic.title=EN_?PW_EN[pwn]:PW_AR[pwn];side.appendChild(ic);var kk=document.createElement('span');kk.className='ba-k';kk.textContent='☠'+r.k;side.appendChild(kk);li.appendChild(side);ul.appendChild(li);});
    sq.appendChild(ul);}
  /* kill feed */
  var fd=$('baFeed');var fk=JSON.stringify(P.feed);if(fd._k!==fk){fd._k=fk;A.clear(fd);(P.feed||[]).slice(-5).forEach(function(x){var r=document.createElement('div');r.className='ba-fr';
    if(x.dead){r.appendChild(document.createTextNode('💀 '));r.appendChild(BT.name(x.dead,x.dc));}else{r.appendChild(BT.name(x.by||'?',x.bc));r.appendChild(document.createTextNode(' ⚔ '+(x.boss?'👑 ':'')));var mb=document.createElement('bdi');mb.textContent=mobName(x.mk);r.appendChild(mb);}fd.appendChild(r);});}
  fd.classList.toggle('off',!(P.feed||[]).length);
  /* lobby / join box */
  var lb=$('baLobby');var lk=JSON.stringify([ph==='lobby'?'l':'r',P.q,P.nq,P.sq,EN_]);if(lb._k!==lk){lb._k=lk;A.clear(lb);
    var l1=document.createElement('div');l1.className='bt-join-l';
    BT.fill(l1,T('ba_join1',{a:'\u0001'}),[BT.cmdEl(EN_?'!join':'!دخول')]);lb.appendChild(l1);lb.classList.add('slim'); /* Nov 6 (Mohammad): the join box says only «اكتب !دخول لتدخل» */
    if(ph==='lobby'){var lc=$('baLobbyCard');A.clear(lc);
      /* the squad, in the middle of the lobby (control page: click a name = kick) */
      if((P.sq||[]).length){var sh=document.createElement('div');sh.className='ba-qh ba-sqh2';sh.textContent=T('ba_picked',{n:P.sq.length,m:A.obs?P.sq.length:E.cfg.squadMax});lc.appendChild(sh);var su=document.createElement('ul');su.className='ba-ql ba-sq2';
        P.sq.forEach(function(s){var li=document.createElement('li');li.setAttribute('data-u',s[0]);li.setAttribute('data-a','rem');if(!A.obs)li.title=T('ba_m_rem');li.appendChild(BT.name(s[1],s[2]));if(!A.obs){var x=document.createElement('span');x.className='lq-x';x.textContent='✕';li.appendChild(x);}su.appendChild(li);});lc.appendChild(su);}}}
  $('baLobbyCard').hidden=!(ph==='lobby'&&(P.sq||[]).length); /* Nov 6: no empty «0 waiting» card on an idle screen */
  lb.classList.toggle('off',ph!=='lobby'||!!P.wc); /* Nov 6 (10:06 PM): the join box is only in the lobby — it disappears the moment the battle starts */
  /* the join timer (⚙ «وقت الدخول»): a countdown in the join box while it runs */
  jcSync();
  /* end card */
  var end=$('baEnd');if(ph==='won'||ph==='lost'){var ek=ph+P.lv+fs.length;if(end._k!==ek){end._k=ek;A.clear(end);var h3=document.createElement('h3');h3.textContent=T(ph==='won'?'ba_won':'ba_lost');end.appendChild(h3);var sub=document.createElement('p');sub.textContent=T(ph==='won'?'ba_won_s':'ba_lost_s',{l:P.lv});end.appendChild(sub);
      var best=fs.slice().sort(function(a,b){return b[11]-a[11]})[0];if(best){var mv=document.createElement('div');mv.className='ba-mvp';mv.appendChild(document.createTextNode('👑 '+T('ba_mvp')+': '));mv.appendChild(headEl(best[1],best[3],best[2]));mv.appendChild(BT.name(best[2],best[3]));mv.appendChild(document.createTextNode(' · ☠'+best[11]));end.appendChild(mv);}
      if(!A.obs){var row=document.createElement('div');row.className='ba-endbtns';
        var rb=document.createElement('button');rb.type='button';rb.className='btn btn-ghost btn-sm';rb.textContent='🔁 '+(EN()?'Replay the level':'إعادة المرحلة');rb.addEventListener('click',function(){if(E.again(false)){A.sfx('start');P=E.pub();A.publish(P);hud(true);}});row.appendChild(rb);
        var nb=document.createElement('button');nb.type='button';nb.className='btn btn-main btn-sm';nb.textContent='⏭ '+(EN()?'Next level':'المستوى التالي');nb.disabled=ph!=='won';nb.addEventListener('click',function(){if(E.again(true)){A.sfx('start');P=E.pub();A.publish(P);hud(true);}});row.appendChild(nb);
        var lb2=document.createElement('button');lb2.type='button';lb2.className='btn btn-ghost btn-sm';lb2.textContent=EN()?'Lobby':'اللوبي';lb2.addEventListener('click',toLobby);row.appendChild(lb2);end.appendChild(row);}
      end.className='bt-win '+(ph==='won'?'won':'lost');end.hidden=false;}}else{end.hidden=true;end._k='';}
  /* control panel */
  if(!A.obs)ctrlHud(force);
}
function mobName(k){var M=MC.MOBS[k]||MC.BOSSES[k];return M?(EN()?M.en:M.ar):k;}
function ctrlHud(force){var ph=E.phase,EN_=EN(),raid=E.inRaid();
  $('baGo').textContent=T(ph==='lobby'?'ba_start':(ph==='won'||ph==='lost')?'ba_again':E.paused?'ba_resume':'ba_start');$('baGo').disabled=raid&&!E.paused;
  $('baPause').textContent=T(E.paused?'ba_resume':'ba_pause');$('baPause').disabled=!raid;$('baNext').disabled=!(ph==='pick'||ph==='break')||E.paused;$('baBossBtn').disabled=!(ph==='pick'||ph==='break')||E.m.some(function(m){return m.boss});
  var dl=E.duel&&[E.byId(E.duel.f),E.byId(E.duel.m)];
  var st=E.paused?T('ba_st_paused'):ph==='lobby'?T('ba_st_lobby',{q:E.queue().length,s:E.squad.length}):ph==='pick'?T('ba_st_fight',{w:E.wave,a:E.alive().length,m:E.m.length}):ph==='duel'?T('ba_st_duel',{f:dl&&dl[0]?dl[0].name:'',m:dl&&dl[1]?mobLabel(dl[1].kind):''}):ph==='break'?(E.nextAt?T('ba_st_break'):T('ba_st_break_m')):ph==='won'?T('ba_st_won',{l:E.level()}):T('ba_st_lost',{l:E.level()});status(st);
  var key=JSON.stringify([E.squad,E.queue().map(function(u){var w=E.waiting[u];return [u,w.jump,w.hide,w.votes]}),ph,EN_,E.paused,E.f.map(function(f){return [f.alive,f.hp,f.jump,f.votes,f.hide]})]);var sl=$('baSqList'),ql=$('baQList')||document.createElement('ul');if(sl._k===key&&!force)return;sl._k=key;
  A.clear(sl);A.clear(ql);$('baSqN').textContent=E.squad.length+'/'+E.cfg.squadMax;
  E.squad.forEach(function(u){var w=E.waiting[u]||{name:u},f=E.fOf(u);var li=document.createElement('li');var b=document.createElement('button');b.type='button';b.className='ba-pick'+(f&&!f.alive?' dead':'');
    if(raid){/* during the raid: click = this one walks out to fight */b.disabled=!(ph==='pick'&&f&&f.alive&&!E.paused);var sw=document.createElement('span');sw.className='go';sw.textContent=f&&!f.alive?'💀':'⚔️';b.appendChild(sw);if(f&&f.jump){var jb=document.createElement('b');jb.textContent='⬆ ';b.appendChild(jb);}}
    b.appendChild(BT.name(w.name,w.color));var lv=document.createElement('small');lv.textContent=' LV'+BT.lvlOf(E.xp[u])+' '+PW_IC[BT.powerOf(u)]+(f&&raid?' ❤'+f.hp:'')+(f&&f.votes?' ★'+f.votes:'');b.appendChild(lv);
    if(!raid){var x=document.createElement('span');x.className='x';x.textContent='✖';b.appendChild(x);b.title=T('ba_m_rem');b.addEventListener('click',function(){kick(u);});}
    else b.addEventListener('click',function(){sendF(u);});
    li.appendChild(b);sl.appendChild(li);});
  E.queue().forEach(function(u){var w=E.waiting[u];var li=document.createElement('li');var b=document.createElement('button');b.type='button';b.className='ba-pick'+(w.hide?' hid':'');b.disabled=E.squad.length>=E.cfg.squadMax||ph==='duel';if(w.jump){var j=document.createElement('b');j.textContent='⬆ ';b.appendChild(j);}b.appendChild(BT.name(w.name,w.color));var lv=document.createElement('small');lv.textContent=' LV'+BT.lvlOf(E.xp[u])+(w.votes?' ★'+w.votes:'');b.appendChild(lv);b.addEventListener('click',function(){E.pick(u);P=E.pub();A.publish(P);hud(true);});li.appendChild(b);ql.appendChild(li);});
}
/* ---------- control panel wiring ---------- */
if(!A.obs){
  $('baGo').addEventListener('click',function(){if(E.paused){pauseT();return;}if(E.phase==='won'||E.phase==='lost'){toLobby();startBattle();return;}startBattle();});
  $('baPause').addEventListener('click',pauseT);$('baNext').addEventListener('click',nextOrAgain);$('baBossBtn').addEventListener('click',function(){E.summonBoss();P=E.pub();A.publish(P);hud(true);});$('baReset').addEventListener('click',toLobby);
  
  $('baEmpty').addEventListener('click',function(){if(E.inRaid())return;E.squad.slice().forEach(function(u){E.leave(u);});P=E.pub();A.publish(P);hud(true);});
  var mp=$('baMaps');MAPS.concat(['random']).forEach(function(m){var b=document.createElement('button');b.type='button';b.className='seg ba-map'+(m==='random'?' ba-map-rnd':'')+(CFG.map===m?' on':'');b.setAttribute('data-map',m);b.setAttribute('role','radio');var sw=document.createElement('canvas');sw.width=16;sw.height=16;var sg=sw.getContext('2d');
    if(m==='random'){/* a 2x2 of four map floors + a die: «عشوائي» */['grass','snow','netherrack','jgrass'].forEach(function(tn,i){sg.drawImage(MC.tex(tn,2),0,0,16,16,(i%2)*8,Math.floor(i/2)*8,8,8);});sg.fillStyle='#f4f1e8';sg.fillRect(4,4,8,8);sg.fillStyle='#1a1a22';[[6,6],[9,9],[6,9],[9,6]].forEach(function(q){sg.fillRect(q[0],q[1],2,2);});}
    else sg.drawImage(MC.tex(MC.MAPS[m].floor[0],2),0,0);b.appendChild(sw);var s=document.createElement('span');s.setAttribute('data-i18n','map_'+m);s.textContent=T('map_'+m);b.appendChild(s);
    b.addEventListener('click',function(){if(E.inRaid())return;CFG.map=m;applyCfg();[].forEach.call(mp.children,function(x){x.classList.toggle('on',x.getAttribute('data-map')===m);x.setAttribute('aria-checked',String(x.getAttribute('data-map')===m))});save();P=E.pub();A.publish(P);hud(true);});mp.appendChild(b);});
  var wv=$('baWavesSel');wv.value=String(CFG.waves);wv.addEventListener('change',function(){CFG.waves=+wv.value;applyCfg();save();P=E.pub();A.publish(P);hud(true);});
  var pwr=$('baPwRate');if(pwr){pwr.value=CFG.pwR||'normal';pwr.addEventListener('change',function(){CFG.pwR=pwr.value;applyCfg();save();});}
  var df=$('baDiff');df.value=CFG.diff;df.addEventListener('change',function(){CFG.diff=df.value;applyCfg();save();});
  var bs=$('baBossSel');bs.value=CFG.boss;bs.addEventListener('change',function(){CFG.boss=bs.value;applyCfg();save();});
  var sz=$('baSize');sz.value=String(CFG.size);sz.addEventListener('change',function(){CFG.size=+sz.value;applyCfg();while(E.squad.length>E.cfg.squadMax&&E.phase==='lobby')E.squad.pop();save();hud(true);});
  BT.tmr($('baBreakRow'),function(){return CFG.brk},function(v){CFG.brk=v;applyCfg();save();},4);
  BT.tmr($('baCardRow'),function(){return CFG.card},function(v){CFG.card=v;applyCfg();save();},6);
  BT.tmr($('baJoinRow'),function(){return CFG.join},function(v){CFG.join=v;joinEnd=v>0?Date.now()+v*1000:0;save();},60);
  [['baGiOn','giOn'],['baBot','bot'],['baAv','av'],['baAutoF','autoF'],['baSpeak','speak'],['baEvents','events'],['baLoot','loot']].forEach(function(a){var e=$(a[0]);e.checked=!!CFG[a[1]];e.addEventListener('change',function(){CFG[a[1]]=e.checked;applyCfg();save();hud(true);});});
  BT.xtra($('baXtra'),'lamma-baxtra');
  if(CFG.join>0)joinEnd=Date.now()+CFG.join*1000;
  A.onLang(function(){hud(true);});
}
if(window.LammaAvatars&&LammaAvatars.onChange)LammaAvatars.onChange(function(){hud(true);});

/* ---------- Nov 6 (Mohammad): the page is the game, full screen like the wheels ----------
   The side panel (commands / how to play / cam / buttons) is gone. Top-left: «?» = a centred popup with how the game works and
   every chat command, and ⚙ = the settings drawer (squad & waiting lists, maps, settings, layout editor, OBS link).
   Bottom bar: ⛶ fullscreen, the status line, and only the buttons that make sense right now. */
var HELP={all:[['!دخول','!join','ادخل الفريق مباشرة.','Go straight into the squad.'],
  ['!قفز','!jump','يقفز شخصك في الساحة لمدة 5 ثوانٍ.','Your character bounces on the field for 5 seconds.'],
  ['!اختبي','!hide','ليس أنا الآن: تخرج للمبارزة في الآخر.','Not me for now: you fight last.'],
  ['!صوت اسم','!vote name','صوّت لمن يخرج للمبارزة التالية (★ فوق رأسه).','Vote who fights the next duel (★ over their head).'],
  ['!قوة','!power','القوة تمتلئ ببطء (الشريط البني). حين يتوهّج القلب اكتب !قوة لتطلقها في مبارزتك — لا تنطلق وحدها.','Your power fills slowly (the brown bar). When the heart glows type !power to fire it in your duel — it never fires by itself.'],
  ['!معلومات','!getinfo','بطاقتك: الصنف والمستوى والصحة والعدّة. أو اكتب بعده اسم لاعب (معلومات الوحوش للستريمر فقط).','Your card: class, level, HP and gear. Or add a player’s name (monster stats are for the streamer only).'],
  ['!سكن اسم','!skin name','سكن ماينكرافت الخاص بك، من مستوى يحدده الستريمر.','Your own Minecraft skin, from a level the streamer sets.'],
  ['!خروج','!leave','اخرج من الفريق — في اللوبي فقط، لا خروج بعد بدء المعركة.','Leave the squad — lobby only, no leaving once the battle starts.']],
 mod:[['!ابدأ','!start','ابدأ المعركة','Start the battle'],['!وقف','!pause','إيقاف / استئناف','Pause / resume'],['!التالي','!next','المقاتل التالي','Next fighter'],['!زعيم','!boss','اذهب إلى الزعيم','Go to the boss'],['!جديد','!reset','رجوع إلى اللوبي','Back to the lobby']],
 keys:[['🖱 وحش','🖱 Mob','اضغط على وحش أو الزعيم في الساحة لتفتح بطاقة معلوماته (للستريمر فقط، لا أمر لها في الشات).','Click a mob or the boss on the field to open its stats card (streamer only, no chat command).'],['Space','Space','إيقاف / استئناف','Pause / resume'],['N','N','المقاتل التالي','Next fighter'],['F','F','شاشة كاملة','Fullscreen'],['Esc','Esc','إغلاق النوافذ','Close popups']]};
/* Nov 6, 10:33 PM (Mohammad): closing the help shrinks it and flies it into the «?» button top-left, where it disappears,
   then «?» pulses once — so the host learns where to find it again. */
function closeHelp(){var m=$('baHelp');if(!m||m._closing)return;m._closing=true;var b=$('baHelpBtn');if(b)b.setAttribute('aria-expanded','false');
  var c=m.querySelector('.bh-card');function done(){if(m.parentNode)m.remove();if(b){b.classList.remove('ba-land');void b.offsetWidth;b.classList.add('ba-land');setTimeout(function(){b.classList.remove('ba-land');},1700);try{b.focus({preventScroll:true});}catch(_){}}}
  var br=b&&b.offsetParent!==null?b.getBoundingClientRect():null;
  if(!c||!br||!c.animate){done();return;}
  var cr=c.getBoundingClientRect(),dx=(br.left+br.width/2)-(cr.left+cr.width/2),dy=(br.top+br.height/2)-(cr.top+cr.height/2),sc=Math.max(.02,br.width/Math.max(1,cr.width));
  m.classList.add('bh-out');m.style.pointerEvents='none';
  var an=c.animate([{transform:'translate(0,0) scale(1)',opacity:1,borderRadius:'16px'},
    {transform:'translate('+(dx*.35).toFixed(1)+'px,'+(dy*.2).toFixed(1)+'px) scale(.62)',opacity:1,offset:.35},
    {transform:'translate('+dx.toFixed(1)+'px,'+dy.toFixed(1)+'px) scale('+sc.toFixed(3)+')',opacity:.15,borderRadius:'50%'}],
    {duration:620,easing:'cubic-bezier(.55,.05,.35,1)',fill:'forwards'});
  m.animate([{backgroundColor:'rgba(6,7,10,.62)'},{backgroundColor:'rgba(6,7,10,0)'}],{duration:520,easing:'ease-out',fill:'forwards'});
  var fin=false;function f(){if(fin)return;fin=true;done();}an.onfinish=f;setTimeout(f,900);}
function openHelp(){if(A.obs)return;var o=$('baHelp');if(o){if(o._closing)o.remove();else{closeHelp();return;}}setDrawer(false);var en=EN();
  var ov=document.createElement('div');ov.id='baHelp';ov.className='ba-help';ov.setAttribute('role','dialog');ov.setAttribute('aria-modal','true');ov.setAttribute('aria-labelledby','baHelpT');ov.dir=en?'ltr':'rtl';
  var c=document.createElement('div');c.className='bh-card';ov.appendChild(c);
  var hd=document.createElement('div');hd.className='bh-hd';var h=document.createElement('h3');h.id='baHelpT';h.textContent=T('ba_help_t');hd.appendChild(h);
  var x=document.createElement('button');x.type='button';x.className='bh-x';x.textContent='✕';x.setAttribute('aria-label',T('ba_close'));x.addEventListener('click',closeHelp);hd.appendChild(x);c.appendChild(hd);
  var bd=document.createElement('div');bd.className='bh-body';c.appendChild(bd);
  function sub(t){var s=document.createElement('h4');s.textContent=t;bd.appendChild(s);}
  sub('🎮 '+T('ba_help_how'));var ol=document.createElement('ol');ol.className='bh-how';['ba_h1','ba_h2','ba_h3','ba_h4','ba_h6','ba_h7','ba_h5'].forEach(function(k){var li=document.createElement('li');li.textContent=T(k);ol.appendChild(li);});bd.appendChild(ol);
  function list(rows){var ul=document.createElement('ul');ul.className='bh-cmds';rows.forEach(function(r){var li=document.createElement('li');var k=document.createElement('span');k.className='bh-k';
    (en?[r[1],r[0]]:[r[0],r[1]]).forEach(function(w,i){if(i&&w===r[0]&&r[0]===r[1])return;var ch=document.createElement('bdi');ch.className='bh-chip';ch.dir=/[\u0600-\u06ff]/.test(w)?'rtl':'ltr';ch.textContent=w;k.appendChild(ch);});
    li.appendChild(k);var d=document.createElement('span');d.className='bh-d';d.textContent=en?r[3]:r[2];li.appendChild(d);ul.appendChild(li);});bd.appendChild(ul);}
  sub('💬 '+T('ba_help_all'));list(HELP.all);sub('🛡 '+T('ba_help_mod'));list(HELP.mod);sub('⌨️ '+T('ba_help_keys'));list(HELP.keys);
  ov.addEventListener('pointerdown',function(e){if(e.target===ov)closeHelp();});
  document.body.appendChild(ov);var b=$('baHelpBtn');if(b)b.setAttribute('aria-expanded','true');x.focus();}
function setDrawer(on){var b=document.body,btn=$('drawerBtn');if(!btn)return;b.classList.toggle('drawer-open',!!on);btn.setAttribute('aria-expanded',String(!!on));}
function fsEl(){return document.fullscreenElement||document.webkitFullscreenElement||null;}
function toggleFs(){var de=document.documentElement;if(fsEl()){(document.exitFullscreen||document.webkitExitFullscreen).call(document);return;}var r=de.requestFullscreen||de.webkitRequestFullscreen,pr=r&&r.call(de);if(pr&&pr.catch)pr.catch(function(){});}
if(!A.obs){
  var hb=$('baHelpBtn');if(hb)hb.addEventListener('click',function(e){e.stopPropagation();openHelp();});
  /* Nov 6, 10:33 PM (Mohammad): the help opens by itself every time the host opens the game page (never on OBS, never for a locked visitor) */
  setTimeout(function(){var b=$('baHelpBtn');if($('baHelp')||document.documentElement.classList.contains('ctrl-locked')||!b||b.offsetParent===null)return;openHelp();},700);
  var db=$('drawerBtn');if(db)db.addEventListener('click',function(e){e.stopPropagation();closeHelp();setDrawer(!document.body.classList.contains('drawer-open'));});
  var dx=$('drawerClose');if(dx)dx.addEventListener('click',function(){setDrawer(false);var d=$('drawerBtn');if(d)d.focus();});
  /* a click on the game while the drawer is open just closes the drawer */
  STG.addEventListener('click',function(e){if(!document.body.classList.contains('drawer-open')||giEditing())return;e.stopPropagation();e.preventDefault();setDrawer(false);},true);
  document.addEventListener('pointerdown',function(e){if(!document.body.classList.contains('drawer-open'))return;var t=e.target;if(t.closest&&t.closest('#side,#baCorner,.ba-help,.fs-dock'))return;if(STG.contains(t))return;setDrawer(false);},true);
  /* the «تعديل الشكل» bar that layout.js puts above the stage goes to the top of the drawer */
  (function(){var wrap=document.querySelector('.stage-wrap'),side=$('side'),head=side&&side.querySelector('.drawer-head');
    function grab(){var bar=wrap&&wrap.querySelector(':scope>.lay-bar');if(!bar||!side)return false;side.insertBefore(bar,head?head.nextSibling:side.firstChild);return true;}
    if(!grab()&&wrap&&window.MutationObserver){var mo=new MutationObserver(function(){if(grab())mo.disconnect();});mo.observe(wrap,{childList:true});setTimeout(function(){mo.disconnect();},10000);}
})();
  /* header height → the stage sits between the header and the bottom bar */
  (function(){var top=document.querySelector('header.top');function hdr(){if(top)document.documentElement.style.setProperty('--hdr',top.offsetHeight+'px');}hdr();window.addEventListener('resize',hdr);if(window.ResizeObserver&&top)new ResizeObserver(hdr).observe(top);})();
  /* ⛶ fullscreen of the whole page; in real fullscreen the header and bar fade after 3 s without movement */
  (function(){var fb=$('dockFs'),de=document.documentElement,b=document.body,idleT=null;if(!fb)return;if(!(de.requestFullscreen||de.webkitRequestFullscreen))fb.hidden=true;
    function lbl(){var t=fsEl()?T('ba_fs_x'):T('ba_fs');fb.title=t;fb.setAttribute('aria-label',t);fb.setAttribute('aria-pressed',String(!!fsEl()));}
    fb.addEventListener('click',toggleFs);
    function arm(){clearTimeout(idleT);b.classList.remove('ui-idle');if(!fsEl())return;idleT=setTimeout(function(){if(b.classList.contains('drawer-open')||$('baHelp')||!fsEl()){arm();return;}b.classList.add('ui-idle');},3000);}
    ['pointermove','pointerdown','keydown','touchstart'].forEach(function(n){document.addEventListener(n,arm,{passive:true});});
    function fsc(){lbl();arm();setTimeout(fitWave,80);}document.addEventListener('fullscreenchange',fsc);document.addEventListener('webkitfullscreenchange',fsc);
    A.onLang&&A.onLang(lbl);lbl();})();
  /* keyboard: Space pause/resume, N next fighter, F fullscreen, Esc closes */
  document.addEventListener('keydown',function(e){if(e.key==='Escape'){if($('baHelp')){closeHelp();return;}if(document.body.classList.contains('drawer-open')){setDrawer(false);return;}if(P.gi&&!giEditing()){closeInfo();}closeCMenu();return;}
    var tg=e.target,tn=tg&&tg.tagName;if(tn==='INPUT'||tn==='TEXTAREA'||tn==='SELECT'||(tg&&tg.isContentEditable)||e.ctrlKey||e.metaKey||e.altKey||giEditing())return;
    var k=(e.key||'').toLowerCase();if(k===' '){if(tn==='BUTTON'||!E.inRaid())return;e.preventDefault();pauseT();}else if(k==='n'||k==='ى'||k==='ن'){var nb=$('baNext');if(nb&&!nb.disabled)nb.click();}else if(k==='f'||k==='ب'){toggleFs();}});
  /* bottom bar: the real buttons stay in the drawer's code; these call them and show only what fits the moment */
  [['dqGo','baGo'],['dqPause','baPause'],['dqNext','baNext'],['dqBoss','baBossBtn'],['dqLobby','baReset'],['dqEmpty','baEmpty']].forEach(function(p){var m=$(p[0]),o=$(p[1]);if(m&&o)m.addEventListener('click',function(){if(!o.disabled)o.click();dockSync();});});
}
function dockSync(){if(A.obs)return;var ph=E.phase,raid=E.inRaid(),end=ph==='won'||ph==='lost';
  function set(id,show,dis,lbl,ic){var b=$(id);if(!b)return;b.hidden=!show;b.disabled=!!dis;if(lbl!=null){var l=b.querySelector('.dl');if(l&&l.textContent!==lbl)l.textContent=lbl;b.title=lbl;}if(ic!=null){var i=b.querySelector('.di');if(i)i.textContent=ic;}}
  var hasQ=E.queue().length>0,anyJ=E.queue().some(function(u){return E.waiting[u]&&E.waiting[u].jump});
  set('dqGo',!raid||E.paused,false,E.paused?T('ba_resume'):end?T('ba_again'):T('ba_start'),E.paused?'▶':end?'🔁':'▶');
  set('dqPause',raid&&!E.paused,false,T('ba_pause'),'⏸');
  set('dqNext',raid,!(ph==='pick'||ph==='break')||E.paused);
  set('dqBoss',raid&&(ph==='pick'||ph==='break')&&!E.m.some(function(m){return m.boss}),E.paused);
  set('dqLobby',raid||end);
  
  set('dqEmpty',ph==='lobby'&&E.squad.length>0);
  var st=$('dockStatus'),src=$('baStatus');if(st&&src){var t=src.textContent.trim();if(st.textContent!==t){st.textContent=t;st.title=t;}}
  [['baHelpBtn','ba_help_t'],['drawerBtn','bt_settings']].forEach(function(a){var b=$(a[0]);if(b){var t=T(a[1]);b.title=t;b.setAttribute('aria-label',t);}});}
if(!A.obs)setInterval(dockSync,250);
/* ---------- layout editor ---------- */
BT.logo($('btLogo'));
/* Nov 6: new default layout (no side panel, the arena fills the screen) — a new key so it applies once */
window.LammaLayout&&window.LammaLayout.init({root:$('gs'),stage:$('stage'),key:'battle-arena3',items:[
  {id:'arena',z:1,code:'a',kind:'box',ar:'الساحة',en:'Arena',def:{x:0,y:0,w:100,h:100,s:1},minW:30,minH:30},
  {id:'waves',z:4,code:'w',kind:'box',ar:'الموجات',en:'Waves',def:{x:24,y:8.5,w:52,h:9,s:1},minW:14,minH:5},
  {id:'boss',z:4,code:'b',kind:'box',ar:'صحة الزعيم',en:'Boss HP',def:{x:30,y:18.5,w:40,h:7,s:1},minW:14,minH:5},
  {id:'squad',z:3,code:'s',kind:'box',ar:'الفريق',en:'Squad',def:{x:1.5,y:17,w:19,h:58,s:1,v:false},minW:10,minH:18},
  {id:'feed',z:3,code:'f',kind:'box',ar:'القتلات',en:'Kill feed',def:{x:80,y:66,w:18.5,h:17,s:1},minW:10,minH:8},
  {id:'lobby',z:2,code:'l',kind:'box',ar:'صندوق الدخول',en:'Join box',def:{x:33,y:82,w:34,h:7,s:1},minW:12,minH:5},
]});
hud(true);A.publish(P);
A.start();
})();
