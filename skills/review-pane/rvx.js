/* Review pane (rvx) v1.1.0 · a floating feedback overlay for HTML prototypes under review.
   Source: https://github.com/pat-madhav/mojo-skills (skills/review-pane/rvx.js) · MIT licence.
   Page needs two JSON script tags: id="rv-data" holds the asks [{"n":1,"ask":"Summary line","changed":"What changed","go":"#css-selector"}],
   id="rv-state" holds the marks ({} at first; Save copy writes them there). Load this file in a script tag with id="rvx-js"
   (inline or with src=) and optional data-title, data-key (storage key), data-occlude (sticky headers that cover the top),
   data-avoid (fixed bars at the bottom to stay above), data-strip (runtime-only nodes to drop from saved copies), data-file.
   The pane: approve / reject tiles and navigation on top, a glowing summary pill (drag it anywhere; double-click to let it follow the changes again),
   and a details card that slides out below while you hover the pill or the highlighted change. A faint line joins the pill to the highlighted change. */
(()=>{'use strict';
const ME=document.currentScript||document.getElementById('rvx-js');
const opt=k=>(ME&&ME.dataset&&ME.dataset[k])||'';
const D=document.getElementById('rv-data');if(!D)return;
let IT=[];try{IT=JSON.parse(D.textContent||'[]')}catch(e){}
if(!IT.length)return;
document.querySelectorAll('[data-rvx]').forEach(e=>e.remove()); // a saved copy rebuilds the pane fresh
const TITLE=opt('title')||document.title||'Review',KEY=opt('key')||('rvx:'+TITLE),OCC=opt('occlude'),AVOID=opt('avoid'),STRIP=opt('strip'),FILE=opt('file')||((TITLE.replace(/[^\w]+/g,'_')||'review')+'_with-feedback.html');
const RM=matchMedia('(prefers-reduced-motion: reduce)'),HOVER=matchMedia('(hover:hover)');
const E='cubic-bezier(.2,0,0,1)';

/* ---------- styles ---------- */
const css=`
:root{--rvx-glass:rgb(252 251 248/.74);--rvx-ink:#1d2230;--rvx-mu:#5b6072;--rvx-field:rgb(31 35 40/.06);--rvx-sh:0 10px 28px rgb(20 24 34/.16),0 2px 6px rgb(20 24 34/.10);
 --rvx-pri:#3170c9;--rvx-prih:#2a62b3;--rvx-ok:#2f8a3a;--rvx-okb:#e3f1de;--rvx-no:#c4313a;--rvx-nob:#fbe8e7;--rvx-line:rgb(124 92 255/.55);
 --rvx-rainbow:#4f8bff,#a35cff,#ff5ca8,#ff9f45,#3fd0c9,#4f8bff;
 /* decision tiles: the same colours in light and dark themes */
 --rvx-yes:#d6f0d4;--rvx-yes-h:#c3e8c0;--rvx-yes-ink:#1d6a2a;--rvx-yes-on:#1d7a32;--rvx-yes-on-ink:#fff;
 --rvx-nay:#fadcda;--rvx-nay-h:#f6c9c6;--rvx-nay-ink:#a3202a;--rvx-nay-on:#a81f29;--rvx-nay-on-ink:#fff;--rvx-nay-glow:0 0 0 3px rgb(224 52 60/.30),0 0 18px 3px rgb(232 40 48/.55)}
@media (prefers-color-scheme:dark){:root{--rvx-glass:rgb(34 41 49/.74);--rvx-ink:#f5f7fa;--rvx-mu:#a5adb7;--rvx-field:rgb(255 255 255/.07);--rvx-sh:0 12px 30px rgb(0 0 0/.5),0 2px 6px rgb(0 0 0/.4);
 --rvx-ok:#56d364;--rvx-okb:#14291a;--rvx-no:#ff7b72;--rvx-nob:#3a1719;--rvx-line:rgb(170 140 255/.6)}}
@property --rvx-a{syntax:'<angle>';inherits:false;initial-value:0deg}
@keyframes rvx-spin{to{--rvx-a:360deg}}
.rvx,.rvx-menu,.rvx-dock,.rvx-say{font-family:inherit;font-size:13.5px;line-height:1.4;font-weight:500;color:var(--rvx-ink);-webkit-font-smoothing:antialiased}
.rvx *,.rvx-menu *{box-sizing:border-box}
.rvx-g{background:var(--rvx-glass);-webkit-backdrop-filter:blur(18px) saturate(1.5);backdrop-filter:blur(18px) saturate(1.5);box-shadow:var(--rvx-sh)}
.rvx{position:fixed;left:0;top:0;z-index:2147483000;width:380px;max-width:calc(100vw - 24px);display:flex;flex-direction:column;gap:8px;transition:transform .45s ${E}}
.rvx.drag,.rvx.still{transition:none}
.rvx button{font:inherit;color:inherit}
.rvx :focus-visible,.rvx-menu :focus-visible,.rvx-dock:focus-visible{outline:2px solid var(--rvx-pri);outline-offset:2px}
/* top row: navigation, save and the list on the left; the decision tiles on the right edge */
.rvx-acts{display:flex;align-items:center;gap:8px}
.rvx-t{width:38px;height:38px;border:0;border-radius:50%;display:grid;place-items:center;cursor:pointer;padding:0;transition:background-color .2s,color .2s,transform .12s}
.rvx-t:active{transform:scale(.92)}
.rvx-t svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:22;stroke-linecap:round;stroke-linejoin:round}
.rvx-t.ok{background:var(--rvx-yes);color:var(--rvx-yes-ink)}
.rvx-t.ok:hover{background:var(--rvx-yes-h)}
.rvx-t.ok[aria-pressed="true"]{background:var(--rvx-yes-on);color:var(--rvx-yes-on-ink)}
.rvx-t.no{background:var(--rvx-nay);color:var(--rvx-nay-ink)}
.rvx-t.no:hover{background:var(--rvx-nay-h)}
.rvx-t.no[aria-pressed="true"]{background:var(--rvx-nay-on);color:var(--rvx-nay-on-ink);box-shadow:var(--rvx-sh),var(--rvx-nay-glow)}
.rvx-t.ok,.rvx-t.no{-webkit-backdrop-filter:none;backdrop-filter:none;transition:background-color .2s,color .2s,box-shadow .25s,transform .12s}
.rvx-t.save{background:var(--rvx-pri);color:#fff}
.rvx-t.save:hover{background:var(--rvx-prih)}
.rvx-sp{flex:1}
.rvx-nav{display:flex;align-items:center;height:38px;border-radius:999px;padding:0 3px}
.rvx-nav button{width:32px;height:32px;border:0;border-radius:50%;padding:0;background:transparent;display:grid;place-items:center;cursor:pointer;transition:background-color .15s}
.rvx-nav button:hover{background:var(--rvx-field)}
.rvx-nav svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:22;stroke-linecap:round;stroke-linejoin:round}
.rvx-pos{min-width:46px;text-align:center;font-size:12.5px;font-weight:600;color:var(--rvx-mu);font-variant-numeric:tabular-nums}
/* summary pill with a faint, slowly turning rainbow edge */
.rvx-sum{position:relative;display:flex;align-items:center;gap:10px;min-height:44px;padding:7px 16px 7px 8px;border-radius:22px;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none;box-shadow:var(--rvx-sh),0 0 22px rgb(140 100 255/.18)}
.rvx.drag .rvx-sum{cursor:grabbing}
.rvx-sum::before,.rvx-hl::before{content:"";position:absolute;inset:0;border-radius:inherit;padding:1.5px;background:conic-gradient(from var(--rvx-a),var(--rvx-rainbow));
 -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);mask-composite:exclude;opacity:.75;animation:rvx-spin 7s linear infinite;pointer-events:none}
.rvx-n{min-width:28px;height:28px;padding:0 8px;border-radius:999px;display:grid;place-items:center;flex:none;background:var(--rvx-pri);color:#fff;font-size:12.5px;font-weight:600;transition:background-color .25s,color .25s}
.rvx[data-s="ok"] .rvx-n{background:var(--rvx-ok);color:var(--rvx-okb)}
.rvx[data-s="no"] .rvx-n{background:var(--rvx-no);color:var(--rvx-nob)}
.rvx-txt{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;font-weight:600}
/* details: a separate card that slides out from under the pill */
.rvx-dw{display:grid;grid-template-rows:0fr;transition:grid-template-rows .34s ${E};margin-top:-8px}
.rvx.open .rvx-dw{grid-template-rows:1fr;margin-top:0}
.rvx-dw>div{min-height:0;overflow:hidden;padding:0 12px 16px;margin:0 -12px -16px}
.rvx-det{border-radius:22px;padding:14px 16px;transform:translateY(-12px);opacity:0;transition:transform .34s ${E},opacity .22s}
.rvx.open .rvx-det{transform:none;opacity:1}
.rvx-det b{display:block;font-size:11.5px;font-weight:600;color:var(--rvx-mu);margin-bottom:3px}
.rvx-det p{margin:0;font-weight:400}
.rvx-det p+b,.rvx-nw{margin-top:10px}
.rvx-ta{display:block;width:100%;min-height:72px;margin-top:4px;border:0;border-radius:12px;background:var(--rvx-field);color:inherit;padding:8px 10px;font-family:inherit;font-size:13px;line-height:1.4;font-weight:400;resize:vertical;outline:0}
.rvx-ta:focus-visible{box-shadow:0 0 0 2px var(--rvx-pri)}
.rvx-hint{font-size:11.5px;color:var(--rvx-mu);margin-top:6px;font-weight:400}
/* the change itself: a glowing box, and a faint line to the pill */
.rvx-hl{position:fixed;z-index:2147482999;pointer-events:none;border-radius:14px;opacity:0;box-shadow:0 0 0 4px rgb(124 92 255/.08),0 0 26px rgb(124 92 255/.22);
 transition:left .4s ${E},top .4s ${E},width .4s ${E},height .4s ${E},opacity .3s}
.rvx-hl::before{padding:2px;opacity:.9}
.rvx-hl.on{opacity:1}.rvx-hl.on.dim{opacity:.5}
.rvx-ln{position:fixed;inset:0;width:100vw;height:100vh;z-index:2147482998;pointer-events:none;overflow:visible;opacity:0;transition:opacity .3s}
.rvx-ln.on{opacity:1}
.rvx-ln line{stroke:var(--rvx-line);stroke-width:1.25}
.rvx-ln circle{fill:var(--rvx-line)}
/* list of every ask */
.rvx-menu{position:fixed;z-index:2147483001;width:400px;max-width:calc(100vw - 24px);max-height:min(62vh,500px);display:flex;flex-direction:column;gap:6px;padding:6px;border-radius:20px}
.rvx-menu[hidden]{display:none}
.rvx-menu ul{list-style:none;margin:0;padding:0;overflow:auto;scrollbar-width:thin;scrollbar-color:rgb(128 128 128/.4) transparent}
.rvx-menu li{display:flex;gap:10px;align-items:flex-start;padding:8px 10px;border-radius:14px;cursor:pointer;font-weight:500}
.rvx-menu li:hover,.rvx-menu li.act{background:var(--rvx-field)}
.rvx-menu li .rvx-n{width:auto;height:24px;min-width:24px;font-size:11.5px}
.rvx-menu li[data-s="ok"] .rvx-n{background:var(--rvx-ok);color:var(--rvx-okb)}.rvx-menu li[data-s="no"] .rvx-n{background:var(--rvx-no);color:var(--rvx-nob)}
.rvx-menu li small{display:block;color:var(--rvx-mu);font-weight:400;font-size:12px;margin-top:2px}
.rvx-mf{display:flex;gap:6px;padding:4px;border-top:1px solid var(--rvx-field)}
.rvx-mf button{height:32px;padding:0 14px;border:0;border-radius:999px;background:var(--rvx-field);font-family:inherit;font-size:12.5px;font-weight:600;color:var(--rvx-ink);cursor:pointer}
.rvx-mf button:hover{background:color-mix(in srgb,var(--rvx-ink) 12%,transparent)}
.rvx-mf .rvx-sp{flex:1}
.rvx-dock{position:fixed;right:16px;bottom:16px;z-index:2147483000;height:40px;padding:0 16px 0 10px;border:0;border-radius:999px;display:flex;align-items:center;gap:8px;cursor:pointer;font-weight:600}
.rvx-dock[hidden]{display:none}
.rvx-say{position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:2147483002;padding:8px 14px;border-radius:999px;font-size:13px;pointer-events:none;opacity:0;transition:opacity .2s}
.rvx-say.on{opacity:1}
@media (prefers-reduced-motion:reduce){.rvx,.rvx-hl,.rvx-dw,.rvx-det{transition:none}.rvx-sum::before,.rvx-hl::before{animation:none}}
`;
const st0=document.createElement('style');st0.dataset.rvx='';st0.textContent=css;document.head.appendChild(st0);

/* ---------- state ---------- */
let st={};const SE=document.getElementById('rv-state');
try{const em=JSON.parse((SE&&SE.textContent)||'{}');if(em&&Object.keys(em).length)st=em}catch(e){}
if(!Object.keys(st).length){try{st=JSON.parse(localStorage.getItem(KEY)||'{}')||{}}catch(e){st={}}}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(st))}catch(e){}if(SE)SE.textContent=JSON.stringify(st).replace(/</g,'\\u003c')};
const S=n=>(st[n]&&st[n].s)||'';
let cur=IT.findIndex(x=>x.n===st._cur);if(cur<0){cur=IT.findIndex(x=>!S(x.n));if(cur<0)cur=0}

