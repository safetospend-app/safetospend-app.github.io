/* The Fresh Start Planner — page engine (shared by the PDF builder and the live preview) */
(function (root) {
  'use strict';

  // ---------- dates (all UTC, no timezone surprises) ----------
  const DAY = 86400000;
  const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  const MON3 = MONTHS.map(m => m.slice(0, 3));
  const WDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const WD3 = WDAYS.map(d => d.slice(0, 3));
  const pad = n => (n < 10 ? '0' : '') + n;
  const utc = (y, m, d) => Date.UTC(y, m, d);
  const ymd = t => { const d = new Date(t); return [d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()]; };
  const wday = t => new Date(t).getUTCDay();
  const dkey = t => { const [y, m, d] = ymd(t); return y + '-' + pad(m + 1) + '-' + pad(d); };
  const mkey = (y, m) => y + '-' + pad(m + 1);
  const dim = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
  const weekStartOf = (t, ws) => t - ((wday(t) - ws + 7) % 7) * DAY;

  // ---------- holidays (actual calendar date, not the observed day off) ----------
  function easter(y) { const a = y % 19, b = Math.floor(y / 100), c = y % 100, d = Math.floor(b / 4), e = b % 4, f = Math.floor((b + 8) / 25), g = Math.floor((b - f + 1) / 3), h = (19 * a + b - d - g + 15) % 30, i = Math.floor(c / 4), k = c % 4, l = (32 + 2 * e + 2 * i - h - k) % 7, m = Math.floor((a + 11 * h + 22 * l) / 451), mo = Math.floor((h + l - 7 * m + 114) / 31), da = ((h + l - 7 * m + 114) % 31) + 1; return utc(y, mo - 1, da); }
  function nth(y, m, wd, n) { const f = utc(y, m, 1); return f + (((wd - wday(f) + 7) % 7) + (n - 1) * 7) * DAY; }
  function lastWd(y, m, wd) { const l = utc(y, m, dim(y, m)); return l - ((wday(l) - wd + 7) % 7) * DAY; }
  function holidaysFor(c, y) {
    const E = easter(y), L = [];
    const add = (t, n) => L.push([t, n]);
    add(utc(y, 0, 1), "New Year's Day"); add(utc(y, 1, 14), "Valentine's Day"); add(utc(y, 9, 31), 'Halloween'); add(utc(y, 11, 25), 'Christmas Day'); add(utc(y, 11, 31), "New Year's Eve");
    if (c === 'US') {
      add(nth(y, 0, 1, 3), 'Martin Luther King Jr. Day'); add(nth(y, 1, 1, 3), "Presidents' Day"); add(utc(y, 2, 17), "St. Patrick's Day"); add(E, 'Easter Sunday');
      add(nth(y, 4, 0, 2), "Mother's Day"); add(lastWd(y, 4, 1), 'Memorial Day'); add(nth(y, 5, 0, 3), "Father's Day"); add(utc(y, 5, 19), 'Juneteenth');
      add(utc(y, 6, 4), 'Independence Day'); add(nth(y, 8, 1, 1), 'Labor Day'); add(nth(y, 9, 1, 2), 'Columbus Day'); add(utc(y, 10, 11), 'Veterans Day');
      add(nth(y, 10, 4, 4), 'Thanksgiving'); add(utc(y, 11, 24), 'Christmas Eve');
    } else if (c === 'UK') {
      add(E - 21 * DAY, "Mother's Day"); add(utc(y, 2, 17), "St. Patrick's Day"); add(E - 2 * DAY, 'Good Friday'); add(E, 'Easter Sunday'); add(E + DAY, 'Easter Monday');
      add(nth(y, 4, 1, 1), 'Early May Bank Holiday'); add(lastWd(y, 4, 1), 'Spring Bank Holiday'); add(nth(y, 5, 0, 3), "Father's Day"); add(lastWd(y, 7, 1), 'Summer Bank Holiday');
      add(utc(y, 10, 5), 'Bonfire Night'); add(utc(y, 10, 11), 'Remembrance Day'); add(utc(y, 11, 24), 'Christmas Eve'); add(utc(y, 11, 26), 'Boxing Day');
    } else if (c === 'CA') {
      add(nth(y, 1, 1, 3), 'Family Day'); add(utc(y, 2, 17), "St. Patrick's Day"); add(E - 2 * DAY, 'Good Friday'); add(E, 'Easter Sunday'); add(nth(y, 4, 0, 2), "Mother's Day");
      const v = utc(y, 4, 24); add(v - ((wday(v) - 1 + 7) % 7) * DAY, 'Victoria Day'); add(nth(y, 5, 0, 3), "Father's Day"); add(utc(y, 6, 1), 'Canada Day');
      add(nth(y, 7, 1, 1), 'Civic Holiday'); add(nth(y, 8, 1, 1), 'Labour Day'); add(nth(y, 9, 1, 2), 'Thanksgiving'); add(utc(y, 10, 11), 'Remembrance Day'); add(utc(y, 11, 24), 'Christmas Eve'); add(utc(y, 11, 26), 'Boxing Day');
    } else if (c === 'AU') {
      add(utc(y, 0, 26), 'Australia Day'); add(E - 2 * DAY, 'Good Friday'); add(E, 'Easter Sunday'); add(E + DAY, 'Easter Monday'); add(utc(y, 3, 25), 'Anzac Day');
      add(nth(y, 4, 0, 2), "Mother's Day"); add(nth(y, 5, 1, 2), "King's Birthday"); add(nth(y, 8, 0, 1), "Father's Day"); add(utc(y, 11, 24), 'Christmas Eve'); add(utc(y, 11, 26), 'Boxing Day');
    }
    const out = {}; L.forEach(([t, n]) => { const k = dkey(t); out[k] = out[k] ? out[k] + ' · ' + n : n; }); return out;
  }

  // ---------- colours ----------
  function hexRgb(h) { h = h.replace('#', ''); if (h.length === 3) h = h.split('').map(x => x + x).join(''); const n = parseInt(h, 16); return [(n >> 16 & 255) / 255, (n >> 8 & 255) / 255, (n & 255) / 255]; }
  function lum(h) { const c = hexRgb(h).map(v => v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; }
  function mix(a, b, t) { const x = hexRgb(a), y = hexRgb(b); return '#' + x.map((v, i) => Math.round((v + (y[i] - v) * t) * 255).toString(16).padStart(2, '0')).join(''); }

  const TAB_PALETTES = {
    Neutral: ['#EAE2D7', '#DDCFBE', '#CFBBA4', '#BFA68B', '#AC9175', '#937A64'],
    Sage: ['#E4E8DD', '#CFD8C6', '#B8C4AB', '#A0B091', '#899C7B', '#718566'],
    Blush: ['#F4E4E0', '#ECD2CB', '#E0BDB3', '#D3A79A', '#C49183', '#B17D6F'],
    Rainbow: ['#DDAA9C', '#E5C098', '#E8D5A0', '#BAC59C', '#A0B8C0', '#B6A8C8'],
    Ocean: ['#E2E9ED', '#C9D7DF', '#ADC1CD', '#90AABA', '#7594A7', '#5F7F93'],
    Mono: ['#EDEBE8', '#DAD6D1', '#C5BFB8', '#ABA49C', '#8D867E', '#6E6861']
  };
  const TAB_SINGLES = ['#A08066', '#2F2B27', '#C9B8A6', '#8F9E86', '#C49A8E', '#7F93A3', '#B4A2C0', '#D4B48E', '#6E5A4C', '#E3D9CC'];

  function theme(o) {
    const cream = o.paper === 'cream', dark = o.paper === 'dark';
    if (dark) {
      const t = { dark: true, paper: '#1E1C1A', ink: '#EFE9E1', soft: '#A99F94', faint: '#6E665E', line: '#3B3733', lite: '#2D2A27', fill: '#292623', accent: '#C9B39B', onInk: '#1E1C1A' };
      if (o.tabs.mode === 'single') { if (lum(o.tabs.color) > 0.18) t.accent = o.tabs.color; }
      else t.accent = (TAB_PALETTES[o.tabs.palette] || TAB_PALETTES.Neutral)[2];
      return t;
    }
    const t = {
      paper: cream ? '#FBF8F3' : '#FFFFFF', ink: '#2F2B27', soft: '#8A8279', faint: '#BEB6AC',
      line: cream ? '#E2DACE' : '#E4DED6', lite: cream ? '#EDE6DC' : '#EFEAE4', fill: cream ? '#F3EDE4' : '#F6F2ED', accent: '#A08066', onInk: '#FFFFFF'
    };
    if (o.tabs.mode === 'single') { if (lum(o.tabs.color) < 0.55) t.accent = o.tabs.color; }
    else t.accent = (TAB_PALETTES[o.tabs.palette] || TAB_PALETTES.Neutral)[5];
    return t;
  }
  function tabColor(o, i) {
    if (o.tabs.mode === 'single') return o.tabs.color;
    const p = TAB_PALETTES[o.tabs.palette] || TAB_PALETTES.Neutral;
    return p[i < 6 ? i : 11 - i];
  }
  const onColor = (bg) => lum(bg) > 0.42 ? '#2F2B27' : '#FFFFFF';

  // ---------- geometry ----------
  function geom(o) {
    const land = o.orientation === 'landscape';
    const W = land ? 1194 : 834, H = land ? 834 : 1194, M = 34, RAIL = 46;
    return { W, H, M, RAIL, land, X0: M + 6, X1: W - RAIL - 26, Y0: M, Y1: H - M };
  }

  // ---------- options ----------
  function normalize(o) {
    o = Object.assign({ startYear: 2027, startMonth: 0, weekStart: 1, orientation: 'portrait', weekly: 'boxes', daily: 'classic', dayStart: 7, clock: '12h', paper: 'white', holidays: 'US', cover: 0, name: '', tabs: { mode: 'palette', palette: 'Neutral' } }, o || {});
    o.startYear = Math.max(2025, Math.min(2035, +o.startYear | 0));
    o.startMonth = Math.max(0, Math.min(11, +o.startMonth | 0));
    o.weekStart = +o.weekStart === 0 ? 0 : 1;
    o.orientation = o.orientation === 'landscape' ? 'landscape' : 'portrait';
    if (!['boxes', 'vertical', 'columns'].includes(o.weekly)) o.weekly = 'boxes';
    if (!['classic', 'focus'].includes(o.daily)) o.daily = 'classic';
    if (!['white', 'cream', 'dark'].includes(o.paper)) o.paper = 'white';
    if (!['none', 'US', 'UK', 'CA', 'AU'].includes(o.holidays)) o.holidays = 'none';
    o.clock = o.clock === '24h' ? '24h' : '12h';
    if (!o.tabs || (o.tabs.mode !== 'single' && !TAB_PALETTES[o.tabs.palette])) o.tabs = { mode: 'palette', palette: 'Neutral' };
    if (o.tabs.mode === 'single' && !/^#[0-9a-fA-F]{6}$/.test(o.tabs.color || '')) o.tabs = { mode: 'palette', palette: 'Neutral' };
    o.dayStart = Math.max(5, Math.min(10, +o.dayStart | 0));
    o.cover = Math.max(0, Math.min(COVER_COUNT() - 1, +o.cover | 0));
    o.name = cleanName(o.name);
    return o;
  }
  const NOGLYPH = [164, 166, 172, 173, 177, 178, 179, 181, 185, 188, 189, 190, 264, 265, 276, 277, 284, 285, 292, 293, 296, 297, 300, 301, 308, 309, 312, 319, 320, 329, 334, 335, 348, 349, 354, 355, 358, 359, 360, 361, 383];
  function cleanName(s) {
    s = String(s || '').replace(/\s+/g, ' ').trim();
    let out = '';
    for (const ch of s) { const c = ch.codePointAt(0); if (((c >= 0x20 && c <= 0x7e) || (c > 0xa0 && c <= 0x17f) || c === 0x2019) && !NOGLYPH.includes(c)) out += ch; }
    return out.slice(0, 40);
  }

  // ---------- the plan (every page, in order) ----------
  function buildPlan(oIn) {
    const o = normalize(oIn);
    const months = [];
    for (let i = 0; i < 12; i++) { const mm = (o.startMonth + i) % 12, yy = o.startYear + Math.floor((o.startMonth + i) / 12); months.push({ y: yy, m: mm, i }); }
    const start = utc(o.startYear, o.startMonth, 1);
    const last = months[11];
    const end = utc(last.y, last.m, dim(last.y, last.m)) + DAY; // exclusive
    const sameYear = months[0].y === last.y;
    const yearLabel = sameYear ? String(months[0].y) : months[0].y + '–' + String(last.y).slice(2);
    const rangeLabel = MON3[months[0].m] + ' ' + months[0].y + ' – ' + MON3[last.m] + ' ' + last.y;
    const P = { o, months, start, end, yearLabel, rangeLabel, sameYear, pages: [], weeks: [], th: theme(o), g: geom(o) };
    const add = (key, kind, data) => P.pages.push(Object.assign({ key, kind }, data || {}));
    add('cover', 'cover'); add('home', 'home'); add('howto', 'howto'); add('year', 'year'); add('goals', 'goals'); add('meals', 'mealsIndex');
    const seen = {};
    months.forEach((mo, mi) => {
      add('m-' + mkey(mo.y, mo.m), 'month', { mo, mi });
      add('mh-' + mkey(mo.y, mo.m), 'habits', { mo, mi });
      add('mr-' + mkey(mo.y, mo.m), 'reflect', { mo, mi });
      for (let d = 1; d <= dim(mo.y, mo.m); d++) {
        const t = utc(mo.y, mo.m, d);
        const ws = weekStartOf(t, o.weekStart);
        if (!seen[ws]) { seen[ws] = 1; P.weeks.push({ ws, mi }); add('w-' + dkey(ws), 'week', { ws, mi }); add('ml-' + dkey(ws), 'meal', { ws, mi }); }
        add('d-' + dkey(t), 'day', { t, mi });
      }
    });
    add('tpl', 'tplIndex');
    TEMPLATES.forEach(tp => add('t-' + tp.id, 'tpl', { tp }));
    add('notes', 'notesIndex');
    NOTES.forEach((n, ni) => { for (let k = 1; k <= 2; k++) add('n-' + n.id + '-' + k, 'note', { n, k }); });
    for (let s = 1; s <= 4; s++) { add('s' + s, 'section', { s }); for (let k = 1; k <= 5; k++) add('s' + s + '-' + k, 'sectionPage', { s, k }); }
    for (let k = 1; k <= STICKER_PAGES; k++) add('stk-' + k, 'stickers', { k });
    P.keys = {}; P.pages.forEach((p, i) => { P.keys[p.key] = i; });
    P.inRange = t => t >= start && t < end;
    if (o.holidays !== 'none') { const hm = {}; for (let yy = months[0].y; yy <= last.y + 1; yy++) Object.assign(hm, holidaysFor(o.holidays, yy)); P.hol = t => hm[dkey(t)] || null; }
    P.monthIndex = (y, m) => months.findIndex(x => x.y === y && x.m === m);
    return P;
  }

  // ---------- small drawing kit (works on any Pen) ----------
  const F = { serif: 'serif', serifI: 'serifI', sans: 'sans', sansM: 'sansM', sansL: 'sansL' };
  function cap(P, x, y, s, o) { o = o || {}; P.text(String(s).toUpperCase(), x, y, { font: o.font || F.sansM, size: o.size || 7.6, color: o.color, spacing: o.spacing == null ? 1.4 : o.spacing, align: o.align || 'left' }); return P.measure(String(s).toUpperCase(), o.font || F.sansM, o.size || 7.6, o.spacing == null ? 1.4 : o.spacing); }
  function rrPath(w, h, r) { r = Math.min(r, w / 2, h / 2); return `M${r} 0 H${w - r} Q${w} 0 ${w} ${r} V${h - r} Q${w} ${h} ${w - r} ${h} H${r} Q0 ${h} 0 ${h - r} V${r} Q0 0 ${r} 0 Z`; }
  function leftRoundPath(w, h, r) { return `M${r} 0 H${w} V${h} H${r} Q0 ${h} 0 ${h - r} V${r} Q0 0 ${r} 0 Z`; }
  function starPath(r) { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + i * Math.PI / 5, rr = i % 2 ? r * 0.45 : r; d += (i ? 'L' : 'M') + (r + rr * Math.cos(a)).toFixed(2) + ' ' + (r + rr * Math.sin(a)).toFixed(2) + ' '; } return d + 'Z'; }
  const HEART = 'M12 21 C12 21 2 14.5 2 8.2 C2 5 4.5 2.6 7.4 2.6 C9.4 2.6 11 3.7 12 5.3 C13 3.7 14.6 2.6 16.6 2.6 C19.5 2.6 22 5 22 8.2 C22 14.5 12 21 12 21 Z';
  function box(P, x, y, w, h, th, o) { o = o || {}; P.rect(x, y, w, h, { r: o.r == null ? 10 : o.r, stroke: o.stroke || th.line, sw: 0.9, fill: o.fill }); }
  function lines(P, x, y, w, h, th, gap, first) { gap = gap || 26; for (let yy = y + (first || gap); yy <= y + h - 4; yy += gap) P.line(x, yy, x + w, yy, { color: th.lite, sw: 0.8 }); }
  function dots(P, x, y, w, h, th, gap) { gap = gap || 18; const nx = Math.floor(w / gap), ny = Math.floor(h / gap); const ox = x + (w - (nx - 1) * gap) / 2, oy = y + (h - (ny - 1) * gap) / 2; for (let j = 0; j < ny; j++) for (let i = 0; i < nx; i++) P.dot(ox + i * gap, oy + j * gap, 1.5, th.faint); }
  function gridLines(P, x, y, w, h, th, gap) { gap = gap || 18; for (let xx = x + gap; xx < x + w - 1; xx += gap) P.line(xx, y, xx, y + h, { color: th.lite, sw: 0.6 }); for (let yy = y + gap; yy < y + h - 1; yy += gap) P.line(x, yy, x + w, yy, { color: th.lite, sw: 0.6 }); }
  function checkbox(P, x, y, s, th) { P.rect(x, y, s, s, { r: 3, stroke: th.faint, sw: 0.9 }); }
  function checks(P, x, y, w, h, th, gap) { gap = gap || 28; for (let yy = y + gap / 2; yy <= y + h - gap / 2 + 2; yy += gap) { checkbox(P, x, yy - 6, 11, th); P.line(x + 20, yy + 6, x + w, yy + 6, { color: th.lite, sw: 0.8 }); } }
  function stars(P, x, y, n, r, th) { for (let i = 0; i < n; i++) P.path(starPath(r), x + i * (r * 2 + 5), y, 1, { stroke: th.faint, sw: 0.9 }); }
  function chevron(P, x, y, s, color, dir) { const d = dir === 'left' ? `M${s} 0 L0 ${s} L${s} ${2 * s}` : `M0 0 L${s} ${s} L0 ${2 * s}`; P.path(d, x, y, 1, { stroke: color, sw: 1.2 }); }
  function wrap(P, text, font, size, maxW) { const words = text.split(' '); const out = []; let cur = ''; for (const w of words) { const t = cur ? cur + ' ' + w : w; if (P.measure(t, font, size) > maxW && cur) { out.push(cur); cur = w; } else cur = t; } if (cur) out.push(cur); return out; }
  function fit(P, s, font, size, maxW) { if (P.measure(s, font, size) <= maxW) return s; while (s.length > 1 && P.measure(s + '…', font, size) > maxW) s = s.slice(0, -1); return s.trim() + '…'; }
  function holLabel(P, S, name, x, y, w, size, maxLines) {
    const ls = wrap(P, name, F.sans, size, w);
    const out = ls.slice(0, maxLines || 1); if (ls.length > out.length) out[out.length - 1] = fit(P, out[out.length - 1] + ' ' + ls.slice(out.length).join(' '), F.sans, size, w);
    out.forEach((l, i) => P.text(fit(P, l, F.sans, size, w), x, y + i * (size + 2.4), { font: F.sans, size, color: S.th.accent }));
  }
  function hourLabel(h, clock) { if (clock === '24h') return pad(h % 24) + ':00'; const hh = h % 24; const s = hh < 12 ? 'AM' : 'PM'; const v = hh % 12 === 0 ? 12 : hh % 12; return v + ' ' + s; }
  function gcalURL(t, h) { const s = t + h * 3600000, e = s + 3600000; const f = x => { const d = new Date(x); return d.getUTCFullYear() + pad(d.getUTCMonth() + 1) + pad(d.getUTCDate()) + 'T' + pad(d.getUTCHours()) + '0000'; }; return 'https://calendar.google.com/calendar/render?action=TEMPLATE&dates=' + f(s) + '%2F' + f(e); }
  function gcalDayURL(t) { const [y, m, d] = ymd(t); const [y2, m2, d2] = ymd(t + DAY); return 'https://calendar.google.com/calendar/render?action=TEMPLATE&dates=' + y + pad(m + 1) + pad(d) + '%2F' + y2 + pad(m2 + 1) + pad(d2); }
  function appleURL(t) { return 'calshow:' + Math.round((t + 12 * 3600000 - Date.UTC(2001, 0, 1)) / 1000); }

  // ---------- frame: paper, tabs, top nav ----------
  function frame(P, S, pg, act) {
    const { g, th, o } = S;
    P.rect(0, 0, g.W, g.H, { fill: th.paper });
    // right tab rail
    const tabs = [{ label: 'Year', key: 'year', special: true }];
    S.months.forEach((mo, i) => tabs.push({ label: MON3[mo.m], sub: (i > 0 && mo.m === 0) || (i === 0 && mo.m !== 0 && false) ? "'" + String(mo.y).slice(2) : '', key: 'm-' + mkey(mo.y, mo.m), mi: i }));
    tabs.push({ label: 'Tmpl', key: 'tpl', special: true }); tabs.push({ label: 'Notes', key: 'notes', special: true });
    const gap = 4, n = tabs.length, top = g.M, avail = g.H - 2 * g.M;
    const th0 = (avail - gap * (n - 1)) / n;
    tabs.forEach((tb, i) => {
      const y = top + i * (th0 + gap);
      const active = act && ((act.mi != null && tb.mi === act.mi) || (act.key && tb.key === act.key));
      const bg = tb.special ? (active ? th.ink : th.lite) : tabColor(o, tb.mi);
      const x = g.W - g.RAIL + (active ? 0 : 7);
      P.path(leftRoundPath(g.W - x, th0, 7), x, y, 1, { fill: bg });
      const fg = tb.special ? (active ? th.onInk : th.ink) : onColor(bg);
      const cx = x + (g.W - x) / 2;
      const ty = y + th0 / 2 + (tb.sub ? 0 : 3);
      P.text(tb.label.toUpperCase(), cx, ty, { font: F.sansM, size: 7.6, color: fg, align: 'center', spacing: 0.8 });
      if (tb.sub) P.text(tb.sub, cx, ty + 10, { font: F.sans, size: 7, color: fg, align: 'center', opacity: 0.8 });
      P.link(x, y, g.W - x, th0, tb.key);
    });
    // top nav
    const ny = g.Y0 + 8;
    let x = g.X0;
    (pg.crumbs || []).forEach((c, i) => {
      if (i) { P.text('/', x + 6, ny, { font: F.sans, size: 8, color: th.faint }); x += 16; }
      const w = cap(P, x, ny, c[0], { color: i === pg.crumbs.length - 1 ? th.ink : th.soft, size: 7.4 });
      if (c[1]) P.link(x - 3, ny - 11, w + 6, 16, c[1]);
      x += w;
    });
    const quick = [['Home', 'home'], ['Meals', pg.mealKey || 'meals'], ['Notes', 'notes'], ['Templates', 'tpl']];
    let rx = g.X1;
    quick.slice().reverse().forEach(([l, k]) => { const w = P.measure(l.toUpperCase(), F.sansM, 7.4, 1.4); rx -= w; cap(P, rx, ny, l, { color: th.soft, size: 7.4 }); P.link(rx - 4, ny - 11, w + 8, 16, k); rx -= 18; });
    P.line(g.X0, g.Y0 + 18, g.X1, g.Y0 + 18, { color: th.lite, sw: 0.8 });
  }
  function header(P, S, kicker, title, opt) {
    const { g, th } = S; opt = opt || {};
    if (kicker) cap(P, g.X0, g.Y0 + 46, kicker, { color: th.accent });
    P.text(title, g.X0, g.Y0 + 86, { font: F.serif, size: 40, color: th.ink });
    if (opt.after) { const w = P.measure(title, F.serif, 40); P.text(opt.after, g.X0 + w + 10, g.Y0 + 86, { font: F.serifI, size: 22, color: th.soft }); }
    return g.Y0 + 112;
  }
  function crumbsFor(S, t, extra) {
    const c = [[S.yearLabel, 'year']];
    if (t != null) { const [y, m] = ymd(t); c.push([MONTHS[m] + ' ' + y, S.monthIndex(y, m) >= 0 ? 'm-' + mkey(y, m) : null]); }
    return c.concat(extra || []);
  }
  function subnav(P, S, items, activeIdx) {
    const { g, th } = S; let x = g.X1; const y = g.Y0 + 84;
    items.slice().reverse().forEach((it, ri) => {
      const i = items.length - 1 - ri; const w = P.measure(it[0].toUpperCase(), F.sansM, 7.6, 1.4);
      x -= w; const act = i === activeIdx;
      if (act) P.rect(x - 9, y - 13, w + 18, 20, { r: 10, fill: th.ink });
      cap(P, x, y, it[0], { color: act ? th.onInk : th.soft });
      P.link(x - 9, y - 14, w + 18, 22, it[1]); x -= 26;
    });
  }

  // ---------- mini calendar (date picker) ----------
  function miniCal(P, S, x, y, w, yy, mm, opt) {
    const { th, o } = S; opt = opt || {};
    const cw = w / 7, ch = opt.ch || cw * 0.72;
    const mk = S.monthIndex(yy, mm) >= 0 ? 'm-' + mkey(yy, mm) : null;
    P.text(opt.title || (MONTHS[mm] + (opt.noYear ? '' : ' ' + yy)), x, y + 11, { font: F.serif, size: opt.titleSize || 15, color: th.ink });
    if (mk) P.link(x - 2, y - 2, w, 18, mk);
    const hy = y + 30;
    for (let i = 0; i < 7; i++) P.text(WD3[(o.weekStart + i) % 7][0], x + i * cw + cw / 2, hy, { font: F.sansM, size: 6.8, color: th.faint, align: 'center' });
    const first = utc(yy, mm, 1), off = (wday(first) - o.weekStart + 7) % 7;
    for (let d = 1; d <= dim(yy, mm); d++) {
      const k = off + d - 1, cx = x + (k % 7) * cw, cy = hy + 8 + Math.floor(k / 7) * ch;
      const t = utc(yy, mm, d), hi = opt.highlight === t;
      if (hi) P.circle(cx + cw / 2, cy + ch / 2, Math.min(cw, ch) / 2 - 0.5, { fill: th.ink });
      P.text(String(d), cx + cw / 2, cy + ch / 2 + 2.6, { font: hi ? F.sansM : F.sans, size: opt.fs || 7.6, color: hi ? th.onInk : th.ink, align: 'center' });
      if (S.hol && !hi && S.hol(t)) P.circle(cx + cw / 2, cy + ch / 2 + 6.5, 1.3, { fill: th.accent });
      if (S.inRange(t)) P.link(cx, cy, cw, ch, 'd-' + dkey(t));
    }
    return hy + 8 + 6 * ch;
  }

  // ---------- pages ----------
  function pCover(P, S) { const c = COVERS[S.o.cover]; drawCover(P, S, c); P.link(0, 0, S.g.W, S.g.H, 'home'); }

  function pHome(P, S) {
    const { g, th, o } = S;
    frame(P, S, { crumbs: [['Home']] }, { key: 'home' });
    cap(P, g.X0, g.Y0 + 46, 'The Fresh Start Planner', { color: th.accent });
    P.text(S.sameYear && S.o.startMonth === 0 ? S.yearLabel : S.rangeLabel, g.X0, g.Y0 + 92, { font: F.serif, size: g.land ? 44 : 46, color: th.ink });
    if (o.name) P.text('planned by ' + o.name, g.X0, g.Y0 + 122, { font: F.serifI, size: 18, color: th.soft });
    let y = g.Y0 + 150;
    cap(P, g.X0, y, 'Months', { color: th.soft }); y += 12;
    const cols = g.land ? 6 : 4, gw = g.X1 - g.X0, bw = (gw - (cols - 1) * 12) / cols, bh = g.land ? 70 : 78;
    S.months.forEach((mo, i) => {
      const bx = g.X0 + (i % cols) * (bw + 12), by = y + Math.floor(i / cols) * (bh + 12);
      const col = tabColor(o, i);
      P.rect(bx, by, bw, bh, { r: 12, fill: col });
      const fg = onColor(col);
      P.text(MONTHS[mo.m], bx + 14, by + bh - 18, { font: F.serif, size: 22, color: fg });
      P.text(String(mo.y), bx + 14, by + 20, { font: F.sansM, size: 8, color: fg, opacity: 0.85 });
      P.link(bx, by, bw, bh, 'm-' + mkey(mo.y, mo.m));
    });
    y += Math.ceil(12 / cols) * (bh + 12) + 22;
    cap(P, g.X0, y, 'Quick links', { color: th.soft }); y += 12;
    const ql = [['Year at a glance', 'year'], ['Yearly goals', 'goals'], ['Meal planners', 'meals'], ['Templates', 'tpl'], ['Notes', 'notes'], ['Stickers', 'stk-1'], ['Section 1', 's1'], ['Section 2', 's2'], ['Section 3', 's3'], ['Section 4', 's4'], ['How to use', 'howto'], ['Cover', 'cover']];
    const qc = g.land ? 4 : 3, qw = (gw - (qc - 1) * 12) / qc, qh = 46;
    ql.forEach(([l, k], i) => {
      const bx = g.X0 + (i % qc) * (qw + 12), by = y + Math.floor(i / qc) * (qh + 10);
      P.rect(bx, by, qw, qh, { r: 23, stroke: th.line, sw: 0.9, fill: th.paper });
      P.text(l, bx + 20, by + 28, { font: F.sans, size: 12, color: th.ink });
      chevron(P, bx + qw - 24, by + 18, 5, th.faint);
      P.link(bx, by, qw, qh, k);
    });
    y += Math.ceil(ql.length / qc) * (qh + 10) + 20;
    // this-year mini overview of first 3 months
    const left = g.Y1 - y;
    if (left > 170) {
      cap(P, g.X0, y, 'Coming up', { color: th.soft }); y += 16;
      const n = g.land ? 4 : 3, mw = (gw - (n - 1) * 26) / n;
      for (let i = 0; i < n; i++) { const mo = S.months[i]; miniCal(P, S, g.X0 + i * (mw + 26), y, mw, mo.y, mo.m, { ch: Math.min(20, (left - 70) / 7) }); }
    }
  }

  function pHowto(P, S) {
    const { g, th } = S;
    frame(P, S, { crumbs: [['Home', 'home'], ['How to use']] }, {});
    let y = header(P, S, 'Start here', 'How to use your planner') + 10;
    const steps = [
      ['Open it in a note app', 'Import this PDF into GoodNotes, Notability, Noteshelf, Penly, Xodo, Samsung Notes or any app that keeps PDF links working.'],
      ['Tap links in read mode', 'Most apps only follow links when the pen is off. In GoodNotes switch to Read Only (top right), tap a link, then switch back to write.'],
      ['Use the tabs', 'The tabs on the right take you to the year, every month, the templates and your notes, from any page.'],
      ['Jump anywhere', 'Tap a day on any calendar to open that day. Tap the small arrow at the start of a calendar row to open that week.'],
      ['Schedule in your calendar', 'On every daily page, tap + Google Cal (or the + next to an hour or time block) to create an event at that time. Apple Cal opens that day on your iPhone or iPad. These links work on iPad, Android and Samsung.'],
      ['Meal planner every week', 'Every weekly page has its own meal planner and grocery list. Tap Meals at the top of any page.'],
      ['Make it yours', 'Add the stickers from the sticker pages or the PNG pack, duplicate any template page, and rename the four custom sections.'],
      ['Need a new year?', 'Your builder link is yours for life. Come back any time to make the next 12 months, a new start month or another layout.']
    ];
    const cw = g.X1 - g.X0 - 60;
    steps.forEach((s, i) => {
      P.circle(g.X0 + 15, y + 12, 15, { fill: th.fill });
      P.text(String(i + 1), g.X0 + 15, y + 17, { font: F.serif, size: 16, color: th.ink, align: 'center' });
      P.text(s[0], g.X0 + 46, y + 10, { font: F.sansM, size: 13, color: th.ink });
      const ls = wrap(P, s[1], F.sans, 11, cw);
      ls.forEach((l, k) => P.text(l, g.X0 + 46, y + 30 + k * 16, { font: F.sans, size: 11, color: th.soft }));
      y += 44 + ls.length * 16 + (g.land ? 0 : 10);
    });
    if (g.Y1 - y > 200) {
      y += 14; cap(P, g.X0, y, 'Inside your planner', { color: th.accent }); y += 12;
      const o = S.o, facts = [[String(S.pages.length), 'hyperlinked pages'], ['12', 'dated months'], [String(TEMPLATES.length), 'templates'], ['200+', 'stickers'], [o.weekStart ? 'Monday' : 'Sunday', 'week start'], [o.holidays === 'none' ? 'Off' : o.holidays, 'holidays']];
      const c = 3, gx = 12, bw = (g.X1 - g.X0 - gx * (c - 1)) / c, bh = Math.min(84, (g.Y1 - y - gx) / 2);
      facts.forEach((f, i) => { const bx = g.X0 + (i % c) * (bw + gx), by = y + Math.floor(i / c) * (bh + gx); P.rect(bx, by, bw, bh, { r: 14, fill: th.fill }); P.text(f[0], bx + 18, by + bh / 2 + 4, { font: F.serif, size: 30, color: th.ink }); cap(P, bx + 18, by + bh / 2 + 24, f[1], { color: th.soft, size: 7 }); });
    }
  }

  function pYear(P, S) {
    const { g, th, o } = S;
    frame(P, S, { crumbs: [[S.yearLabel]] }, { key: 'year' });
    const top = header(P, S, 'Year at a glance', S.sameYear ? S.yearLabel : S.rangeLabel);
    subnav(P, S, [['At a glance', 'year'], ['Goals', 'goals']], 0);
    const cols = g.land ? 4 : 3, rows = 12 / cols, gx = 30, gy = g.land ? 14 : 26;
    const cw = (g.X1 - g.X0 - gx * (cols - 1)) / cols;
    const chh = (g.Y1 - top - gy * (rows - 1)) / rows;
    S.months.forEach((mo, i) => {
      const x = g.X0 + (i % cols) * (cw + gx), y = top + Math.floor(i / cols) * (chh + gy);
      miniCal(P, S, x, y + 4, cw, mo.y, mo.m, { ch: Math.min(cw / 7 * 0.8, (chh - 48) / 6), fs: 8.2, noYear: S.sameYear });
    });
  }

  function pMonth(P, S, pg) {
    const { g, th, o } = S; const { y, m } = pg.mo;
    frame(P, S, { crumbs: [[S.yearLabel, 'year'], [MONTHS[m] + ' ' + y]], mealKey: 'ml-' + dkey(weekStartOf(utc(y, m, 1), o.weekStart)) }, { mi: pg.mi });
    const top = header(P, S, 'Monthly calendar', MONTHS[m], { after: String(y) });
    subnav(P, S, [['Calendar', 'm-' + mkey(y, m)], ['Habits', 'mh-' + mkey(y, m)], ['Reflection', 'mr-' + mkey(y, m)]], 0);
    let gx0 = g.X0, gx1 = g.X1, gy0 = top, gy1 = g.Y1;
    if (g.land) {
      const sw = 230; gx1 = g.X1 - sw - 20; const sx = g.X1 - sw;
      cap(P, sx, top + 4, 'Main focus', { color: th.accent }); box(P, sx, top + 12, sw, 70, th); lines(P, sx + 14, top + 12, sw - 28, 70, th, 22);
      cap(P, sx, top + 106, 'Priorities', { color: th.accent }); box(P, sx, top + 114, sw, 170, th); checks(P, sx + 14, top + 120, sw - 28, 160, th);
      cap(P, sx, top + 308, 'Notes', { color: th.accent }); box(P, sx, top + 316, sw, g.Y1 - top - 316, th); lines(P, sx + 14, top + 316, sw - 28, g.Y1 - top - 316, th, 22);
    } else {
      cap(P, g.X0, top + 4, 'Main focus', { color: th.accent }); box(P, g.X0, top + 12, g.X1 - g.X0, 56, th); lines(P, g.X0 + 14, top + 12, g.X1 - g.X0 - 28, 56, th, 26);
      gy0 = top + 88; gy1 = g.Y1 - 190;
      const bw = (g.X1 - g.X0 - 20) / 2, by = g.Y1 - 170;
      cap(P, g.X0, by - 6, 'Notes', { color: th.accent }); box(P, g.X0, by + 2, bw, 168, th); lines(P, g.X0 + 14, by + 2, bw - 28, 168, th, 26);
      cap(P, g.X0 + bw + 20, by - 6, 'To do', { color: th.accent }); box(P, g.X0 + bw + 20, by + 2, bw, 168, th); checks(P, g.X0 + bw + 34, by + 8, bw - 28, 158, th);
    }
    // grid
    const first = utc(y, m, 1), off = (wday(first) - o.weekStart + 7) % 7, n = dim(y, m), rows = Math.ceil((off + n) / 7);
    const wk = 18, cw = (gx1 - gx0 - wk) / 7, hh = 22, rh = (gy1 - gy0 - hh) / rows;
    for (let i = 0; i < 7; i++) cap(P, gx0 + wk + i * cw + 8, gy0 + 14, WD3[(o.weekStart + i) % 7], { color: th.soft, size: 7.2 });
    const gt = gy0 + hh;
    P.rect(gx0 + wk, gt, cw * 7, rh * rows, { r: 10, stroke: th.line, sw: 0.9 });
    for (let i = 1; i < 7; i++) P.line(gx0 + wk + i * cw, gt, gx0 + wk + i * cw, gt + rh * rows, { color: th.line, sw: 0.8 });
    for (let r = 1; r < rows; r++) P.line(gx0 + wk, gt + r * rh, gx0 + wk + 7 * cw, gt + r * rh, { color: th.line, sw: 0.8 });
    const gridStart = first - off * DAY;
    for (let r = 0; r < rows; r++) {
      const ws = gridStart + r * 7 * DAY;
      chevron(P, gx0 + 4, gt + r * rh + rh / 2 - 5, 5, th.faint);
      P.link(gx0 - 2, gt + r * rh, wk, rh, 'w-' + dkey(ws));
      for (let c = 0; c < 7; c++) {
        const t = ws + c * DAY, [yy, mm, dd] = ymd(t), inM = mm === m;
        const cx = gx0 + wk + c * cw, cy = gt + r * rh;
        if (!inM) P.rect(cx + 1, cy + 1, cw - 2, rh - 2, { fill: th.fill, r: 0 });
        P.text(String(dd), cx + 9, cy + 18, { font: inM ? F.sansM : F.sans, size: 10, color: inM ? th.ink : th.faint });
        const hn = inM && S.hol && S.hol(t);
        if (hn) holLabel(P, S, hn, cx + 9, cy + 31, cw - 14, 6.6, rh > 70 ? 2 : 1);
        if (S.inRange(t)) P.link(cx, cy, cw, rh, 'd-' + dkey(t));
      }
    }
    // re-stroke the outer border over the fills
    P.rect(gx0 + wk, gt, cw * 7, rh * rows, { r: 10, stroke: th.line, sw: 0.9 });
  }

  function pHabits(P, S, pg) {
    const { g, th, o } = S; const { y, m } = pg.mo;
    frame(P, S, { crumbs: [[S.yearLabel, 'year'], [MONTHS[m] + ' ' + y, 'm-' + mkey(y, m)], ['Habits']] }, { mi: pg.mi });
    const top = header(P, S, 'Habit tracker', MONTHS[m], { after: String(y) });
    subnav(P, S, [['Calendar', 'm-' + mkey(y, m)], ['Habits', 'mh-' + mkey(y, m)], ['Reflection', 'mr-' + mkey(y, m)]], 1);
    const n = dim(y, m), nameW = g.land ? 170 : 130;
    const cw = (g.X1 - g.X0 - nameW) / 31, hh = 34;
    const bottom = g.Y1 - (g.land ? 0 : 150);
    const rows = Math.floor((bottom - top - hh) / 30), rh = (bottom - top - hh) / rows;
    for (let d = 1; d <= n; d++) {
      const x = g.X0 + nameW + (d - 1) * cw, t = utc(y, m, d);
      P.text(WD3[wday(t)][0], x + cw / 2, top + 12, { font: F.sansM, size: 6.6, color: th.faint, align: 'center' });
      P.text(String(d), x + cw / 2, top + 26, { font: F.sansM, size: 7.4, color: th.ink, align: 'center' });
      P.link(x, top, cw, 30, 'd-' + dkey(t));
    }
    cap(P, g.X0, top + 26, 'Habit', { color: th.soft });
    for (let r = 0; r < rows; r++) {
      const yy = top + hh + r * rh;
      P.line(g.X0, yy + rh - 4, g.X0 + nameW - 12, yy + rh - 4, { color: th.lite, sw: 0.8 });
      const s = Math.min(cw - 4, rh - 8, 15);
      for (let d = 1; d <= n; d++) P.rect(g.X0 + nameW + (d - 1) * cw + (cw - s) / 2, yy + (rh - s) / 2, s, s, { r: 3.5, stroke: th.line, sw: 0.8 });
    }
    if (!g.land) {
      const by = g.Y1 - 130, bw = (g.X1 - g.X0 - 20) / 2;
      cap(P, g.X0, by - 6, 'Habit I am building', { color: th.accent }); box(P, g.X0, by + 2, bw, 128, th); lines(P, g.X0 + 14, by + 2, bw - 28, 128, th, 26);
      cap(P, g.X0 + bw + 20, by - 6, 'Reward when I hit my goal', { color: th.accent }); box(P, g.X0 + bw + 20, by + 2, bw, 128, th); lines(P, g.X0 + bw + 34, by + 2, bw - 28, 128, th, 26);
    }
  }

  function pReflect(P, S, pg) {
    const { g } = S; const { y, m } = pg.mo;
    frame(P, S, { crumbs: [[S.yearLabel, 'year'], [MONTHS[m] + ' ' + y, 'm-' + mkey(y, m)], ['Reflection']] }, { mi: pg.mi });
    const top = header(P, S, 'Monthly reflection', MONTHS[m], { after: String(y) });
    subnav(P, S, [['Calendar', 'm-' + mkey(y, m)], ['Habits', 'mh-' + mkey(y, m)], ['Reflection', 'mr-' + mkey(y, m)]], 2);
    blocks(P, S, [
      { t: 'rating', title: 'How did it go?', items: ['Health', 'Work', 'Money', 'Relationships', 'Rest', 'Fun'], cols: g.land ? 3 : 2 },
      { t: 'boxes', items: ['Highlights', 'What went well', 'What I learned', 'Grateful for', 'Letting go of', 'Next month I will'], cols: g.land ? 3 : 2, kind: 'lines' }
    ], g.X0, top + 8, g.X1 - g.X0, g.Y1 - top - 8);
  }

  function pGoals(P, S) {
    const { g } = S;
    frame(P, S, { crumbs: [[S.yearLabel, 'year'], ['Goals']] }, { key: 'year' });
    const top = header(P, S, 'This year', 'Yearly goals');
    subnav(P, S, [['At a glance', 'year'], ['Goals', 'goals']], 1);
    blocks(P, S, [
      { t: 'row', w: [1, 2], fh: 92, items: [{ t: 'lines', title: 'Word of the year' }, { t: 'lines', title: 'This year I want to feel' }] },
      { t: 'boxes', items: ['Health & body', 'Work & career', 'Money', 'Relationships', 'Growth & learning', 'Fun & adventure'], cols: g.land ? 3 : 2, kind: 'check' }
    ], g.X0, top + 8, g.X1 - g.X0, g.Y1 - top - 8);
  }

  function weekCrumbs(S, ws) { const t = S.inRange(ws) ? ws : Math.max(ws, S.start); return crumbsFor(S, t, [['Week of ' + MON3[ymd(ws)[1]] + ' ' + ymd(ws)[2], 'w-' + dkey(ws)]]); }
  function rangeTitle(ws) { const a = ymd(ws), b = ymd(ws + 6 * DAY); return MON3[a[1]] + ' ' + a[2] + ' – ' + (a[1] === b[1] ? '' : MON3[b[1]] + ' ') + b[2]; }

  function pWeek(P, S, pg) {
    const { g, th, o } = S; const ws = pg.ws;
    frame(P, S, { crumbs: weekCrumbs(S, ws).slice(0, -1).concat([['Week']]), mealKey: 'ml-' + dkey(ws) }, { mi: pg.mi });
    const yEnd = ymd(ws + 6 * DAY)[0];
    const top = header(P, S, 'Weekly plan', rangeTitle(ws), { after: String(yEnd) });
    subnav(P, S, [['Week', 'w-' + dkey(ws)], ['Meal planner', 'ml-' + dkey(ws)]], 0);
    const dayHead = (x, y, w, t) => {
      const [yy, mm, dd] = ymd(t), inR = S.inRange(t);
      const cw0 = cap(P, x, y + 10, WD3[wday(t)], { color: inR ? th.accent : th.faint });
      P.text(String(dd), x + w - 4, y + 13, { font: F.serif, size: 18, color: inR ? th.ink : th.faint, align: 'right' });
      const hn = inR && S.hol && S.hol(t); if (hn) holLabel(P, S, hn, x + cw0 + 8, y + 10, w - cw0 - 36, 7, 1);
      if (inR) P.link(x - 6, y - 6, w + 12, 26, 'd-' + dkey(t));
    };
    if (o.weekly === 'columns') weekColumns(P, S, ws, top);
    else if (o.weekly === 'boxes') {
      cap(P, g.X0, top + 4, 'Main focus', { color: th.accent });
      P.line(g.X0 + 80, top + 6, g.X1, top + 6, { color: th.line, sw: 0.8 });
      const cols = g.land ? 4 : 2, rows = 8 / cols, gx = 14, gy = 14, y0 = top + 22;
      const bw = (g.X1 - g.X0 - gx * (cols - 1)) / cols, bh = (g.Y1 - y0 - gy * (rows - 1)) / rows;
      for (let i = 0; i < 8; i++) {
        const x = g.X0 + (i % cols) * (bw + gx), y = y0 + Math.floor(i / cols) * (bh + gy);
        box(P, x, y, bw, bh, th);
        if (i < 7) { const t = ws + i * DAY; dayHead(x + 14, y + 12, bw - 28, t); P.line(x + 14, y + 34, x + bw - 14, y + 34, { color: th.line, sw: 0.8 }); checks(P, x + 14, y + 38, bw - 28, Math.min(3 * 26, bh - 50), th, 26); lines(P, x + 14, y + 38 + 3 * 26, bw - 28, bh - 38 - 3 * 26, th, 26); }
        else { cap(P, x + 14, y + 22, 'To do & notes', { color: th.accent }); P.line(x + 14, y + 34, x + bw - 14, y + 34, { color: th.line, sw: 0.8 }); checks(P, x + 14, y + 38, bw - 28, bh - 44, th, 26); }
      }
    } else {
      const sw = g.land ? 300 : Math.round((g.X1 - g.X0) * 0.36), lx1 = g.X1 - sw - 22, sx = g.X1 - sw;
      const rh = (g.Y1 - top - 8) / 7;
      for (let i = 0; i < 7; i++) {
        const t = ws + i * DAY, y = top + 8 + i * rh, [yy, mm, dd] = ymd(t), inR = S.inRange(t);
        P.line(g.X0, y, lx1, y, { color: th.line, sw: 0.9 });
        cap(P, g.X0, y + 20, WD3[wday(t)], { color: inR ? th.accent : th.faint });
        P.text(String(dd), g.X0, y + 50, { font: F.serif, size: 28, color: inR ? th.ink : th.faint });
        if (inR) P.link(g.X0 - 4, y + 2, 56, rh - 4, 'd-' + dkey(t));
        const hn = inR && S.hol && S.hol(t); if (hn) holLabel(P, S, hn, g.X0, y + 66, 64, 6.4, 3);
        lines(P, g.X0 + 70, y, lx1 - g.X0 - 70, rh, th, 24);
      }
      P.line(g.X0, g.Y1, lx1, g.Y1, { color: th.line, sw: 0.9 });
      let yy = top + 8;
      cap(P, sx, yy + 4, 'Main focus', { color: th.accent }); box(P, sx, yy + 12, sw, 74, th); lines(P, sx + 14, yy + 12, sw - 28, 74, th, 24);
      yy += 108; const td = g.land ? 250 : 330;
      cap(P, sx, yy, 'To do', { color: th.accent }); box(P, sx, yy + 8, sw, td, th); checks(P, sx + 14, yy + 14, sw - 28, td - 12, th);
      yy += td + 30;
      const hb = 5 * 26 + 30;
      cap(P, sx, yy, 'Habits', { color: th.accent }); box(P, sx, yy + 8, sw, hb, th);
      const dw = (sw - 100) / 7;
      for (let i = 0; i < 7; i++) P.text(WD3[wday(ws + i * DAY)][0], sx + 86 + i * dw + dw / 2, yy + 28, { font: F.sansM, size: 6.8, color: th.faint, align: 'center' });
      for (let r = 0; r < 5; r++) { const ry = yy + 36 + r * 26; P.line(sx + 14, ry + 18, sx + 76, ry + 18, { color: th.lite, sw: 0.8 }); for (let i = 0; i < 7; i++) P.circle(sx + 86 + i * dw + dw / 2, ry + 11, 5.5, { stroke: th.line, sw: 0.8 }); }
      yy += hb + 30;
      cap(P, sx, yy, 'Notes', { color: th.accent }); box(P, sx, yy + 8, sw, g.Y1 - yy - 8, th); dots(P, sx + 10, yy + 14, sw - 20, g.Y1 - yy - 20, th, 18);
    }
  }

  function pMeal(P, S, pg) {
    const { g, th } = S; const ws = pg.ws;
    frame(P, S, { crumbs: weekCrumbs(S, ws).concat([['Meals']]), mealKey: 'ml-' + dkey(ws) }, { mi: pg.mi });
    const top = header(P, S, 'Meal planner', rangeTitle(ws), { after: String(ymd(ws + 6 * DAY)[0]) });
    subnav(P, S, [['Week', 'w-' + dkey(ws)], ['Meal planner', 'ml-' + dkey(ws)]], 1);
    const gw = g.land ? (g.X1 - g.X0) * 0.7 : g.X1 - g.X0, gh = g.land ? g.Y1 - top - 8 : (g.Y1 - top) * 0.66;
    const y0 = top + 8, lw = 70, hh = 26, cols = ['Breakfast', 'Lunch', 'Dinner', 'Snacks'];
    const cw = (gw - lw) / 4, rh = (gh - hh) / 7;
    P.rect(g.X0, y0, gw, gh, { r: 10, stroke: th.line, sw: 0.9 });
    P.rect(g.X0 + 1, y0 + 1, gw - 2, hh - 1, { fill: th.fill, r: 0 });
    cols.forEach((c, i) => { cap(P, g.X0 + lw + i * cw + 12, y0 + 17, c, { color: th.soft }); P.line(g.X0 + lw + i * cw, y0, g.X0 + lw + i * cw, y0 + gh, { color: th.line, sw: 0.8 }); });
    for (let i = 0; i < 7; i++) {
      const t = ws + i * DAY, y = y0 + hh + i * rh, inR = S.inRange(t);
      P.line(g.X0, y, g.X0 + gw, y, { color: th.line, sw: 0.8 });
      cap(P, g.X0 + 12, y + 20, WD3[wday(t)], { color: inR ? th.accent : th.faint });
      P.text(String(ymd(t)[2]), g.X0 + 12, y + 44, { font: F.serif, size: 20, color: inR ? th.ink : th.faint });
      if (inR) P.link(g.X0, y, lw, rh, 'd-' + dkey(t));
    }
    P.rect(g.X0, y0, gw, gh, { r: 10, stroke: th.line, sw: 0.9 });
    let gx = g.X0, gy = y0 + gh + 30, gW = gw, gH = g.Y1 - gy;
    if (g.land) { gx = g.X0 + gw + 22; gy = y0 + 4; gW = g.X1 - gx; gH = g.Y1 - gy; }
    cap(P, gx, gy - 4, 'Grocery list', { color: th.accent });
    box(P, gx, gy + 4, gW, gH - 4, th);
    const gc = g.land ? 1 : 3, gcw = (gW - 28) / gc;
    for (let i = 0; i < gc; i++) checks(P, gx + 14 + i * gcw, gy + 10, gcw - 16, gH - 18, th, 26);
  }

  function pMealsIndex(P, S) {
    const { g, th, o } = S;
    frame(P, S, { crumbs: [['Home', 'home'], ['Meal planners']] }, {});
    const top = header(P, S, 'Every week', 'Meal planners');
    const byM = S.months.map(() => []); S.weeks.forEach(w => byM[w.mi].push(w.ws));
    const cols = g.land ? 4 : 3, rows = 4 / (cols / 3) | 0;
    const nr = Math.ceil(12 / cols), cw = (g.X1 - g.X0 - 20 * (cols - 1)) / cols, ch = (g.Y1 - top - 16 * (nr - 1)) / nr;
    S.months.forEach((mo, i) => {
      const x = g.X0 + (i % cols) * (cw + 20), y = top + Math.floor(i / cols) * (ch + 16);
      P.text(MONTHS[mo.m] + ' ' + mo.y, x, y + 14, { font: F.serif, size: 17, color: th.ink });
      byM[i].forEach((ws, k) => {
        const by = y + 24 + k * Math.min(30, (ch - 30) / 6), bh = Math.min(26, (ch - 30) / 6 - 4);
        P.rect(x, by, cw, bh, { r: bh / 2, fill: th.fill });
        P.text('Week of ' + MON3[ymd(ws)[1]] + ' ' + ymd(ws)[2], x + 12, by + bh / 2 + 3.5, { font: F.sans, size: 9.5, color: th.ink });
        P.link(x, by, cw, bh, 'ml-' + dkey(ws));
      });
    });
  }

  function pDay(P, S, pg) {
    const { g, th, o } = S; const t = pg.t; const [y, m, d] = ymd(t); const ws = weekStartOf(t, o.weekStart);
    frame(P, S, { crumbs: [[S.yearLabel, 'year'], [MONTHS[m] + ' ' + y, 'm-' + mkey(y, m)], ['Week', 'w-' + dkey(ws)], [MON3[m] + ' ' + d]], mealKey: 'ml-' + dkey(ws) }, { mi: pg.mi });
    const top = g.Y0 + 30;
    const wdw = cap(P, g.X0, top + 18, WDAYS[wday(t)], { color: th.accent, size: 8.4 });
    const hn = S.hol && S.hol(t);
    if (hn) { const hw = P.measure(hn, F.serifI, 13) + 22; P.rect(g.X0 + wdw + 12, top + 4, hw, 20, { r: 10, fill: th.fill }); P.text(hn, g.X0 + wdw + 23, top + 18.5, { font: F.serifI, size: 13, color: th.ink }); }
    P.text(MONTHS[m] + ' ' + d, g.X0, top + 72, { font: F.serif, size: 50, color: th.ink });
    const tw = P.measure(MONTHS[m] + ' ' + d, F.serif, 50);
    P.text(String(y), g.X0 + tw + 12, top + 72, { font: F.serifI, size: 24, color: th.soft });
    // prev / next
    const ay = top + 96;
    const prev = t - DAY, next = t + DAY;
    if (S.inRange(prev)) { chevron(P, g.X0, ay - 8, 4.5, th.soft, 'left'); cap(P, g.X0 + 12, ay + 1, 'Previous', { color: th.soft, size: 7 }); P.link(g.X0 - 4, ay - 12, 70, 20, 'd-' + dkey(prev)); }
    if (S.inRange(next)) { const nx = g.X0 + 92; cap(P, nx, ay + 1, 'Next', { color: th.soft, size: 7 }); chevron(P, nx + 32, ay - 8, 4.5, th.soft); P.link(nx - 4, ay - 12, 50, 20, 'd-' + dkey(next)); }
    // calendar shortcuts
    const cx = g.X0 + 172;
    P.rect(cx, ay - 12, 112, 20, { r: 10, stroke: th.line, sw: 0.8 }); cap(P, cx + 12, ay + 1, '+ Google Cal', { color: th.ink, size: 7 }); P.url(cx, ay - 12, 112, 20, gcalDayURL(t));
    P.rect(cx + 120, ay - 12, 104, 20, { r: 10, stroke: th.line, sw: 0.8 }); cap(P, cx + 132, ay + 1, 'Apple Cal', { color: th.ink, size: 7 }); P.url(cx + 120, ay - 12, 104, 20, appleURL(t));
    // date picker
    const mw = g.land ? 190 : 170;
    miniCal(P, S, g.X1 - mw, top + 4, mw, y, m, { highlight: t, ch: 14.5, fs: 7.4, titleSize: 13 });
    // body
    if (o.daily === 'focus') return dayFocus(P, S, t, top + 140);
    const by = top + 140, bh = g.Y1 - by;
    const lw = Math.round((g.X1 - g.X0) * (g.land ? 0.46 : 0.52)), rx = g.X0 + lw + 24, rw = g.X1 - rx;
    cap(P, g.X0, by, 'Schedule', { color: th.accent });
    const sy = by + 10, slots = 15, rh = (g.Y1 - sy) / slots;
    for (let i = 0; i < slots; i++) {
      const yy = sy + i * rh, h = o.dayStart + i;
      P.line(g.X0, yy, g.X0 + lw, yy, { color: th.line, sw: 0.8 });
      P.line(g.X0 + 50, yy + rh / 2, g.X0 + lw - 26, yy + rh / 2, { color: th.lite, sw: 0.7, dash: [2, 3] });
      P.text(hourLabel(h, o.clock), g.X0, yy + 14, { font: F.sansM, size: 7.6, color: th.soft });
      P.circle(g.X0 + lw - 9, yy + 11, 6.5, { stroke: th.line, sw: 0.8 });
      P.line(g.X0 + lw - 12, yy + 11, g.X0 + lw - 6, yy + 11, { color: th.soft, sw: 0.9 }); P.line(g.X0 + lw - 9, yy + 8, g.X0 + lw - 9, yy + 14, { color: th.soft, sw: 0.9 });
      P.url(g.X0 + lw - 20, yy + 1, 22, 21, gcalURL(t, h));
    }
    P.line(g.X0, g.Y1, g.X0 + lw, g.Y1, { color: th.line, sw: 0.8 });
    // right column
    let yy = by;
    cap(P, rx, yy, 'Top 3 priorities', { color: th.accent }); yy += 10;
    for (let i = 0; i < 3; i++) { P.circle(rx + 9, yy + 14 + i * 30, 9, { fill: th.fill }); P.text(String(i + 1), rx + 9, yy + 18 + i * 30, { font: F.serif, size: 11, color: th.ink, align: 'center' }); P.line(rx + 26, yy + 22 + i * 30, rx + rw, yy + 22 + i * 30, { color: th.lite, sw: 0.8 }); }
    yy += 106;
    const todoH = g.land ? 7 * 27 : 9 * 28;
    cap(P, rx, yy, 'To do', { color: th.accent }); yy += 6;
    checks(P, rx, yy, rw, todoH, th, g.land ? 27 : 28); yy += todoH + 22;
    const trackH = 64;
    const notesH = g.Y1 - yy - trackH - 14;
    cap(P, rx, yy, 'Notes', { color: th.accent }); box(P, rx, yy + 8, rw, notesH - 8, th); dots(P, rx + 8, yy + 14, rw - 16, notesH - 20, th, 18);
    yy += notesH + 14;
    box(P, rx, yy, rw, trackH, th, { fill: th.fill, stroke: th.fill });
    const half = rw / 2;
    cap(P, rx + 14, yy + 20, 'Water', { color: th.soft, size: 7 });
    for (let i = 0; i < 8; i++) P.path('M5 0 C5 0 0 6 0 9.5 C0 12.5 2.2 14.5 5 14.5 C7.8 14.5 10 12.5 10 9.5 C10 6 5 0 5 0 Z', rx + 14 + i * ((half - 26) / 8), yy + 30, 1, { stroke: th.faint, sw: 0.9 });
    cap(P, rx + half + 6, yy + 20, 'Mood', { color: th.soft, size: 7 });
    for (let i = 0; i < 5; i++) { const ccx = rx + half + 14 + i * ((half - 30) / 5) + 7; P.circle(ccx, yy + 40, 8, { stroke: th.faint, sw: 0.9 }); }
  }

  // ADHD-friendly "focus" daily page
  function dayFocus(P, S, t, by) {
    const { g, th } = S;
    const lw = Math.round((g.X1 - g.X0) * (g.land ? 0.5 : 0.53)), rx = g.X0 + lw + 24, rw = g.X1 - rx;
    let y = by;
    // one thing
    cap(P, g.X0, y, 'If I only do one thing', { color: th.accent }); y += 8;
    P.rect(g.X0, y, lw, 54, { r: 12, fill: th.fill });
    P.path(starPath(9), g.X0 + 14, y + 18, 1, { stroke: th.accent, sw: 1.1 });
    P.line(g.X0 + 44, y + 36, g.X0 + lw - 16, y + 36, { color: th.line, sw: 0.8 });
    y += 54 + 22;
    // energy + mood
    cap(P, g.X0, y, 'Energy check-in', { color: th.accent }); y += 8;
    box(P, g.X0, y, lw, 46, th);
    const lv = ['Low', 'Okay', 'High'], ew = (lw * 0.56) / 3;
    lv.forEach((l, i) => { const ex = g.X0 + 16 + i * ew; P.circle(ex + 6, y + 23, 6, { stroke: th.faint, sw: 0.9 }); P.text(l, ex + 18, y + 27, { font: F.sans, size: 10, color: th.ink }); });
    const mx = g.X0 + lw * 0.6; cap(P, mx, y + 27, 'Mood', { color: th.soft, size: 7 });
    for (let i = 0; i < 5; i++) P.circle(mx + 44 + i * ((lw * 0.4 - 60) / 5) + 6, y + 23, 7, { stroke: th.faint, sw: 0.9 });
    y += 46 + 22;
    // time blocks
    const blocksH = g.Y1 - y, parts = [['Morning', 9], ['Afternoon', 13], ['Evening', 18]], gap = 14, bh = (blocksH - gap * 2 - 3 * 16) / 3;
    parts.forEach(([nm, h], i) => {
      cap(P, g.X0, y, nm, { color: th.accent });
      const bx = g.X0 + lw - 84; P.rect(bx, y - 12, 84, 18, { r: 9, stroke: th.line, sw: 0.8 }); cap(P, bx + 10, y + 0.5, '+ Calendar', { color: th.soft, size: 6.6 }); P.url(bx, y - 12, 84, 18, gcalURL(t, h));
      box(P, g.X0, y + 8, lw, bh, th); checks(P, g.X0 + 14, y + 12, lw - 28, bh - 8, th, 27);
      y += 16 + bh + gap;
    });
    // right column
    let yy = by; const bdH = Math.round((g.Y1 - by) * (g.land ? 0.36 : 0.34));
    cap(P, rx, yy, 'Brain dump', { color: th.accent }); box(P, rx, yy + 8, rw, bdH, th); dots(P, rx + 8, yy + 14, rw - 16, bdH - 12, th, 18);
    yy += bdH + 30;
    const doneH = Math.round((g.Y1 - by) * (g.land ? 0.27 : 0.3));
    cap(P, rx, yy, 'Done list', { color: th.accent }); P.text('(yes, it counts)', rx + P.measure('DONE LIST', F.sansM, 7.6, 1.4) + 8, yy + 0.5, { font: F.serifI, size: 11, color: th.soft });
    box(P, rx, yy + 8, rw, doneH, th);
    for (let k = 0; k * 27 + 30 < doneH; k++) { P.path('M0 4 L4 8 L11 0', rx + 14, yy + 22 + k * 27, 1, { stroke: th.faint, sw: 1.1 }); P.line(rx + 34, yy + 32 + k * 27, rx + rw - 14, yy + 32 + k * 27, { color: th.lite, sw: 0.8 }); }
    yy += doneH + 30;
    const trackH = 62, tomH = g.Y1 - yy - trackH - 22;
    cap(P, rx, yy, 'Tomorrow, future me will thank me for', { color: th.accent }); box(P, rx, yy + 8, rw, tomH, th); lines(P, rx + 14, yy + 8, rw - 28, tomH, th, 26);
    yy += tomH + 22;
    box(P, rx, yy, rw, trackH, th, { fill: th.fill, stroke: th.fill });
    const half = rw / 2;
    cap(P, rx + 14, yy + 20, 'Water', { color: th.soft, size: 7 });
    for (let i = 0; i < 8; i++) P.path('M5 0 C5 0 0 6 0 9.5 C0 12.5 2.2 14.5 5 14.5 C7.8 14.5 10 12.5 10 9.5 C10 6 5 0 5 0 Z', rx + 14 + i * ((half - 26) / 8), yy + 30, 1, { stroke: th.faint, sw: 0.9 });
    cap(P, rx + half + 6, yy + 20, 'Sleep', { color: th.soft, size: 7 });
    for (let i = 0; i < 10; i++) P.rect(rx + half + 6 + i * ((half - 20) / 10), yy + 32, (half - 20) / 10 - 3, 12, { r: 2.5, stroke: th.faint, sw: 0.8 });
  }

  function weekColumns(P, S, ws, top) {
    const { g, th } = S;
    cap(P, g.X0, top + 4, 'Main focus', { color: th.accent });
    P.line(g.X0 + 80, top + 6, g.X1, top + 6, { color: th.line, sw: 0.8 });
    const y0 = top + 22, botH = g.land ? 150 : 230, gx = 8, cw = (g.X1 - g.X0 - gx * 6) / 7, ch = g.Y1 - y0 - botH - 18;
    for (let i = 0; i < 7; i++) {
      const t = ws + i * DAY, x = g.X0 + i * (cw + gx), inR = S.inRange(t), dd = ymd(t)[2];
      P.rect(x, y0, cw, ch, { r: 10, stroke: th.line, sw: 0.9 });
      P.rect(x + 1, y0 + 1, cw - 2, 54, { r: 9, fill: th.fill });
      cap(P, x + 10, y0 + 18, WD3[wday(t)], { color: inR ? th.accent : th.faint, size: 7 });
      P.text(String(dd), x + 10, y0 + 46, { font: F.serif, size: 24, color: inR ? th.ink : th.faint });
      if (inR) P.link(x, y0, cw, 56, 'd-' + dkey(t));
      const hn = inR && S.hol && S.hol(t); let cy = y0 + 62;
      if (hn) { holLabel(P, S, hn, x + 8, cy + 8, cw - 14, 6.4, 2); cy += 22; }
      for (let k = 0; cy + k * 26 + 20 < y0 + ch; k++) { const ly = cy + k * 26; checkbox(P, x + 8, ly + 6, 9, th); P.line(x + 22, ly + 16, x + cw - 8, ly + 16, { color: th.lite, sw: 0.8 }); }
    }
    const by = y0 + ch + 18, bw = (g.X1 - g.X0 - 16) / 2;
    cap(P, g.X0, by + 4, 'To do', { color: th.accent }); box(P, g.X0, by + 12, bw, botH - 12, th); checks(P, g.X0 + 14, by + 16, bw - 28, botH - 20, th, 26);
    cap(P, g.X0 + bw + 16, by + 4, 'Notes', { color: th.accent }); box(P, g.X0 + bw + 16, by + 12, bw, botH - 12, th); dots(P, g.X0 + bw + 24, by + 18, bw - 16, botH - 24, th, 18);
  }

  function pTplIndex(P, S) {
    const { g, th } = S;
    frame(P, S, { crumbs: [['Home', 'home'], ['Templates']] }, { key: 'tpl' });
    const top = header(P, S, TEMPLATES.length + ' templates', 'Templates');
    const cats = CATS.map(c => ({ c, items: TEMPLATES.filter(t => t.cat === c) }));
    const cols = g.land ? 4 : 3, cw = (g.X1 - g.X0 - 20 * (cols - 1)) / cols;
    // simple column packing
    const colY = Array(cols).fill(top + 4);
    const lh = g.land ? 23 : 29;
    cats.forEach(cat => {
      let ci = colY.indexOf(Math.min.apply(null, colY));
      let x = g.X0 + ci * (cw + 20), y = colY[ci];
      P.text(cat.c, x, y + 16, { font: F.serif, size: 20, color: th.ink });
      y += 26;
      cat.items.forEach(tp => {
        P.rect(x, y, cw, lh - 4, { r: (lh - 4) / 2, fill: th.fill });
        P.text(tp.name, x + 14, y + (lh - 4) / 2 + 3.5, { font: F.sans, size: 10, color: th.ink });
        chevron(P, x + cw - 18, y + (lh - 4) / 2 - 4, 4, th.faint);
        P.link(x, y, cw, lh - 4, 't-' + tp.id); y += lh;
      });
      colY[ci] = y + 18;
    });
  }

  function pTpl(P, S, pg) {
    const { g } = S; const tp = pg.tp;
    frame(P, S, { crumbs: [['Templates', 'tpl'], [tp.cat], [tp.name]] }, { key: 'tpl' });
    const top = header(P, S, tp.cat, tp.name);
    blocks(P, S, tp.blocks(g), g.X0, top + 8, g.X1 - g.X0, g.Y1 - top - 8);
  }

  function pNotesIndex(P, S) {
    const { g, th } = S;
    frame(P, S, { crumbs: [['Home', 'home'], ['Notes']] }, { key: 'notes' });
    const top = header(P, S, '6 layouts · 2 pages each', 'Notes');
    const cols = 3, rows = 2, gx = 20, gy = 26;
    const cw = (g.X1 - g.X0 - gx * (cols - 1)) / cols, ch = (g.Y1 - top - 30 - gy * (rows - 1)) / rows;
    NOTES.forEach((n, i) => {
      const x = g.X0 + (i % cols) * (cw + gx), y = top + 8 + Math.floor(i / cols) * (ch + gy);
      box(P, x, y, cw, ch - 30, th);
      noteBody(P, S, n.id, x + 10, y + 10, cw - 20, ch - 50, 0.6);
      P.text(n.name, x, y + ch - 10, { font: F.serif, size: 16, color: th.ink });
      P.link(x, y, cw, ch, 'n-' + n.id + '-1');
    });
  }
  function noteBody(P, S, id, x, y, w, h, s) {
    const th = S.th; s = s || 1;
    if (id === 'lined') lines(P, x, y, w, h, th, 26 * s);
    else if (id === 'grid') gridLines(P, x, y, w, h, th, 18 * s);
    else if (id === 'dotted') dots(P, x, y, w, h, th, 18 * s);
    else if (id === 'cornell') { const cw = w * 0.3, sh = h * 0.2; P.line(x + cw, y, x + cw, y + h - sh, { color: th.line, sw: 0.9 }); P.line(x, y + h - sh, x + w, y + h - sh, { color: th.line, sw: 0.9 }); cap(P, x + 4, y + 14 * s + 4, 'Cues', { color: th.faint, size: 7 * Math.max(s, 0.8) }); cap(P, x + 4, y + h - sh + 18 * s, 'Summary', { color: th.faint, size: 7 * Math.max(s, 0.8) }); lines(P, x + cw + 10, y, w - cw - 10, h - sh, th, 26 * s); }
    else if (id === 'twocol') { const cw = (w - 20) / 2; lines(P, x, y, cw, h, th, 26 * s); lines(P, x + cw + 20, y, cw, h, th, 26 * s); P.line(x + cw + 10, y, x + cw + 10, y + h, { color: th.line, sw: 0.8 }); }
  }
  function pNote(P, S, pg) {
    const { g, th } = S; const n = pg.n;
    frame(P, S, { crumbs: [['Notes', 'notes'], [n.name], ['Page ' + pg.k]] }, { key: 'notes' });
    cap(P, g.X0, g.Y0 + 46, n.name + ' notes', { color: th.accent });
    P.line(g.X0, g.Y0 + 86, g.X0 + 300, g.Y0 + 86, { color: th.line, sw: 0.8 });
    cap(P, g.X0 + 312, g.Y0 + 86, 'Date', { color: th.faint }); P.line(g.X0 + 350, g.Y0 + 86, g.X0 + 470, g.Y0 + 86, { color: th.line, sw: 0.8 });
    const other = pg.k === 1 ? 2 : 1;
    subnav(P, S, [['Page 1', 'n-' + n.id + '-1'], ['Page 2', 'n-' + n.id + '-2']], pg.k - 1);
    noteBody(P, S, n.id, g.X0, g.Y0 + 108, g.X1 - g.X0, g.Y1 - g.Y0 - 108, 1);
  }

  function pSection(P, S, pg) {
    const { g, th } = S; const s = pg.s;
    frame(P, S, { crumbs: [['Home', 'home'], ['Section ' + s]] }, {});
    cap(P, g.X0, g.Y0 + 46, 'Custom section ' + s, { color: th.accent });
    P.text('Write your title here', g.X0, g.Y0 + 86, { font: F.serifI, size: 26, color: th.faint });
    P.line(g.X0, g.Y0 + 98, g.X1, g.Y0 + 98, { color: th.line, sw: 0.9 });
    let y = g.Y0 + 140;
    cap(P, g.X0, y, 'Pages', { color: th.soft }); y += 14;
    for (let k = 1; k <= 5; k++) {
      P.rect(g.X0, y, g.X1 - g.X0, 44, { r: 22, fill: th.fill });
      P.text('Page ' + k, g.X0 + 20, y + 27, { font: F.sans, size: 12, color: th.ink });
      P.line(g.X0 + 90, y + 30, g.X1 - 50, y + 30, { color: th.line, sw: 0.7 });
      chevron(P, g.X1 - 26, y + 17, 5, th.faint);
      P.link(g.X0, y, g.X1 - g.X0, 44, 's' + s + '-' + k); y += 54;
    }
    y += 20; cap(P, g.X0, y, 'About this section', { color: th.soft });
    box(P, g.X0, y + 10, g.X1 - g.X0, g.Y1 - y - 10, th); lines(P, g.X0 + 14, y + 10, g.X1 - g.X0 - 28, g.Y1 - y - 10, th, 26);
  }
  function pSectionPage(P, S, pg) {
    const { g, th } = S;
    frame(P, S, { crumbs: [['Section ' + pg.s, 's' + pg.s], ['Page ' + pg.k]] }, {});
    cap(P, g.X0, g.Y0 + 46, 'Section ' + pg.s + ' · page ' + pg.k, { color: th.accent });
    P.line(g.X0, g.Y0 + 86, g.X1, g.Y0 + 86, { color: th.line, sw: 0.8 });
    noteBody(P, S, pg.k % 2 ? 'dotted' : 'lined', g.X0, g.Y0 + 104, g.X1 - g.X0, g.Y1 - g.Y0 - 104, 1);
  }

  // ---------- template block engine ----------
  function blocks(P, S, list, x, y, w, h) {
    const gap = 18;
    const fixed = list.map(b => fixedH(P, S, b, w));
    const used = fixed.reduce((a, v) => a + (v || 0), 0) + gap * (list.length - 1);
    const wsum = list.reduce((a, b, i) => a + (fixed[i] ? 0 : (b.h || 1)), 0) || 1;
    const rest = Math.max(0, h - used);
    let yy = y;
    list.forEach((b, i) => { const bh = fixed[i] || rest * (b.h || 1) / wsum; block(P, S, b, x, yy, w, bh); yy += bh + gap; });
  }
  function fixedH(P, S, b, w) {
    if (b.fh) return b.fh;
    if (b.t === 'fields') return Math.ceil(b.items.length / (b.cols || 2)) * 36 + 4;
    if (b.t === 'rating') return (b.title ? 18 : 0) + Math.ceil(b.items.length / (b.cols || 2)) * 30 + 10;
    if (b.t === 'text') return 22 * b.lines;
    return 0;
  }
  function titled(P, S, b, x, y) { if (b.title) { cap(P, x, y + 8, b.title, { color: S.th.accent }); return 16; } return 0; }
  function block(P, S, b, x, y, w, h) {
    const th = S.th;
    if (b.t === 'row') {
      const gap = 16, ws = b.w || b.items.map(() => 1), tot = ws.reduce((a, v) => a + v, 0);
      let xx = x; b.items.forEach((it, i) => { const iw = (w - gap * (b.items.length - 1)) * ws[i] / tot; if (Array.isArray(it)) blocks(P, S, it, xx, y, iw, h); else block(P, S, it, xx, y, iw, h); xx += iw + gap; });
      return;
    }
    const t = titled(P, S, b, x, y); y += t; h -= t;
    switch (b.t) {
      case 'lines': box(P, x, y, w, h, th); lines(P, x + 14, y, w - 28, h, th, b.gap || 26); break;
      case 'dots': box(P, x, y, w, h, th); dots(P, x + 8, y + 8, w - 16, h - 16, th, 18); break;
      case 'grid': box(P, x, y, w, h, th); gridLines(P, x, y, w, h, th, 18); break;
      case 'blank': box(P, x, y, w, h, th); break;
      case 'check': { box(P, x, y, w, h, th); const c = b.cols || 1, cw = (w - 28) / c; for (let i = 0; i < c; i++) checks(P, x + 14 + i * cw, y + 6, cw - (c > 1 ? 16 : 0), h - 10, th); break; }
      case 'table': table(P, S, b, x, y, w, h); break;
      case 'fields': { const c = b.cols || 2, cw = (w - 20 * (c - 1)) / c; b.items.forEach((f, i) => { const fx = x + (i % c) * (cw + 20), fy = y + Math.floor(i / c) * 36; cap(P, fx, fy + 22, f, { color: th.soft, size: 7.2 }); const lw = P.measure(f.toUpperCase(), F.sansM, 7.2, 1.4) + 10; P.line(fx + lw, fy + 24, fx + cw, fy + 24, { color: th.line, sw: 0.8 }); }); break; }
      case 'boxes': { const c = b.cols || 2, n = b.items.length, r = Math.ceil(n / c), gx = 14, gy = 14; const bw = (w - gx * (c - 1)) / c, bh = (h - gy * (r - 1)) / r; b.items.forEach((it, i) => { const bx = x + (i % c) * (bw + gx), by = y + Math.floor(i / c) * (bh + gy); box(P, bx, by, bw, bh, th); cap(P, bx + 14, by + 22, it, { color: th.ink, size: 7.4 }); const iy = by + 30, ih = bh - 34; if (b.kind === 'check') checks(P, bx + 14, iy, bw - 28, ih, th, 26); else if (b.kind === 'lines') lines(P, bx + 14, iy - 4, bw - 28, ih, th, 26); else if (b.kind === 'dots') dots(P, bx + 8, iy, bw - 16, ih - 6, th, 18); }); break; }
      case 'tracker': tracker(P, S, b, x, y, w, h); break;
      case 'pixels': pixels(P, S, b, x, y, w, h); break;
      case 'hours': { box(P, x, y, w, h, th); const n = b.to - b.from, rh = h / n; for (let i = 0; i < n; i++) { const yy = y + i * rh; if (i) P.line(x, yy, x + w, yy, { color: th.line, sw: 0.8 }); P.text(hourLabel(b.from + i, S.o.clock), x + 12, yy + Math.min(16, rh / 2 + 3), { font: F.sansM, size: 7.4, color: th.soft }); } P.line(x + 62, y, x + 62, y + h, { color: th.line, sw: 0.8 }); break; }
      case 'weekgrid': { const days = b.days, lw = b.lw || 70, n = b.rows || 8, hh = 26; const cw = (w - lw) / days.length, rh = (h - hh) / n; P.rect(x, y, w, h, { r: 10, stroke: th.line, sw: 0.9 }); P.rect(x + 1, y + 1, w - 2, hh - 1, { fill: th.fill, r: 0 }); days.forEach((d, i) => { cap(P, x + lw + i * cw + 10, y + 17, d, { color: th.soft }); P.line(x + lw + i * cw, y, x + lw + i * cw, y + h, { color: th.line, sw: 0.8 }); }); cap(P, x + 10, y + 17, b.first || 'Time', { color: th.soft }); for (let r = 0; r < n; r++) P.line(x, y + hh + r * rh, x + w, y + hh + r * rh, { color: th.line, sw: 0.8 }); P.rect(x, y, w, h, { r: 10, stroke: th.line, sw: 0.9 }); break; }
      case 'months': { const c = S.g.land ? 4 : 3, r = 12 / c, gx = 12, gy = 12, bw = (w - gx * (c - 1)) / c, bh = (h - gy * (r - 1)) / r; MONTHS.forEach((mn, i) => { const bx = x + (i % c) * (bw + gx), by = y + Math.floor(i / c) * (bh + gy); box(P, bx, by, bw, bh, th); P.text(mn, bx + 12, by + 22, { font: F.serif, size: 14, color: th.ink }); lines(P, bx + 12, by + 26, bw - 24, bh - 28, th, 22); }); break; }
      case 'rating': { const c = b.cols || 2, cw = (w - 20 * (c - 1)) / c; b.items.forEach((it, i) => { const ix = x + (i % c) * (cw + 20), iy = y + Math.floor(i / c) * 30; P.text(it, ix, iy + 18, { font: F.sans, size: 11, color: th.ink }); stars(P, ix + cw - 5 * 19, iy + 4, 5, 7, th); P.line(ix, iy + 26, ix + cw, iy + 26, { color: th.lite, sw: 0.7 }); }); break; }
      case 'circles': { box(P, x, y, w, h, th); const n = b.n || 100, c = b.cols || 10, r = Math.ceil(n / c); const cw = (w - 20) / c, ch = (h - 20) / r, rad = Math.min(cw, ch) / 2 - 4; for (let i = 0; i < n; i++) { const cx = x + 10 + (i % c) * cw + cw / 2, cy = y + 10 + Math.floor(i / c) * ch + ch / 2; P.circle(cx, cy, rad, { stroke: th.line, sw: 0.8 }); if (b.label) P.text(String(b.label(i)), cx, cy + 3, { font: F.sans, size: Math.min(8, rad * 0.75), color: th.faint, align: 'center' }); } break; }
      case 'days31': { const c = 7, r = Math.ceil((b.n || 31) / c), gx = 8, gy = 8, bw = (w - gx * (c - 1)) / c, bh = (h - gy * (r - 1)) / r; for (let i = 0; i < (b.n || 31); i++) { const bx = x + (i % c) * (bw + gx), by = y + Math.floor(i / c) * (bh + gy); P.rect(bx, by, bw, bh, { r: 8, stroke: th.line, sw: 0.8 }); P.text(String(i + 1), bx + 8, by + 15, { font: F.sansM, size: 8, color: th.soft }); if (b.sub) cap(P, bx + 8, by + bh - 9, b.sub, { color: th.faint, size: 6 }); } break; }
      case 'cornell': box(P, x, y, w, h, th); noteBody(P, S, 'cornell', x + 10, y + 6, w - 20, h - 12, 1); break;
      case 'prompts': { const n = b.items.length, gy = 10, ph = (h - gy * (n - 1)) / n; b.items.forEach((it, i) => { const py = y + i * (ph + gy); P.text(it, x, py + 14, { font: F.serifI, size: 14, color: th.ink }); lines(P, x, py + 14, w, ph - 14, th, 26); }); break; }
      case 'text': b.text.forEach((l, i) => P.text(l, x, y + 14 + i * 20, { font: F.sans, size: 10.5, color: th.soft })); break;
    }
  }
  function table(P, S, b, x, y, w, h) {
    const th = S.th, hh = 26, rhh = b.rh || 28;
    const cols = b.cols, tot = cols.reduce((a, c) => a + (c[1] || 1), 0);
    const chk = b.check ? 26 : 0;
    const cw = cols.map(c => (w - chk) * (c[1] || 1) / tot);
    const n = Math.max(1, Math.floor((h - hh) / rhh)), realH = hh + n * rhh;
    P.rect(x, y, w, realH, { r: 10, stroke: th.line, sw: 0.9 });
    P.rect(x + 1, y + 1, w - 2, hh - 1, { fill: th.fill, r: 0 });
    let xx = x + chk;
    cols.forEach((c, i) => { if (i || chk) P.line(xx, y, xx, y + realH, { color: th.line, sw: 0.7 }); cap(P, xx + 9, y + 17, c[0], { color: th.soft, size: 7 }); xx += cw[i]; });
    for (let r = 0; r < n; r++) { const ry = y + hh + r * rhh; P.line(x, ry, x + w, ry, { color: r ? th.lite : th.line, sw: 0.8 }); if (chk) checkbox(P, x + 8, ry + rhh / 2 - 5.5, 11, th); }
    P.rect(x, y, w, realH, { r: 10, stroke: th.line, sw: 0.9 });
  }
  function tracker(P, S, b, x, y, w, h) {
    const th = S.th, nameW = b.nameW || 120, days = b.days || 31, hh = 22;
    const cw = (w - nameW) / days, rows = b.rows || Math.floor((h - hh) / 28), rh = (h - hh) / rows;
    for (let d = 1; d <= days; d++) P.text(String(d), x + nameW + (d - 1) * cw + cw / 2, y + 14, { font: F.sansM, size: 6.8, color: th.soft, align: 'center' });
    for (let r = 0; r < rows; r++) {
      const yy = y + hh + r * rh;
      if (b.labels && b.labels[r]) P.text(b.labels[r], x, yy + rh / 2 + 3.5, { font: F.sans, size: 10, color: th.ink });
      else P.line(x, yy + rh - 5, x + nameW - 12, yy + rh - 5, { color: th.lite, sw: 0.8 });
      const s = Math.min(cw - 3, rh - 8, 14);
      for (let d = 1; d <= days; d++) P.rect(x + nameW + (d - 1) * cw + (cw - s) / 2, yy + (rh - s) / 2, s, s, { r: 3, stroke: th.line, sw: 0.7 });
    }
  }
  function pixels(P, S, b, x, y, w, h) {
    const th = S.th, lw = 22, hh = 18, legendW = S.g.land ? 150 : 0, gw = w - legendW - (legendW ? 20 : 0);
    const cw = (gw - lw) / 12, rh = (h - hh - (legendW ? 0 : 50)) / 31, s = Math.min(cw - 4, rh - 3);
    MONTHS.forEach((m, i) => P.text(m[0], x + lw + i * cw + cw / 2, y + 12, { font: F.sansM, size: 7.4, color: th.soft, align: 'center' }));
    for (let d = 0; d < 31; d++) {
      P.text(String(d + 1), x + lw - 6, y + hh + d * rh + rh / 2 + 3, { font: F.sans, size: 6.8, color: th.faint, align: 'right' });
      for (let i = 0; i < 12; i++) { if (d >= dim(2028, i)) continue; P.rect(x + lw + i * cw + (cw - s) / 2, y + hh + d * rh + (rh - s) / 2, s, s, { r: 2.5, stroke: th.line, sw: 0.7 }); }
    }
    const lx = legendW ? x + gw + 20 : x, ly = legendW ? y + 10 : y + h - 30;
    (b.legend || []).forEach((l, i) => { const ix = legendW ? lx : lx + i * (w / b.legend.length), iy = legendW ? ly + i * 30 : ly; P.rect(ix, iy, 14, 14, { r: 3, stroke: th.line, sw: 0.8 }); P.text(l, ix + 22, iy + 11, { font: F.sans, size: 10, color: th.ink }); });
  }

  // ---------- templates (data) ----------
  const CATS = ['Productivity', 'Student', 'Finance', 'Wellness', 'Lifestyle', 'Work & business', 'Family & home'];
  const D7 = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
  const T = (id, cat, name, fn) => ({ id, cat, name, blocks: fn });
  const TEMPLATES = [
    // Productivity
    T('todo', 'Productivity', 'To-do list', g => [{ t: 'check', cols: g.land ? 3 : 2 }]),
    T('matrix', 'Productivity', 'Priority matrix', g => [{ t: 'boxes', items: ['Urgent & important', 'Important, not urgent', 'Urgent, not important', 'Neither'], cols: 2, kind: 'check' }]),
    T('project', 'Productivity', 'Project planner', g => [{ t: 'fields', items: ['Project', 'Deadline', 'Goal', 'Status'] }, { t: 'table', title: 'Tasks', cols: [['Task', 4], ['Owner', 1.4], ['Due', 1.2], ['Status', 1.2]], check: true, h: 3 }, { t: 'lines', title: 'Notes', h: 1 }]),
    T('goal', 'Productivity', 'Goal planner', g => [{ t: 'fields', items: ['Goal', 'Deadline', 'Why it matters', 'Reward'] }, { t: 'table', title: 'Action steps', cols: [['Step', 4], ['By when', 1.3]], check: true, h: 2 }, { t: 'row', items: [{ t: 'lines', title: 'Possible obstacles' }, { t: 'lines', title: 'How I will handle them' }], h: 1 }]),
    T('timeblock', 'Productivity', 'Time blocking', g => [{ t: 'fields', items: ['Date', 'Main focus'] }, { t: 'row', w: [3, 2], items: [{ t: 'hours', title: 'Blocks', from: 6, to: 22 }, [{ t: 'check', title: 'Must do', h: 1 }, { t: 'lines', title: 'Notes', h: 1 }]] }]),
    T('braindump', 'Productivity', 'Brain dump', g => [{ t: 'dots', title: 'Everything on my mind', h: 3 }, { t: 'row', items: [{ t: 'check', title: 'Do now' }, { t: 'check', title: 'Do later' }, { t: 'check', title: 'Let go' }], h: 1.2 }]),
    T('weeklyreview', 'Productivity', 'Weekly review', g => [{ t: 'fields', items: ['Week of', 'Energy (1-10)'] }, { t: 'boxes', items: ['Wins', 'What did not work', 'Lessons', 'Still open', 'Next week focus', 'Grateful for'], cols: g.land ? 3 : 2, kind: 'lines' }]),
    T('meeting', 'Productivity', 'Meeting notes', g => [{ t: 'fields', items: ['Meeting', 'Date', 'With', 'Time'] }, { t: 'lines', title: 'Notes', h: 2.4 }, { t: 'table', title: 'Action items', cols: [['Action', 4], ['Who', 1.4], ['Due', 1.2]], check: true, h: 1.2 }]),
    T('routine', 'Productivity', 'Daily routines', g => [{ t: 'row', items: [{ t: 'check', title: 'Morning routine' }, { t: 'check', title: 'Evening routine' }], h: 2 }, { t: 'row', items: [{ t: 'check', title: 'Work start' }, { t: 'check', title: 'Work shutdown' }], h: 1 }]),
    T('habit', 'Productivity', 'Habit tracker', g => [{ t: 'fields', items: ['Month', 'Goal'] }, { t: 'tracker', nameW: g.land ? 160 : 120 }]),
    T('focus', 'Productivity', 'Focus sessions', g => [{ t: 'table', cols: [['Date', 1.1], ['Task', 3], ['Start', 0.9], ['End', 0.9], ['Done?', 0.8]] }]),
    T('ideas', 'Productivity', 'Ideas list', g => [{ t: 'table', cols: [['Idea', 4], ['Category', 1.4], ['Next step', 2]], check: true }]),
    // Student
    T('class', 'Student', 'Class schedule', g => [{ t: 'fields', items: ['Semester', 'School'] }, { t: 'weekgrid', days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], rows: 9, h: 3 }, { t: 'table', title: 'Courses', cols: [['Course', 3], ['Teacher', 2], ['Room', 1], ['Email', 2.4]], h: 1.2 }]),
    T('assign', 'Student', 'Assignment tracker', g => [{ t: 'table', cols: [['Assignment', 3.6], ['Class', 1.5], ['Due', 1.1], ['Grade', 0.9]], check: true }]),
    T('exam', 'Student', 'Exam planner', g => [{ t: 'table', title: 'Exams', cols: [['Subject', 2.4], ['Date', 1.1], ['Time', 0.9], ['Room', 1], ['Topics', 2.6]], h: 1.2 }, { t: 'weekgrid', title: 'Study plan', days: D7, rows: 5, first: 'Week', h: 1.6 }]),
    T('study', 'Student', 'Study planner', g => [{ t: 'fields', items: ['Subject', 'Exam date', 'Goal grade', 'Hours / week'] }, { t: 'table', title: 'Topics to cover', cols: [['Topic', 4], ['Review 1', 1], ['Review 2', 1], ['Ready', 1]], check: true, h: 2 }, { t: 'lines', title: 'Questions to ask', h: 1 }]),
    T('course', 'Student', 'Course overview', g => [{ t: 'fields', items: ['Course', 'Teacher', 'Office hours', 'Email', 'Textbook', 'Credits'] }, { t: 'table', title: 'Grades', cols: [['Item', 3], ['Weight', 1], ['Score', 1], ['Grade', 1]], h: 1.4 }, { t: 'lines', title: 'Notes', h: 1 }]),
    T('grades', 'Student', 'Grade tracker', g => [{ t: 'table', cols: [['Course', 3], ['Test 1', 1], ['Test 2', 1], ['Project', 1], ['Final', 1], ['Grade', 1]] }]),
    T('lecture', 'Student', 'Lecture notes', g => [{ t: 'fields', items: ['Topic', 'Date'] }, { t: 'cornell' }]),
    T('reading', 'Student', 'Reading notes', g => [{ t: 'fields', items: ['Title', 'Author', 'Chapter', 'Pages'] }, { t: 'lines', title: 'Key ideas', h: 2 }, { t: 'row', items: [{ t: 'lines', title: 'Quotes' }, { t: 'lines', title: 'My thoughts' }], h: 1.2 }]),
    T('semester', 'Student', 'Semester goals', g => [{ t: 'boxes', items: ['Grades', 'Study habits', 'Activities', 'Friends', 'Health', 'Money'], cols: g.land ? 3 : 2, kind: 'check' }]),
    T('studylog', 'Student', 'Study log', g => [{ t: 'table', cols: [['Date', 1.1], ['Subject', 2], ['What I studied', 3], ['Time', 0.9]] }]),
    // Finance
    T('budget', 'Finance', 'Monthly budget', g => [{ t: 'fields', items: ['Month', 'Total income', 'Total expenses', 'Left over'] }, { t: 'row', items: [{ t: 'table', title: 'Income', cols: [['Source', 2.4], ['Planned', 1], ['Actual', 1]] }, { t: 'table', title: 'Savings', cols: [['Goal', 2.4], ['Planned', 1], ['Actual', 1]] }], h: 1 }, { t: 'table', title: 'Expenses', cols: [['Category', 2.6], ['Planned', 1], ['Actual', 1], ['Difference', 1.1]], h: 2 }]),
    T('expenses', 'Finance', 'Expense tracker', g => [{ t: 'fields', items: ['Month', 'Budget'] }, { t: 'table', cols: [['Date', 1], ['Description', 3], ['Category', 1.6], ['Amount', 1.1]] }]),
    T('bills', 'Finance', 'Bill tracker', g => [{ t: 'table', cols: [['Bill', 2.6], ['Due day', 1], ['Amount', 1.1], ...(g.land ? [['Jan', 0.55], ['Feb', 0.55], ['Mar', 0.55], ['Apr', 0.55], ['May', 0.55], ['Jun', 0.55], ['Jul', 0.55], ['Aug', 0.55], ['Sep', 0.55], ['Oct', 0.55], ['Nov', 0.55], ['Dec', 0.55]] : [['Auto pay', 1], ['Paid', 0.8]])] }]),
    T('income', 'Finance', 'Income tracker', g => [{ t: 'fields', items: ['Year', 'Goal'] }, { t: 'table', cols: [['Date', 1], ['Source', 3], ['Amount', 1.2], ['Notes', 2]] }]),
    T('savings', 'Finance', 'Savings goal', g => [{ t: 'fields', items: ['Saving for', 'Goal amount', 'Start date', 'Target date'] }, { t: 'circles', title: 'Colour in a circle for each step', n: 100, cols: 10, label: i => i + 1, h: 2 }, { t: 'lines', title: 'Notes', h: 0.6 }]),
    T('debt', 'Finance', 'Debt payoff', g => [{ t: 'fields', items: ['Debt', 'Total amount', 'Interest rate', 'Min. payment'] }, { t: 'table', title: 'Payments', cols: [['Date', 1], ['Payment', 1], ['Interest', 1], ['Balance', 1.2]], h: 2 }, { t: 'circles', title: 'Progress', n: 20, cols: 10, label: i => (i + 1) * 5 + '%', h: 0.7 }]),
    T('subs', 'Finance', 'Subscriptions', g => [{ t: 'table', cols: [['Service', 2.6], ['Cost', 1], ['Billing', 1.1], ['Renews', 1.1], ['Keep?', 0.8]] }]),
    T('sinking', 'Finance', 'Sinking funds', g => [{ t: 'boxes', items: ['Fund 1', 'Fund 2', 'Fund 3', 'Fund 4', 'Fund 5', 'Fund 6'], cols: g.land ? 3 : 2, kind: 'lines' }]),
    T('nospend', 'Finance', 'No-spend challenge', g => [{ t: 'fields', items: ['Month', 'Reward'] }, { t: 'days31', sub: 'no spend', h: 2 }, { t: 'lines', title: 'What I wanted to buy', h: 0.8 }]),
    T('annualfin', 'Finance', 'Year in money', g => [{ t: 'table', cols: [['Month', 1.3], ['Income', 1], ['Expenses', 1], ['Saved', 1], ['Debt paid', 1], ['Notes', 1.8]], rh: 40 }]),
    // Wellness
    T('mood', 'Wellness', 'Mood tracker', g => [{ t: 'pixels', legend: ['Amazing', 'Good', 'Okay', 'Low', 'Hard day'] }]),
    T('sleep', 'Wellness', 'Sleep log', g => [{ t: 'table', cols: [['Date', 1], ['Bedtime', 1], ['Wake up', 1], ['Hours', 0.8], ['Quality', 1], ['Notes', 2]] }]),
    T('water', 'Wellness', 'Water tracker', g => [{ t: 'fields', items: ['Month', 'Daily goal'] }, { t: 'tracker', labels: Array.from({ length: 8 }, (_, i) => 'Glass ' + (i + 1)), rows: 8, nameW: 90 }]),
    T('workout', 'Wellness', 'Workout log', g => [{ t: 'table', cols: [['Date', 1], ['Workout', 2.4], ['Sets x reps', 1.3], ['Weight', 1], ['Time', 0.9]] }]),
    T('fitness', 'Wellness', 'Fitness plan', g => [{ t: 'fields', items: ['Goal', 'Start date'] }, { t: 'boxes', items: D7, cols: g.land ? 4 : 2, kind: 'lines' }]),
    T('selfcare', 'Wellness', 'Self-care menu', g => [{ t: 'boxes', items: ['5 minutes', '30 minutes', 'An hour', 'Half a day', 'For my body', 'For my mind'], cols: g.land ? 3 : 2, kind: 'check' }]),
    T('gratitude', 'Wellness', 'Gratitude journal', g => [{ t: 'boxes', items: D7.concat(['This week I felt']), cols: g.land ? 4 : 2, kind: 'lines' }]),
    T('prompts', 'Wellness', 'Journal prompts', g => [{ t: 'prompts', items: ['What made me smile today?', 'What is taking up space in my mind?', 'What do I need more of this week?', 'What am I proud of?', 'One thing I can let go of:'] }]),
    T('vitamins', 'Wellness', 'Vitamins & supplements', g => [{ t: 'table', title: 'What I take', cols: [['Name', 2.4], ['Dose', 1], ['Time', 1], ['Notes', 2]], h: 1 }, { t: 'tracker', title: 'Daily check', rows: 6, h: 1.3, nameW: g.land ? 150 : 110 }]),
    T('cycle', 'Wellness', 'Cycle tracker', g => [{ t: 'pixels', legend: ['Period', 'Light', 'Spotting', 'PMS', 'Ovulation'] }]),
    T('energy', 'Wellness', 'Energy tracker', g => [{ t: 'fields', items: ['Month', 'Notes'] }, { t: 'tracker', labels: ['High energy', 'Steady', 'Low energy', 'Exercise', 'Slept 7h+', 'Ate well', 'Time outside', 'Screen-free hour'], rows: 8, nameW: g.land ? 150 : 120 }]),
    T('reset', 'Wellness', 'Weekly reset', g => [{ t: 'row', items: [{ t: 'check', title: 'Home' }, { t: 'check', title: 'Me' }], h: 1.4 }, { t: 'row', items: [{ t: 'check', title: 'Plan' }, { t: 'lines', title: 'Intention for the week' }], h: 1 }]),
    // Lifestyle
    T('recipe', 'Lifestyle', 'Recipe', g => [{ t: 'fields', items: ['Recipe', 'Serves', 'Prep time', 'Cook time'] }, { t: 'row', w: [1, 1.6], items: [{ t: 'check', title: 'Ingredients' }, { t: 'lines', title: 'Method' }], h: 2 }, { t: 'lines', title: 'Notes', h: 0.5 }]),
    T('grocery', 'Lifestyle', 'Grocery list', g => [{ t: 'boxes', items: ['Fruit & veg', 'Meat & fish', 'Dairy', 'Bakery', 'Pantry', 'Frozen', 'Household', 'Other'], cols: g.land ? 4 : 2, kind: 'check' }]),
    T('travel', 'Lifestyle', 'Travel planner', g => [{ t: 'fields', items: ['Destination', 'Dates', 'Stay', 'Budget'] }, { t: 'row', items: [{ t: 'lines', title: 'Places to see' }, { t: 'lines', title: 'Food to try' }], h: 1 }, { t: 'table', title: 'Itinerary', cols: [['Day', 1], ['Plan', 4], ['Booked', 1]], h: 1.4 }]),
    T('packing', 'Lifestyle', 'Packing list', g => [{ t: 'boxes', items: ['Clothes', 'Toiletries', 'Tech', 'Documents', 'Bag', 'Last minute'], cols: g.land ? 3 : 2, kind: 'check' }]),
    T('cleaning', 'Lifestyle', 'Cleaning schedule', g => [{ t: 'boxes', items: ['Daily', 'Weekly', 'Monthly', 'Seasonal'], cols: 2, kind: 'check' }]),
    T('gifts', 'Lifestyle', 'Gift planner', g => [{ t: 'table', cols: [['Person', 2], ['Occasion', 1.4], ['Gift idea', 2.6], ['Budget', 1], ['Bought', 0.8]] }]),
    T('birthdays', 'Lifestyle', 'Birthdays & dates', g => [{ t: 'months' }]),
    T('books', 'Lifestyle', 'Reading log', g => [{ t: 'table', cols: [['Title', 3], ['Author', 2], ['Started', 1], ['Finished', 1], ['Rating', 1]] }]),
    T('watch', 'Lifestyle', 'Watch list', g => [{ t: 'table', cols: [['Title', 3.4], ['Movie / show', 1.4], ['Where', 1.3], ['Rating', 1]], check: true }]),
    T('wish', 'Lifestyle', 'Wish list', g => [{ t: 'table', cols: [['Item', 3.4], ['Store / link', 2], ['Price', 1]], check: true }]),
    T('bucket', 'Lifestyle', 'Bucket list', g => [{ t: 'check', cols: g.land ? 3 : 2 }]),
    T('contacts', 'Lifestyle', 'Important contacts', g => [{ t: 'table', cols: [['Name', 2], ['Phone', 1.6], ['Email', 2.2], ['Notes', 1.6]], rh: 34 }]),
    // Work & business
    T('clients', 'Work & business', 'Client tracker', g => [{ t: 'table', cols: [['Client', 2.2], ['Contact', 2], ['Project', 2], ['Due', 1], ['Paid', 0.8]], rh: 32 }]),
    T('orders', 'Work & business', 'Order tracker', g => [{ t: 'table', cols: [['Date', 1], ['Order #', 1.1], ['Customer', 2], ['Item', 2], ['Total', 1], ['Sent', 0.8]] }]),
    T('content', 'Work & business', 'Content calendar', g => [{ t: 'fields', items: ['Month', 'Theme'] }, { t: 'table', cols: [['Date', 1], ['Platform', 1.3], ['Post idea', 3.4], ['Status', 1.1]], check: true }]),
    T('social', 'Work & business', 'Social media planner', g => [{ t: 'fields', items: ['Week of', 'Goal'] }, { t: 'weekgrid', days: D7, rows: 5, first: 'Platform', lw: 86 }]),
    T('bizgoals', 'Work & business', 'Business goals', g => [{ t: 'fields', items: ['Year', 'Revenue goal'] }, { t: 'boxes', items: ['Quarter 1', 'Quarter 2', 'Quarter 3', 'Quarter 4'], cols: 2, kind: 'check' }]),
    T('invoices', 'Work & business', 'Invoice log', g => [{ t: 'table', cols: [['Invoice #', 1.2], ['Client', 2.2], ['Sent', 1], ['Due', 1], ['Amount', 1.1], ['Paid', 0.8]] }]),
    T('mileage', 'Work & business', 'Mileage log', g => [{ t: 'table', cols: [['Date', 1], ['From', 1.8], ['To', 1.8], ['Purpose', 2], ['Miles / km', 1]] }]),
    T('productideas', 'Work & business', 'Product ideas', g => [{ t: 'boxes', items: ['Idea', 'Idea', 'Idea', 'Idea'], cols: 2, kind: 'lines' }]),
    // Family & home
    T('chores', 'Family & home', 'Chore chart', g => [{ t: 'fields', items: ['Week of', 'Reward'] }, { t: 'weekgrid', days: D7, rows: 10, first: 'Chore', lw: 110 }]),
    T('family', 'Family & home', 'Family meeting', g => [{ t: 'fields', items: ['Date', 'Who'] }, { t: 'row', items: [{ t: 'lines', title: 'Wins this week' }, { t: 'lines', title: 'Coming up' }], h: 1 }, { t: 'row', items: [{ t: 'check', title: 'Decisions' }, { t: 'lines', title: 'Fun plan' }], h: 1 }]),
    T('kids', 'Family & home', 'Kids activities', g => [{ t: 'weekgrid', days: D7, rows: 8, first: 'Child', lw: 90, h: 2 }, { t: 'table', title: 'Pick-ups & contacts', cols: [['Activity', 2], ['Where', 2], ['Contact', 2], ['Phone', 1.4]], h: 1 }]),
    T('mealideas', 'Family & home', 'Meal ideas', g => [{ t: 'boxes', items: ['Quick dinners', 'Family favourites', 'Breakfasts', 'Lunch box', 'Snacks', 'Want to try'], cols: g.land ? 3 : 2, kind: 'check' }]),
    T('sitter', 'Family & home', 'Babysitter info', g => [{ t: 'fields', items: ['Address', 'Wi-Fi', 'Parent 1', 'Parent 2', 'Doctor', 'Emergency'], cols: 2 }, { t: 'row', items: [{ t: 'lines', title: 'Routine & bedtime' }, { t: 'lines', title: 'Allergies & notes' }], h: 1 }]),
    T('pets', 'Family & home', 'Pet care', g => [{ t: 'fields', items: ['Name', 'Vet', 'Food', 'Birthday'] }, { t: 'table', title: 'Care log', cols: [['Date', 1], ['Vaccine / visit', 3], ['Next due', 1.2]], h: 1 }, { t: 'tracker', title: 'Daily care', labels: ['Fed AM', 'Fed PM', 'Walk', 'Meds'], rows: 4, nameW: 90, h: 0.8 }]),
    T('datenight', 'Family & home', 'Date night ideas', g => [{ t: 'boxes', items: ['At home', 'Going out', 'Adventures', 'Free & cheap'], cols: 2, kind: 'check' }]),
    T('maintenance', 'Family & home', 'Home maintenance', g => [{ t: 'table', cols: [['Task', 3], ['How often', 1.3], ['Last done', 1.2], ['Next', 1.2]], check: true }])
  ];
  const NOTES = [{ id: 'lined', name: 'Lined' }, { id: 'grid', name: 'Grid' }, { id: 'dotted', name: 'Dotted' }, { id: 'blank', name: 'Blank' }, { id: 'cornell', name: 'Cornell' }, { id: 'twocol', name: 'Two column' }];

  // ---------- stickers (inside the PDF + PNG pack) ----------
  const STK = {
    sticky: ['#F2E6C9', '#E9D4CC', '#DCE3D3', '#D6E0E6', '#E6DCEB', '#EFE9E1'],
    ink: '#2F2B27',
    tone: ['#A08066', '#8F9E86', '#C49A8E', '#7F93A3', '#B4A2C0', '#D4B48E']
  };
  const WORDS = ['to do', 'important', 'meeting', 'appointment', 'deadline', 'birthday', 'pay day', 'bills due', 'self-care', 'workout', 'travel', "don't forget", 'done!', 'family', 'date night', 'call', 'errands', 'school', 'doctor', 'dentist', 'rest day', 'party', 'groceries', 'laundry', 'cleaning', 'work', 'focus', 'vacation', 'holiday', 'reminder'];
  const QUOTES = ['one thing at a time', "you've got this", 'slow progress is still progress', 'rest is part of the plan', 'keep it simple', 'today counts', 'small steps, big year', 'breathe', 'start where you are', 'done is better than perfect', 'be kind to yourself', 'progress, not perfection', 'make it a good day', 'you are doing enough', 'tiny wins matter', 'fresh start', 'just begin', 'protect your peace', 'trust the process', 'one day or day one'];
  const W7 = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
  const SMILE = { happy: 'M0 0 Q8 7 16 0', ok: 'M0 3 L16 3', sad: 'M0 6 Q8 -1 16 6', wow: null, calm: 'M2 1 Q8 4 14 1' };
  function stickerGroups(P) {
    const G = [];
    const it = (w, h, draw) => ({ w, h, draw });
    // page 1
    G.push({ page: 1, title: 'Sticky notes', items: STK.sticky.map(c => it(112, 112, (P, x, y) => { P.rect(x, y, 112, 112, { fill: c }); P.rect(x, y + 102, 112, 10, { fill: '#000000', opacity: 0.04 }); }))
      .concat(STK.sticky.map((c, i) => it(112, 112, (P, x, y) => { P.rect(x, y, 112, 112, { r: 6, fill: c }); P.rect(x, y, 112, 20, { r: 0, fill: STK.tone[i], opacity: 0.35 }); for (let k = 0; k < 4; k++) P.line(x + 12, y + 44 + k * 18, x + 100, y + 44 + k * 18, { color: STK.tone[i], sw: 0.7, opacity: 0.6 }); }))) });
    G.push({ page: 1, title: 'Labels', items: WORDS.map((w, i) => { const tw = P.measure(w.toUpperCase(), F.sansM, 8, 1.2) + 28; return it(tw, 26, (P, x, y) => { P.rect(x, y, tw, 26, { r: 13, fill: STK.tone[i % 6] }); P.text(w.toUpperCase(), x + 14, y + 16.5, { font: F.sansM, size: 8, color: '#FFFFFF', spacing: 1.2 }); }); }) });
    // page 2
    G.push({ page: 2, title: 'Handwritten labels', items: WORDS.map((w, i) => { const tw = P.measure(w, F.serifI, 15) + 26; return it(tw, 30, (P, x, y) => { P.rect(x, y, tw, 30, { r: 6, stroke: STK.tone[i % 6], sw: 1.2, fill: '#FFFFFF' }); P.text(w, x + 13, y + 20, { font: F.serifI, size: 15, color: STK.ink }); }); }) });
    G.push({ page: 2, title: 'Day tabs', items: W7.map((d, i) => it(96, 30, (P, x, y) => { P.rect(x, y, 96, 30, { r: 8, fill: STK.sticky[i % 6] }); P.rect(x, y, 8, 30, { r: 0, fill: STK.tone[i % 6] }); P.text(d.toUpperCase(), x + 52, y + 19, { font: F.sansM, size: 7.6, color: STK.ink, align: 'center', spacing: 1.1 }); })) });
    G.push({ page: 2, title: 'Month banners', items: MONTHS.map((m, i) => it(206, 36, (P, x, y) => { P.rect(x, y, 206, 36, { fill: mix(STK.tone[i % 6], '#FFFFFF', 0.5) }); for (let j = 10; j < 206; j += 18) P.line(x + j, y, x + j - 9, y + 36, { color: '#FFFFFF', sw: 2, opacity: 0.3 }); P.text(m, x + 103, y + 25, { font: F.serif, size: 20, color: STK.ink, align: 'center' }); })) });
    // page 3
    G.push({ page: 3, title: 'Little shapes', items: [].concat(
      STK.tone.concat(STK.sticky.slice(0, 6)).map((c, i) => it(34, 32, (P, x, y) => P.path(HEART, x, y - 1, 34 / 24, { fill: i < 6 ? c : STK.tone[i - 6], opacity: i < 6 ? 1 : 0.6 }))),
      STK.tone.concat(STK.tone).map((c, i) => it(34, 34, (P, x, y) => P.path(starPath(17), x, y, 1, i < 6 ? { fill: c } : { stroke: c, sw: 1.6 }))),
      STK.tone.map((c, i) => it(36, 36, (P, x, y) => { P.circle(x + 18, y + 18, 18, { fill: STK.sticky[i] }); P.path('M0 8 L7 15 L20 0', x + 8, y + 10, 1, { stroke: c, sw: 2.6 }); })),
      STK.tone.slice(0, 4).map((c, i) => it(72, 22, (P, x, y) => P.path('M0 10 C20 0 50 0 70 10 M60 2 L70 10 L60 18', x + 1, y + 2, 1, { stroke: c, sw: 2 })))
    ) });
    G.push({ page: 3, title: 'Moods', items: ['happy', 'calm', 'ok', 'sad', 'wow'].map((m, i) => it(46, 46, (P, x, y) => { P.circle(x + 23, y + 23, 23, { fill: STK.sticky[i] }); P.circle(x + 16, y + 19, 2.4, { fill: STK.ink }); P.circle(x + 30, y + 19, 2.4, { fill: STK.ink }); if (SMILE[m]) P.path(SMILE[m], x + 15, y + 28, 1, { stroke: STK.ink, sw: 1.6 }); else P.circle(x + 23, y + 31, 4, { stroke: STK.ink, sw: 1.6 }); })) });
    G.push({ page: 3, title: 'Weather', items: ['sun', 'cloud', 'partly', 'rain', 'snow', 'storm'].map(ic => it(60, 52, (P, x, y) => weather(P, ic, x + 30, y + 24))) });
    G.push({ page: 3, title: 'Dates', items: Array.from({ length: 31 }, (_, i) => it(34, 34, (P, x, y) => { P.circle(x + 17, y + 17, 17, { fill: STK.sticky[i % 6] }); P.text(String(i + 1), x + 17, y + 22, { font: F.serif, size: 16, color: STK.ink, align: 'center' }); })) });
    // page 4
    G.push({ page: 4, title: 'Washi tape', items: Array.from({ length: 12 }, (_, i) => it(230, 24, (P, x, y) => washi(P, x, y, 230, 24, STK.tone[i % 6], Math.floor(i / 6)))) });
    G.push({ page: 4, title: 'Highlights', items: [].concat(
      STK.tone.slice(0, 4).map(c => it(120, 50, (P, x, y) => P.ellipse(x + 60, y + 25, 58, 23, { stroke: c, sw: 2 }))),
      STK.tone.slice(2, 6).map(c => it(212, 16, (P, x, y) => P.path('M0 6 C40 0 90 12 140 4 C170 0 190 8 210 6', x + 1, y + 3, 1, { stroke: c, sw: 3 }))),
      STK.tone.slice(0, 4).map(c => it(200, 22, (P, x, y) => P.rect(x, y, 200, 22, { r: 3, fill: c, opacity: 0.35 })))
    ) });
    G.push({ page: 4, title: 'Progress', items: [25, 50, 75, 100].map((p, i) => it(220, 30, (P, x, y) => { P.rect(x, y + 8, 180, 14, { r: 7, fill: STK.sticky[i] }); P.rect(x, y + 8, 180 * p / 100, 14, { r: 7, fill: STK.tone[i] }); P.text(p + '%', x + 188, y + 19, { font: F.sansM, size: 9, color: STK.ink }); })) });
    G.push({ page: 4, title: 'Reminders', items: ['Appointment', 'Bills due', 'Birthday', 'Deadline'].map((t, i) => it(210, 76, (P, x, y) => { P.rect(x, y, 210, 76, { r: 12, fill: STK.sticky[i] }); P.text(t.toUpperCase(), x + 14, y + 22, { font: F.sansM, size: 7.6, color: STK.tone[i], spacing: 1.4 }); P.text('What', x + 14, y + 44, { font: F.sans, size: 8, color: STK.ink, opacity: 0.6 }); P.line(x + 46, y + 46, x + 196, y + 46, { color: STK.tone[i], sw: 0.7 }); P.text('When', x + 14, y + 64, { font: F.sans, size: 8, color: STK.ink, opacity: 0.6 }); P.line(x + 46, y + 66, x + 196, y + 66, { color: STK.tone[i], sw: 0.7 }); })) });
    // page 5
    G.push({ page: 5, title: 'Date widgets', items: W7.map((d, i) => it(104, 112, (P, x, y) => { P.rect(x, y, 104, 112, { r: 16, fill: STK.sticky[i % 6] }); P.text(d.slice(0, 3).toUpperCase(), x + 14, y + 24, { font: F.sansM, size: 8, color: STK.tone[i % 6], spacing: 1.4 }); P.line(x + 14, y + 86, x + 90, y + 86, { color: STK.tone[i % 6], sw: 0.8 }); P.text('date', x + 14, y + 100, { font: F.serifI, size: 11, color: STK.ink, opacity: 0.55 }); })) });
    G.push({ page: 5, title: 'Little notes to self', items: QUOTES.map((q, i) => { const tw = P.measure(q, F.serifI, 18) + 36; return it(tw, 44, (P, x, y) => { P.rect(x, y, tw, 44, { r: 10, fill: STK.sticky[i % 6] }); P.text(q, x + 18, y + 28, { font: F.serifI, size: 18, color: STK.ink }); }); }) });
    return G;
  }
  function weather(P, ic, cx, cy) {
    const sunC = '#E5C098', cl = '#C9D7DF';
    const sun = (x, y, r) => { P.circle(x, y, r, { fill: sunC }); for (let a = 0; a < 8; a++) { const an = a * Math.PI / 4; P.line(x + Math.cos(an) * (r + 5), y + Math.sin(an) * (r + 5), x + Math.cos(an) * (r + 11), y + Math.sin(an) * (r + 11), { color: sunC, sw: 2 }); } };
    const cloud = (x, y) => { P.circle(x - 8, y + 2, 10, { fill: cl }); P.circle(x + 4, y - 4, 13, { fill: cl }); P.circle(x + 14, y + 4, 9, { fill: cl }); P.rect(x - 18, y + 2, 40, 11, { fill: cl }); };
    if (ic === 'sun') sun(cx, cy, 12);
    else if (ic === 'partly') { sun(cx - 8, cy - 6, 9); cloud(cx + 4, cy + 4); }
    else { cloud(cx, cy); if (ic === 'rain') for (let r = 0; r < 3; r++) P.line(cx - 8 + r * 10, cy + 18, cx - 11 + r * 10, cy + 26, { color: '#7594A7', sw: 2 }); if (ic === 'snow') for (let r = 0; r < 3; r++) P.circle(cx - 8 + r * 10, cy + 22, 2.5, { fill: '#90AABA' }); if (ic === 'storm') P.path('M6 0 L0 10 L5 10 L1 20 L12 7 L7 7 L10 0 Z', cx - 3, cy + 14, 1, { fill: '#D4B48E' }); }
  }
  function washi(P, x, y, w, h, c, kind) {
    P.rect(x, y, w, h, { fill: mix(c, '#FFFFFF', 0.45) });
    if (kind === 0) for (let j = 8; j < w; j += 16) P.line(x + j, y, x + j - 8, y + h, { color: '#FFFFFF', sw: 2, opacity: 0.35 });
    else for (let j = 8; j < w; j += 14) P.circle(x + j, y + h / 2, 2.2, { fill: '#FFFFFF', opacity: 0.6 });
  }
  const STICKER_PAGES = 5;
  function pStickers(P, S, pg) {
    const { g, th } = S; const k = pg.k;
    frame(P, S, { crumbs: [['Home', 'home'], ['Stickers'], ['Page ' + k]] }, {});
    header(P, S, 'Copy & paste with the lasso tool', 'Stickers');
    subnav(P, S, Array.from({ length: STICKER_PAGES }, (_, i) => [String(i + 1), 'stk-' + (i + 1)]), k - 1);
    let y = g.Y0 + 132;
    const groups = stickerGroups(P).filter(gr => gr.page === k);
    const gap = g.land ? 10 : 14;
    groups.forEach(gr => {
      cap(P, g.X0, y, gr.title, { color: th.soft }); y += 14;
      let x = g.X0, rowH = 0;
      gr.items.forEach(s => { if (x + s.w > g.X1) { x = g.X0; y += rowH + gap; rowH = 0; } s.draw(P, x, y); x += s.w + gap; rowH = Math.max(rowH, s.h); });
      y += rowH + (g.land ? 22 : 30);
    });
  }
  function stickerList(P) { const out = []; stickerGroups(P).forEach(gr => gr.items.forEach((s, i) => out.push(Object.assign({ group: gr.title, i }, s)))); return out; }

  // ---------- covers ----------
  const COVER_PALS = [
    { name: 'Sand', bg: '#F3EDE4', a: '#DCC8AF', b: '#B39374', c: '#6E5646', d: '#E8DACA', ink: '#3A2F28' },
    { name: 'Sage', bg: '#EEF0E8', a: '#CBD4BF', b: '#95A485', c: '#5D6B52', d: '#DEE4D5', ink: '#2F3529' },
    { name: 'Blush', bg: '#F7EDEA', a: '#EACCC3', b: '#CB9788', c: '#8B5B50', d: '#F1DED8', ink: '#3B2B27' }
  ];
  const DESIGNS = ['arches', 'blobs', 'checker', 'gingham', 'waves', 'florals', 'hearts', 'sunset', 'frame', 'dots', 'leaves', 'bigtype'];
  const COVERS = []; DESIGNS.forEach(d => COVER_PALS.forEach(p => COVERS.push({ d, p })));
  function COVER_COUNT() { return COVERS.length; }
  function coverTitle(P, S, pal, cx, cy, card) {
    const big = S.sameYear && S.o.startMonth === 0 ? S.yearLabel : S.yearLabel;
    const W = S.g.W;
    const sz = Math.min(W * 0.2, 150);
    if (card) { const cw = Math.max(P.measure(big, F.serif, sz) + 120, 380), ch = sz + 150 + (S.o.name ? 34 : 0); P.rect(cx - cw / 2, cy - ch / 2, cw, ch, { r: 24, fill: pal.bg }); P.rect(cx - cw / 2 + 10, cy - ch / 2 + 10, cw - 20, ch - 20, { r: 18, stroke: pal.a, sw: 1.2 }); }
    const off = S.o.name ? 16 : 0;
    P.text('THE FRESH START PLANNER', cx, cy - sz * 0.45 - 6 - off, { font: F.sansM, size: 9, color: pal.c, align: 'center', spacing: 2.6 });
    P.text(big, cx, cy + sz * 0.32 - off, { font: F.serif, size: sz, color: pal.ink, align: 'center' });
    P.text(S.sameYear && S.o.startMonth === 0 ? 'digital planner' : S.rangeLabel.toLowerCase(), cx, cy + sz * 0.32 + 34 - off, { font: F.serifI, size: 20, color: pal.c, align: 'center' });
    if (S.o.name) P.text(S.o.name, cx, cy + sz * 0.32 + 70 - off, { font: F.sansM, size: 11, color: pal.ink, align: 'center', spacing: 2 });
  }
  function drawCover(P, S, cv) {
    const { W, H } = S.g, p = cv.p, cx = W / 2, cy = H / 2;
    P.rect(0, 0, W, H, { fill: p.bg });
    const U = Math.min(W, H);
    switch (cv.d) {
      case 'arches': {
        const base = H * 0.86, R = U * 0.46;[p.a, p.b, p.d, p.c, p.bg].forEach((c, i) => P.circle(cx, base, R - i * U * 0.075, { fill: c }));
        P.rect(0, base, W, H - base, { fill: p.bg }); P.line(U * 0.08, base, W - U * 0.08, base, { color: p.c, sw: 1.2 });
        coverTitle(P, S, p, cx, H * 0.3); break;
      }
      case 'blobs': {
        P.circle(0, 0, U * 0.42, { fill: p.a }); P.circle(W, H, U * 0.5, { fill: p.b }); P.circle(W * 0.86, H * 0.16, U * 0.12, { fill: p.c });
        P.circle(W * 0.14, H * 0.84, U * 0.09, { stroke: p.c, sw: 2 }); P.rect(W * 0.72, H * 0.52, U * 0.2, U * 0.2, { r: U * 0.1, fill: p.d });
        coverTitle(P, S, p, cx, cy); break;
      }
      case 'checker': {
        const s = U / 9; for (let j = 0; j * s < H; j++) for (let i = 0; i * s < W; i++) if ((i + j) % 2) P.rect(i * s, j * s, s, s, { fill: p.a });
        coverTitle(P, S, p, cx, cy, true); break;
      }
      case 'gingham': {
        const s = U / 12; for (let i = 0; i * s < W; i += 2) P.rect(i * s, 0, s, H, { fill: p.b, opacity: 0.28 }); for (let j = 0; j * s < H; j += 2) P.rect(0, j * s, W, s, { fill: p.b, opacity: 0.28 });
        coverTitle(P, S, p, cx, cy, true); break;
      }
      case 'waves': {
        const cols = [p.d, p.a, p.b, p.c]; const amp = U * 0.03, wl = U * 0.36;
        cols.forEach((c, k) => { const y0 = H * 0.55 + k * H * 0.11; let d = `M0 ${y0}`; for (let x = 0; x <= W + wl; x += wl / 2) d += ` Q${x + wl / 4} ${y0 + ((x / (wl / 2)) % 2 ? amp : -amp)} ${x + wl / 2} ${y0}`; d += ` V${H} H0 Z`; P.path(d, 0, 0, 1, { fill: c }); });
        coverTitle(P, S, p, cx, H * 0.3); break;
      }
      case 'florals': {
        const rnd = rng(7); const flower = (x, y, r, c, cc) => { for (let i = 0; i < 5; i++) { const a = i * 2 * Math.PI / 5; P.circle(x + Math.cos(a) * r * 0.62, y + Math.sin(a) * r * 0.62, r * 0.48, { fill: c }); } P.circle(x, y, r * 0.3, { fill: cc }); };
        for (let i = 0; i < 26; i++) { const x = rnd() * W, y = rnd() * H; if (Math.abs(x - cx) < U * 0.34 && Math.abs(y - cy) < U * 0.3) continue; flower(x, y, U * (0.035 + rnd() * 0.05), [p.a, p.b, p.d][i % 3], p.c); }
        coverTitle(P, S, p, cx, cy, true); break;
      }
      case 'hearts': {
        const s = U / 10; for (let j = 0; j * s < H + s; j++) for (let i = 0; i * s < W + s; i++) P.path(HEART, i * s + (j % 2 ? s / 2 : 0) - s * 0.3, j * s - s * 0.3, s * 0.45 / 24, { fill: (i + j) % 3 ? p.a : p.b });
        coverTitle(P, S, p, cx, cy, true); break;
      }
      case 'sunset': {
        const hz = H * 0.62; P.circle(cx, hz, U * 0.3, { fill: p.a }); P.circle(cx, hz, U * 0.21, { fill: p.b });
        P.rect(0, hz, W, H - hz, { fill: p.bg }); let y = hz + 16;[26, 22, 18, 14, 10, 7, 5].forEach((t, k) => { P.rect(0, y, W, t, { fill: [p.c, p.b, p.a, p.d][k % 4] }); y += t + 12; });
        coverTitle(P, S, p, cx, H * 0.28); break;
      }
      case 'frame': {
        const m = U * 0.06; P.rect(m, m, W - 2 * m, H - 2 * m, { stroke: p.c, sw: 1.4 }); P.rect(m + 10, m + 10, W - 2 * m - 20, H - 2 * m - 20, { stroke: p.a, sw: 1 });
        [[m, m], [W - m, m], [m, H - m], [W - m, H - m]].forEach(([x, y]) => P.path('M0 -9 L9 0 L0 9 L-9 0 Z', x, y, 1, { fill: p.b }));
        coverTitle(P, S, p, cx, cy); break;
      }
      case 'dots': {
        const s = U / 11; for (let j = 0; j * s < H + s; j++) for (let i = 0; i * s < W + s; i++) P.circle(i * s + (j % 2 ? s / 2 : 0), j * s, s * 0.16, { fill: (i * 7 + j * 3) % 4 === 0 ? p.b : p.a });
        coverTitle(P, S, p, cx, cy, true); break;
      }
      case 'leaves': {
        const leaf = (x, y, s, rot, c) => P.ellipse(x, y, s, s * 0.38, { fill: c, rotate: rot });
        [[0.12, 0], [0.88, 1]].forEach(([fx, side]) => { const x = W * fx; P.line(x, H * 0.06, x, H * 0.94, { color: p.c, sw: 1.4 }); for (let k = 0; k < 9; k++) { const y = H * 0.1 + k * H * 0.095, s = U * 0.05; leaf(x - s * 0.9, y, s, 30, k % 2 ? p.a : p.b); leaf(x + s * 0.9, y + H * 0.04, s, -30, k % 2 ? p.b : p.a); } });
        coverTitle(P, S, p, cx, cy); break;
      }
      case 'bigtype': {
        const two = S.yearLabel.slice(2, 4); P.text(two, cx, H * 0.78, { font: F.serif, size: U * 0.95, color: p.a, align: 'center', opacity: 0.8 });
        P.rect(0, H * 0.8, W, H * 0.2, { fill: p.b }); coverTitle(P, S, p, cx, H * 0.22); break;
      }
    }
  }
  function rng(seed) { let s = seed; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; }

  // ---------- page dispatcher ----------
  const KIND = { cover: pCover, home: pHome, howto: pHowto, year: pYear, goals: pGoals, mealsIndex: pMealsIndex, month: pMonth, habits: pHabits, reflect: pReflect, week: pWeek, meal: pMeal, day: pDay, tplIndex: pTplIndex, tpl: pTpl, notesIndex: pNotesIndex, note: pNote, section: pSection, sectionPage: pSectionPage, stickers: pStickers };
  function drawPage(P, S, pg) { KIND[pg.kind](P, S, pg); }

  // ---------- PDF pen ----------
  const r2 = v => Math.round(v * 100) / 100;
  function PdfPen(L, doc, page, fonts, H, linkSink) { this.L = L; this.doc = doc; this.pg = page; this.f = fonts; this.H = H; this.sink = linkSink; this.cc = {}; }
  PdfPen.prototype.c = function (hex) { if (!hex) return undefined; if (!this.cc[hex]) { const v = hexRgb(hex); this.cc[hex] = this.L.rgb(v[0], v[1], v[2]); } return this.cc[hex]; };
  PdfPen.prototype.rect = function (x, y, w, h, o) {
    o = o || {}; if (o.r) return this.path(rrPath(w, h, o.r), x, y, 1, o);
    this.pg.drawRectangle({ x: r2(x), y: r2(this.H - y - h), width: r2(w), height: r2(h), color: this.c(o.fill), borderColor: this.c(o.stroke), borderWidth: o.stroke ? (o.sw || 1) : 0, opacity: o.opacity, borderOpacity: o.opacity });
  };
  PdfPen.prototype.path = function (d, x, y, s, o) {
    o = o || {}; this.pg.drawSvgPath(d, { x: r2(x), y: r2(this.H - y), scale: s || 1, color: this.c(o.fill), borderColor: this.c(o.stroke), borderWidth: o.stroke ? (o.sw || 1) : 0, opacity: o.opacity, borderOpacity: o.opacity, borderLineCap: o.stroke ? this.L.LineCapStyle.Round : undefined });
  };
  PdfPen.prototype.circle = function (cx, cy, r, o) { o = o || {}; this.pg.drawCircle({ x: r2(cx), y: r2(this.H - cy), size: r2(r), color: this.c(o.fill), borderColor: this.c(o.stroke), borderWidth: o.stroke ? (o.sw || 1) : 0, opacity: o.opacity, borderOpacity: o.opacity }); };
  PdfPen.prototype.ellipse = function (cx, cy, rx, ry, o) { o = o || {}; this.pg.drawEllipse({ x: r2(cx), y: r2(this.H - cy), xScale: r2(rx), yScale: r2(ry), rotate: o.rotate ? this.L.degrees(o.rotate) : undefined, color: this.c(o.fill), borderColor: this.c(o.stroke), borderWidth: o.stroke ? (o.sw || 1) : 0, opacity: o.opacity, borderOpacity: o.opacity }); };
  PdfPen.prototype.dot = function (x, y, d, color) { this.pg.drawLine({ start: { x: r2(x), y: r2(this.H - y) }, end: { x: r2(x) + 0.01, y: r2(this.H - y) }, thickness: d, color: this.c(color), lineCap: this.L.LineCapStyle.Round }); };
  PdfPen.prototype.line = function (x1, y1, x2, y2, o) { o = o || {}; this.pg.drawLine({ start: { x: r2(x1), y: r2(this.H - y1) }, end: { x: r2(x2), y: r2(this.H - y2) }, thickness: o.sw || 1, color: this.c(o.color || '#000000'), dashArray: o.dash, opacity: o.opacity, lineCap: o.dash ? undefined : this.L.LineCapStyle.Round }); };
  PdfPen.prototype.measure = function (s, font, size, sp) { const f = this.f[font]; return f.widthOfTextAtSize(s, size) + (sp ? sp * (s.length - 1) : 0); };
  PdfPen.prototype.text = function (s, x, y, o) {
    o = o || {}; s = String(s); const font = this.f[o.font || 'sans'], size = o.size || 10, sp = o.spacing || 0;
    const w = this.measure(s, o.font || 'sans', size, sp);
    let xx = x; if (o.align === 'center') xx = x - w / 2; else if (o.align === 'right') xx = x - w;
    const col = this.c(o.color || '#000000');
    if (!sp) { this.pg.drawText(s, { x: r2(xx), y: r2(this.H - y), size, font, color: col, opacity: o.opacity }); return; }
    this.pg.pushOperators(this.L.setCharacterSpacing(sp));
    this.pg.drawText(s, { x: r2(xx), y: r2(this.H - y), size, font, color: col, opacity: o.opacity });
    this.pg.pushOperators(this.L.setCharacterSpacing(0));
  };
  PdfPen.prototype.link = function (x, y, w, h, key) { this.sink.push({ r: [r2(x), r2(this.H - y - h), r2(x + w), r2(this.H - y)], key }); };
  PdfPen.prototype.url = function (x, y, w, h, href) { this.sink.push({ r: [r2(x), r2(this.H - y - h), r2(x + w), r2(this.H - y)], href }); };

  // ---------- Canvas pen (live preview) ----------
  const FAM = { serif: '"PFSerif"', serifI: '"PFSerifI"', sans: '"PFSans"', sansM: '"PFSansM"', sansL: '"PFSansL"' };
  function CanvasPen(ctx) { this.x = ctx; }
  CanvasPen.prototype._fs = function (o) { const x = this.x; x.globalAlpha = o.opacity == null ? 1 : o.opacity; if (o.fill) { x.fillStyle = o.fill; x.fill(); } if (o.stroke) { x.strokeStyle = o.stroke; x.lineWidth = o.sw || 1; x.lineCap = 'round'; x.stroke(); } x.globalAlpha = 1; };
  CanvasPen.prototype.rect = function (x, y, w, h, o) { o = o || {}; if (o.r) return this.path(rrPath(w, h, o.r), x, y, 1, o); this.x.beginPath(); this.x.rect(x, y, w, h); this._fs(o); };
  CanvasPen.prototype.path = function (d, x, y, s, o) { o = o || {}; const c = this.x; c.save(); c.translate(x, y); c.scale(s || 1, s || 1); const p = new Path2D(d); c.globalAlpha = o.opacity == null ? 1 : o.opacity; if (o.fill) { c.fillStyle = o.fill; c.fill(p); } if (o.stroke) { c.strokeStyle = o.stroke; c.lineWidth = (o.sw || 1) / (s || 1); c.lineCap = 'round'; c.stroke(p); } c.restore(); };
  CanvasPen.prototype.circle = function (cx, cy, r, o) { this.x.beginPath(); this.x.arc(cx, cy, r, 0, Math.PI * 2); this._fs(o || {}); };
  CanvasPen.prototype.ellipse = function (cx, cy, rx, ry, o) { o = o || {}; this.x.beginPath(); this.x.ellipse(cx, cy, rx, ry, -(o.rotate || 0) * Math.PI / 180, 0, Math.PI * 2); this._fs(o); };
  CanvasPen.prototype.dot = function (x, y, d, color) { this.x.beginPath(); this.x.arc(x, y, d / 2, 0, Math.PI * 2); this.x.fillStyle = color; this.x.fill(); };
  CanvasPen.prototype.line = function (x1, y1, x2, y2, o) { o = o || {}; const c = this.x; c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.strokeStyle = o.color || '#000'; c.lineWidth = o.sw || 1; c.setLineDash(o.dash || []); c.lineCap = o.dash ? 'butt' : 'round'; c.globalAlpha = o.opacity == null ? 1 : o.opacity; c.stroke(); c.setLineDash([]); c.globalAlpha = 1; };
  CanvasPen.prototype.measure = function (s, font, size, sp) { this.x.font = size + 'px ' + FAM[font]; return this.x.measureText(s).width + (sp ? sp * (s.length - 1) : 0); };
  CanvasPen.prototype.text = function (s, x, y, o) {
    o = o || {}; s = String(s); const c = this.x, font = o.font || 'sans', size = o.size || 10, sp = o.spacing || 0;
    const w = this.measure(s, font, size, sp); let xx = x; if (o.align === 'center') xx = x - w / 2; else if (o.align === 'right') xx = x - w;
    c.font = size + 'px ' + FAM[font]; c.fillStyle = o.color || '#000'; c.textBaseline = 'alphabetic'; c.globalAlpha = o.opacity == null ? 1 : o.opacity;
    if (!sp) c.fillText(s, xx, y); else for (const ch of s) { c.fillText(ch, xx, y); xx += c.measureText(ch).width + sp; }
    c.globalAlpha = 1;
  };
  CanvasPen.prototype.link = function () { }; CanvasPen.prototype.url = function () { };

  // ---------- public API ----------
  async function generatePdf(opts, fontBytes, L, fontkit, onProgress) {
    const S = buildPlan(opts); const { W, H } = S.g;
    const doc = await L.PDFDocument.create(); doc.registerFontkit(fontkit);
    const fonts = {}; for (const k of Object.keys(FAM)) fonts[k] = await doc.embedFont(fontBytes[k], { subset: false });
    const pages = S.pages.map(() => doc.addPage([W, H]));
    const refs = pages.map(p => p.ref);
    const ctx = doc.context, PN = L.PDFName;
    const destCache = {};
    const dest = i => destCache[i] || (destCache[i] = ctx.obj([refs[i], 'XYZ', null, null, null]));
    for (let i = 0; i < S.pages.length; i++) {
      const sink = [];
      const P = new PdfPen(L, doc, pages[i], fonts, H, sink);
      drawPage(P, S, S.pages[i]);
      const annots = [];
      for (const a of sink) {
        let d;
        if (a.key) { const ti = S.keys[a.key]; if (ti == null) throw new Error('Missing link target ' + a.key + ' on ' + S.pages[i].key); d = { Type: 'Annot', Subtype: 'Link', Rect: a.r, Border: [0, 0, 0], Dest: dest(ti) }; }
        else d = { Type: 'Annot', Subtype: 'Link', Rect: a.r, Border: [0, 0, 0], A: { Type: 'Action', S: 'URI', URI: L.PDFString.of(a.href) } };
        annots.push(ctx.register(ctx.obj(d)));
      }
      if (annots.length) pages[i].node.set(PN.of('Annots'), ctx.obj(annots));
      if (onProgress && i % 8 === 0) { onProgress(i / S.pages.length); await new Promise(r => setTimeout(r, 0)); }
    }
    // bookmarks
    const items = [['Cover', 'cover'], ['Home', 'home'], ['How to use', 'howto'], ['Year at a glance', 'year'], ['Yearly goals', 'goals']]
      .concat(S.months.map(mo => [MONTHS[mo.m] + ' ' + mo.y, 'm-' + mkey(mo.y, mo.m)]))
      .concat([['Meal planners', 'meals'], ['Templates', 'tpl'], ['Notes', 'notes'], ['Section 1', 's1'], ['Section 2', 's2'], ['Section 3', 's3'], ['Section 4', 's4'], ['Stickers', 'stk-1']]);
    const outRef = ctx.nextRef(); const iRefs = items.map(() => ctx.nextRef());
    items.forEach(([title, key], i) => {
      const d = { Title: L.PDFHexString.fromText(title), Parent: outRef, Dest: dest(S.keys[key]) };
      if (i) d.Prev = iRefs[i - 1]; if (i < items.length - 1) d.Next = iRefs[i + 1];
      ctx.assign(iRefs[i], ctx.obj(d));
    });
    ctx.assign(outRef, ctx.obj({ Type: 'Outlines', First: iRefs[0], Last: iRefs[iRefs.length - 1], Count: items.length }));
    doc.catalog.set(PN.of('Outlines'), outRef);
    doc.setTitle('The Fresh Start Planner — ' + S.rangeLabel); doc.setAuthor('ThePetalo'); doc.setCreator('ThePetalo Planner Builder'); doc.setProducer('ThePetalo'); doc.setSubject('Hyperlinked digital planner');
    if (onProgress) onProgress(1);
    const bytes = await doc.save({ useObjectStreams: true });
    return { bytes, pages: S.pages.length, plan: S };
  }
  function renderPreview(canvas, opts, kind, scale) {
    const S = buildPlan(opts); const { W, H } = S.g; const s = scale || canvas.width / W;
    canvas.width = Math.round(W * s); canvas.height = Math.round(H * s);
    const ctx = canvas.getContext('2d'); ctx.setTransform(s, 0, 0, s, 0, 0);
    let pg;
    if (kind === 'cover') pg = S.pages[0];
    else if (kind === 'week') pg = S.pages.find(p => p.kind === 'week' && S.inRange(p.ws)) || S.pages.find(p => p.kind === 'week');
    else if (kind === 'day') pg = S.pages.filter(p => p.kind === 'day')[9];
    else pg = S.pages.find(p => p.kind === kind) || S.pages[0];
    drawPage(new CanvasPen(ctx), S, pg);
    return S;
  }
  function renderPage(canvas, opts, index, scale) { const S = buildPlan(opts); const { W, H } = S.g; const s = scale || 1; canvas.width = Math.round(W * s); canvas.height = Math.round(H * s); const ctx = canvas.getContext('2d'); ctx.setTransform(s, 0, 0, s, 0, 0); drawPage(new CanvasPen(ctx), S, S.pages[index]); return S; }

  root.PlannerEngine = { cleanName, stickerList, holidaysFor, buildPlan, generatePdf, renderPreview, renderPage, drawPage, CanvasPen, normalize, TAB_PALETTES, TAB_SINGLES, COVERS, COVER_PALS, DESIGNS, TEMPLATES, NOTES, MONTHS, FAM, utc, dkey, ymd };
  if (typeof module !== 'undefined' && module.exports) module.exports = root.PlannerEngine;
})(typeof window !== 'undefined' ? window : globalThis);
