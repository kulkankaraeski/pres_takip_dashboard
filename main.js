// Chrome eklentileri / üçüncü taraf içerikleri kaynaklı gürültülü Promise hatalarını (ör. content.js, message channel kapanması)
// konsolda göstermemek ve uygulama içi gerçek hataları korumak için filtrele.
function isLikelyNoisePromiseReason(reason) {
    if (!reason) return true;

    const safeText = (value) => {
        if (typeof value === 'string') return value;
        if (value instanceof Error) return `${value.message || ''}\n${value.stack || ''}`;
        if (value && typeof value === 'object') {
            if (typeof value.message === 'string') return `${value.message}\n${value.stack || ''}\n${JSON.stringify(value)}`;
            return String(value);
        }
        return String(value);
    };

    const text = safeText(reason).toLowerCase();
    return text.includes('content.js') ||
        text.includes('chrome-extension://') ||
        text.includes('a listener indicated an asynchronous response by returning true') ||
        text.includes('message channel closed before a response was received') ||
        text === '[object object]';
}

window.addEventListener('unhandledrejection', function(event) {
    if (isLikelyNoisePromiseReason(event.reason)) {
        event.preventDefault();
    }
});

window.addEventListener('error', function(event) {
    if (isLikelyNoisePromiseReason(event.error || event.message || event.reason)) {
        event.preventDefault();
    }
});

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

let RAW=[], KALIP_RAW=[], DENEME_RAW={h:[], r:[]}, MALZEME_RAW={h:[], r:[]}, MESAJ_RAW={h:[], r:[]}, DATES=[], MONTHS=[], WEEKS=[], charts={}, sD='', sM='', sW='', sA='', cTab='';
let recsModalData = [], recsModalTitle = '';
window.bestEmpName = ''; // Ayın elemanı global kayıt
let LOGGED_IN_USER = null;
let USER_DATA = {};
let adminSettings = safeJSON(localStorage.getItem('adminSettings'), { hiddenTabs: [] });
if (!adminSettings || !Array.isArray(adminSettings.hiddenTabs)) adminSettings = { hiddenTabs: [] };

// URL Parametrelerini Yakala (PWA Kısayolları İçin)
const urlParams = new URLSearchParams(window.location.search);
if (urlParams.has('tab')) cTab = urlParams.get('tab');

// GÜVENLİK: API Anahtarları ve URL'ler
const CONFIG = {
    IMGBB_API_KEY: '5a415a77f3a97bd7118eb38012bfba91', // imgbb.com'dan alınan key
    SCRIPT_URL: 'https://script.google.com/macros/s/AKfycbxksyktK3Fu55_ub_5Pq-m3BDx1sPeuKRYsCH1iulwy93Esg5kRL2hHjD1l5joRVX0G4w/exec'
};
const SCRIPT_URL = CONFIG.SCRIPT_URL; 

// PRES MALZEME TAKİP DOSYASININ ID'Sİ (Veya Tam Linki)
const MALZEME_DOC_ID = '1ATveln1EB7AkFBLHTWSNm0nt8U4syYNYEgfRYHwDg7c'; 
 
// Akıllı ID Çıkarıcı: Eğer yanlışlıkla tüm link yapıştırılırsa sistemi çökertmemesi için sadece ID'yi filtreler.
const matchMalz = MALZEME_DOC_ID.match(/\/d\/([a-zA-Z0-9-_]+)/);
const extMalzemeId = matchMalz ? matchMalz[1] : MALZEME_DOC_ID;

const SHEET_URL = 'https://docs.google.com/spreadsheets/d/1ATveln1EB7AkFBLHTWSNm0nt8U4syYNYEgfRYHwDg7c/export?format=csv&sheet=' + encodeURIComponent('veri sayfası');
const KALIP_URL = 'https://docs.google.com/spreadsheets/d/1ATveln1EB7AkFBLHTWSNm0nt8U4syYNYEgfRYHwDg7c/export?format=csv&sheet=' + encodeURIComponent('Kalıphane Lokasyonları');
const DENEME_URL = 'https://docs.google.com/spreadsheets/d/1ATveln1EB7AkFBLHTWSNm0nt8U4syYNYEgfRYHwDg7c/export?format=csv&sheet=' + encodeURIComponent('Üretim Takip Denemeleri');
const MALZEME_URL = 'https://docs.google.com/spreadsheets/d/' + extMalzemeId + '/export?format=csv&gid=959090458';
const USERS_URL = 'https://docs.google.com/spreadsheets/d/1ATveln1EB7AkFBLHTWSNm0nt8U4syYNYEgfRYHwDg7c/export?format=csv&sheet=' + encodeURIComponent('Çalışanlar');
const MESAJ_URL = 'https://docs.google.com/spreadsheets/d/1ATveln1EB7AkFBLHTWSNm0nt8U4syYNYEgfRYHwDg7c/export?format=csv&sheet=' + encodeURIComponent('Mesajlar');
const FASONLAR_URL = 'https://docs.google.com/spreadsheets/d/1ATveln1EB7AkFBLHTWSNm0nt8U4syYNYEgfRYHwDg7c/export?format=csv&sheet=Fasonlar';

let FASONLAR_RAW = [];


function $(id){return document.getElementById(id);}
function n(v){const val=Number(v)||0; return val>0?val.toLocaleString('tr-TR'):'-';}
function pb(p){const val=Number(p)||0; const c=val>=120?'bg-accent/20 text-accent':val>=90?'bg-accent4/20 text-accent4':val>=70?'bg-accent2/20 text-accent2':'bg-accent3/20 text-accent3'; return `<span class="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold ${c}">${val.toFixed(1)}%</span>`;}
function isoW(d){const[D,M,Y]=d.split('.').map(Number);const dt=new Date(Y,M-1,D);dt.setDate(dt.getDate()+4-(dt.getDay()||7));return `${dt.getFullYear()}-W${String(Math.ceil((((dt-new Date(dt.getFullYear(),0,1))/86400000)+1)/7)).padStart(2,'0')}`;}
function calc(arr){const u=arr.reduce((s,r)=>s+r.tU,0);const b=arr.reduce((s,r)=>s+r.tB,0);return{u:u,b:b,p:b>0?(u/b)*100:(arr.length?arr.reduce((s,r)=>s+r.tP,0)/arr.length:0),d:arr.reduce((s,r)=>s+r.durus1+r.durus2,0),c:arr.length};}
const cR=(v,a=1)=>`rgba(${getComputedStyle(document.documentElement).getPropertyValue('--c-'+v).trim()},${a})`;