/* ---------- DOM ---------- */
const svg=d=>'<svg viewBox="0 0 256 256" aria-hidden="true">'+d+'</svg>';
const ICO={ok:svg('<path d="M44 136l52 52 116-116"/>'),no:svg('<path d="M64 64l128 128M192 64 64 192"/>'),prev:svg('<path d="M160 208 80 128l80-80"/>'),next:svg('<path d="m96 48 80 80-80 80"/>'),
 save:svg('<path d="M216 91.3V208a8 8 0 0 1-8 8H48a8 8 0 0 1-8-8V48a8 8 0 0 1 8-8h116.7a8 8 0 0 1 5.6 2.3l43.4 43.4a8 8 0 0 1 2.3 5.6Z"/><path d="M80 216v-64a8 8 0 0 1 8-8h80a8 8 0 0 1 8 8v64M96 40v40h64"/>'),
 list:svg('<path d="M96 64h120M96 128h120M96 192h120M44 64h.5M44 128h.5M44 192h.5" stroke-width="24"/>')};
const el=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!=null)e.innerHTML=html;e.dataset.rvx='';return e};
const P=el('section','rvx');P.setAttribute('aria-label','Review: '+TITLE);
P.innerHTML='<div class="rvx-acts">'
 +'<span class="rvx-nav rvx-g"><button type="button" data-d="-1" aria-label="Previous ask" title="Previous · [">'+ICO.prev+'</button><span class="rvx-pos" aria-live="polite"></span><button type="button" data-d="1" aria-label="Next ask" title="Next · ]">'+ICO.next+'</button></span>'
 +'<button type="button" class="rvx-t rvx-g save" data-rvx-save aria-label="Save a copy with your marks" title="Save a copy with your marks">'+ICO.save+'</button>'
 +'<button type="button" class="rvx-t rvx-g lst" aria-haspopup="dialog" aria-expanded="false" aria-label="All asks, copy feedback" title="All asks">'+ICO.list+'</button>'
 +'<span class="rvx-sp"></span>'
 +'<button type="button" class="rvx-t rvx-g ok" aria-pressed="false" aria-label="Approve" title="Approve">'+ICO.ok+'</button>'
 +'<button type="button" class="rvx-t rvx-g no" aria-pressed="false" aria-label="Not right yet, add a note" title="Not right yet">'+ICO.no+'</button>'
 +'</div>'
 +'<div class="rvx-sum rvx-g" title="Drag to move · double-click to follow the changes again"><span class="rvx-n"></span><span class="rvx-txt"></span></div>'
 +'<div class="rvx-dw"><div><div class="rvx-det rvx-g" role="region" aria-label="Details"><b>What changed</b><p class="rvx-ch"></p><div class="rvx-nw" hidden><b>Your note</b><textarea class="rvx-ta" aria-label="What is still not right"></textarea><div class="rvx-hint">Ctrl or ⌘ + Enter saves and moves to the next ask</div></div></div></div></div>';
