/* ThePetalo demo guard
   Loaded as the FIRST script in every free demo page (never in the paid apps).
   - Demo data lives only for this tab: it is cleared when the tab is closed.
   - No offline install, no service worker, no backup/export file.
   Usage: <script src="/demo-guard.js" data-buy="https://www.etsy.com/listing/..."></script> */
(function () {
  'use strict';
  var me = document.currentScript;
  var BUY = (me && me.getAttribute('data-buy')) || '';
  var realLS = null;
  try { realLS = window.localStorage; } catch (e) {}
  var SS = null;
  try { SS = window.sessionStorage; SS.setItem('__dg', '1'); SS.removeItem('__dg'); } catch (e) { SS = null; }

  /* in-memory fallback if sessionStorage is blocked */
  function MemStore() {
    var d = {};
    return {
      getItem: function (k) { k = String(k); return Object.prototype.hasOwnProperty.call(d, k) ? d[k] : null; },
      setItem: function (k, v) { d[String(k)] = String(v); },
      removeItem: function (k) { delete d[String(k)]; },
      clear: function () { d = {}; },
      key: function (i) { return Object.keys(d)[i] || null; },
      get length() { return Object.keys(d).length; }
    };
  }
  var store = SS || MemStore();

  /* 1. new tab session: carry over only the language choice from the sales page */
  if (!store.getItem('__demo_sid')) {
    store.setItem('__demo_sid', Date.now().toString(36));
    try {
      if (realLS) {
        for (var i = 0; i < realLS.length; i++) {
          var k = realLS.key(i);
          if (k && /lang/i.test(k) && !/demo/i.test(k)) store.setItem(k, realLS.getItem(k));
        }
      }
    } catch (e) {}
  }
  var SID = store.getItem('__demo_sid');

  /* tidy up: remove old demo data that earlier demo versions left in this browser */
  try {
    if (realLS) {
      var old = [];
      for (var j = 0; j < realLS.length; j++) { var kk = realLS.key(j); if (kk && /demo/i.test(kk)) old.push(kk); }
      old.forEach(function (x) { realLS.removeItem(x); });
    }
  } catch (e) {}

  /* 2. every localStorage call in the demo now goes to the tab-only store */
  try {
    Object.defineProperty(window, 'localStorage', { configurable: true, enumerable: true, get: function () { return store; } });
  } catch (e) {}

  /* 3. IndexedDB: give the demo its own throw-away databases for this tab */
  try {
    var F = window.IDBFactory && IDBFactory.prototype;
    if (F && window.indexedDB) {
      var rOpen = F.open, rDel = F.deleteDatabase;
      var P = 'demo-' + SID + '-';
      F.open = function (name, v) { return v === undefined ? rOpen.call(this, P + name) : rOpen.call(this, P + name, v); };
      F.deleteDatabase = function (name) { return rDel.call(this, P + name); };
      var real = window.indexedDB;
      if (real.databases) {
        real.databases().then(function (list) {
          var now = Date.now();
          (list || []).forEach(function (db) {
            var m = /^demo-([0-9a-z]+)-/.exec(db.name || '');
            if (m && m[1] !== SID && now - parseInt(m[1], 36) > 864e5) rDel.call(real, db.name);
          });
        }).catch(function () {});
      }
    }
  } catch (e) {}

  /* 4. no service worker, no install as an app */
  try {
    if ('serviceWorker' in navigator) {
      var C = window.ServiceWorkerContainer && ServiceWorkerContainer.prototype;
      if (C) C.register = function () { return Promise.reject(new Error('Not available in the demo')); };
      var here = location.href.replace(/[?#].*$/, '').replace(/[^/]*$/, '');
      navigator.serviceWorker.getRegistrations().then(function (rs) {
        rs.forEach(function (r) { if (r.scope === here) r.unregister(); });
      }).catch(function () {});
    }
  } catch (e) {}
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); e.stopImmediatePropagation(); }, true);

  /* language for the small notices */
  function lang() {
    var l = '';
    try { l = (document.documentElement.lang || '').toLowerCase(); } catch (e) {}
    try {
      for (var i = 0; i < store.length; i++) { var k = store.key(i); if (/lang/i.test(k)) { var v = String(store.getItem(k) || ''); if (/^(de|fr|en|es|ar)/i.test(v)) l = v.toLowerCase(); } }
    } catch (e) {}
    return /^de/.test(l) ? 'de' : /^fr/.test(l) ? 'fr' : /^es/.test(l) ? 'es' : 'en';
  }
  var TX = {
    en: { t: 'Saving is part of the full app', b: 'This free demo can’t save or export your data — everything resets when you close this tab. Get the full app to keep your plans, back them up and use it offline.', buy: 'Get the full app', ok: 'Keep exploring', note: 'Demo · changes reset when you close this tab' },
    de: { t: 'Speichern gibt es in der Vollversion', b: 'Diese kostenlose Demo kann nichts speichern oder exportieren — alles wird zurückgesetzt, wenn du diesen Tab schließt. Mit der Vollversion bleiben deine Daten erhalten, mit Backup und offline.', buy: 'Vollversion holen', ok: 'Weiter ausprobieren', note: 'Demo · Änderungen verschwinden beim Schließen des Tabs' },
    fr: { t: 'La sauvegarde est dans la version complète', b: 'Cette démo gratuite ne peut ni enregistrer ni exporter vos données — tout est réinitialisé quand vous fermez cet onglet. Prenez la version complète pour garder vos données, les sauvegarder et l’utiliser hors ligne.', buy: 'Obtenir la version complète', ok: 'Continuer à essayer', note: 'Démo · tout se réinitialise à la fermeture de l’onglet' },
    es: { t: 'Guardar es parte de la app completa', b: 'Esta demo gratuita no puede guardar ni exportar tus datos: todo se reinicia al cerrar esta pestaña. Consigue la app completa para conservar tus datos, hacer copias y usarla sin conexión.', buy: 'Conseguir la app completa', ok: 'Seguir probando', note: 'Demo · los cambios se borran al cerrar la pestaña' }
  };
  function css() {
    if (document.getElementById('dg-css')) return;
    var s = document.createElement('style'); s.id = 'dg-css';
    s.textContent =
      '.dg-ov{position:fixed;inset:0;z-index:2147483646;background:rgba(20,18,30,.45);display:flex;align-items:center;justify-content:center;padding:20px;font-family:system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}' +
      '.dg-box{background:#fffdf9;color:#1f1d2b;max-width:380px;width:100%;border-radius:18px;padding:22px 22px 18px;box-shadow:0 20px 60px rgba(0,0,0,.25)}' +
      '.dg-box h3{margin:0 0 8px;font-size:18px;line-height:1.3}.dg-box p{margin:0 0 16px;font-size:14px;line-height:1.5;color:#4a4757}' +
      '.dg-row{display:flex;gap:10px;flex-wrap:wrap}.dg-row a,.dg-row button{flex:1;min-width:140px;text-align:center;border-radius:11px;padding:11px 14px;font:600 14px/1.2 inherit;cursor:pointer;text-decoration:none;border:0}' +
      '.dg-row a{background:#1f1d2b;color:#fff}.dg-row button{background:#eeeaf3;color:#1f1d2b}' +
      '.dg-toast{position:fixed;left:50%;top:14px;transform:translateX(-50%);z-index:2147483645;background:#1f1d2b;color:#fff;font:600 13px/1.3 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;padding:9px 16px;border-radius:999px;box-shadow:0 8px 24px rgba(0,0,0,.2);transition:opacity .4s;max-width:92vw;text-align:center;pointer-events:none}';
    (document.head || document.documentElement).appendChild(s);
  }
  function upsell() {
    if (document.querySelector('.dg-ov')) return;
    css();
    var T = TX[lang()];
    var ov = document.createElement('div'); ov.className = 'dg-ov';
    ov.innerHTML = '<div class="dg-box" role="dialog" aria-modal="true"><h3></h3><p></p><div class="dg-row">' +
      (BUY ? '<a target="_blank" rel="noopener"></a>' : '') + '<button type="button"></button></div></div>';
    ov.querySelector('h3').textContent = T.t;
    ov.querySelector('p').textContent = T.b;
    var a = ov.querySelector('a'); if (a) { a.href = BUY; a.textContent = T.buy; }
    var btn = ov.querySelector('button'); btn.textContent = T.ok;
    btn.onclick = function () { ov.remove(); };
    ov.addEventListener('click', function (e) { if (e.target === ov) ov.remove(); });
    document.body.appendChild(ov);
  }
  window.__demoUpsell = upsell;

  /* 5. block backup / export files (the only way to carry demo data out) */
  function isExport(el) {
    if (!el || !el.getAttribute) return false;
    var href = el.getAttribute('href') || '';
    return el.hasAttribute('download') && /^(blob:|data:)/i.test(href);
  }
  try {
    var rClick = HTMLAnchorElement.prototype.click;
    HTMLAnchorElement.prototype.click = function () { if (isExport(this)) { upsell(); return; } return rClick.apply(this, arguments); };
    var rDispatch = HTMLAnchorElement.prototype.dispatchEvent || EventTarget.prototype.dispatchEvent;
    HTMLAnchorElement.prototype.dispatchEvent = function (ev) { if (ev && ev.type === 'click' && isExport(this)) { upsell(); return false; } return rDispatch.call(this, ev); };
  } catch (e) {}
  document.addEventListener('click', function (e) {
    var a = e.target && e.target.closest && e.target.closest('a[download]');
    if (isExport(a)) { e.preventDefault(); e.stopImmediatePropagation(); upsell(); }
  }, true);
  try { if (window.showSaveFilePicker) window.showSaveFilePicker = function () { upsell(); return Promise.reject(new DOMException('Not available in the demo', 'AbortError')); }; } catch (e) {}

  /* 6. remove install hooks from the page + short notice once per tab */
  function onReady() {
    try {
      document.querySelectorAll('link[rel="manifest"],meta[name="apple-mobile-web-app-capable"],meta[name="mobile-web-app-capable"]').forEach(function (n) { n.remove(); });
    } catch (e) {}
    if (!store.getItem('__demo_noted')) {
      store.setItem('__demo_noted', '1');
      css();
      var t = document.createElement('div'); t.className = 'dg-toast'; t.textContent = TX[lang()].note;
      document.body.appendChild(t);
      setTimeout(function () { t.style.opacity = '0'; }, 4500);
      setTimeout(function () { t.remove(); }, 5200);
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', onReady); else onReady();
})();