function normalizeText(value) {
    return String(value || '')
        .replace(/\u00A0/g, ' ')
        .trim()
        .replace(/[ıİ]/g, 'i')
        .replace(/[şŞ]/g, 's')
        .replace(/[ğĞ]/g, 'g')
        .replace(/[üÜ]/g, 'u')
        .replace(/[öÖ]/g, 'o')
        .replace(/[çÇ]/g, 'c')
        .normalize('NFKD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .replace(/\s+/g, ' ');
}

function normalizeField(value) {
    return String(value || '')
        .replace(/\u00A0/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

const ROLE_OPTIONS = {
    admin: { label: 'YÖNETİCİ', isAdmin: true, shortLabel: 'YÖNETİCİ', tooltip: 'Tam yetki: Tüm sayfalara erişim, ekleme/silme/düzenleme' },
    user: { label: 'ÜYE', isAdmin: false, shortLabel: 'ÜYE', tooltip: 'Sınırlı yetki: Sadece veri girişi ve atanmış formlar' },
    planlama: { label: 'PLANLAMA', isAdmin: false, shortLabel: 'PLANLAMA', tooltip: 'Kısıtlı yetki: Sadece veri girişi ve atanmış raporlar' },
    misafir: { label: 'MİSAFİR', isAdmin: false, shortLabel: 'MİSAFİR', tooltip: 'Kısıtlı yetki: Sadece veri girişi ve atanmış raporlar' },
    operator: { label: 'OPERATÖR', isAdmin: false, shortLabel: 'OPERATÖR', tooltip: 'Kısıtlı yetki: Sadece veri girişi ve atanmış raporlar' }
};

function normalizeRole(value) {
    const normalized = normalizeText(value || 'user');
    if (normalized.includes('yonetici') || normalized.includes('admin')) return 'admin';
    if (normalized.includes('planlama') || normalized === 'plan' || normalized === 'planner') return 'planlama';
    if (normalized.includes('misafir') || normalized === 'guest' || normalized === 'ziyaretci') return 'misafir';
    if (normalized.includes('operator') || normalized === 'operat' || normalized === 'op') return 'operator';
    if (normalized.includes('uye') || normalized.includes('user') || normalized === 'personel' || normalized === 'calisan' || normalized === 'normal') return 'user';
    return 'user';
}

function getRoleMeta(role) {
    return ROLE_OPTIONS[normalizeRole(role)] || ROLE_OPTIONS.user;
}

function renderRoleBadge(role, compact = false) {
    const meta = getRoleMeta(role);
    if (compact) {
        return meta.isAdmin
            ? `<span class="px-2 py-0.5 bg-accent/20 text-accent rounded-full text-[10px] font-bold cursor-help" title="${meta.tooltip}">${meta.shortLabel}</span>`
            : `<span class="px-2 py-0.5 bg-bg border border-border text-text3 rounded-full text-[10px] cursor-help" title="${meta.tooltip}">${meta.shortLabel}</span>`;
    }
    return meta.isAdmin
        ? `<span class="text-[10px] bg-accent/20 text-accent px-1.5 py-0.5 rounded font-bold ml-2 cursor-help" title="${meta.tooltip}">${meta.shortLabel}</span>`
        : `<span class="text-[10px] bg-bg text-text3 px-1.5 py-0.5 rounded ml-2 border border-border cursor-help" title="${meta.tooltip}">${meta.shortLabel}</span>`;
}

function roleLabel(role) {
    return getRoleMeta(role).label;
}

function normalizeUserRoles() {
    Object.keys(USER_DATA || {}).forEach(name => {
        if (USER_DATA[name]) {
            USER_DATA[name].role = normalizeRole(USER_DATA[name].role);
        }
    });
}

function normalizeFasonKey(value) {
    return normalizeText(value).replace(/[^a-z0-9]+/g, '');
}

function addFasonToMap(map, value) {
    const label = normalizeField(value);
    if (!label) return;
    const key = normalizeFasonKey(label);
    if (!key || map.has(key)) return;
    map.set(key, label);
}

function getFasonNameMap() {
    const map = new Map();
    RAW.forEach(r => {
        [1, 2].forEach(i => {
            addFasonToMap(map, r['fason' + i]);
        });
    });

    if (Array.isArray(FASONLAR_RAW)) {
        FASONLAR_RAW.forEach((row, rowIdx) => {
            if (!Array.isArray(row)) return;
            if (rowIdx === 0) {
                const h0 = normalizeText(row[0] || '');
                const h1 = normalizeText(row[1] || '');
                const h2 = normalizeText(row[2] || '');
                if (h0.includes('fason') || h1.includes('fason') || h2.includes('iscilik')) return;
            }
            addFasonToMap(map, row[1]);
            addFasonToMap(map, row[0]);
        });
    }

    return map;
}

function resolveFasonInput(rawInput) {
    const display = normalizeField(rawInput);
    if (!display) return null;

    const inputKey = normalizeFasonKey(display);
    if (!inputKey) return { key: '', name: display };

    const nameMap = getFasonNameMap();
    if (nameMap.has(inputKey)) {
        return { key: inputKey, name: nameMap.get(inputKey) };
    }

    const normalizedDisplay = normalizeText(display);
    
    // 1. Önce tam eşleşme
    for (const [k, n] of nameMap.entries()) {
        const normName = normalizeText(n);
        if (k === inputKey || normName === normalizedDisplay) {
            return { key: k, name: n };
        }
    }

    // 2. Kullanıcının yazdığı, gerçek fason adının bir parçasıysa
    for (const [k, n] of nameMap.entries()) {
        const normName = normalizeText(n);
        if (k.includes(inputKey) || normName.includes(normalizedDisplay)) {
            return { key: k, name: n };
        }
    }

    // 3. Gerçek fason adı, kullanıcının yazdığının bir parçasıysa (Çok kısa ID'lerin 18cp27 gibi isimleri yutmasını önlemek için 3 karakter sınırı konuldu)
    for (const [k, n] of nameMap.entries()) {
        const normName = normalizeText(n);
        if ((k.length > 3 && inputKey.includes(k)) || (normName.length > 3 && normalizedDisplay.includes(normName))) {
            return { key: k, name: n };
        }
    }

    return { key: inputKey, name: display };
}

// YENİ: Gelişmiş Fetch (CORS ve HTML Yönlendirme Korumalı)
let __GVIZ_QUEUE = Promise.resolve();

function toGVizJSON(url) {
    let u = String(url || '').replace(/&_t=[^&]+/g, '');
    if (u.includes('tqx=')) {
        u = u.replace(/tqx=out:[^&]*/i, 'tqx=out:json');
    } else {
        u += (u.includes('?') ? '&' : '?') + 'tqx=out:json';
    }
    return u;
}

function csvEscape(v) {
    if (v === null || v === undefined) return '';
    const s = String(v).replace(/\r/g, '').replace(/\n/g, ' ');
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

function gvizTableToCSV(payload) {
    const cols = (payload?.table?.cols) || [];
    const rows = (payload?.table?.rows) || [];
    if (!cols.length) return '';

    const headers = cols.map(c => String(c.label || c.id || ''));
    const csvRows = [headers.map(csvEscape).join(',')];

    for (const row of rows) {
        const cells = row?.c || [];
        const line = cols.map((_, i) => {
            const cell = cells[i];
            if (!cell) return '';
            if (cell.f !== undefined && cell.f !== null && String(cell.f) !== '') return csvEscape(cell.f);
            return csvEscape(cell.v);
        });
        csvRows.push(line.join(','));
    }
    return csvRows.join('\n');
}

async function getCSVFromGVizScript(url) {
    const jsonUrl = toGVizJSON(url);
    const run = () => new Promise((resolve, reject) => {
        const prevSetResponse = window.google?.visualization?.Query?.setResponse;
        const g = window.google = window.google || {};
        const viz = g.visualization = g.visualization || {};
        const query = viz.Query = viz.Query || {};
        const state = { settled: false, timeout: null, script: null, query };

        const cleanup = () => {
            if (state.timeout) clearTimeout(state.timeout);
            if (state.script?.parentNode) state.script.parentNode.removeChild(state.script);
            if (state.query && state.query.setResponse === onResponse) {
                if (prevSetResponse) {
                    state.query.setResponse = prevSetResponse;
                } else {
                    delete state.query.setResponse;
                }
            }
        };

        const finish = (ok, value) => {
            if (state.settled) return;
            state.settled = true;
            cleanup();
            ok ? resolve(value) : reject(value);
        };

        const onResponse = (payload) => {
            if (!payload || payload.status !== 'ok') {
                finish(false, new Error('Google Sheet görselleştirme hatası: ' + (payload?.errors?.[0]?.detailed_message || payload?.status || 'Bilinmiyor')));
                return;
            }
            try {
                const csv = gvizTableToCSV(payload);
                if (!csv) {
                    finish(false, new Error('Google Sheet görselleştirme yanıtında veri bulunamadı.'));
                    return;
                }
                finish(true, csv);
            } catch (e) {
                finish(false, e);
            }
        };

        try {
            state.timeout = setTimeout(() => {
                finish(false, new Error('Google Sheet görselleştirme yanıtı zaman aşımına uğradı.'));
            }, 7000);

            query.setResponse = onResponse;

            const script = document.createElement('script');
            script.src = jsonUrl;
            script.async = true;
            state.script = script;

            script.onerror = () => {
                finish(false, new Error('Google Sheet görselleştirme scripti yüklenemedi.'));
            };
            script.onload = () => {
                if (!state.settled) {
                    finish(false, new Error('Google Sheet görselleştirme yanıtı alınamadı.'));
                }
            };

            document.head.appendChild(script);
        } catch (e) {
            finish(false, e);
        }
    });

    const chained = __GVIZ_QUEUE.then(run);
    __GVIZ_QUEUE = chained.catch(() => {});
    return chained;
}

async function getCSV(url) {
    const proxies = [
        '', // Önce doğrudan istek
        'https://corsproxy.io/?url=',
        'https://api.allorigins.win/raw?url=',
        'https://thingproxy.freeboard.io/fetch/'
    ];

    if (typeof url === 'string' && url.includes('/gviz/tq')) {
        try {
            return await getCSVFromGVizScript(url);
        } catch (e) {
            console.warn('GViz script fallback başarısız oldu, proxy zinciri deneniyor:', e.message);
        }
    }

    const normalizeTextPayload = (text) => {
        if (!text || typeof text !== 'string') return '';
        let t = text.trim();
        if (t.startsWith('{')) {
            try {
                const parsed = JSON.parse(t);
                t = (parsed.contents || parsed.data?.contents || '').trim();
            } catch {}
        }
        if (t.includes('<html') || t.includes('<!DOCTYPE')) return '';
        return t;
    };

    const looksLikeCSV = (text) => {
        const normalized = (text || '').trim();
        if (!normalized) return false;
        const firstLine = normalized.split(/\r?\n/)[0].trim();
        if (!firstLine || firstLine.startsWith('URL Source:') || firstLine.startsWith('Title:')) return false;
        return firstLine.includes(',') || firstLine.includes('\t');
    };

    let lastErr;
    for (let i = 0; i < proxies.length; i++) {
        const proxyUrl = (() => {
            const p = proxies[i];
            if (!p) return url;
            return p + encodeURIComponent(url);
        })();

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 saniye zaman aşımı (uzatıldı)

            let r = await fetch(proxyUrl, {cache: 'no-store', signal: controller.signal});
            clearTimeout(timeoutId);

            if (!r.ok) {
                lastErr = new Error('HTTP ' + r.status);
                continue;
            }
            let t = normalizeTextPayload(await r.text());
            if (!looksLikeCSV(t)) {
                lastErr = new Error('Geçersiz Veri Formatı');
                continue;
            }
            return t;
        } catch(e) {
            lastErr = e;
        }
    }
    throw new Error('Ağ hatası veya veri erişimi sağlanamadı: ' + (lastErr ? lastErr.message : ''));
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
const th=(cols)=>`<tr>${cols.map(c=>`<th class="sticky-th p-3 text-left font-sans font-semibold text-[11px] tracking-wider text-text3 border-b border-border uppercase whitespace-nowrap th-bg bg-bg2/95 backdrop-blur">${c}</th>`).join('')}</tr>`;
const tr=(cols)=>`<tr class="hover:bg-bg3/50 transition-colors border-b border-border/50 text-xs">${cols.map(c=>`<td class="p-3 whitespace-nowrap">${c}</td>`).join('')}</tr>`;
const card=(c,l,v,s,clk='')=>`<div ${clk?`onclick="${clk}"`:''} class="bg-bg2/80 backdrop-blur-sm border border-border/60 border-l-4 ${c} rounded-2xl p-5 shadow-md ${clk?'cursor-pointer hover:bg-bg3 hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group':''}"><div class="font-sans font-semibold text-[11px] tracking-wider uppercase text-text2 ${clk?'group-hover:text-text':''}">${l}</div><div class="font-mono text-2xl md:text-3xl font-bold ${l.includes('Duruş') ? 'text-accent2' : 'text-text'} my-1.5">${v}</div><div class="text-[10px] text-text3 font-medium">${s}</div></div>`;

// Tıklanabilir Grafikler
function mc(id,t,d,o={}){
    if(charts[id])charts[id].destroy();
    const el=$(id);
    // FIX #2 guard: canvas elementi yoksa hata fırlatma
    if(!el) { console.warn('mc(): canvas bulunamadı → id='+id); return; }
    const c={
        responsive:true,maintainAspectRatio:false, animation: { duration: 800, easing: 'easeOutQuart' },
                onClick: (e, elements, chartInstance) => {
                    const chart = chartInstance || charts[id];
                    if(elements && elements.length > 0 && chart) { 
                        const idx = elements[0].index !== undefined ? elements[0].index : elements[0]._index;
                        if(idx !== undefined && chart.data.labels && chart.data.labels[idx] !== undefined) {
                            const label = String(chart.data.labels[idx]); 
                            handleChartClick(id, label); 
                        }
                    }
                },
        plugins:{legend:{labels:{color:cR('text3'),font:{family:"'Inter'",size:11, weight: '500'}}}},
        scales:{x:{grid:{color:cR('border',0.4), drawBorder: false},ticks:{color:cR('text3'),font:{family:"'Inter'",size:10}}},y:{grid:{color:cR('border',0.4), drawBorder: false},ticks:{color:cR('text3'),font:{family:"'Inter'",size:10}}}}
    }; 
    if(o.y)c.scales.y=o.y; if(o.x)c.scales.x=o.x; if(o.idx)c.indexAxis=o.idx; 
    charts[id]=new Chart(el,{type:t,data:d,options:c});
}

function swT(t,el){
    cTab=t;

    const appMain = $('app-main');
    if(appMain) {
            appMain.classList.add('overflow-y-auto');
            appMain.classList.remove('overflow-hidden');
    }

    const appHeader = $('app-header');

    if (!t) {
        const url = new URL(window.location.href);
        url.searchParams.delete('tab');
        window.history.replaceState({}, '', url);
        document.querySelectorAll('.panel').forEach(e=>{e.classList.remove('active','block');e.classList.add('hidden');});
        document.querySelectorAll('.nav-tab').forEach(e => e.classList.remove('nav-active'));
        $('main-nav').style.display = 'grid'; // Grid olduğu için flex yerine grid diyoruz
        const mArea = $('main-content-area'); if(mArea) mArea.style.display = 'none';
        if ($('back-btn-container')) $('back-btn-container').classList.add('hidden');
        if ($('back-btn-container')) $('back-btn-container').classList.remove('flex');
        if (appHeader) {
            appHeader.classList.remove('hidden');
            appHeader.classList.add('flex');
        }
        return;
    }

    const url = new URL(window.location.href);
    url.searchParams.set('tab', t);
    window.history.replaceState({}, '', url);

    document.querySelectorAll('.panel').forEach(e=>{e.classList.remove('active','block');e.classList.add('hidden');});
    document.querySelectorAll('.nav-tab').forEach(e => e.classList.remove('nav-active'));
    if(!el) el = document.querySelector(`.nav-tab[onclick*="'${t}'"]`);
    if(el) el.classList.add('nav-active');

    const p=$('panel-'+t); if(p){p.classList.remove('hidden'); setTimeout(()=>p.classList.add('active'),10);}

    // Hide main-nav and show back button
    $('main-nav').style.display = 'none';
    const mArea = $('main-content-area'); if(mArea) mArea.style.display = 'flex';
    if ($('back-btn-container')) {
        $('back-btn-container').classList.remove('hidden');
        $('back-btn-container').classList.add('flex');
    }
    
    if (appHeader) {
        appHeader.classList.add('hidden');
        appHeader.classList.remove('flex');
    }

        if(t==='kaliphane') rKaliphane();
        if(t==='malzeme') rMalzeme();
        if(t==='kayitlar') rKayitlar();        if(t==='plan') rPlan(); 
        if(t==='admin') rAdmin();
        if(t==='verisayfasi') rVerisayfasi();
        
    if(!RAW.length)return;
        if(t==='gunluk')rG(); if(t==='haftalik')rW(); if(t==='aylik')rM(); if(t==='genel')rH(); if(t==='alarm')rAlarm(); if(t==='calisan')rC(); if(t==='pres')rP(); if(t==='fason')rF(); 
}

// Tema Değiştirme
function toggleTheme() {
    document.documentElement.classList.toggle('light-mode');
    const isLight = document.documentElement.classList.contains('light-mode');
    localStorage.setItem('theme', isLight ? 'light' : 'dark');

    const activeNavEl = document.querySelector(`.nav-tab[onclick*="'${cTab}'"]`);
    if(RAW.length) swT(cTab, activeNavEl || document.querySelector('.nav-tab'));
}

function rVerisayfasi() {
    if (!window.RAW_CSV_ROWS || window.RAW_CSV_ROWS.length === 0) {
        $('th-verisayfasi').innerHTML = '';
        $('tb-verisayfasi').innerHTML = '<tr><td class="p-4 text-center text-text3">Henüz veri yok.</td></tr>';
        return;
    }
    const headers = window.RAW_CSV_ROWS[0];
    const rows = window.RAW_CSV_ROWS.slice(1);
    
    $('th-verisayfasi').innerHTML = `<tr>${headers.map(h => `<th class="sticky-th p-2 md:p-3 text-left font-sans font-semibold text-[11px] md:text-sm text-text2 border-b-2 border-border uppercase th-bg leading-tight whitespace-nowrap">${escapeHTML(h)}</th>`).join('')}</tr>`;
    $('tb-verisayfasi').innerHTML = rows.map((r, idx) => {
        const bgClass = idx % 2 === 0 ? 'bg-bg2' : 'bg-bg3/50';
        return `<tr class="${bgClass} hover:bg-border/50 border-b border-border/80 text-xs md:text-sm transition-colors">
            ${r.map(col => `<td class="p-2 md:p-3 break-words align-top whitespace-nowrap">${escapeHTML(col || '')}</td>`).join('')}
        </tr>`;
    }).join('');
}

// Arama
const searchTimeouts = {};
function fT(id, q, bypass = false) {
    clearTimeout(searchTimeouts[id]);
    const exec = () => {
        const f = q.toLocaleLowerCase('tr-TR');
        const tb = $(id);
        if (!tb) return;
        
        const prev = tb.style.display;
        tb.style.display = 'none'; // Reflow (donma) engellemek için tabloyu anlık gizle
        
        const r = tb.getElementsByTagName('tr'); 
        for(let i=0; i<r.length; i++) {
            const target = r[i].textContent.toLocaleLowerCase('tr-TR').includes(f) ? '' : 'none';
            if (r[i].style.display !== target) r[i].style.display = target; // Gereksiz DOM yazımını önle
        }
        
        tb.style.display = prev; // Tabloyu tek seferde yeniden çizdir
    };
    if (bypass) exec();
    else searchTimeouts[id] = setTimeout(exec, 250);
}

function chA(x){const i=DATES.indexOf(sA); if(DATES[i+x]){sA=DATES[i+x]; rAlarm(); checkSystemAlarms();}}
function pkAlarm(v){const f=v.split('-').reverse().join('.'); if(DATES.includes(f)){sA=f; rAlarm(); checkSystemAlarms();}else toast('Bu tarihte veri yok','warn');}
function chD(x){const i=DATES.indexOf(sD); if(DATES[i+x]){sD=DATES[i+x]; rG();}}
function pkD(v){const f=v.split('-').reverse().join('.'); if(DATES.includes(f)){sD=f; rG();}else toast('Bu tarihte veri yok','warn');}
function chW(x){const i=WEEKS.indexOf(sW); if(WEEKS[i+x]){sW=WEEKS[i+x]; rW();}}
function pkW(v){if(WEEKS.includes(v)){sW=v; rW();}else toast('Bu haftada veri yok','warn');}
function chM(x){const i=MONTHS.indexOf(sM); if(MONTHS[i+x]){sM=MONTHS[i+x]; rM();}}
function pkM(v){const f=v.split('-').reverse().join('.'); if(MONTHS.includes(f)){sM=f; rM();}else toast('Bu ayda veri yok','warn');}

// Vardiya Kıyaslama Çizimi (Ortak Fonksiyon)
function renderShiftComparison(chartId, tbId, thId, data) {
    const machines = {};
    data.forEach(r => {
        const v = r.vardiya || 'Diğer';
        [1, 2].forEach(i => {
            const p = r['pres'+i];
            const u = r['uretim'+i] || 0;
            const perf = r['perf'+i];
            if (p) {
                if (!machines[p]) machines[p] = {};
                if (!machines[p][v]) machines[p][v] = { u: 0, pSum: 0, c: 0, emps: {} };
                machines[p][v].u += u;
                if (perf) { machines[p][v].pSum += perf; machines[p][v].c++; }
                if (!machines[p][v].emps[r.calisan]) machines[p][v].emps[r.calisan] = { u:0, pSum:0, c:0 };
                machines[p][v].emps[r.calisan].u += u;
                if (perf) { machines[p][v].emps[r.calisan].pSum += perf; machines[p][v].emps[r.calisan].c++; }
            }
        });
    });

    const mList = Object.keys(machines).sort();
    const sList = ['08:00-16:00', '16:00-24:00', '00:00-08:00', 'Diğer'];
    
    const datasets = [];
    const colors = [cR('accent',0.8), cR('accent4',0.8), cR('accent3',0.8), cR('border',0.8)];
    sList.forEach((s, idx) => {
        const d = mList.map(m => machines[m][s] ? machines[m][s].u : 0);
        if (d.some(v => v > 0)) {
            datasets.push({ label: s, data: d, backgroundColor: colors[idx] });
        }
    });

    if($(chartId)) { mc(chartId, 'bar', { labels: mList, datasets: datasets }); }

    let rows = [];
    mList.forEach(m => {
        sList.forEach(s => {
            if (machines[m][s]) {
                const d = machines[m][s];
                const empArr = Object.keys(d.emps).sort((a,b)=>d.emps[b].u - d.emps[a].u);
                const empStr = empArr.map(e => `${escapeHTML(e)} <span class="text-text3 text-[10px]">(${n(d.emps[e].u)})</span>`).join('<br>');
                const perf = d.c ? d.pSum / d.c : 0;
                rows.push({ m, s, e: empStr, u: d.u, p: perf });
            }
        });
    });

    rows.sort((a,b) => { if(a.m !== b.m) return a.m.localeCompare(b.m); return b.u - a.u; });

    if($(thId)) {
        $(thId).innerHTML = th(['Makine', 'Vardiya', 'Çalışanlar (Üretim)', 'Top. Üretim', 'Ort. Perf']);
        $(tbId).innerHTML = rows.map((r, i) => {
            const mIndex = mList.indexOf(r.m);
            const bgClass = mIndex % 2 === 0 ? '' : 'bg-bg2/50';
            return `<tr class="hover:bg-bg3 border-b border-border/50 text-[11px] md:text-xs ${bgClass}">
                <td class="p-2 whitespace-nowrap align-top"><b>${escapeHTML(r.m)}</b></td>
                <td class="p-2 whitespace-nowrap align-top">${escapeHTML(r.s)}</td>
                <td class="p-2 align-top leading-relaxed text-text">${r.e}</td>
                <td class="p-2 whitespace-nowrap align-top"><b class="text-accent">${n(r.u)}</b></td>
                <td class="p-2 whitespace-nowrap align-top">${r.p > 0 ? pb(r.p) : '-'}</td>
            </tr>`;
        }).join('');
    }
}

function rG(){
    if(!sD)return; $('c-day').innerText=sD; $('d-pick').value=sD.split('.').reverse().join('-');
    const dd=RAW.filter(r=>r.tarih===sD), s=calc(dd), sab=dd.filter(r=>r.vardiya==='08:00-16:00').length, aks=dd.filter(r=>r.vardiya==='16:00-24:00').length;
    $('g-kpi').innerHTML=card('border-l-accent','Üretim',n(s.u),'Adet',`showKpiDet('g','u')`)+card('border-l-accent4','Performans',s.p.toFixed(1)+'%',s.c+' Kayıt',`showKpiDet('g','p')`)+card('border-l-accent2','Duruş',n(s.d),'Dk',`showKpiDet('g','d')`)+card('border-l-accent','Çalışan',new Set(dd.map(r=>r.calisan)).size,'Kişi',`showKpiDet('g','c')`)+card('border-l-accent3','Düşük Perf',dd.filter(r=>r.tP>0&&r.tP<80).length,'Kayıt',`showKpiDet('g','lo')`)+card('border-l-accent','Yüksek Perf',dd.filter(r=>r.tP>=110).length,'Kayıt',`showKpiDet('g','hi')`);
    
    // Aynı gün çift form dolduranları tek bar'da birleştir
    const eM={}; dd.forEach(r=>{if(!eM[r.calisan])eM[r.calisan]={pSum:0,c:0}; eM[r.calisan].pSum+=r.tP; eM[r.calisan].c++;});
    const sr=Object.entries(eM).map(([c,v])=>({calisan:c, tP:v.pSum/v.c})).sort((a,b)=>b.tP-a.tP);
    
    if(sr.length > 0 && sr[0].tP > 0) {
        window.bestDayEmp = sr[0].calisan;
        if($('d-best-name')) $('d-best-name').textContent = sr[0].calisan;
        if($('d-best-perf')) $('d-best-perf').textContent = sr[0].tP.toFixed(1) + '%';
        if($('d-best')) {
            $('d-best').classList.remove('hidden');
            $('d-best').classList.add('flex');
        }
    } else {
        if($('d-best')) {
            $('d-best').classList.add('hidden');
            $('d-best').classList.remove('flex');
        }
    }

    mc('c1','bar',{labels:sr.map(r=>r.calisan),datasets:[{label:'Ort. Perf %',data:sr.map(r=>r.tP),backgroundColor:sr.map(r=>r.tP>=110?cR('accent',0.75):r.tP>=90?cR('accent4',0.75):r.tP>=70?cR('accent3',0.75):cR('accent2',0.75))}]}, { x: { ticks: { callback: function(v) { return String(this.getLabelForValue(v)).split(' ')[0]; } } } });
    mc('c2','doughnut',{labels:['08:00-16:00','16:00-24:00','Diğer'],datasets:[{data:[sab,aks,dd.length-sab-aks],backgroundColor:[cR('accent',0.75),cR('accent4',0.75),cR('accent3',0.75)]}]},{x:{display:false},y:{display:false}});
    
    const pm={}; dd.forEach(r=>{if(r.pres1)pm[r.pres1]=(pm[r.pres1]||0)+r.uretim1; if(r.pres2)pm[r.pres2]=(pm[r.pres2]||0)+r.uretim2;});
    const ps=Object.entries(pm).sort((a,b)=>b[1]-a[1]).slice(0,12);
    mc('c3','bar',{labels:ps.map(x=>x[0]),datasets:[{label:'Üretim (Adet)',data:ps.map(x=>x[1]),backgroundColor:cR('accent',0.75)}]});
    
    renderShiftComparison('c4', 'tb-gun-kiyas', 'th-gun-kiyas', dd);
    
    const isAdmin = LOGGED_IN_USER && LOGGED_IN_USER.role === 'admin';
    $('th-gun').innerHTML=thD(['#','Çalışan','Vardiya','Pres 1','Fason 1','Hdf 1','Ürt 1','Perf 1','Dur 1','Pres 2','Fason 2','Hdf 2','Ürt 2','Perf 2','Dur 2','Top.Hdf','Top.Ürt','Ort.Perf', ...(isAdmin ? ['İşlem'] : [])]);
    $('tb-gun').innerHTML=dd.map((r,i)=>trD([
        i+1, `<b class="emp-link" onclick="openModal('${safeAttr(r.calisan)}')"> ${escapeHTML(r.calisan)}</b>`, escapeHTML(r.vardiya)||'-',
        escapeHTML(r.pres1)||'-', escapeHTML(r.fason1)||'-', n(r.beklenen1), n(r.uretim1), r.perf1>0?pb(r.perf1):'-', r.durus1>0?`<span class="px-1.5 py-0.5 bg-accent2/20 text-accent2 rounded-full text-[10px] font-bold">${r.durus1} dk</span>`:'-',
        escapeHTML(r.pres2)||'-', escapeHTML(r.fason2)||'-', n(r.beklenen2), n(r.uretim2), r.perf2>0?pb(r.perf2):'-', r.durus2>0?`<span class="px-1.5 py-0.5 bg-accent2/20 text-accent2 rounded-full text-[10px] font-bold">${r.durus2} dk</span>`:'-',
        n(r.tB), `<b class="text-accent">${n(r.tU)}</b>`, pb(r.tP),
        ...(isAdmin ? [`<div class="flex gap-2 items-center"><button onclick="editProductionRecord('${r.tarih}','${safeAttr(r.calisan)}')" class="text-accent hover:underline font-bold text-[14px]" title="Düzenle">✎</button><button onclick="deleteProductionRecord('${r.tarih}','${safeAttr(r.calisan)}')" class="text-accent2 hover:underline font-bold text-[14px]" title="Sil">🗑</button></div>`] : [])
    ])).join('');
}

function rW(){
    if(!sW)return; $('c-week').innerText=sW.replace('-W',' / ')+'. Hafta'; $('w-pick').value=sW;
    const wd=RAW.filter(r=>isoW(r.tarih)===sW), s=calc(wd);
    $('w-kpi').innerHTML=card('border-l-accent','Haftalık Üretim',n(s.u),'Adet',`showKpiDet('w','u')`)+card('border-l-accent4','Haftalık Perf',s.p.toFixed(1)+'%',s.c+' Kayıt',`showKpiDet('w','p')`)+card('border-l-accent2','Haftalık Duruş',n(s.d),'Dk',`showKpiDet('w','d')`)+card('border-l-accent3','Çalışılan Gün',new Set(wd.map(r=>r.tarih)).size,'Gün',`showKpiDet('w','c')`);
    const dt=[...new Set(wd.map(r=>r.tarih))].sort((a,b)=>a.split('.').reverse().join('')<b.split('.').reverse().join('')?-1:1).map(d=>({l:d.slice(0,5), ...calc(wd.filter(r=>r.tarih===d))}));
    mc('w1','line',{labels:dt.map(x=>x.l),datasets:[{label:'Üretim',data:dt.map(x=>x.u),borderColor:cR('accent'),backgroundColor:cR('accent',0.2),fill:true}]});
    mc('w2','line',{labels:dt.map(x=>x.l),datasets:[{label:'Perf %',data:dt.map(x=>x.p),borderColor:cR('accent4'),backgroundColor:cR('accent4',0.2),fill:true}]},{y:{min:60,max:130}});
    
    renderShiftComparison('w3', 'tb-haf-kiyas', 'th-haf-kiyas', wd);
    
    const sab=wd.filter(r=>r.vardiya==='08:00-16:00').length, aks=wd.filter(r=>r.vardiya==='16:00-24:00').length;
    mc('w4','doughnut',{labels:['08:00-16:00','16:00-24:00','Diğer'],datasets:[{data:[sab,aks,wd.length-sab-aks],backgroundColor:[cR('accent',0.75),cR('accent4',0.75),cR('accent3',0.75)]}]},{x:{display:false},y:{display:false}});
    
    const ws=[...new Set(wd.map(r=>r.calisan))].map(w=>({w,...calc(wd.filter(r=>r.calisan===w))})).sort((a,b)=>b.u-a.u);
    
    const bestW = [...ws].sort((a,b) => b.p - a.p)[0];
    if(bestW && bestW.p > 0) {
        window.bestWeekEmp = bestW.w;
        if($('w-best-name')) $('w-best-name').textContent = bestW.w;
        if($('w-best-perf')) $('w-best-perf').textContent = bestW.p.toFixed(1) + '%';
        if($('w-best')) {
            $('w-best').classList.remove('hidden');
            $('w-best').classList.add('flex');
        }
    } else {
        if($('w-best')) {
            $('w-best').classList.add('hidden');
            $('w-best').classList.remove('flex');
        }
    }

    $('th-haf').innerHTML=th(['Sıra','Çalışan','Kayıt','Hedef (Adet)','Top.Üretim','Ort.Perf','Duruş (Dk)']);
    $('tb-haf').innerHTML=ws.map((w,i)=>tr([i+1, `<b class="emp-link" onclick="openModal('${safeAttr(w.w)}')">${escapeHTML(w.w)}</b>`, w.c, n(w.b), n(w.u), pb(w.p), n(w.d)])).join('');

    const badW = [...ws].filter(x=>x.d>0).sort((a,b)=>b.d-a.d).slice(0,10);
    $('th-haf-durus').innerHTML=th(['Çalışan','Toplam Duruş']);
    $('tb-haf-durus').innerHTML=badW.length ? badW.map((w,i)=>tr([`<div class="flex gap-1 items-center"><span class="text-[10px] text-text3 font-mono">${i+1}.</span> <b class="emp-link" onclick="openModal('${safeAttr(w.w)}')">${escapeHTML(w.w)}</b></div>`, `<span class="text-accent2 font-mono font-bold">${n(w.d)} dk</span>`])).join('') : `<tr><td colspan="2" class="p-4 text-center text-text3 text-xs">Duruş kaydı yok.</td></tr>`;
}

function rM(){
    if(!sM)return; const [m,y]=sM.split('.'); $('c-month').innerText=`${m}/${y}`; $('m-pick').value=`${y}-${m}`;
    const md=RAW.filter(r=>r.tarih.endsWith(sM)), s=calc(md);
    $('m-kpi').innerHTML=card('border-l-accent','Aylık Üretim',n(s.u),'Adet',`showKpiDet('m','u')`)+card('border-l-accent4','Aylık Perf',s.p.toFixed(1)+'%',s.c+' Kayıt',`showKpiDet('m','p')`)+card('border-l-accent2','Aylık Duruş',n(s.d),'Dk',`showKpiDet('m','d')`)+card('border-l-accent3','Çalışılan Gün',new Set(md.map(r=>r.tarih)).size,'Gün',`showKpiDet('m','c')`);
    const dt=[...new Set(md.map(r=>r.tarih))].sort((a,b)=>a.split('.').reverse().join('')<b.split('.').reverse().join('')?-1:1).map(d=>({l:d.slice(0,2), ...calc(md.filter(r=>r.tarih===d))}));
    mc('m1','line',{labels:dt.map(x=>x.l),datasets:[{label:'Üretim',data:dt.map(x=>x.u),borderColor:cR('accent'),backgroundColor:cR('accent',0.2),fill:true}]});
    mc('m2','line',{labels:dt.map(x=>x.l),datasets:[{label:'Perf %',data:dt.map(x=>x.p),borderColor:cR('accent4'),backgroundColor:cR('accent4',0.2),fill:true}]},{y:{min:60,max:130}});
    
    renderShiftComparison('m3', 'tb-ay-kiyas', 'th-ay-kiyas', md);
    
    const sab=md.filter(r=>r.vardiya==='08:00-16:00').length, aks=md.filter(r=>r.vardiya==='16:00-24:00').length;
    mc('m4','doughnut',{labels:['08:00-16:00','16:00-24:00','Diğer'],datasets:[{data:[sab,aks,md.length-sab-aks],backgroundColor:[cR('accent',0.75),cR('accent4',0.75),cR('accent3',0.75)]}]},{x:{display:false},y:{display:false}});
    
    const ws=[...new Set(md.map(r=>r.calisan))].map(w=>({w,...calc(md.filter(r=>r.calisan===w))})).sort((a,b)=>b.u-a.u);
        
        const bestM = [...ws].sort((a,b) => b.p - a.p)[0];
        if(bestM && bestM.p > 0) {
            window.bestMonthEmp = bestM.w;
            if($('m-best-name')) $('m-best-name').textContent = bestM.w;
            if($('m-best-perf')) $('m-best-perf').textContent = bestM.p.toFixed(1) + '%';
            if($('m-best')) {
                $('m-best').classList.remove('hidden');
                $('m-best').classList.add('flex');
            }
        } else {
            if($('m-best')) {
                $('m-best').classList.add('hidden');
                $('m-best').classList.remove('flex');
            }
        }

    $('th-ay').innerHTML=th(['Sıra','Çalışan','Kayıt','Hedef (Adet)','Top.Üretim','Ort.Perf','Duruş (Dk)']);
    $('tb-ay').innerHTML=ws.map((w,i)=>tr([i+1, `<b class="emp-link" onclick="openModal('${safeAttr(w.w)}')">${escapeHTML(w.w)}</b>`, w.c, n(w.b), n(w.u), pb(w.p), n(w.d)])).join('');

    const badM = [...ws].filter(x=>x.d>0).sort((a,b)=>b.d-a.d).slice(0,10);
    $('th-ay-durus').innerHTML=th(['Çalışan','Toplam Duruş']);
    $('tb-ay-durus').innerHTML=badM.length ? badM.map((w,i)=>tr([`<div class="flex gap-1 items-center"><span class="text-[10px] text-text3 font-mono">${i+1}.</span> <b class="emp-link" onclick="openModal('${safeAttr(w.w)}')">${escapeHTML(w.w)}</b></div>`, `<span class="text-accent2 font-mono font-bold">${n(w.d)} dk</span>`])).join('') : `<tr><td colspan="2" class="p-4 text-center text-text3 text-xs">Duruş kaydı yok.</td></tr>`;
}

function rH(){
    const s=calc(RAW); $('h-kpi').innerHTML=card('border-l-accent','Genel Üretim',n(s.u),'Tümü',`showKpiDet('h','u')`)+card('border-l-accent4','Genel Perf',s.p.toFixed(1)+'%',s.c+' Kayıt',`showKpiDet('h','p')`)+card('border-l-accent2','Genel Duruş',n(s.d),'Dk',`showKpiDet('h','d')`)+card('border-l-accent3','Kayıtlı Gün',DATES.length,'Gün',`showKpiDet('h','c')`);
    const dt=DATES.map(d=>({l:d.slice(0,5), ...calc(RAW.filter(r=>r.tarih===d))}));
    mc('h1','line',{labels:dt.map(x=>x.l),datasets:[{label:'Üretim',data:dt.map(x=>x.u),borderColor:cR('accent'),backgroundColor:cR('accent',0.2),fill:true}]});
    mc('h2','line',{labels:dt.map(x=>x.l),datasets:[{label:'Perf %',data:dt.map(x=>x.p),borderColor:cR('accent4'),backgroundColor:cR('accent4',0.2),fill:true}]},{y:{min:60,max:130}});
    const ws=[...new Set(RAW.map(r=>r.calisan))].map(w=>({w,...calc(RAW.filter(r=>r.calisan===w))})).sort((a,b)=>b.u-a.u).slice(0,10);
    // FIX #4: x.w.calisan her zaman undefined'dı (x.w zaten string). Düzeltildi.
    mc('h3','bar',{labels:ws.map(x=>x.w),datasets:[{label:'Üretim',data:ws.map(x=>x.u),backgroundColor:cR('accent',0.75)}]}, { x: { ticks: { callback: function(v) { return String(this.getLabelForValue(v)).split(' ')[0]; } } } });
        
        // ŞEREF KÜRSÜSÜ (HALL OF FAME)
        const fameHtml = MONTHS.slice().reverse().map(m => {
            const mData = RAW.filter(r => r.tarih.endsWith(m));
            if(mData.length === 0) return '';
            
            let empStats = [...new Set(mData.map(r=>r.calisan))].map(w => ({ w, ...calc(mData.filter(r=>r.calisan===w)) }));
            const maxU = Math.max(...empStats.map(e => e.u)) || 1;
            const maxP = Math.max(...empStats.map(e => e.p)) || 1;
            const maxC = Math.max(...empStats.map(e => e.c)) || 1;
            
            const wU = adminSettings.weights?.u ?? 40;
            const wP = adminSettings.weights?.p ?? 40;
            const wC = adminSettings.weights?.c ?? 20;
            const wD = adminSettings.weights?.d ?? 0.1;
            
            empStats.forEach(e => {
                e.score = ((e.u / maxU) * wU) + ((e.p / maxP) * wP) + ((e.c / maxC) * wC) - (e.d * wD);
            });
            
            const best = empStats.sort((a, b) => b.score - a.score)[0];
            if(!best) return '';

            const uInfo = USER_DATA[best.w] || {};
            const avatar = uInfo.photo 
                ? `<img src="${uInfo.photo}" class="w-10 h-10 rounded-full object-cover border-2 border-accent3 shadow-sm shrink-0">` 
                : `<div class="w-10 h-10 rounded-full bg-gradient-to-br from-accent3 to-accent4 border-2 border-accent3 flex items-center justify-center font-bold text-bg2 text-sm shadow-sm shrink-0">${best.w.slice(0,2).toUpperCase()}</div>`;
            
            const monthNames = ["Ocak","Şubat","Mart","Nisan","Mayıs","Haziran","Temmuz","Ağustos","Eylül","Ekim","Kasım","Aralık"];
            const [mm, yy] = m.split('.');
            const mText = monthNames[parseInt(mm)-1] + ' ' + yy;

            return `
            <div class="flex items-center justify-between bg-bg2 border border-border/50 rounded-xl p-2 hover:bg-bg3 hover:shadow-md transition-all cursor-pointer group" onclick="openModal('${safeAttr(best.w)}')">
                <div class="flex items-center gap-3">
                    ${avatar}
                    <div class="flex flex-col">
                        <span class="text-[10px] font-mono text-text3 tracking-wider group-hover:text-accent3 transition-colors">${mText}</span>
                        <span class="font-bold text-sm text-text">${best.w}</span>
                    </div>
                </div>
                <div class="flex flex-col items-end">
                    <span class="text-xs font-bold text-accent4">⭐ ${best.score.toFixed(1)}</span>
                    <span class="text-[9px] text-text2">${n(best.u)} Adet</span>
                </div>
            </div>`;
        }).join('');
        
        if($('h-fame')) $('h-fame').innerHTML = fameHtml || '<div class="text-center text-text3 text-xs p-4 font-mono">Henüz kayıtlı bir yıldız bulunmuyor.</div>';
}

function checkSystemAlarms() {
    if(!RAW.length) return;
    const chkDate = sA || DATES[DATES.length - 1];
    const recentData = RAW.filter(r => r.tarih === chkDate);
    let alarmCount = 0;

    const empPerf = {}; const pressDown = {}; const fasonPerf = {};
    recentData.forEach(r => {
        if(!empPerf[r.calisan]) empPerf[r.calisan] = {p:0, c:0};
        empPerf[r.calisan].p += r.tP; empPerf[r.calisan].c++;
        [1,2].forEach(i => {
            const pr = r['pres'+i], fas = r['fason'+i], dur = r['durus'+i], perf = r['perf'+i];
            if(pr) { if(!pressDown[pr]) pressDown[pr] = 0; pressDown[pr] += dur; }
            if(fas) { if(!fasonPerf[fas]) fasonPerf[fas] = {p:0, c:0}; fasonPerf[fas].p += perf; fasonPerf[fas].c++; }
        });
    });

    Object.values(empPerf).forEach(v => { if(v.c > 0 && v.p/v.c < 80) alarmCount++; });
    Object.values(pressDown).forEach(v => { if(v > 60) alarmCount++; });
    Object.values(fasonPerf).forEach(v => { if(v.c > 0 && v.p/v.c < 80) alarmCount++; });

    const btn = $('nav-alarm-btn');
    if(btn) {
        if(alarmCount > 0) {
            btn.innerHTML = `
                <div class="absolute inset-0 bg-gradient-to-br from-accent2/0 to-accent2/10 opacity-50 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div class="absolute inset-0 bg-accent2/5 animate-pulse"></div>
                <div class="relative z-10 flex flex-col items-center">
                    <div class="relative mb-2 sm:mb-4 group-hover:scale-110 transition-transform duration-500 drop-shadow-xl">
                        <span class="text-2xl sm:text-4xl md:text-7xl animate-bounce inline-block" style="animation-duration: 2s;">🚨</span>
                        <span class="absolute -top-2 -right-4 bg-accent2 text-white px-1.5 py-0.5 sm:px-3 sm:py-1 rounded-full text-[10px] sm:text-sm font-bold animate-pulse shadow-md border-2 border-bg">${alarmCount}</span>
                    </div>
                    <span class="text-accent2 font-bold text-center tracking-wider text-[10px] sm:text-sm md:text-lg">ALARMLAR</span>
                </div>
            `;
            btn.classList.add('border-accent2', 'text-accent2', 'font-bold');
        } else {
            btn.innerHTML = `
                <div class="absolute inset-0 bg-gradient-to-br from-text3/0 to-text3/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div class="relative z-10 flex flex-col items-center">
                    <div class="relative mb-2 sm:mb-4 group-hover:scale-110 transition-transform duration-500 drop-shadow-xl">
                        <span class="text-5xl md:text-7xl inline-block">🔔</span>
                    </div>
                    <span class="text-text font-bold text-center tracking-wider text-[10px] sm:text-sm md:text-lg">ALARMLAR</span>
                </div>
            `;
            btn.classList.remove('border-accent2', 'text-accent2', 'font-bold');
        }
    }
}
function rAlarm() {
    if(!RAW.length) return;
    const chkDate = sA || DATES[DATES.length - 1];
    const dr = RAW.filter(r => r.tarih === chkDate);
    
    // UI Güncellemeleri
    const titleEl = $('c-alarm-date');
    if(titleEl) titleEl.innerText = chkDate;
    const pkEl = $('alarm-pick');
    if(pkEl) pkEl.value = chkDate.split('.').reverse().join('-');

    if(!dr.length) {
        $('alarm-feed-container').innerHTML = `<div class="text-text3 text-center py-10 font-mono text-sm">Bu tarihte veri bulunamadı.</div>`;
        $('makine-kiyas-container').innerHTML = '';
        return;
    }

    let alarms = [];
    let pPerf = {}, fPerf = {}, mStats = {};
    
    dr.forEach(r => {
        // Personel İstatistikleri (Tüm presler için toplam)
        if(!pPerf[r.calisan]) pPerf[r.calisan] = { perf: [], durus: 0, runs: 0 };
        pPerf[r.calisan].perf.push(r.tP);
        
        [1,2].forEach(i => {
            const m = r['pres'+i], f = r['fason'+i], dur = Number(r['durus'+i])||0, perf = Number(r['perf'+i])||0, ur = Number(r['uretim'+i])||0, kafa = r['kafa'+i]||1;
            
            pPerf[r.calisan].durus += dur;
            
            if(f) {
                if(!fPerf[f]) fPerf[f] = { perf: [], runs: 0 };
                fPerf[f].perf.push(perf);
                fPerf[f].runs++;
            }

            if(m) {
                let vardiyaKey = `Vardiya ${r.vardiya}`;
                let kafaKey = `Kafa ${kafa}`;
                if(!mStats[m]) mStats[m] = {};
                if(!mStats[m][vardiyaKey]) mStats[m][vardiyaKey] = {};
                if(!mStats[m][vardiyaKey][kafaKey]) mStats[m][vardiyaKey][kafaKey] = {};
                
                if(!mStats[m][vardiyaKey][kafaKey][r.calisan]) {
                    mStats[m][vardiyaKey][kafaKey][r.calisan] = { totalUretim: 0, totalDurus: 0, runs: 0, perfSum: 0 };
                }
                let st = mStats[m][vardiyaKey][kafaKey][r.calisan];
                st.totalUretim += ur;
                st.totalDurus += dur;
                st.perfSum += perf;
                st.runs++;
            }
        });
        pPerf[r.calisan].runs++;
    });

    // 1. Alarm ve Uyarıların Toplanması
    Object.entries(pPerf).forEach(([p, v]) => {
        let avgPerf = v.perf.reduce((a,b)=>a+b,0) / v.perf.length;
        let avgDurus = v.durus / v.runs;
        
        if(avgPerf < 80) {
            alarms.push({
                type: 'critical', icon: '📉', title: 'Kritik Performans', entity: p,
                desc: `Ortalama performansı kritik seviyede: <b class="text-accent2">%${avgPerf.toFixed(1)}</b>.`,
                metric: `${v.runs} Kayıt`
            });
        } else if(avgPerf < 85) {
            alarms.push({
                type: 'warning', icon: '⚠️', title: 'Düşük Performans', entity: p,
                desc: `Ortalama performans hedefin altında: <b>%${avgPerf.toFixed(1)}</b>.`,
                metric: `${v.runs} Kayıt`
            });
        }
        
        if(avgDurus > 60) {
            alarms.push({
                type: 'critical', icon: '🛑', title: 'Yüksek Duruş Süresi', entity: p,
                desc: `Vardiya başına ortalama <b class="text-accent2">${Math.round(avgDurus)} dk</b> duruş yaşanıyor.`,
                metric: 'Sürekli İnceleme Şart'
            });
        }
    });

    Object.entries(fPerf).forEach(([f, v]) => {
        let avgPerf = v.perf.reduce((a,b)=>a+b,0) / v.perf.length;
        if(avgPerf < 80) {
             alarms.push({
                type: 'warning', icon: '📦', title: 'Zorlu Fason', entity: f,
                desc: `Üretim performansı genelde düşük kalıyor: <b>%${avgPerf.toFixed(1)}</b>.`,
                metric: `${v.runs} Kayıt`
            });
        }
    });

    // Uyarı Akışını Doldur
    const feedContainer = $('alarm-feed-container');
    const feedCount = $('alarm-feed-count');
    if(!feedContainer || !feedCount) return;
    
    feedContainer.innerHTML = '';
    
    if(alarms.length === 0) {
        feedContainer.innerHTML = `<div class="text-center text-text3 text-sm py-10">Harika! Son 14 güne ait kritik bir uyarı bulunmuyor.</div>`;
        feedCount.textContent = '0';
    } else {
        feedCount.textContent = alarms.length;
        alarms.sort((a,b) => (a.type === 'critical' ? -1 : 1)).forEach(al => {
            let borderClass = al.type === 'critical' ? 'border-accent2/50 shadow-[0_0_10px_rgba(255,107,107,0.2)] bg-accent2/5' : 'border-accent/30 bg-accent/5';
            let titleColor = al.type === 'critical' ? 'text-accent2' : 'text-accent';
            let pulseClass = al.type === 'critical' ? 'animate-pulse' : '';
            
            feedContainer.innerHTML += `
                <div class="border ${borderClass} rounded-lg p-3 transition-all duration-300 hover:scale-[1.02]">
                    <div class="flex items-start gap-3">
                        <div class="text-2xl ${pulseClass}">${al.icon}</div>
                        <div class="flex-1">
                            <div class="flex justify-between items-start mb-1">
                                <span class="font-bold text-xs uppercase ${titleColor}">${al.title}</span>
                                <span class="text-[9px] px-1.5 py-0.5 bg-bg border border-border text-text rounded font-mono">${al.metric}</span>
                            </div>
                            <div class="font-bebas text-lg text-text leading-tight mb-1">${escapeHTML(al.entity)}</div>
                            <div class="text-[11px] text-text2 leading-snug">${al.desc}</div>
                        </div>
                    </div>
                </div>
            `;
        });
    }

    // 2. Makine Kıyaslama Matrisi (Pres -> Vardiya -> Kafa)
    const mContainer = $('makine-kiyas-container');
    mContainer.innerHTML = '';
    let kiyasDataCount = 0;

    Object.entries(mStats).forEach(([mName, vData]) => {
        let compHtml = '';
        let hasMultiple = Object.keys(vData).length > 1; // Birden fazla vardiya var mı?
        
        Object.entries(vData).forEach(([vardiya, kData]) => {
             Object.entries(kData).forEach(([kafa, pData]) => {
                 Object.entries(pData).forEach(([personel, stat]) => {
                    const totalMins = stat.runs * 450;
                    const netMins = totalMins - stat.totalDurus;
                    const ppm = netMins > 0 ? (stat.totalUretim / netMins) : 0;
                    const avgPerf = stat.perfSum / stat.runs;
                    const avgDurus = stat.totalDurus / stat.runs;
                    
                    let speedColor = ppm > 15 ? 'text-accent' : (ppm < 8 ? 'text-accent2' : 'text-text');

                    compHtml += `
                        <div class="flex flex-col gap-1.5 p-2 bg-bg border border-border/50 rounded hover:border-accent3/50 transition-colors">
                            <div class="flex justify-between items-center border-b border-border/30 pb-1">
                                <span class="text-xs font-bold text-text">${escapeHTML(personel.split(' ')[0])}</span>
                                <div class="flex gap-1">
                                    <span class="text-[9px] bg-bg3 px-1 rounded text-text font-bold shadow-sm">${vardiya}</span>
                                    <span class="text-[9px] bg-bg3/50 px-1 rounded text-text3">${kafa}</span>
                                </div>
                            </div>
                            <div class="grid grid-cols-3 gap-2 text-center mt-1">
                                <div class="flex flex-col">
                                    <span class="text-[9px] text-text3 uppercase">Hız</span>
                                    <span class="text-xs font-mono font-bold ${speedColor}">${ppm.toFixed(1)} <span class="text-[8px] font-normal">d/k</span></span>
                                </div>
                                <div class="flex flex-col border-x border-border/30">
                                    <span class="text-[9px] text-text3 uppercase">Perf</span>
                                    <span class="text-xs font-mono font-bold ${avgPerf < 80 ? 'text-accent2' : 'text-text2'}">%${Math.round(avgPerf)}</span>
                                </div>
                                <div class="flex flex-col">
                                    <span class="text-[9px] text-text3 uppercase">Duruş</span>
                                    <span class="text-xs font-mono font-bold ${avgDurus > 60 ? 'text-accent2' : 'text-text2'}">${Math.round(avgDurus)}m</span>
                                </div>
                            </div>
                        </div>
                    `;
                    kiyasDataCount++;
                 });
             });
        });

        if(compHtml) {
            mContainer.innerHTML += `
                <div class="bg-bg2 border ${hasMultiple ? 'border-accent/40 shadow-[0_0_10px_rgba(20,184,166,0.1)]' : 'border-border'} rounded-lg p-3 flex flex-col gap-2 relative">
                    ${hasMultiple ? '<div class="absolute -top-2.5 -right-2.5 bg-accent text-bg text-[8px] font-bold px-2 py-0.5 rounded-full shadow-md animate-bounce">FARKLI VARDİYA</div>' : ''}
                    <div class="font-bebas text-lg text-text border-b border-border/50 pb-1">${escapeHTML(mName)}</div>
                    <div class="flex flex-col gap-2">
                        ${compHtml}
                    </div>
                </div>
            `;
        }
    });

    if(kiyasDataCount === 0) {
        mContainer.innerHTML = `<div class="col-span-full text-center text-text3 py-4 text-sm">Karşılaştırılabilir makine verisi bulunamadı.</div>`;
    }

    // 3. KPI Alanı (Özet)
    const badP = Object.entries(pPerf).filter(x => (x[1].perf.reduce((a,b)=>a+b,0)/x[1].perf.length) < 80);
    const badM = Object.entries(mStats).map(m => {
        let totalD = 0, runs = 0;
        Object.values(m[1]).forEach(v=>Object.values(v).forEach(k=>Object.values(k).forEach(p=>{ totalD+=p.totalDurus; runs+=p.runs; })));
        return {m: m[0], d: runs?totalD/runs:0};
    }).filter(x=>x.d>60);

    $('alarm-kpis').innerHTML = `
        <div class="bg-bg2 border border-border p-4 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden">
            <div class="absolute -right-4 -top-4 text-6xl opacity-5">🚨</div>
            <div class="relative z-10">
                <div class="text-[10px] text-text3 font-bold uppercase tracking-wider mb-1">Aktif Kritik Alarm</div>
                <div class="text-3xl font-bebas ${alarms.filter(a=>a.type==='critical').length > 0 ? 'text-accent2' : 'text-text'}">${alarms.filter(a=>a.type==='critical').length}</div>
            </div>
        </div>
        <div class="bg-bg2 border border-border p-4 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden">
            <div class="absolute -right-4 -top-4 text-6xl opacity-5">👥</div>
            <div class="relative z-10">
                <div class="text-[10px] text-text3 font-bold uppercase tracking-wider mb-1">Riskli Personel Sayısı</div>
                <div class="text-3xl font-bebas ${badP.length > 0 ? 'text-accent3' : 'text-text'}">${badP.length}</div>
            </div>
        </div>
        <div class="bg-bg2 border border-border p-4 rounded-xl flex items-center justify-between shadow-sm relative overflow-hidden">
             <div class="absolute -right-4 -top-4 text-6xl opacity-5">⚙️</div>
            <div class="relative z-10">
                <div class="text-[10px] text-text3 font-bold uppercase tracking-wider mb-1">Yüksek Duruşlu Pres</div>
                <div class="text-3xl font-bebas ${badM.length > 0 ? 'text-accent2' : 'text-text'}">${badM.length}</div>
            </div>
        </div>
    `;

    // 4. Grafikler
    // Scatter Plot: Çalışan Performans vs Duruş
    const scatterData = Object.entries(pPerf).map(([p, v]) => ({
        x: v.durus / v.runs, // Ortalama Duruş (dk)
        y: (v.perf.reduce((a,b)=>a+b,0) / v.perf.length), // Ortalama Perf %
        r: Math.min(v.runs * 3, 20), // Nokta büyüklüğü kayıt sayısına göre
        label: p.split(' ')[0]
    }));

    mc('alarm-c1', 'scatter', {
        datasets: [{
            label: 'Personel',
            data: scatterData,
            backgroundColor: cR('accent3', 0.6),
            borderColor: cR('accent3', 1),
            borderWidth: 1,
            hoverBackgroundColor: cR('accent2', 0.8)
        }]
    }, {
        plugins: {
            tooltip: {
                callbacks: {
                    label: function(ctx) { return `${ctx.raw.label}: %${ctx.raw.y.toFixed(1)} Perf, ${ctx.raw.x.toFixed(0)}dk Duruş`; }
                }
            }
        },
        scales: {
            x: { title: { display: true, text: 'Ortalama Duruş (Dakika)', color: '#6b7280' }, grid: {color: '#374151'} },
            y: { title: { display: true, text: 'Ortalama Performans (%)', color: '#6b7280' }, grid: {color: '#374151'}, min: 40, max: 120 }
        }
    });

    // Bar/Line Mix: Pres Duruş vs Ortalama Hız Korelasyonu
    const presKorelasyonData = Object.entries(mStats).map(([mName, vData]) => {
        let totalD = 0, totalU = 0, runs = 0;
        Object.values(vData).forEach(v=>Object.values(v).forEach(k=>Object.values(k).forEach(p=>{
            totalD += p.totalDurus;
            totalU += p.totalUretim;
            runs += p.runs;
        })));
        let avgD = runs ? totalD/runs : 0;
        let ppm = (runs*450 - totalD) > 0 ? (totalU / (runs*450 - totalD)) : 0;
        return { pres: mName, avgD, ppm };
    }).sort((a,b) => b.avgD - a.avgD).slice(0, 10); // En çok duruş yaşayan 10 pres

    mc('alarm-c2', 'bar', {
        labels: presKorelasyonData.map(x=>x.pres),
        datasets: [
            {
                type: 'bar',
                label: 'Ortalama Duruş (dk)',
                data: presKorelasyonData.map(x=>x.avgD),
                backgroundColor: cR('accent2', 0.7),
                borderRadius: 4,
                yAxisID: 'y'
            },
            {
                type: 'line',
                label: 'Ortalama Hız (Adet/Dk)',
                data: presKorelasyonData.map(x=>x.ppm),
                borderColor: cR('accent', 1),
                backgroundColor: cR('accent', 0.2),
                borderWidth: 3,
                tension: 0.4,
                pointBackgroundColor: cR('accent', 1),
                yAxisID: 'y1'
            }
        ]
    }, {
        scales: {
            y: { type: 'linear', display: true, position: 'left', title: {display: true, text:'Duruş (dk)', color: '#6b7280'}, grid: {color: '#374151'} },
            y1: { type: 'linear', display: true, position: 'right', grid: { drawOnChartArea: false }, title: {display: true, text:'Hız (Adet/dk)', color: '#6b7280'} }
        }
    });
}

function rC(){
    const ws=[...new Set(RAW.map(r=>r.calisan))].map(w=>({w,...calc(RAW.filter(r=>r.calisan===w))})).sort((a,b)=>b.u-a.u);
    mc('ca1','bar',{labels:ws.map(x=>x.w),datasets:[{label:'Üretim',data:ws.map(x=>x.u),backgroundColor:cR('accent',0.75)}]}, { x: { ticks: { callback: function(v) { return String(this.getLabelForValue(v)).split(' ')[0]; } } } });
    $('th-cal').innerHTML=th(['Sıra','Çalışan','Kayıt','Hedef (Adet)','Top.Üretim','Ort.Perf','Duruş (Dk)']);
    $('tb-cal').innerHTML=ws.map((w,i)=>tr([i+1, `<b class="emp-link" onclick="openModal('${safeAttr(w.w)}')">${escapeHTML(w.w)}</b>`, w.c, n(w.b), n(w.u), pb(w.p), n(w.d)])).join('');
}

function rP(){
    const pM={}; RAW.forEach(r=>{[1,2].forEach(i=>{const p=r['pres'+i]; if(p){if(!pM[p])pM[p]={b:0,u:0,pp:[],d:0,c:0}; pM[p].b+=Number(r['beklenen'+i])||0; pM[p].u+=Number(r['uretim'+i])||0; if(r['perf'+i])pM[p].pp.push(Number(r['perf'+i])); pM[p].d+=Number(r['durus'+i])||0; pM[p].c++;}});});
    const pl=Object.entries(pM).map(([p,v])=>({p, b:v.b, u:v.u, d:v.d, c:v.c, a:v.pp.length?v.pp.reduce((a,b)=>a+b,0)/v.pp.length:0})).sort((a,b)=>b.u-a.u);
    mc('p1','bar',{labels:pl.map(x=>x.p),datasets:[{label:'Üretim',data:pl.map(x=>x.u),backgroundColor:cR('accent',0.75)}]});
    $('th-pre').innerHTML=th(['Pres','Hedef (Adet)','Top.Üretim','Ort.Perf','Kayıt','Duruş (Dk)']);
    $('tb-pre').innerHTML=pl.map(x=>tr([`<b>${x.p}</b>`, n(x.b), n(x.u), pb(x.a), x.c, n(x.d)])).join('');
}

function rF(){
    const fM={}; const labelMap = getFasonNameMap();
    RAW.forEach(r=>{
        [1,2].forEach(i=>{
            const rawF = normalizeField(r['fason'+i]);
            if(!rawF) return;
            const fKey = normalizeFasonKey(rawF);
            if(!fM[fKey]) fM[fKey]={f:labelMap.get(fKey)||rawF,b:0,u:0,pp:[],c:0};
            fM[fKey].b += Number(r['beklenen'+i]) || 0;
            fM[fKey].u += Number(r['uretim'+i]) || 0;
            if(r['perf'+i]) fM[fKey].pp.push(Number(r['perf'+i]));
            fM[fKey].c++;
        });
    });
    const fl=Object.entries(fM).map(([k,v])=>({f:v.f, b:v.b, u:v.u, c:v.c, a:v.pp.length?v.pp.reduce((a,b)=>a+b,0)/v.pp.length:0})).sort((a,b)=>b.u-a.u);
    
    const fasList = $('fas-list');
    if(fasList) fasList.innerHTML = [...new Set(fl.map(x => x.f))].sort().map(f => `<option value="${escapeHTML(f)}">`).join('');

    mc('f1','bar',{labels:fl.slice(0,15).map(x=>x.f),datasets:[{label:'Üretim',data:fl.slice(0,15).map(x=>x.u),backgroundColor:cR('accent',0.75)}]},{idx:'y'});
    mc('f2','bar',{labels:[...fl].sort((a,b)=>b.a-a.a).slice(0,15).map(x=>x.f),datasets:[{label:'Perf %',data:[...fl].sort((a,b)=>b.a-a.a).slice(0,15).map(x=>x.a),backgroundColor:cR('accent4',0.75)}]},{idx:'y'});
    $('th-fas').innerHTML=th(['Fason','Hedef (Adet)','Top.Üretim','Ort.Perf','Kayıt']);
    $('tb-fas').innerHTML=fl.map(x=>tr([`<b>${x.f}</b>`, n(x.b), n(x.u), pb(x.a), x.c])).join('');
}

function analyzeFason(fasonName) {
    if(!fasonName) {
        $('fas-analyze-result').classList.add('hidden');
        return;
    }

    const match = resolveFasonInput(fasonName);
    if(!match) return;
    const { key: fKey, name: canonicalName } = match;
    
    // Bütün kayıtlardan bu fasonun çalıştığı presleri bul
    const pStats = {};
    RAW.forEach(r => {
        [1,2].forEach(i => {
            const f = normalizeField(r['fason'+i]);
            const p = r['pres'+i] || 'Belirtilmeyen Pres';
            if(f && normalizeFasonKey(f) === fKey) {
                if(!pStats[p]) pStats[p] = { runs: 0, perfArr: [], durus: 0, uretim: 0, beklenen: 0, netMins: 0 };
                pStats[p].runs++;
                if(r['perf'+i]) pStats[p].perfArr.push(Number(r['perf'+i]));
                const d = Number(r['durus'+i]) || 0;
                pStats[p].durus += d;
                pStats[p].uretim += Number(r['uretim'+i]) || 0;
                pStats[p].beklenen += Number(r['beklenen'+i]) || 0;
                // Duruş eksiye düşürmesin diye min 1 dakika çalışma sayıyoruz
                pStats[p].netMins += Math.max(450 - d, 1);
            }
        });
    });

    const presses = Object.entries(pStats).map(([p, v]) => {
        const avgPerf = v.perfArr.length ? v.perfArr.reduce((a,b)=>a+b,0)/v.perfArr.length : 0;
        const avgDurus = v.runs ? v.durus / v.runs : 0;
        
        // Puanlama mantığı: Dakikada Üretilen Adet
        // Eksik/hatalı girişlere karşı her bir kaydın duruşu maksimum 449 dakika sayılarak netMins toplanmıştır.
        const piecesPerMin = v.uretim / v.netMins;
        const piecesPerMin = v.netMins > 0 ? v.uretim / v.netMins : 0;

        return { pres: p, runs: v.runs, perf: avgPerf, durus: avgDurus, score: piecesPerMin, uretim: v.uretim, ppm: piecesPerMin };
    }).sort((a,b) => b.score - a.score);
        // YENİ: Vardiya başına üretim tahmini (Genel verimlilik metriği)
        const shiftProduction = piecesPerMin * (450 - avgDurus);

        return { 
            pres: p, 
            runs: v.runs, 
            perf: avgPerf, 
            durus: avgDurus, 
            score: shiftProduction, // Ana sıralama metriği artık vardiya üretimi
            uretim: v.uretim, 
            ppm: piecesPerMin, 
            shiftProd: shiftProduction 
        };
    }).sort((a,b) => b.score - a.score); // En verimli (vardiyada en çok üreten) prese göre sırala

    const resDiv = $('fas-analyze-result');
    resDiv.classList.remove('hidden');
    resDiv.classList.add('flex');

    if(presses.length === 0) {
        resDiv.innerHTML = `<div class="text-accent2 text-sm font-semibold">⚠️ "${escapeHTML(canonicalName)}" fasonu için geçmiş çalışma verisi bulunamadı.</div>`;
        return;
    }

    const best = presses[0];
    
    let html = `
    <div class="flex items-start gap-3 bg-accent3/10 p-3 md:p-4 rounded-xl border border-accent3/30">
        <div class="text-3xl md:text-4xl text-accent3">💡</div>
        <div class="flex-1">
            <h3 class="text-accent3 font-bebas text-lg md:text-xl tracking-wider mb-1">PLANLAMA ÖNERİSİ: ${escapeHTML(best.pres)}</h3>
            <p class="text-text2 text-xs md:text-sm leading-relaxed">
                Tarihsel verilere göre <b>${escapeHTML(canonicalName)}</b> fasonu en hızlı <b>${escapeHTML(best.pres)}</b> makinesinde üretilmektedir. 
                Bu preste duruşlar düşüldükten sonra dakikada ortalama <b class="text-accent">${best.ppm.toFixed(2)} adet</b> üretim gerçekleşmiştir. Toplam <b>${best.runs}</b> kez çalışılmış olup, vardiya başına ortalama <b class="text-accent2">${Math.round(best.durus)} dk</b> duruş süresi gözlemlenmiştir. 
                Planlamanızı bu prese yapmanız önerilir.
                Tarihsel verilere göre <b>${escapeHTML(canonicalName)}</b> fasonu için en verimli pres <b>${escapeHTML(best.pres)}</b> olarak analiz edilmiştir.
                Bu preste ortalama duruş süresi düşüldüğünde, 1 vardiyada (450 dk) yaklaşık <b class="text-accent text-lg">${n(best.shiftProd)} adet</b> üretim potansiyeli bulunmaktadır.<br>
                <span class="text-[11px] text-text3 mt-1 inline-block">
                    <b>Analiz Detayları:</b> Toplam <b>${best.runs}</b> kez çalışılmış, vardiya başına ortalama <b class="text-accent2">${Math.round(best.durus)} dk</b> duruş yaşanmış ve net çalışma hızının <b class="text-accent4">${best.ppm.toFixed(2)} adet/dk</b> olduğu görülmüştür.
                </span>
            </p>
        </div>
    </div>
    
    <div class="mt-2">
        <h4 class="font-bold text-text3 text-xs uppercase mb-2">Bu Fasonun Diğer Preslerdeki Kıyaslaması</h4>
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
    `;

    presses.forEach((p, idx) => {
        const isBest = idx === 0;
        html += `
            <div class="bg-bg border ${isBest ? 'border-accent3' : 'border-border/50'} rounded-lg p-3 flex flex-col gap-1 relative overflow-hidden shadow-sm">
                ${isBest ? '<div class="absolute top-0 right-0 bg-accent3 text-bg font-bold text-[8px] px-1.5 py-0.5 rounded-bl-lg">EN HIZLI</div>' : ''}
                <span class="font-bold text-text text-sm">${escapeHTML(p.pres)}</span>
                <div class="flex justify-between text-[10px] text-text2 border-t border-border/50 pt-1 mt-1">
                    <span>Kayıt: <b class="text-text">${p.runs}</b> kez</span>
                    <span>Hız: <b class="text-accent">${p.ppm.toFixed(2)} adet/dk</b></span>
            <div class="bg-bg border ${isBest ? 'border-accent3' : 'border-border/50'} rounded-lg p-3 flex flex-col gap-1.5 relative overflow-hidden shadow-sm">
                ${isBest ? '<div class="absolute top-0 right-0 bg-accent3 text-bg font-bold text-[8px] px-1.5 py-0.5 rounded-bl-lg">EN VERİMLİ</div>' : ''}
                <div class="flex justify-between items-baseline">
                    <span class="font-bold text-text text-sm">${escapeHTML(p.pres)}</span>
                    <span class="text-[10px] text-text3">Kayıt: <b class="text-text">${p.runs}</b></span>
                </div>
                <div class="flex justify-between text-[10px] text-text2">
                    <span>Toplam Üretim: <b>${n(p.uretim)}</b></span>
                </div>
                <div class="bg-bg3/50 rounded p-2 text-center mt-1">
                    <span class="text-[9px] text-text3 uppercase">Tahmini Vardiya Üretimi</span>
                    <span class="block font-bold text-lg ${isBest ? 'text-accent3' : 'text-text'}">${n(p.shiftProd)}</span>
                </div>
                <div class="flex justify-between text-[10px] text-text2 pt-1 mt-1">
                <div class="flex justify-between text-[10px] text-text2 pt-1 mt-1 border-t border-border/50">
                    <span>Hız: <b class="text-accent4">${p.ppm.toFixed(2)} adet/dk</b></span>
                    <span>Ort. Duruş: <b class="text-accent2">${Math.round(p.durus)} dk</b></span>
                </div>
            </div>
        `;
    });

    html += `</div></div>`;
    resDiv.innerHTML = html;
}

function rKaliphane() {
    if(!KALIP_RAW.h || !KALIP_RAW.h.length) {
        $('th-kalip').innerHTML = '';
        $('tb-kalip').innerHTML = '<tr><td class="p-4 text-center text-text3">Veri yükleniyor veya tablo boş...</td></tr>';
        return;
    }

    // Sütun başlıklarını ve renklerini tanımla
    const headers = [
        { name: 'LOKASYON', color: 'text-accent' },
        { name: 'RAF NO', color: 'text-accent3' },
        { name: 'KALIPLAR', color: 'text-accent4' }
    ];

    // Sütun indekslerini bulmaya çalış
    let lokasyonIdx = KALIP_RAW.h.findIndex(h => h.toLowerCase().includes('lokasyon'));
    let rafIdx = KALIP_RAW.h.findIndex(h => h.toLowerCase().includes('raf'));
    let kalipIdx = KALIP_RAW.h.findIndex(h => h.toLowerCase().includes('kalıp') || h.toLowerCase().includes('kalip'));

    // Bulunamazsa, ID olmayan ilk 3 sütunu varsay
    const idIdx = KALIP_RAW.h.findIndex(h => h.toLowerCase() === 'id' || h.toLowerCase() === 'ıd');
    const availableIndices = KALIP_RAW.h.map((_, i) => i).filter(i => i !== idIdx);
    if (lokasyonIdx === -1) lokasyonIdx = availableIndices.shift();
    if (rafIdx === -1) rafIdx = availableIndices.shift();
    if (kalipIdx === -1) kalipIdx = availableIndices.shift();
    const colIndices = [lokasyonIdx, rafIdx, kalipIdx].filter(i => i !== undefined);

    $('th-kalip').innerHTML = `<tr>${headers.map((h, i) => `<th class="sticky-th p-2 md:p-3 text-left font-sans font-semibold text-[11px] md:text-sm ${h.color} border-b-2 border-border uppercase th-bg leading-tight w-1/3">${h.name}</th>`).join('')}</tr>`;
    $('tb-kalip').innerHTML = KALIP_RAW.r.map((row, idx) => {
        const bgClass = idx % 2 === 0 ? 'bg-bg2' : 'bg-bg3/50';
        return `<tr class="${bgClass} hover:bg-border/50 border-b border-border/80 text-xs md:text-base cursor-pointer transition-colors" onclick="openGenericModal(${idx}, 'kalip')">
            ${colIndices.map(colIdx => `<td class="p-2 md:p-3 break-words align-top">${escapeHTML(row[colIdx] || '')}</td>`).join('')}
        </tr>`;
    }).join('');
}

function rKayitlar() {
    if (!DENEME_RAW.h || !DENEME_RAW.h.length) {
        $('th-deneme').innerHTML = '';
        $('tb-deneme').innerHTML = '<tr><td class="p-4 text-center text-text3">Veri bulunamadı veya sayfa boş.</td></tr>';
        return;
    }

    window._kayitlarData = DENEME_RAW;

    // Tabloda kalabalık yapmaması için sadece ilk 5 sütunu veya mevcut olanları gösterelim (ID hariç)
    const displayCols = [];
    for (let i = 0; i < DENEME_RAW.h.length && displayCols.length < 5; i++) {
        const hName = String(DENEME_RAW.h[i]).toLowerCase().trim();
        if (hName !== 'id' && hName !== 'ıd') {
            displayCols.push(i);
        }
    }

    $('th-deneme').innerHTML = `<tr>${displayCols.map(i => {
        let cleanH = String(DENEME_RAW.h[i]).replace(/^kriterler\s+/i, '').trim();
        return `<th class="sticky-th p-2 md:p-3 text-left font-sans font-semibold text-[11px] md:text-sm text-accent border-b-2 border-border uppercase th-bg leading-tight">${cleanH}</th>`;
    }).join('')}</tr>`;

    // Verileri ters çevir (yeni kayıtlar en üstte) ama orijinal indeksleri koru
    const mapped = DENEME_RAW.r.map((r, i) => ({ idx: i, data: r })).reverse();
    renderKayitTable(mapped, displayCols);
}

function renderKayitTable(items, displayCols) {
    if (!items.length) {
        $('tb-deneme').innerHTML = `<tr><td colspan="${displayCols.length}" class="p-4 text-center text-text3 font-mono text-sm">Veri bulunamadı veya arama sonucu boş.</td></tr>`;
        return;
    }

    $('tb-deneme').innerHTML = items.map((item, rowIdx) => {
        const bgClass = rowIdx % 2 === 0 ? 'bg-bg2' : 'bg-bg3/50';
        return `<tr class="${bgClass} hover:bg-border/50 border-b border-border/80 text-xs md:text-sm cursor-pointer transition-colors" onclick="openGenericModal(${item.idx}, 'deneme')">
            ${displayCols.map(colIdx => `<td class="p-2 md:p-3 break-words align-top">${escapeHTML(item.data[colIdx] || '')}</td>`).join('')}
        </tr>`;
    }).join('');
}

let kayitSearchTimeout;
function filterKayitlar(q) {
    clearTimeout(kayitSearchTimeout);
    kayitSearchTimeout = setTimeout(() => {
        const f = q.toLowerCase().trim();
        const mapped = DENEME_RAW.r.map((r, i) => ({ idx: i, data: r })).reverse();
        
        const displayCols = [];
        for (let i = 0; i < DENEME_RAW.h.length && displayCols.length < 5; i++) {
            const hName = String(DENEME_RAW.h[i]).toLowerCase().trim();
            if (hName !== 'id' && hName !== 'ıd') {
                displayCols.push(i);
            }
        }

        if (!f) {
            renderKayitTable(mapped, displayCols);
            return;
        }
        const filtered = mapped.filter(item => item.data.join(' ').toLowerCase().includes(f));
        renderKayitTable(filtered, displayCols);
    }, 300);
}
function rMalzeme() {
    if(!MALZEME_RAW.h.length) {
        $('th-malzeme').innerHTML = '';
        $('tb-malzeme').innerHTML = '<tr><td class="p-4 text-text3">Veri bulunamadı veya sayfa boş.</td></tr>';
        return;
    }

    // Boş başlıkları tespit edip filtrelemek için geçerli sütun indekslerini bulalım
    const validColIndices = [];
    MALZEME_RAW.h.forEach((header, idx) => {
        if (String(header).trim() !== '') {
            validColIndices.push(idx);
        }
    });

    $('th-malzeme').innerHTML = `<tr>${validColIndices.map(idx=>`<th class="sticky-th px-1.5 py-1 text-left font-mono text-[9px] text-text3 border-b border-border uppercase whitespace-nowrap th-bg max-w-[120px] truncate" title="${MALZEME_RAW.h[idx]}">${MALZEME_RAW.h[idx]}</th>`).join('')}</tr>`;
    $('tb-malzeme').innerHTML = MALZEME_RAW.r.map((row, rowIdx) => `<tr class="hover:bg-bg3 border-b border-border/50 text-[10px] cursor-pointer transition-colors" onclick="openGenericModal(${rowIdx}, 'malzeme')">${validColIndices.map(colIdx=>`<td class="px-1.5 py-1 whitespace-nowrap max-w-[120px] truncate" title="${row[colIdx]||''}">${row[colIdx]||'-'}</td>`).join('')}</tr>`).join('');

    // Akıllı Depo Analizi Dashboard
    const db = $('malzeme-dashboard');
    if (!db) return;
    if (MALZEME_RAW.r.length === 0) {
        db.style.display = 'none';
        return;
    }
    
    const headers = MALZEME_RAW.h.map(h => String(h).toLowerCase().trim());
    const idxPerson = headers.findIndex(h => h.includes('personel') || h.includes('çalışan') || h.includes('ad'));
    const idxUrun = headers.findIndex(h => h.includes('ürün') || h.includes('malzeme'));
    const idxAdet = headers.findIndex(h => h.includes('adet') || h.includes('miktar'));
    
    if (idxPerson > -1 && idxUrun > -1 && idxAdet > -1) {
        let personelData = {};
        let urunData = {};
        let totalAdet = 0;
        
        MALZEME_RAW.r.forEach(row => {
            const p = String(row[idxPerson] || 'Bilinmeyen').trim();
            const u = String(row[idxUrun] || 'Bilinmeyen').trim();
            const a = parseFloat(String(row[idxAdet]).replace(/,/g, '.')) || 0;
            
            if (!personelData[p]) personelData[p] = { count: 0 };
            personelData[p].count += a;
            
            if (!urunData[u]) urunData[u] = 0;
            urunData[u] += a;
            totalAdet += a;
        });
        
        const sortedPersonel = Object.entries(personelData).sort((a,b) => b[1].count - a[1].count);
        const topPerson = sortedPersonel[0];
        
        const sortedUrun = Object.entries(urunData).sort((a,b) => b[1] - a[1]);
        const topUrun = sortedUrun[0];
        
        const topPersonName = topPerson ? topPerson[0] : '';
        const topUrunName = topUrun ? topUrun[0] : '';

        const clkTotal = `openMalzemeListModal('📦 TÜM MALZEME ÇIKIŞLARI', 'all', '')`;
        const clkPerson = topPersonName ? `openMalzemeListModal('👑 EN ÇOK ALIM YAPAN: ${safeAttr(topPersonName)}', 'person', '${safeAttr(topPersonName)}')` : '';
        const clkUrun = topUrunName ? `openMalzemeListModal('🔥 EN ÇOK GİDEN ÜRÜN: ${safeAttr(topUrunName)}', 'urun', '${safeAttr(topUrunName)}')` : '';

        db.innerHTML = card('border-l-accent3 bg-accent3/5', '📦 TOPLAM MALZEME ÇIKIŞI', n(totalAdet), 'Adet Ürün', clkTotal) +
                       card('border-l-accent bg-accent/5', '👑 EN ÇOK ALIM YAPAN', topPersonName ? escapeHTML(topPersonName.split(' ')[0]) : '-', topPerson ? n(topPerson[1].count) + ' Adet Toplam' : '', clkPerson) +
                       card('border-l-accent4 bg-accent4/5', '🔥 EN ÇOK GİDEN ÜRÜN', topUrunName ? escapeHTML(topUrunName) : '-', topUrun ? n(topUrun[1]) + ' Adet Tüketildi' : '', clkUrun);
        db.style.display = 'grid';
    } else {
        db.style.display = 'none';
    }
}

function openMalzemeListModal(title, filterKey, filterValue) {
    let data = MALZEME_RAW.r;
    if (filterKey === 'person') {
        const idx = MALZEME_RAW.h.findIndex(h => String(h).toLowerCase().trim().includes('personel') || String(h).toLowerCase().trim().includes('çalışan') || String(h).toLowerCase().trim().includes('ad'));
        if (idx > -1) data = data.filter(row => String(row[idx]||'').trim() === filterValue);
    } else if (filterKey === 'urun') {
        const idx = MALZEME_RAW.h.findIndex(h => String(h).toLowerCase().trim().includes('ürün') || String(h).toLowerCase().trim().includes('malzeme'));
        if (idx > -1) data = data.filter(row => String(row[idx]||'').trim() === filterValue);
    }
    
    const validColIndices = [];
    MALZEME_RAW.h.forEach((header, idx) => {
        if (String(header).trim() !== '') validColIndices.push(idx);
    });

    const thHtml = `<tr>${validColIndices.map(idx=>`<th class="sticky-th px-3 py-2 text-left font-mono text-[10px] text-text3 border-b border-border uppercase whitespace-nowrap bg-bg3/90 backdrop-blur max-w-[150px] truncate" title="${escapeHTML(MALZEME_RAW.h[idx])}">${escapeHTML(MALZEME_RAW.h[idx])}</th>`).join('')}</tr>`;
    const tbHtml = data.length ? data.map((row) => `<tr class="hover:bg-bg3 border-b border-border/50 text-[11px] transition-colors">${validColIndices.map(colIdx=>`<td class="px-3 py-2 whitespace-nowrap max-w-[150px] truncate" title="${escapeHTML(row[colIdx]||'')}">${escapeHTML(row[colIdx]||'-')}</td>`).join('')}</tr>`).join('') : `<tr><td colspan="${validColIndices.length}" class="p-4 text-center text-text3">Kayıt bulunamadı.</td></tr>`;
    
    const mdl = $('generic-modal');
    if (mdl) {
        const h2 = mdl.querySelector('h2');
        if (h2) h2.innerText = title;
        $('gen-mdl-content').innerHTML = `
            <div class="overflow-auto max-h-[60vh] rounded border border-border custom-scrollbar">
                <table class="w-full text-left border-collapse">
                    <thead>${thHtml}</thead>
                    <tbody>${tbHtml}</tbody>
                </table>
            </div>
        `;
        mdl.classList.remove('hidden');
        mdl.classList.add('flex');
        setTimeout(() => mdl.classList.remove('opacity-0'), 10);
    }
}

function rPlan() {
    const frame = $('plan-frame');
    if(frame && !frame.getAttribute('src')) {
        // Google E-Tablolar /edit ucu iframe içinde engellendiğinden resmi embed ucu (/htmlembed) kullanıyoruz.
        // NOT: İframe'in çalışması için tablonun paylaşım ayarlarından "Bağlantıya sahip herkes görüntüleyebilir" seçili olmalıdır.
        frame.setAttribute('src', "https://docs.google.com/spreadsheets/d/1mUsX0-7J116EbvNpcW9WiZUrTy5CzHTILHwwPsht9IM/htmlembed?widget=true&chrome=false");
    }
}

function toggleFullScreen(id) {
    const el = $(id);
    if (!document.fullscreenElement) {
        if (el.requestFullscreen) { el.requestFullscreen().catch(e=>console.warn(e)); }
        else if (el.webkitRequestFullscreen) { el.webkitRequestFullscreen(); }
        else if (el.msRequestFullscreen) { el.msRequestFullscreen(); }
    } else {
        if (document.exitFullscreen) { document.exitFullscreen().catch(e=>console.warn(e)); }
        else if (document.webkitExitFullscreen) { document.webkitExitFullscreen(); }
        else if (document.msExitFullscreen) { document.msExitFullscreen(); }
    }
}

document.addEventListener('fullscreenchange', () => { const btn = $('fs-btn'); if(btn) btn.innerHTML = document.fullscreenElement ? '✖ ÇIKIŞ' : '⛶ TAM EKRAN'; });

let currentPlanZoom = 1;
function zoomPlan(delta) {
    currentPlanZoom += delta;
    if (currentPlanZoom < 0.4) currentPlanZoom = 0.4;
    if (currentPlanZoom > 3) currentPlanZoom = 3;
    
    const frame = $('plan-frame');
    if (frame) {
        frame.style.transform = `scale(${currentPlanZoom})`;
        frame.style.width = `${100 / currentPlanZoom}%`;
        frame.style.height = `${100 / currentPlanZoom}%`;
    }
}

// ETKİLEŞİM & MODALLAR
function showKpiDet(tab, type) {
    let data = [], title = '';
    let dd = (tab==='g') ? RAW.filter(r=>r.tarih===sD) : (tab==='w') ? RAW.filter(r=>isoW(r.tarih)===sW) : (tab==='m') ? RAW.filter(r=>r.tarih.endsWith(sM)) : RAW;
    title = (tab==='g') ? sD : (tab==='w') ? sW+' Haftası' : (tab==='m') ? sM+' Ayı' : 'Tüm Zamanlar';
    if(['u','p','c'].includes(type)) { data = dd; title += ' Genel Kayıtlar'; }
    if(type === 'd') { data = dd.filter(r=>r.durus1>0 || r.durus2>0); title += ' Duruş Yapanlar'; }
    if(type === 'lo') { data = dd.filter(r=>r.tP>0 && r.tP<80); title += ' Düşük Performans (<%80)'; }
    if(type === 'hi') { data = dd.filter(r=>r.tP>=110); title += ' Yüksek Performans (≥%110)'; }
    if(data.length > 0) openRecsModal(title.toUpperCase(), data); else toast("Bu kritere uygun kayıt bulunamadı.", "warn");
}

function handleChartClick(id, label) {
    let data = [], title = '';
    if(cTab === 'gunluk') {
       if(id==='c1') return openModal(label);
       if(id==='c2') { data = RAW.filter(r=>r.tarih===sD).filter(r=>label==='Diğer'?(r.vardiya!=='08:00-16:00'&&r.vardiya!=='16:00-24:00'):r.vardiya===label); title = sD+' | '+label+' VARDİYASI'; }
       if(id==='c3' || id==='c4') { data = RAW.filter(r=>r.tarih===sD).filter(r=>r.pres1===label || r.pres2===label); title = sD+' | '+label; }
    }
    else if(cTab === 'haftalik') {
       if(id==='w1' || id==='w2') { data = RAW.filter(r=>r.tarih.startsWith(label)); title = label + ' GÜNLÜK DETAYI'; }
       if(id==='w3') { data = RAW.filter(r=>isoW(r.tarih)===sW).filter(r=>r.pres1===label || r.pres2===label); title = sW+' | '+label; }
       if(id==='w4') { data = RAW.filter(r=>isoW(r.tarih)===sW).filter(r=>label==='Diğer'?(r.vardiya!=='08:00-16:00'&&r.vardiya!=='16:00-24:00'):r.vardiya===label); title = sW+' | '+label+' VARDİYASI'; }
    }
    else if(cTab === 'aylik') {
       if(id==='m1' || id==='m2') { data = RAW.filter(r=>r.tarih === label + '.' + sM); title = label + '.' + sM + ' GÜNLÜK DETAYI'; }
       if(id==='m3') { data = RAW.filter(r=>r.tarih.endsWith(sM)).filter(r=>r.pres1===label || r.pres2===label); title = sM+' | '+label; }
       if(id==='m4') { data = RAW.filter(r=>r.tarih.endsWith(sM)).filter(r=>label==='Diğer'?(r.vardiya!=='08:00-16:00'&&r.vardiya!=='16:00-24:00'):r.vardiya===label); title = sM+' | '+label+' VARDİYASI'; }
    }
    else if(cTab === 'genel') {
       if(id==='h1' || id==='h2') { data = RAW.filter(r=>r.tarih.startsWith(label)); title = label + ' DETAYI'; }
       if(id==='h3') return openModal(label);
    }
    else if(cTab === 'calisan' && id==='ca1') return openModal(label);
    else if(cTab === 'pres' && id==='p1') { data = RAW.filter(r=>r.pres1===label || r.pres2===label); title = label + ' TÜM KAYITLARI'; }
    else if(cTab === 'fason' && (id==='f1' || id==='f2')) { data = RAW.filter(r=>r.fason1===label || r.fason2===label); title = label + ' TÜM KAYITLARI'; }
    if(data.length > 0) openRecsModal(title.toUpperCase(), data);
}

function openRecsModal(title, data) {
    if (!data) data = [];
    recsModalData = data; recsModalTitle = title;
    $('recs-title').innerText = title || ''; const s = calc(data);
    const cCard = (l, v1, v2, v3) => `<div class="bg-bg border border-border rounded p-3 flex flex-col"><span class="text-xs font-mono text-text3 mb-1">${l}</span><span class="font-bold text-lg text-text">${v1}</span><div class="flex justify-between mt-1"><span class="text-[10px] text-accent">${v2}</span><span class="text-[10px] text-accent2">${v3}</span></div></div>`;
    $('recs-stats').innerHTML = cCard('TOPLAM ÜRETİM', n(s.u)+' Adet', s.c+' Kayıt', n(s.b)+' Hedef') + cCard('ORTALAMA PERF.', (Number(s.p)||0).toFixed(1)+'%', '', '') + cCard('TOPLAM DURUŞ', n(s.d)+' Dk', '', '') + cCard('ÇALIŞAN', new Set(data.map(r=>r.calisan)).size+' Kişi', '', '');
    
    const isAdmin = LOGGED_IN_USER && LOGGED_IN_USER.role === 'admin';
    $('t-recs').innerHTML = `<thead>${thD(['Tarih','Çalışan','Vardiya','Pres 1','Fason 1','Hdf 1','Ürt 1','Perf 1','Dur 1','Pres 2','Fason 2','Hdf 2','Ürt 2','Perf 2','Dur 2','Top.Hdf','Top.Ürt','Ort.Perf', ...(isAdmin ? ['İşlem'] : [])])}</thead><tbody id="recs-body" class="text-xs">` + 
        data.map(r => trD([
            r.tarih, `<a class="emp-link font-bold" onclick="closeRecsModal(); setTimeout(()=>openModal('${safeAttr(r.calisan)}'), 300);">${escapeHTML(r.calisan)}</a>`, r.vardiya||'-', 
            r.pres1||'-', r.fason1||'-', n(r.beklenen1), n(r.uretim1), r.perf1>0?pb(r.perf1):'-', r.durus1>0?`<span class="px-1.5 py-0.5 bg-accent2/20 text-accent2 rounded-full text-[10px] font-bold">${r.durus1} dk</span>`:'-',
            r.pres2||'-', r.fason2||'-', n(r.beklenen2), n(r.uretim2), r.perf2>0?pb(r.perf2):'-', r.durus2>0?`<span class="px-1.5 py-0.5 bg-accent2/20 text-accent2 rounded-full text-[10px] font-bold">${r.durus2} dk</span>`:'-',
            n(r.tB), `<b class="text-accent">${n(r.tU)}</b>`, pb(r.tP),
            ...(isAdmin ? [`<div class="flex gap-2"><button onclick="closeRecsModal(); editProductionRecord('${r.tarih}','${safeAttr(r.calisan)}')" class="text-accent hover:underline text-[14px]">✎</button><button onclick="deleteProductionRecord('${r.tarih}','${safeAttr(r.calisan)}')" class="text-accent2 hover:underline text-[14px]">🗑</button></div>`] : [])
        ])).join('') + `</tbody>`;
    
    const el = $('recs-modal'); el.classList.remove('hidden'); el.classList.add('flex'); setTimeout(()=>el.classList.remove('opacity-0'),10);
}
function closeRecsModal() { const el = $('recs-modal'); el.classList.add('opacity-0'); setTimeout(()=> { el.classList.add('hidden'); el.classList.remove('flex'); }, 300); }

function openModal(emp) {
    const data = RAW.filter(r => r.calisan === emp).sort((a,b)=> a.tarih.split('.').reverse().join('') > b.tarih.split('.').reverse().join('') ? -1 : 1);
    $('mdl-name').innerText = emp + (sM ? ' — ' + sM + ' AYI' : '');
    const cCard = (lbl, val) => `
        <div class="bg-bg border border-border rounded p-4 flex flex-col shadow-inner">
            <span class="text-xs font-mono text-text3 mb-1">${lbl}</span>
            <div class="flex items-baseline gap-1"><span class="font-bold text-xl text-text">${n(val.u)}</span><span class="text-[10px] text-text3 mb-1"> / ${n(val.b)} Hdf</span></div>
            <div class="flex justify-between items-center mt-2 border-t border-border/50 pt-2 gap-2">
                        <span class="text-[11px] ${val.p>=100?'text-accent':'text-accent2'} font-bold">${(Number(val.p)||0).toFixed(1)}% Perf.</span>
                <span class="text-[11px] font-mono text-accent2">${n(val.d)} dk Duruş</span>
            </div>
        </div>`;
    $('mdl-stats').innerHTML = cCard(`GÜNLÜK (${sD})`, calc(data.filter(r => r.tarih === sD))) + cCard('HAFTALIK', calc(data.filter(r => isoW(r.tarih) === sW))) + cCard(`AYLIK (${sM})`, calc(data.filter(r => r.tarih.endsWith(sM)))) + cCard('TÜM ZAMANLAR', calc(data));
    
    const isAdmin = LOGGED_IN_USER && LOGGED_IN_USER.role === 'admin';
    $('mdl-th').innerHTML = th(['Tarih','Vardiya','Presler','Hedef','Üretim','Performans','Duruş', ...(isAdmin ? ['İşlem'] : [])]);
    const monthData = sM ? data.filter(r => r.tarih.endsWith(sM)) : data;
    $('mdl-history').innerHTML = monthData.map(r => { const topD = r.durus1 + r.durus2; return `
        <tr class="border-b border-border/50 hover:bg-bg2">
            <td class="p-3 font-mono">${r.tarih}</td>
            <td class="p-3 text-text2">${r.vardiya}</td>
            <td class="p-3 text-text2">${r.pres1} ${r.pres2 ? '<br>'+r.pres2 : ''}</td>
            <td class="p-3 font-mono text-text3">${n(r.tB)}</td>
            <td class="p-3 font-mono font-bold text-accent">${n(r.tU)}</td>
            <td class="p-3">${pb(r.tP)}</td>
            <td class="p-3 font-mono">${topD > 0 ? `<span class="px-1.5 py-0.5 bg-accent2/20 text-accent2 rounded-full text-[10px] font-bold">${n(topD)} dk</span>` : '-'}</td>
            ${isAdmin ? `<td class="p-3 flex gap-2"><button onclick="closeModal(); editProductionRecord('${r.tarih}','${safeAttr(r.calisan)}')" class="text-accent hover:text-accent/80 text-[14px]" title="Düzenle">✎</button><button onclick="deleteProductionRecord('${r.tarih}','${safeAttr(r.calisan)}')" class="text-accent2 hover:text-accent2/80 text-[14px]" title="Sil">🗑</button></td>` : ''}
        </tr>`;}).join('');
    const el = $('emp-modal'); el.classList.remove('hidden'); el.classList.add('flex'); setTimeout(()=>el.classList.remove('opacity-0'),10);
}
function closeModal() { const el = $('emp-modal'); el.classList.add('opacity-0'); setTimeout(()=> { el.classList.add('hidden'); el.classList.remove('flex'); }, 300); }

// GENEL KAYIT DETAY MODALI (Üretim Takip Denemeleri & Malzeme Takip İçin)
function openGenericModal(idx, type = 'deneme') {
    const rawData = type === 'malzeme' ? MALZEME_RAW : (type === 'kalip' ? KALIP_RAW : DENEME_RAW);
    const row = rawData.r[idx];
    const headers = rawData.h;
    let html = '';

    if (type === 'deneme') {
        let groups = {
            'TEMEL BİLGİ': [],
            'KRİTERLER': [],
            'ÖLÇÜMLER': [],
            'AÇIKLAMALAR': []
        };

        headers.forEach((h, i) => {
            const hL = h.toLowerCase();
            if (hL === 'id' || hL === 'no') return;

            const val = row[i];
            if (!val || val === '-') return;

            let cat = 'TEMEL BİLGİ';
            if (hL.includes('sonuç') || hL.includes('açıklama') || hL.includes('not') || hL.includes('sorun') || hL.includes('hata')) cat = 'AÇIKLAMALAR';
            else if (hL.includes('ölçüm') || hL.includes('değer') || hL.includes('basınç') || hL.includes('hız') || hL.includes('sıcaklık') || hL.includes('zaman')) cat = 'ÖLÇÜMLER';
            else if (hL.includes('kriter') || hL.includes('şart') || hL.includes('hedef') || hL.includes('beklenen') || hL.includes('tolerans')) cat = 'KRİTERLER';

            let cleanH = h.trim();

            groups[cat].push({ h: cleanH, val });
        });

        const renderGroup = (gName, items) => {
            if (!items || items.length === 0) return '';
            let groupColor = 'text-accent'; let borderColor = 'border-accent/30'; let bgHeader = 'bg-accent/10';
            if (gName === 'KRİTERLER') { groupColor = 'text-accent3'; borderColor = 'border-accent3/30'; bgHeader = 'bg-accent3/10'; }
            else if (gName === 'ÖLÇÜMLER') { groupColor = 'text-accent4'; borderColor = 'border-accent4/30'; bgHeader = 'bg-accent4/10'; }
            else if (gName === 'AÇIKLAMALAR') { groupColor = 'text-text2'; borderColor = 'border-border'; bgHeader = 'bg-bg3'; }
            
            return `<div class="bg-bg2 border ${borderColor} rounded-xl overflow-hidden shadow-sm flex-1 h-fit w-full">
                <div class="${bgHeader} px-4 py-2 border-b ${borderColor} font-bebas tracking-wider ${groupColor} text-base md:text-lg">${gName}</div>
                <div class="p-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
                    ${items.map(item => `<div class="flex flex-col border-b border-border/40 pb-2"><span class="text-[10px] text-text3 uppercase font-semibold mb-1">${escapeHTML(item.h)}</span><span class="text-sm font-mono text-text break-words whitespace-pre-wrap">${escapeHTML(item.val)}</span></div>`).join('')}
                </div>
            </div>`;
        };

        html = '<div class="flex flex-col gap-4">';
        html += renderGroup('TEMEL BİLGİ', groups['TEMEL BİLGİ']);
        
        html += `<div class="flex flex-col lg:flex-row gap-4 items-start w-full">
                    ${renderGroup('KRİTERLER', groups['KRİTERLER'])}
                    ${renderGroup('ÖLÇÜMLER', groups['ÖLÇÜMLER'])}
                </div>`;
                
        html += renderGroup('AÇIKLAMALAR', groups['AÇIKLAMALAR']);
        html += '</div>';

    } else {
        headers.forEach((h, i) => {
            html += `<div class="bg-bg3 border border-border rounded p-3 flex flex-col sm:flex-row sm:items-center justify-between shadow-sm hover:shadow-md transition-shadow"><span class="text-[11px] font-mono text-text3 mb-1 sm:mb-0 uppercase w-1/3">${h}</span><span class="font-bold text-sm text-text break-words whitespace-normal w-2/3 sm:text-right">${row[i] || '-'}</span></div>`;
        });
    }

    const isAdmin = LOGGED_IN_USER && LOGGED_IN_USER.role === 'admin';
    let actionHtml = '';
    if(isAdmin) {
        const sheetName = type === 'malzeme' ? 'Pres Malzeme Takip Listesi' : (type === 'kalip' ? 'Kalıphane Lokasyonları' : 'Üretim Takip Denemeleri');
        actionHtml = `<div class="mt-4 pt-4 border-t border-border flex gap-2 justify-end">
            <button onclick="editGenericRecord(${idx}, '${type}')" class="px-4 py-2 bg-accent text-white rounded shadow text-xs font-bold hover:bg-accent/80 transition-colors">✎ DÜZENLE</button>
            <button onclick="deleteGenericRecord(${idx}, '${sheetName}')" class="px-4 py-2 bg-accent2 text-white rounded shadow text-xs font-bold hover:bg-accent2/80 transition-colors">🗑 BU KAYDI SİL</button>
        </div>`;
    }

    $('gen-mdl-content').innerHTML = html + actionHtml;
    const el = $('generic-modal'); el.classList.remove('hidden'); el.classList.add('flex'); setTimeout(()=>el.classList.remove('opacity-0'),10);
}

function closeGenericModal() { const el = $('generic-modal'); el.classList.add('opacity-0'); setTimeout(()=> { el.classList.add('hidden'); el.classList.remove('flex'); }, 300); }

async function deleteGenericRecord(index, sheetName) {
    if(!confirm(`Bu kaydı (${sheetName}) SİLMEK istediğinize emin misiniz?`)) return;
    const payload = { action: "deleteRecord", sheet: sheetName, rowIndex: index + 2 };
    try {
        toast('Siliniyor...', 'warn');
        await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
        toast('Silme komutu gönderildi.', 'ok');
        closeGenericModal();
        setTimeout(() => fetchCSV(true), 1000);
    } catch(err) { toast('İşlem başarısız', 'err'); }
}

// EKRAN GÖRÜNTÜSÜ ŞEKLİNDE PDF İNDİR (Güncellendi)
function exportToPDF() {
    window.print();
}
function exportRecsToPDF() {
    window.print();
}

// FORM İŞLEMLERİ VE DOĞRULAMA
function popF(){
    const calisanInput = $('f-calisan');
    const vC = calisanInput.value, vP1 = $('f-pres1').value, vP2 = $('f-pres2').value, vF1 = $('f-fason1').value, vF2 = $('f-fason2').value;

    if (LOGGED_IN_USER && LOGGED_IN_USER.role === 'admin') {
        const emps=[...new Set(Object.keys(USER_DATA))].filter(x=>x).sort();
        const dl = $('form-user-list');
        if (dl) dl.innerHTML = emps.map(e=>`<option value="${e}">`).join('');
        calisanInput.disabled = false;
    } else if (LOGGED_IN_USER) {
        calisanInput.value = LOGGED_IN_USER.name;
        calisanInput.disabled = true;
    }

    const presses=[...new Set([...RAW.map(r=>r.pres1), ...RAW.map(r=>r.pres2)])].filter(x=>x).sort();
    const fasonFromSheet = [];
    if (Array.isArray(FASONLAR_RAW)) {
        FASONLAR_RAW.forEach((row, rowIdx) => {
            if (!Array.isArray(row)) return;
            if (rowIdx === 0) {
                const h0 = normalizeText(row[0] || '');
                const h1 = normalizeText(row[1] || '');
                const h2 = normalizeText(row[2] || '');
                if (h0.includes('fason') || h1.includes('fason') || h2.includes('iscilik')) return;
            }
            if (row[1]) fasonFromSheet.push(row[1]);
            else if (row[0]) fasonFromSheet.push(row[0]);
        });
    }
    const fasons = [...new Set([...RAW.map(r => normalizeField(r.fason1)), ...RAW.map(r => normalizeField(r.fason2)), ...fasonFromSheet])].filter(x=>x).sort();
    
    const pOpts='<option value="">Seçiniz...</option>'+presses.map(p=>`<option value="${p}">${p}</option>`).join('');
    $('f-pres1').innerHTML=pOpts; $('f-pres2').innerHTML=pOpts.replace('Seçiniz...','Yok/Seçiniz...');
    
    const fOpts='<option value="">Yok/Seçiniz...</option>'+fasons.map(f=>`<option value="${f}">${f}</option>`).join('');
    $('f-fason1').innerHTML=fOpts; $('f-fason2').innerHTML=fOpts;
    
    if(vC && LOGGED_IN_USER.role === 'admin') calisanInput.value = vC;
    if(vP1) $('f-pres1').value = vP1;
    if(vP2) $('f-pres2').value = vP2;
    if(vF1) $('f-fason1').value = vF1;
    if(vF2) $('f-fason2').value = vF2;

    if(!$('f-tarih').value) $('f-tarih').value=new Date().toISOString().split('T')[0];
}

let editModeRecord = null;
function editProductionRecord(tarih, calisan) {
    const rec = RAW.find(r => r.tarih === tarih && r.calisan === calisan);
    if(!rec) return;
    editModeRecord = rec;
    
    swT('form', document.querySelector(`.nav-tab[onclick*="'form'"]`));
    popF(); // Seçenekleri doldur
    
    $('f-tarih').value = rec.tarih.split('.').reverse().join('-');
    $('f-calisan').value = rec.calisan;
    $('f-vardiya').value = rec.vardiya;
    $('f-pres1').value = rec.pres1 || '';
    $('f-fason1').value = rec.fason1 || '';
    $('f-uretim1').value = rec.uretim1 || '';
    $('f-durus1').value = rec.durus1 || '';
    $('f-pres2').value = rec.pres2 || '';
    $('f-fason2').value = rec.fason2 || '';
    $('f-uretim2').value = rec.uretim2 || '';
    $('f-durus2').value = rec.durus2 || '';
    
    $('form-title').innerHTML = '✎ ÜRETİM KAYDI DÜZENLEME';
    $('btn-submit-form').innerHTML = '💾 DEĞİŞİKLİKLERİ KAYDET';
    $('btn-cancel-edit').classList.remove('hidden');
}

function cancelEdit() {
    editModeRecord = null;
    $('uretim-formu').reset();
    popF();
    $('form-title').innerHTML = 'YENİ ÜRETİM KAYDI GİRİŞİ';
    $('btn-submit-form').innerHTML = '💾 KAYDET VE GÖNDER';
    $('btn-cancel-edit').classList.add('hidden');
    if($('dup-warn')) $('dup-warn').classList.add('hidden');
}

async function deleteProductionRecord(tarih, calisan) {
    if(!confirm(`${tarih} tarihli ${calisan} kaydını SİLMEK istediğinize emin misiniz?`)) return;
    const payload = { action: "deleteRecord", Tarih: tarih, "\u00c7al\u0131\u015fan": calisan };
    try {
        toast('Siliniyor...', 'warn');
        await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
        toast('Silme isteği gönderildi.', 'ok');
        setTimeout(() => fetchCSV(true), 1000);
    } catch(err) { toast('İşlem başarısız', 'err'); }
}

function checkDuplicate(){
    const trh=$('f-tarih').value.split('-').reverse().join('.');
    const cal=$('f-calisan').value;
    const warn=$('dup-warn'), txt=$('dup-warn-text');
    if(!warn) return;
    if(!trh||!cal) { warn.classList.add('hidden'); return; }
    if(editModeRecord && editModeRecord.tarih === trh && editModeRecord.calisan === cal) { warn.classList.add('hidden'); return; }
    const exists=RAW.some(r=>r.tarih===trh&&r.calisan===cal);
    if(exists){ txt.innerText=`${cal} için ${trh} tarihinde kayıt zaten mevcut! Gönderirseniz hata alırsınız.`; warn.classList.remove('hidden'); }
    else warn.classList.add('hidden');
}

function getIscilik(fasonName) {
    if(!fasonName || !FASONLAR_RAW) return 0;
    const fKey = normalizeFasonKey(fasonName);
    for (let i = 0; i < FASONLAR_RAW.length; i++) {
        const row = FASONLAR_RAW[i];
        if (row && row.length > 2 && row[1]) {
            if (normalizeFasonKey(row[1]) === fKey) {
                const valStr = String(row[2]).replace(',', '.');
                return parseFloat(valStr) || 0;
            }
        }
    }
    return 0;
}

async function submitForm(e){
    e.preventDefault();
    const trh=$('f-tarih').value.split('-').reverse().join('.'); const cal=$('f-calisan').value;
    
    if(RAW.some(r=>r.tarih===trh && r.calisan===cal) && (!editModeRecord || (editModeRecord.tarih !== trh || editModeRecord.calisan !== cal))){
        toast(`${cal} için ${trh} tarihinde kayıt zaten mevcut!`, 'err'); return;
    }

    if(!confirm(editModeRecord ? 'Değişiklikleri kaydetmek istediğinize emin misiniz?' : 'Bu veriyi kaydetmek ve göndermek istediğinize emin misiniz?')) return;

    const btn = $('btn-submit-form');
    const origTxt = btn.innerHTML;
    btn.innerHTML = '⏳ İŞLENİYOR...'; 
    btn.disabled = true;

    let vDurussuz1 = parseFloat($('f-durussuz1').value) || 0;
    let vDurussuz2 = parseFloat($('f-durussuz2').value) || 0;
    
    const vFason1 = $('f-fason1').value;
    const vFason2 = $('f-fason2').value;
    
    if (vDurussuz1 === 0 && vFason1) {
        const iscilik1 = getIscilik(vFason1);
        if (iscilik1 > 0) vDurussuz1 = 450 / iscilik1;
    }
    if (vDurussuz2 === 0 && vFason2) {
        const iscilik2 = getIscilik(vFason2);
        if (iscilik2 > 0) vDurussuz2 = 450 / iscilik2;
    }

    const vUretim1 = parseFloat($('f-uretim1').value) || 0;
    const vUretim2 = parseFloat($('f-uretim2').value) || 0;
    const vDurus1 = parseFloat($('f-durus1').value) || 0;
    const vDurus2 = parseFloat($('f-durus2').value) || 0;

    let calisilan1 = 450 - vDurus1;
    let beklenen1 = vDurussuz1 > 0 ? (vDurussuz1 / 450) * calisilan1 : 0;
    let perf1 = beklenen1 > 0 ? vUretim1 / beklenen1 : 0;

    let calisilan2 = 450 - vDurus2;
    let beklenen2 = vDurussuz2 > 0 ? (vDurussuz2 / 450) * calisilan2 : 0;
    let perf2 = beklenen2 > 0 ? vUretim2 / beklenen2 : 0;

    let perfCount = 0;
    let topPerf = 0;
    if ($('f-pres1').value && beklenen1 > 0) { topPerf += perf1; perfCount++; }
    if ($('f-pres2').value && beklenen2 > 0) { topPerf += perf2; perfCount++; }
    
    let gunlukPerf = perfCount > 0 ? topPerf / perfCount : 0;
    let toplamUretim = vUretim1 + vUretim2;

    const fmt = (v) => v ? v.toFixed(1).replace('.', ',') : "";
    const fmtP = (v) => v ? (v * 100).toFixed(2).replace('.', ',') + '%' : "";

    // DİKKAT: Sol taraftaki anahtar isimleri (Tarih, Çalışan vb.) Google Sheets'teki 
    // birinci satırda yer alan sütun başlıklarınızla HARFİ HARFİNE AYNI olmalıdır.
    const payload = {
        "ID": editModeRecord && editModeRecord.id ? editModeRecord.id : "veri_" + Date.now(),
        "Tarih": trh,
        "Çalışan": cal,
        "Vardiya": $('f-vardiya').value,
        "Pres1": $('f-pres1').value,
        "Fason1": $('f-fason1').value,
        "Duruşsuz 1 vardiyalık üretim adedi 1": vDurussuz1 ? vDurussuz1.toFixed(2).replace('.', ',') : "",
        "Üretilen Adet 1": vUretim1 || "",
        "Çalışılan Süre İle Üretilmesi Gereken Adet 1": fmt(beklenen1),
        "Üretim Yüzdesi (Performans)": fmtP(perf1),
        "Arıza Türü 1": "",
        "Duruş Başlangıcı 1": "",
        "Duruş Bitişi 1": "",
        "Duruş Süresi 1 (dk)": vDurus1 || 0,
        "Pres2": $('f-pres2').value,
        "Fason2": $('f-fason2').value,
        "Duruşsuz 1 vardiyalık üretim adedi 2": vDurussuz2 ? vDurussuz2.toFixed(2).replace('.', ',') : "",
        "Üretilen Adet 2": vUretim2 || "",
        "Çalışılan Süre İle Üretilmesi Gereken Adet2": fmt(beklenen2),
        "Üretim Yüzdesi (Performans)2": fmtP(perf2),
        "Arıza Türü 2": "",
        "Duruş Başlangıcı 2": "",
        "Duruş Bitişi 2": "",
        "Duruş Süresi 2 (dk)": vDurus2 || 0,
        "Günlük Toplam Performans": fmtP(gunlukPerf),
        "Toplam Üretilen Çift Kafa Günlük Adet": toplamUretim ? toplamUretim.toFixed(2).replace('.', ',') : ""
    };
    
    if (editModeRecord) {
        payload.action = "editRecord";
        payload.oldTarih = editModeRecord.tarih;
        payload.oldCalisan = editModeRecord.calisan;
    } else {
        payload.action = "addRecord";
    }

    try {
        await fetch(SCRIPT_URL, {
            method: 'POST',
            mode: 'no-cors', // Opaque response göndererek CORS hatalarını baypas eder.
                    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify(payload)
        });
        
        toast('BAŞARIYLA İŞLENDİ!', 'ok'); 
        if (editModeRecord) cancelEdit();
        else { e.target.reset(); popF(); }
        if($('dup-warn')) $('dup-warn').classList.add('hidden');
        setTimeout(() => fetchCSV(true), 1000); // 1 saniye sonra verileri yenile
    } catch(err) {
        alert('❌ İŞLEM HATASI: İnternet bağlantınızı kontrol edin.');
    } finally {
        btn.innerHTML = origTxt; btn.disabled = false;
    }
}

// KULLANICI GİRİŞ SİSTEMİ
// FIX #1: $() sadece getElementById'dir, class seçici ALAMAZ.
// showLogin ve login fonksiyonlarında document.querySelector('.main-content') kullanılıyor.

function applyRoleRestrictions() {
    // 1. Önce tüm sekmeleri ve menüleri görünür yap (Yönetici için tam erişim sıfırlaması)
    document.querySelectorAll('.nav-tab, #nav-dropdown-raporlar').forEach(el => {
        el.classList.remove('hidden');
        el.style.display = '';
    });
    
    const adminBtn = $('nav-admin');
    if(adminBtn) {
        if (LOGGED_IN_USER && LOGGED_IN_USER.role === 'admin') {
            adminBtn.classList.remove('hidden');
            adminBtn.style.display = '';
        } else {
            adminBtn.classList.add('hidden');
            adminBtn.style.display = 'none';
        }
    }
    
    document.querySelectorAll('.admin-only-btn').forEach(btn => {
        btn.classList.toggle('hidden', !(LOGGED_IN_USER && LOGGED_IN_USER.role === 'admin'));
        btn.classList.toggle('flex', !!(LOGGED_IN_USER && LOGGED_IN_USER.role === 'admin'));
    });

    // 2. Eğer kullanıcı normal üye ise kısıtlamaları uygula
    if (LOGGED_IN_USER && LOGGED_IN_USER.role !== 'admin') {
        adminSettings.hiddenTabs.forEach(tab => {
            const navEl = document.querySelector(`.nav-tab[onclick*="'${tab}'"]`);
            if(navEl) {
                navEl.classList.add('hidden');
                navEl.style.display = 'none';
            }
        });
        
        // Raporlar menüsündeki tüm sekmeler gizliyse, ana "Raporlar" butonunu da komple gizle
        const raporlarDropdown = $('nav-dropdown-raporlar');
        if(raporlarDropdown) {
            const visibleRapor = Array.from(raporlarDropdown.querySelectorAll('.nav-tab')).filter(el => !el.classList.contains('hidden'));
            if(visibleRapor.length === 0) {
                raporlarDropdown.classList.add('hidden');
                raporlarDropdown.style.display = 'none';
            }
        }
        
        // Eğer üye, gizli olan veya erişimi olmayan (admin) bir sayfadaysa izin verilen ilk sayfaya yönlendir
        if(adminSettings.hiddenTabs.includes(cTab) || cTab === 'admin') {
            const firstVisible = Array.from(document.querySelectorAll('.nav-tab')).find(el => el.style.display !== 'none' && !el.classList.contains('hidden') && el.id !== 'nav-admin');
            if(firstVisible) {
                const match = firstVisible.getAttribute('onclick').match(/'([^']+)'/);
                if(match) swT(match[1], firstVisible);
            } else {
                const def = document.querySelector(`.nav-tab[onclick*="'gunluk'"]`);
                if(def) swT('gunluk', def);
            }
        }
    }
}

let currentChatPartner = null;
const ORIGINAL_TITLE = 'Pres Üretim Takip Dashboard';

function checkNotifs() {
    const badge = $('notif-badge');
    const pnl = $('hdr-notif');
    const pnlTitle = $('hdr-notif-title');
    const pnlText = $('hdr-notif-text');
    if(!LOGGED_IN_USER) return;
    
    const myName = LOGGED_IN_USER.name;
    const readStates = safeJSON(localStorage.getItem('chatReadStates_' + myName), {});
    
    let unreadChats = 0;
    let totalUnreadMsgs = 0;

    if (MESAJ_RAW.r) {
        const chatGroups = {};
        MESAJ_RAW.r.forEach((r, idx) => {
            const from = r[1], to = r[2];
            if(from === myName || to === myName || to === 'GLOBAL') {
                const partner = (to === 'GLOBAL') ? 'GLOBAL' : (from === myName ? to : from);
                if (!chatGroups[partner]) chatGroups[partner] = { unread: 0 };
                
                const lastReadIdx = readStates[partner] !== undefined ? readStates[partner] : -1;
                if (idx > lastReadIdx && from !== myName) {
                    chatGroups[partner].unread++;
                    totalUnreadMsgs++;
                }
            }
        });
        Object.values(chatGroups).forEach(g => { if(g.unread > 0) unreadChats++; });
    }

    if(totalUnreadMsgs > 0) {
        if (document.hidden) {
            document.title = `(${totalUnreadMsgs}) Yeni Mesaj!`;
            drawFaviconBadge(true);
        }

        if(badge) { badge.innerText = totalUnreadMsgs; badge.classList.remove('hidden'); badge.classList.add('flex'); }
        if(pnl) { pnl.classList.add('bg-accent2/10', 'border-accent2/50', 'shadow-[0_0_8px_rgba(239,68,68,0.4)]', 'animate-pulse'); pnl.classList.remove('bg-bg3', 'border-border'); }
        if(pnlTitle) { pnlTitle.classList.add('text-accent2'); pnlTitle.classList.remove('text-text3'); }
        if(pnlText) { pnlText.classList.add('text-text', 'font-bold'); pnlText.classList.remove('text-text2'); pnlText.innerText = unreadChats + ' Kişiden Yeni'; }
    } else {
        document.title = ORIGINAL_TITLE;
        drawFaviconBadge(false);

        if(badge) { badge.classList.add('hidden'); badge.classList.remove('flex'); }
        if(pnl) { pnl.classList.remove('bg-accent2/10', 'border-accent2/50', 'shadow-[0_0_8px_rgba(239,68,68,0.4)]', 'animate-pulse'); pnl.classList.add('bg-bg3', 'border-border'); }
        if(pnlTitle) { pnlTitle.classList.remove('text-accent2'); pnlTitle.classList.add('text-text3'); }
        if(pnlText) { pnlText.classList.remove('text-text', 'font-bold'); pnlText.classList.add('text-text2'); pnlText.innerText = 'Mesaj Kutusu'; }
    }
}

function drawFaviconBadge(showBadge) {
    let link = document.getElementById('dynamic-favicon');
    if (!link) return;
    // Performans için canvas çizimi yerine statik dosya geçişi sağlanır (varsa icon-512-badge.png eklenebilir)
    link.href = showBadge ? 'icon-512.png' : 'icon-512.png'; 
}

document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { document.title = ORIGINAL_TITLE; drawFaviconBadge(false); }
});