const HL=el('div','rvx-hl');HL.setAttribute('aria-hidden','true');
const LN=document.createElementNS('http://www.w3.org/2000/svg','svg');LN.setAttribute('class','rvx-ln');LN.dataset.rvx='';LN.setAttribute('aria-hidden','true');LN.innerHTML='<line/><circle r="3"/><circle r="3"/>';
const MN=el('div','rvx-menu rvx-g');MN.hidden=true;MN.setAttribute('role','dialog');MN.setAttribute('aria-label','All asks');
MN.innerHTML='<ul role="listbox" aria-label="Asks"></ul><div class="rvx-mf"><button type="button" class="cp">Copy feedback</button><button type="button" class="fl" hidden>Follow the changes</button><span class="rvx-sp"></span><button type="button" class="hd">Hide review</button></div>';
const DK=el('button','rvx-dock rvx-g');DK.type='button';DK.hidden=true;
const SAY=el('div','rvx-say rvx-g');SAY.setAttribute('role','status');
document.body.append(LN,HL,P,MN,DK,SAY);
const $=s=>P.querySelector(s);const SUM=$('.rvx-sum'),TA=$('.rvx-ta');

/* ---------- paint ---------- */
const esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function paint(){const it=IT[cur],s=S(it.n);P.dataset.s=s;$('.rvx-n').textContent=it.n;$('.rvx-txt').textContent=it.ask;SUM.setAttribute('aria-label','Ask '+it.n+': '+it.ask);
 $('.rvx-t.ok').setAttribute('aria-pressed',String(s==='ok'));$('.rvx-t.no').setAttribute('aria-pressed',String(s==='no'));
 const left=IT.filter(x=>!S(x.n)).length;$('.rvx-pos').textContent=(cur+1)+' / '+IT.length;$('.rvx-pos').title=left?left+' still to check':'All checked';
 $('.rvx-ch').textContent=it.changed||'';const nw=$('.rvx-nw');nw.hidden=s!=='no';if(document.activeElement!==TA)TA.value=(st[it.n]&&st[it.n].note)||'';
 DK.innerHTML='<span class="rvx-n" style="height:24px;min-width:24px;font-size:11.5px">'+left+'</span>'+(left?'to review':'All reviewed');DK.title='Show the review pane'}
