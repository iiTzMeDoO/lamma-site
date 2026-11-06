/* btrpg.js — «المعركة» character depth (Kukoro dungeon-raid depth, Minecraft names). Pure data + maths: works in Node (module.exports)
   and the browser (window.BTR). Read by btcore.js (the raid engine) and the pages (the !معلومات / !getinfo cards).
   - 6 damage types: ضرب melee, سهام arrow, نار fire, انفجار blast, سم poison, سحر magic.
   - 6 enemy families: موتى undead, حشرات arthropod, النذر nether, الإندر ender, الأشرار illager, مخلوقات creature.
   - 27 mobs + 9 bosses, each with its family, attack type, stats, weaknesses / resistances, a trait and (bosses) a 2nd phase.
   - 8 classes (محارب، رامي، ساحر، دبابة، نينجا، كيميائي، مفجّر، ساحر النار) with HP / ATK / DEF / SPD / dodge / crit.
   - Kukoro perks: two per viewer (a third at LV18, upgraded to "II" at LV15), each one bound to an enemy family.
   - Gear: armour tier + protection enchant (resistances), weapon tier + enchant (Smite, Bane…), items (potions, totem, golden apple).
   - Room events (night, rain, fog, spring, treasure, hot floor, blood moon).
   - hit(): one blow with every multiplier, the effectiveness word ("فعّال جداً!" / "مقاوم" / "مناعة!") and crit / dodge. */
