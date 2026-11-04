/* wheelcmds.js — the wheel's chat commands in English AND Arabic, as one table (used by wheel.js, tested in Node).
   resolve(text) → {cmd, rest, num} or null. "!دخول" and "!join" are the same command; a bare "دخول" / "join" (no "!") joins too.
   Arabic words are compared after core.js normalize(): hamza / alef forms, ة→ه, ى→ي, tashkeel and tatweel do not matter.
   num: the argument as a number ("!طرد 3", "!kick ٣") — kick / revive by the number shown in the list. */
(function(root){
'use strict';
var C=root.ChatCore||(typeof require==='function'?require('./core.js'):null);
var WORDS={
  join:['join','wheel','enter','دخول','ادخل','دخلني','فوت','فوتني'],
  leave:['leave','exit','quit','خروج','انسحاب','انسحب','اطلع'],
  kick:['kick','out','طرد','اطرد','طلع','طلّع'],
  revive:['revive','back','رجع','رجّع','ارجع','رجعه','احياء'],
  spin:['spin','لف','لفّ','لفي','دور','دوّر','دوري'],
  respin:['respin','reroll','اعادة','إعادة','عيد','اعيد'],
  clear:['clear','مسح','امسح'],
  open:['open','فتح','افتح'],
  close:['close','سكر','سكّر','اغلاق','قفل','سكير'],
  newround:['newround','reset','جديد','جولة','جوله'],
  pause:['pause','stop','وقف','ايقاف','توقف','ستوب'],   /* also stops a no-time-limit spin */
  skip:['skip','pass','تخطي','تخطى','سكيب','سكب'],      /* mods: the landed player's turn passes, nobody leaves */
  undo:['undo','تراجع']
};
var BARE=['join','دخول','ادخل'];   /* these also count without the "!" when they are the whole message */
var MAP={},BMAP={};
function norm(s){return C?C.normalize(s):String(s||'').toLowerCase().trim()}
Object.keys(WORDS).forEach(function(k){WORDS[k].forEach(function(w){MAP[norm(w)]=k})});
BARE.forEach(function(w){BMAP[norm(w)]='join'});
function toNum(rest){var r=norm(rest).replace(/^#/,'');return /^\d{1,3}$/.test(r)?parseInt(r,10):0}
function resolve(text){
  var raw=String(text||'').trim();
  var p=C?C.parseCmd(raw):null;
  if(!p){var b=norm(raw);if(BMAP[b])return {cmd:BMAP[b],rest:'',num:0,bare:true};return null;}
  var k=MAP[p.cmd];if(!k)return null;
  return {cmd:k,rest:p.rest,num:toNum(p.rest)};
}
/* what the help / join box shows: [english, arabic] for each command */
var SHOW={join:['!join','!دخول'],leave:['!leave','!خروج'],kick:['!kick','!طرد'],revive:['!revive','!رجع'],spin:['!spin','!لف'],respin:['!respin','!اعادة'],
  clear:['!clear','!مسح'],open:['!open','!فتح'],close:['!close','!سكر'],newround:['!newround','!جديد'],pause:['!pause','!وقف'],undo:['!undo','!تراجع'],skip:['!skip','!تخطي']};
var api={resolve:resolve,words:WORDS,show:SHOW};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.LammaWheelCmds=api;
})(typeof window!=='undefined'?window:globalThis);
