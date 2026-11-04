/* hub.js — home page: pick the channel, game cards, shared leaderboard */
(function(){
'use strict';
var A=window.App,$=A.$;
A.strings({
 ar:{h_tag:'كل ألعاب الشات بمكان واحد',h_sub:'تمثيل، ساحة ماين، عجلة، كلمات سرية وأكتر. اكتب اسم القناة، اختار لعبة، والشات بيلعب بالكتابة.',h_label:'اسم قناة تويتش',h_ph:'اسم القناة',h_use:'استخدم',
  h_note:'ما في تسجيل دخول ولا توكن: الموقع بيقرأ الشات العام بس. القناة بتنحفظ بهالمتصفح.',h_games:'الألعاب',h_how:'كيف بتشتغل؟',
  s1t:'اختار القناة',s1d:'اكتب اسم قناتك فوق، أو أي قناة تانية.',s2t:'افتح لعبة',s2d:'كل لعبة إلها لوحة تحكم إلك، ووضع تجربة بشات وهمي.',
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
  live_now:'🔴 لايف هلأ',viewers:'مشاهد',not_live:'أوفلاين هلأ',not_found:'ما لقينا هالقناة'},
 en:{h_tag:'All your chat games in one place',h_sub:'Charades, a Minecraft arena, a wheel, secret words and more. Type a channel, pick a game, and chat plays by typing.',h_label:'Twitch channel name',h_ph:'channel name',h_use:'Use',
  h_note:'No login, no token: the site only reads public chat. The channel is remembered in this browser.',h_games:'Games',h_how:'How it works',
  s1t:'Pick the channel',s1d:'Type your channel above, or any other channel.',s2t:'Open a game',s2d:'Every game has a control panel for you and a demo mode with fake chat.',
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
  live_now:'🔴 Live now',viewers:'viewers',not_live:'Offline right now',not_found:'Channel not found'}
});
var info=null;
function showInfo(){
  var lv=$('chanLive');
  if(!info){lv.textContent='';return;}
  if(info==='none'){lv.textContent=A.t('not_found');lv.className='chan-live';$('chanAv').hidden=true;return;}
  $('chanName').textContent=info.displayName||('#'+A.channel);
  if(info.profileImageURL){$('chanAv').src=info.profileImageURL;$('chanAv').hidden=false;}
  if(info.stream){lv.textContent=A.t('live_now')+' · '+(info.stream.viewersCount||0)+' '+A.t('viewers');lv.className='chan-live on';}
  else{lv.textContent=A.t('not_live');lv.className='chan-live';}
}
A.onLang(showInfo);
$('chanInput').value=A.channel;
$('chanName').textContent='#'+A.channel;
$('chanForm').addEventListener('submit',function(e){
  e.preventDefault();var c=A.C.safeChannel($('chanInput').value);
  if(!c){alert(A.t('bad_ch'));$('chanInput').focus();return;}
  A.LS.set('lamma-channel',c);location.href=location.pathname+'?channel='+encodeURIComponent(c);
});
A.channelInfo(A.channel,function(u){info=u||'none';showInfo();});
A.start();
// the hub does not need the chat connection open; show it only as a status
})();