let sayT;function say(t){SAY.textContent=t;SAY.classList.add('on');clearTimeout(sayT);sayT=setTimeout(()=>SAY.classList.remove('on'),2200)}

/* ---------- geometry ---------- */
function target(){const g=IT[cur].go;if(!g)return null;try{return document.querySelector(g)}catch(e){return null}}
function floor(){let b=innerHeight;if(AVOID)document.querySelectorAll(AVOID).forEach(e=>{const r=e.getBoundingClientRect();if(r.height&&r.top<b&&r.top>innerHeight/2)b=r.top});return b}
function occ(){let b=0;if(OCC)document.querySelectorAll(OCC).forEach(e=>{const r=e.getBoundingClientRect();if(r.height&&r.top<=1&&r.bottom>b)b=r.bottom});return b}
function tRect(){const t=target();if(!t)return null;const r=t.getBoundingClientRect();if(!r.width&&!r.height)return null;const top=Math.max(r.top-6,occ()),bot=Math.min(r.bottom+6,innerHeight);
 if(bot-top<8)return null;return {left:r.left-6,top:top,right:r.right+6,bottom:bot,width:r.width+12,height:bot-top}}
let pos={x:0,y:0};const manual=()=>!!st._pos;
/* the pane's full height: top row + pill, plus the details card when it is open (measured at its final size, not mid-slide) */
function effH(open){const o=open==null?P.classList.contains('open'):open;return $('.rvx-acts').offsetHeight+8+SUM.offsetHeight+(o?8+$('.rvx-det').offsetHeight:0)}
function size(){return {w:P.offsetWidth,h:effH()}}
function clampPos(x,y,h){const w=P.offsetWidth,pad=12;h=h==null?Math.max(effH(),150):h;return {x:Math.min(Math.max(pad,x),innerWidth-w-pad),y:Math.max(pad+occ(),Math.min(y,floor()-h-pad))}}
function setPos(p,still){if(still)P.classList.add('still');pos=clampPos(p.x,p.y);P.style.transform='translate('+pos.x+'px,'+pos.y+'px)';if(still){void P.offsetWidth;P.classList.remove('still')}}
/* get out of the way: if the pane (with its details card when open) covers the change, find the nearest clear spot */
const GAP=16;
const ovl=(a,b)=>{const w=Math.min(a.right,b.right)-Math.max(a.left,b.left),h=Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top);return w>0&&h>0?w*h:0};
function clear(p){const t=target();if(!t||P.contains(t))return p;const r=tRect();if(!r)return p;const h=effH(),w=P.offsetWidth,bx=q=>({left:q.x,top:q.y,right:q.x+w,bottom:q.y+h});
 const here=ovl(bx(p),r);if(!here)return p;
 const raw=[{x:r.right+GAP,y:p.y},{x:r.left-GAP-w,y:p.y},{x:p.x,y:r.bottom+GAP},{x:p.x,y:r.top-GAP-h},
  {x:r.right+GAP,y:r.top},{x:r.left-GAP-w,y:r.top},{x:r.left,y:r.bottom+GAP},{x:r.left,y:r.top-GAP-h}];
 let best=null,bs=Infinity;raw.forEach(c=>{const q=clampPos(c.x,c.y,h),o=ovl(bx(q),r),s=o*1000+Math.hypot(q.x-p.x,q.y-p.y);if(s<bs){bs=s;best=q}});
 return best&&ovl(bx(best),r)<here?best:p}
