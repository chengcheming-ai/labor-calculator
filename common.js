const $=id=>document.getElementById(id);
const num=id=>{const v=parseFloat(String($(id).value).replace(/,/g,''));return isNaN(v)?0:v};
const fmt=n=>Math.round(n).toLocaleString('zh-TW');
function bind(fn){document.querySelectorAll('input,select').forEach(e=>e.addEventListener('input',fn));fn()}

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
