/* core.js — pure helpers shared by every game (no DOM). Browser: window.ChatCore · Node: require(). */
(function(root){
'use strict';

function unescapeTag(v){
  return String(v||'').replace(/\\(.)/g,function(_,c){return c==='s'?' ':c===':'?';':c==='n'?'\n':c==='r'?'':c==='\\'?'\\':c;});
}

/* Parse one raw Twitch IRC line → {tags,prefix,nick,command,params,channel,text} or null. */
function parseLine(line){
  if(!line)return null;
  line=String(line).replace(/\r$/,'');
  var tags={},prefix='',nick='';
  if(line.charAt(0)==='@'){
    var sp=line.indexOf(' ');if(sp<0)return null;
    line.slice(1,sp).split(';').forEach(function(kv){var e=kv.indexOf('=');if(e<0)tags[kv]='';else tags[kv.slice(0,e)]=unescapeTag(kv.slice(e+1));});
    line=line.slice(sp+1);
  }
  if(line.charAt(0)===':'){
    var sp2=line.indexOf(' ');if(sp2<0)return null;
    prefix=line.slice(1,sp2);nick=prefix.split('!')[0];
    line=line.slice(sp2+1);
  }
  var trail=null,ti=line.indexOf(' :');
  if(ti>=0){trail=line.slice(ti+2);line=line.slice(0,ti);}
  else if(line.charAt(0)===':'){trail=line.slice(1);line='';}
  var parts=line.split(' ').filter(Boolean);
  var command=(parts.shift()||'').toUpperCase();
  if(trail!==null)parts.push(trail);
  var out={tags:tags,prefix:prefix,nick:nick,command:command,params:parts,channel:'',text:''};
  if(command==='PRIVMSG'){
    out.channel=(parts[0]||'').replace(/^#/,'');
    var txt=parts[1]||'';
    var m=/^\u0001ACTION ([\s\S]*?)\u0001?$/.exec(txt);if(m)txt=m[1];
    out.text=txt;
  }
  return out;
}

/* PRIVMSG → chat message for the games. Name comes from the display-name tag. */
function toChat(p){
  if(!p||p.command!=='PRIVMSG')return null;
  var login=(p.tags.login||p.nick||'').toLowerCase();
  var name=(p.tags['display-name']||'').trim()||p.nick||login;
  var badges=p.tags.badges||'';
  var isBroadcaster=/(^|,)broadcaster\//.test(badges);
  var isMod=p.tags.mod==='1'||/(^|,)moderator\//.test(badges)||isBroadcaster;
  return {id:p.tags.id||'',user:login||name.toLowerCase(),name:name,color:p.tags.color||'',text:String(p.text||'').slice(0,500),mod:isMod,broadcaster:isBroadcaster,channel:p.channel};
}

/* Normalize for comparisons: Arabic diacritics/tatweel stripped, alef/hamza, ى/ي, ة/ه folded,
   Arabic-Indic digits → 0-9, Latin lowercased, invisible bidi marks removed, spaces collapsed. */
function normalize(s){
  return String(s||'')
    .normalize('NFC')
    .replace(/[\u200B-\u200F\u202A-\u202E\u2066-\u2069\uFEFF]/g,'')
    .replace(/[\u064B-\u065F\u0670\u0640]/g,'')
    .replace(/[\u0622\u0623\u0625\u0671]/g,'\u0627')
    .replace(/\u0624/g,'\u0648')
    .replace(/\u0626/g,'\u064A')
    .replace(/\u0649/g,'\u064A')
    .replace(/\u0629/g,'\u0647')
    .replace(/[\u0660-\u0669]/g,function(d){return String(d.charCodeAt(0)-0x0660)})
    .replace(/[\u06F0-\u06F9]/g,function(d){return String(d.charCodeAt(0)-0x06F0)})
    .toLowerCase()
    .replace(/\s+/g,' ')
    .trim();
}
/* letters/digits only, as tokens */
function tokens(s){
  return normalize(s).replace(/[^\p{L}\p{N}\s]/gu,' ').split(' ').filter(Boolean);
}
function stripAl(t){ return (t.length>3&&t.indexOf('\u0627\u0644')===0)?t.slice(2):t; }
function key(t){ t=stripAl(t); if(/^[a-z0-9]+$/.test(t)&&t.length>3&&/s$/.test(t))t=t.slice(0,-1); return t; }

/* Does a chat message guess one of the answers?  answers: "قطة|بسة" or ["cat","kitty"].
   Tolerant: hamza/alef, ى/ي, ة/ه, diacritics, spaces, "ال" prefix, English plural s,
   and the answer may sit inside a longer message ("يمكن قطة؟"). */
function matches(guess,answers){
  var list=Array.isArray(answers)?answers:String(answers||'').split('|');
  var g=tokens(guess).map(key);
  if(!g.length)return false;
  var gj=g.join('');
  for(var i=0;i<list.length;i++){
    var a=tokens(list[i]).map(key);if(!a.length)continue;
    var aj=a.join('');
    if(gj===aj)return true;
    for(var s=0;s+a.length<=g.length;s++){
      var ok=true;for(var k=0;k<a.length;k++){if(g[s+k]!==a[k]){ok=false;break;}}
      if(ok)return true;
      if(g.slice(s,s+a.length+1).join('')===aj)return true;
    }
  }
  return false;
}

/* Letter-count hint for an answer: "قطة" → "_ _ _", "ice cream" → "_ _ _   _ _ _ _ _" (word lengths only). */
function letterHint(answer){
  var first=String(answer||'').split('|')[0];
  return normalize(first).split(' ').map(function(w){return Array.from(w.replace(/[^\p{L}\p{N}]/gu,'')).map(function(){return '_'}).join(' ')}).join('   ');
}
function letterCount(answer){ var first=String(answer||'').split('|')[0]; return Array.from(normalize(first).replace(/[^\p{L}\p{N}]/gu,'')).length; }

/* "!cmd args" → {cmd,args,rest} or null. Full-width ！ accepted. */
function parseCmd(text){
  var n=String(text||'').trim().replace(/^\uFF01/,'!');
  if(n.charAt(0)!=='!')return null;
  var body=n.slice(1).trim();if(!body)return null;
  var sp=body.search(/\s/);var cmd=(sp<0?body:body.slice(0,sp));var rest=sp<0?'':body.slice(sp+1).trim();
  return {cmd:normalize(cmd),args:rest?rest.split(/\s+/):[],rest:rest};
}

/* A number guess: the message must be just a whole number in [min,max] (Arabic digits ok). */
function parseGuess(text,min,max){
  var n=normalize(text);
  if(!/^\d{1,3}$/.test(n))return null;
  var v=parseInt(n,10);
  if(v<(min||1)||v>(max||100))return null;
  return v;
}
/* "!1".."!N" (also "! 2", "!٢") → 0-based index, else -1. */
function parseVote(text,count){
  var n=normalize(text).replace(/^\uFF01/,'!');
  var m=/^!\s?(\d{1,2})(?!\d)/.exec(n);
  if(!m)return -1;
  var v=parseInt(m[1],10);
  return (v>=1&&v<=count)?v-1:-1;
}
function hint(guess,secret){return guess===secret?'win':(secret>guess?'higher':'lower');}

/* Leaderboard: board is {login:{name,pts}} */
function addPoint(board,user,name,pts){
  board=board||{};var b=board[user]||{name:name,pts:0};b.name=name||b.name;b.pts+=(pts==null?1:pts);board[user]=b;return board;
}
function topN(board,n){
  return Object.keys(board||{}).map(function(k){return {user:k,name:board[k].name,pts:board[k].pts}})
    .sort(function(a,b){return b.pts-a.pts||String(a.name).localeCompare(String(b.name))}).slice(0,n||10);
}
function safeChannel(c){c=String(c||'').trim().toLowerCase().replace(/^@/,'').replace(/^#/,'').replace(/^https?:\/\/(www\.)?twitch\.tv\//,'').split(/[/?#]/)[0];return /^[a-z0-9_]{2,25}$/.test(c)?c:'';}
function mcName(s){s=String(s||'').trim();return /^[A-Za-z0-9_]{3,16}$/.test(s)?s:'';}

/* Seeded RNG + helpers */
function rng(seed){var a=(seed>>>0)||1;return function(){a=(a+0x6D2B79F5)|0;var t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296;};}
function shuffle(arr,r){r=r||Math.random;var a=arr.slice();for(var i=a.length-1;i>0;i--){var j=Math.floor(r()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}return a;}

/* Word chain: last meaningful letter of a word (ة→ه/ت both ok handled by chainOk). */
function lastLetter(w){var t=tokens(w);if(!t.length)return '';var s=Array.from(t[t.length-1]).filter(function(c){return c!=='\u0621'});return s.length?s[s.length-1]:'';}
function firstLetter(w){var t=tokens(w);if(!t.length)return '';var s=Array.from(stripAl(t[0]));return s.length?s[0]:'';}
function chainOk(prev,next){
  if(!prev)return true;
  var l=lastLetter(prev),f=firstLetter(next);if(!l||!f)return false;
  if(l===f)return true;
  if(l==='\u0647'&&(f==='\u062A'||f==='\u0647'))return true; /* ة written as ه after folding */
  return false;
}

var api={unescapeTag:unescapeTag,parseLine:parseLine,toChat:toChat,normalize:normalize,tokens:tokens,matches:matches,letterHint:letterHint,letterCount:letterCount,
  parseCmd:parseCmd,parseGuess:parseGuess,parseVote:parseVote,hint:hint,addPoint:addPoint,topN:topN,safeChannel:safeChannel,mcName:mcName,
  rng:rng,shuffle:shuffle,lastLetter:lastLetter,firstLetter:firstLetter,chainOk:chainOk};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.ChatCore=api;
})(typeof window!=='undefined'?window:globalThis);
