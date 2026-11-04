/* wheels.js — العجلات / Wheels section. The cards come from tools/wheels.json (built into the page as window.LAMMA_WHEELS),
   so adding a wheel there adds its card and its strings here with no code change. */
(function(){
'use strict';
var A=window.App,W=window.LAMMA_WHEELS||[];
var ar={wl_title:'العجلات',wl_sub:'اختار نوع العجلة. كل عجلة إلها صفحتها ورابط OBS تبعها.',wl_soon:'عجلات جديدة قريباً',wld_soon:'في عجلات تانية جاية لهون.',
  tag_new:'جديد',tag_hot:'🔥 الأشهر',tag_party:'بارتي'};
var en={wl_title:'Wheels',wl_sub:'Pick a wheel. Each one has its own page and its own OBS link.',wl_soon:'More wheels soon',wld_soon:'New wheel types are on the way.',
  tag_new:'New',tag_hot:'🔥 Popular',tag_party:'Party'};
W.forEach(function(w){ar['wl_'+w.id]=w.ar;ar['wld_'+w.id]=w.desc;en['wl_'+w.id]=w.en;en['wld_'+w.id]=w.desc_en||w.desc;});
A.strings({ar:ar,en:en});
A.start();
})();
