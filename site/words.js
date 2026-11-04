/* words.js — word banks (Arabic, Levantine-friendly + English). Edit freely: "a|b" = accepted alternatives, first one is shown. */
(function(root){
'use strict';
/* Charades: [arabic answers, english answers]. An empty side = that item only appears in the other language. */
var CHARADES={
 animals:[
  ['قطة|بسة|بسينة|قطه','cat|kitty|kitten'],['كلب|جرو','dog|puppy'],['أسد','lion'],['فيل','elephant'],['زرافة','giraffe'],['قرد|سعدان','monkey|ape'],
  ['أفعى|حية|حنش|ثعبان','snake'],['أرنب','rabbit|bunny'],['حصان|فرس','horse'],['بطة','duck'],['دجاجة|جاجة','chicken|hen'],['ديك','rooster'],
  ['بقرة','cow'],['خروف|غنمة|غنم','sheep|lamb'],['جمل','camel'],['نمر','tiger'],['دب','bear'],['بطريق','penguin'],['كنغر|كانغارو','kangaroo'],
  ['سمكة','fish'],['قرش|سمكة قرش','shark'],['ضفدع|ضفدعة','frog'],['فراشة','butterfly'],['نحلة','bee'],['عنكبوت','spider'],['تمساح','crocodile|alligator'],
  ['بومة','owl'],['سلحفاة|سلحفة|زلحفة','turtle|tortoise'],['فأر|فارة|جرذ','mouse|rat'],['ببغاء|ببغا','parrot'],['ديناصور','dinosaur'],['دلفين','dolphin'],
  ['حمار','donkey'],['غوريلا','gorilla'],['خفاش|وطواط','bat'],['نسر','eagle']
 ],
 jobs:[
  ['طبيب|دكتور|حكيم','doctor'],['طباخ|شيف','chef|cook'],['شرطي|شرطة|بوليس','police|policeman|police officer|cop'],['إطفائي|رجل إطفاء','firefighter|fireman'],
  ['معلم|أستاذ|مدرس|استاذ','teacher'],['حلاق','barber|hairdresser'],['نجار','carpenter'],['سائق|سواق|شوفير','driver'],['طيار','pilot'],['رسام','painter|artist'],
  ['مصور','photographer'],['خياط','tailor'],['ميكانيكي|ميكانيك','mechanic'],['مزارع|فلاح','farmer'],['صياد','fisherman|hunter'],['رائد فضاء','astronaut'],
  ['مهرج','clown'],['ساحر','magician|wizard'],['ممرض|ممرضة','nurse'],['بياع|بائع','seller|salesman'],['حارس|بواب','guard|security guard|bodyguard'],
  ['مذيع','presenter|news anchor|anchor'],['لاعب كرة|لاعب','footballer|football player|soccer player'],['ستريمر','streamer'],['عازف|موسيقي','musician'],
  ['دي جي|دي جاي','dj'],['جرسون|غرسون|نادل','waiter'],['مبرمج','programmer|coder|developer'],['عامل بناء|بناء|معمرجي','builder|construction worker'],
  ['ساعي بريد|بوسطجي','mailman|postman'],['طبيب أسنان|دكتور سنان|دكتور اسنان','dentist'],['جندي|عسكري','soldier'],['قاضي','judge'],['راعي','shepherd'],
  ['يوتيوبر','youtuber']
 ],
 movies:[
  ['تايتانيك','titanic'],['الأسد الملك|الملك الأسد','the lion king|lion king'],['سبايدرمان|الرجل العنكبوت','spiderman|spider man'],['باتمان|الرجل الوطواط','batman'],
  ['سوبرمان','superman'],['هاري بوتر','harry potter'],['الجوكر|جوكر','joker|the joker'],['أفاتار|افاتار','avatar'],['فروزن|ملكة الثلج','frozen'],['علاء الدين','aladdin'],
  ['شريك','shrek'],['حرب النجوم|ستار وورز','star wars'],['المتحولون|ترانسفورمرز','transformers'],['المنتقمون|أفنجرز|افنجرز','avengers|the avengers'],
  ['جوراسيك بارك|الحديقة الجوراسية','jurassic park'],['الفك المفترس','jaws'],['كارز|سيارات','cars'],['البحث عن نيمو|نيمو','finding nemo|nemo'],
  ['قراصنة الكاريبي','pirates of the caribbean'],['وحدي في المنزل|هوم ألون','home alone'],['ماتريكس','the matrix|matrix'],['توي ستوري|حكاية لعبة','toy story'],
  ['مينيونز','minions'],['كونغ فو باندا|كونغ فو','kung fu panda'],['سندريلا','cinderella'],['الجميلة والوحش','beauty and the beast'],
  ['السريع والغاضب|فاست آند فيوريس','fast and furious|fast & furious'],['باب الحارة',''],['ضيعة ضايعة',''],['الرسالة','the message'],['عمر المختار','lion of the desert|omar mukhtar'],
  ['ماينكرافت فيلم|فيلم ماينكرافت','a minecraft movie|minecraft movie'],['هالك','hulk'],['آيرون مان|الرجل الحديدي|ايرون مان','iron man'],['مستر بين','mr bean|mister bean'],
  ['توم وجيري','tom and jerry'],['سبونج بوب','spongebob']
 ],
 games:[
  ['ماينكرافت|مينكرافت|ماين كرافت','minecraft'],['فورتنايت','fortnite'],['ببجي','pubg'],['فيفا|اف سي','fifa|fc'],['ماريو|سوبر ماريو','mario|super mario'],['تتريس','tetris'],
  ['باك مان','pac man|pacman'],['جاتا|جي تي اي','gta|grand theft auto'],['كول أوف ديوتي|كود','call of duty|cod'],['فالورانت','valorant'],['روكيت ليج','rocket league'],
  ['أمونغ أس|امونج اس|امونق اس','among us'],['فاسموفوبيا','phasmophobia'],['سونيك','sonic'],['بوكيمون','pokemon'],['الطيور الغاضبة|انجري بيردز','angry birds'],
  ['كاندي كراش','candy crush'],['فول غايز|فول قايز','fall guys'],['روبلوكس','roblox'],['فروت نينجا','fruit ninja'],['صب واي|سب واي','subway surfers'],['كلاش أوف كلانس|كلاش','clash of clans'],
  ['شطرنج','chess'],['طاولة زهر|طاولة|طاولي','backgammon'],['شدة|ورق شدة|كوتشينة','cards|playing cards'],['غميضة|الغميضة|الطميمة','hide and seek'],['نط الحبل|حبلة','jump rope|skipping rope'],
  ['بولينغ','bowling'],['سلم وحية|السلم والثعبان','snakes and ladders'],['دومينو','dominoes|domino'],['بلياردو|سنوكر','billiards|pool|snooker'],['أونو|اونو','uno'],
  ['زيلدا','zelda'],['فلابي بيرد','flappy bird']
 ],
 objects:[
  ['تلفون|موبايل|جوال|هاتف','phone|mobile|cellphone'],['مفتاح','key'],['شمسية|مظلة','umbrella'],['نظارة|نظارات|كزلك','glasses'],['ساعة','watch|clock'],['مقص','scissors'],
  ['مكنسة','broom'],['كرسي','chair'],['مخدة|وسادة','pillow'],['فرشاة أسنان|فرشاية سنان|فرشاية','toothbrush'],['مراية|مرآة','mirror'],['كاميرا','camera'],
  ['سماعة|سماعات','headphones|headset'],['ريموت|جهاز تحكم','remote|remote control'],['مكوى|مكواية|مكواة','iron'],['غسالة','washing machine'],['براد|ثلاجة','fridge|refrigerator'],
  ['شنتاية|شنطة|حقيبة','bag|backpack'],['لمبة|ضو|مصباح','lamp|light bulb|bulb'],['قلم','pen|pencil'],['كتاب','book'],['شمعة','candle'],['بالون|بالونة|طابة هوا','balloon'],
  ['شاكوش|مطرقة','hammer'],['سيف','sword'],['تاج','crown'],['طيارة ورق','kite'],['مروحة','fan'],['إبرة|ابرة','needle'],['مسدس مي','water gun|water pistol'],
  ['كمبيوتر|لابتوب','computer|laptop'],['كيبورد|لوحة مفاتيح','keyboard'],['ماوس','mouse'],['دولاب|خزانة','wardrobe|closet'],['سرير','bed'],['طابة|كرة','ball'],['قداحة|ولاعة','lighter']
 ],
 food:[
  ['شاورما','shawarma'],['فلافل','falafel'],['بيتزا','pizza'],['فول',''],['حمص','hummus'],['كبة','kibbeh|kibbe'],['تبولة','tabbouleh'],['منسف','mansaf'],
  ['مقلوبة','maqluba|maqlooba'],['محشي|يبرق|ورق عنب','stuffed grape leaves|grape leaves|dolma'],['فتوش','fattoush'],['كنافة|كنافه','kunafa|knafeh'],['بقلاوة|بقلاوه','baklava'],
  ['بوظة|آيس كريم|ايس كريم','ice cream'],['بطيخ|جبس','watermelon'],['موز','banana'],['تفاح|تفاحة','apple'],['ليمون|ليمونة','lemon'],['بيض|بيضة','egg|eggs'],['شوربة','soup'],
  ['معكرونة|مكرونة|باستا','pasta|spaghetti|noodles'],['برغر|همبرغر','burger|hamburger'],['بطاطا مقلية|بطاطا|شيبس','fries|french fries|chips'],['بوشار|فشار','popcorn'],
  ['كيك|كعكة|قالب كيك','cake'],['شاي','tea'],['قهوة','coffee'],['سندويشة|سندويش','sandwich'],['زيتون','olives|olive'],['منقوشة|مناقيش','manakish|manakeesh'],
  ['شوكولا|شوكولاتة','chocolate'],['عسل','honey'],['حليب','milk'],['خبز|خبزة','bread'],['دونات','donut|doughnut'],['سوشي','sushi'],['فطاير|فطيرة','pie|pastry']
 ],
 sports:[
  ['كرة قدم|فوتبول|كورة','football|soccer'],['كرة سلة|باسكت','basketball'],['تنس','tennis'],['سباحة','swimming'],['ملاكمة|بوكس','boxing'],['فروسية|ركوب خيل','horse riding'],
  ['تزلج','skiing|skating'],['غولف|جولف','golf'],['كاراتيه','karate'],['مصارعة','wrestling'],['كرة طائرة|فولي','volleyball'],['ركض|جري','running|jogging'],
  ['رفع أثقال|حديد|جيم','weightlifting|gym'],['يوغا','yoga'],['دراجة|بسكليت|ركوب دراجة','cycling|biking'],['تنس طاولة|بينغ بونغ','ping pong|table tennis'],
  ['باراشوت|قفز بالمظلة','skydiving|parachute'],['تسلق','climbing'],['ركوب أمواج|ركمجة','surfing'],['هوكي','hockey'],['دارتس|رمي سهام','darts'],['بيسبول','baseball'],
  ['كرة يد|هاندبول','handball'],['غطس','diving'],['صيد سمك|صيد','fishing'],['سكيت بورد|سكيت','skateboarding|skateboard'],['رماية|رمي','archery|shooting'],
  ['تايكوندو','taekwondo'],['كرة قدم أمريكية','american football|rugby'],['قفز طويل|قفز','long jump|high jump'],['شد حبل','tug of war']
 ],
 places:[
  ['مدرسة','school'],['مستشفى|مشفى','hospital'],['مطار','airport'],['بحر|شط|شاطئ','beach|sea'],['سينما','cinema|movie theater|movies'],['مطعم','restaurant'],
  ['جامع|مسجد','mosque'],['سوق','market|souq'],['مكتبة','library'],['حديقة حيوانات','zoo'],['ملعب','stadium'],['حمام','bathroom'],['مطبخ','kitchen'],
  ['صحرا|صحراء','desert'],['جبل','mountain'],['غابة','forest|jungle'],['سجن|حبس','prison|jail'],['فضاء','space'],['مدينة ملاهي|ملاهي','amusement park|theme park'],
  ['سوبرماركت|ماركت','supermarket'],['بنك','bank'],['فندق|أوتيل','hotel'],['محطة قطار|قطار','train station'],['مسبح','swimming pool|pool'],['جزيرة','island'],
  ['قلعة','castle'],['نادي|جيم','gym'],['مزرعة','farm'],['بيت','house|home'],['عرس|حفلة عرس','wedding'],['مكتب','office'],['كهف|مغارة','cave'],['بركان','volcano'],
  ['ثلج|قطب','north pole|snow'],['حلاق|صالون','barbershop|salon']
 ]
};

/* Codenames-style grid words */
var GRID={
 ar:('قمر شمس نجمة بحر جبل نهر شجرة وردة نار ماء ثلج ريح مطر برق ورقة كتاب قلم مفتاح باب شباك بيت قصر برج جسر سيارة طيارة قطار سفينة دراجة صاروخ روبوت كمبيوتر تلفون كاميرا ساعة نظارة قبعة حذاء خاتم تاج سيف درع سهم '+
     'أسد نمر ذئب ثعلب قرد فيل جمل حصان نسر بومة سمكة حوت قرش أفعى عقرب نحلة نملة فراشة تفاح موز ليمون عنب بطيخ خبز جبنة عسل حليب قهوة شاي ملح سكر شوكولا بيتزا '+
     'طبيب معلم شرطي طباخ ملك ملكة أمير جندي قرصان ساحر شبح وحش تنين نينجا مدرسة مستشفى مطار سوق ملعب سينما مطعم مكتبة غابة صحراء جزيرة كهف فضاء كوكب ذهب فضة حديد ماس '+
     'موسيقى طبل غيتار بيانو حفلة عرس عيد هدية بالون شمعة مراية ظل حلم لعبة بطل كرة شاشة كهرباء مغناطيس بركان زلزال قوس ورد خيمة شاطئ لؤلؤ كنز خريطة بوصلة '+
     'ماينكرافت كريبر زومبي تويتش ستريم شات كيبورد ماوس سماعة مايك دمشق حلب بيروت عمان القدس بغداد القاهرة برلين باريس لندن').split(' '),
 en:('moon sun star sea mountain river tree rose fire water snow wind rain lightning paper book pen key door window house palace tower bridge car plane train ship bike rocket robot computer phone camera clock glasses hat shoe ring crown sword shield arrow '+
     'lion tiger wolf fox monkey elephant camel horse eagle owl fish whale shark snake scorpion bee ant butterfly apple banana lemon grape melon bread cheese honey milk coffee tea salt sugar chocolate pizza '+
     'doctor teacher police chef king queen prince soldier pirate wizard ghost monster dragon ninja school hospital airport market stadium cinema restaurant library forest desert island cave space planet gold silver iron diamond '+
     'music drum guitar piano party wedding holiday gift balloon candle mirror shadow dream game hero ball screen power magnet volcano earthquake bow tent beach pearl treasure map compass '+
     'minecraft creeper zombie twitch stream chat keyboard mouse headset mic berlin paris london tokyo cairo rome egypt spring winter night').split(' ')
};

/* Fastest typer */
var FAST={
 ar:['تويتش','ماينكرافت','شاورما','فلافل','ياسمين','زيتون','برتقال','كيبورد','ديسكورد','صاروخ','قهوة','شاي','دمشق','حلب','سوريا','ألمانيا','بطيخ','كنافة','قطة','حصان','جبل','بحر','مطر','قمر','نجمة','ألماس','سيف','قلعة','تنين','بيتزا','فراولة','موز','طيارة','سيارة','كرة','ملعب','لابتوب','سماعة','كاميرا','شوكولا','بسكويت','ليمون','عصفور','فراشة','بركان','صحراء','غيمة','زرافة','دولاب','مفتاح'],
 en:['creeper','diamond','valorant','rocket','keyboard','banana','dragon','pixel','galaxy','shawarma','thunder','castle','potion','emerald','sniper','pickaxe','zombie','falafel','coffee','penguin','volcano','spaceship','headset','controller','clutch','victory','jungle','pizza','tornado','unicorn','lightning','dungeon','portal','redstone','netherite','enderman','skeleton','cookie','hamburger','waterfall']
};

/* Quick trivia: c = index of the right answer */
var TRIVIA=[
 {ar:['شو عاصمة سوريا؟',['حلب','دمشق','حمص','اللاذقية']],en:['What is the capital of Syria?',['Aleppo','Damascus','Homs','Latakia']],c:1},
 {ar:['كم لاعب بفريق كرة القدم عالملعب؟',['9','10','11','12']],en:['How many players does a football team have on the pitch?',['9','10','11','12']],c:2},
 {ar:['شو أكبر كوكب بالمجموعة الشمسية؟',['زحل','الأرض','المشتري','المريخ']],en:['Which is the largest planet in the solar system?',['Saturn','Earth','Jupiter','Mars']],c:2},
 {ar:['بماينكرافت، شو بتحتاج لتعمل بوابة النذر؟',['حجر','أوبسيديان','ألماس','خشب']],en:['In Minecraft, what block builds a Nether portal?',['Stone','Obsidian','Diamond','Wood']],c:1},
 {ar:['كم يوم بالسنة الكبيسة؟',['364','365','366','367']],en:['How many days are in a leap year?',['364','365','366','367']],c:2},
 {ar:['شو أسرع حيوان بري؟',['الأسد','الفهد','الحصان','الغزال']],en:['What is the fastest land animal?',['Lion','Cheetah','Horse','Gazelle']],c:1},
 {ar:['أي بلد فيه برج إيفل؟',['إيطاليا','إسبانيا','فرنسا','ألمانيا']],en:['Which country has the Eiffel Tower?',['Italy','Spain','France','Germany']],c:2},
 {ar:['شو لون الكريبر بماينكرافت؟',['أحمر','أزرق','أخضر','أسود']],en:['What colour is a Minecraft creeper?',['Red','Blue','Green','Black']],c:2},
 {ar:['كم قارة بالعالم؟',['5','6','7','8']],en:['How many continents are there?',['5','6','7','8']],c:2},
 {ar:['شو أطول نهر بالعالم (حسب أغلب المصادر)؟',['النيل','الفرات','الأمازون','الدانوب']],en:['What is the longest river in the world (most sources)?',['Nile','Euphrates','Amazon','Danube']],c:0},
 {ar:['مين اخترع المصباح الكهربائي (المشهور)؟',['نيوتن','إديسون','أينشتاين','تسلا']],en:['Who is famous for inventing the light bulb?',['Newton','Edison','Einstein','Tesla']],c:1},
 {ar:['شو الغاز اللي منتنفسو لنعيش؟',['أكسجين','هيدروجين','نيتروجين','هيليوم']],en:['Which gas do we need to breathe to live?',['Oxygen','Hydrogen','Nitrogen','Helium']],c:0},
 {ar:['كم ضلع للمسدس؟',['5','6','7','8']],en:['How many sides does a hexagon have?',['5','6','7','8']],c:1},
 {ar:['شو أكبر محيط؟',['الأطلسي','الهندي','الهادئ','المتجمد الشمالي']],en:['What is the largest ocean?',['Atlantic','Indian','Pacific','Arctic']],c:2},
 {ar:['بأي لعبة في "باتل باص"؟',['فورتنايت','ببجي','فالورانت','ماينكرافت']],en:['Which game has the "Battle Bus"?',['Fortnite','PUBG','Valorant','Minecraft']],c:0},
 {ar:['شو عاصمة ألمانيا؟',['ميونخ','هامبورغ','برلين','فرانكفورت']],en:['What is the capital of Germany?',['Munich','Hamburg','Berlin','Frankfurt']],c:2},
 {ar:['كم دقيقة بالساعة؟',['30','60','90','100']],en:['How many minutes are in an hour?',['30','60','90','100']],c:1},
 {ar:['شو الحيوان اللي بيعطينا العسل؟',['النملة','الفراشة','النحلة','الدبور']],en:['Which animal gives us honey?',['Ant','Butterfly','Bee','Wasp']],c:2},
 {ar:['بماينكرافت، شو بيخوّف الكريبر؟',['الكلب','القطة','الحصان','الخنزير']],en:['In Minecraft, which animal scares creepers away?',['Dog','Cat','Horse','Pig']],c:1},
 {ar:['شو أعلى جبل بالعالم؟',['كليمنجارو','إيفرست','الألب','جبل الشيخ']],en:['What is the highest mountain in the world?',['Kilimanjaro','Everest','Mont Blanc','Mount Hermon']],c:1},
 {ar:['كم لون بقوس قزح؟',['5','6','7','8']],en:['How many colours are in a rainbow?',['5','6','7','8']],c:2},
 {ar:['شو عملة اليابان؟',['يوان','وون','ين','روبية']],en:['What is the currency of Japan?',['Yuan','Won','Yen','Rupee']],c:2},
 {ar:['أي كوكب منسميه الكوكب الأحمر؟',['الزهرة','المريخ','عطارد','زحل']],en:['Which planet is called the Red Planet?',['Venus','Mars','Mercury','Saturn']],c:1},
 {ar:['شو أكبر حيوان بالعالم؟',['الفيل','الحوت الأزرق','الزرافة','القرش']],en:['What is the largest animal on Earth?',['Elephant','Blue whale','Giraffe','Shark']],c:1},
 {ar:['كم رجل للعنكبوت؟',['6','8','10','12']],en:['How many legs does a spider have?',['6','8','10','12']],c:1},
 {ar:['شو الشي اللي بيتجمد عند صفر درجة؟',['الزيت','المي','الحليب المغلي','العسل']],en:['What freezes at 0°C?',['Oil','Water','Boiling milk','Honey']],c:1},
 {ar:['شو لون تويتش الرسمي؟',['أحمر','أخضر','بنفسجي','أصفر']],en:['What is Twitch\'s brand colour?',['Red','Green','Purple','Yellow']],c:2},
 {ar:['وين الأهرامات؟',['العراق','مصر','الأردن','المغرب']],en:['Where are the Pyramids of Giza?',['Iraq','Egypt','Jordan','Morocco']],c:1},
 {ar:['كم ثانية بالدقيقة؟',['30','60','100','120']],en:['How many seconds are in a minute?',['30','60','100','120']],c:1},
 {ar:['شو أصغر عدد أولي؟',['0','1','2','3']],en:['What is the smallest prime number?',['0','1','2','3']],c:2}
];

/* Who's most likely… prompts */
var LIKELY={
 ar:['مين الأرجح ينام بنص الستريم؟','مين الأرجح ينسى عيد ميلاد صاحبو؟','مين الأرجح يصير مشهور؟','مين الأرجح يضحك بوقت غلط؟','مين الأرجح ياكل أكل غيرو؟',
     'مين الأرجح يضيع بمدينة جديدة؟','مين الأرجح يكسب بطولة ماينكرافت؟','مين الأرجح يتأخر عالموعد؟','مين الأرجح يصرخ من لعبة رعب؟','مين الأرجح يصير مليونير؟',
     'مين الأرجح يحكي مع نفسو؟','مين الأرجح يعمل رجيم ويكسرو بنفس اليوم؟','مين الأرجح يقعد 10 ساعات عالتلفون؟','مين الأرجح يخسر تلفونو؟','مين الأرجح يطبخ أطيب أكل؟',
     'مين الأرجح يرقص بالعرس؟','مين الأرجح يفوز بمسابقة أسئلة؟','مين الأرجح يبكي بفيلم كرتون؟','مين الأرجح يرد عالرسائل بعد أسبوع؟','مين الأرجح يتبنى عشر قطط؟'],
 en:['Who is most likely to fall asleep mid-stream?','Who is most likely to forget a friend\'s birthday?','Who is most likely to become famous?','Who is most likely to laugh at the wrong moment?',
     'Who is most likely to eat someone else\'s food?','Who is most likely to get lost in a new city?','Who is most likely to win a Minecraft tournament?','Who is most likely to be late?',
     'Who is most likely to scream in a horror game?','Who is most likely to become a millionaire?','Who is most likely to talk to themselves?','Who is most likely to start and break a diet the same day?',
     'Who is most likely to spend 10 hours on their phone?','Who is most likely to lose their phone?','Who is most likely to cook the best food?','Who is most likely to dance at a wedding?',
     'Who is most likely to win a quiz?','Who is most likely to cry at a cartoon?','Who is most likely to reply a week later?','Who is most likely to adopt ten cats?']
};

var api={CHARADES:CHARADES,GRID:GRID,FAST:FAST,TRIVIA:TRIVIA,LIKELY:LIKELY};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
root.Words=api;
})(typeof window!=='undefined'?window:globalThis);
