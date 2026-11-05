/* wheel.js — العجلة / Spin wheel.
   Elimination mode ("عجلة الشخصنة / Personal wheel", default): the wheel lands on someone who does NOT win — a big on-screen
   list of everyone still on the wheel opens (#whPicker, also on the overlay) and they kick someone out with !طرد 3 / !kick name
   inside the pick time (or with no time limit: until a kick or the streamer skips). Shields are OFF by default; the
   "إضافة شيلدات / Add shields" setting gives everyone 🛡️: a kicked player with a shield keeps their place (shield breaks),
   a landed player with a shield may instead bring someone back with !revive name (!رجع). When 2 are left, the last spin
   picks the WINNER. Classic mode: the landed name simply wins.
   Timers (wheelopts.js): pick time, spin time (0 = spins until stopped), auto next spin, join window — each "no limit" or
   custom seconds; saved per channel and carried in the OBS link (&tm= &sh= &pk=).
   Everything on the wheel is public, so the overlay can mirror it all; panels stay on the control page only.
   Pages: wheel-pick.html (old wheel-shield.html / wheel.html forward to it) (body data-wmode="elim", data-game "wheel") and wheel-classic.html (data-wmode="classic",
   data-game "wheel-classic") fix the mode, so each wheel has its own page, its own saved list and its own OBS link.
   Without data-wmode the old in-panel mode toggle comes back. */
