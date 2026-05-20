if (localStorage.getItem('theme') === 'light') {
    document.documentElement.classList.add('light-mode');
}

function safeJSON(str, fallback) {
    if (!str || str === 'undefined') return fallback;
    try {
        const parsed = JSON.parse(str);
        return parsed !== null ? parsed : fallback;
    } catch (e) { return fallback; }
}

let RAW=[], KALIP_RAW=[], DENEME_RAW={h:[], r:[]}, MALZEME_RAW={h:[], r:[]}, MESAJ_RAW={h:[], r:[]}, DATES=[], MONTHS=[], WEEKS=[], charts={}, sD='', sM='', sW='', cTab='gunluk';
let recsModalData = [], recsModalTitle = '';
window.bestEmpName = ''; // Ayın elemanı global kayıt
let LOGGED_IN_USER = null;
let USER_DATA = {};
let adminSettings = safeJSON(localStorage.getItem('adminSettings'), { hiddenTabs: [] });
if (!adminSettings || !Array.isArray(adminSettings.hiddenTabs)) adminSettings = { hiddenTabs: [] };

// URL Parametrelerini Yakala (PWA Kısayolları İçin)
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('tab')) cTab = urlParams.get('tab');

const SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbxksyktK3Fu55_ub_5Pq-m3BDx1sPeuKRYsCH1iulwy93Esg5kRL2hHjD1l5joRVX0G4w/exec'; // Apps Script Web App linkini buraya yapıştırın

// PRES MALZEME TAKİP DOSYASININ ID'Sİ (Veya Tam Linki)
const MALZEME_DOC_ID = '1ATveln1EB7AkFBLHTWSNm0nt8U4syYNYEgfRYHwDg7c'; 
 
// Akıllı ID Çıkarıcı: Eğer yanlışlıkla tüm link yapıştırılırsa sistemi çökertmemesi için sadece ID'yi filtreler.
const matchMalz = MALZEME_DOC_ID.match(/\/d\/([a-zA-Z0-9-_]+)/);
const extMalzemeId = matchMalz ? matchMalz[1] : MALZEME_DOC_ID;

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1ATveln1EB7AkFBLHTWSNm0nt8U4syYNYEgfRYHwDg7c/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent('veri sayfası');
const KALIP_URL = 'https://docs.google.com/spreadsheets/d/1ATveln1EB7AkFBLHTWSNm0nt8U4syYNYEgfRYHwDg7c/gviz/tq?tqx=out:csv&sheet=Kalıphane+Lokasyonları';
const DENEME_URL = 'https://docs.google.com/spreadsheets/d/1ATveln1EB7AkFBLHTWSNm0nt8U4syYNYEgfRYHwDg7c/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent('Üretim Takip Denemeleri');
const MALZEME_URL = 'https://docs.google.com/spreadsheets/d/' + extMalzemeId + '/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent('Pres Malzeme Takip Listesi');
const USERS_URL = 'https://docs.google.com/spreadsheets/d/1ATveln1EB7AkFBLHTWSNm0nt8U4syYNYEgfRYHwDg7c/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent('Çalışanlar');
const MESAJ_URL = 'https://docs.google.com/spreadsheets/d/1ATveln1EB7AkFBLHTWSNm0nt8U4syYNYEgfRYHwDg7c/gviz/tq?tqx=out:csv&sheet=' + encodeURIComponent('Mesajlar');

// FORM İÇİN SABİT TANIMLAR (Kendinize Göre Değiştirebilirsiniz)
const SABIT_CALISANLAR = ["Yusuf Yalçıntaş"];
const SABIT_PRESLER = ["PRES 1", "PRES 2", "PRES 3", "PRES 4", "PRES 5"];
const SABIT_FASONLAR = ["FASON 1", "FASON 2", "FASON 3"];

function $(id){return document.getElementById(id);}
function n(v){const val=Number(v)||0; return val>0?val.toLocaleString('tr-TR'):'-';}
function pb(p){const val=Number(p)||0; const c=val>=120?'bg-accent/20 text-accent':val>=90?'bg-accent4/20 text-accent4':val>=70?'bg-accent2/20 text-accent2':'bg-accent3/20 text-accent3'; return `<span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${c}">${val.toFixed(1)}%</span>`;}
function isoW(d){const[D,M,Y]=d.split('.').map(Number);const dt=new Date(Y,M-1,D);dt.setDate(dt.getDate()+4-(dt.getDay()||7));return `${dt.getFullYear()}-W${String(Math.ceil((((dt-new Date(dt.getFullYear(),0,1))/86400000)+1)/7)).padStart(2,'0')}`;}
function calc(arr){return{u:arr.reduce((s,r)=>s+r.tU,0),b:arr.reduce((s,r)=>s+r.tB,0),p:arr.length?arr.reduce((s,r)=>s+r.tP,0)/arr.length:0,d:arr.reduce((s,r)=>s+r.durus1+r.durus2,0),c:arr.length};}
const cR=(v,a=1)=>`rgba(${getComputedStyle(document.documentElement).getPropertyValue('--c-'+v).trim()},${a})`;

// YENİ: Gelişmiş Fetch (CORS ve HTML Yönlendirme Korumalı)
async function getCSV(url) {
    const proxyUrl = 'https://api.allorigins.win/raw?url=' + encodeURIComponent(url);
    try {
        let r = await fetch(url, {cache: 'no-store'});
        let t = await r.text();
        if(t.match(/<html/i) || t.match(/<!DOCTYPE/i)) throw new Error('HTML Redirect');
        return t;
    } catch(e) {
        let r = await fetch(proxyUrl, {cache: 'no-store'});
        let t = await r.text();
        if(t.match(/<html/i) || t.match(/<!DOCTYPE/i)) throw new Error('Proxy HTML Redirect');
        return t;
    }
}

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function safeAttr(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// TOAST BİLDİRİM
function toast(msg, type='ok') {
    const t = document.createElement('div');
    t.className = `toast-el toast-${type}`;
    t.innerHTML = (type==='ok'?'✔ ':type==='err'?'✘ ':'⚠ ') + msg;
    t.style.cssText = 'opacity:0;transform:translateY(8px)';
    document.body.appendChild(t);
    requestAnimationFrame(() => { t.style.opacity='1'; t.style.transform='translateY(0)'; });
    setTimeout(() => { t.style.opacity='0'; setTimeout(()=>t.remove(),350); }, 3500);
}

// Renklendirilmiş & Sabit (Sticky) Tablo Başlıkları
const thD=(cols)=>`<tr>${cols.map((c,i)=>{ let cls="sticky-th p-2 text-left font-mono text-[10px] border-b border-border uppercase whitespace-nowrap"; if(i>=3&&i<=8) cls+=" kafa1-th"; else if(i>=9&&i<=14) cls+=" kafa2-th"; else cls+=" text-text3 th-bg"; return `<th class="${cls}">${c}</th>`; }).join('')}</tr>`;
const trD=(cols)=>`<tr class="hover:bg-bg3/50 transition-colors border-b border-border/50 text-[11px] md:text-xs">${cols.map((c,i)=>{ let cls="p-2 whitespace-nowrap"; if(i>=3&&i<=8) cls+=" kafa1"; else if(i>=9&&i<=14) cls+=" kafa2"; return `<td class="${cls}">${c}</td>`; }).join('')}</tr>`;
const th=(cols)=>`<tr>${cols.map(c=>`<th class="sticky-th p-3 text-left font-sans font-semibold text-[11px] tracking-wider text-text3 border