// YENİ: BİLDİRİM SESİ ÜRETİCİSİ (Web Audio API)
function playBeepSound() {
    try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        const ctx = new AudioContext();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.type = 'sine'; // Düz ve zarif bir ton (sine)
        osc.frequency.setValueAtTime(800, ctx.currentTime); // 800 Hz frekansı
        gain.gain.setValueAtTime(0.1, ctx.currentTime); // %10 Ses seviyesi (rahatsız etmez)
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15); // Hızlıca sönümlenir (Dıt)
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
    } catch(e) { console.warn("Ses çalınamadı", e); }
}

function openNotifModal() {
    if(!LOGGED_IN_USER) return;
    
    playBeepSound(); // Bildirim penceresi açıldığında DIT sesini çal

    const myU = USER_DATA[LOGGED_IN_USER.name] || {};
    if(myU.photo) { $('chat-my-avatar').src=myU.photo; $('chat-my-avatar').classList.remove('hidden'); $('chat-my-ini').classList.add('hidden'); }
    else { $('chat-my-avatar').classList.add('hidden'); $('chat-my-ini').classList.remove('hidden'); $('chat-my-ini').innerText=LOGGED_IN_USER.name.slice(0,2).toUpperCase(); }

    renderChatList();
    
    $('chat-list-view').classList.remove('hidden'); $('chat-list-view').classList.add('flex');
    if (window.innerWidth < 768 && currentChatPartner) {
        $('active-chat-view').classList.remove('hidden'); $('active-chat-view').classList.add('flex');
        $('chat-list-view').classList.add('hidden'); $('chat-list-view').classList.remove('flex');
    } else if(window.innerWidth >= 768 && !currentChatPartner) {
        $('active-chat-view').classList.remove('hidden'); $('active-chat-view').classList.add('flex');
        $('chat-empty-state').classList.remove('hidden'); $('chat-empty-state').classList.add('flex');
        $('chat-active-container').classList.add('hidden'); $('chat-active-container').classList.remove('flex');
    }
    
    hideNewChatSelector();
    
    const el = $('notif-modal'); el.classList.remove('hidden'); el.classList.add('flex');
    setTimeout(()=>{ el.classList.remove('opacity-0'); el.querySelector('div').classList.remove('scale-95'); el.querySelector('div').classList.add('scale-100'); },10);
}