function autoPlace(still){let p=null;
 if(manual())p=st._pos;
 else{const r=tRect(),w=P.offsetWidth,hh=Math.max(effH(),150),pad=16,top0=occ()+pad;
  if(r){if(r.right+24+w<=innerWidth-pad)p={x:r.right+24,y:r.top};
   else if(r.left-24-w>=pad)p={x:r.left-24-w,y:r.top};
   else if(r.bottom+16+hh<=floor()-pad)p={x:r.left,y:r.bottom+16};
   else if(r.top-16-hh>=top0)p={x:r.left,y:r.top-16-hh}}
  if(!p)p={x:innerWidth-w-pad-8,y:floor()-hh-pad}}
 setPos(clear(clampPos(p.x,p.y)),still)}
/* glide aside from wherever the pane is now; it never jumps back, so a closing card leaves it where it is */
let hold=null,ptr={x:-1,y:-1};
function dist(b,q){const dx=Math.max(b.left-q.x,0,q.x-b.right),dy=Math.max(b.top-q.y,0,q.y-b.bottom);return Math.hypot(dx,dy)}
function reclear(){if(dr||P.hidden)return;const q=clear(pos);if(Math.abs(q.x-pos.x)<1&&Math.abs(q.y-pos.y)<1)return;
 const hovering=hov>0&&!pin&&P.contains(document.elementFromPoint(ptr.x,ptr.y));
 setPos(q);follow(520);
 /* the pane slid out from under the pointer while showing its details: keep them open until the pointer heads away */
 if(hovering){hold={d:null};setTimeout(()=>{if(hold)hold.d=dist(P.getBoundingClientRect(),ptr)},480)}}
