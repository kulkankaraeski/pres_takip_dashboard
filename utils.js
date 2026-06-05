// HTML Escaping (XSS koruması)
function escapeHTML(text) {
    const map = {
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#039;'
    };
    return String(text || '').replace(/[&<>"']/g, m => map[m]);
}

// Onclick İçinde Güvenli String (Tırnak çarpışmasını engeller)
function safeAttr(str) {
    return String(str || '').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

// JSON Parse Fallback
function safeJSON(str, fallback = null) {
    try {
        return str ? JSON.parse(str) : fallback;
    } catch (e) { return fallback; }
}

// Üretim İstatistikleri Hesaplama (KRITIK FONKSİYON)
function calc(data) {
    if (!data || data.length === 0) {
        return { u: 0, b: 0, p: 0, c: 0, d: 0 };
    }
    
    let toplamU = 0;      // Toplam Üretim
    let toplamB = 0;      // Toplam Beklenen
    let perfSum = 0;      // Performans Toplamı
    let durSum = 0;       // Duruş Toplamı
    let recordCount = 0;  // Kayıt Sayısı
    
    data.forEach(r => {
        toplamU += Number(r.tU) || Number(r.uretim1 || 0) + Number(r.uretim2 || 0) || 0;
        toplamB += Number(r.tB) || Number(r.beklenen1 || 0) + Number(r.beklenen2 || 0) || 0;
        perfSum += Number(r.tP) || 0;
        durSum += Number(r.durus1 || 0) + Number(r.durus2 || 0);
        recordCount++;
    });
    
    const avgPerf = recordCount > 0 ? perfSum / recordCount : 0;
    
    return {
        u: toplamU,           // Üretim
        b: toplamB,           // Beklenen
        p: avgPerf,           // Ortalama Performans
        c: recordCount,       // Kayıt Sayısı
        d: durSum             // Toplam Duruş
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { safeJSON, escapeHTML, safeAttr, calc };
}