function renderChatList() {
    const myName = LOGGED_IN_USER.name;
    const readStates = safeJSON(localStorage.getItem('chatReadStates_' + myName), {});
    const chatGroups = {};

    if (MESAJ_RAW.r) {
        MESAJ_RAW.r.forEach((r, idx) => {
            const date = r[0], from = r[1], to = r[2], msg = r[3];
            if(from === myName || to === myName || to === 'GLOBAL') {
                const partner = (to === 'GLOBAL') ? 'GLOBAL' : (from === myName ? to : from);
                if (!chatGroups[partner]) chatGroups[partner] = { partner, lastMsg: '', lastDate: '', unread: 0, lastIdx: -1 };
                chatGroups[partner].lastMsg = msg; chatGroups[partner].lastDate = date; chatGroups[partner].lastIdx = idx;
                
                const lastReadIdx = readStates[partner] !== undefined ? readStates[partner] : -1;
                if (idx > lastReadIdx && from !== myName) { chatGroups[partner].unread++; }
            }
        });
    }

    const sortedChats = Object.values(chatGroups).sort((a,b) => b.lastIdx - a.lastIdx);
    let html = '';
    if(sortedChats.length === 0) {
        html = '<div class="flex-1 flex flex-col items-center justify-center text-text3 p-8 text-center gap-4"><div class="text-5xl opacity-50 grayscale">💬</div><p class="font-mono text-xs">Sohbet kutunuz boş.<br>Sağ alt köşedeki butondan sohbet başlatın.</p></div>';
    } else {
        sortedChats.forEach(c => {
            const uInfo = USER_DATA[c.partner] || {}; const isGlobal = c.partner === 'GLOBAL';
            const avatarHtml = isGlobal ? `<div class="w-12 h-12 rounded-full bg-accent3/20 flex items-center justify-center font-bold text-accent3 text-xl shrink-0 border border-accent3/50 shadow-inner">🌟</div>` : 
                               (uInfo.photo ? `<img src="${uInfo.photo}" class="w-12 h-12 rounded-full object-cover shrink-0 border-2 border-bg2 shadow-sm">` : `<div class="w-12 h-12 rounded-full bg-gradient-to-br from-accent via-accent/80 to-accent4 border-2 border-bg2 flex items-center justify-center font-bold text-white text-lg shrink-0 shadow-sm">${c.partner.slice(0,2).toUpperCase()}</div>`);
            
            const nameColor = isGlobal ? 'text-accent3' : 'text-text';
            const nameDisp = isGlobal ? '🌟 HERKESE (DUYURU)' : c.partner;
            const unreadBadge = c.unread > 0 ? `<div class="bg-accent4 text-bg2 text-[10px] font-bold rounded-full h-5 px-1.5 min-w-[20px] flex items-center justify-center shadow-md">${c.unread}</div>` : '';
            const timeSplit = c.lastDate ? c.lastDate.split(' ') : ['', ''];
            const shortTime = timeSplit.length > 1 ? timeSplit[1] : c.lastDate;
            const safeMsg = c.lastMsg.length > 30 ? c.lastMsg.substring(0, 30) + '...' : c.lastMsg;
            const bgActive = currentChatPartner === c.partner ? 'bg-bg3 border-l-4 border-accent' : 'hover:bg-bg3 border-l-4 border-transparent';

            html += `
            <div class="chat-list-item flex items-center gap-3 p-3 cursor-pointer transition-colors border-b border-border/50 relative ${bgActive}" data-name="${c.partner}" onclick="openChat('${safeAttr(c.partner)}')">
                ${avatarHtml}
                <div class="flex-1 min-w-0 flex flex-col justify-center">
                    <div class="flex justify-between items-baseline mb-1">
                        <span class="font-bold text-[13px] truncate ${nameColor}">${nameDisp}</span>
                        <span class="text-[10px] text-text3 whitespace-nowrap ml-2 ${c.unread > 0 ? 'text-accent4 font-bold' : ''}">${shortTime}</span>
                    </div>
                    <div class="flex justify-between items-center gap-2">
                        <span class="text-[11px] text-text2 truncate ${c.unread > 0 ? 'font-semibold text-text' : ''}">${escapeHTML(safeMsg)}</span>
                        ${unreadBadge}
                    </div>
                </div>
            </div>`;
        });
    }
    $('chat-list-content').innerHTML = html;
}