function near(p,r){return {x:Math.min(Math.max(p.x,r.left),r.right),y:Math.min(Math.max(p.y,r.top),r.bottom)}}
function frame(){raf=0;const r=tRect();
 if(!r||P.hidden){HL.classList.remove('on');LN.classList.remove('on');return}
 HL.style.left=r.left+'px';HL.style.top=r.top+'px';HL.style.width=r.width+'px';HL.style.height=r.height+'px';HL.classList.add('on');
 const s=SUM.getBoundingClientRect(),c1={x:(s.left+s.right)/2,y:(s.top+s.bottom)/2},c2={x:(r.left+r.right)/2,y:(r.top+r.bottom)/2};
 const a=near(c1,r),b=near(c2,s);const ov=!(s.right<r.left||s.left>r.right||s.bottom<r.top||s.top>r.bottom);
 if(ov||Math.hypot(a.x-b.x,a.y-b.y)<12){LN.classList.remove('on');return}
 const [ln,c0,c9]=LN.children;ln.setAttribute('x1',a.x);ln.setAttribute('y1',a.y);ln.setAttribute('x2',b.x);ln.setAttribute('y2',b.y);c0.setAttribute('cx',a.x);c0.setAttribute('cy',a.y);c9.setAttribute('cx',b.x);c9.setAttribute('cy',b.y);LN.classList.add('on')}
let raf=0;const tick=()=>{if(!raf)raf=requestAnimationFrame(frame)};
/* keep the line attached while the pane glides */
function follow(ms){const end=performance.now()+ms;const f=()=>{frame();if(performance.now()<end)requestAnimationFrame(f)};requestAnimationFrame(f)}

/* ---------- open / close the details ---------- */
let pin=false,hov=0,closeT;
function setOpen(){const o=pin||hov>0;if(!o)hold=null;const was=P.classList.contains('open');P.classList.toggle('open',o);if(o&&!was)reclear()}
function enter(){hov=1;hold=null;clearTimeout(closeT);setOpen()}
function leave(){if(hold)return;clearTimeout(closeT);closeT=setTimeout(()=>{if(!hold){hov=0;setOpen()}},260)}
document.addEventListener('pointermove',e=>{ptr={x:e.clientX,y:e.clientY};if(hold&&hold.d!=null&&!P.contains(e.target)&&!(tEl&&tEl.contains(e.target))&&dist(P.getBoundingClientRect(),ptr)>hold.d+40){hold=null;leave()}},{passive:true,capture:true});
P.addEventListener('pointerenter',e=>{if(e.pointerType==='mouse')enter()});P.addEventListener('pointerleave',e=>{if(e.pointerType==='mouse')leave()});
let tEl=null;function bindTarget(){if(tEl){tEl.removeEventListener('pointerenter',enter);tEl.removeEventListener('pointerleave',leave)}tEl=target();if(tEl){tEl.addEventListener('pointerenter',enter);tEl.addEventListener('pointerleave',leave)}}

