/* likely.js — مين الأرجح؟ / Who's most likely */
(function(){
'use strict';
var A=window.App,W=window.Words,C=A.C,$=A.$;
A.strings({ar:{g_title:'مين الأرجح؟',g_how:'سؤال "مين الأرجح…؟" وأسماء (أصحابك، المودز، أو ناس من الشات)، والشات بيصوت !1 لـ !4.',l_prompt:'السؤال',l_another:'سؤال تاني 🎲',l_fromchat:'أسماء من الشات',v_dur:'المدة (ث)',v_start:'ابدأ التصويت',v_end:'إنهاء',
  l_tip:'"أسماء من الشات" بتاخد 4 ناس كتبو بالشات مؤخراً. ضحك بس، بلا تنمّر 😄',v_idle:'مين الأرجح؟',v_idle_s:'سؤال وأسماء… والشات بيحكم',v_how:'صوّتو بـ !1 !2 !3 !4',v_cmd_vote:'صوّت',l_cmd_start:'سؤال جديد',c_cmd_stop:'وقّف',v_need:'لازم سؤال واسمين عالأقل'},
 en:{g_title:'Most Likely',g_how:'A "who\'s most likely…?" question and names (friends, mods or chatters); chat votes !1 to !4.',l_prompt:'Question',l_another:'Another question 🎲',l_fromchat:'Names from chat',v_dur:'Duration (s)',v_start:'Start the vote',v_end:'End',
  l_tip:'"Names from chat" takes 4 people who chatted recently. Just for laughs, no bullying 😄',v_idle:'Most Likely',v_idle_s:'A question and names… chat decides',v_how:'Vote with !1 !2 !3 !4',v_cmd_vote:'vote',l_cmd_start:'new question',c_cmd_stop:'stop',v_need:'Needs a question and at least two names'}});
var recent=[];
A.onChat(function(m){if(m.broadcaster)return;var i=recent.indexOf(m.name);if(i>=0)recent.splice(i,1);recent.unshift(m.name);if(recent.length>30)recent.pop();});
function prompt(){var l=W.LIKELY[A.lang()==='en'?'en':'ar'];return l[Math.random()*l.length|0]}
function names(){return C.shuffle(recent.slice(0,15)).slice(0,4)}
var poll=Poll({kind:'likely',icon:'🤔',idle:'v_idle',idleSub:'v_idle_s',how:'v_how',max:4,
  onCmd:function(cmd,api){if(cmd.cmd==='likely'){var n=names();if(n.length>=2)api.start(prompt(),n,30);return true;}},
  onChange:function(S){if(A.obs)return;$('lEnd').disabled=S.phase!=='live';}});
if(!A.obs){
  $('lQ').value=prompt();
  $('lShuffle').addEventListener('click',function(){$('lQ').value=prompt();});
  $('lFromChat').addEventListener('click',function(){var n=names();['lO1','lO2','lO3','lO4'].forEach(function(id,i){$(id).value=n[i]||'';});});
  $('lStart').addEventListener('click',function(){var ok=poll.start($('lQ').value.trim(),[$('lO1').value,$('lO2').value,$('lO3').value,$('lO4').value],+$('lDur').value);if(!ok)alert(A.t('v_need'));});
  $('lEnd').addEventListener('click',poll.end);
}
poll.changed();A.start();
})();