function filterChatList(v) {
    const query = v.toLowerCase();
    document.querySelectorAll('.chat-list-item').forEach(el => {
        const name = el.getAttribute('data-name').toLowerCase();
        el.style.display = name.includes(query) ? 'flex' : 'none';
    });
}

function openChat(partner) {
    currentChatPartner = partner;
    const isGlobal = partner === 'GLOBAL'; const uInfo = USER_DATA[partner] || {};
    
    $('active-chat-name').innerText = isGlobal ? 'HERKESE (Duyuru)' : partner;
    const img = $('active-chat-img'), ini = $('active-chat-ini'), av = $('active-chat-avatar');
    if(isGlobal) {
        img.classList.add('hidden'); ini.classList.remove('hidden'); ini.innerHTML = '🌟'; av.className = 'w-10 h-10 rounded-full flex items-center justify-center font-bold text-xl bg-accent3/20 text-accent3 shrink-0 shadow-inner border border-accent3/50';
    } else if(uInfo.photo) {
        img.src = uInfo.photo; img.classList.remove('hidden'); ini.classList.add('hidden'); av.className = 'w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-bg2 shrink-0 overflow-hidden shadow-md bg-bg2';
    } else {
        img.classList.add('hidden'); ini.classList.remove('hidden'); ini.innerText = partner.slice(0,2).toUpperCase(); av.className = 'w-10 h-10 md:w-12 md:h-12 rounded-full flex items-center justify-center font-bold text-white text-sm bg-gradient-to-br from-accent via-accent/80 to-accent4 shrink-0 shadow-md border-2 border-bg2';
    }

    $('chat-empty-state').classList.add('hidden'); $('chat-empty-state').classList.remove('flex');
    $('chat-active-container').classList.remove('hidden'); $('chat-active-container').classList.add('flex');
    
    if (window.innerWidth < 768) {
        $('chat-list-view').classList.add('hidden'); $('chat-list-view').classList.remove('flex');
        $('active-chat-view').classList.remove('hidden'); $('active-chat-view').classList.add('flex');
    }
    
    renderChatHistory();
    renderChatList(); // Listeyi renklendirmek için
    
    const myName = LOGGED_IN_USER.name;
    const readStates = safeJSON(localStorage.getItem('chatReadStates_' + myName), {});
    let lastIdx = -1;
    (MESAJ_RAW.r || []).forEach((r, idx) => {
        if ((partner === 'GLOBAL' && r[2] === 'GLOBAL') || (r[1] === partner && r[2] === myName) || (r[1] === myName && r[2] === partner)) lastIdx = idx;
    });
    if(lastIdx > -1) {
        readStates[partner] = lastIdx; localStorage.setItem('chatReadStates_' + myName, JSON.stringify(readStates)); checkNotifs();
    }
    setTimeout(() => { const h = $('active-chat-history'); h.scrollTop = h.scrollHeight; $('chat-msg-input').focus(); }, 50);
}