/* ---------- go to an ask ---------- */
let dimT;
function scrollToTarget(){const t=target();if(!t)return Promise.resolve();const r=t.getBoundingClientRect(),o=occ(),room=innerHeight-o;
 let y=r.top+scrollY-o-(r.height<room-80?Math.max(24,(room-r.height)/3):24);y=Math.max(0,y);
 if(Math.abs(y-scrollY)<4)return Promise.resolve();
 return new Promise(res=>{if(RM.matches){scrollTo(0,y);res();return}const y0=scrollY,t0=performance.now(),d=Math.min(700,260+Math.abs(y-y0)*.25);
  const ease=k=>1-Math.pow(1-k,3);const step=now=>{const k=Math.min(1,(now-t0)/d);scrollTo(0,y0+(y-y0)*ease(k));frame();if(k<1)requestAnimationFrame(step);else res()};requestAnimationFrame(step)})}
function go(i,o){o=o||{};hold=null;cur=(i+IT.length)%IT.length;st._cur=IT[cur].n;save();paint();bindTarget();pin=S(IT[cur].n)==='no'&&o.note;setOpen();
 HL.classList.remove('dim');clearTimeout(dimT);
 const done=()=>{autoPlace();follow(500);frame();dimT=setTimeout(()=>HL.classList.add('dim'),3500)};
 if(o.scroll===false){done();return}scrollToTarget().then(done)}
const nextOpen=()=>{for(let k=1;k<=IT.length;k++){const j=(cur+k)%IT.length;if(!S(IT[j].n))return j}return -1};

/* ---------- decisions ---------- */
$('.rvx-t.ok').addEventListener('click',()=>{const n=IT[cur].n;st[n]=st[n]||{};st[n].s=st[n].s==='ok'?'':'ok';pin=false;save();paint();setOpen();
 if(st[n].s==='ok'){const j=nextOpen();if(j>=0)setTimeout(()=>{if(IT[cur].n===n)go(j)},480);else say('All asks reviewed. Save a copy or copy the feedback.')}});
$('.rvx-t.no').addEventListener('click',()=>{const n=IT[cur].n;st[n]=st[n]||{};st[n].s='no';save();paint();pin=true;setOpen();setTimeout(()=>TA.focus(),120)});
TA.addEventListener('input',()=>{const n=IT[cur].n;st[n]=st[n]||{s:'no'};st[n].note=TA.value;save()});
TA.addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.metaKey||e.ctrlKey)){e.preventDefault();pin=false;TA.blur();const j=nextOpen();if(j>=0)go(j);else{setOpen();say('All asks reviewed. Save a copy or copy the feedback.')}}else if(e.key==='Escape'){pin=false;TA.blur();setOpen()}});
P.querySelectorAll('.rvx-nav [data-d]').forEach(b=>b.addEventListener('click',()=>go(cur+(+b.dataset.d))));

/* ---------- drag the pane by its pill ---------- */
let dr=null;
SUM.addEventListener('pointerdown',e=>{if(e.button!==0)return;dr={x:e.clientX,y:e.clientY,px:pos.x,py:pos.y,moved:false,id:e.pointerId};SUM.setPointerCapture(e.pointerId)});
SUM.addEventListener('pointermove',e=>{if(!dr)return;const dx=e.clientX-dr.x,dy=e.clientY-dr.y;if(!dr.moved&&Math.hypot(dx,dy)<4)return;if(!dr.moved){dr.moved=true;P.classList.add('drag')}
 setPos({x:dr.px+dx,y:dr.py+dy});frame()});
SUM.addEventListener('pointerup',e=>{if(!dr)return;const m=dr.moved;dr=null;P.classList.remove('drag');
 if(m){st._pos={x:pos.x,y:pos.y};save();MN.querySelector('.fl').hidden=false;reclear()}else if(e.pointerType!=='mouse'){hov=hov?0:1;setOpen()}});
SUM.addEventListener('dblclick',()=>{delete st._pos;save();MN.querySelector('.fl').hidden=true;autoPlace();follow(500);say('The pane follows the changes again')});

