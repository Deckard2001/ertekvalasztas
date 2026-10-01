/* Schwartz-értéktérkép – közös logika (kérdőív, pontozás, MDS, rajzolás)
 * Nincs külső függőség. A window.COUNTRY_DATA-t a data/countries.js tölti be.
 */
(function (global) {
  'use strict';

  // ---- 21 tétel (ESS Human Values Scale), ESS-sorrendben -----------------
  // value: melyik alapértékhez tartozik
  var ITEMS = [
    { id: 'ipcrtiv', value: 'SD', text: 'Fontos számára, hogy új ötletekkel álljon elő és kreatív legyen. Szereti a dolgokat a saját, eredeti módján csinálni.' },
    { id: 'imprich', value: 'PO', text: 'Fontos számára, hogy gazdag legyen. Sok pénzt és drága dolgokat szeretne.' },
    { id: 'ipeqopt', value: 'UN', text: 'Fontosnak tartja, hogy a világon mindenkivel egyformán bánjanak. Úgy gondolja, hogy mindenkinek egyenlő esélyeket kell kapnia az életben.' },
    { id: 'ipshabt', value: 'AC', text: 'Fontos számára, hogy megmutassa, mire képes. Szeretné, ha az emberek csodálnák azért, amit csinál.' },
    { id: 'impsafe', value: 'SE', text: 'Fontos számára, hogy biztonságos környezetben éljen. Kerül mindent, ami veszélyeztetheti a biztonságát.' },
    { id: 'impdiff', value: 'ST', text: 'Szereti a meglepetéseket, és mindig új dolgokat keres. Fontosnak tartja, hogy sokféle dolgot kipróbáljon az életben.' },
    { id: 'ipfrule', value: 'CO', text: 'Úgy gondolja, hogy az embereknek azt kell tenniük, amit mondanak nekik. Szerinte a szabályokat mindig be kell tartani, akkor is, ha senki sem figyel.' },
    { id: 'ipudrst', value: 'UN', text: 'Fontos számára, hogy meghallgassa azokat, akik különböznek tőle. Akkor is meg akarja érteni őket, ha nem ért velük egyet.' },
    { id: 'ipmodst', value: 'TR', text: 'Fontos számára, hogy alázatos és szerény legyen. Igyekszik nem magára vonni a figyelmet.' },
    { id: 'ipgdtim', value: 'HE', text: 'Fontos számára, hogy jól érezze magát. Szereti kényeztetni magát.' },
    { id: 'impfree', value: 'SD', text: 'Fontos számára, hogy maga döntsön arról, mit csinál. Szeret szabad lenni, és nem függeni másoktól.' },
    { id: 'iphlppl', value: 'BE', text: 'Nagyon fontos számára, hogy segítsen a körülötte élő embereknek. Törődni akar a jóllétükkel.' },
    { id: 'ipsuces', value: 'AC', text: 'Fontos számára, hogy nagyon sikeres legyen. Reméli, hogy mások elismerik az eredményeit.' },
    { id: 'ipstrgv', value: 'SE', text: 'Fontos számára, hogy az állam minden fenyegetéssel szemben gondoskodjon a biztonságáról. Erős államot szeretne, amely meg tudja védeni a polgárait.' },
    { id: 'ipadvnt', value: 'ST', text: 'Kalandokat keres, és szeret kockáztatni. Izgalmas életet szeretne.' },
    { id: 'ipbhprp', value: 'CO', text: 'Fontos számára, hogy mindig illően viselkedjen. Kerülni akar mindent, amit mások helytelennek tartanának.' },
    { id: 'iprspot', value: 'PO', text: 'Fontos számára, hogy mások tiszteljék. Azt szeretné, hogy az emberek azt tegyék, amit mond.' },
    { id: 'iplylfr', value: 'BE', text: 'Fontos számára, hogy hűséges legyen a barátaihoz. Odaadóan akar törődni a hozzá közel állókkal.' },
    { id: 'impenv', value: 'UN', text: 'Erősen hiszi, hogy az embereknek törődniük kell a természettel. Fontos számára a környezet védelme.' },
    { id: 'imptrad', value: 'TR', text: 'Fontos számára a hagyomány. Igyekszik követni a vallása vagy a családja által átadott szokásokat.' },
    { id: 'impfun', value: 'HE', text: 'Keresi az alkalmat a szórakozásra. Fontos számára, hogy olyasmit csináljon, ami örömet okoz neki.' }
  ];

  // ESS-válaszskála: 1 = Nagyon hasonlít rám … 6 = Egyáltalán nem hasonlít rám
  var SCALE = ['Nagyon hasonlít rám', 'Hasonlít rám', 'Valamennyire hasonlít rám',
               'Kicsit hasonlít rám', 'Nem hasonlít rám', 'Egyáltalán nem hasonlít rám'];

  // Körkörös (circumplex) sorrend
  var VALUES = ['SD', 'ST', 'HE', 'AC', 'PO', 'SE', 'CO', 'TR', 'BE', 'UN'];
  var VALUE_INFO = {
    SD: { name: 'Önirányítás',    group: 'open' },
    ST: { name: 'Stimuláció',     group: 'open' },
    HE: { name: 'Hedonizmus',     group: 'open' },
    AC: { name: 'Teljesítmény',   group: 'enh' },
    PO: { name: 'Hatalom',        group: 'enh' },
    SE: { name: 'Biztonság',      group: 'cons' },
    CO: { name: 'Konformitás',    group: 'cons' },
    TR: { name: 'Hagyomány',      group: 'cons' },
    BE: { name: 'Jóindulat',      group: 'trans' },
    UN: { name: 'Univerzalizmus', group: 'trans' }
  };
  var GROUPS = {
    open:  { name: 'Nyitottság a változásra', color: '#C8741E' },
    enh:   { name: 'Önérvényesítés',          color: '#A8325E' },
    cons:  { name: 'Megőrzés',                color: '#2D5A9A' },
    trans: { name: 'Önmeghaladás',            color: '#2E8556' }
  };

  // ---- Pontozás ------------------------------------------------------------
  // raw: 21 elemű tömb, 1–6 (ESS-kódolás). Visszaad: 10 centrírozott értékpontszám.
  function score(raw) {
    var x = raw.map(function (r) { return r == null ? null : 7 - r; }); // magasabb = fontosabb
    var valid = x.filter(function (v) { return v != null; });
    var mrat = valid.reduce(function (a, b) { return a + b; }, 0) / valid.length;
    return VALUES.map(function (val) {
      var s = 0, n = 0;
      ITEMS.forEach(function (it, i) { if (it.value === val && x[i] != null) { s += x[i]; n++; } });
      return n ? s / n - mrat : 0;
    });
  }

  // ---- Szimmetrikus sajátérték-felbontás (Jacobi) ----------------------
  function jacobiEigen(A) {
    var n = A.length, a = A.map(function (r) { return r.slice(); });
    var V = [];
    for (var i = 0; i < n; i++) { V.push([]); for (var j = 0; j < n; j++) V[i].push(i === j ? 1 : 0); }
    for (var sweep = 0; sweep < 100; sweep++) {
      var off = 0;
      for (var p = 0; p < n; p++) for (var q = p + 1; q < n; q++) off += a[p][q] * a[p][q];
      if (off < 1e-20) break;
      for (p = 0; p < n; p++) for (q = p + 1; q < n; q++) {
        if (Math.abs(a[p][q]) < 1e-15) continue;
        var theta = (a[q][q] - a[p][p]) / (2 * a[p][q]);
        var t = (theta >= 0 ? 1 : -1) / (Math.abs(theta) + Math.sqrt(theta * theta + 1));
        var c = 1 / Math.sqrt(t * t + 1), s = t * c;
        for (var k = 0; k < n; k++) {
          var akp = a[k][p], akq = a[k][q];
          a[k][p] = c * akp - s * akq; a[k][q] = s * akp + c * akq;
        }
        for (k = 0; k < n; k++) {
          var apk = a[p][k], aqk = a[q][k];
          a[p][k] = c * apk - s * aqk; a[q][k] = s * apk + c * aqk;
        }
        for (k = 0; k < n; k++) {
          var vkp = V[k][p], vkq = V[k][q];
          V[k][p] = c * vkp - s * vkq; V[k][q] = s * vkp + c * vkq;
        }
      }
    }
    var vals = a.map(function (r, i) { return r[i]; });
    var idx = vals.map(function (v, i) { return i; }).sort(function (i, j) { return vals[j] - vals[i]; });
    return {
      values: idx.map(function (i) { return vals[i]; }),
      vectors: idx.map(function (i) { return V.map(function (row) { return row[i]; }); })
    };
  }

  // ---- Klasszikus (Torgerson) MDS az országok 10 dimenziós profiljain ------
  // Euklideszi távolságoknál ez ekvivalens az országprofilok PCA-jával, és egy új
  // pont Gower-féle beillesztése (out-of-sample) pontosan a tengelyekre vetítés.
  function buildSpace(countryData) {
    var C = countryData.countries.map(function (c) { return c.v; });
    var k = C.length, d = C[0].length;
    var mu = []; for (var j = 0; j < d; j++) { var s = 0; for (var i = 0; i < k; i++) s += C[i][j]; mu.push(s / k); }
    var cov = [];
    for (var a = 0; a < d; a++) { cov.push([]); for (var b = 0; b < d; b++) {
      var t = 0; for (i = 0; i < k; i++) t += (C[i][a] - mu[a]) * (C[i][b] - mu[b]);
      cov[a].push(t / k);
    } }
    var eig = jacobiEigen(cov);
    var total = eig.values.reduce(function (x, y) { return x + Math.max(y, 0); }, 0);
    var axes = [eig.vectors[0], eig.vectors[1]];
    // Előjel-konvenció: 1. tengely jobbra = önmeghaladás, 2. tengely felfelé = nyitottság
    var I = function (v) { return VALUES.indexOf(v); };
    var sgn1 = (axes[0][I('BE')] + axes[0][I('UN')] - axes[0][I('AC')] - axes[0][I('PO')]) >= 0 ? 1 : -1;
    var sgn2 = (axes[1][I('SD')] + axes[1][I('ST')] + axes[1][I('HE')] - axes[1][I('SE')] - axes[1][I('CO')] - axes[1][I('TR')]) >= 0 ? 1 : -1;
    axes[0] = axes[0].map(function (x) { return x * sgn1; });
    axes[1] = axes[1].map(function (x) { return x * sgn2; });

    function project(v) {
      var x = 0, y = 0;
      for (var j = 0; j < d; j++) { x += (v[j] - mu[j]) * axes[0][j]; y += (v[j] - mu[j]) * axes[1][j]; }
      return [x, y];
    }
    var countries = countryData.countries.map(function (c) {
      var p = project(c.v); return { code: c.code, name: c.name, n: c.n, v: c.v, x: p[0], y: p[1] };
    });
    return {
      mu: mu, axes: axes,
      explained: [eig.values[0] / total, eig.values[1] / total],
      countries: countries,
      project: project
    };
  }

  function nearestCountries(space, v, n) {
    return space.countries.map(function (c) {
      var s = 0; for (var j = 0; j < v.length; j++) s += (v[j] - c.v[j]) * (v[j] - c.v[j]);
      return { code: c.code, name: c.name, dist: Math.sqrt(s) };
    }).sort(function (a, b) { return a.dist - b.dist; }).slice(0, n || 3);
  }

  function axisEnds(space, dim) {
    var l = space.axes[dim].map(function (w, j) { return { v: VALUES[j], w: w }; })
      .sort(function (a, b) { return b.w - a.w; });
    var nm = function (o) { return VALUE_INFO[o.v].name.toLowerCase(); };
    return { pos: nm(l[0]) + ', ' + nm(l[1]), neg: nm(l[l.length - 1]) + ', ' + nm(l[l.length - 2]) };
  }

  // ---- Címkék ütközésének feloldása (egyszerű függőleges taszítás) ------
  function relax(labels, iters) {
    for (var it = 0; it < (iters || 60); it++) {
      var moved = false;
      for (var i = 0; i < labels.length; i++) for (var j = i + 1; j < labels.length; j++) {
        var a = labels[i], b = labels[j];
        var ax0 = a.x - (a.anchor === 'end' ? a.w : a.anchor === 'middle' ? a.w / 2 : 0), ax1 = ax0 + a.w;
        var bx0 = b.x - (b.anchor === 'end' ? b.w : b.anchor === 'middle' ? b.w / 2 : 0), bx1 = bx0 + b.w;
        if (ax1 < bx0 || bx1 < ax0) continue;
        var dy = b.y - a.y, need = (a.h + b.h) / 2 + 2;
        if (Math.abs(dy) >= need) continue;
        var push = (need - Math.abs(dy)) / 2, dir = dy >= 0 ? 1 : -1;
        if (!a.fixed) a.y -= push * dir;
        if (!b.fixed) b.y += push * dir;
        moved = true;
      }
      if (!moved) break;
    }
  }

  // ---- SVG-térkép ------------------------------------------------------------
  // opts: { points: [{x,y,kind:'me'|'peer'|'mean', label}], highlight: 'HU', showArrows: true }
  // A nézet az országokhoz igazodik; a túl messze eső pontok a keret szélére kerülnek
  // (üres karikával jelölve), hogy az országok olvashatók maradjanak.
  function drawMap(svg, space, opts) {
    opts = opts || {};
    var NS = 'http://www.w3.org/2000/svg';
    var W = 1000, H = 1000, PAD = 80;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    while (svg.firstChild) svg.removeChild(svg.firstChild);

    var pts = (opts.points || []);
    var cext = 0;
    space.countries.forEach(function (c) { cext = Math.max(cext, Math.abs(c.x), Math.abs(c.y)); });
    var pext = 0;
    pts.forEach(function (p) { pext = Math.max(pext, Math.abs(p.x), Math.abs(p.y)); });
    var ext = Math.max(cext * 1.5, Math.min(pext * 1.1, cext * 2.6));
    var sc = (W / 2 - PAD) / ext;
    var X = function (x) { return W / 2 + x * sc; };
    var Y = function (y) { return H / 2 - y * sc; };
    function clampPt(p) {
      var m = Math.max(Math.abs(p.x), Math.abs(p.y));
      if (m <= ext) return { x: p.x, y: p.y, out: false };
      var f = ext / m; return { x: p.x * f, y: p.y * f, out: true };
    }
    function el(name, attrs, parent) {
      var e = document.createElementNS(NS, name);
      for (var k in attrs) e.setAttribute(k, attrs[k]);
      (parent || svg).appendChild(e); return e;
    }
    function txt(s, attrs, parent) { var t = el('text', attrs, parent); t.textContent = s; return t; }

    // tengelyek
    el('line', { x1: 20, y1: H / 2, x2: W - 20, y2: H / 2, class: 'axis' });
    el('line', { x1: W / 2, y1: 20, x2: W / 2, y2: H - 20, class: 'axis' });
    var e1 = axisEnds(space, 0), e2 = axisEnds(space, 1);
    txt(e1.pos, { x: W - 14, y: H / 2 + 34, class: 'axis-end', 'text-anchor': 'end' });
    txt(e1.neg, { x: 14, y: H / 2 + 34, class: 'axis-end', 'text-anchor': 'start' });
    txt(e2.pos, { x: W / 2 + 12, y: 36, class: 'axis-end', 'text-anchor': 'start' });
    txt(e2.neg, { x: W / 2 + 12, y: H - 18, class: 'axis-end', 'text-anchor': 'start' });

    // értékirányok (a tengelyek súlyai)
    if (opts.showArrows !== false) {
      var g = el('g', { class: 'arrows' });
      var maxw = 0;
      VALUES.forEach(function (v, j) { maxw = Math.max(maxw, Math.hypot(space.axes[0][j], space.axes[1][j])); });
      var R = (W / 2 - PAD) * 0.88 / maxw;
      var labs = [];
      VALUES.forEach(function (v, j) {
        var dx = space.axes[0][j] * R, dy = space.axes[1][j] * R;
        var col = GROUPS[VALUE_INFO[v].group].color;
        el('line', { x1: W / 2, y1: H / 2, x2: W / 2 + dx, y2: H / 2 - dy, stroke: col, class: 'arrow' }, g);
        var name = VALUE_INFO[v].name;
        labs.push({ s: name, col: col, x: W / 2 + dx * 1.05, y: H / 2 - dy * 1.05 + (dy > 0 ? -4 : 22),
          anchor: dx > 25 ? 'start' : (dx < -25 ? 'end' : 'middle'), w: name.length * 15.5, h: 30 });
      });
      relax(labs);
      labs.forEach(function (l) {
        txt(l.s, { x: l.x, y: l.y, fill: l.col, class: 'arrow-label', 'text-anchor': l.anchor }, g);
      });
    }

    // országok (a kiemelt ország legfelül)
    var gc = el('g', { class: 'countries' });
    var cs = space.countries.slice().sort(function (a, b) { return (a.code === opts.highlight) - (b.code === opts.highlight); });
    var clabs = [];
    cs.forEach(function (c) {
      var hl = c.code === opts.highlight;
      el('circle', { cx: X(c.x), cy: Y(c.y), r: hl ? 10 : 7, class: hl ? 'country hl' : 'country' }, gc);
      clabs.push({ s: c.code, name: c.name, hl: hl, x: X(c.x) + 12, y: Y(c.y) + 10, anchor: 'start', w: 44, h: 28 });
    });
    relax(clabs, 80);
    clabs.forEach(function (l) {
      var t = txt(l.s, { x: l.x, y: l.y, class: l.hl ? 'country-label hl' : 'country-label' }, gc);
      var title = document.createElementNS(NS, 'title'); title.textContent = l.name; t.appendChild(title);
    });

    // hallgatók
    var gp = el('g', { class: 'people' });
    pts.filter(function (p) { return p.kind === 'peer'; }).forEach(function (p) {
      var q = clampPt(p);
      el('circle', { cx: X(q.x), cy: Y(q.y), r: 10, class: q.out ? 'peer out' : 'peer' }, gp);
    });
    pts.filter(function (p) { return p.kind === 'mean'; }).forEach(function (p) {
      var q = clampPt(p);
      el('rect', { x: X(q.x) - 13, y: Y(q.y) - 13, width: 26, height: 26, transform: 'rotate(45 ' + X(q.x) + ' ' + Y(q.y) + ')', class: 'mean' }, gp);
      txt(p.label || 'Csoportátlag', { x: X(q.x) + (q.x > 0 ? -22 : 22), y: Y(q.y) - 20, class: 'mean-label', 'text-anchor': q.x > 0 ? 'end' : 'start' }, gp);
    });
    pts.filter(function (p) { return p.kind === 'me'; }).forEach(function (p) {
      var q = clampPt(p);
      el('circle', { cx: X(q.x), cy: Y(q.y), r: 26, class: 'me-halo' }, gp);
      el('circle', { cx: X(q.x), cy: Y(q.y), r: 13, class: q.out ? 'me out' : 'me' }, gp);
      var ly = Y(q.y) < 140 ? Y(q.y) + 60 : Y(q.y) - 36;
      txt((p.label || 'Te') + (q.out ? ' (távolabb)' : ''), { x: Math.min(W - 20, Math.max(20, X(q.x))), y: ly, class: 'me-label',
        'text-anchor': X(q.x) > W - 160 ? 'end' : (X(q.x) < 160 ? 'start' : 'middle') }, gp);
    });
  }

  global.Schwartz = {
    ITEMS: ITEMS, SCALE: SCALE, VALUES: VALUES, VALUE_INFO: VALUE_INFO, GROUPS: GROUPS,
    score: score, buildSpace: buildSpace, nearestCountries: nearestCountries,
    axisEnds: axisEnds, drawMap: drawMap
  };
})(window);