function backToChatList() {
    currentChatPartner = null;
    if (window.innerWidth < 768) {
        $('active-chat-view').classList.add('hidden'); $('active-chat-view').classList.remove('flex');
        $('chat-list-view').classList.remove('hidden'); $('chat-list-view').classList.add('flex');
    } else {
        $('chat-empty-state').classList.remove('hidden'); $('chat-empty-state').classList.add('flex');
        $('chat-active-container').classList.add('hidden'); $('chat-active-container').classList.remove('flex');
    }
    renderChatList();
}

function renderChatHistory() {
    const myName = LOGGED_IN_USER.name;
    let html = ''; let lastDateStr = '';
    const deletedStates = safeJSON(localStorage.getItem('chatDeletedStates_' + myName), {});
    const hideUpTo = deletedStates[currentChatPartner] || -1;

    // Akıllı Okundu Bilgisi için karşı tarafın yazdığı son mesajın sırasını bul
    let lastPartnerMsgIdx = -1;
    if (MESAJ_RAW.r) {
        MESAJ_RAW.r.forEach((r, idx) => {
            if (r[1] === currentChatPartner) lastPartnerMsgIdx = idx;
        });
    }

    if (MESAJ_RAW.r) {
        MESAJ_RAW.r.forEach((r, idx) => {
            if(idx < hideUpTo) return; 
            
            const dateFull = r[0], from = r[1], to = r[2], msg = r[3];
            const isGlobalMsg = to === 'GLOBAL';
            
            if ((currentChatPartner === 'GLOBAL' && isGlobalMsg) || (from === currentChatPartner && to === myName) || (from === myName && to === currentChatPartner)) {
                const dateOnly = dateFull ? dateFull.split(' ')[0] : '';
                const timeOnly = dateFull ? (dateFull.split(' ')[1] || '') : '';
                if (dateOnly && dateOnly !== lastDateStr) {
                    html += `<div class="flex justify-center my-3"><span class="bg-bg3 border border-border text-text3 text-[10px] py-1 px-3 rounded-full shadow-sm">${dateOnly}</span></div>`;
                    lastDateStr = dateOnly;
                }

                let displayMsg = escapeHTML(msg);
                // Eğer mesaj bir medya dosyası ise çözümle (Görüntü veya Ses)
                if (msg.startsWith('[MEDIA:')) {
                    const closingBracket = msg.indexOf(']');
                    if(closingBracket > -1) {
                        const mimeType = msg.substring(7, closingBracket);
                        const b64 = msg.substring(closingBracket + 1);
                        if (mimeType.startsWith('image/')) {
                            displayMsg = `<img src="${b64}" class="max-w-full max-h-48 rounded-lg mt-1 border border-border/50 cursor-pointer object-contain" onclick="window.open('${b64}')">`;
                        } else if (mimeType.startsWith('audio/')) {
                            displayMsg = `<audio controls src="${b64}" class="max-w-[200px] mt-1 h-8 outline-none"></audio>`;
                        }
                    }
                }

                const isMe = from === myName;
                // Mesaj sırası, karşı tarafın son mesajından önceyse %100 okunmuştur (Yeşil Tik)
                const isRead = idx < lastPartnerMsgIdx;
                const bubbleClass = isMe ? 'bg-accent/20 border border-accent/30 text-text rounded-tr-none' : 'bg-bg3 border border-border text-text rounded-tl-none';
                const alignClass = isMe ? 'items-end' : 'items-start';
                const senderNameHtml = (!isMe && currentChatPartner === 'GLOBAL') ? `<span class="text-[10px] font-bold text-accent mb-1">${escapeHTML(from)}</span>` : '';
                const readIcon = isMe ? `<span class="ml-1 text-[10.5px] ${isRead ? 'text-accent4' : 'text-text3'} font-bold tracking-tighter">✓✓</span>` : '';

                html += `
                <div class="flex flex-col ${alignClass} w-full mb-1.5 px-1 md:px-4">
                    <div class="${bubbleClass} rounded-xl p-2.5 max-w-[90%] md:max-w-[70%] shadow-sm relative flex flex-col group min-w-[80px]">
                        ${senderNameHtml}
                        <div class="text-xs md:text-[13px] leading-snug whitespace-pre-wrap break-words">${displayMsg}</div>
                        <div class="flex justify-end items-center mt-1 ml-4 self-end">
                            <span class="text-[9px] text-text3 leading-none">${timeOnly}</span>
                            ${readIcon}
                        </div>
                    </div>
                </div>`;
            }
        });
    }

    if(html === '') { html = `<div class="flex-1 flex flex-col items-center justify-center text-text3 opacity-50 p-6"><div class="text-5xl mb-4 grayscale">💬</div><p class="text-sm text-center font-mono">Burada hiç mesaj yok.<br>${currentChatPartner === 'GLOBAL' ? 'Herkese ilk duyuruyu yapın!' : 'Sohbeti başlatmak için bir mesaj gönderin.'}</p></div>`; }
    $('active-chat-history').innerHTML = html;
}

function closeNotifModal() {
    const el = $('notif-modal'); el.classList.add('opacity-0'); el.querySelector('div').classList.remove('scale-100'); el.querySelector('div').classList.add('scale-95');
    setTimeout(()=> { el.classList.add('hidden'); el.classList.remove('flex'); }, 300);
}

function sendChatMessage(directMsg = null) {
    const input = $('chat-msg-input'); const msg = input.value.trim();
    const finalMsg = (typeof directMsg === 'string') ? directMsg : msg;
    if(!finalMsg || !currentChatPartner) return;
    
    const now = new Date();
    const timeStr = now.toLocaleDateString('tr-TR') + ' ' + now.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
    
    const payload = { 
        action: "addRecord", 
        sheet: "Mesajlar", 
        "Tarih": timeStr, "Kimden": LOGGED_IN_USER.name, "Kime": currentChatPartner, "Mesaj": finalMsg
    };
    
    if(!MESAJ_RAW.r) MESAJ_RAW.r = [];
    MESAJ_RAW.r.push([timeStr, LOGGED_IN_USER.name, currentChatPartner, finalMsg]);
    
    if (typeof directMsg !== 'string') {
        input.value = ''; input.style.height = 'auto';
    }
    
    const myName = LOGGED_IN_USER.name;
    const readStates = safeJSON(localStorage.getItem('chatReadStates_' + myName), {});
    readStates[currentChatPartner] = MESAJ_RAW.r.length - 1;
    localStorage.setItem('chatReadStates_' + myName, JSON.stringify(readStates));

    renderChatHistory(); renderChatList();
    const h = $('active-chat-history'); h.scrollTop = h.scrollHeight;
    
    fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) })
    .then(() => setTimeout(() => fetchCSV(true), 1000))
    .catch(() => {
        MESAJ_RAW.r.pop();
        renderChatHistory();
        renderChatList();
        toast('Mesaj gönderilemedi. Bağlantıyı kontrol edin.', 'err');
    });
}

// YENİ: Medya (Resim/Ses) İşleme (Google Sheets hücresine sığması için aşırı sıkıştırma uygulanır)
function handleChatFileUpload(e) {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        let dataUrl = event.target.result;
        if(file.type.startsWith('image/')) {
            const img = new Image();
            img.onload = function() {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 400; 
                let width = img.width; let height = img.height;
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
                canvas.width = width; canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);
                dataUrl = canvas.toDataURL('image/jpeg', 0.5); // Sert Sıkıştırma
                
                if (dataUrl.length > 48000) { toast('Görüntü çok büyük, daha düşük çözünürlüklü bir fotoğraf seçin.', 'err'); return; }
                sendMediaMessage(dataUrl, 'image/jpeg');
            }
            img.src = dataUrl;
        } else if (file.type.startsWith('audio/')) {
            if (dataUrl.length > 48000) { toast('Ses dosyası Google Sheets limitini aşıyor. Maksimum 3-4 saniyelik ses gönderebilirsiniz.', 'err'); return; }
            sendMediaMessage(dataUrl, file.type);
        } else {
            toast('Sadece resim veya kısa ses dosyaları desteklenir.', 'warn');
        }
    };
    reader.readAsDataURL(file);
    e.target.value = '';
}

function sendMediaMessage(base64Data, mimeType) {
    const msg = `[MEDIA:${mimeType}]${base64Data}`;
    sendChatMessage(msg);
}

// YENİ: BAS-KONUŞ SİSTEMİ MANTIĞI
let chatAudioRecorder = null;
let chatAudioChunks = [];
let isChatRecording = false;
let chatRecordTimeout = null;

async function startChatVoiceRecord(e) {
    if (e.cancelable) e.preventDefault(); // Telefonda basılı tutarken ekranın kaymasını önler
    if (isChatRecording) return;
    
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        chatAudioRecorder = new MediaRecorder(stream);
        chatAudioChunks = [];
        
        chatAudioRecorder.ondataavailable = event => { if (event.data.size > 0) chatAudioChunks.push(event.data); };
        
        chatAudioRecorder.onstop = () => {
            stream.getTracks().forEach(track => track.stop()); // Mikrofonu kapat
            if (chatAudioChunks.length > 0 && isChatRecording) {
                const audioBlob = new Blob(chatAudioChunks, { type: 'audio/webm' });
                const reader = new FileReader();
                reader.readAsDataURL(audioBlob);
                reader.onloadend = () => {
                    const b64 = reader.result;
                    if (b64.length > 48000) toast('Kayıt çok uzun. Lütfen en fazla 3-4 saniyelik ses gönderin.', 'err');
                    else sendMediaMessage(b64, 'audio/webm');
                };
            }
            isChatRecording = false;
            $('btn-chat-mic').classList.remove('bg-accent2', 'text-white', 'animate-pulse');
            $('btn-chat-mic').classList.add('bg-bg2', 'text-text2');
            $('chat-msg-input').placeholder = "Mesajınızı yazın...";
        };
        
        chatAudioRecorder.start();
        isChatRecording = true;
        
        $('btn-chat-mic').classList.add('bg-accent2', 'text-white', 'animate-pulse');
        $('btn-chat-mic').classList.remove('bg-bg2', 'text-text2');
        $('chat-msg-input').placeholder = "🎤 Kaydediliyor... (Bırakarak Gönder)";
        
        // Google Sheets limitine takılmaması için otomatik süre sonlandırıcı (4.5 Saniye)
        chatRecordTimeout = setTimeout(() => { if(isChatRecording) stopChatVoiceRecord(); }, 4500);
        
    } catch (err) { toast('Mikrofon erişimine izin verilmedi.', 'err'); }
}

function stopChatVoiceRecord(e) { if (e && e.cancelable) e.preventDefault(); if (!isChatRecording || !chatAudioRecorder) return; clearTimeout(chatRecordTimeout); chatAudioRecorder.stop(); }

function cancelChatVoiceRecord(e) {
    if (e && e.cancelable) e.preventDefault(); if (!isChatRecording || !chatAudioRecorder) return;
    isChatRecording = false; chatAudioRecorder.stop(); toast('Ses kaydı iptal edildi.', 'warn');
}

function showNewChatSelector() {
    const overlay = $('new-chat-overlay'); overlay.classList.remove('hidden');
    setTimeout(() => { overlay.classList.remove('-translate-x-full'); }, 30);
    $('chat-contact-search').value = ''; renderContacts('');
}

function hideNewChatSelector() {
    const overlay = $('new-chat-overlay'); overlay.classList.add('-translate-x-full');
    setTimeout(() => { overlay.classList.add('hidden'); }, 300);
}

function renderContacts(filter) {
    const f = filter.toLowerCase();
    let users = Object.keys(USER_DATA).filter(u => u !== LOGGED_IN_USER.name);
    if(f) users = users.filter(u => u.toLowerCase().includes(f));
    
    let html = '';
    if(!f || 'herkese (duyuru)'.includes(f) || 'global'.includes(f)) {
        html += `<div class="flex items-center gap-3 p-3 hover:bg-bg3 cursor-pointer border-b border-border/50" onclick="hideNewChatSelector(); openChat('GLOBAL');"><div class="w-10 h-10 rounded-full bg-accent3/20 flex items-center justify-center font-bold text-accent3 text-lg shrink-0">🌟</div><div class="flex flex-col"><span class="font-bold text-sm text-accent3">HERKESE (DUYURU)</span><span class="text-[10px] text-text3">Genel Duyuru Grubu</span></div></div>`;
    }

    users.sort().forEach(u => {
        const uInfo = USER_DATA[u];
        const avatar = uInfo.photo ? `<img src="${uInfo.photo}" class="w-10 h-10 rounded-full object-cover shrink-0 border-2 border-bg2 shadow-sm">` : `<div class="w-10 h-10 rounded-full bg-gradient-to-br from-accent via-accent/80 to-accent4 border-2 border-bg2 flex items-center justify-center font-bold text-white text-sm shrink-0 shadow-sm">${u.slice(0,2).toUpperCase()}</div>`;
        html += `<div class="flex items-center gap-3 p-3 hover:bg-bg3 cursor-pointer border-b border-border/50" onclick="hideNewChatSelector(); openChat('${safeAttr(u)}');">${avatar}<div class="flex flex-col"><span class="font-bold text-sm text-text">${u}</span><span class="text-[10px] text-text3 capitalize">${roleLabel(uInfo.role)}</span></div></div>`;
    });
    $('new-chat-contacts').innerHTML = html;
}
function filterContacts(v) { renderContacts(v); }

// KULLANICI PROFİL FOTOĞRAFI YÖNETİMİ
function openProfileModal() {
    if(!LOGGED_IN_USER) return;
    const u = USER_DATA[LOGGED_IN_USER.name] || {};
    $('profile-photo-b64').value = u.photo || '';
    $('profile-photo-upload').value = '';
    updateProfilePreview(u.photo || '');
    const el = $('profile-modal'); el.classList.remove('hidden'); el.classList.add('flex'); setTimeout(()=>el.classList.remove('opacity-0'),10);
}