/* ---------- list, copy, save, hide ---------- */
const LB=MN.querySelector('ul');
function paintList(){LB.innerHTML=IT.map((it,i)=>'<li role="option" data-i="'+i+'" data-s="'+S(it.n)+'" aria-selected="'+(i===cur)+'"'+(i===cur?' class="act"':'')+'><span class="rvx-n">'+it.n+'</span><span><span>'+esc(it.ask)+'</span><small>'+esc(S(it.n)==='ok'?'Approved':S(it.n)==='no'?'Not right yet'+(st[it.n].note?': '+st[it.n].note:''):'To check')+'</small></span></li>').join('')}
function openMenu(){paintList();MN.hidden=false;const b=$('.rvx-t.lst').getBoundingClientRect(),w=MN.offsetWidth,h=MN.offsetHeight;
 let x=Math.min(Math.max(12,b.right-w),innerWidth-w-12),y=b.bottom+8;if(y+h>innerHeight-12)y=Math.max(12,b.top-8-h);MN.style.left=x+'px';MN.style.top=y+'px';$('.rvx-t.lst').setAttribute('aria-expanded','true');
 const a=LB.querySelector('.act');if(a)a.scrollIntoView({block:'nearest'})}
function closeMenu(){MN.hidden=true;$('.rvx-t.lst').setAttribute('aria-expanded','false')}
$('.rvx-t.lst').addEventListener('click',()=>MN.hidden?openMenu():closeMenu());
LB.addEventListener('click',e=>{const li=e.target.closest('li[data-i]');if(li){closeMenu();go(+li.dataset.i)}});
const text=()=>TITLE+' · feedback · '+new Date().toLocaleString()+'\n\n'+IT.map(x=>'#'+x.n+' '+x.ask+'\n  '+(S(x.n)==='ok'?'Approved':S(x.n)==='no'?'Not right yet':'Not checked')+(st[x.n]&&st[x.n].note?'\n  Note: '+st[x.n].note:'')).join('\n\n');
MN.querySelector('.cp').addEventListener('click',()=>{const t=text();const fb=()=>{const a=document.createElement('textarea');a.value=t;document.body.appendChild(a);a.select();try{document.execCommand('copy');say('Feedback copied')}catch(e){say('Copy failed')}a.remove()};
 (navigator.clipboard?navigator.clipboard.writeText(t):Promise.reject()).then(()=>say('Feedback copied'),fb);closeMenu()});
MN.querySelector('.fl').hidden=!manual();
MN.querySelector('.fl').addEventListener('click',()=>{delete st._pos;save();MN.querySelector('.fl').hidden=true;closeMenu();autoPlace();follow(500)});
function hide(v){st._hidden=v;save();P.hidden=v;DK.hidden=!v;if(v){HL.classList.remove('on');LN.classList.remove('on')}else{autoPlace(true);frame()}}
MN.querySelector('.hd').addEventListener('click',()=>{closeMenu();hide(true)});DK.addEventListener('click',()=>hide(false));
$('[data-rvx-save]').addEventListener('click',async()=>{save();const c=document.documentElement.cloneNode(true);c.querySelectorAll('[data-rvx]'+(STRIP?','+STRIP:'')).forEach(x=>x.remove());
 const html='<!doctype html>\n'+c.outerHTML;
 try{if(window.claude&&window.claude.use){const dl=await window.claude.use('downloads');if(dl){try{await dl.save({filename:FILE,data:html});say('Saved a copy with your marks')}catch(e){say(e&&e.code==='declined'?'Save cancelled':'Save is not available here. Use Copy feedback.')}return}}}catch(e){}
 const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([html],{type:'text/html'}));a.download=FILE;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove()},600);say('Saved a copy with your marks')});

/* ---------- global ---------- */
document.addEventListener('pointerdown',e=>{if(!MN.hidden&&!MN.contains(e.target)&&!e.target.closest('.rvx-t.lst'))closeMenu()},true);
document.addEventListener('keydown',e=>{if(e.target.closest&&e.target.closest('input,textarea,select,[contenteditable]'))return;if(e.metaKey||e.ctrlKey||e.altKey)return;
 if(e.key==='[')go(cur-1);else if(e.key===']')go(cur+1);else if(e.key==='Escape'&&!MN.hidden)closeMenu()});
let scT;addEventListener('scroll',()=>{tick();clearTimeout(scT);scT=setTimeout(reclear,140)},{passive:true});
window.rvx={version:'1.1.0'};addEventListener('resize',()=>{autoPlace(true);tick()});
paint();bindTarget();P.hidden=!!st._hidden;DK.hidden=!st._hidden;
requestAnimationFrame(()=>{autoPlace(true);frame()});addEventListener('load',()=>{autoPlace(true);frame()});
})();