(function(){
'use strict';
var A=window.App,C=A.C,$=A.$,el=A.el;
var FIX=document.body.getAttribute('data-wmode');if(FIX!=='classic'&&FIX!=='elim')FIX='';
var SKEY='lamma-'+(A.game||'wheel')+'-'+A.channel; /* "lamma-wheel-<ch>" for the personal wheel (the old shield wheel's key, so lists carry over) */
var WO=window.LammaWheelOpts;
A.allowSolo();
A.strings({
 ar:{g_title:'العجلة',g_how:'الشات بيدخل بـ !دخول أو !join. العجلة بتوقف على حدا، بتطلع قائمة كبيرة عالشاشة فيها كل اللي بالعجلة، وهو بيختار مين يطلع بـ !طرد رقم أو اسم (أو !kick). بيقدر يطلع لحالو بـ !خروج. لما يضلو 2، آخر لفة بتعطي الفائز.',
  w_m_elim:'إقصاء',w_m_classic:'كلاسيك (اللي بتوقف عليه بيربح)',
  w_entries:'الأسماء (كل اسم بسطر)',w_open:'الشات بيقدر يدخل بـ !دخول أو !join',w_remove:'شيل الفائز بعد الدورة',w_dur:'مدة الدورة',w_dur_none:'بدون وقت (لحد ما توقفها)',w_nolimit:'بدون وقت',w_custom:'وقت مخصص',w_join_t:'وقت الدخول',w_join_left:'الدخول بيسكّر بعد {s} ث',w_stop_spin:'وقّف العجلة ⏹',w_skip:'تخطّي الدور',w_picker_on:'قائمة الطرد الكبيرة عالشاشة',w_sh_on:'إضافة شيلدات 🛡️',w_pk_title:'{x} اختار مين يطلع',w_pk_click:'اضغط على اسم لتطردو',w_pk_out:'برّا!',w_pk_safe:'محمي 🛡️',w_pk_pass:'ما حدا طلع',w_pk_nolimit:'بدون وقت',w_ev_pass:'⏭️ {x} تخطّى الدور، ما حدا طلع',w_cmd_skip:'تخطّي الدور (ما حدا بيطلع)',w_st_choose_nl:'{x} عم يختار (بدون وقت)',w_st_endless:'عم تلف… اضغط وقّف العجلة',w_title_l:'العنوان بنص العجلة',w_chatcols:'الشرايح بلون اسم كل واحد بالشات',w_avatar:'صورة القناة بنص العجلة',w_click_kick:'اضغط على أي اسم بالقائمة لتطرده',
  w_spin:'لفّ العجلة',w_spin_final:'اللفة الأخيرة 🏆',w_shuffle:'خلط',w_clear:'مسح الكل',w_clear_q:'تمسح كل الأسماء؟',w_new:'جولة جديدة (الكل يرجع)',
  w_pause:'إيقاف مؤقت',w_resume:'كمّل',w_rand:'اختيار عشوائي عنو',w_undo:'تراجع',w_add_names:'إضافة أسماء بإيدك',w_g_turn:'الدور',w_g_join:'الدخول',w_g_final:'النهائي',w_g_look:'الشكل',w_more_opts:'خيارات زيادة',w_add:'ضيف',w_settings:'الإعدادات',
  w_shields:'شيلد لكل واحد بالبداية',w_pick:'وقت الاختيار',w_timeout:'إذا خلص الوقت',w_to_random:'طرد عشوائي',w_to_streamer:'الستريمر بيختار',w_to_skip:'ما حدا بيطلع',w_fin_auto:'لفّ تلقائي بالنهائي',w_fin_dock:'النتيجة باللوحة اليسار',w_fs_set:'الإعدادات',w_vip:'الـVIP بيتحكموا بالعجلة',w_reset:'↺ ريسيت',w_reset_q:'متأكد؟ اكبس كمان مرة',
  w_auto:'لفّ تلقائي بعد كل طرد',w_auto_off:'يدوي',w_in:'بالعجلة',w_out:'برا العجلة',
  w_choose_hint:'وقت الاختيار: اضغط ✖ جنب أي اسم (أو على اسمو بالقائمة عالشاشة) لتختار عنو. برّا وقت الاختيار: ✖ بيطرد مباشرة و↩ بيرجّع مباشرة.',
  w_lay_event_ph:'سطر الأحداث (طرد، رجعة)',w_join:'اكتب !دخول أو !join',w_closed:'العجلة مسكّرة',w_count:'{n} بالعجلة',w_empty:'العجلة فاضية',w_winner:'الفائز!',w_spinning:'عم تلف…',
  w_final:'اللفة الأخيرة! اللي بتوقف عليه بيربح 🏆',w_ready:'جاهزين للفة الجاية',w_ready_final:'ضلّو اثنين… اللفة الجاية بتحدد الفائز',
  w_choosing:'{x} اختار مين يطلع',w_choose_cmd:'!طرد رقم أو اسم',w_revive_cmd:'أو بالشيلد: !رجع اسم',w_streamer_picks:'خلص الوقت — الستريمر بيختار عن {x}',
  w_paused:'متوقفة مؤقتاً ⏸',w_ev_kick:'{x} طلّع {y} برّا العجلة',w_ev_shield:'🛡️ محمي! {y} انكسر شيلدو وضل بالعجلة',w_ev_revive:'{x} رجّع {y} عالعجلة بشيلدو ✨',
  w_ev_timeout:'خلص وقت {x} — طلع {y} بالقرعة',w_ev_skip:'خلص وقت {x} وما حدا طلع',w_ev_manual_kick:'الستريمر طلّع {y}',w_ev_manual_revive:'الستريمر رجّع {y}',
  w_none_out:'لسا ما حدا طلع',w_seconds:'ث',w_kick_title:'طرد',w_revive_title:'رجّع',w_sh_add:'زيد شيلد',w_sh_take:'شيل شيلد',w_left:'{n} باقيين',
  w_st_idle:'جاهز. اضغط لفّ أو خلّي مود يكتب !لف',w_st_choose:'{x} عم يختار — باقي {s} ث',w_st_streamer:'إنت اختار عن {x}: اضغط ✖ جنب الاسم',w_st_win:'الفائز: {x} 🏆',w_st_spin:'عم تلف…',
  w_cmd_join:'ادخل العجلة',w_cmd_leave:'اطلع من العجلة',w_cmd_respin:'إعادة اللفة',w_cmd_pause:'إيقاف مؤقت / كمّل',w_cmd_undo:'تراجع',w_ev_none:'الأحداث بتطلع هون',w_sec_players:'اللاعبين',w_sec_event:'سطر الأحداث',w_sec_banner:'صندوق الدخول',w_cmd_kick:'(اللي وقفت عليه) طلّع حدا: رقمو أو اسمو',w_cmd_revive:'(اللي وقفت عليه ومعو شيلد) رجّع حدا: اسم أو رقم',w_cmd_spin:'لفّ',w_cmd_clear:'امسح الأسماء',w_cmd_new:'جولة جديدة',
  w_respin:'إعادة اللفة',w_wins:'الفائزين',w_no_wins:'لسا ما حدا ربح',w_out_c:'ربحو وانشالو',w_new_c:'رجّع الفائزين للعجلة',w_cmd_openclose:'فتح وسكّر الدخول',w_st_respin:'إعادة اللفة: النتيجة الماضية ما انحسبت'},
 en:{w_lay_event_ph:'Event line (kick, revive)',g_title:'Spin Wheel',g_how:'Chat joins with !join (or !دخول). The wheel lands on someone, a big on-screen list of everyone on the wheel opens, and they pick who leaves with !kick number or name. Anyone can leave with !leave. When 2 are left, the last spin crowns the winner.',
  w_m_elim:'Elimination',w_m_classic:'Classic (landed name wins)',
  w_entries:'Names (one per line)',w_open:'Chat can join with !join',w_remove:'Remove the winner after a spin',w_dur:'Spin time',w_dur_none:'No limit (until you stop it)',w_nolimit:'No limit',w_custom:'Custom',w_join_t:'Join window',w_join_left:'Joining closes in {s}s',w_stop_spin:'Stop the wheel ⏹',w_skip:'Skip the turn',w_picker_on:'Big kick list on screen',w_sh_on:'Add shields 🛡️',w_pk_title:'{x}, pick who leaves',w_pk_click:'Click a name to kick it',w_pk_out:'OUT!',w_pk_safe:'Protected 🛡️',w_pk_pass:'Nobody left',w_pk_nolimit:'No time limit',w_ev_pass:'⏭️ {x} skipped, nobody left',w_cmd_skip:'skip the turn (nobody leaves)',w_st_choose_nl:'{x} is choosing (no time limit)',w_st_endless:'Spinning… press Stop the wheel',w_title_l:'Title in the wheel centre',w_chatcols:'Slices in each viewer\'s chat colour',w_avatar:'Channel picture in the wheel centre',w_click_kick:'Click a name in the list to kick it',
  w_spin:'Spin the wheel',w_spin_final:'Final spin 🏆',w_shuffle:'Shuffle',w_clear:'Clear all',w_clear_q:'Clear every name?',w_new:'New round (everyone back)',
  w_pause:'Pause',w_resume:'Resume',w_rand:'Random pick for them',w_undo:'Undo',w_add_names:'Add names by hand',w_g_turn:'Turn',w_g_join:'Joining',w_g_final:'Final',w_g_look:'Look & feel',w_more_opts:'More options',w_add:'Add',w_settings:'Settings',
  w_shields:'Shields each at start',w_pick:'Pick time',w_timeout:'When time runs out',w_to_random:'Random kick',w_to_streamer:'Streamer picks',w_to_skip:'Nobody leaves',w_fin_auto:'Auto-spin in the final',w_fin_dock:'Score in the left panel',w_fs_set:'Settings',w_vip:'VIPs control the wheel',w_reset:'↺ Reset',w_reset_q:'Sure? Tap again',
  w_auto:'Auto-spin after each kick',w_auto_off:'Manual',w_in:'On the wheel',w_out:'Out of the wheel',
  w_choose_hint:'During a pick: press ✖ next to a name (or click it in the on-screen list) to choose for them. Outside a pick: ✖ removes directly and ↩ brings back directly.',
  w_join:'Type !join',w_closed:'The wheel is closed',w_count:'{n} on the wheel',w_empty:'The wheel is empty',w_winner:'Winner!',w_spinning:'Spinning…',
  w_final:'Final spin! Whoever it lands on wins 🏆',w_ready:'Ready for the next spin',w_ready_final:'Two left… the next spin picks the winner',
  w_choosing:'{x}, pick who leaves',w_choose_cmd:'!kick number or name',w_revive_cmd:'or with your shield: !revive name',w_streamer_picks:'Time\'s up — the streamer picks for {x}',
  w_paused:'Paused ⏸',w_ev_kick:'{x} kicked {y} off the wheel',w_ev_shield:'🛡️ Protected! {y}\'s shield broke and they stay',w_ev_revive:'{x} brought {y} back with their shield ✨',
  w_ev_timeout:'{x} ran out of time — {y} was drawn out',w_ev_skip:'{x} ran out of time, nobody left',w_ev_manual_kick:'The streamer removed {y}',w_ev_manual_revive:'The streamer brought back {y}',
  w_none_out:'Nobody is out yet',w_seconds:'s',w_kick_title:'Kick',w_revive_title:'Revive',w_sh_add:'Give shield',w_sh_take:'Take shield',w_left:'{n} left',
  w_st_idle:'Ready. Press spin, or a mod types !spin',w_st_choose:'{x} is choosing — {s}s left',w_st_streamer:'Pick for {x}: press ✖ next to a name',w_st_win:'Winner: {x} 🏆',w_st_spin:'Spinning…',
  w_cmd_join:'join the wheel',w_cmd_leave:'leave the wheel',w_cmd_respin:'re-spin',w_cmd_pause:'pause / resume',w_cmd_undo:'undo',w_ev_none:'Events show up here',w_sec_players:'Players',w_sec_event:'Event line',w_sec_banner:'Join box',w_cmd_kick:'(landed player) kick someone: number or name',w_cmd_revive:'(landed player with a shield) bring someone back: name or number',w_cmd_spin:'spin',w_cmd_clear:'clear names',w_cmd_new:'new round',
  w_respin:'Re-spin',w_wins:'Winners',w_no_wins:'No winners yet',w_out_c:'Won and removed',w_new_c:'Put the winners back',w_cmd_openclose:'open / close joining',w_st_respin:'Re-spin: the last result did not count'}
});
function fmt(s,o){return String(s).replace(/\{(\w)\}/g,function(_,k){return o[k]!=null?o[k]:''})}
/* segment colours come from the palette variables (--g2-w1..--g2-w6 in games2.css), so a palette swap recolours the wheel */
var COLS=['#ff3dac','#22e6ff','#ffd23d','#8205B3','#b6ff3b','#ff7a1a','#3b7bff','#a970ff','#3dffd0','#ff4b4b','#5cd65c','#c9b6ff']; /* Neon's multi-colour slices; the other themes alternate their two colours (see readTheme) */
function isLight(hex){var r=parseInt(hex.slice(1,3),16),g=parseInt(hex.slice(3,5),16),b=parseInt(hex.slice(5,7),16);return (.299*r+.587*g+.114*b)>150;}
var RTL=/[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFF]/, LTRCH=/[A-Za-z\u00C0-\u024F]/;
function isRtl(s){var m=/[\u0590-\u08FF\uFB1D-\uFDFF\uFE70-\uFEFFA-Za-z\u00C0-\u024F]/.exec(String(s));return !!(m&&RTL.test(m[0]))}

if(FIX==='classic')A.strings({
 ar:{g_title:'العجلة الكلاسيك',g_how:'الشات بيدخل بـ !دخول أو !join وبتلف العجلة، واللي بتوقف عليه بيربح 🏆. بلا طرد. فيك تشيل الفائز بعد كل لفة، أو تعيد اللفة.'},
 en:{g_title:'Classic Wheel',g_how:'Chat joins with !join (or !دخول), you spin, and whoever it lands on wins 🏆. No kicks. You can remove the winner after each spin, or re-spin.'}});
else if(FIX==='elim')A.strings({ar:{g_title:'عجلة الشخصنة'},en:{g_title:'Personal Wheel'}});
/* the FINAL (2 left): first to N landings wins */
A.strings({ar:{w_fin_on:'النهائي لما يضلو 2',w_fin_to:'الفوز بـ',w_fin_tag:'النهائي',w_fin_first:'أول واحد بيوصل {t} بيربح',w_fin_round:'الجولة {r}',w_fin_mp:'نقطة الحسم!',w_fin_champ:'البطل',
  w_fin_ban:'النهائي! أول واحد بيوصل {t} بيربح 🏆',w_fin_spin:'الجولة {r}… 🏆',w_spin_fin:'لفّ الجولة {r} 🏆',w_ev_fpoint:'🔥 نقطة لـ {x} ({y})'},
 en:{w_fin_on:'Final when 2 are left',w_fin_to:'Win at',w_fin_tag:'FINAL',w_fin_first:'First to {t} wins',w_fin_round:'Round {r}',w_fin_mp:'Match point!',w_fin_champ:'CHAMPION',
  w_fin_ban:'Final! First to {t} wins 🏆',w_fin_spin:'Round {r}… 🏆',w_spin_fin:'Spin round {r} 🏆',w_ev_fpoint:'🔥 Point to {x} ({y})'}});
/* shield wording only exists while "إضافة شيلدات / Add shields" is on: these keys swap between the two sets */
var STR_NOSH={ar:{g_how:'الشات بيدخل بـ !دخول أو !join. العجلة بتوقف على حدا، بتطلع قائمة كبيرة عالشاشة فيها كل اللي بالعجلة، وهو بيختار مين يطلع بـ !طرد رقم أو اسم (أو !kick). بيقدر يطلع لحالو بـ !خروج. لما يضلو 2، آخر لفة بتعطي الفائز.',w_choose_hint:'وقت الاختيار: اضغط ✖ جنب أي اسم (أو على اسمو بالقائمة عالشاشة) لتختار عنو. برّا وقت الاختيار: ✖ بيطرد مباشرة و↩ بيرجّع مباشرة.',w_lay_event_ph:'سطر الأحداث (طرد، رجعة)',w_m_elim:'إقصاء'},en:{g_how:'Chat joins with !join (or !دخول). The wheel lands on someone, a big on-screen list of everyone on the wheel opens, and they pick who leaves with !kick number or name. Anyone can leave with !leave. When 2 are left, the last spin crowns the winner.',w_choose_hint:'During a pick: press ✖ next to a name (or click it in the on-screen list) to choose for them. Outside a pick: ✖ removes directly and ↩ brings back directly.',w_lay_event_ph:'Event line (kick, revive)',w_m_elim:'Elimination'}},STR_SH={
 ar:{g_how:'الشات بيدخل بـ !دخول أو !join. العجلة بتوقف على حدا، بتطلع قائمة كبيرة عالشاشة فيها كل اللي بالعجلة، وهو بيختار مين يطلع بـ !طرد رقم أو اسم (أو !kick). كل واحد معو 🛡️ شيلد بيحميه، أو بيرجّع فيه حدا من برا بـ !رجع اسم (أو !revive). بيقدر يطلع لحالو بـ !خروج. لما يضلو 2، آخر لفة بتعطي الفائز.',
  w_choose_hint:'وقت الاختيار: اضغط ✖ جنب أي اسم (أو على اسمو بالقائمة عالشاشة) لتختار عنو (الشيلد بينحسب)، أو ↩ لترجّع حدا بشيلدو. برّا وقت الاختيار: ✖ بيطرد مباشرة و↩ بيرجّع مباشرة.',
  w_lay_event_ph:'سطر الأحداث (طرد، شيلد، رجعة)',w_m_elim:'إقصاء + شيلد'},
 en:{g_how:'Chat joins with !join (or !دخول). The wheel lands on someone, a big on-screen list of everyone on the wheel opens, and they pick who leaves with !kick number or name. Everyone has a 🛡️ shield that protects them, or that they can use to bring someone back with !revive name. Anyone can leave with !leave. When 2 are left, the last spin crowns the winner.',
  w_choose_hint:'During a pick: press ✖ next to a name (or click it in the on-screen list) to choose for them (shields count), or ↩ to revive someone with their shield. Outside a pick: ✖ removes directly and ↩ brings back directly.',
  w_lay_event_ph:'Event line (kick, shield, revive)',w_m_elim:'Elimination + shields'}};
var shApplied=null;
function applySh(on){on=!!on&&FIX!=='classic';if(on===shApplied)return;shApplied=on;A.strings(on?STR_SH:STR_NOSH);
  document.body.classList.toggle('w-sh-on',on);
  Object.keys(STR_SH.ar).forEach(function(k){document.querySelectorAll('[data-i18n="'+k+'"]').forEach(function(e){A.setRich(e,A.t(k))})});sideKey='';}


/* ---------- state ---------- */
var OD=WO?WO.DEF:{sh:false,shStart:1,picker:true,pick:20,dur:6,auto:7,join:0};
var S={entries:[],out:[],wins:[],last:null,rmT:0,mode:FIX||'elim',open:true,rot:0,spin:null,winner:null,remove:false,dur:OD.dur,title:'',chatCols:true,avatar:false,elim:false,finAuto:false,vipCtrl:false,finDock:true,
  shOn:OD.sh,shStart:OD.shStart,picker:OD.picker,joinSecs:OD.join,joinUntil:0,pickSecs:OD.pick,timeoutAct:'streamer',autoNext:OD.auto,fin:null,finOn:OD.fin!==false,finTo:OD.finTo||3,phase:'idle',chooser:null,deadline:0,pausedLeft:0,paused:false,ev:null,evT:0,nextAt:0};
var hist=[];
function snap(){hist.push(JSON.stringify({e:S.entries,o:S.out,ph:S.phase,ch:S.chooser,w:S.winner,ev:S.ev,ws:S.wins,f:S.fin,el:S.elim}));if(hist.length>40)hist.shift();}
function undo(){
  var h=hist.pop();if(!h)return;var o=JSON.parse(h);
  if(S.spin)return;
  S.entries=o.e;S.out=o.o;S.chooser=o.ch;S.winner=o.w;S.ev=o.ev;S.evT=Date.now();if(o.ws)S.wins=o.ws;S.fin=o.f||null;S.elim=!!o.el;
  S.phase=(o.ph==='choose'&&o.ch)?'choose':(o.ph==='win'?'win':'idle');
  if(S.phase==='choose'){S.deadline=S.pickSecs>0?Date.now()+S.pickSecs*1000:0;S.paused=false;}
  S.nextAt=0;save();changed();
}
function pub(){return {entries:S.entries.slice(0,300).map(function(e){return [e.n,e.c||'',e.sh|0,e.u||'']}),out:S.out.slice(0,120).map(function(e){return [e.n,e.c||'',e.sh|0,e.u||'']}),
  mode:S.mode,wins:S.mode==='classic'?S.wins.slice(0,12):[],open:S.open,rot:S.rot,spin:S.spin,winner:S.winner,title:S.title,chatCols:!!S.chatCols,avatar:!!S.avatar,phase:S.phase,chooser:S.chooser,
  left:S.phase==='choose'&&!S.paused&&S.deadline?Math.max(0,S.deadline-Date.now()):(S.paused?S.pausedLeft:0),pick:S.pickSecs,paused:S.paused,streamerPicks:!!S.streamerPicks,ev:S.ev,evT:S.evT,lang:A.lang(),
  sh:S.mode==='elim'&&!!S.shOn,picker:!!S.picker,fin:S.mode==='elim'?S.fin:null,finDock:!!S.finDock,joinLeft:S.open&&S.joinUntil?Math.max(0,S.joinUntil-Date.now()):0}}
function opts(){return {sh:S.shOn,shStart:S.shStart,picker:S.picker,pick:S.pickSecs,dur:S.dur,auto:S.autoNext,join:S.joinSecs,fin:S.finOn,finTo:S.finTo,fa:S.finAuto,vip:S.vipCtrl,fd:S.finDock}}
/* the FINAL starts by itself when exactly 2 are left (setting on); leaves when the pair changes (a leave, a revive, undo, new round) */
/* Nov 4 (Mohammad): the final never opens just because 2 joined, nor while people are still joining — only once the streamer started
   the wheel and eliminations brought the wheel down to 2 (S.elim: someone was kicked out during this round) */
function finActive(){return !!(WO&&WO.finalOn(S.mode,S.entries.length,{fin:S.finOn},S.elim))}
function syncFin(){
  if(!WO)return;
  if(S.phase==='win'&&S.fin&&S.fin.w>=0)return;              /* keep the finished match on screen until the next round */
  if(!finActive()){S.fin=null;return;}
  if(!WO.finalSame(S.fin,S.entries))S.fin=WO.finalStart(S.entries,S.finTo);
  else if(S.fin.w<0&&S.fin.to!==S.finTo){S.fin.to=Math.max(S.finTo,Math.max(S.fin.s[0],S.fin.s[1])+1);}
}
var FIN_AUTO_MS=3000;
function startShields(){return S.mode==='elim'&&S.shOn?S.shStart:0}

function key(s){return C.normalize(String(s||'').replace(/^@/,'')).replace(/[\s_.\-]/g,'')}
function find(list,q){
  var k=key(q);if(!k)return -1;var i,hits=[];
  for(i=0;i<list.length;i++){if(key(list[i].n)===k||(list[i].u&&key(list[i].u)===k))return i;}
  for(i=0;i<list.length;i++){if(key(list[i].n).indexOf(k)===0||(list[i].u&&key(list[i].u).indexOf(k)===0))hits.push(i);}
  if(hits.length===1)return hits[0];
  if(!hits.length&&k.length>=3){for(i=0;i<list.length;i++){if(key(list[i].n).indexOf(k)>=0)hits.push(i);}if(hits.length===1)return hits[0];}
  return -1;
}
function add(name,color,user,sh){
  name=String(name||'').replace(/[\u0000-\u001f]/g,'').trim().slice(0,32);if(!name)return false;
  var dup=function(e){return (user&&e.u===user)||e.n.toLowerCase()===name.toLowerCase()};
  if(S.entries.some(dup)||S.out.some(dup))return false;
  S.entries.push({n:name,c:color||'',u:user||'',sh:sh==null?startShields():sh});return true;
}
function save(){if(!A.obs){A.LS.set(SKEY,JSON.stringify({e:S.entries.slice(0,300),o:S.out.slice(0,300),w:S.wins.slice(0,30),mode:S.mode,remove:S.remove,dur:S.dur,open:S.open,title:S.title,cc:S.chatCols?1:0,av:S.avatar?1:0,sh:S.shStart,shOn:S.shOn?1:0,pk:S.picker?1:0,join:S.joinSecs,pick:S.pickSecs,to:S.timeoutAct,auto:S.autoNext,fo:S.finOn?1:0,ft:S.finTo,f:S.fin,el:S.elim?1:0,fa:S.finAuto?1:0,vip:S.vipCtrl?1:0,fd:S.finDock?1:0,v:18}));if(A.updateObsUrl)A.updateObsUrl();}}
/* join window: joining closes by itself N s after it opens (0 = stays open) */
function openJoin(on){S.open=!!on;S.joinUntil=S.open&&S.joinSecs>0?Date.now()+S.joinSecs*1000:0;}
function event(type,x,y){S.ev={t:type,x:x||'',y:y||''};S.evT=Date.now();}

/* ---------- spin ---------- */
function spin(){
  if(S.spin)return;
  if(S.phase==='choose')return;
  if(S.rmT)flushRemove();
  if(S.entries.length<1)return;
  if(S.mode==='elim'&&S.entries.length===1){finishWin(S.entries[0]);return;}
  if(S.mode==='elim')S.spun=true;
  syncFin();
  if(!(S.dur>0)){ /* spin time "no limit": the wheel keeps turning until the streamer (or a mod with !وقف / !stop) stops it */
    S.winner=null;S.ev=null;S.nextAt=0;S.phase='spinning';S.spin={start:Date.now()+150,endless:true,from:S.rot,speed:1.35};
    A.sfx('start');changed();clearTimeout(S.t);return;}
  var n=S.entries.length,idx=Math.random()*n|0,seg=360/n;
  var center=idx*seg+seg/2+(Math.random()-.5)*seg*.7;
  var target=-center;   /* the pointer sits at 3 o'clock, so the landed name is horizontal and reads upright */var from=S.rot;var base=from-((from%360)+360)%360;
  var to=base+360*(5+Math.round(S.dur/1.5))+(((target%360)+360)%360);if(to-from<1440)to+=360;
  var final=S.mode==='classic'||(S.entries.length<=2&&!S.fin);
  S.winner=null;S.ev=null;S.nextAt=0;S.phase='spinning';
  S.spin={start:Date.now()+150,dur:S.dur*1000,from:from,to:to,idx:idx,name:S.entries[idx].n,color:S.entries[idx].c||'',user:S.entries[idx].u||'',final:final,fin:!!S.fin};
  A.sfx('start');changed();
  clearTimeout(S.t);S.t=setTimeout(landed,S.dur*1000+250);
}
/* stop a no-limit spin: pick the name now and ease out from the current speed onto it (about 3.5 s) */
function stopSpin(){
  var sp=S.spin;if(!sp||!sp.endless||!S.entries.length)return;
  var now=Date.now(),a=angleNow({spin:sp,rot:S.rot}),v=sp.speed;
  var n=S.entries.length,idx=Math.random()*n|0,seg=360/n,center=idx*seg+seg/2+(Math.random()-.5)*seg*.7;
  var T=((-center%360)+360)%360,d0=v*3500/4,land=a+d0,dist=d0+((((T-land)%360)+360)%360),D=dist*4/v;
  var final=S.mode==='classic'||(S.entries.length<=2&&!S.fin);
  S.spin={start:now,dur:D,from:a,to:a+dist,idx:idx,name:S.entries[idx].n,color:S.entries[idx].c||'',user:S.entries[idx].u||'',final:final,fin:!!S.fin};
  changed();clearTimeout(S.t);S.t=setTimeout(landed,D+100);
}
function landed(){
  var sp=S.spin;if(!sp)return;S.rot=sp.to;S.spin=null;
  var i=S.entries.findIndex(function(e){return e.n===sp.name});var who=S.entries[i]||{n:sp.name,c:sp.color,u:sp.user};
  if(sp.fin&&S.fin&&WO){ /* the final: +1 for the landed player; first to N wins (then the normal winner flow) */
    snap();S.fin=WO.finalPoint(S.fin,who.n,Date.now());S.chooser=null;
    if(S.fin.w>=0){finishWin(who);save();return;}
    S.phase='idle';event('fpoint',who.n,S.fin.s[0]+' - '+S.fin.s[1]);if(S.finAuto)S.nextAt=Date.now()+FIN_AUTO_MS;save();changed();return;}
  if(sp.final){finishWin(who);
    if(S.mode==='classic'&&S.remove){clearTimeout(S.rmT);S.rmT=0;S.rmName='';S.rmName=sp.name;S.rmT=setTimeout(function(){flushRemove();changed();},3500);}
    return;}
  S.phase='choose';S.chooser={n:who.n,c:who.c||'',u:who.u||''};S.streamerPicks=false;S.paused=false;S.deadline=S.pickSecs>0?Date.now()+S.pickSecs*1000:0;
  A.sfx('go');changed();
}
function finishWin(who){
  S.phase='win';S.winner={n:who.n,c:who.c||''};S.chooser=null;
  if(who.u&&S.mode==='elim')A.award(who.u,who.n,3);
  if(S.mode==='classic'){S.wins.unshift({n:who.n,c:who.c||'',u:who.u||''});if(S.wins.length>30)S.wins.length=30;S.last={n:who.n,u:who.u||'',removed:false};if(who.u)A.award(who.u,who.n,1);save();}
  A.sfx('win');changed();A.confetti($('stage'),140);
  setTimeout(function(){A.confetti($('stage'),90)},900);
}
/* classic "remove the winner after the spin": the winner leaves the wheel 3.5 s after landing (or at once when the next spin starts) */
function flushRemove(){
  clearTimeout(S.rmT);S.rmT=0;var nm=S.rmName;S.rmName='';if(!nm)return;
  var k=S.entries.findIndex(function(e){return e.n===nm});if(k<0)return;
  S.out.unshift(S.entries.splice(k,1)[0]);if(S.last&&S.last.n===nm)S.last.removed=true;save();
}
/* classic: throw the last result away (winner back on the wheel, point taken back) and spin again */
function respin(){
  if(S.spin||S.mode!=='classic'||S.phase!=='win'||!S.last)return;
  clearTimeout(S.rmT);S.rmT=0;S.rmName='';var L=S.last;S.last=null;snap();
  if(L.removed){var k=S.out.findIndex(function(e){return e.n===L.n});if(k>=0)S.entries.push(S.out.splice(k,1)[0]);}
  if(S.wins.length&&S.wins[0].n===L.n)S.wins.shift();
  if(L.u)A.award(L.u,L.n,-1);
  S.winner=null;S.phase='idle';save();spin();
}
function chooserEntry(){if(!S.chooser)return null;var i=S.entries.findIndex(function(e){return e.n===S.chooser.n});return i>=0?S.entries[i]:null;}
function afterAction(){
  S.phase='idle';S.chooser=null;S.streamerPicks=false;S.paused=false;
  if(S.entries.length===1&&S.mode==='elim'){finishWin(S.entries[0]);save();return;}
  syncFin();
  if(S.autoNext>0&&S.entries.length>1&&!finActive())S.nextAt=Date.now()+S.autoNext*1000;
  else if(S.finAuto&&finActive()&&S.fin&&S.fin.w<0)S.nextAt=Date.now()+FIN_AUTO_MS; /* "لفّ تلقائي بالنهائي" (off by default) */
  save();changed();
}
/* the landed player (or the streamer for them) kicks a target */
function doKick(ti,by){
  var tgt=S.entries[ti];if(!tgt)return false;
  if(S.chooser&&tgt.n===S.chooser.n)return false;
  snap();
  if((tgt.sh|0)>0){tgt.sh--;event('shield',by,tgt.n);A.sfx('bad');}
  else{S.entries.splice(ti,1);S.out.unshift(tgt);S.elim=true;event(by==='@timeout'?'timeout':'kick',S.chooser?S.chooser.n:by,tgt.n);A.sfx('boom');}
  afterAction();return true;
}
function doRevive(oi,by){
  var me=chooserEntry();var tgt=S.out[oi];if(!me||!tgt||(me.sh|0)<1)return false;
  snap();me.sh--;S.out.splice(oi,1);tgt.sh=0;S.entries.push(tgt);event('revive',me.n,tgt.n);A.sfx('pop');
  afterAction();return true;
}
function randomKick(){
  var ids=[];S.entries.forEach(function(e,i){if(!S.chooser||e.n!==S.chooser.n)ids.push(i)});if(!ids.length)return;
  var ti=ids[Math.random()*ids.length|0];var tgt=S.entries[ti];
  snap();
  if((tgt.sh|0)>0){tgt.sh--;event('shield','',tgt.n);A.sfx('bad');}
  else{S.entries.splice(ti,1);S.out.unshift(tgt);S.elim=true;event('timeout',S.chooser?S.chooser.n:'',tgt.n);A.sfx('boom');}
  afterAction();
}
function timeUp(){
  if(S.timeoutAct==='random')randomKick();
  else if(S.timeoutAct==='skip'){snap();event('skip',S.chooser?S.chooser.n:'','');afterAction();}
  else{S.streamerPicks=true;S.deadline=0;changed();}
}
/* the streamer (or a mod with !تخطي / !skip) passes the landed player's turn: nobody leaves (needed with no pick-time limit) */
function skipPick(){if(S.phase!=='choose'||!S.chooser)return;snap();event('pass',S.chooser.n,'');A.sfx('pop');afterAction();}
/* ↺ reset: names, out list, winners / scores, the final, events and timers — a clean wheel */
function resetAll(){snap();clearTimeout(S.rmT);clearTimeout(S.t);S.rmT=0;S.rmName='';S.spin=null;S.entries=[];S.out=[];S.wins=[];S.last=null;S.winner=null;S.fin=null;S.elim=false;S.spun=false;
  S.phase='idle';S.chooser=null;S.streamerPicks=false;S.paused=false;S.deadline=0;S.nextAt=0;S.ev=null;S.evT=Date.now();if(S.open)openJoin(true);save();changed();}
function newRound(){
  snap();S.out.forEach(function(e){S.entries.push(e)});S.out=[];
  S.entries.forEach(function(e){e.sh=startShields()});if(S.joinSecs>0&&S.open)openJoin(true);
  S.phase='idle';S.winner=null;S.chooser=null;S.ev=null;S.fin=null;S.elim=false;S.spun=false;S.nextAt=0;S.last=null;clearTimeout(S.rmT);S.rmT=0;S.rmName='';save();changed();
}
function togglePause(){
  if(S.spin&&S.spin.endless){stopSpin();return;}
  if(S.phase!=='choose'||S.streamerPicks)return;
  if(!S.paused){S.paused=true;S.pausedLeft=S.deadline?Math.max(0,S.deadline-Date.now()):0;}
  else{S.paused=false;S.deadline=S.pausedLeft?Date.now()+S.pausedLeft:0;}
  changed();
}
setInterval(function(){
  if(!A.runsEngine())return;
  if(S.phase==='choose'&&!S.paused&&S.deadline&&Date.now()>=S.deadline){S.deadline=0;timeUp();return;}
  if(S.phase==='idle'&&S.nextAt&&Date.now()>=S.nextAt){S.nextAt=0;spin();return;}
  if(S.open&&S.joinUntil){if(Date.now()>=S.joinUntil){S.open=false;S.joinUntil=0;save();changed();return;}
    var js=Math.ceil((S.joinUntil-Date.now())/1000);if(js!==S._lastJ){S._lastJ=js;changed();}}
  if(S.phase==='choose'&&!S.paused&&S.deadline){var s=Math.ceil((S.deadline-Date.now())/1000);if(s!==S._lastS){S._lastS=s;if(s<=5&&s>0)A.sfx('tick');changed();}}
},200);

/* ---------- chat ---------- */
/* commands come from wheelcmds.js: every command works in English and Arabic (!join = !دخول, !kick = !طرد, …) */
var WC=window.LammaWheelCmds;
function pickIdx(list,cmd){var i=find(list,cmd.rest);if(i<0&&cmd.num>0&&cmd.num<=list.length)i=cmd.num-1;return i;}
A.onChat(function(m){
  if(!A.runsEngine())return;var cmd=WC?WC.resolve(m.text):null;if(!cmd)return;var c=cmd.cmd;
  if((A.isCtrl(m)||(S.vipCtrl&&m.vip))&&!cmd.bare){ /* "الـVIP بيتحكموا بالعجلة" (off by default) gives VIPs the mod commands */
    if(c==='spin'){spin();return;}
    if(c==='clear'){resetAll();return;}
    if(c==='respin'){respin();return;}
    if(c==='open'){openJoin(true);save();changed();return;}if(c==='close'){openJoin(false);save();changed();return;}
    if(c==='skip'){skipPick();return;}
    if(c==='newround'){newRound();return;}
    if(c==='pause'){togglePause();return;}
    if(c==='undo'){undo();return;}
    /* a mod can also remove / bring back anyone by name or number outside a pick */
    if(c==='kick'&&cmd.rest&&S.phase!=='choose'&&!S.spin&&!S.fin){var mi=pickIdx(S.entries,cmd);if(mi>=0){snap();var me0=S.entries.splice(mi,1)[0];S.out.unshift(me0);if(S.mode==='elim'&&S.spun)S.elim=true;if(S.mode==='elim')event('mkick','',me0.n);save();changed();}return;}
    if(c==='revive'&&cmd.rest&&S.phase!=='choose'&&!S.spin){var mo=pickIdx(S.out,cmd);if(mo>=0){snap();var mr=S.out.splice(mo,1)[0];mr.sh=0;S.entries.push(mr);if(S.mode==='elim')event('mrevive','',mr.n);save();changed();}return;}
  }
  if(c==='join'&&S.open&&!S.fin&&(S.phase!=='win'||S.mode==='classic')){if(add(m.name,m.color,m.user)){A.sfx('pop');save();changed();}return;}
  if(c==='leave'){ /* a viewer takes themselves off the wheel (not while it spins on them / while they are the one choosing) */
    if(S.spin)return;var li=S.entries.findIndex(function(e){return (m.user&&e.u===m.user)||key(e.n)===key(m.name)});if(li<0)return;
    if(S.chooser&&S.entries[li].n===S.chooser.n)return;snap();S.entries.splice(li,1);save();changed();return;}
  if(S.phase!=='choose'||!S.chooser||S.paused)return;
  var mine=(S.chooser.u&&m.user===S.chooser.u)||(!S.chooser.u&&key(m.name)===key(S.chooser.n));
  if(!mine)return;
  if(c==='kick'){var ti=pickIdx(S.entries,cmd);if(ti>=0)doKick(ti,S.chooser.n);return;}
  if(c==='revive'){var oi=pickIdx(S.out,cmd);if(oi>=0)doRevive(oi,S.chooser.n);return;}
});

/* ---------- drawing ---------- */
var cv=$('whCanvas'),ctx=cv.getContext('2d'),cur=null,lastSeg=-1,fontsOk=false;
var FONT_STACK="Cairo, 'Noto Sans Arabic', 'Segoe UI', Tahoma, system-ui, sans-serif";
if(document.fonts&&document.fonts.load){Promise.all([document.fonts.load('800 40px Cairo','عربي'),document.fonts.load('800 40px Cairo','Abc')]).then(function(){fontsOk=true},function(){fontsOk=true});}
function ease(t){return 1-Math.pow(1-t,4)}
function angleNow(P){var sp=P.spin;if(sp&&sp.endless){var e=Math.max(0,Date.now()-sp.start),r=700;return sp.from+(e<r?sp.speed*e*e/(2*r):sp.speed*(e-r/2));}
  if(sp){var t=Math.min(1,Math.max(0,(Date.now()-sp.start)/sp.dur));return sp.from+(sp.to-sp.from)*ease(t);}return P.rot;}
/* Draw one label along the radius, always upright and in its own direction:
   - every name gets ctx.direction from its first strong letter (Arabic → rtl, Latin → ltr), so mixed names like "سامر2005" keep their order;
   - labels on the left half are flipped 180° so nothing is ever upside-down (upside-down Arabic reads as broken/reversed letters);
   - no letter-spacing and no per-character drawing, so Arabic letters stay joined. */
function drawLabel(label,ang,R,inner,fs,color,shields,av){
  /* orientation: glyph tops always point upward (left half rotated 180°). Within 15° of vertical, where "upward" is a toss-up,
     pick the orientation that makes the name read top→bottom for its own script (Latin starts at its left end, Arabic at its right end). */
  /* Nov 4 (Mohammad): exactly like wheelofnames — the name lies along its slice's radius and turns WITH the wheel, never re-flipped:
     on the right half it reads normally, on the left half it is upside-down (old auto-flip was flip=cs<0; now always off). */
  var rtl=isRtl(label),flip=false;
  ctx.save();ctx.rotate(flip?ang+Math.PI:ang);ctx.textBaseline='middle';
  var shTxt=shields>0?(shields>1?'\uD83D\uDEE1\uFE0F\uD83D\uDEE1\uFE0F':'\uD83D\uDEE1\uFE0F'):'';
  var rim=R-20,shW=0;
  if(shTxt){ctx.direction='ltr';ctx.font='800 '+(fs*.8)+'px '+FONT_STACK;shW=ctx.measureText(shTxt).width+fs*.3;}
  ctx.font='800 '+fs+'px '+FONT_STACK;ctx.direction=rtl?'rtl':'ltr';
  var avR=av?av.r:0,avW=av?avR*2+fs*.3:0;
  var maxW=rim-inner-12-shW-avW,txt=label,tw=ctx.measureText(txt).width;
  if(tw>maxW){fs=Math.max(fs*.68,fs*maxW/tw);ctx.font='800 '+fs+'px '+FONT_STACK;} /* shrink a long name a little before cutting it */
  if(ctx.measureText(txt).width>maxW){var ch=Array.from(txt);while(ch.length>2&&ctx.measureText(ch.join('')+'\u2026').width>maxW)ch.pop();txt=ch.join('')+'\u2026';}
  ctx.shadowColor='rgba(0,0,0,.35)';ctx.shadowBlur=fs*.15;ctx.fillStyle=color;
  // textAlign 'right'/'left' are absolute edges whatever ctx.direction is, so the name always hugs the rim
  if(!flip){ctx.textAlign='right';ctx.fillText(txt,rim-shW,0);}
  else{ctx.textAlign='left';ctx.fillText(txt,-rim+shW,0);}
  if(av){ /* chat-colour mode: the viewer's round picture (or a letter circle) just inside the name */
    var nw=ctx.measureText(txt).width,cxA=flip?(-rim+shW+nw+fs*.3+avR):(rim-shW-nw-fs*.3-avR);
    ctx.save();ctx.shadowBlur=0;ctx.beginPath();ctx.arc(cxA,0,avR,0,Math.PI*2);ctx.closePath();
    if(av.img){ctx.save();ctx.clip();ctx.translate(cxA,0);ctx.rotate(flip?-ang-Math.PI:-ang);ctx.drawImage(av.img,-avR,-avR,avR*2,avR*2);ctx.restore();}
    else{ctx.fillStyle='rgba(0,0,0,.3)';ctx.fill();ctx.fillStyle=color;ctx.font='900 '+(avR*1.1)+'px '+FONT_STACK;ctx.textAlign='center';ctx.direction='ltr';
      ctx.translate(cxA,0);ctx.rotate(flip?-ang-Math.PI:-ang);ctx.fillText(av.letter,0,avR*.05);}
    ctx.restore();ctx.beginPath();ctx.arc(cxA,0,avR,0,Math.PI*2);ctx.lineWidth=Math.max(2,avR*.14);ctx.strokeStyle=color;ctx.shadowBlur=0;ctx.stroke();
  }
  if(shTxt){ctx.direction='ltr';ctx.font='800 '+(fs*.8)+'px '+FONT_STACK;ctx.shadowBlur=0;
    if(!flip){ctx.textAlign='right';ctx.fillText(shTxt,rim,0);}else{ctx.textAlign='left';ctx.fillText(shTxt,-rim,0);}}
  ctx.restore();
}
/* ---------- wheel colours follow the theme (theme.css / theme.js set --wh-* on <html>) ---------- */
var TH=null;
function cssv(cs,k,d){var v=(cs.getPropertyValue(k)||'').trim();return v||d}
function hex6(v,d){v=String(v||'').trim();if(/^#[0-9a-f]{6}$/i.test(v))return v;if(/^#[0-9a-f]{3}$/i.test(v))return '#'+v[1]+v[1]+v[2]+v[2]+v[3]+v[3];return d}
function readTheme(){var cs=getComputedStyle(document.documentElement);
  TH={multi:cssv(cs,'--wh-multi','1')==='1',a:hex6(cssv(cs,'--wh-a'),'#868CBC'),b:hex6(cssv(cs,'--wh-b'),'#1d1e27'),c:hex6(cssv(cs,'--wh-c'),'#4b4e6e'),
    ta:cssv(cs,'--wh-ta','#0d0d14'),tb:cssv(cs,'--wh-tb','#c9ccf0'),tc:cssv(cs,'--wh-tc','#ffffff'),
    rim:cssv(cs,'--wh-rim','rgba(216,182,94,.8)'),l1:cssv(cs,'--wh-l1','#f6ecd0'),l2:cssv(cs,'--wh-l2','#b89a4e'),base:cssv(cs,'--wh-base','#160f2b'),empty:cssv(cs,'--wh-empty','#120e22')};}
readTheme();
if(window.MutationObserver)new MutationObserver(function(){readTheme()}).observe(document.documentElement,{attributes:true,attributeFilter:['data-theme','style']});
/* Twitch gives a viewer who never picked a colour one of its 15 defaults; we do the same from the login so every slice is a real chat colour */
var TW_DEF=['#FF0000','#0000FF','#00FF00','#B22222','#FF7F50','#9ACD32','#FF4500','#2E8B57','#DAA520','#D2691E','#5F9EA0','#1E90FF','#FF69B4','#8A2BE2','#00FF7F'];
function twDef(k){k=String(k||'').toLowerCase();var h=0;for(var i=0;i<k.length;i++)h=(h*31+k.charCodeAt(i))|0;return TW_DEF[Math.abs(h)%TW_DEF.length]}
function sliceCol(i,n,ent){
  if(cur&&(cur.chatCols||cur.fin)&&ent){var cc=hex6(ent[1]||twDef(ent[3]||ent[0]),'');if(cc)return [cc,isLight(cc)?'#121218':'#ffffff']} /* the viewer's own Twitch colour (purple too, when it is theirs) */ /* toggle: the viewer's own chat colour */
  if(TH.multi){var col=COLS[i%COLS.length];if(n%COLS.length===1&&i===n-1)col=COLS[Math.floor(COLS.length/2)];return [col,isLight(col)?'#121218':'#ffffff']}
  if(n>1&&n%2===1&&i===n-1)return [TH.c,TH.tc]; /* odd count: the last slice takes a third shade so two equal colours never touch */
  return i%2?[TH.b,TH.tb]:[TH.a,TH.ta];
}
var hubLast=null,avUrl=null,avAsked=false;
/* toggle: the channel's Twitch picture in the centre badge (public decapi lookup, cached per channel; the title shows until it loads) */
function hubAvatar(on){
  var hub=$('whHubT')&&$('whHubT').parentNode;if(!hub)return;var img=hub.querySelector('img.wh-hub-av');
  if(on&&!avUrl&&!avAsked&&A.channel){avAsked=true;var ck='lamma-avatar-'+A.channel,c=A.LS.get(ck,'');
    if(/^https:\/\/static-cdn\.jtvnw\.net\//.test(c)){avUrl=c;}
    else if(window.fetch)fetch('https://decapi.me/twitch/avatar/'+encodeURIComponent(A.channel)).then(function(r){return r.ok?r.text():''}).then(function(u){u=String(u||'').trim();if(/^https:\/\/static-cdn\.jtvnw\.net\/[^\s"'<>]+$/.test(u)){avUrl=u;A.LS.set(ck,u);hubAvatar(cur&&cur.avatar);}}).catch(function(){});}
  var show=!!(on&&avUrl);
  if(show&&!img){img=document.createElement('img');img.className='wh-hub-av';img.alt='';img.decoding='async';img.referrerPolicy='no-referrer';img.addEventListener('error',function(){img.remove();avUrl=null;hub.classList.remove('has-av')});hub.appendChild(img);}
  if(img){if(show){if(img.getAttribute('src')!==avUrl)img.src=avUrl;}else img.remove();}
  hub.classList.toggle('has-av',show);
}
function hubTitle(title){
  var h=$('whHubT');if(!h)return;var t=String(title||'').trim()||'لَمّة';if(t===hubLast&&h.textContent===t)return;hubLast=t;h.textContent=t;fitHub();
}
function fitHub(){ /* biggest size (in em, so it scales with the wheel) that fits the badge, wrapping onto two lines when needed */
  var h=$('whHubT'),hub=h&&h.parentNode;if(!h||!hub||!hub.clientWidth)return;
  var fs=2.4,guard=0;h.style.fontSize=fs+'em';
  while(guard++<40&&fs>.5&&(h.scrollWidth>h.clientWidth+1||h.scrollHeight>hub.clientHeight*.78)){fs*=.93;h.style.fontSize=fs.toFixed(3)+'em';}
}
window.addEventListener('resize',function(){fitHub()});
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(function(){fitHub()});
function paint(){
  var P=cur;if(!P)return;var W=cv.width,R=W/2-16,cx=W/2,cy=W/2;
  ctx.clearRect(0,0,W,W);
  var list=P.entries,n=list.length;
  ctx.save();ctx.translate(cx,cy);
  ctx.beginPath();ctx.arc(0,0,R+12,0,Math.PI*2);ctx.fillStyle=TH.base;ctx.fill();ctx.lineWidth=8;ctx.strokeStyle=TH.rim;ctx.stroke();
  // rim lights
  for(var b=0;b<24;b++){var ba=b/24*Math.PI*2;ctx.beginPath();ctx.arc(Math.cos(ba)*(R+12),Math.sin(ba)*(R+12),5,0,Math.PI*2);ctx.fillStyle=(Math.floor(Date.now()/250)+b)%2?TH.l1:TH.l2;ctx.fill();}
  if(!n){ctx.beginPath();ctx.arc(0,0,R,0,Math.PI*2);ctx.fillStyle=TH.empty;ctx.fill();ctx.restore();return;}
  var a0=angleNow(P)*Math.PI/180,seg=Math.PI*2/n,inner=R*.25;
  var land=(P.phase==='choose'||P.phase==='win')&&!P.spin;
  for(var i=0;i<n;i++){
    var s=a0+i*seg;ctx.beginPath();ctx.moveTo(0,0);ctx.arc(0,0,R,s,s+seg);ctx.closePath();
    var sc=sliceCol(i,n,list[i]),col=sc[0];
    var g=ctx.createRadialGradient(0,0,inner,0,0,R);g.addColorStop(0,shade(col,-28));g.addColorStop(1,col);ctx.fillStyle=g;ctx.fill();
    var hl=land&&((P.chooser&&list[i][0]===P.chooser.n)||(P.winner&&list[i][0]===P.winner.n));
    if(hl){ctx.fillStyle='rgba(255,255,255,.28)';ctx.fill();}
    ctx.strokeStyle='rgba(0,0,0,.28)';ctx.lineWidth=2;ctx.stroke();
    if(n<=90){var fs=Math.max(15,Math.min(50,seg*R*.5,700/Math.max(6,Array.from(list[i][0]).length)));
      var av=null;
      if((P.chatCols||P.fin)&&n<=24){var avr=Math.max(11,Math.min(fs*.62,seg*R*.42*.5,34)),im=AV?AV.image(list[i][3]):null;
        av={r:avr,img:im,letter:(Array.from(String(list[i][0]).replace(/^[^\p{L}\p{N}]+/u,''))[0]||'?').toUpperCase()};}
      drawLabel(list[i][0],s+seg/2,R,inner,fs,sc[1],P.mode==='elim'&&P.sh?list[i][2]:0,av);}
  }
  ctx.restore();
  if(P.spin&&A.runsEngine()){var top=((0-angleNow(P))%360+360)%360;var si=Math.floor(top/(360/n));if(si!==lastSeg){lastSeg=si;A.sfx('tick');}}
}
function shade(hex,amt){var r=parseInt(hex.slice(1,3),16)+amt,g=parseInt(hex.slice(3,5),16)+amt,b=parseInt(hex.slice(5,7),16)+amt;function c(v){return Math.max(0,Math.min(255,v))}return 'rgb('+c(r)+','+c(g)+','+c(b)+')'}
function loop(){paint();requestAnimationFrame(loop)}requestAnimationFrame(loop);

/* ---------- side panel (public) ---------- */
var sideKey='';
/* one name: (number) + round Twitch picture (letter circle until / unless it loads) + the name in the viewer's chat colour + shields */
var AV=window.LammaAvatars;
function avatar(login,name,color){if(AV)return AV.el(login,name,A.readable(color)||'');var s=el('span','av');s.textContent=(Array.from(String(name||'?'))[0]||'?').toUpperCase();return s}
function chip(e,cls,no){var s=el('li','w2-chip'+(cls?' '+cls:''));if(no)s.appendChild(el('span','w2-no',String(no)));s.appendChild(avatar(e[3],e[0],e[1]));s.appendChild(A.nameEl(e[0],e[1]));if(e[2]>0)s.appendChild(el('span','w2-sh',e[2]>1?'🛡️×'+e[2]:'🛡️'));return s}
if(AV)AV.onChange(function(){sideKey='';ctrlKey='';if(cur)drawSide(cur);renderCtrl();});
function evText(ev){if(!ev)return '';var k={kick:'w_ev_kick',shield:'w_ev_shield',revive:'w_ev_revive',timeout:'w_ev_timeout',skip:'w_ev_skip',pass:'w_ev_pass',mkick:'w_ev_manual_kick',mrevive:'w_ev_manual_revive',fpoint:'w_ev_fpoint'}[ev.t];return k?fmt(A.t(k),{x:'\u2068'+ev.x+'\u2069',y:'\u2068'+ev.y+'\u2069'}):''}
function drawSide(P){
  var secs=P.phase==='choose'?Math.ceil((P.left||0)/1000):0;
  var jsecs=P.open&&P.joinLeft?Math.ceil(P.joinLeft/1000):0;
  var k=JSON.stringify([P.entries,P.out,P.wins,P.open,P.winner,!!P.spin,P.spin&&P.spin.final,P.spin&&P.spin.endless,P.title,P.phase,P.chooser,secs,P.paused,P.streamerPicks,P.ev,P.evT,P.mode,P.avatar,P.sh,P.pick,jsecs,A.lang()]);if(k===sideKey)return;sideKey=k;
  /* each public piece renders into its own slot; layout.js positions the slots (and the streamer can move/resize/hide them) */
  /* the لَمّة / LAMMA logo is fixed at the stage's top-right (not movable, not hideable); the title sits in the wheel's centre badge */
  var top=$('whLogo');if(top&&!top.firstChild){var lg=el('span','s-logo');lg.appendChild(el('b',null,'لَمّة'));lg.appendChild(el('i',null,'LAMMA'));top.appendChild(lg);}
  hubTitle(P.title);hubAvatar(P.avatar);
  var ban=el('div','w2-banner');
  if(P.phase==='win'&&P.winner){ban.className+=' win';var wb=el('div','winner-box');wb.appendChild(el('span','crown','🏆'));var wu=(P.entries.concat(P.out).find(function(e){return e[0]===P.winner.n})||[])[3]||'';var wrow=el('div','w2-win-row');wrow.appendChild(avatar(wu,P.winner.n,P.winner.c));wrow.appendChild(A.nameEl(P.winner.n,null));wb.appendChild(wrow);wb.appendChild(el('p','s-mid',A.t('w_winner')));ban.appendChild(wb);}
  else if(P.spin){ban.appendChild(el('p','w2-b-big',P.spin.fin&&P.fin?fmt(A.t('w_fin_spin'),{r:WO.finalRound(P.fin)}):P.spin.final&&P.mode==='elim'?A.t('w_final'):A.t('w_spinning')));}
  else if(P.phase==='choose'&&P.chooser){
    ban.className+=' choose';
    var row=el('div','w2-b-row');
    if(!P.streamerPicks&&P.pick>0){var ring=el('div','ring w2-ring'+(secs<=5?' low':''));ring.style.setProperty('--p',String(Math.max(0,Math.min(1,(P.left||0)/(P.pick*1000)))));ring.appendChild(el('b',null,P.paused?'⏸':String(secs)));row.appendChild(ring);}
    var col=el('div','w2-b-col');
    var h=el('p','w2-b-big');var parts=A.t(P.streamerPicks?'w_streamer_picks':'w_choosing').split('{x}');h.appendChild(document.createTextNode(parts[0]));h.appendChild(A.nameEl(P.chooser.n,P.chooser.c,'w2-who'));h.appendChild(document.createTextNode(parts[1]||''));col.appendChild(h);
    if(!P.streamerPicks){col.appendChild(A.rich('p','w2-b-cmd',A.t('w_choose_cmd')));
      var me=P.entries.find(function(e){return e[0]===P.chooser.n});
      if(P.mode==='elim'&&P.sh&&me&&me[2]>0&&P.out.length)col.appendChild(A.rich('p','w2-b-sub',A.t('w_revive_cmd')));}
    if(P.paused)col.appendChild(el('p','w2-b-sub',A.t('w_paused')));
    row.appendChild(col);ban.appendChild(row);
  }
  else{
    var msg=P.fin?fmt(A.t('w_fin_ban'),{t:P.fin.to}):P.entries.length<=2&&P.entries.length>0&&P.mode==='elim'&&P.ev?A.t('w_ready_final'):(P.ev?A.t('w_ready'):(P.open?A.t('w_join'):A.t('w_closed')));
    ban.appendChild(A.rich('p','w2-b-big',msg));
    if(P.open&&jsecs>0&&!P.ev)ban.appendChild(el('p','w2-b-sub w2-join-left',fmt(A.t('w_join_left'),{s:jsecs})));
  }
  A.clear($('whBanner')).appendChild(ban);
  if(ban.querySelector('.w2-win-row'))requestAnimationFrame(function(){fitText(ban.querySelectorAll('.w2-win-row > :last-child'),.4);});
  var evs=A.clear($('whEvent'));evs.setAttribute('data-ph',A.t('w_lay_event_ph'));
  var et=evText(P.ev);
  if(et&&P.phase!=='win'){var evb=el('div','w2-ev ev-'+P.ev.t+(Date.now()-P.evT<1500?' fresh':''));evb.appendChild(document.createTextNode(et));evs.appendChild(evb);}
  else evs.appendChild(el('div','w2-ev w2-ev-none',A.t('w_ev_none')));
  var inBox=el('div','w2-box');var ih=el('h3',null,A.t('w_in')+' ');ih.appendChild(el('span','cnt',String(P.entries.length)));inBox.appendChild(ih);
  var ul=el('ul','w2-chips');P.entries.slice(0,60).forEach(function(e,i){ul.appendChild(chip(e,P.chooser&&e[0]===P.chooser.n?'is-chooser':'',P.mode==='elim'?i+1:0))});if(P.entries.length>60)ul.appendChild(el('li','w2-chip more','+'+(P.entries.length-60)));inBox.appendChild(ul);
  if(!P.entries.length)inBox.appendChild(el('p','w2-empty',A.t('w_empty')));
  A.clear($('whIn')).appendChild(inBox);
  if(!A.obs){$('whIn').classList.toggle('can-kick',P.mode==='elim'&&P.phase==='choose'&&!!P.chooser&&!P.spin);$('whIn').title=P.mode==='elim'&&P.phase==='choose'?A.t('w_click_kick'):'';}
  var l2=A.clear($('whList2'));
  if(P.mode==='elim'){var oBox=el('div','w2-box out');var oh=el('h3',null,'❌ '+A.t('w_out')+' ');oh.appendChild(el('span','cnt',String(P.out.length)));oBox.appendChild(oh);
    var ol=el('ul','w2-chips');P.out.slice(0,40).forEach(function(e,i){ol.appendChild(chip(e,'is-out',i+1))});if(P.out.length>40)ol.appendChild(el('li','w2-chip more','+'+(P.out.length-40)));oBox.appendChild(ol);
    if(!P.out.length)oBox.appendChild(el('p','w2-empty',A.t('w_none_out')));l2.appendChild(oBox);}
  else if(P.mode==='classic'){var wBox=el('div','w2-box wins');var wh=el('h3',null,'🏆 '+A.t('w_wins')+' ');wh.appendChild(el('span','cnt',String((P.wins||[]).length)));wBox.appendChild(wh);
    var wl=el('ol','w2-chips w2-wins');(P.wins||[]).forEach(function(e,i){wl.appendChild(chip([e.n,e.c,0,e.u||''],i===0&&P.phase==='win'?'is-new':''));});wBox.appendChild(wl);
    if(!(P.wins||[]).length)wBox.appendChild(el('p','w2-empty',A.t('w_no_wins')));l2.appendChild(wBox);}
}

/* ---------- on-screen kick list (#whPicker): opens on the stage (and on the OBS overlay) while the landed player picks.
   Every player still on the wheel is a card: list number, round Twitch picture, name in the viewer's chat colour (+ shields
   when they are on). The landed player picks by chat (!طرد 3 / !طرد name / !kick); on the control page the streamer can click a
   card. After a kick the chosen card is stamped OUT (or 🛡️ when a shield saves them) and the list closes; it also closes
   when the time runs out or the streamer skips. ---------- */
var pkEl=$('whPicker'),pkState='closed',pkKey='',pkTimers=[];
function pkClear(){pkTimers.forEach(clearTimeout);pkTimers=[];}
function pkLater(ms,f){pkTimers.push(setTimeout(f,ms));}
function pkHide(){if(!pkEl)return;pkEl.classList.remove('on','closing','pk-done');pkEl.hidden=true;pkState='closed';pkKey='';}
function drawPicker(P){
  if(!pkEl)return;
  var M=WO?WO.pickerModel(P):{open:false,cards:[]};
  if(M.open){
    if(pkState!=='open'){pkClear();pkState='open';pkKey='';pkEl.hidden=false;pkEl.classList.remove('closing','pk-done');void pkEl.offsetWidth;pkEl.classList.add('on');}
    var secs=M.timed&&!P.streamerPicks?Math.ceil((P.left||0)/1000):0;
    var k=JSON.stringify([M.cards,M.chooser,M.timed,P.paused,P.streamerPicks,A.lang(),A.obs]);
    if(k!==pkKey){pkKey=k;buildPicker(P,M);}
    var ring=pkEl.querySelector('.pk-ring');
    if(ring){ring.style.setProperty('--p',String(Math.max(0,Math.min(1,(P.left||0)/((P.pick||1)*1000)))));ring.classList.toggle('low',secs<=5);var rb=ring.querySelector('b');if(rb)rb.textContent=P.paused?'⏸':String(secs);}
    return;
  }
  if(pkState!=='open')return;
  /* closing: stamp the kicked (or shield-saved) card first when this close came from a kick */
  pkState='closing';pkClear();
  var ev=P.ev,fresh=ev&&Date.now()-(P.evT||0)<4000,card=null,hold=250;
  if(fresh&&ev.y&&/^(kick|timeout|mkick|shield)$/.test(ev.t)){
    pkEl.querySelectorAll('.pk-card').forEach(function(c){if(c.getAttribute('data-n')===ev.y)card=c;});
    if(card){var safe=ev.t==='shield';card.classList.add(safe?'pk-safe':'pk-kicked');pkEl.classList.add('pk-done');
      var st=el('span','pk-stamp',safe?A.t('w_pk_safe'):A.t('w_pk_out'));card.appendChild(st);hold=1500;}
  } else if(fresh&&(ev.t==='pass'||ev.t==='skip')){var hd=pkEl.querySelector('.pk-sub');if(hd)hd.textContent=A.t('w_pk_pass');hold=900;}
  pkLater(hold,function(){pkEl.classList.add('closing');pkEl.classList.remove('on');});
  pkLater(hold+450,pkHide);
}
function buildPicker(P,M){
  var box=el('div','pk-box'),head=el('div','pk-head');
  var who=el('div','pk-who');who.appendChild(avatar(M.chooser.u,M.chooser.n,M.chooser.c));
  var tt=el('div','pk-tt'),h=el('p','pk-title'),parts=A.t('w_pk_title').split('{x}');
  h.appendChild(document.createTextNode(parts[0]));h.appendChild(A.nameEl(M.chooser.n,M.chooser.c,'pk-chooser'));h.appendChild(document.createTextNode(parts[1]||''));tt.appendChild(h);
  var sub=el('p','pk-sub');A.setRich(sub,A.t('w_choose_cmd')+(A.lang()==='en'?'':' · !kick'));tt.appendChild(sub);
  who.appendChild(tt);head.appendChild(who);
  if(M.timed&&!P.streamerPicks){var ring=el('div','ring pk-ring');ring.appendChild(el('b',null,''));head.appendChild(ring);}
  else head.appendChild(el('span','pk-nl',P.streamerPicks?'⏳':'∞'));
  box.appendChild(head);
  var n=M.cards.length,grid=el('ul','pk-grid '+(n<=8?'pk-xl':n<=16?'pk-lg':n<=32?'pk-md':'pk-sm'));
  M.cards.slice(0,96).forEach(function(c,i){
    var li=el('li','pk-card');li.setAttribute('data-n',c.n);li.style.setProperty('--d',(Math.min(i,40)*28)+'ms');
    var col=A.readable(c.c);if(col)li.style.setProperty('--nc',col);
    li.appendChild(el('span','pk-no',String(c.no)));li.appendChild(avatar(c.u,c.n,c.c));li.appendChild(A.nameEl(c.n,c.c,'pk-nm'));
    if(c.sh>0)li.appendChild(el('span','pk-sh',c.sh>1?'🛡️×'+c.sh:'🛡️'));
    if(!A.obs){li.tabIndex=0;li.setAttribute('role','button');li.title=A.t('w_pk_click');}
    grid.appendChild(li);
  });
  if(n>96)grid.appendChild(el('li','pk-card pk-more','+'+(n-96)));
  box.appendChild(grid);
  if(!A.obs){var bar=el('div','pk-ctrl');
    bar.appendChild(el('span','pk-hint',A.t('w_pk_click')));
    var b1=el('button','btn btn-ghost btn-sm',A.t('w_rand'));b1.type='button';b1.addEventListener('click',function(){if(S.phase==='choose')randomKick();});
    var b2=el('button','btn btn-ghost btn-sm',A.t('w_skip'));b2.type='button';b2.addEventListener('click',skipPick);
    bar.appendChild(b1);bar.appendChild(b2);box.appendChild(bar);}
  A.clear(pkEl).appendChild(box);
}
/* control page: a click (or Enter) on a card kicks that player for the landed one (shields count, same as ✖) */
if(pkEl&&!A.obs){
  var pkPick=function(t){var li=t&&t.closest&&t.closest('li.pk-card');if(!li||li.classList.contains('pk-more')||pkState!=='open')return;
    if(S.mode!=='elim'||S.phase!=='choose'||!S.chooser||S.spin)return;var n=li.getAttribute('data-n');
    var i=S.entries.findIndex(function(x){return x.n===n});if(i>=0&&n!==S.chooser.n)doKick(i,S.chooser.n);};
  pkEl.addEventListener('click',function(e){pkPick(e.target)});
  pkEl.addEventListener('keydown',function(e){if(e.key==='Enter'||e.key===' '){e.preventDefault();pkPick(e.target);}});
}
/* ---------- the FINAL scoreboard (#whFinal, on the stage and the OBS overlay): two players, big "2 - 1", round, a pulse on each point,
   "نقطة الحسم!" at match point, and a champion card (crown, "البطل") when someone reaches N ---------- */
var fnEl=$('whFinal'),fnKey='',fnAt=0,chEl=$('whChamp'),chKey='',fdEl=$('whFinDock'),fdKey='';
if(window.ResizeObserver&&fnEl&&fnEl.parentNode)new ResizeObserver(function(){fitFinal()}).observe(fnEl.parentNode);
/* Nov 4: the scoreboard is its own layout piece (move / resize / hide in the editor) or docked on top of the left panel
   (setting "النتيجة باللوحة اليسار"); the champion card is a separate centred card. */
/* shrink a one-line name until it fits its box (down to `min` of its size), then ellipsis */
function fitText(list,min){Array.prototype.forEach.call(list||[],function(e){e.style.fontSize='';e.style.whiteSpace='nowrap';e.style.overflow='hidden';e.style.textOverflow='ellipsis';e.style.minWidth='0';e.style.maxWidth='100%';e.style.display='block';
  var cw=e.clientWidth,sw=e.scrollWidth;if(!cw||sw<=cw+1)return;var fs=parseFloat(getComputedStyle(e).fontSize)||16;e.style.fontSize=Math.max(fs*(min||.55),fs*cw/sw*.98)+'px';});}
function sideShown(){var sd=document.querySelector('.lay-el[data-lay="side"]');return !!(sd&&sd.offsetParent!==null&&getComputedStyle(sd).display!=='none'&&!document.body.classList.contains('w-fs'));}
function editing(){return !!document.querySelector('.lay-root.lay-editing')}
function finSample(){return {open:true,p:[{n:A.lang()==='en'?'Player 1':'لاعب 1',c:'#ff4500',u:''},{n:A.lang()==='en'?'Player 2':'لاعب 2',c:'#1e90ff',u:''}],s:[2,1],to:3,round:4,mp:[true,false],anyMp:true,won:-1,last:-1,at:0}}
function fitFinal(){if(!fnEl)return;var c=fnEl.parentNode;if(!c||!c.getBoundingClientRect)return;var r=c.getBoundingClientRect();if(!r.width)return;
  fnEl.style.fontSize=Math.max(8,Math.min(r.width/12.5,r.height/5.6))+'px';}
function drawFinal(P){
  if(!fnEl)return;var M=WO&&P.fin?WO.finalModel(P.fin):{open:false};var dock=P.finDock!==false&&sideShown(); /* docked by default; falls back to the floating piece when the left panel is hidden or in fullscreen */
  document.body.classList.toggle('w-fin-dock',dock);
  /* champion card (centre) */
  if(chEl){if(M.open&&M.won>=0){var ck=JSON.stringify([M.p,M.s,M.won,A.lang()]);if(ck!==chKey){chKey=ck;buildChamp(M);requestAnimationFrame(function(){fitText(chEl.querySelectorAll('.fn-nm,.fn-cn'),.45);});}chEl.hidden=false;}else if(!chEl.hidden){chEl.hidden=true;A.clear(chEl);chKey='';}}
  /* docked copy on the left panel */
  if(fdEl){if(M.open&&dock){var dk=JSON.stringify([M.p,M.s,M.to,M.won,A.lang()]);if(dk!==fdKey){fdKey=dk;buildScore(fdEl,M,'w2-final w2-findock');requestAnimationFrame(function(){fitText(fdEl.querySelectorAll('.fn-nm'),.5);});}fdEl.hidden=false;}else if(!fdEl.hidden){fdEl.hidden=true;A.clear(fdEl);fdKey='';}}
  if(!M.open&&!dock&&editing()&&!A.obs){M=finSample();}   /* the editor shows a sample so the piece can be placed */
  if(!M.open||dock){if(!fnEl.hidden){fnEl.hidden=true;fnEl.className='w2-final';A.clear(fnEl);fnKey='';}return;}
  var k=JSON.stringify([M.p,M.s,M.to,M.won,A.lang(),P.phase]);
  if(k!==fnKey){fnKey=k;buildScore(fnEl,M,'w2-final');}
  fnEl.hidden=false;fitFinal();requestAnimationFrame(function(){fitText(fnEl.querySelectorAll('.fn-nm'),.5);});
  if(M.at&&M.at!==fnAt){fnAt=M.at;if(Date.now()-M.at<4000&&M.last>=0){var side=fnEl.querySelector('.fn-p'+M.last),sc=fnEl.querySelector('.fn-s'+M.last);
    [side,sc].forEach(function(x){if(!x)return;x.classList.remove('pulse');void x.offsetWidth;x.classList.add('pulse');});}}
}
function finSide(M,i,big){var p=M.p[i],d=el('div','fn-p fn-p'+i+(M.mp[i]?' mp':'')+(M.won===i?' win':'')+(M.won>=0&&M.won!==i?' lose':''));
  var col=A.readable(p.c);if(col)d.style.setProperty('--nc',col);
  var av=el('div','fn-av');if(big&&M.won===i)av.appendChild(el('span','fn-crown','👑'));av.appendChild(avatar(p.u,p.n,p.c));d.appendChild(av);
  d.appendChild(A.nameEl(p.n,p.c,'fn-nm'));return d;}
function finScore(M){var sc=el('div','fn-score');sc.appendChild(el('b','fn-s fn-s0',String(M.s[0])));sc.appendChild(el('i','fn-dash','-'));sc.appendChild(el('b','fn-s fn-s1',String(M.s[1])));return sc;}
/* the scoreboard (floating piece or docked): head line, [player 0] 2 - 1 [player 1], match-point tag */
function buildScore(host,M,cls){
  host.className=cls+' on'+(M.anyMp?' is-mp':'')+(M.won>=0?' is-done':'');
  var box=el('div','fn-box'),head=el('div','fn-head');
  head.appendChild(el('span','fn-tag','🏆 '+A.t('w_fin_tag')));
  head.appendChild(el('span','fn-sub',fmt(A.t('w_fin_first'),{t:M.to})+(M.won>=0?'':' · '+fmt(A.t('w_fin_round'),{r:M.round}))));
  box.appendChild(head);
  var row=el('div','fn-row');row.appendChild(finSide(M,0,false));row.appendChild(finScore(M));row.appendChild(finSide(M,1,false));box.appendChild(row);
  if(M.won<0&&M.anyMp){var mp=el('div','fn-mp');mp.appendChild(el('span',null,A.t('w_fin_mp')));box.appendChild(mp);}
  A.clear(host).appendChild(box);
}
/* the champion card: one symmetric grid — crown over the winner, both pictures the same size, the score between, "البطل" + name centred */
function buildChamp(M){
  chEl.className='w2-champ on';var box=el('div','fn-box');
  box.appendChild(el('div','fn-tag','🏆 '+A.t('w_fin_tag')));
  var row=el('div','fn-row');row.appendChild(finSide(M,0,true));row.appendChild(finScore(M));row.appendChild(finSide(M,1,true));box.appendChild(row);
  var w=M.p[M.won],ch=el('div','fn-champ');ch.appendChild(el('span','fn-ct',A.t('w_fin_champ')));ch.appendChild(A.nameEl(w.n,w.c,'fn-cn'));box.appendChild(ch);
  A.clear(chEl).appendChild(box);
}
function draw(P){cur=P;if(FIX!=='classic')applySh(P.sh);drawSide(P);drawPicker(P);drawFinal(P);}

/* ---------- control panel ---------- */
function rowBtn(txt,title,fn,cls){var b=el('button','mini'+(cls?' '+cls:''),txt);b.type='button';b.title=title;b.setAttribute('aria-label',title);b.addEventListener('click',fn);return b}
var ctrlKey='';
function renderCtrl(){
  if(A.obs)return;
  var busy=!!S.spin;
  var sp=$('whSpin'),endless=!!(S.spin&&S.spin.endless);sp.disabled=(busy&&!endless)||!S.entries.length||S.phase==='choose';
  sp.textContent=endless?A.t('w_stop_spin'):(S.fin&&S.phase!=='win')?fmt(A.t('w_spin_fin'),{r:WO.finalRound(S.fin)}):(S.mode==='elim'&&S.entries.length===2&&S.phase!=='win')?A.t('w_spin_final'):A.t('w_spin');sp.classList.toggle('is-stop',endless);
  $('wSkip').disabled=S.phase!=='choose';$('whOpen').checked=S.open;
  var rs=$('wRespin');rs.hidden=!(S.mode==='classic'&&S.phase==='win'&&S.last&&!busy);
  $('wPause').disabled=S.phase!=='choose'||S.streamerPicks;$('wPause').textContent=S.paused?A.t('w_resume'):A.t('w_pause');
  $('wRand').disabled=S.phase!=='choose';$('wUndo').disabled=!hist.length||busy;
  $('wChooseHint').classList.toggle('on',S.phase==='choose');
  document.querySelectorAll('#wModeSeg [data-wmode]').forEach(function(b){var on=b.getAttribute('data-wmode')===S.mode;b.classList.toggle('on',on);b.setAttribute('aria-checked',String(on));b.setAttribute('role','radio');});
  document.getElementById('ctrl').classList.toggle('is-classic',S.mode==='classic');
  var oh=$('wOutH'),ok2=S.mode==='classic'?'w_out_c':'w_out';if(oh.getAttribute('data-i18n')!==ok2){oh.setAttribute('data-i18n',ok2);oh.textContent=A.t(ok2);}
  var nb=$('wNew'),nk=S.mode==='classic'?'w_new_c':'w_new';if(nb.getAttribute('data-i18n')!==nk){nb.setAttribute('data-i18n',nk);nb.textContent=A.t(nk);}
  var st=$('wStatus'),secs=S.phase==='choose'&&!S.paused?Math.max(0,Math.ceil((S.deadline-Date.now())/1000)):0;
  var stTxt=S.spin?A.t(S.spin.endless?'w_st_endless':'w_st_spin'):S.phase==='win'&&S.winner?fmt(A.t('w_st_win'),{x:S.winner.n}):S.phase==='choose'&&S.chooser?(S.streamerPicks?fmt(A.t('w_st_streamer'),{x:S.chooser.n}):(S.paused?A.t('w_paused')+' — '+S.chooser.n:fmt(A.t(S.deadline?'w_st_choose':'w_st_choose_nl'),{x:S.chooser.n,s:secs}))):A.t('w_st_idle');
  st.textContent=stTxt;st.className='w2-status ph-'+S.phase;
  var k=JSON.stringify([S.entries,S.out,S.phase,S.chooser,S.mode,S.shOn,A.lang()]);if(k===ctrlKey)return;ctrlKey=k;
  var il=$('wInList');A.clear(il);$('wInN').textContent=S.entries.length;
  S.entries.forEach(function(e,i){
    var li=el('li','w2-row'+(S.chooser&&e.n===S.chooser.n?' is-chooser':''));li.appendChild(el('span','w2-no',String(i+1)));li.appendChild(avatar(e.u,e.n,e.c));li.appendChild(A.nameEl(e.n,e.c));
    if(S.mode==='elim'&&S.shOn){li.appendChild(el('span','w2-sh',(e.sh|0)>0?'🛡️'+((e.sh|0)>1?'×'+e.sh:''):'·'));
      li.appendChild(rowBtn('🛡️+',A.t('w_sh_add'),function(){snap();e.sh=Math.min(5,(e.sh|0)+1);save();changed();}));
      li.appendChild(rowBtn('🛡️−',A.t('w_sh_take'),function(){if((e.sh|0)<1)return;snap();e.sh--;save();changed();}));}
    li.appendChild(rowBtn('✖',A.t('w_kick_title'),function(){
      if(S.spin)return;
      if(S.phase==='choose'&&S.chooser){if(e.n!==S.chooser.n)doKick(S.entries.indexOf(e),S.chooser.n);return;}
      snap();var j=S.entries.indexOf(e);if(j<0)return;S.entries.splice(j,1);
      if(S.mode==='elim'){S.out.unshift(e);event('mkick','',e.n);}
      save();changed();
    },'kick'));
    il.appendChild(li);
  });
  var ol=$('wOutList');A.clear(ol);$('wOutN').textContent=S.out.length;
  S.out.forEach(function(e,i){
    var li=el('li','w2-row');li.appendChild(el('span','w2-no',String(i+1)));li.appendChild(avatar(e.u,e.n,e.c));li.appendChild(A.nameEl(e.n,e.c));
    li.appendChild(rowBtn('↩',A.t('w_revive_title'),function(){
      if(S.spin)return;var j=S.out.indexOf(e);if(j<0)return;
      if(S.phase==='choose'&&S.chooser){var me=chooserEntry();if(me&&(me.sh|0)>0){doRevive(j,S.chooser.n);return;}}
      snap();S.out.splice(j,1);e.sh=0;S.entries.push(e);if(S.mode==='elim')event('mrevive','',e.n);save();changed();
    }));
    ol.appendChild(li);
  });
}
function changed(){if(A.runsEngine())syncFin();var P=pub();draw(P);renderCtrl();A.publish(P);}

if(!A.obs){
  var sv={};try{sv=JSON.parse(A.LS.get(SKEY,'{}'))||{}}catch(e){}
  S.mode=FIX||(sv.mode==='classic'?'classic':'elim');
  if(FIX){var seg=$('wModeSeg');if(seg&&seg.parentNode)seg.parentNode.removeChild(seg);}
  (sv.w||[]).forEach(function(e){if(e&&e.n)S.wins.push({n:String(e.n).slice(0,32),c:e.c||'',u:e.u||''})});/* saved before v13: shields were always on (sh = shields each, 0 = none) and timers had no "no limit"; shields now start OFF */
  var so=WO?WO.norm({sh:sv.v>=13?!!sv.shOn:false,shStart:sv.sh>0?sv.sh:1,picker:sv.pk==null?true:!!sv.pk,pick:sv.pick==null?OD.pick:sv.pick,dur:sv.dur==null?OD.dur:sv.dur,auto:(sv.v>=18&&sv.auto!=null)?sv.auto:OD.auto,join:sv.join==null?OD.join:sv.join,fin:sv.fo==null?true:!!sv.fo,finTo:sv.ft||3}):OD;
  S.shOn=FIX==='classic'?false:so.sh;S.shStart=so.shStart;S.picker=so.picker;S.pickSecs=so.pick;S.dur=so.dur;S.autoNext=so.auto;S.joinSecs=so.join;S.finOn=so.fin!==false;S.finTo=so.finTo||3;S.timeoutAct=sv.v>=16&&sv.to?sv.to:'streamer';S.finAuto=!!sv.fa;S.vipCtrl=!!sv.vip;S.finDock=sv.v>=17?!!sv.fd:true;S.elim=!!sv.el;
  (sv.e||[]).forEach(function(e){add(e.n,e.c,e.u,S.shOn?(e.sh==null?S.shStart:e.sh):0)});
  (sv.o||[]).forEach(function(e){S.out.push({n:e.n,c:e.c,u:e.u,sh:S.shOn?e.sh|0:0})});
  S.fin=sv.f&&sv.f.p&&sv.f.s?sv.f:null; /* a refresh mid-final keeps the score */
  S.remove=!!sv.remove;openJoin(sv.open!==false);S.title=sv.title||'';S.chatCols=sv.v>=16?!!sv.cc:true;S.avatar=!!sv.av;
  $('whRemove').checked=S.remove;$('whOpen').checked=S.open;$('whTitle').value=S.title;$('whChatCols').checked=S.chatCols;$('whAvatar').checked=S.avatar;
  $('whChatCols').addEventListener('change',function(){S.chatCols=this.checked;save();changed();});
  $('whAvatar').addEventListener('change',function(){S.avatar=this.checked;save();changed();});
  $('wShields').value=String(S.shStart);$('wTimeout').value=S.timeoutAct;$('wShOn').checked=S.shOn;$('wPickerOn').checked=S.picker;
  /* each timer: "no limit" or a custom number of seconds typed by the streamer */
  var tmr=function(id,key,def,after){var m=$(id+'Mode'),inp=$(id),u=inp.parentNode.querySelector('.tmr-u'),lim=WO?WO.LIM[key]:[1,3600];
    inp.min=String(lim[0]);inp.max=String(lim[1]);
    var sb=[].slice.call(inp.parentNode.querySelectorAll('.tsb'));sb.forEach(function(b){if(b.getAttribute('data-v')==='0')b.title=m.options[0].textContent;b.addEventListener('click',function(){if(m.value===b.getAttribute('data-v'))return;m.value=b.getAttribute('data-v');m.dispatchEvent(new Event('change'));});});
    var show=function(){var v=S[{pick:'pickSecs',dur:'dur',auto:'autoNext',join:'joinSecs'}[key]];m.value=v>0?'1':'0';if(v>0)inp.value=String(v);else if(!inp.value)inp.value=String(def);inp.hidden=!(v>0);if(u)u.hidden=!(v>0);sb.forEach(function(b){var on=b.getAttribute('data-v')===m.value;if(b.getAttribute('data-v')==='0')b.title=m.options[0].textContent;b.classList.toggle('on',on);b.setAttribute('aria-checked',String(on));b.setAttribute('role','radio');});};
    var set=function(v){S[{pick:'pickSecs',dur:'dur',auto:'autoNext',join:'joinSecs'}[key]]=WO?WO.clampT(key,v):v;show();save();if(after)after();changed();};
    m.addEventListener('change',function(){set(m.value==='1'?(+inp.value||def):0);if(m.value==='1')inp.focus();});
    inp.addEventListener('change',function(){if(m.value==='1')set(+inp.value||def);});
    show();};
  /* "خيارات زيادة": closed by default, remembers open/closed */
  (function(){var x=$('wXtra');if(!x)return;var XK='lamma-wxtra';try{x.open=localStorage.getItem(XK)==='1';}catch(e){}
    x.addEventListener('toggle',function(){try{localStorage.setItem(XK,x.open?'1':'0');}catch(e){}});})();
  tmr('wPick','pick',20,function(){if(S.phase==='choose'&&!S.paused&&!S.streamerPicks)S.deadline=S.pickSecs>0?Date.now()+S.pickSecs*1000:0;});
  tmr('whDur','dur',6);tmr('wAuto','auto',10);tmr('wJoin','join',60,function(){if(S.open)openJoin(true);});
  $('wShOn').addEventListener('change',function(){snap();S.shOn=this.checked;S.entries.forEach(function(e){e.sh=startShields()});S.out.forEach(function(e){e.sh=0});save();changed();});
  $('wPickerOn').addEventListener('change',function(){S.picker=this.checked;save();changed();});
  (function(){var fo=$('wFinOn'),ft=$('wFinTo');if(!fo||!ft)return;fo.checked=S.finOn;ft.value=String(S.finTo);
    var vis=function(){var r=ft.closest('.srow');if(r)r.hidden=!S.finOn;};vis();
    fo.addEventListener('change',function(){if(S.spin)return;S.finOn=this.checked;vis();save();changed();});
    ft.addEventListener('change',function(){S.finTo=Math.max(2,Math.min(9,+this.value||3));save();changed();});})();
  $('wSkip').addEventListener('click',skipPick);
  $('wAddBtn').addEventListener('click',function(){var ta=$('whText');var added=0;snap();ta.value.split('\n').forEach(function(l){if(add(l))added++;});ta.value='';save();changed();});
  $('whOpen').addEventListener('change',function(){openJoin(this.checked);save();changed();});
  $('whRemove').addEventListener('change',function(){S.remove=this.checked;save();});
  $('wShields').addEventListener('change',function(){S.shStart=+this.value;save();});
  $('wTimeout').addEventListener('change',function(){S.timeoutAct=this.value;save();});
  $('whTitle').addEventListener('input',function(){S.title=this.value.slice(0,40);save();changed();});
  $('whSpin').addEventListener('click',function(){if(S.spin&&S.spin.endless)stopSpin();else spin();});
  $('wRespin').addEventListener('click',respin);
  $('wPause').addEventListener('click',togglePause);
  $('wRand').addEventListener('click',function(){if(S.phase==='choose')randomKick();});
  $('wUndo').addEventListener('click',undo);
  $('wNew').addEventListener('click',newRound);
  document.querySelectorAll('#wModeSeg [data-wmode]').forEach(function(b){b.addEventListener('click',function(){
    var m=b.getAttribute('data-wmode');if(m===S.mode||S.spin)return;snap();S.mode=m;
    if(m==='classic'){S.out.forEach(function(e){S.entries.push(e)});S.out=[];S.phase=S.phase==='choose'?'idle':S.phase;S.chooser=null;}
    else S.entries.forEach(function(e){if(e.sh==null)e.sh=S.shStart});
    save();changed();});});
  $('whShuffle').addEventListener('click',function(){snap();S.entries=C.shuffle(S.entries);save();changed();});
  /* ↺ ريسيت: one tap arms it (button turns red "متأكد؟"), a second tap within 3 s wipes everything */
  (function(){var b=$('whClear'),armT=0;b.addEventListener('click',function(){
    if(!b.classList.contains('armed')){b.classList.add('armed');b.textContent=A.t('w_reset_q');clearTimeout(armT);armT=setTimeout(function(){b.classList.remove('armed');b.textContent=A.t('w_reset');},3000);return;}
    clearTimeout(armT);b.classList.remove('armed');b.textContent=A.t('w_reset');resetAll();});})();
  $('wFinAuto').checked=S.finAuto;$('wFinAuto').addEventListener('change',function(){S.finAuto=this.checked;if(!S.finAuto)S.nextAt=0;save();changed();});
  $('wFinDock').checked=S.finDock;$('wFinDock').addEventListener('change',function(){S.finDock=this.checked;save();changed();});
  $('wVip').checked=S.vipCtrl;$('wVip').addEventListener('change',function(){S.vipCtrl=this.checked;save();changed();});
}
/* the overlay running on its own (mod chat commands, no dock) takes the options from its link: &tm= &sh= &pk= */
if(A.obs&&WO){var oo=WO.decodeObs(function(k){return A.Q.get(k)});S.shOn=FIX==='classic'?false:oo.sh;S.shStart=oo.shStart;S.picker=oo.picker;S.pickSecs=oo.pick;S.dur=oo.dur;S.autoNext=oo.auto;S.joinSecs=oo.join;S.finOn=oo.fin!==false;S.finTo=oo.finTo||3;S.finAuto=!!oo.fa;S.vipCtrl=!!oo.vip;S.finDock=oo.fd!==false;openJoin(true);}
if(!A.obs&&WO&&A.obsExtra)A.obsExtra(function(){return WO.encodeObs(opts())});
A.onLang(function(){sideKey='';ctrlKey='';pkKey='';fnKey='';chKey='';fdKey='';shApplied=null;applySh(S.shOn&&S.mode==='elim');changed();});
/* on the control page's stage: during a pick on the shield wheel, clicking a name in the players list kicks it (shields count, same as ✖) */
if(!A.obs){var inEl=$('whIn');if(inEl)inEl.addEventListener('click',function(e){
  if(document.querySelector('.lay-root.lay-editing'))return;var li=e.target.closest('li.w2-chip');if(!li||li.classList.contains('more'))return;
  if(S.mode!=='elim'||S.phase!=='choose'||!S.chooser||S.spin)return;var nm=li.querySelector('.nm');if(!nm)return;var n=nm.textContent;
  var i=S.entries.findIndex(function(x){return x.n===n});if(i>=0&&n!==S.chooser.n)doKick(i,S.chooser.n);});}
A.onMirror(function(P){draw(P)});
/* ---------- Nov 4 (Mohammad): fullscreen = the wheel only (+ the fixed logo and the title in its centre). A small ⚙ at the
   bottom-left opens ONLY the settings card; a click anywhere on the screen (or on the wheel outside fullscreen) spins it;
   Ctrl+Enter / ⌘+Enter spins (or stops a no-limit spin). ---------- */
if(!A.obs){(function(){
  var stage=$('stage'),wrap=stage&&stage.parentNode,set=document.querySelector('.w2-set'),home=null,box=null,gear=null;
  if(!stage||!wrap)return;
  var fsOn=function(){return wrap.classList.contains('lay-fson')};
  function closeSet(){if(!box)return;box.hidden=true;gear.classList.remove('on');gear.setAttribute('aria-expanded','false');
    if(set&&home&&set.parentNode===box){home.parentNode.insertBefore(set,home);}}
  function openSet(){if(!set)return;if(!home){home=document.createComment('w2-set');set.parentNode.insertBefore(home,set);}
    box.appendChild(set);set.open=true;box.hidden=false;gear.classList.add('on');gear.setAttribute('aria-expanded','true');}
  gear=document.createElement('button');gear.type='button';gear.className='w-fs-gear';gear.textContent='⚙';gear.setAttribute('aria-expanded','false');
  var gt=function(){gear.title=A.t('w_fs_set');gear.setAttribute('aria-label',A.t('w_fs_set'));};gt();A.onLang(gt);
  box=document.createElement('div');box.className='w-fs-set';box.hidden=true;
  gear.addEventListener('click',function(e){e.stopPropagation();if(box.hidden)openSet();else closeSet();});
  box.addEventListener('click',function(e){e.stopPropagation();});
  stage.appendChild(gear);stage.appendChild(box);
  var sync=function(){if(!fsOn())closeSet();document.body.classList.toggle('w-fs',fsOn());fnKey='';fdKey='';if(cur)drawFinal(cur);};
  document.addEventListener('fullscreenchange',function(){setTimeout(sync,0)});document.addEventListener('webkitfullscreenchange',function(){setTimeout(sync,0)});
  function spinOrStop(){if(S.spin&&S.spin.endless){stopSpin();return true;}if(S.spin||S.phase==='choose'||!S.entries.length)return false;spin();return true;}
  stage.addEventListener('click',function(e){
    if(editing())return;var t=e.target;
    if(t.closest('button,a,input,select,textarea,label,summary,details,.w2-picker,.w2-panel,.lay-fs,.w-fs-gear,.w-fs-set,.w2-champ'))return;
    if(box&&!box.hidden){closeSet();return;}
    var onWheel=!!t.closest('.lay-wheel');
    if(fsOn()||onWheel)spinOrStop();});
  document.addEventListener('keydown',function(e){if(e.key==='Enter'&&(e.ctrlKey||e.metaKey)){e.preventDefault();spinOrStop();}});
})();}

/* ---------- demo: bots join, and a landed bot kicks/revives by chat ---------- */
var demoWatch=null;
A.onDemo(function(){
  if(S.entries.length<10){A.BOTS.slice(0,14).forEach(function(b,i){A.later(300+i*260,function(){A.say(['!join','!دخول','دخول','!wheel'][i%4],A.bot(i));});});}
  clearInterval(demoWatch);var lastCh='';
  demoWatch=setInterval(function(){
    if(!A.demo()){clearInterval(demoWatch);return;}
    if(S.phase==='choose'&&S.chooser&&!S.paused&&!S.streamerPicks){
      var tag=S.chooser.n+S.deadline;if(tag===lastCh)return;lastCh=tag;
      var me=chooserEntry();var bi=A.BOTS.findIndex(function(b){return b[0]===S.chooser.n});if(bi<0)return;
      A.later(1800+Math.random()*3000,function(){
        if(S.phase!=='choose'||!S.chooser||S.chooser.n!==A.BOTS[bi][0])return;
        if(me&&(me.sh|0)>0&&S.out.length&&Math.random()<.3){A.say('!revive '+S.out[Math.random()*S.out.length|0].n,A.bot(bi));return;}
        var others=S.entries.filter(function(e){return e.n!==S.chooser.n});if(!others.length)return;
        var tg=others[Math.random()*others.length|0];
        var r=Math.random();if(r<.3){var ti=S.entries.indexOf(tg);A.say('!طرد '+(ti+1),A.bot(bi));}else A.say((r<.65?'!kick ':'!طرد ')+tg.n,A.bot(bi));
      });
    }
  },500);
});
/* ---------- layout editor (layout.js): every public piece of the stage can be moved, resized or hidden.
   Default (Nov 2026, after Mohammad's reference): one slim sidebar on the LEFT (players with the count on top, then the out / winners
   list, the event line and the join box), the wheel big in the centre of the rest, the title in its centre badge, the لَمّة logo fixed
   top-right. ---------- */
var LAYOUT=window.LammaLayout&&window.LammaLayout.init({root:$('gs'),stage:$('stage'),key:document.body.getAttribute('data-game')||'wheel',items:[
  {id:'wheel',z:1,code:'w',kind:'scale',snapCenter:true,ar:'العجلة',en:'Wheel',def:{x:36.4,y:4.5,w:51},minW:12},
  /* ONE panel on the left with sections (players, out / winners, event line, join box): hide any section and the rest fill the
     panel; drag the lines between sections to give one more room. Old links' p/o/e/b pieces map onto these sections. */
  {id:'side',z:2,code:'s',kind:'box',ar:'القائمة',en:'Side list',def:{x:1.6,y:3,w:24,h:86.5,s:1},minW:10,minH:18,sections:[
    {id:'players',code:'p',old:'p',ar:'اللاعبين',en:'Players',def:{f:6.4}},
    {id:'list2',code:'o',old:'o',label:function(){var cl=document.body.getAttribute('data-wmode')==='classic';return A.lang()==='en'?(cl?'Winners':'Out'):(cl?'الفايزين':'برا العجلة')},def:{f:FIX==='classic'?3.4:1.8}},
    {id:'event',code:'e',old:'e',ar:'سطر الأحداث',en:'Event line',def:{f:1,v:FIX!=='classic'}}, /* the classic wheel has no kick/shield events: hidden by default there */
    {id:'banner',code:'b',old:'b',ar:'صندوق الدخول',en:'Join box',def:{f:1.9}}
  ]},
  /* the final's scoreboard: small, in the gap above the panel / beside the wheel (no overlap with the default wheel); "النتيجة باللوحة اليسار" docks it instead */
  {id:'final',z:4,code:'f',kind:'box',ar:'لوحة النتيجة',en:'Scoreboard',def:{x:26.2,y:1.5,w:16.5,h:19,s:1},minW:8,minH:7}
]});
if(LAYOUT&&!A.obs){var lr=$('gs');if(lr&&window.MutationObserver)new MutationObserver(function(){fnKey='';if(cur)drawFinal(cur);}).observe(lr,{attributes:true,attributeFilter:['class']});}
changed();
A.start();
})();
