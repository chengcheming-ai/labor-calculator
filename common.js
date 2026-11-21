const $=id=>document.getElementById(id);

/* 深色／淺色主題切換（預設深色；選擇只記在使用者自己的瀏覽器） */
(()=>{
  const h=document.querySelector('header .in');if(!h)return;
  const root=document.documentElement,meta=document.querySelector('meta[name="theme-color"]'),b=document.createElement('button');
  b.type='button';b.className='theme-btn';
  const sync=()=>{const L=root.dataset.theme==='light';b.textContent=L?'🌙 深色':'☀️ 淺色';b.setAttribute('aria-label',L?'切換為深色主題':'切換為淺色主題');if(meta)meta.content=L?'#f4f6fb':'#070b18'};
  b.onclick=()=>{const L=root.dataset.theme!=='light';if(L)root.dataset.theme='light';else delete root.dataset.theme;try{localStorage.setItem('lc-theme',L?'light':'dark')}catch(e){}sync()};
  h.appendChild(b);sync();
})();

/* 欄位上下限：超出時以上下限計算，輸入框亮橘框，並在結果區說明原因（data-why） */
const _over=[];
const _lab=id=>{const l=document.querySelector(`label[for="${id}"]`);if(!l)return id;
  return [...l.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').replace(/（.*?）/g,'').trim()};
function _flag(e,id,bad,msg){e.classList.toggle('over',bad);if(bad&&!_over.some(o=>o[0]==='lim-'+id))_over.push(['lim-'+id,'warn',msg])}
const num=id=>{
  const e=$(id);let v=parseFloat(String(e.value).replace(/,/g,''));if(isNaN(v))v=0;
  const lo=e.min!==''?+e.min:-Infinity,hi=e.max!==''?+e.max:Infinity,c=Math.min(Math.max(v,lo),hi);
  _flag(e,id,c!==v&&e.value!=='',`「${_lab(id)}」${v>hi?'最多':'最少'}是 ${c.toLocaleString('zh-TW')}：${e.dataset.why||'超出合理範圍'}。已先用 ${c.toLocaleString('zh-TW')} 計算 ✋`);
  return c};
const dv=id=>{
  const e=$(id),s=e.value;if(!s)return new Date(NaN);
  const c=e.min&&s<e.min?e.min:e.max&&s>e.max?e.max:s;
  _flag(e,id,c!==s,`「${_lab(id)}」要介於 ${e.min} 到 ${e.max} 之間，已先用 ${c} 計算 ✋`);
  return new Date(c)};
/* 在欄位名稱旁標出法定上限（data-show） */
document.querySelectorAll('input[data-show]').forEach(e=>{const l=document.querySelector(`label[for="${e.id}"]`);if(l)l.insertAdjacentHTML('beforeend',` <span class="lim">${e.dataset.show}</span>`)});
const fmt=n=>Math.round(n).toLocaleString('zh-TW');
const r1=x=>Math.round(x*10)/10;

/* 記住上次輸入（只存在使用者自己的瀏覽器） */
const KEY='lc:'+location.pathname;
const store={get(){try{return JSON.parse(localStorage.getItem(KEY))||{}}catch(e){return{}}},set(v){try{localStorage.setItem(KEY,JSON.stringify(v))}catch(e){}}};
function bind(fn){
  const els=[...document.querySelectorAll('input,select')].filter(e=>e.id),saved=store.get(),keep=e=>e.dataset.nosave===undefined;
  els.forEach(e=>{if(keep(e)&&e.id in saved){if(e.type==='checkbox')e.checked=saved[e.id];else e.value=saved[e.id]}});
  const save=()=>{const o={};els.forEach(e=>{if(keep(e))o[e.id]=e.type==='checkbox'?e.checked:e.value});store.set(o)};
  const run=()=>{_over.length=0;fn()};
  els.forEach(e=>e.addEventListener('input',()=>{run();save()}));run();
}

/* 結果區：自動加上提示條容器與「複製／清除」按鈕 */
document.querySelectorAll('.res').forEach(res=>{
  const t=document.createElement('div');t.id='tips';t.className='tips';res.appendChild(t);
  const a=document.createElement('div');a.className='act';
  a.innerHTML='<button type="button" class="b-copy">📋 複製結果</button><button type="button" class="b-print">📄 報表／存 PDF</button><button type="button" class="b-reset">↺ 清除重填</button>';res.appendChild(a);
  a.querySelector('.b-print').onclick=()=>window.print();
  a.querySelector('.b-copy').onclick=async e=>{
    const b=e.currentTarget,h=document.querySelector('h1').textContent;
    const ins=[...document.querySelectorAll('.card .grid > div')].map(d=>{const l=d.querySelector('label'),i=d.querySelector('input,select');if(!l||!i)return'';
      return l.textContent+'：'+(i.tagName==='SELECT'?i.options[i.selectedIndex].text:i.value)}).filter(Boolean);
    a.hidden=true;const out=res.innerText.trim().replace(/\n{2,}/g,'\n');a.hidden=false;
    const txt=`【${h}】\n${ins.join('\n')}\n——\n${out}\n\n👉 ${location.href}`;
    try{await navigator.clipboard.writeText(txt)}catch(_){const ta=document.createElement('textarea');ta.value=txt;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}
    b.textContent='✅ 已複製，快貼給朋友';setTimeout(()=>b.textContent='📋 複製結果',1800);
  };
  a.querySelector('.b-reset').onclick=()=>{try{localStorage.removeItem(KEY)}catch(_){}location.reload()};
});

/* 媒體報導精選：讀取 news.js，只顯示半年內的文章，新的排前面；每篇都標示出處並可複製引用格式 */
const NEWS_TOPICS={overtime:['加班費','⏱️'],'annual-leave':['特休天數','🏖️'],severance:['資遣費','📦'],pension:['勞退自提','🏦'],'labor-insurance':['勞保年金','👵'],budget:['開銷規劃','💰']};
const _nesc=x=>String(x).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const _npre=()=>{const h=(document.querySelector('.logo')||{}).getAttribute?document.querySelector('.logo').getAttribute('href'):'./';return h==='./'?'':h};
function newsList(k){
  if(!window.NEWS)return[];
  const keys=k==='*'?Object.keys(NEWS.items):[k];
  return keys.flatMap(t=>(NEWS.items[t]||[]).map(x=>({...x,k:t})))
    .filter(x=>(Date.now()-new Date(x.d))/864e5<=186&&/^https:\/\//.test(x.u))
    .sort((a,b)=>b.d.localeCompare(a.d));
}
function newsCite(x){return `「${x.t}」，${x.m}，${x.d.replace(/-/g,'/')}。${x.u}`}
function newsCard(x,showTopic){
  let host='';try{host=new URL(x.u).hostname.replace(/^www\./,'')}catch(e){}
  const tp=NEWS_TOPICS[x.k]||['',''],pre=_npre();
  return `<article class="ni">
<div class="nsrc"><span class="nlab">出處</span><b class="nmedia">${_nesc(x.m)}</b><span class="nhost">${_nesc(host)}</span><span class="ndate">${_nesc(x.d.replace(/-/g,'/'))}</span>${showTopic&&tp[0]?`<a class="ntopic" href="${pre}${x.k}/">${tp[1]} ${tp[0]}計算機</a>`:''}</div>
<a class="nt" href="${_nesc(x.u)}" target="_blank" rel="noopener noreferrer">${_nesc(x.t)}</a>
<div class="nact"><a class="nbtn" href="${_nesc(x.u)}" target="_blank" rel="noopener noreferrer">閱讀原文 ↗</a><button type="button" class="ncite" data-cite="${_nesc(newsCite(x))}">📋 複製出處</button></div>
</article>`;
}
const NEWS_COPYRIGHT='文章著作權屬各原媒體所有，本站僅列出標題與出處，並連結至原文。引用或轉載時，請註明原媒體名稱、發布日期與原文網址。';
document.addEventListener('click',async e=>{
  const b=e.target.closest('.ncite');if(!b)return;const t=b.dataset.cite;
  try{await navigator.clipboard.writeText(t)}catch(_){const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();document.execCommand('copy');ta.remove()}
  b.textContent='✅ 已複製出處';setTimeout(()=>b.textContent='📋 複製出處',1800);
});
(()=>{
  const s=$('news');if(!s||!window.NEWS)return;
  const k=s.dataset.k,all=k==='*',L=newsList(k).slice(0,all?4:5);
  if(!L.length){s.remove();return}
  const pre=_npre(),tp=NEWS_TOPICS[k];
  s.innerHTML=`<div class="nb-h"><div><h2>📰 ${all?'最新媒體報導':'媒體報導精選'}</h2>
<p class="note">${all?'':`與「${tp?tp[0]:''}」相關、`}精選天下雜誌、經理人、商業周刊、遠見雜誌、今周刊近半年的報導・更新於 ${_nesc(NEWS.updated)}</p></div>
<a class="nb-all" href="${pre}news/">看全部精選報導 →</a></div>
<div class="nl">${L.map(x=>newsCard(x,all)).join('')}</div>
<p class="ncopy">© ${NEWS_COPYRIGHT}</p>`;
})();

/* 列印報表：列印前（按鈕或 Ctrl+P）即時組出白底報表，列印時只印報表 */
function buildReport(){
  const res=document.querySelector('.res');if(!res)return;
  let r=$('report');if(!r){r=document.createElement('section');r.id='report';document.body.appendChild(r)}
  const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const h=document.querySelector('h1').textContent,now=new Date(),logo=(document.querySelector('.logo img')||{}).src||'';
  const rows=[...document.querySelectorAll('main .card .grid > div')].map(d=>{
    const i=d.querySelector('input,select');if(!i||!i.id||i.type==='checkbox')return'';
    const lab=_lab(i.id);let v=i.tagName==='SELECT'?i.options[i.selectedIndex].text:i.value;
    const n=parseFloat(v);if(i.type==='number'&&!isNaN(n)&&Math.abs(n)>=1000&&!/出生年/.test(lab))v=n.toLocaleString('zh-TW');
    return `<div><span>${esc(lab)}</span><b>${esc(v||'—')}</b></div>`}).join('');
  const c=res.cloneNode(true);c.querySelectorAll('.act,.tips').forEach(e=>e.remove());c.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));
  const tp=[...document.querySelectorAll('#tips .tip')].map(t=>`<li class="${t.className}">${t.innerHTML}</li>`).join('');
  const extra=[...document.querySelectorAll('main > .card')].slice(1).map(k=>{const x=k.cloneNode(true);x.querySelectorAll('[id]').forEach(e=>e.removeAttribute('id'));
    x.querySelectorAll('input[type=checkbox]').forEach((b,j)=>{const o=k.querySelectorAll('input[type=checkbox]')[j];b.replaceWith(document.createTextNode(o&&o.checked?'☑ ':'☐ '))});return x.outerHTML}).join('');
  r.innerHTML=`<div class="rp-top"><span class="rp-brand">${logo?`<img src="${logo}" alt="">`:''}勞工權益計算機</span><span>產生日期：${now.toLocaleDateString('zh-TW')} ${now.toLocaleTimeString('zh-TW',{hour:'2-digit',minute:'2-digit'})}</span></div>
<h1>${esc(h)}　試算報表</h1>
<h2>輸入資料</h2><div class="rp-in">${rows}</div>
<h2>試算結果</h2>${c.outerHTML}
${tp?`<h2>提醒與建議</h2><ul class="rp-tips">${tp}</ul>`:''}
${extra}
<p class="rp-foot">本報表由「勞工權益計算機」產生（${esc(location.href.split('?')[0])}）。試算結果僅供參考，實際金額以勞動部、勞保局公告及雇主核定為準${/budget|pension/.test(location.pathname)?'；理財內容為一般性觀念，不構成投資建議':''}。</p>`;
}
addEventListener('beforeprint',buildReport);

/* 提示條：list = [[id, 等級(ok/info/warn/alert/danger), 文字], ...]，只有新出現或等級改變的才會播放動畫 */
function tips(list){
  const box=$('tips');if(!box)return;const keep=new Set();list=[..._over,...list];
  list.forEach(([id,lv,t],i)=>{
    keep.add(id);let el=box.querySelector(`[data-id="${id}"]`);
    if(!el){el=document.createElement('div');el.dataset.id=id;el.className='tip '+lv;el.dataset.lv=lv}
    else if(el.dataset.lv!==lv){el.dataset.lv=lv;el.className='tip '+lv;void el.offsetWidth;el.classList.add('flash')}
    if(el._t!==t){el._t=t;el.innerHTML=t}
    if(box.children[i]!==el)box.insertBefore(el,box.children[i]||null);
  });
  [...box.children].forEach(c=>{if(!keep.has(c.dataset.id))c.remove()});
}

/* 彩帶慶祝：條件從「否」變成「是」時放一次；onLoad=true 時，一打開頁面就符合也會放 */
function confetti(){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const c=document.createElement('canvas');c.style.cssText='position:fixed;inset:0;pointer-events:none;z-index:99';document.body.appendChild(c);
  const x=c.getContext('2d'),W=c.width=innerWidth,H=c.height=innerHeight,col=['#4cc9f0','#8b7bff','#ffb347','#7cffb2','#ff6b9a'];
  const P=Array.from({length:150},()=>({x:W/2+(Math.random()-.5)*W*.3,y:H*.38,vx:(Math.random()-.5)*15,vy:-Math.random()*15-5,s:Math.random()*6+5,r:Math.random()*6,vr:(Math.random()-.5)*.3,c:col[Math.random()*5|0]}));
  const t0=performance.now();
  (function f(now){x.clearRect(0,0,W,H);P.forEach(p=>{p.vy+=.35;p.vx*=.99;p.x+=p.vx;p.y+=p.vy;p.r+=p.vr;x.save();x.translate(p.x,p.y);x.rotate(p.r);x.fillStyle=p.c;x.fillRect(-p.s/2,-p.s/4,p.s,p.s/2);x.restore()});
    if(now-t0<2400)requestAnimationFrame(f);else c.remove()})(t0);
}
const _cel={};
function celebrate(k,cond,onLoad){if(!(k in _cel)){_cel[k]=cond;if(cond&&onLoad)confetti();return}if(cond&&!_cel[k])confetti();_cel[k]=cond}

/* 結果數字滾動動畫：.big 內容一變動，數字就從舊值滾到新值，並發光一下 */
(()=>{
  const RE=/-?\d[\d,]*(\.\d+)?/;
  const reduce=matchMedia('(prefers-reduced-motion: reduce)').matches;
  const parse=t=>{const m=String(t).match(RE);return m?parseFloat(m[0].replace(/,/g,'')):null};
  function run(el){
    const target=el.textContent;
    if(target===el._shown)return;
    const to=parse(target),from=el._val??0;
    el.classList.remove('pop');void el.offsetWidth;el.classList.add('pop');
    cancelAnimationFrame(el._raf);
    if(to===null||reduce){el._val=to??0;el._shown=target;return}
    const m=target.match(RE),dec=m[1]?m[1].length-1:0,t0=performance.now(),dur=650;
    const step=now=>{
      const p=Math.min((now-t0)/dur,1),e=1-Math.pow(1-p,3),v=from+(to-from)*e;
      el._val=v;
      el._shown=p<1?target.replace(RE,v.toLocaleString('zh-TW',{minimumFractionDigits:dec,maximumFractionDigits:dec})):target;
      el.textContent=el._shown;
      if(p<1)el._raf=requestAnimationFrame(step);else el._val=to;
    };
    el._raf=requestAnimationFrame(step);
  }
  const init=()=>document.querySelectorAll('.big').forEach(el=>{
    run(el);
    new MutationObserver(()=>run(el)).observe(el,{childList:true,characterData:true,subtree:true});
  });
  document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