(function(root){
'use strict';
var TYPES=['melee','arrow','fire','blast','poison','magic'];
var TYPE={melee:{ar:'ضرب',en:'Melee',ic:'⚔️'},arrow:{ar:'سهام',en:'Arrows',ic:'🏹'},fire:{ar:'نار',en:'Fire',ic:'🔥'},blast:{ar:'انفجار',en:'Blast',ic:'💥'},poison:{ar:'سم',en:'Poison',ic:'🧪'},magic:{ar:'سحر',en:'Magic',ic:'✨'}};
var FAMS=['undead','arthropod','nether','ender','illager','creature'];
var FAM={undead:{ar:'الموتى',en:'Undead',ic:'💀'},arthropod:{ar:'الحشرات',en:'Arthropods',ic:'🕷️'},nether:{ar:'النذر',en:'Nether',ic:'🔥'},ender:{ar:'الإندر',en:'Ender',ic:'🟣'},illager:{ar:'الأشرار',en:'Illagers',ic:'🪓'},creature:{ar:'المخلوقات',en:'Creatures',ic:'🟢'}};
/* res: damage TAKEN multiplier per type (0 immune · .5 resists · 1.5 weak). trait: what it does in a duel (see TRAIT). */
var MOBS={
 zombie:{fam:'undead',atk:'melee',hp:40,dmg:6,def:.05,agi:.05,crit:.06,res:{poison:0,fire:1.5,magic:1.25},trait:'',ar:'زومبي',en:'Zombie'},
 husk:{fam:'undead',atk:'melee',hp:46,dmg:7,def:.06,agi:.05,crit:.06,res:{poison:0,fire:1.25},trait:'hunger',ar:'زومبي الصحراء',en:'Husk'},
 drowned:{fam:'undead',atk:'arrow',hp:42,dmg:7,def:.05,agi:.07,crit:.08,res:{poison:0,fire:.5,magic:1.3},trait:'',ar:'الغريق',en:'Drowned'},
 skeleton:{fam:'undead',atk:'arrow',hp:32,dmg:7,def:.03,agi:.08,crit:.1,res:{arrow:.5,poison:0,blast:1.5,melee:1.2},trait:'',ar:'هيكل',en:'Skeleton'},
 stray:{fam:'undead',atk:'arrow',hp:34,dmg:6,def:.04,agi:.08,crit:.1,res:{arrow:.5,poison:0,fire:1.6},trait:'slow',ar:'الهيكل التائه',en:'Stray'},
 wskel:{fam:'undead',atk:'melee',hp:56,dmg:9,def:.1,agi:.07,crit:.1,res:{fire:0,poison:0,blast:1.4},trait:'wither',ar:'هيكل الذابل',en:'Wither skeleton'},
 zpiglin:{fam:'undead',atk:'melee',hp:50,dmg:8,def:.08,agi:.06,crit:.08,res:{fire:0,poison:0},trait:'anger',ar:'خنزير الزومبي',en:'Zombified piglin'},
 phantom:{fam:'undead',atk:'melee',hp:30,dmg:7,def:.02,agi:.18,crit:.1,res:{melee:.8,arrow:1.6,poison:0},trait:'swoop',ar:'الشبح',en:'Phantom'},
 spider:{fam:'arthropod',atk:'melee',hp:32,dmg:5,def:.03,agi:.14,crit:.08,res:{poison:.5,fire:1.3},trait:'web',ar:'عنكبوت',en:'Spider'},
 cavespider:{fam:'arthropod',atk:'poison',hp:26,dmg:5,def:.02,agi:.16,crit:.08,res:{poison:0,fire:1.3},trait:'poison',ar:'عنكبوت الكهف',en:'Cave spider'},
 silverfish:{fam:'arthropod',atk:'melee',hp:18,dmg:4,def:.02,agi:.2,crit:.05,res:{melee:.8,blast:2},trait:'swarm',ar:'سمكة الفضة',en:'Silverfish'},
 endermite:{fam:'arthropod',atk:'magic',hp:20,dmg:4,def:.02,agi:.15,crit:.05,res:{magic:.5},trait:'blink',ar:'إندرمايت',en:'Endermite'},
 blaze:{fam:'nether',atk:'fire',hp:38,dmg:7,def:.04,agi:.1,crit:.08,res:{fire:0,arrow:1.2,magic:1.5},trait:'burn',ar:'بليز',en:'Blaze'},
 piglin:{fam:'nether',atk:'melee',hp:50,dmg:8,def:.08,agi:.06,crit:.08,res:{fire:.7,magic:1.2},trait:'gold',ar:'بيغلين',en:'Piglin'},
 brute:{fam:'nether',atk:'melee',hp:80,dmg:12,def:.2,agi:.04,crit:.1,res:{fire:.7,arrow:.8,magic:1.3},trait:'',ar:'بيغلين المتوحش',en:'Piglin brute'},
 magma:{fam:'nether',atk:'fire',hp:44,dmg:7,def:.1,agi:.06,crit:.06,res:{fire:0,melee:.8,arrow:1.3,magic:1.2},trait:'split',ar:'مكعب الماغما',en:'Magma cube'},
 ghast:{fam:'nether',atk:'blast',hp:36,dmg:10,def:.02,agi:.06,crit:.08,res:{fire:0,melee:.6,arrow:2},trait:'',ar:'الغاست',en:'Ghast'},
 hoglin:{fam:'nether',atk:'melee',hp:60,dmg:10,def:.08,agi:.05,crit:.08,res:{fire:.8,poison:1.3},trait:'knock',ar:'هوغلين',en:'Hoglin'},
 enderman:{fam:'ender',atk:'melee',hp:60,dmg:9,def:.06,agi:.15,crit:.1,res:{arrow:0,poison:.7,magic:.8},trait:'teleport',ar:'إندرمان',en:'Enderman'},
 shulker:{fam:'ender',atk:'magic',hp:40,dmg:6,def:.3,agi:.04,crit:.06,res:{arrow:.5,blast:.6,melee:.8,magic:1.4},trait:'levitate',ar:'شولكر',en:'Shulker'},
 pillager:{fam:'illager',atk:'arrow',hp:36,dmg:7,def:.05,agi:.08,crit:.1,res:{arrow:.8,magic:1.2,melee:1.2},trait:'',ar:'الناهب',en:'Pillager'},
 vindicator:{fam:'illager',atk:'melee',hp:48,dmg:11,def:.06,agi:.06,crit:.2,res:{melee:.8,arrow:1.2},trait:'',ar:'المنتقم',en:'Vindicator'},
 evoker:{fam:'illager',atk:'magic',hp:40,dmg:9,def:.04,agi:.07,crit:.08,res:{magic:.6,melee:1.3,arrow:1.3},trait:'fangs',ar:'المستحضر',en:'Evoker'},
 witch:{fam:'illager',atk:'poison',hp:38,dmg:6,def:.04,agi:.06,crit:.06,res:{poison:0,magic:.6,fire:1.2},trait:'potion',ar:'الساحرة',en:'Witch'},
 vex:{fam:'illager',atk:'magic',hp:20,dmg:6,def:.02,agi:.25,crit:.1,res:{melee:.8,magic:1.5},trait:'',ar:'الفيكس',en:'Vex'},
 ravager:{fam:'illager',atk:'melee',hp:72,dmg:11,def:.12,agi:.03,crit:.08,res:{melee:.7,blast:.8,magic:1.3,poison:1.2},trait:'roar',ar:'المدمّر',en:'Ravager'},
 creeper:{fam:'creature',atk:'blast',hp:30,dmg:12,def:.03,agi:.04,crit:0,res:{blast:.5,arrow:1.3,fire:1.2},trait:'explode',ar:'كريبر',en:'Creeper'},
 slime:{fam:'creature',atk:'melee',hp:40,dmg:5,def:.04,agi:.05,crit:.04,res:{melee:.7,arrow:.7,fire:1.3,magic:1.3,poison:0},trait:'split',ar:'سلايم',en:'Slime'},
 guardian:{fam:'creature',atk:'magic',hp:50,dmg:8,def:.1,agi:.06,crit:.06,res:{arrow:.8,fire:.7,blast:1.4},trait:'thorns',ar:'الحارس البحري',en:'Guardian'}
};
/* bosses: hp is the base before the party size / level / difficulty scaling (btcore); p2 = what happens at half HP */
var BOSSES={
 wither:{fam:'undead',atk:'magic',atk2:'blast',hp:710,dmg:16,def:.12,agi:.06,crit:.1,scale:1.9,res:{fire:0,poison:0,blast:.5,magic:.8},trait:'wither',p2:'armour',ar:'الذابل',en:'The Wither'},
 dragon:{fam:'ender',atk:'fire',atk2:'melee',hp:930,dmg:17,def:.1,agi:.05,crit:.1,scale:1.8,res:{fire:.3,poison:0,arrow:1.4,blast:1.2},trait:'burn',p2:'crystal',ar:'تنين النهاية',en:'Ender Dragon'},
 golem:{fam:'creature',atk:'melee',hp:970,dmg:19,def:.25,agi:.03,crit:.06,scale:1.9,res:{arrow:.3,poison:0,melee:.8,blast:1.4,magic:1.3},trait:'knock',p2:'rage',ar:'الحارس الحديدي',en:'Iron Guardian'},
 king:{fam:'undead',atk:'melee',hp:1330,dmg:15,def:.1,agi:.06,crit:.12,scale:1.8,res:{poison:0,fire:1.4,magic:1.2},trait:'lifesteal',p2:'summon',ar:'ملك الزومبي',en:'Zombie King'},
 warden:{fam:'creature',atk:'melee',atk2:'magic',hp:920,dmg:21,def:.15,agi:.02,crit:.08,scale:2,res:{arrow:.5,blast:.5,poison:0,melee:.8,fire:1.5},trait:'sonic',p2:'rage',ar:'حارس الأعماق',en:'Deep Warden'},
 ravagerk:{fam:'illager',atk:'melee',hp:1310,dmg:18,def:.14,agi:.03,crit:.1,scale:1.6,res:{melee:.7,arrow:1.2,magic:1.3},trait:'roar',p2:'charge',ar:'ملك المدمّرين',en:'Ravager King'},
 evokerm:{fam:'illager',atk:'magic',hp:1520,dmg:15,def:.08,agi:.08,crit:.1,scale:1.8,res:{magic:.4,melee:1.3,arrow:1.4},trait:'fangs',p2:'totem',ar:'سيد الاستحضار',en:'Evoker Lord'},
 blazek:{fam:'nether',atk:'fire',hp:1180,dmg:16,def:.1,agi:.08,crit:.1,scale:1.9,res:{fire:0,arrow:1.2,magic:1.6},trait:'burn',p2:'storm',ar:'ملك البليز',en:'Blaze King'},
 elder:{fam:'creature',atk:'magic',hp:1520,dmg:15,def:.15,agi:.05,crit:.08,scale:1.9,res:{arrow:.6,fire:.6,blast:1.4,poison:1.2},trait:'thorns',p2:'fatigue',ar:'الحارس العتيق',en:'Elder Guardian'}
};
var TRAIT={
 '':{ar:'',en:''},
 hunger:{ar:'ضربته تجوّعك: ينخفض هجومك 10%',en:'Its hits starve you: your attack −10%'},
 slow:{ar:'سهمه يبطّئك: تفاديك ينقص إلى النصف',en:'Its arrows slow you: your dodge is halved'},
 wither:{ar:'ذبول: يخسرك صحة 3 أدوار',en:'Wither: you lose HP for 3 turns'},
 anger:{ar:'كلما ضربته يغضب: +10% ضرر',en:'Every hit makes it angrier: +10% damage'},
 swoop:{ar:'ينقض من فوق: يضرب أولًا دائمًا',en:'Swoops down: always strikes first'},
 web:{ar:'شبكة: تفاديك ينخفض 50%',en:'Web: your dodge −50%'},
 poison:{ar:'سم: يفقدك الصحة 3 أدوار',en:'Poison: you lose HP for 3 turns'},
 swarm:{ar:'سرب: يضرب مرتين',en:'Swarm: hits twice'},
 blink:{ar:'يختفي: تفادٍ عالٍ',en:'Blinks: high dodge'},
 burn:{ar:'يحرقك: نار 3 أدوار',en:'Sets you on fire for 3 turns'},
 gold:{ar:'معه ذهب: غنيمة أكثر',en:'Carries gold: more loot'},
 split:{ar:'ينقسم: يعود مرة بنصف صحته',en:'Splits: comes back once at half HP'},
 knock:{ar:'ضربة قوية: قد تُدوّخك دورًا',en:'Heavy blow: may stun you for a turn'},
 teleport:{ar:'ينتقل: السهام لا تلمسه',en:'Teleports: arrows never touch it'},
 levitate:{ar:'يقذفك: لا يمكنك تفادي ضربته التالية',en:'Levitates you: you cannot dodge its next hit'},
 fangs:{ar:'أنياب سحرية: تخترق الدرع',en:'Magic fangs: ignore armour'},
 potion:{ar:'تشرب جرعة شفاء مرة واحدة',en:'Drinks a healing potion once'},
 roar:{ar:'زئير: كل 3 أدوار يصيبك بالدوار',en:'Roar: stuns you every 3rd turn'},
 explode:{ar:'ينفجر في الدور الثالث: ضرر ×2.5',en:'Explodes on its 3rd turn: ×2.5 damage'},
 thorns:{ar:'أشواك: يعيد إليك 20% من ضربات سيفك',en:'Thorns: reflects 20% of melee damage'},
 lifesteal:{ar:'امتصاص الصحة: يستعيد 30% من ضرباته',en:'Lifesteal: heals 30% of its hits'},
 sonic:{ar:'صرخة صوتية كل 3 أدوار: لا يمكن صدّها ولا تفاديها',en:'Sonic boom every 3rd turn: cannot be dodged or blocked'}
};
var PHASE2={
 armour:{ar:'درع الذابل: السهام لا تؤثر + يضرب مرتين',en:'Wither armour: immune to arrows + hits twice'},
 crystal:{ar:'بلورة النهاية: يستعيد 15% + ضرر أكبر',en:'End crystal: heals 15% + hits harder'},
 rage:{ar:'غضب: ضرر +40%',en:'Rage: +40% damage'},
 summon:{ar:'يستدعي زومبي: ضربة إضافية كل دور',en:'Summons zombies: an extra hit every turn'},
 charge:{ar:'هجمة: ضرر ×2 كل 3 أدوار',en:'Charge: ×2 damage every 3rd turn'},
 totem:{ar:'طوطم الخلود: ينهض مرة من الموت',en:'Totem of undying: rises once from death'},
 storm:{ar:'عاصفة نار: يضرب مرتين',en:'Fire storm: hits twice'},
 fatigue:{ar:'إرهاق: ينخفض هجومك 25%',en:'Mining fatigue: your attack −25%'}
};
var CLASSES={
 warrior:{ar:'محارب',en:'Warrior',ic:'⚔️',atk:'melee',hp:110,a:11,def:.12,spd:6,agi:.07,crit:.12,w:'sword'},
 archer:{ar:'رامي السهام',en:'Archer',ic:'🏹',atk:'arrow',hp:90,a:11,def:.06,spd:7,agi:.1,crit:.2,w:'bow'},
 mage:{ar:'ساحر',en:'Mage',ic:'✨',atk:'magic',hp:80,a:13,def:.04,spd:5,agi:.08,crit:.14,w:'staff'},
 tank:{ar:'دبابة',en:'Tank',ic:'🛡️',atk:'melee',hp:140,a:8,def:.25,spd:3,agi:.04,crit:.08,w:'axe'},
 rogue:{ar:'نينجا',en:'Rogue',ic:'🗡️',atk:'melee',hp:85,a:10,def:.06,spd:9,agi:.18,crit:.25,w:'dagger'},
 alchemist:{ar:'كيميائي',en:'Alchemist',ic:'🧪',atk:'poison',hp:90,a:10,def:.08,spd:5,agi:.09,crit:.12,w:'flask'},
 bomber:{ar:'مفجّر',en:'Bomber',ic:'💣',atk:'blast',hp:95,a:12,def:.1,spd:4,agi:.05,crit:.12,w:'tnt'},
 pyro:{ar:'ساحر النار',en:'Pyromancer',ic:'🔥',atk:'fire',hp:85,a:12,def:.06,spd:6,agi:.08,crit:.14,w:'wand'}
};
var CLASSK=Object.keys(CLASSES);
var CLASS_WORDS={warrior:['محارب','warrior','fighter'],archer:['رامي','archer','قناص'],mage:['ساحر','mage','wizard'],tank:['دبابه','tank','دبابة'],rogue:['نينجا','rogue','ninja'],alchemist:['كيميائي','alchemist'],bomber:['مفجر','bomber','مفجّر'],pyro:['ساحر النار','نار','pyro','pyromancer']};
/* Kukoro perks: each bound to ONE family. t = template; v1 / v2 = value at tier I / II (LV15+) */
var PERKS={
 slayer:{ic:'⚔️',v1:1.5,v2:1.8,ar:'ضرر {v} على {f}',en:'{v} damage to {f}'},
 ward:{ic:'🛡️',v1:.7,v2:.55,ar:'ضرر {f} عليك {v}',en:'{f} damage on you {v}'},
 oddcrit:{ic:'🎯',v1:1,v2:1,ar:'ضربة حرجة مؤكدة على {f} عندما تكون صحتك فردية',en:'100% crit on {f} when your HP is odd'},
 laststand:{ic:'❤️',v1:1,v2:2,ar:'تنجو من ضربة قاتلة من {f} ({n})',en:'Survive a deadly hit from {f} ({n})'},
 avenger:{ic:'😡',v1:3,v2:4,ar:'ضرر {v} على {f} الذي قتل أحدًا من فريقك',en:'{v} damage to {f} that killed a teammate'},
 first:{ic:'⚡',v1:1,v2:1,ar:'يضرب دائمًا أولًا على {f}',en:'Always strike first against {f}'},
 hunter:{ic:'💨',v1:.2,v2:.3,ar:'تفادي {p}+ أمام {f}',en:'+{p} dodge against {f}'},
 feast:{ic:'🍖',v1:.25,v2:.4,ar:'تعيد {p} صحة عندما تقتل {f}',en:'Heal {p} when you defeat {f}'},
 harden:{ic:'🪨',v1:.1,v2:.15,ar:'كل {f} تقتله: دفاع {p}+ في هذه الغزوة',en:'Each {f} you defeat: +{p} defence this raid'},
 counter:{ic:'🔁',v1:2,v2:2.5,ar:'عندما تتفادى {f}، تكون ضربتك التالية {v}',en:'Dodge {f} → your next hit {v}'}
};
var PERKK=Object.keys(PERKS);
var ARMOUR=[
 {k:'leather',ar:'جلد',en:'Leather',def:.03,col:'#8a5a32',res:{}},
 {k:'chain',ar:'زرد',en:'Chainmail',def:.06,col:'#9aa0a8',res:{arrow:.9}},
 {k:'iron',ar:'حديد',en:'Iron',def:.1,col:'#d8d8d8',res:{}},
 {k:'gold',ar:'دهب',en:'Gold',def:.08,col:'#f2c230',res:{magic:.8}},
 {k:'diamond',ar:'ألماس',en:'Diamond',def:.15,col:'#4fe0d8',res:{}},
 {k:'netherite',ar:'نذرايت',en:'Netherite',def:.2,col:'#4a3f48',res:{fire:.8}}
];
var ARM_ENCH={
 '':{ar:'',en:'',res:{}},
 fireprot:{ar:'حماية من النار',en:'Fire Protection',res:{fire:.5}},
 blastprot:{ar:'حماية من الانفجار',en:'Blast Protection',res:{blast:.5}},
 projprot:{ar:'حماية من السهام',en:'Projectile Protection',res:{arrow:.5}},
 antidote:{ar:'مقاومة السم',en:'Antidote',res:{poison:.3}},
 magicprot:{ar:'حماية سحرية',en:'Magic Ward',res:{magic:.6}},
 thorns:{ar:'أشواك',en:'Thorns',res:{}}
};
var WEAPON=[
 {k:'wood',ar:'خشب',en:'Wooden',a:0},{k:'stone',ar:'حجر',en:'Stone',a:2},{k:'iron',ar:'حديد',en:'Iron',a:4},
 {k:'gold',ar:'دهب',en:'Golden',a:5},{k:'diamond',ar:'ألماس',en:'Diamond',a:7},{k:'netherite',ar:'نذرايت',en:'Netherite',a:9}
];
var WPN_NAME={sword:{ar:'سيف',en:'sword'},bow:{ar:'قوس',en:'bow'},staff:{ar:'عصا',en:'staff'},axe:{ar:'فاس',en:'axe'},dagger:{ar:'خنجر',en:'dagger'},flask:{ar:'قوارير',en:'flasks'},tnt:{ar:'TNT',en:'TNT'},wand:{ar:'صولجان',en:'wand'}};
var WPN_ENCH={
 '':{ar:'',en:''},
 smite:{ar:'قاهر الموتى',en:'Smite',fam:'undead',m:1.5},
 bane:{ar:'لعنة الحشرات',en:'Bane of Arthropods',fam:'arthropod',m:1.5},
 sharp:{ar:'حدّة',en:'Sharpness',m:1.15},
 fireasp:{ar:'شعلة',en:'Fire Aspect',burn:1},
 knock:{ar:'دفع',en:'Knockback',stun:.15},
 looting:{ar:'غنيمة',en:'Looting',loot:1},
 ender:{ar:'صياد الإندر',en:'Ender Bane',fam:'ender',m:1.5},
 raid:{ar:'كاسر الغزاة',en:'Raid Breaker',fam:'illager',m:1.5}
};
var ITEMS={
 heal:{ar:'جرعة شفاء',en:'Healing potion',ic:'❤️',d:{ar:'عندما تنخفض صحتك إلى ما دون 35%: +40%',en:'Below 35% HP: +40%'}},
 strength:{ar:'جرعة قوة',en:'Strength potion',ic:'💪',d:{ar:'ضدّ الزعيم: ضرر ×1.3',en:'Against a boss: ×1.3 damage'}},
 totem:{ar:'طوطم الخلود',en:'Totem of undying',ic:'🗿',d:{ar:'تنهض مرة من الموت بـ30%',en:'Rise once from death at 30%'}},
 apple:{ar:'تفاحة ذهبية',en:'Golden apple',ic:'🍎',d:{ar:'+20% صحة كاملة',en:'+20% max HP'}},
 fireres:{ar:'جرعة ضد النار',en:'Fire resistance',ic:'🧯',d:{ar:'مناعة من النار',en:'Immune to fire'}}
};
var EVENTS={
 night:{ar:'ليل',en:'Night',ic:'🌙',d:{ar:'الموتى +25% ضرر',en:'Undead +25% damage'}},
 rain:{ar:'مطر',en:'Rain',ic:'🌧️',d:{ar:'النار نصف قوتها',en:'Fire at half power'}},
 fog:{ar:'ضباب',en:'Fog',ic:'🌫️',d:{ar:'الكل +10% تفادي',en:'Everyone +10% dodge'}},
 spring:{ar:'نبع شفاء',en:'Healing spring',ic:'💧',d:{ar:'يستعيد الفريق 25%',en:'The party heals 25%'}},
 treasure:{ar:'كنز',en:'Treasure',ic:'💎',d:{ar:'غنيمة مضاعفة',en:'Double loot'}},
 hot:{ar:'أرض حامية',en:'Hot floor',ic:'♨️',d:{ar:'5 نيران لكل مقاتل يظهر',en:'5 fire damage to each fighter who walks out'}},
 blood:{ar:'قمر الدم',en:'Blood moon',ic:'🔴',d:{ar:'الوحوش +20% ضرر، +50% خبرة',en:'Enemies +20% damage, +50% XP'}}
};
var EVENTK=Object.keys(EVENTS);
var MAPMOBS={
 plains:['zombie','skeleton','creeper','spider','slime','pillager','vindicator','witch','phantom'],
 desert:['husk','skeleton','creeper','spider','silverfish','pillager','ravager','vex','witch'],
 nether:['blaze','piglin','brute','zpiglin','wskel','magma','ghast','hoglin'],
 end:['enderman','endermite','shulker','phantom','vex','enderman'],
 cave:['zombie','drowned','skeleton','stray','cavespider','silverfish','creeper','slime','witch','guardian']
};
var MAPBOSS={plains:['golem','ravagerk','evokerm'],desert:['king','evokerm','ravagerk'],nether:['wither','blazek'],end:['dragon'],cave:['warden','king','elder']};
function strHash(s){s=String(s||'');var h=2166136261;for(var i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function fmt(s,o){return String(s).replace(/\{(\w+)\}/g,function(_,k){return o[k]!=null?o[k]:''});}
function pct(v){return Math.round(v*100)+'%';}
function classOf(user,pick){if(pick&&CLASSES[pick])return pick;return CLASSK[strHash('c'+user)%CLASSK.length];}
function classFromWord(w){w=String(w||'').toLowerCase().trim();for(var k in CLASS_WORDS){if(CLASS_WORDS[k].some(function(x){return w===x.toLowerCase()}))return k;}return '';}
/* two perks from the name (different templates and families), a third at LV18 */
function perksOf(user,lv){var h=strHash('k'+user),out=[],used={},fams={};var n=lv>=18?3:2;
  for(var i=0;out.length<n&&i<40;i++){var t=PERKK[(h>>>(i%5*3))%PERKK.length+0],f=FAMS[(strHash(user+':'+i))%FAMS.length];t=PERKK[(strHash('t'+user+i))%PERKK.length];if(used[t]||fams[f])continue;used[t]=1;fams[f]=1;out.push({t:t,f:f,tier:lv>=15?2:1});}
  return out;}
function perkVal(p){var P=PERKS[p.t];return p.tier===2?P.v2:P.v1;}
function perkText(p,en){var P=PERKS[p.t],v=perkVal(p),F=FAM[p.f];var I=en?function(x){return x}:function(x){return '\u2066'+x+'\u2069'};return fmt(en?P.en:P.ar,{v:I((p.t==='slayer'||p.t==='ward'||p.t==='avenger'||p.t==='counter')?'×'+v:v),p:I(pct(v)),f:en?F.en:F.ar,n:en?(v===2?'twice':'once'):(v===2?'مرتين':'مرة')});}
/* default gear from the level (drops improve it: btcore keeps gear per viewer) */
function baseGear(user,lv){var h=strHash('g'+user);var at=lv>=20?5:lv>=17?4:lv>=14?2:lv>=12?1:0;var wt=lv>=19?5:lv>=16?4:lv>=13?2:lv>=11?1:0;
  return {a:at,ae:'',w:wt,we:'',items:lv>=12?['heal']:[]};}
function mergeGear(base,g){if(!g)return base;return {a:Math.max(base.a,g.a||0),ae:g.ae||base.ae,w:Math.max(base.w,g.w||0),we:g.we||base.we,items:(g.items||base.items).slice(0,3)};}
/* the full fighter sheet: everything the duel maths and the info card need */
function sheet(user,lv,o){o=o||{};var ck=classOf(user,o.cls),C=CLASSES[ck];var g=mergeGear(baseGear(user,lv),o.gear);var A=ARMOUR[g.a],AE=ARM_ENCH[g.ae]||ARM_ENCH[''],W=WEAPON[g.w];
  var res={};TYPES.forEach(function(t){var v=1;if(A.res[t]!=null)v*=A.res[t];if(AE.res[t]!=null)v*=AE.res[t];res[t]=Math.round(v*100)/100;});
  if(g.items.indexOf('fireres')>=0)res.fire=0;
  var L=lv-10,hp=Math.round(C.hp*1.57*(1+L*.05)*(g.items.indexOf('apple')>=0?1.2:1));
  return {cls:ck,atkT:C.atk,hp:hp,atk:Math.round((C.a*1.6+1.5*L+W.a*1.2)*15.7)/10,def:Math.min(.6,Math.round((C.def+A.def)*100)/100),spd:C.spd,agi:Math.min(.45,Math.round((C.agi+L*.004)*1000)/1000),crit:Math.min(.5,Math.round((C.crit+L*.005)*1000)/1000),
    res:res,perks:perksOf(user,lv),gear:g,thorns:g.ae==='thorns'?.15:0};}
function mobSheet(kind,boss){var S=boss?BOSSES[kind]:MOBS[kind];return S||null;}
function resOf(x,t){var r=x&&x.res;return r&&r[t]!=null?r[t]:1;}
/* how effective a type is on a target: the word the field floats */
function effWord(mult){return mult===0?'immune':mult>=1.4?'super':mult<=.7?'resist':'';}
/* one blow. att / def: {atk|dmg, atkT, crit, agi, def, res, fam, perks, gear, buff…}; ctx: {r: rng, type, mult, noDodge, ignoreDef, event, avenged, isBoss}
   returns {n, crit, dodge, eff, mult} — n is already the HP taken */
function hit(att,def,ctx){ctx=ctx||{};var r=ctx.r||Math.random,type=ctx.type||att.atkT||'melee',m=ctx.mult||1,ev=ctx.event||'';
  var tm=resOf(def,type);if(def.phase2==='armour'&&type==='arrow')tm=0;if(def.trait==='teleport'&&type==='arrow')tm=0;
  if(ev==='rain'&&type==='fire')m*=.5;if(ev==='night'&&att.fam==='undead')m*=1.25;if(ev==='blood'&&att.fam&&!att.u)m*=1.2;
  var pm=1,crit=false,first=false;
  (att.perks||[]).forEach(function(p){if(p.f!==def.fam)return;var v=perkVal(p);if(p.t==='slayer')pm*=v;if(p.t==='avenger'&&ctx.avenged)pm*=v;if(p.t==='oddcrit'&&att.hpNow%2===1)crit=true;});
  (def.perks||[]).forEach(function(p){if(p.f!==att.fam)return;if(p.t==='ward')pm*=perkVal(p);});
  var we=att.gear&&WPN_ENCH[att.gear.we];if(we&&we.fam&&we.fam===def.fam)pm*=we.m;if(we&&att.gear.we==='sharp')pm*=we.m;
  if(att.buffNext){pm*=att.buffNext;}
  var dodgeP=(def.agi||0)+(ev==='fog'?.1:0);(def.perks||[]).forEach(function(p){if(p.f===att.fam&&p.t==='hunter')dodgeP+=perkVal(p);});if(def.slowed)dodgeP*=.5;if(def.noDodge)dodgeP=0;
  if(type==='fire'||ctx.noDodge)dodgeP=Math.min(dodgeP,ctx.noDodge?0:dodgeP);
  if(r()<dodgeP)return {n:0,dodge:true,eff:'',mult:tm*pm};
  if(!crit)crit=r()<(att.crit||0);var base=att.atk!=null?att.atk:att.dmg;var defv=ctx.ignoreDef||crit?0:(def.def||0)+(def.hard||0);
  var imm=tm===0;if(imm)tm=.2; /* immune: only a scratch gets through (the fight still ends) */
  var mult=tm*pm*m;
  var n=Math.max(1,Math.round(base*mult*(.75+r()*.25)*(crit?1.5:1)*(1-Math.min(.75,defv))));
  return {n:n,crit:crit,dodge:false,eff:imm?'immune':effWord(tm*pm),mult:tm*pm};}
/* enemy info for the bestiary card */
function weakList(S){var w=[],rs=[],im=[];TYPES.forEach(function(t){var v=resOf(S,t);if(v===0)im.push(t);else if(v>=1.2)w.push(t);else if(v<=.8)rs.push(t);});return {weak:w,res:rs,immune:im};}
var api={TYPES:TYPES,TYPE:TYPE,FAMS:FAMS,FAM:FAM,MOBS:MOBS,BOSSES:BOSSES,TRAIT:TRAIT,PHASE2:PHASE2,CLASSES:CLASSES,CLASSK:CLASSK,PERKS:PERKS,PERKK:PERKK,ARMOUR:ARMOUR,ARM_ENCH:ARM_ENCH,
  WEAPON:WEAPON,WPN_NAME:WPN_NAME,WPN_ENCH:WPN_ENCH,ITEMS:ITEMS,EVENTS:EVENTS,EVENTK:EVENTK,MAPMOBS:MAPMOBS,MAPBOSS:MAPBOSS,
  strHash:strHash,classOf:classOf,classFromWord:classFromWord,perksOf:perksOf,perkVal:perkVal,perkText:perkText,baseGear:baseGear,mergeGear:mergeGear,sheet:sheet,mobSheet:mobSheet,resOf:resOf,effWord:effWord,hit:hit,weakList:weakList,pct:pct,fmt:fmt};
if(typeof module!=='undefined'&&module.exports)module.exports=api;root.BTR=api;
})(typeof window!=='undefined'?window:globalThis);