function closeProfileModal() {
    const el = $('profile-modal'); el.classList.add('opacity-0'); setTimeout(()=> { el.classList.add('hidden'); el.classList.remove('flex'); }, 300);
}

function updateProfilePreview(url) {
    if(url) { $('profile-preview').src = url; $('profile-preview').classList.remove('hidden'); $('profile-initials').classList.add('hidden'); }
    else { $('profile-preview').classList.add('hidden'); $('profile-initials').classList.remove('hidden'); $('profile-initials').innerText = LOGGED_IN_USER.name.slice(0,2).toUpperCase(); }
}

$('profile-photo-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if(!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
        const img = new Image();
        img.onload = function() {
            const canvas = document.createElement('canvas');
            const MAX_WIDTH = 256;
            const MAX_HEIGHT = 256;
            let width = img.width;
            let height = img.height;
            if (width > height) {
                if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
            } else {
                if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
            }
            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);
            // Fotoğrafı Google Sheets sınırları için sıkıştırıp JPEG olarak kaydet
            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            $('profile-photo-b64').value = dataUrl;
            updateProfilePreview(dataUrl);
        }
        img.src = event.target.result;
    }
    reader.readAsDataURL(file);
});

function removeProfilePhoto() {
    $('profile-photo-b64').value = '';
    $('profile-photo-upload').value = '';
    updateProfilePreview('');
}

