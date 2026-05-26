/**
 * Bu test dosyası, uygulamanızdaki saf (pure) JavaScript fonksiyonlarının
 * mantığını test etmek için Jest framework'ü baz alınarak hazırlanmıştır.
 * 
 * Not: En iyi test deneyimi için index.html içindeki bu fonksiyonları 
 * ayrı bir 'utils.js' dosyasına çıkarıp buraya import etmeniz önerilir.
 * (Örn: const { safeJSON, escapeHTML, calc } = require('./utils');)
 */

// --- Test Edilecek Fonksiyonlar ---
const { safeJSON, escapeHTML, safeAttr, calc } = require('./utils');

// --- Birim Testleri (Unit Tests) ---

describe('Veri Güvenliği ve Formatlama Fonksiyonları', () => {
    
    describe('safeJSON', () => {
        test('Geçerli bir JSON stringini doğru şekilde parse etmeli', () => {
            const jsonString = '{"theme": "dark", "hiddenTabs": ["admin"]}';
            const result = safeJSON(jsonString, {});
            expect(result.theme).toBe('dark');
            expect(result.hiddenTabs).toContain('admin');
        });

        test('Bozuk bir JSON stringinde hata fırlatmak yerine fallback dönmeli', () => {
            const invalidJSON = '{theme: dark'; // Tırnak eksik
            const result = safeJSON(invalidJSON, { error: true });
            expect(result).toEqual({ error: true });
        });

        test('Null veya undefined girişlerde fallback dönmeli', () => {
            expect(safeJSON(null, [])).toEqual([]);
            expect(safeJSON('undefined', { a: 1 })).toEqual({ a: 1 });
        });
    });

    describe('escapeHTML ve safeAttr (XSS Koruması)', () => {
        test('Zararlı HTML karakterlerini dönüştürmeli', () => {
            const maliciousStr = '<script>alert("hack&slash")</script>';
            const result = escapeHTML(maliciousStr);
            expect(result).toBe('&lt;script&gt;alert(&quot;hack&amp;slash&quot;)&lt;/script&gt;');
        });

        test('HTML özelliklerine (attribute) yazılacak stringleri güvenli hale getirmeli', () => {
            const clickInject = "onClick='doEvil()'";
            const result = safeAttr(clickInject);
            expect(result).toBe("onClick=\\'doEvil()\\'");
        });

        test('Null veya undefined girişlerde boş string dönmeli', () => {
            expect(escapeHTML(null)).toBe('');
            expect(safeAttr(undefined)).toBe('');
        });
    });
});

describe('Veri Hesaplama Fonksiyonları', () => {
    
    describe('calc()', () => {
        test('Üretim listesi dizisinden doğru toplam ve ortalamaları hesaplamalı', () => {
            const mockData = [
                { tU: 100, tB: 120, tP: 83.3, durus1: 15, durus2: 0 },
                { tU: 150, tB: 150, tP: 100, durus1: 0, durus2: 30 }
            ];
            
            const result = calc(mockData);
            
            expect(result.c).toBe(2); // Toplam kayıt
            expect(result.u).toBe(250); // Toplam Üretim (tU)
            expect(result.b).toBe(270); // Toplam Hedef (tB)
            expect(result.d).toBe(45); // Toplam Duruş
            expect(result.p).toBeCloseTo(91.65); // Ortalama Performans
        });

        test('Boş bir dizi gönderildiğinde sıfır değerleri dönmeli', () => {
            const result = calc([]);
            expect(result).toEqual({ u: 0, b: 0, p: 0, d: 0, c: 0 });
        });
    });
});