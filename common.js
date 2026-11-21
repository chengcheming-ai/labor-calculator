const $=id=>document.getElementById(id);
const num=id=>{const v=parseFloat(String($(id).value).replace(/,/g,''));return isNaN(v)?0:v};
const fmt=n=>Math.round(n).toLocaleString('zh-TW');
function bind(fn){document.querySelectorAll('input,select').forEach(e=>e.addEventListener('input',fn));fn()}