async function saveProfileFromModal(e) {
    e.preventDefault();
    const btn = e.target.querySelector('button[type="submit"]');
    const origTxt = btn.innerText;
    try {
        btn.innerText = 'YÜKLENİYOR...';
        btn.disabled = true;

        let photo = $('profile-photo-b64').value.trim();
        
        // Fotoğraf yeni yüklenmiş bir base64 verisiyse ImgBB'ye yükleyip kalıcı bir URL'ye dönüştürelim
        if (photo.startsWith('data:image')) {
            try {
                const urlEncodedData = new URLSearchParams();
                urlEncodedData.append('image', photo.split(',')[1]);
                
                const IMGBB_API_KEY = CONFIG.IMGBB_API_KEY; 
                const uploadRes = await fetch(`https://api.imgbb.com/1/upload?key=${IMGBB_API_KEY}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: urlEncodedData
                });
                const uploadData = await uploadRes.json();
                
                if (uploadData && uploadData.success) {
                    photo = uploadData.data.url; // Elde edilen kısa ".jpg" linkini kullan
                    $('profile-photo-b64').value = photo;
                } else {
                    throw new Error('Sunucu yüklemeyi reddetti');
                }
            } catch (uploadErr) {
                console.error(uploadErr);
                if (photo.length > 48000) {
                    toast('Görüntü çok büyük, Google Sheets boyut limitini aşıyor.', 'err');
                    photo = ''; // Gönderimi iptal et
                } else {
                    toast('Bulut sunucusu reddetti, resim yerel olarak kaydediliyor...', 'warn');
                }
            }
        }

        const name = LOGGED_IN_USER.name;
        const pass = USER_DATA[name]?.pass || '1234';
        const role = normalizeRole(USER_DATA[name]?.role || 'user');
        
        // Artık photo değişkeni uzun bir kod değil, kısa bir link olduğu için Google Sheets'e sorunsuz kaydedilir.
        const payload = { action: "saveUser", name: name, pass: pass, role: role, photo: photo };
        fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) }).catch(err=>console.error(err));
        
        if (USER_DATA[name]) USER_DATA[name].photo = photo;
        let lu = JSON.parse(localStorage.getItem('localUsers')) || {};
        if(!lu[name]) lu[name] = {}; lu[name].photo = photo; localStorage.setItem('localUsers', JSON.stringify(lu));
        
        if (photo) { 
            $('user-avatar').src = photo; 
            $('user-avatar').classList.remove('hidden'); 
            if($('user-initials')) $('user-initials').classList.add('hidden');
        } else { 
            $('user-avatar').classList.add('hidden'); 
            if($('user-initials')) {
                $('user-initials').innerText = name.slice(0,2).toUpperCase();
                $('user-initials').classList.remove('hidden');
            }
        }
        
        toast('Profil fotoğrafı kalıcı olarak güncellendi.', 'ok'); 
        closeProfileModal(); 
        if(cTab==='admin') rAdmin();
    } catch(err) {
        toast('Profil kaydedilirken hata oluştu.', 'err');
    } finally {
        btn.innerText = origTxt;
        btn.disabled = false;
    }
}

async function fetchUsers() {
    try {
        let text = await getCSV(USERS_URL);
        
        const rows = parseCSV(text);
        if (rows.length > 1) {
            const headers = rows[0].map(x => String(x).toLowerCase());
            let nameIdx = headers.findIndex(h => h.includes('çalışan') || h.includes('ad'));
            let passIdx = headers.findIndex(h => h.includes('şifre') || h.includes('sifre'));
            let roleIdx = headers.findIndex(h => h.includes('rol') || h.includes('yetki'));
            let photoIdx = headers.findIndex(h => h.includes('fotoğraf') || h.includes('fotograf') || h.includes('resim'));
            
            if (nameIdx === -1) nameIdx = 0;
            if (passIdx === -1) passIdx = 1;
            
            USER_DATA = {};
            for(let i=1; i<rows.length; i++) {
                let name = rows[i][nameIdx];
                if (!name) continue;
                let pass = rows[i][passIdx] || '1234';
                let role = 'user';
                if (roleIdx !== -1 && rows[i][roleIdx]) role = normalizeRole(rows[i][roleIdx]);
                let photo = (photoIdx !== -1 && rows[i][photoIdx]) ? rows[i][photoIdx] : '';
                if (photo && !photo.startsWith('http') && !photo.startsWith('data:')) photo = '';
                
                // Aynı cihazda kalıcılık için yerel depolama yedeği (Google Sheet'ten gelmezse)
                let lu = JSON.parse(localStorage.getItem('localUsers')) || {};
                if (!photo && lu[name] && lu[name].photo) {
                    photo = lu[name].photo;
                }
                
                if (name) USER_DATA[name] = { pass: String(pass), role: role, photo: photo };
            }
            
            if (USER_DATA["Yusuf Yalçıntaş"]) USER_DATA["Yusuf Yalçıntaş"].role = "admin"; // Süimiş Ana Yönetici Güvencesi
            normalizeUserRoles();
            localStorage.setItem('cachedUsers', JSON.stringify(USER_DATA));
        }
    } catch(e) {
        console.error("Kullanıcı listesi çekilemedi, önbellek kullanılıyor.", e);
        // Offline durumunda önbellekten al
        USER_DATA = safeJSON(localStorage.getItem('cachedUsers'), {});
        normalizeUserRoles();
        if (USER_DATA["Yusuf Yalçıntaş"]) USER_DATA["Yusuf Yalçıntaş"].role = "admin";
    }
}

function togglePassword() {
    const pass = $('login-pass');
    const eyeOpen = $('eye-open');
    const eyeClosed = $('eye-closed');
    if (pass.type === 'password') {
        pass.type = 'text';
        eyeOpen.classList.add('hidden');
        eyeClosed.classList.remove('hidden');
    } else {
        pass.type = 'password';
        eyeOpen.classList.remove('hidden');
        eyeClosed.classList.add('hidden');
    }
}

function showLogin() {
    const mc = document.querySelector('.main-content');
    if(mc) mc.classList.add('blurred');
    if($('app-header')) { $('app-header').classList.add('hidden'); $('app-header').classList.remove('flex'); }
    if($('app-main')) { $('app-main').classList.add('hidden'); $('app-main').classList.remove('flex'); }
    
    const el = $('login-modal'); el.classList.remove('hidden'); el.classList.add('flex'); 
    setTimeout(()=>{ el.classList.remove('opacity-0'); el.querySelector('div').classList.remove('scale-95'); el.querySelector('div').classList.add('scale-100'); },10);
    
    $('login-error').innerText = 'Kullanıcı listesi yükleniyor...';
    $('login-user').disabled = true;
    $('login-pass').disabled = true;
    fetchUsers().then(() => {
        $('login-user').disabled = false;
        $('login-pass').disabled = false;
        if(Object.keys(USER_DATA).length > 0) {
            $('login-error').innerText = '';
            let opts = '';
            Object.keys(USER_DATA).sort().forEach(u => opts += `<option value="${u}">`);
            const dl = $('user-list');
            if(dl) dl.innerHTML = opts;
        } else {
            $('login-error').innerText = 'Kullanıcı listesi çekilemedi.';
        }
    }).catch(err => console.error('fetchUsers error:', err));
    
    fetchCSV(true); // Arka planda verileri gizlice çek (Giriş yapıldığında ekran hazır olsun)
}

function login(e) {
    e.preventDefault();
    const user = $('login-user').value.trim();
    const pass = $('login-pass').value.trim();
    const errorEl = $('login-error');
    if(!user) { errorEl.innerText = 'Lütfen bir kullanıcı seçin.'; return; }

    const userKey = Object.keys(USER_DATA).find(k => k.toLowerCase() === user.toLowerCase());

    if (userKey && String(USER_DATA[userKey].pass) === pass) {
        LOGGED_IN_USER = { name: userKey, role: normalizeRole(USER_DATA[userKey].role) };
        localStorage.setItem('loggedUser', JSON.stringify(LOGGED_IN_USER));
        errorEl.innerText = '';
        const el = $('login-modal'); el.classList.add('opacity-0'); el.querySelector('div').classList.remove('scale-100'); el.querySelector('div').classList.add('scale-95');
        setTimeout(()=> { el.classList.add('hidden'); el.classList.remove('flex'); }, 300);
        
        const mc = document.querySelector('.main-content');
        if(mc) mc.classList.remove('blurred');
        
        $('app-header').classList.remove('hidden'); $('app-header').classList.add('flex');
        $('app-main').classList.remove('hidden'); $('app-main').classList.add('flex');
        const roleBadge = renderRoleBadge(LOGGED_IN_USER.role);
        $('user-name').innerHTML = `👤 ${user} ${roleBadge}`;
        
        if(USER_DATA[userKey].photo) {
            $('user-avatar').src = USER_DATA[userKey].photo;
            $('user-avatar').classList.remove('hidden');
            if($('user-initials')) $('user-initials').classList.add('hidden');
        } else { 
            $('user-avatar').classList.add('hidden'); 
            if($('user-initials')) {
                $('user-initials').innerText = userKey.slice(0,2).toUpperCase();
                $('user-initials').classList.remove('hidden');
            }
        }
        
        $('user-info').classList.remove('hidden'); $('user-info').classList.add('flex');
        applyRoleRestrictions();
        checkNotifs();
        
        // Eğer arka plandaki çekim henüz bitmediyse yükleme ekranıyla birlikte çek, bittiyse direkt göster
        if (RAW.length === 0) {
            fetchCSV();
        } else {
            const activeNavEl = document.querySelector(`.nav-tab[onclick*="'${cTab}'"]`);
            swT(cTab, activeNavEl || document.querySelector('.nav-tab'));
        }
    } else {
        errorEl.innerText = 'Kullanıcı adı veya şifre hatalı.';
    }
}

function logout() {
    localStorage.removeItem('loggedUser');
    location.reload(); // Sayfayı yeniden yükleyerek çıkış yap ve login ekranını göster
}

function rAdmin() {
    const allTabs = [
        {id: 'gunluk', name: 'GÜNLÜK RAPOR'}, {id: 'haftalik', name: 'HAFTALIK RAPOR'}, {id: 'aylik', name: 'AYLIK RAPOR'},
        {id: 'genel', name: 'GENEL ÖZET'}, {id: 'alarm', name: 'ALARM & ANALİZ'}, {id: 'calisan', name: 'ÇALIŞAN PERFORMANSI'}, {id: 'pres', name: 'PRES MAKİNE'},
        {id: 'fason', name: 'FASON DETAY'}, {id: 'kaliphane', name: 'KALIPHANE'}, {id: 'malzeme', name: 'PRES MALZEME TAKİP'}, {id: 'kayitlar', name: 'ÜRETİM TAKİP DENEMELERİ'}, {id: 'plan', name: 'ÜRETİM PLANI'},
        {id: 'form', name: 'VERİ GİRİŞ FORMU'}
    ];
    $('admin-tabs-list').innerHTML = allTabs.map(t => `<label class="flex items-center gap-2 p-2 hover:bg-bg2 rounded cursor-pointer border border-border hover:border-accent transition-colors"><input type="checkbox" value="${t.id}" class="admin-tab-cb w-4 h-4 accent-accent" ${!adminSettings.hiddenTabs.includes(t.id) ? 'checked' : ''}><span class="font-mono text-text2">${t.name}</span></label>`).join('');
    
    $('admin-weights-list').innerHTML = `
        <div><label class="block text-[10px] text-text3 mb-1 uppercase">Üretim Ağırlığı</label><input type="number" id="admin-w-u" value="${adminSettings.weights?.u ?? 40}" class="w-full bg-bg border border-border text-text rounded p-2 text-xs outline-none focus:border-accent"></div>
        <div><label class="block text-[10px] text-text3 mb-1 uppercase">Performans Ağırlığı</label><input type="number" id="admin-w-p" value="${adminSettings.weights?.p ?? 40}" class="w-full bg-bg border border-border text-text rounded p-2 text-xs outline-none focus:border-accent"></div>
        <div><label class="block text-[10px] text-text3 mb-1 uppercase">Kayıt Sayısı Ağırlığı</label><input type="number" id="admin-w-c" value="${adminSettings.weights?.c ?? 20}" class="w-full bg-bg border border-border text-text rounded p-2 text-xs outline-none focus:border-accent"></div>
        <div><label class="block text-[10px] text-text3 mb-1 uppercase">Duruş (Dk) Ceza Puanı</label><input type="number" step="0.01" id="admin-w-d" value="${adminSettings.weights?.d ?? 0.1}" title="Her 1 dakikalık duruş için toplam puandan düşülecek değer. Örn: 0.1" class="w-full bg-bg border border-border text-text rounded p-2 text-xs outline-none focus:border-accent"></div>
    `;

    $('admin-users-list').innerHTML = Object.keys(USER_DATA).sort().map(u => {
        const role = USER_DATA[u].role; const isYusuf = (u === "Yusuf Yalçıntaş");
        
        // Son gönderdiği mesajı göster
        const notifMsg = MESAJ_RAW.r ? MESAJ_RAW.r.slice().reverse().find(r => r[1] === u && (r[2] === LOGGED_IN_USER.name || r[2] === 'GLOBAL')) : null;
        const hasNotif = notifMsg ? `<span class="px-1.5 py-0.5 bg-accent/20 text-accent rounded text-[9px] ml-2 cursor-help border border-accent/50" title="Son Mesajı: ${escapeHTML(notifMsg[3])}">💬 MESAJ</span>` : '';
        
        const photoStr = USER_DATA[u].photo ? `<img src="${USER_DATA[u].photo}" class="w-8 h-8 rounded-full object-cover border-2 border-bg2 shadow-sm">` : `<div class="w-8 h-8 rounded-full bg-gradient-to-br from-accent via-accent/80 to-accent4 flex items-center justify-center font-bold text-white text-[10px] shadow-sm border border-bg2">${u.slice(0,2).toUpperCase()}</div>`;
        const roleBadge = renderRoleBadge(role, true);
        return `<tr class="border-b border-border/50 hover:bg-bg2 transition-colors"><td class="p-3">${photoStr}</td><td class="p-3"><div class="flex items-center gap-2"><span class="font-bold text-text">${u}</span>${hasNotif}</div></td><td class="p-3">${roleBadge}</td><td class="p-3 text-right"><div class="flex gap-1 justify-end"><button onclick="editUser('${u}')" class="px-2 py-1 bg-accent4/20 text-accent4 hover:bg-accent4 hover:text-white rounded text-[10px] font-mono transition-colors">DÜZENLE</button><button onclick="deleteUser('${u}')" ${isYusuf ? 'disabled' : ''} class="px-2 py-1 bg-accent2/20 text-accent2 hover:bg-accent2 hover:text-white rounded text-[10px] font-mono transition-colors disabled:opacity-50">SİL</button></div></td></tr>`;
    }).join('');
    
    $('admin-n-user').innerHTML = `<option value="">Seçiniz...</option><option value="GLOBAL" class="text-accent font-bold">🌟 HERKESE GÖNDER</option>` + Object.keys(USER_DATA).sort().map(u => `<option value="${u}">${u}</option>`).join('');
}

async function saveUserObj(e) {
    e.preventDefault();
    const name = $('admin-u-name').value.trim();
    if(!name) return;
    const pass = $('admin-u-pass').value.trim();
    const role = normalizeRole($('admin-u-role').value);
    const photo = $('admin-u-photo').value.trim();
    
    const payload = { action: "saveUser", name: name, pass: pass, role: role, photo: photo };
    try {
        toast('Kullanıcı kaydediliyor...', 'warn');
        await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
        toast('Kayıt isteği gönderildi. Liste 2 saniye içinde güncellenecek.', 'ok');
        
        $('admin-u-form').reset();

        setTimeout(async () => {
            await fetchUsers();
            rAdmin();
            
            if (LOGGED_IN_USER && LOGGED_IN_USER.name === name) {
                LOGGED_IN_USER.role = normalizeRole(role);
                localStorage.setItem('loggedUser', JSON.stringify(LOGGED_IN_USER));
                const roleBadge = renderRoleBadge(LOGGED_IN_USER.role);
                $('user-name').innerHTML = `${LOGGED_IN_USER.name} ${roleBadge}`;
                if (photo) {
                    $('user-avatar').src = photo;
                    $('user-avatar').classList.remove('hidden');
                    if($('user-initials')) $('user-initials').classList.add('hidden');
                } else {
                    $('user-avatar').classList.add('hidden');
                    if($('user-initials')) {
                        $('user-initials').innerText = name.slice(0,2).toUpperCase();
                        $('user-initials').classList.remove('hidden');
                    }
                }
                applyRoleRestrictions();
            }
        }, 2000);

    } catch(err) { 
        console.error('Kullanıcı Google Sheets\'e kaydedilirken hata oluştu:', err); 
        toast('Kullanıcı kaydedilemedi. Bağlantı hatası.', 'err');
    }
}

function editUser(name) {
    const u = USER_DATA[name]; if(!u) return;
    $('admin-u-name').value = name;
    $('admin-u-pass').value = u.pass || '';
    $('admin-u-role').value = normalizeRole(u.role || 'user');
    $('admin-u-photo').value = u.photo || '';
    $('admin-u-form').scrollIntoView({behavior: 'smooth', block: 'center'});
    $('admin-u-name').focus();
}

async function deleteUser(name) {
    if(name === 'Yusuf Yalçıntaş') return toast('Ana yönetici silinemez!', 'err');
    if(!confirm(name + ' adlı kullanıcıyı sistemden silmek istediğinize emin misiniz?')) return;

    const payload = { action: "deleteUser", name: name };
    try {
        toast('Kullanıcı siliniyor...', 'warn');
        await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
        toast('Silme isteği gönderildi. Liste 2 saniye içinde güncellenecek.', 'ok');
        
        // After sending the request, wait and refresh the user list from the source
        setTimeout(async () => {
            await fetchUsers();
            rAdmin();
        }, 2000); // Wait 2s for Google Sheets to update

    } catch(err) {
        toast('Kullanıcı silinemedi. Bağlantı hatası.', 'err');
    }
}

// Admin paneli yükleme iptal edildi (Artık okuma sohbet ekranından yapılıyor)
function loadUserNotif(user) {
    $('admin-n-msg').value = '';
    if (!user || !MESAJ_RAW.r) return;
    const last = MESAJ_RAW.r.slice().reverse()
        .find(r => (r[1] === user && r[2] === LOGGED_IN_USER.name) || 
                   (r[1] === LOGGED_IN_USER.name && r[2] === user));
    if (last) {
        $('admin-n-msg').placeholder = `Son mesaj (${last[0]}): "${last[3].substring(0,60)}..."`;
    }
}

function sendNotif(e) {
    e.preventDefault();
    const targetUser = $('admin-n-user').value; const msg = $('admin-n-msg').value.trim();
    if(!targetUser || !msg) return;
    
    const now = new Date();
    const timeStr = now.toLocaleDateString('tr-TR') + ' ' + now.toLocaleTimeString('tr-TR', {hour: '2-digit', minute:'2-digit'});
    
    const payload = { 
        action: "addRecord", 
        sheet: "Mesajlar", 
        "Tarih": timeStr, "Kimden": LOGGED_IN_USER.name, "Kime": targetUser, "Mesaj": msg
    };
    fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) }).catch(err=>console.log(err));
    
    toast(targetUser === 'GLOBAL' ? 'Herkese mesaj gönderildi.' : targetUser + ' kullanıcısına mesaj gönderildi.', 'ok'); 
    $('admin-n-msg').value = '';
    setTimeout(() => fetchCSV(true), 1000); // 1 saniye sonra verileri yenile
}

function clearNotif() {
    toast('Geçmiş mesajlar Google E-Tablolar (Mesajlar sekmesi) üzerinden silinmelidir.', 'warn');
}

function saveAdminSettings() {
    const hiddenTabs = [];
    document.querySelectorAll('.admin-tab-cb').forEach(cb => { if(!cb.checked) hiddenTabs.push(cb.value); });
    const u = parseInt($('admin-w-u').value) || 40;
    const p = parseInt($('admin-w-p').value) || 40;
    const c = parseInt($('admin-w-c').value) || 20;
    const d = parseFloat($('admin-w-d').value) || 0;
    adminSettings = { hiddenTabs, weights: {u, p, c, d} };
    localStorage.setItem('adminSettings', JSON.stringify(adminSettings));
    toast('Yönetim ayarları başarıyla kaydedildi!', 'ok');
    applyRoleRestrictions();
}

// Yeni ve sağlam CSV Ayrıştırıcı
function parseCSV(text) {
    if (!text || typeof text !== 'string' || text.includes('<html') || text.includes('<!DOCTYPE')) return [];
    if (text.includes('Markdown Content:')) text = text.split('Markdown Content:')[1];
    text = text.trim();
    if (!text) return [];

    const rows = [];
    let currentRow = [];
    let currentCell = '';
    let inQuotes = false;

    for (let i = 0; i < text.length; i++) {
        const char = text[i];
        const nextChar = text[i + 1];

        if (char === '"') {
            if (inQuotes && nextChar === '"') {
                currentCell += '"';
                i++;
            } else {
                inQuotes = !inQuotes;
            }
        } else if (char === ',' && !inQuotes) {
            currentRow.push(currentCell.trim());
            currentCell = '';
        } else if ((char === '\n' || (char === '\r' && nextChar === '\n')) && !inQuotes) {
            if (char === '\r') i++;
            currentRow.push(currentCell.trim());
            rows.push(currentRow);
            currentRow = [];
            currentCell = '';
        } else {
            currentCell += char;
        }
    }
    
    if (currentCell !== '' || text[text.length - 1] === ',') {
        currentRow.push(currentCell.trim());
    }
    if (currentRow.length > 0) {
        rows.push(currentRow);
    }

    if (rows.length && rows[0].length) {
        rows[0][0] = rows[0][0].replace(/^\uFEFF/, '');
    }

    return rows;
}

function parse(t){
    const rows = parseCSV(t);
    if (rows.length < 2) return [];

    const headers = rows[0].map(h => normalizeText(h));
    const headerKey = headers.map(h => (h || '').replace(/[^a-z0-9]/g, ''));
    const possibleFasonCols = headerKey
        .map((h, i) => ({ h, i }))
        .filter(x => x.h.includes('fason') || x.h.includes('urun'));
    const p = [];

    const idx = {
        tarih: headerKey.findIndex(h => h.includes('tarih')),
        calisan: headerKey.findIndex(h => h.includes('calisan') || h === 'ad'),
        vardiya: headerKey.findIndex(h => h.includes('vardiya')),
        pres1: headerKey.findIndex(h => h === 'pres1' || h.includes('pres1')),
        fason1: headerKey.findIndex(h => h === 'fason1' || h.includes('fason1') || h === 'fason' || h.includes('urun1') || h === 'urun'),
        uretim1: headerKey.findIndex(h => ((h.includes('uretilen') || h === 'uretim1') && h.includes('1') && !h.includes('gereken') && !h.includes('durussuz'))),
        durus1: headerKey.findIndex(h => h.includes('durus') && h.includes('1') && !h.includes('durussuz') && !h.includes('baslangic') && !h.includes('bitis')),
        pres2: headerKey.findIndex(h => h === 'pres2' || h.includes('pres2')),
        fason2: headerKey.findIndex(h => h === 'fason2' || h.includes('fason2') || h.includes('urun2')),
        uretim2: headerKey.findIndex(h => ((h.includes('uretilen') || h === 'uretim2') && h.includes('2') && !h.includes('gereken') && !h.includes('durussuz'))),
        durus2: headerKey.findIndex(h => h.includes('durus') && h.includes('2') && !h.includes('durussuz') && !h.includes('baslangic') && !h.includes('bitis')),
        perf1: headerKey.findIndex(h => (h.includes('performans') || h.includes('yuzde') || h === 'perf1') && h.includes('1') && !h.includes('2')),
        perf2: headerKey.findIndex(h => (h.includes('performans') || h.includes('yuzde') || h === 'perf2') && h.includes('2')),
        hedef1: headerKey.findIndex(h => (h.includes('uretilmesi') && h.includes('1')) || h === 'hedef1'),
        hedef2: headerKey.findIndex(h => (h.includes('uretilmesi') && h.includes('2')) || h === 'hedef2'),
        toplamUretim: headerKey.findIndex(h => h.includes('toplam') && h.includes('uretilen')),
        toplamPerf: headerKey.findIndex(h => (h.includes('gunluk') && h.includes('performans')) || h === 'toplamperformans'),
    };

    if (idx.perf1 < 0) {
        idx.perf1 = headerKey.findIndex(h => (h.includes('performans') || h.includes('yuzde')) && !h.includes('2'));
    }
    if (idx.uretim1 < 0) {
        idx.uretim1 = headerKey.findIndex(h => h.includes('uretim') && h.includes('1') && !h.includes('gereken') && !h.includes('durussuz'));
    }
    if (idx.uretim2 < 0) {
        idx.uretim2 = headerKey.findIndex(h => h.includes('uretim') && h.includes('2') && !h.includes('gereken') && !h.includes('durussuz'));
    }

    if (idx.fason1 < 0 && idx.fason2 < 0 && possibleFasonCols.length > 0) {
        idx.fason1 = possibleFasonCols[0].i;
        idx.fason2 = possibleFasonCols[1] ? possibleFasonCols[1].i : -1;
    } else if (idx.fason1 < 0 && possibleFasonCols.length > 0) {
        idx.fason1 = possibleFasonCols[0].i;
    } else if (idx.fason2 < 0 && possibleFasonCols.length > 1) {
        idx.fason2 = possibleFasonCols.find(x => x.i !== idx.fason1)?.i ?? -1;
    }

    if (idx.fason1 === idx.fason2 && possibleFasonCols.length > 1) {
        idx.fason2 = possibleFasonCols.find(x => x.i !== idx.fason1)?.i ?? -1;
    }

    const tN=v=>{if(!v||v==='-')return 0; return parseFloat(v.toString().replace(/\./g,'').replace(',','.').replace('%',''))||0;};
    
    for(let i=1; i<rows.length; i++) {
        const c = rows[i];
        const get = (key) => idx[key] > -1 ? c[idx[key]] : '';
        let tarih=get('tarih'), cal=get('calisan'); if(!tarih||!cal)continue;
        let u1=tN(get('uretim1')), p1=tN(get('perf1')), u2=tN(get('uretim2')), p2=tN(get('perf2'));
        let b1=tN(get('hedef1')), b2=tN(get('hedef2'));
        let tU=tN(get('toplamUretim'))||(u1+u2), tB=b1+b2; if(tU === 0 && tB === 0 && tN(get('durus1')) === 0 && tN(get('durus2')) === 0)continue;
        p1 = p1>0&&p1<=1?p1*100:p1;
        p2 = p2>0&&p2<=1?p2*100:p2;
        let isK1 = get('pres1') || get('fason1') || b1 > 0 || u1 > 0;
        let isK2 = get('pres2') || get('fason2') || b2 > 0 || u2 > 0;
        let calcTP = tB > 0 ? (tU / tB) * 100 : ((isK1 && isK2) ? ((p1||0) + (p2||0)) / 2 : (isK1 ? (p1||0) : (isK2 ? (p2||0) : (p1||p2||0))));
        p.push({tarih:tarih, calisan:cal, vardiya:get('vardiya')||'', pres1:get('pres1')||'', fason1:get('fason1')||'', beklenen1:b1, uretim1:u1, perf1:p1, durus1:tN(get('durus1')), pres2:get('pres2')||'', fason2:get('fason2')||'', beklenen2:b2, uretim2:u2, perf2:p2, durus2:tN(get('durus2')), tB:tB, tU:tU, tP:calcTP});
    } return p.map(x=>{if(x.tP>0&&x.tP<=1)x.tP*=100; return x;});
}

function parseGeneric(t){
    const rows = parseCSV(t);
    if(rows.length < 1) return {h:[], r:[]};
    return { h: rows[0], r: rows.slice(1) };
}

function showLoader() {
    const el = $('global-loader');
    if (el) {
        el.classList.remove('hidden');
        el.classList.add('flex');
        setTimeout(() => el.classList.remove('opacity-0'), 10);
    }
}

function hideLoader() {
    const el = $('global-loader');
    if (el) {
        el.classList.add('opacity-0');
        setTimeout(() => { el.classList.add('hidden'); el.classList.remove('flex'); }, 300);
    }
}

function fetchCSV(isBg = false) {
    if(!isBg) {
        showLoader();
        ['g-kpi','w-kpi','m-kpi','h-kpi'].forEach(id=>{if($(id))$(id).innerHTML='<div class="h-20 bg-bg3 rounded animate-pulse"></div>'.repeat(4);});
    }
    const b=$('btn-refresh'); b.innerText='Yükleniyor..'; b.disabled=true; $('src-status').innerText='Bağlanıyor..'; $('src-status').style.color='#f5c842';
        
        // CANLI VERİ İÇİN CACHE BUSTER (Zaman damgası ekleyerek tarayıcı ve sunucu önbelleğini kırar)
        const ts = '&_t=' + Date.now();
        
    Promise.all([
            getCSV(SHEET_URL + ts),
            getCSV(KALIP_URL + ts).catch(()=>''),
            getCSV(DENEME_URL + ts).catch(()=>''),
            getCSV(MALZEME_URL + ts).catch(()=>''),
            getCSV(MESAJ_URL + ts).catch(()=>''),
            getCSV(FASONLAR_URL + ts).catch(()=>'')
    ]).then(([t, k_text, d_text, m_text, msg_text, fason_text]) => {
        const nextRawCsvRows = parseCSV(t);
        if (!nextRawCsvRows || nextRawCsvRows.length === 0) throw new Error('Veri sayfası okunamadı veya boş döndü.');

        const nextRaw = parse(t);
        const nextK = parseGeneric(k_text);
        const nextD = parseGeneric(d_text);
        const nextM = parseGeneric(m_text);
        const nextMsg = parseGeneric(msg_text);
        const nextF = parseGeneric(fason_text);

        window.RAW_CSV_ROWS = nextRawCsvRows;
        RAW = nextRaw;
        KALIP_RAW = nextK;
        DENEME_RAW = nextD;
        MALZEME_RAW = nextM;
        MESAJ_RAW = nextMsg;
        FASONLAR_RAW = nextF.r;
        DATES=[...new Set(RAW.map(r=>r.tarih))].sort((a,b)=>a.split('.').reverse().join('')<b.split('.').reverse().join('')?-1:1);
        MONTHS=[...new Set(DATES.map(d=>d.slice(3)))].sort((a,b)=>a.split('.').reverse().join('')<b.split('.').reverse().join('')?-1:1);
        WEEKS=[...new Set(DATES.map(isoW))].sort();
        
        if (!sD || !DATES.includes(sD)) sD = DATES.length ? DATES[DATES.length-1] : '';
        if (!sM || !MONTHS.includes(sM)) sM = MONTHS.length ? MONTHS[MONTHS.length-1] : '';
        if (!sW || !WEEKS.includes(sW)) sW = WEEKS.length ? WEEKS[WEEKS.length-1] : '';
        if (!sA || !DATES.includes(sA)) sA = DATES.length ? DATES[DATES.length-1] : '';        
        // Ayın Elemanını Hesapla ve Yazdır
        if(sM) {
            const mData = RAW.filter(r => r.tarih.endsWith(sM));
            if(mData.length > 0) {
                let empStats = [...new Set(mData.map(r=>r.calisan))].map(w => ({ w, ...calc(mData.filter(r=>r.calisan===w)) }));
                
                // Normalizasyon için o ayın en yüksek değerlerini bul
                const maxU = Math.max(...empStats.map(e => e.u)) || 1;
                const maxP = Math.max(...empStats.map(e => e.p)) || 1;
                const maxC = Math.max(...empStats.map(e => e.c)) || 1;
                
                const wU = adminSettings.weights?.u ?? 40;
                const wP = adminSettings.weights?.p ?? 40;
                const wC = adminSettings.weights?.c ?? 20;
                const wD = adminSettings.weights?.d ?? 0.1;
                
                empStats.forEach(e => {
                    e.score = ((e.u / maxU) * wU) + ((e.p / maxP) * wP) + ((e.c / maxC) * wC) - (e.d * wD);
                });
                
                const best = empStats.sort((a, b) => b.score - a.score)[0];
                window.bestEmpName = best.w;
                if($('hdr-best-name')) $('hdr-best-name').textContent = best.w.toUpperCase();
                if($('hdr-best-det')) $('hdr-best-det').innerHTML = `<span class="text-accent4 font-bold" title="Adil Puan">⭐ ${best.score.toFixed(1)} Puan</span> | <span class="text-text">${n(best.u)}</span> Adet | <span class="${best.p>=100?'text-accent':'text-accent2'}">${best.p.toFixed(1)}%</span> Perf`;
                if($('hdr-best')) {
                    $('hdr-best').classList.remove('hidden');
                    $('hdr-best').classList.add('flex');
                }
            }
        }
        
        const s=calc(RAW); $('hdr-total').innerText=n(s.u); $('hdr-perf').innerText=s.p.toFixed(1)+'%'; $('hdr-workers').innerText=new Set(RAW.map(r=>r.calisan)).size;
        if (!isBg) popF(); // Form için verileri doldur (arkaplan yenilemede açık olan dropdownları bozmamak için)
        checkNotifs();
        checkSystemAlarms();
        $('src-status').innerText='● CANLI VERİ'; $('src-status').style.color='#a8e063'; $('src-info').innerText=`${RAW.length} kayıt`;
        
        if (isBg) {
            // Arkaplan güncellemesinde sekmeyi baştan yükleme (animasyon ve scroll sıfırlamasını engeller), sadece içeriği güncelle
            if(cTab==='gunluk')rG(); if(cTab==='haftalik')rW(); if(cTab==='aylik')rM(); if(cTab==='genel')rH(); if(cTab==='alarm')rAlarm(); if(cTab==='calisan')rC(); if(cTab==='pres')rP(); if(cTab==='fason')rF(); if(cTab==='kaliphane')rKaliphane(); if(cTab==='malzeme')rMalzeme(); if(cTab==='kayitlar')rKayitlar(); if(cTab==='plan')rPlan(); if(cTab==='admin')rAdmin();
            
            // Arama kutularında filtre varsa tekrar anında uygula (250ms gecikmeyi bypass et)
            const activePanel = $('panel-'+cTab);
            if(activePanel) {
                activePanel.querySelectorAll('input[type="text"][onkeyup*="fT"]').forEach(inp => {
                    if(inp.value) {
                        const match = inp.getAttribute('onkeyup').match(/fT\('([^']+)'/);
                        if(match && match[1]) fT(match[1], inp.value, true);
                    }
                });
            }
        } else {
            // FIX #5: Aktif sekmenin nav elementini cTab'a göre güvenilir şekilde bul.
            const activeNavEl = document.querySelector(`.nav-tab[onclick*="'${cTab}'"]`);
            swT(cTab, activeNavEl || document.querySelector('.nav-tab'));
        }
    }).catch(e=>{
        console.error('Veri İşleme Hatası:', e);
        $('src-status').innerText='● BAĞLANTI HATASI'; $('src-status').style.color='#e86d3a';
        $('src-info').innerText='Veri okunamadı. İzinleri kontrol edin.';
        if(!isBg) {
            toast(e.message || 'Veri çekilemedi. İnternet bağlantınızı kontrol edin.', 'err');
        }
    }).finally(()=>{b.innerText='↻ GÜNCELLE'; b.disabled=false; if(!isBg) hideLoader();});
}

// OTOMATİK GÜNCELLEME VE OTURUM KONTROLÜ
    const savedUser = localStorage.getItem('loggedUser');
if(savedUser && savedUser !== "undefined") {
    LOGGED_IN_USER = safeJSON(savedUser, null);
    if (LOGGED_IN_USER) LOGGED_IN_USER.role = normalizeRole(LOGGED_IN_USER.role);
    if (LOGGED_IN_USER) {
        $('app-header').classList.remove('hidden'); $('app-header').classList.add('flex');
        $('app-main').classList.remove('hidden'); $('app-main').classList.add('flex');
        
        const roleBadge = renderRoleBadge(LOGGED_IN_USER.role);
        $('user-name').innerHTML = `${LOGGED_IN_USER.name} ${roleBadge}`;
        $('user-info').classList.remove('hidden'); $('user-info').classList.add('flex');
        fetchUsers().then(() => {
            if(USER_DATA[LOGGED_IN_USER.name] && USER_DATA[LOGGED_IN_USER.name].photo) {
                $('user-avatar').src = USER_DATA[LOGGED_IN_USER.name].photo;
                $('user-avatar').classList.remove('hidden');
                if($('user-initials')) $('user-initials').classList.add('hidden');
            } else {
                $('user-avatar').classList.add('hidden');
                if($('user-initials')) {
                    $('user-initials').innerText = LOGGED_IN_USER.name.slice(0,2).toUpperCase();
                    $('user-initials').classList.remove('hidden');
                }
            }
            applyRoleRestrictions();
            checkNotifs();
            fetchCSV();
    }).catch(err => console.error('Auto login fetchUsers error:', err));
    } else {
        showLogin();
    }
} else {
    showLogin();
}

setInterval(() => { if (LOGGED_IN_USER && !$('btn-refresh').disabled && cTab !== 'form') fetchCSV(true); }, 15000);

// SERVICE WORKER (PWA) KAYDI
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').catch(err => console.log('SW Kayıt Hatası:', err));
    });
}

// Açılır menüyü dışarı tıklandığında kapatma mekanizması
document.addEventListener('click', (e) => {
    const btn = $('raporlar-btn');
    const menu = btn?.nextElementSibling;
    if (btn && menu && !btn.contains(e.target) && !menu.contains(e.target)) {
        menu.classList.add('hidden');
        menu.classList.remove('flex', 'opacity-100', 'scale-100');
    }
});

// PWA KURULUM (INSTALL) İŞLEMİ
let deferredPrompt;
window.addEventListener('beforeinstallprompt', (e) => {
    // Chrome'un varsayılan kurulum uyarı çubuğunu engelle
    e.preventDefault();
    deferredPrompt = e;
    const installBtn = $('btn-install');
    
    if(installBtn) {
        installBtn.classList.remove('hidden');
        installBtn.classList.add('flex');
        installBtn.onclick = async () => {
            installBtn.classList.add('hidden');
            installBtn.classList.remove('flex');
            if (!deferredPrompt) return;
            try {
                await deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
            } catch(err) {
                console.warn('PWA prompt hatası:', err);
            }
            deferredPrompt = null;
        };
    }
});

// Çevrimdışı/Çevrimiçi Durum Bildirimi
window.addEventListener('online', () => { toast('İnternet bağlantısı yeniden sağlandı.', 'ok'); fetchCSV(true); });
window.addEventListener('offline', () => toast('İnternet bağlantısı kesildi. Çevrimdışı moddasınız.', 'warn'));

function openGenericFormModal(type, editIdx = null) {
    const el = $('generic-form-modal');
    $('gen-form-title').innerText = editIdx !== null ? 'KAYDI DÜZENLE' : (type === 'kalip' ? 'YENİ KALIP EKLE' : type === 'malzeme' ? 'YENİ MALZEME EKLE' : 'YENİ DENEME EKLE');
    $('gen-form-fields').dataset.type = type;
    $('gen-form-fields').dataset.editIdx = editIdx !== null ? editIdx : '';
    
    const rawData = type === 'kalip' ? KALIP_RAW : (type === 'malzeme' ? MALZEME_RAW : DENEME_RAW);
    let fields = (rawData && rawData.h && rawData.h.length > 0) ? rawData.h : (type === 'kalip' ? ['Fason / Kalıp Adı', 'Lokasyon'] : ['Başlık', 'Açıklama']);
    
    const rowData = editIdx !== null ? rawData.r[editIdx] : [];
    
    $('gen-form-fields').innerHTML = fields.map((label, i) => `
        <div>
            <label class="block text-[10px] font-mono text-text3 mb-1 uppercase">${escapeHTML(label)}</label>
            <input type="text" name="${escapeHTML(label)}" value="${escapeHTML(rowData[i] || '')}" required class="w-full bg-bg border border-border text-text rounded p-2.5 text-xs outline-none focus:border-accent">
        </div>`).join('');
    
    el.classList.remove('hidden'); el.classList.add('flex');
    setTimeout(() => { el.classList.remove('opacity-0'); el.querySelector('div').classList.remove('scale-95'); el.querySelector('div').classList.add('scale-100'); }, 10);
}

function replyTo(user) {
    if (!user || user === 'SİSTEM' || user === 'GLOBAL') return;
    openNotifModal();
    setTimeout(() => openChat(user), 150);
}

function closeGenericFormModal() {
    const el = $('generic-form-modal');
    el.classList.add('opacity-0'); el.querySelector('div').classList.remove('scale-100'); el.querySelector('div').classList.add('scale-95');
    setTimeout(() => { el.classList.add('hidden'); el.classList.remove('flex'); }, 300);
}

async function saveGenericForm(e) {
    e.preventDefault();
    const type = $('gen-form-fields').dataset.type;
    const editIdx = $('gen-form-fields').dataset.editIdx;
    const sheetName = type === 'kalip' ? 'Kalıphane Lokasyonları' : type === 'malzeme' ? 'Pres Malzeme Takip Listesi' : 'Üretim Takip Denemeleri';
    
    const formData = {};
    $('gen-form-fields').querySelectorAll('input, textarea, select').forEach(el => formData[el.name] = el.value);
    
    const payload = editIdx !== '' 
        ? { action: "editGenericRecord", sheet: sheetName, rowIndex: parseInt(editIdx) + 2, data: formData } 
        : { action: "addRecord", sheet: sheetName, ...formData };
        
    try {
        toast('Kaydediliyor...', 'warn');
        await fetch(SCRIPT_URL, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
        toast(editIdx !== '' ? 'Kayıt güncellendi!' : 'Kayıt eklendi!', 'ok');
        closeGenericFormModal();
        setTimeout(() => fetchCSV(true), 1000);
    } catch(err) { toast('İşlem başarısız', 'err'); }
}

function editGenericRecord(idx, type) {
    closeGenericModal();
    setTimeout(() => openGenericFormModal(type, idx), 300);
}

// --- YENİ: AKILLI SESLİ ASİSTAN MODÜLÜ ---
const VoiceAssistant = {
    recognition: null,
    synth: window.speechSynthesis,
    isListening: false,
    bubbleTimeout: null,
    
    init() {
        const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (!SpeechRec) {
            console.warn('Tarayıcınız Web Speech API (Ses Tanıma) desteklemiyor.');
            return;
        }
        
        const asstContainer = $('voice-asst-container');
        if(asstContainer) asstContainer.style.display = 'flex';

        this.recognition = new SpeechRec();
        this.recognition.lang = 'tr-TR';
        this.recognition.continuous = false;
        this.recognition.interimResults = false;
        
        this.recognition.onstart = () => {
            this.isListening = true;
            $('asst-pulse').classList.remove('hidden');
            $('asst-mic-btn').classList.add('border-accent', 'scale-105');
            this.showBubble('Sizi dinliyorum... (Örn: "Günlük rapora git" veya "Ahmet\'in performansı nedir")');
            this.stopSpeech();
        };
        
        this.recognition.onresult = (e) => {
            const transcript = e.results[0][0].transcript;
            this.showBubble(`<span class="text-text2 italic">"${transcript}"</span>`);
            this.processCommand(transcript);
        };
        
        this.recognition.onerror = (e) => {
            if (e.error !== 'no-speech') {
                this.speak('Ses anlaşılamadı veya mikrofon hatası oluştu.');
            }
            this.stopListeningUI();
        };
        
        this.recognition.onend = () => {
            this.stopListeningUI();
        };
    },
    
    stopListeningUI() {
        this.isListening = false;
        $('asst-pulse').classList.add('hidden');
        $('asst-mic-btn').classList.remove('border-accent', 'scale-105');
    },
    
    toggle() {
        if (this.isListening) {
            this.recognition.stop();
        } else {
            this.recognition.start();
        }
    },
    
    showBubble(text) {
        const bubble = $('asst-chat-bubble');
        $('asst-text').innerHTML = text;
        bubble.classList.remove('opacity-0', 'pointer-events-none', 'translate-y-4');
        bubble.classList.add('opacity-100', 'pointer-events-auto', 'translate-y-0');
        
        clearTimeout(this.bubbleTimeout);
        this.bubbleTimeout = setTimeout(() => this.closeBubble(), 12000); // 12 saniye sonra balon kapanır
    },
    
    closeBubble() {
        const bubble = $('asst-chat-bubble');
        bubble.classList.add('opacity-0', 'pointer-events-none', 'translate-y-4');
        bubble.classList.remove('opacity-100', 'pointer-events-auto', 'translate-y-0');
        this.stopSpeech();
    },
    
    speak(text) {
        this.showBubble(`<b class="text-accent4">Asistan:</b> ${text}`);
        this.stopSpeech();
        if (!this.synth) return;
        const utterance = new SpeechSynthesisUtterance(text.replace(/<[^>]+>/g, '')); // Okurken HTML taglerini ayıkla
        utterance.lang = 'tr-TR';
        utterance.rate = 1.0;
        utterance.pitch = 1.0;
        this.synth.speak(utterance);
    },
    
    stopSpeech() {
        if(this.synth && this.synth.speaking) this.synth.cancel();
    },
    
    processCommand(rawText) {
        const cmd = rawText.toLocaleLowerCase('tr-TR');
        let response = '';

        // --- 1. SAYFA YÖNLENDİRMELERİ ---
        if(cmd.match(/günlük|bugün/)) { swT('gunluk'); response = 'Günlük rapor ekranını açtım.'; }
        else if(cmd.match(/haftalık|bu hafta/)) { swT('haftalik'); response = 'Haftalık rapor açıldı.'; }
        else if(cmd.match(/aylık|bu ay/)) { swT('aylik'); response = 'Aylık üretim raporuna geçildi.'; }
        else if(cmd.match(/genel|özet|tüm zamanlar/)) { swT('genel'); response = 'Genel özet ekranı açılıyor.'; }
        else if(cmd.match(/alarm|uyarı/)) { swT('alarm'); response = 'Sistem alarmları ve analiz ekranındasınız.'; }
        else if(cmd.match(/veri gir|form|kayıt ekle/)) { swT('form'); response = 'Veri giriş formuna yönlendirildiniz.'; }
        else if(cmd.match(/fason/)) { swT('fason'); response = 'Fason analiz sayfası açıldı.'; }
        else if(cmd.match(/pres|makine/)) { swT('pres'); response = 'Makine performansları ekranda.'; }
        else if(cmd.match(/malzeme|depo/)) { swT('malzeme'); response = 'Malzeme listesine geçildi.'; }
        else if(cmd.match(/plan/)) { swT('plan'); response = 'Üretim planı yükleniyor.'; }

        if (response) { this.speak(response); return; }

        // --- 2. KAPSAMLI VERİ ANALİZİ ---
        if(cmd.match(/üretim lideri|ayın elemanı|en iyi/)) {
            if(window.bestEmpName) {
                openModal(window.bestEmpName);
                this.speak(`Bu ayın tartışmasız lideri ${window.bestEmpName}. Detaylı performans analizini sizin için ekrana getirdim.`);
            } else { this.speak('Şu an için bir lider hesaplaması bulunmuyor.'); }
            return;
        }
        if(cmd.match(/toplam üretim/)) {
            const s = calc(RAW);
            this.speak(`Tüm zamanlarda kayıtlı toplam ${n(s.u)} adet üretim bulunuyor. Sistemin genel performans ortalaması yüzde ${s.p.toFixed(1)}.`);
            return;
        }
        if(cmd.match(/duruş/)) {
            const pm={}; RAW.forEach(r=>{
                if(r.pres1) pm[r.pres1] = (pm[r.pres1]||0) + (Number(r.durus1)||0);
                if(r.pres2) pm[r.pres2] = (pm[r.pres2]||0) + (Number(r.durus2)||0);
            });
            const sorted = Object.entries(pm).sort((a,b)=>b[1]-a[1]);
            if(sorted.length) { this.speak(`Veritabanına göre en çok duruş yaşanan makine toplam ${n(sorted[0][1])} dakika ile ${sorted[0][0]}.`); } 
            else { this.speak('Duruş verisi analiz edilemedi.'); }
            return;
        }

        // --- 3. ÇALIŞAN (KİŞİ) BAZLI DERİN ANALİZ ---
        const emps = [...new Set(RAW.map(r=>r.calisan))];
        const words = cmd.split(' ');
        for(let e of emps) {
            const firstName = e.toLocaleLowerCase('tr-TR').split(' ')[0]; // Sadece ilk adından yakalamaya çalış
            if(words.some(w => w.includes(firstName) && w.length > 2)) {
                const eData = RAW.filter(r=>r.calisan === e); const s = calc(eData);
                openModal(e);
                this.speak(`${e} bugüne kadar toplam ${n(s.c)} kez çalışmış ve ${n(s.u)} adet üretim yapmış. Performans ortalaması yüzde ${s.p.toFixed(1)}. Dosyasını açtım.`);
                return;
            }
        }

        // Anlaşılamadı Durumu
        this.speak('Bunu anlayamadım. Sayfa değiştirmek, üretim liderini sormak veya bir personelin ismini verip performansını istemek gibi komutları deneyebilirsiniz.');
    }
};

// Uygulama yüklendiğinde asistanı (gizlice) hazırla
window.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => VoiceAssistant.init(), 1500);
});
