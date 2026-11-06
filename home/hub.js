/* hub.js — home page: pick the channel, game cards, shared leaderboard */
(function(){
'use strict';
var A=window.App,$=A.$;
A.strings({
 ar:{h_tag:'كل ألعاب الشات بمكان واحد',h_sub:'تمثيل، ساحة ماين، عجلة، كلمات سرية وأكتر. سجّل الدخول بتويتش أو العب مع أصحابك، اختر لعبة، والشات يلعب بالكتابة.',
h_games:'الألعاب',h_how:'كيف بتشتغل؟',
  s1t:'سجّل الدخول',s1d:'بتويتش لتشغّل الألعاب على قناتك، أو العب مع أصحابك بلا بث.',s2t:'افتح لعبة',s2d:'لكل لعبة لوحة تحكم خاصة بك، واللاعبون يدخلون من الشات.',
  s3t:'حطها عالستريم',s3d:'انسخ رابط OBS من صفحة اللعبة وحطه Browser Source. الرابط ما بيعرض أي سر.',s4t:'الشات بيلعب',s4d:'المتابعين بيلعبو بالكتابة، والمودز بيقدرو يشغلو الألعاب بأوامر.',
  h_lbnote:'نقاط كل الألعاب لهالقناة، محفوظة بهالمتصفح.',bad_ch:'اسم القناة لازم يكون 2–25 حرف إنجليزي أو أرقام أو _',
  tag_new:'جديد',tag_hot:'⭐ الأساسية',tag_party:'بارتي',
  h_charades:'تمثيل',hd_charades:'الكلمة بتبين إلك بس. مثّلها بالكام بدون حكي، والشات بيخمّن.',
  h_battle:'المعركة',hd_battle:'قسم المعركة بستايل ماينكرافت دنجن: معركة الساحة (موجات موبز وزعماء، وإنت بتختار المقاتلين)، لعبة الألوان، وألعاب تانية جاية.',
  h_wheels:'العجلات',hd_wheels:'قسم العجلات: العجلة الكلاسيك (اللي بتوقف عليه بيربح) وعجلة الشخصنة (اللي بتوقف عليه بيختار مين يطلع). وعجلات جديدة جاية.',h_wheel:'العجلة',hd_wheel:'عجلة إقصاء: اللي بتوقف عليه بيختار مين يطلع بـ !طرد. آخر اثنين، اللفة الأخيرة بتعطي الفائز.',
  h_codenames:'كلمات سرية',hd_codenames:'متل كود نيمز: الشات بينضم، الستريمر بيقسم الفرق وبيختار السباي ماستر والكابتن، وبس الكابتن بيحسم.',
  h_fast:'أسرع واحد',hd_fast:'أذكار، أسئلة، أو كلمات: أول واحد بيكتب صح بيربح.',h_guess:'خمّن الرقم',hd_guess:'رقم سري من 1 لـ 1000، والمجال بيضيق مع كل تخمين. ضد السبام: كل واحد مرة كل كم ثانية.',
  h_vote:'تصويت الشات',hd_vote:'سؤال وخيارات، والشات بيصوت !1 !2.',h_trivia:'أسئلة سريعة',hd_trivia:'سؤال و4 أجوبة، والأسرع بالجواب الصح بياخد نقاط أكتر.',
  h_likely:'مين الأرجح؟',hd_likely:'"مين الأرجح ينام بالستريم؟" والشات بيصوت على أسماء.',h_chain:'سلسلة كلمات',hd_chain:'كل كلمة بتبلش بآخر حرف من اللي قبلها.',
  live_now:'🔴 لايف هلأ',viewers:'مشاهد',not_live:'أوفلاين هلأ',not_found:'ما لقينا هالقناة',
  c_your:'قناتك',c_switch:'تبديل الحساب',c_auto:'القناة مأخوذة من حسابك في تويتش، ولا يستطيع أحد غيرك فتح لوحة التحكم لها.',c_lv:'مستواك كستريمر',
  c_tw:'سجّل الدخول بتويتش لبدء البث',c_fr:'العب مع أصحابك بلا بث',c_tw_off:'تسجيل الدخول بتويتش غير مفعّل بعدُ (يحتاج Client ID)',
  c_as:'أنت داخل بحساب',c_as2:'لتشغيل الألعاب على قناتك سجّل الدخول بتويتش.',c_fr_on:'وضع اللعب مع الأصحاب مفعّل: اختر لعبة من الأسفل.',c_fr_need:'سجّل الدخول بأي طريقة، ثم اختر لعبة.',
  h_lvlink:'لوحة الصدارة: أفضل الستريمرز والمشاهدين ←'},
 en:{h_tag:'All your chat games in one place',h_sub:'Charades, a Minecraft arena, a wheel, secret words and more. Sign in with Twitch or play with friends, pick a game, and chat plays by typing.',
  h_games:'Games',h_how:'How it works',
  s1t:'Sign in',s1d:'With Twitch to run the games on your channel, or play with friends without a stream.',s2t:'Open a game',s2d:'Every game has a control panel for you, and players join from chat.',
  s3t:'Put it on stream',s3d:'Copy the OBS link from the game page as a Browser Source. It never shows a secret.',s4t:'Chat plays',s4d:'Viewers play by typing, and mods can run games with commands.',
  h_lbnote:'Points from every game for this channel, saved in this browser.',bad_ch:'Channel names are 2–25 letters, digits or _',
  tag_new:'New',tag_hot:'⭐ Main event',tag_party:'Party',
  h_charades:'Charades',hd_charades:'Only you see the word. Act it out on camera without talking; chat guesses.',
  h_battle:'Battle',hd_battle:'The battle section, Minecraft Dungeons style: Arena Battle (waves of mobs and bosses, you pick the squad), the Colour Floor, and more modes coming.',
  h_wheels:'Wheels',hd_wheels:'The wheels section: the Classic wheel (whoever it lands on wins) and the Personal wheel (whoever it lands on picks who leaves). More wheels coming.',h_wheel:'Spin Wheel',hd_wheel:'Elimination wheel: whoever it lands on picks who leaves with !kick. Last two left, the final spin crowns the winner.',
  h_codenames:'Secret Words',hd_codenames:'Like Codenames: chat joins, you split the teams and pick each spymaster and captain, and only the captain locks in.',
  h_fast:'Fastest Typer',hd_fast:'Adhkar, quiz questions or words: the first to type it right wins.',h_guess:'Guess the Number',hd_guess:'A secret number from 1 to 1000 and the range narrows with every guess. Anti-spam: one guess per person every few seconds.',
  h_vote:'Chat Vote',hd_vote:'A question and options; chat votes !1 !2.',h_trivia:'Quick Trivia',hd_trivia:'A question and 4 answers; the fastest right answer scores most.',
  h_likely:'Most Likely',hd_likely:'"Who\'s most likely to fall asleep on stream?" Chat votes on names.',h_chain:'Word Chain',hd_chain:'Each word starts with the last letter of the one before.',
  live_now:'🔴 Live now',viewers:'viewers',not_live:'Offline right now',not_found:'Channel not found',
  c_your:'Your channel',c_switch:'Switch account',c_auto:'The channel comes from your Twitch account, and nobody else can open its control panel.',c_lv:'Your streamer level',
  c_tw:'Sign in with Twitch to start streaming',c_fr:'Play with friends, no stream',c_tw_off:'Twitch sign-in is not switched on yet (needs a Client ID)',
  c_as:'You are signed in with',c_as2:'To run the games on your channel, sign in with Twitch.',c_fr_on:'Play-with-friends mode is on: pick a game below.',c_fr_need:'Sign in any way you like, then pick a game.',
  h_lvlink:'Leaderboard: top streamers and viewers →'}
});
/* ---------- «قناتك» / the two start buttons (replaces the old "type a channel" box: nobody can type a name and play as someone else) ---------- */
var Au=window.LammaAuth,LV=window.LammaLevels,info=null,infoFor='';
function mk(tag,cls,kids){var e=document.createElement(tag);if(cls)e.className=cls;(kids||[]).forEach(function(k){if(k!=null)e.appendChild(typeof k==='string'?document.createTextNode(k):k)});return e}
function svg(d,fill){var NS='http://www.w3.org/2000/svg',s=document.createElementNS(NS,'svg');s.setAttribute('viewBox','0 0 24 24');s.setAttribute('aria-hidden','true');
  if(fill)s.setAttribute('fill','currentColor');else{s.setAttribute('fill','none');s.setAttribute('stroke','currentColor');s.setAttribute('stroke-width','1.8');s.setAttribute('stroke-linecap','round');s.setAttribute('stroke-linejoin','round')}
  d.forEach(function(x){var p=document.createElementNS(NS,'path');p.setAttribute('d',x);s.appendChild(p)});return s}
var TW=['M4.3 3L3 6.4v13.2h4.5V22h2.6l2.4-2.4h3.6L21 14.7V3H4.3zm15 10.8l-2.8 2.8h-4.4l-2.4 2.4v-2.4H5.9V4.7h13.4v9.1zM16.6 7.9h-1.7v5h1.7v-5zm-4.6 0h-1.7v5H12v-5z'];
var FR=['M9 11.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4zM17 11.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z','M3 20c.6-3.2 3-5 6-5s5.4 1.8 6 5M15.5 14.6c2.8-.3 5 1.3 5.5 4.4'];
function sess(){return Au&&Au.session?Au.session():null}
function twOn(){return !!(Au&&Au.providers&&Au.providers.twitch)}
function toGames(){var g=document.getElementById('gTitle');if(g&&g.scrollIntoView)g.scrollIntoView({behavior:'smooth',block:'start'})}
function render(){
  var box=$('chBox');if(!box)return;A.clear(box);var s=sess();
  document.body.classList.toggle('has-twitch',!!(s&&s.provider==='twitch'));
  if(s&&s.provider==='twitch'){
    var av=mk('span','ch-av');var src=(info&&info!=='none'&&info.profileImageURL)||s.avatar;
    if(src){var im=document.createElement('img');im.src=src;im.alt='';im.width=56;im.height=56;im.referrerPolicy='no-referrer';im.addEventListener('error',function(){av.textContent=(s.display||s.login).charAt(0)});av.appendChild(im)}else av.textContent=(s.display||s.login).charAt(0);
    var live=mk('span','ch-live');
    if(info&&info!=='none'&&info.stream){live.className='ch-live on';live.textContent=A.t('live_now')+' · '+(info.stream.viewersCount||0)+' '+A.t('viewers')}
    else live.textContent=info?A.t('not_live'):'…';
    var nm=mk('b','ch-name',[mk('bdi','',[(info&&info!=='none'&&info.displayName)||s.display||s.login])]);
    var me=LV&&LV.mine(),lvb=LV?LV.badge(me?me.level:1,'lv-me'):null;if(lvb)lvb.title=A.t('c_lv')+' '+(me?me.level:1);
    var url=mk('a','ch-url',['twitch.tv/'+s.login]);url.href='https://www.twitch.tv/'+encodeURIComponent(s.login);url.rel='noopener';url.target='_blank';url.dir='ltr';
    var sw=mk('button','ch-switch',[A.t('c_switch')]);sw.type='button';sw.addEventListener('click',function(){Au.switchAccount()});
    var card=mk('div','ch-card',[av,mk('div','ch-main',[mk('small','ch-k',[A.t('c_your')]),mk('div','ch-row',[nm,lvb]),mk('div','ch-row',[live,url])]),sw]);
    box.appendChild(card);
    box.appendChild(mk('p','small muted ch-note',[A.t('c_auto')]));
    if(infoFor!==s.login){infoFor=s.login;A.channelInfo(s.login,function(u){info=u||'none';render()})}
    return;
  }
  var tw=mk('button','tw-btn big ch-tw',[svg(TW,true),mk('span','',[A.t('c_tw')])]);tw.type='button';
  if(twOn())tw.addEventListener('click',function(){Au.login('/')});else{tw.disabled=true;tw.setAttribute('aria-disabled','true')}
  var friendsOn=Au&&Au.mode&&Au.mode()==='friends';
  var fr=mk('button','auth-friends ch-fr'+(friendsOn?' on':''),[svg(FR,false),mk('span','',[A.t('c_fr')])]);fr.type='button';fr.setAttribute('aria-pressed',friendsOn?'true':'false');
  fr.addEventListener('click',function(){if(!Au)return;Au.setMode('friends');if(!sess())Au.open();else toGames();});
  box.appendChild(mk('div','ch-acts',[tw,fr]));
  if(!twOn())box.appendChild(mk('p','small muted ch-note',[A.t('c_tw_off')]));
  if(s){var pv=(Au&&{discord:'Discord',google:'Google',guest:A.lang()==='en'?'Guest':'ضيف'}[s.provider])||s.provider;
    box.appendChild(mk('p','small muted ch-note',[A.t('c_as')+' '+pv+': ',mk('b','',[mk('bdi','',[s.display||s.login])]),'. '+A.t('c_as2')]));}
  if(friendsOn)box.appendChild(mk('p','small ch-note ch-ok',[s?A.t('c_fr_on'):A.t('c_fr_need')]));
}
A.onLang(render);
window.addEventListener('lamma-auth',function(){setTimeout(render,0)});
if(LV)LV.onChange(render);
render();
A.start();
// the hub does not need the chat connection open; show it only as a status
})();
