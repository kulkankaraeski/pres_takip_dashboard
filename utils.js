function safeJSON(str, fallback) {
    if (!str || str === 'undefined') return fallback;
    try {
        const parsed = JSON.parse(str);
        return parsed !== null ? parsed : fallback;
    } catch (e) { return fallback; }
}

function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#039;');
}

function safeAttr(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/"/g, '&quot;');
}

function calc(arr) {
    return {
        u: arr.reduce((s, r) => s + r.tU, 0),
        b: arr.reduce((s, r) => s + r.tB, 0),
        p: arr.length ? arr.reduce((s, r) => s + r.tP, 0) / arr.length : 0,
        d: arr.reduce((s, r) => s + r.durus1 + r.durus2, 0),
        c: arr.length
    };
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { safeJSON, escapeHTML, safeAttr, calc };
}
