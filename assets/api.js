/* Kommunikáció a Google Apps Script háttérrel (opcionális). */
(function (global) {
  'use strict';
  var cfg = global.SCHWARTZ_CONFIG || {};

  function enabled() { return !!cfg.APPS_SCRIPT_URL; }

  function session() {
    var s = new URLSearchParams(location.search).get('s');
    return (s || cfg.DEFAULT_SESSION || 'ora1').replace(/[^A-Za-z0-9_-]/g, '').slice(0, 40);
  }

  function clientId() {
    var id = null;
    try { id = localStorage.getItem('schwartz-id'); } catch (e) {}
    if (!id) {
      id = Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
      try { localStorage.setItem('schwartz-id', id); } catch (e) {}
    }
    return id;
  }

  function call(params) {
    var url = cfg.APPS_SCRIPT_URL + '?' + new URLSearchParams(params).toString();
    return fetch(url, { method: 'GET', redirect: 'follow' })
      .then(function (r) { if (!r.ok) throw new Error('HTTP ' + r.status); return r.json(); })
      .then(function (j) { if (!j.ok) throw new Error(j.error || 'Hiba'); return j; });
  }

  function submit(raw) {
    return call({ action: 'add', s: session(), id: clientId(), r: raw.join(';') });
  }

  // Visszaad: [{id, raw:[21]}]
  function list(s) {
    return call({ action: 'list', s: s || session() }).then(function (j) {
      return j.rows.map(function (row) {
        return { id: row.id, raw: String(row.r).split(';').map(Number) };
      }).filter(function (row) { return row.raw.length === 21 && row.raw.every(function (x) { return x >= 1 && x <= 6; }); });
    });
  }

  global.SchwartzAPI = { enabled: enabled, session: session, clientId: clientId, submit: submit, list: list };
})(window);
