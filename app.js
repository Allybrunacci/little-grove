/* Little Grove — core: storage, dates, coins, cycle maths, UI kit, router */
'use strict';

const APP_VERSION = '1.2';
const STORE_KEY = 'little-grove:v1';

/* ---------- tiny helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
const clamp = (n, lo, hi) => Math.max(lo, Math.min(hi, n));
const sum = a => a.reduce((t, n) => t + n, 0);
const mean = a => (a.length ? sum(a) / a.length : 0);
const plural = (n, one, many) => `${n} ${n === 1 ? one : many || one + 's'}`;
const icon = (id, cls) => `<svg${cls ? ` class="${cls}"` : ''} viewBox="0 0 32 32" aria-hidden="true"><use href="#i-${id}"/></svg>`;
const COIN = '<svg viewBox="0 0 32 32" aria-hidden="true"><use href="#i-coin"/></svg>';
const coinTag = (n, cls) => `<span class="coin-inline${cls ? ' ' + cls : ''}">${COIN}${n}</span>`;
const signed = n => (n < 0 ? '−' : '+') + Math.abs(n);
const TICK = '<svg viewBox="0 0 32 32" aria-hidden="true"><path class="tick" d="M7.5 16.5l5.5 5.5L24.5 10" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const squiggle = c => `<svg class="squiggle" viewBox="0 0 92 10" aria-hidden="true"><path d="M2 6c7-6 13 3 20 0s13-6 20 0 13 3 20 0 13-6 20 0" fill="none" stroke="${c || 'var(--blush)'}" stroke-width="3" stroke-linecap="round"/></svg>`;
const colorOf = k => COLORS[k] || COLORS.sage;
const buzz = (ms = 12) => { try { if (navigator.vibrate) navigator.vibrate(ms); } catch (e) { /* not supported */ } };

/* ---------- dates (local, as YYYY-MM-DD keys) ---------- */
const WD = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const WD_LONG = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MON_LONG = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const pad = n => String(n).padStart(2, '0');
const dkey = d => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const fromKey = k => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d); };
const today = () => dkey(new Date());
const addDays = (k, n) => { const d = fromKey(k); d.setDate(d.getDate() + n); return dkey(d); };
const daysBetween = (a, b) => Math.round((fromKey(b) - fromKey(a)) / 864e5);
const dowOf = k => fromKey(k).getDay();
const isKey = k => typeof k === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(k);
const fmtDay = k => { const d = fromKey(k); return `${WD[d.getDay()]} ${d.getDate()} ${MON[d.getMonth()]}`; };
const fmtShort = k => { const d = fromKey(k); return `${d.getDate()} ${MON[d.getMonth()]}`; };
const fmtLong = k => { const d = fromKey(k); return `${WD_LONG[d.getDay()]} ${d.getDate()} ${MON_LONG[d.getMonth()]}`; };
function fmtRel(k) {
  const t = today();
  if (k === t) return 'Today';
  if (k === addDays(t, -1)) return 'Yesterday';
  if (k === addDays(t, 1)) return 'Tomorrow';
  return fmtDay(k);
}
const relDay = k => { const t = today(); return k === t ? 'today' : k === addDays(t, -1) ? 'yesterday' : `on ${fmtDay(k)}`; };
const f1 = n => n.toFixed(1);
function fmtTime(ts) {
  const d = new Date(ts);
  const h = d.getHours();
  return `${h % 12 || 12}:${pad(d.getMinutes())} ${h < 12 ? 'am' : 'pm'}`;
}
function fmtRange(a, b) {
  if (a === b) return fmtShort(a);
  const A = fromKey(a), B = fromKey(b);
  if (A.getMonth() === B.getMonth() && A.getFullYear() === B.getFullYear()) return `${A.getDate()}–${B.getDate()} ${MON[B.getMonth()]}`;
  return `${fmtShort(a)} – ${fmtShort(b)}`;
}
function weekStartOf(k) {
  const ws = S.settings.weekStart;
  return addDays(k, -((dowOf(k) - ws + 7) % 7));
}
const weekOrder = () => [0, 1, 2, 3, 4, 5, 6].map(i => (i + S.settings.weekStart) % 7);

/* ---------- state ---------- */
// How often a habit is due. Anything but 'day' can be done on any day in its week, fortnight or month.
const FREQS = {
  day: { label: 'Daily', unit: 'day', per: 'a day' },
  week: { label: 'Weekly', unit: 'week', per: 'a week' },
  fortnight: { label: 'Fortnightly', unit: 'fortnight', per: 'a fortnight' },
  month: { label: 'Monthly', unit: 'month', per: 'a month' },
};
const cleanId = v => String(v || '').replace(/[^\w-]/g, '').slice(0, 40) || uid();
const cleanEmoji = (v, dflt) => String(v || '').replace(/[<>&"'`\\]/g, '').trim().slice(0, 16) || dflt;

function freshState() {
  return {
    v: 1,
    created: today(),
    onboarded: false,
    name: '',
    habits: [],
    rewards: [],
    ledger: [],
    cycle: { on: true, len: 28, plen: 5, fertile: true, days: {} },
    settings: { bonus: 5, bloom: 40, weekStart: 1, fx: true, backup: '' },
    savedAt: 0,
  };
}

function normHabit(h) {
  let days = Array.isArray(h.days) ? h.days.map(Number).filter(n => n >= 0 && n <= 6) : [];
  if (!days.length) days = [0, 1, 2, 3, 4, 5, 6];
  return {
    id: cleanId(h.id),
    name: String(h.name || 'My habit').slice(0, 60),
    emoji: cleanEmoji(h.emoji, '🌱'),
    coins: clamp(Math.round(+h.coins || 0), 0, 500),
    target: clamp(Math.round(+h.target || 1), 1, 50),
    unit: String(h.unit || '').slice(0, 14),
    color: COLORS[h.color] ? h.color : 'sage',
    days: Array.from(new Set(days)).sort(),
    phase: PHASES[h.phase] ? h.phase : '',
    freq: FREQS[h.freq] ? h.freq : 'day',
    anchor: isKey(h.anchor) ? h.anchor : isKey(h.created) ? h.created : today(),
    created: isKey(h.created) ? h.created : today(),
    archived: !!h.archived,
    archivedOn: isKey(h.archivedOn) ? h.archivedOn : '',
  };
}

function normReward(r) {
  return {
    id: cleanId(r.id),
    name: String(r.name || 'A treat').slice(0, 60),
    emoji: cleanEmoji(r.emoji, '🎁'),
    cost: clamp(Math.round(+r.cost || 1), 1, 99999),
    once: !!r.once,
    done: isKey(r.done) ? r.done : '',
    archived: !!r.archived,
    created: isKey(r.created) ? r.created : today(),
  };
}

function migrate(d) {
  const s = freshState();
  if (!d || typeof d !== 'object') return s;
  s.created = isKey(d.created) ? d.created : s.created;
  s.onboarded = !!d.onboarded;
  s.name = String(d.name || '').slice(0, 40);
  s.habits = Array.isArray(d.habits) ? d.habits.filter(h => h && typeof h === 'object').map(normHabit) : [];
  s.rewards = Array.isArray(d.rewards) ? d.rewards.filter(r => r && typeof r === 'object').map(normReward) : [];
  s.ledger = Array.isArray(d.ledger)
    ? d.ledger.filter(e => e && typeof e === 'object' && isKey(e.d) && typeof e.a === 'number' && isFinite(e.a))
      .map(e => ({ id: cleanId(e.id), t: +e.t || Date.now(), d: e.d, k: ['habit', 'reward', 'bonus'].includes(e.k) ? e.k : 'bonus', ref: String(e.ref || '').replace(/[^\w-]/g, ''), n: String(e.n || '').slice(0, 60), e: cleanEmoji(e.e, '✨'), a: Math.round(e.a) }))
    : [];
  const c = d.cycle && typeof d.cycle === 'object' ? d.cycle : {};
  s.cycle.on = c.on !== false;
  s.cycle.len = clamp(Math.round(+c.len || 28), 18, 60);
  s.cycle.plen = clamp(Math.round(+c.plen || 5), 1, 12);
  s.cycle.fertile = c.fertile !== false;
  s.cycle.days = {};
  if (c.days && typeof c.days === 'object') {
    for (const [k, v] of Object.entries(c.days)) {
      if (!isKey(k) || !v || typeof v !== 'object') continue;
      const day = {};
      if (+v.flow >= 0 && +v.flow <= 4 && v.flow !== undefined && v.flow !== null && v.flow !== '') day.flow = Math.round(+v.flow);
      if (v.auto) day.auto = 1;
      if (Array.isArray(v.sym) && v.sym.length) day.sym = v.sym.map(String).filter(x => SYMPTOMS.some(s => s[0] === x));
      if (Array.isArray(v.mood) && v.mood.length) day.mood = v.mood.map(String).filter(x => MOODS.some(m => m[0] === x));
      if (v.note) day.note = String(v.note).slice(0, 1000);
      if (Object.keys(day).length) s.cycle.days[k] = day;
    }
  }
  const st = d.settings && typeof d.settings === 'object' ? d.settings : {};
  s.settings.bonus = clamp(Math.round(st.bonus === undefined ? 5 : +st.bonus || 0), 0, 100);
  s.settings.bloom = clamp(Math.round(+st.bloom || 40), 10, 100);
  s.settings.weekStart = st.weekStart === 0 ? 0 : 1;
  s.settings.fx = st.fx !== false;
  s.settings.backup = isKey(st.backup) ? st.backup : '';
  s.savedAt = +d.savedAt || 0;
  return s;
}

let S = freshState();
let REV = 0;
let SAVE_OK = true;

function load() {
  let raw = null;
  try { raw = localStorage.getItem(STORE_KEY); } catch (e) { SAVE_OK = false; }
  if (!raw) return freshState();
  try {
    return migrate(JSON.parse(raw));
  } catch (e) {
    try { localStorage.setItem(`${STORE_KEY}:unreadable-${Date.now()}`, raw); } catch (_) { /* full */ }
    return freshState();
  }
}

function save() {
  REV++;
  S.savedAt = Date.now();
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(S));
    SAVE_OK = true;
  } catch (e) {
    SAVE_OK = false;
    toast('⚠️ Couldn’t save on this device. Storage may be full or blocked — try a backup in Settings.', { ms: 6000 });
  }
}

function replaceState(next) {
  S = next;
  REV++;
}

/* ---------- ledger: every coin earned or spent ---------- */
function addEntry(e) {
  const entry = Object.assign({ id: uid(), t: Date.now(), ref: '', n: '', e: '✨' }, e);
  S.ledger.push(entry);
  REV++;
  return entry;
}
function removeEntry(id) {
  const i = S.ledger.findIndex(e => e.id === id);
  if (i < 0) return null;
  REV++;
  return S.ledger.splice(i, 1)[0];
}
function restoreEntries(list) {
  for (const e of list) if (!S.ledger.some(x => x.id === e.id)) S.ledger.push(e);
  S.ledger.sort((a, b) => a.t - b.t);
  REV++;
}

let C = { rev: -1 };
function calc() {
  if (C.rev === REV) return C;
  const counts = {}, earnedDay = {}, bonusDay = {}, claimsBy = {};
  let bal = 0, earned = 0, spent = 0, ticks = 0, claims = 0;
  for (const e of S.ledger) {
    bal += e.a;
    if (e.a > 0) { earned += e.a; earnedDay[e.d] = (earnedDay[e.d] || 0) + e.a; } else spent -= e.a;
    if (e.k === 'habit') {
      const day = counts[e.d] || (counts[e.d] = {});
      day[e.ref] = (day[e.ref] || 0) + 1;
      ticks++;
    } else if (e.k === 'reward') {
      claims++;
      claimsBy[e.ref] = (claimsBy[e.ref] || 0) + 1;
    } else if (e.k === 'bonus') bonusDay[e.d] = e;
  }
  C = { rev: REV, counts, earnedDay, bonusDay, claimsBy, bal, earned, spent, ticks, claims, memo: {} };
  return C;
}
function memo(key, fn) {
  const m = calc().memo;
  return key in m ? m[key] : (m[key] = fn());
}
const balance = () => calc().bal;
const countOf = (d, id) => { const c = calc().counts[d]; return c ? c[id] || 0 : 0; };
const anyTicks = d => { const c = calc().counts[d]; return !!c && Object.values(c).some(v => v > 0); };

/* ---------- habits ---------- */
const liveHabits = () => S.habits.filter(h => !h.archived);
const habitById = id => S.habits.find(h => h.id === id);
const rewardById = id => S.rewards.find(r => r.id === id);

function onDay(h, d) {
  if (h.freq === 'day' && !h.days.includes(dowOf(d))) return false;
  if (h.phase && cycleOn()) {
    const p = phaseOn(d);
    if (p && p !== h.phase) return false;
  }
  return true;
}
// A habit belongs to a day from when it was added until it was removed (or if it was ticked that day).
function existsOn(h, d) {
  if (h.archived && (!h.archivedOn || d >= h.archivedOn)) return false;
  return h.created <= d || countOf(d, h.id) > 0;
}

/* ---------- weekly, fortnightly and monthly habits ---------- */
const isInterval = h => !!h && h.freq !== 'day';

// The week, fortnight or month that day d falls in for this habit (just d for daily habits).
function periodOf(h, d) {
  if (h.freq === 'week') { const s = weekStartOf(d); return { start: s, end: addDays(s, 6) }; }
  if (h.freq === 'fortnight') {
    const ws = weekStartOf(d);
    const n = Math.round(daysBetween(weekStartOf(h.anchor || d), ws) / 7);
    const s = n % 2 === 0 ? ws : addDays(ws, -7);
    return { start: s, end: addDays(s, 13) };
  }
  if (h.freq === 'month') {
    const [y, m] = d.split('-').map(Number);
    return { start: `${y}-${pad(m)}-01`, end: `${y}-${pad(m)}-${pad(new Date(y, m, 0).getDate())}` };
  }
  return { start: d, end: d };
}
function periodCount(h, d) {
  const { start, end } = periodOf(h, d);
  return memo(`pc${h.id}${start}`, () => {
    let n = 0;
    for (let k = start; k <= end; k = addDays(k, 1)) n += countOf(k, h.id);
    return n;
  });
}
const doneFor = (h, d) => (isInterval(h) ? periodCount(h, d) : countOf(d, h.id));
function periodWord(h, d) {
  const { start, end } = periodOf(h, d), t = today();
  return `${start <= t && t <= end ? 'this' : 'that'} ${FREQS[h.freq].unit}`;
}
function ideaSub(it) {
  const fr = FREQS[it.freq] || FREQS.day, n = it.target || 1;
  return `${it.coins} coins${n > 1 ? ` each · ${n}× ${fr.per}` : it.freq && it.freq !== 'day' ? ` · ${fr.label.toLowerCase()}` : ''}`;
}

// Planned = daily habits due that day. Anything else ticked that day (weekly habits, unplanned
// habits) is a bonus: it lifts the day's share done but never counts against it.
function dayProgress(d) {
  return memo('p' + d, () => {
    let done = 0, total = 0, full = 0, n = 0, extra = 0;
    for (const h of S.habits) {
      if (!existsOn(h, d)) continue;
      const c = countOf(d, h.id);
      if (!isInterval(h) && onDay(h, d)) {
        n++;
        total += h.target;
        done += Math.min(c, h.target);
        if (c >= h.target) full++;
      } else if (c > 0) extra += Math.min(c, h.target);
    }
    const all = total + extra, got = done + extra;
    return { done, total, full, n, extra, got, pct: all ? got / all : 0, perfect: n > 0 && full === n, any: anyTicks(d) };
  });
}

/* ---------- the flower ---------- */
const bloomAt = () => clamp(S.settings.bloom, 10, 100) / 100;
// 0 seed · 1 sprout · 2 leafy · 3 bud · 4 in bloom · 5 perfect day (full bloom)
function growth(p) {
  if (!p.n) return p.any ? 4 : 1;
  if (p.perfect) return 5;
  if (!p.got) return 0;
  const f = p.pct / bloomAt() + 1e-9;
  return f >= 1 ? 4 : f >= 0.66 ? 3 : f >= 0.33 ? 2 : 1;
}
// Ticks of today's habits still needed to bloom.
function toBloom(p) {
  if (!p.n || p.perfect) return 0;
  return Math.max(0, Math.ceil(bloomAt() * (p.total + p.extra) - p.got - 1e-9));
}

function habitStreak(h) {
  return memo('hs' + h.id, () => {
    const t = today();
    if (isInterval(h)) {
      let d = periodCount(h, t) >= h.target ? t : addDays(periodOf(h, t).start, -1), n = 0;
      for (let i = 0; i < 600; i++) {
        const { start, end } = periodOf(h, d);
        if (end < h.created) break;
        if (periodCount(h, start) >= h.target) n++; else break;
        d = addDays(start, -1);
      }
      return n;
    }
    let d = countOf(t, h.id) >= h.target ? t : addDays(t, -1), n = 0;
    for (let i = 0; i < 1000; i++, d = addDays(d, -1)) {
      const c = countOf(d, h.id);
      if (d < h.created && !c) break;
      if (!onDay(h, d)) continue;
      if (c >= h.target) n++; else break;
    }
    return n;
  });
}

function streakInfo() {
  return memo('streak', () => {
    const t = today();
    const counted = d => anyTicks(d);
    const restDay = d => d >= S.created && dayProgress(d).n === 0;
    let cur = 0;
    let d = counted(t) ? t : addDays(t, -1);
    for (let i = 0; i < 2000; i++, d = addDays(d, -1)) {
      if (counted(d)) cur++;
      else if (restDay(d)) continue;
      else break;
    }
    const keys = Object.keys(calc().counts).filter(anyTicks).sort();
    let best = cur, run = 0;
    if (keys.length) {
      for (let k = keys[0], i = 0; k <= t && i < 4000; k = addDays(k, 1), i++) {
        if (counted(k)) { run++; best = Math.max(best, run); } else if (!restDay(k)) run = 0;
      }
    }
    return { cur, best };
  });
}

// Extra coins when every habit for the day is done; taken back if the day stops being perfect.
function syncBonus(d) {
  const amt = S.settings.bonus;
  const has = calc().bonusDay[d];
  const p = dayProgress(d);
  if (p.perfect && !has && amt > 0) {
    addEntry({ k: 'bonus', d, a: amt, n: 'Perfect day bonus', e: '🌸' });
    return 'added';
  }
  if (!p.perfect && has) {
    removeEntry(has.id);
    return 'removed';
  }
  return null;
}

/* ---------- cycle maths ---------- */
const cycleOn = () => !!S.cycle.on;
const dayLog = d => S.cycle.days[d];
const flowOf = d => { const x = S.cycle.days[d]; return x && x.flow ? x.flow : 0; };
const isEmptyLog = x => !x || (!x.flow && !(x.sym && x.sym.length) && !(x.mood && x.mood.length) && !x.note);
const hasNotes = d => { const x = S.cycle.days[d]; return !!x && (!!(x.sym && x.sym.length) || !!(x.mood && x.mood.length) || !!x.note); };

function phaseOf(day, L, P) {
  const ovu = Math.max(P + 2, L - 14);
  if (day <= P) return 'menstrual';
  if (day <= ovu - 2) return 'follicular';
  if (day <= ovu + 1) return 'ovulatory';
  return 'luteal';
}
const ovuDay = (L, P) => Math.max(P + 2, L - 14);
function phaseSpans(L, P) {
  const o = ovuDay(L, P);
  return [
    { p: 'menstrual', a: 1, b: P },
    { p: 'follicular', a: P + 1, b: o - 2 },
    { p: 'ovulatory', a: o - 1, b: o + 1 },
    { p: 'luteal', a: o + 2, b: L },
  ].filter(s => s.b >= s.a);
}

// A period is a run of light/medium/heavy days, allowing a one-day gap.
function periodClusters() {
  return memo('clusters', () => {
    const keys = Object.keys(S.cycle.days).filter(k => flowOf(k) >= 2).sort();
    const out = [];
    for (const k of keys) {
      const last = out[out.length - 1];
      if (last && daysBetween(last.end, k) <= 2) { last.end = k; last.n++; } else out.push({ start: k, end: k, n: 1 });
    }
    for (const c of out) c.len = daysBetween(c.start, c.end) + 1;
    return out;
  });
}

function cycleInfo() {
  return memo('cycle', () => {
    const t = today();
    const all = periodClusters();
    const past = all.filter(c => c.start <= t);
    const gaps = [];
    for (let i = 1; i < past.length; i++) {
      const g = daysBetween(past[i - 1].start, past[i].start);
      if (g >= 15 && g <= 60) gaps.push(g);
    }
    const avgLen = gaps.length ? Math.round(mean(gaps.slice(-6))) : S.cycle.len;
    const plens = past.filter(c => c.end < t && c.len >= 2 && c.len <= 12).map(c => c.len);
    const avgP = clamp(plens.length ? Math.round(mean(plens.slice(-6))) : S.cycle.plen, 1, 12);
    const info = { has: past.length > 0, all, past, gaps, plens, avgLen, avgP, L: avgLen };
    if (!info.has) return info;
    const cur = past[past.length - 1];
    info.cur = cur;
    info.start = cur.start;
    info.day = daysBetween(cur.start, t) + 1;
    info.onPeriod = t <= cur.end;
    info.P = info.onPeriod ? Math.max(cur.len, avgP) : cur.len;
    info.ovu = ovuDay(avgLen, info.P);
    info.next = addDays(cur.start, avgLen);
    info.dueIn = daysBetween(t, info.next);
    info.late = info.onPeriod ? 0 : Math.max(0, -info.dueIn);
    info.phase = info.onPeriod ? 'menstrual' : phaseOf(info.day, avgLen, info.P);
    info.sinceEnd = daysBetween(cur.end, t);
    return info;
  });
}

// First predicted start after the current cycle (tomorrow if the period is late).
function predictedStart(info) {
  const t = today();
  return info.next < t ? addDays(t, 1) : info.next;
}

function phaseOn(d) {
  if (!cycleOn()) return null;
  return memo('ph' + d, () => {
    const info = cycleInfo();
    if (!info.has) return null;
    const cl = info.all;
    let i = -1;
    for (let j = cl.length - 1; j >= 0; j--) if (cl[j].start <= d) { i = j; break; }
    if (i < 0) return null;
    const c = cl[i];
    if (d <= c.end) return 'menstrual';
    const isCur = !!info.cur && c.start === info.cur.start;
    const nx = cl[i + 1];
    let L = info.avgLen;
    if (nx) {
      const g = daysBetween(c.start, nx.start);
      if (g > 60) { if (daysBetween(c.start, d) + 1 > L) return null; } else if (g >= 15) L = g;
    }
    let start = c.start, P = isCur ? info.P : c.len;
    let day = daysBetween(start, d) + 1;
    if (!nx && day > L) {
      if (d <= today()) return 'luteal';
      let s = predictedStart(info);
      while (addDays(s, info.avgLen) <= d) s = addDays(s, info.avgLen);
      start = s; P = info.avgP; L = info.avgLen;
      day = daysBetween(start, d) + 1;
    }
    return phaseOf(day, L, P);
  });
}

// Predicted period days, fertile window and ovulation days for the calendar.
function cycleMarks(to) {
  return memo('marks' + to, () => {
    const info = cycleInfo();
    const pred = new Set(), fert = new Set(), ovu = new Set();
    if (!info.has) return { pred, fert, ovu };
    const win = (s, L, P) => {
      const o = ovuDay(L, P);
      for (let k = o - 5; k <= o + 1; k++) fert.add(addDays(s, k - 1));
      ovu.add(addDays(s, o - 1));
    };
    win(info.start, info.L, info.P);
    if (info.onPeriod) {
      for (let k = addDays(info.cur.end, 1); k <= addDays(info.start, info.P - 1); k = addDays(k, 1)) if (flowOf(k) < 2) pred.add(k);
    }
    let s = predictedStart(info);
    for (let i = 0; i < 24 && s <= to; i++) {
      for (let k = 0; k < info.avgP; k++) { const d = addDays(s, k); if (flowOf(d) < 2) pred.add(d); }
      win(s, info.L, info.avgP);
      s = addDays(s, info.L);
    }
    return { pred, fert, ovu };
  });
}

function setFlow(d, flow, auto) {
  const x = S.cycle.days[d] || (S.cycle.days[d] = {});
  if (flow > 0) x.flow = flow; else delete x.flow;
  if (auto && flow > 0) x.auto = 1; else delete x.auto;
  if (isEmptyLog(x)) delete S.cycle.days[d];
}

// Logs the first day and pencils in the rest of the period from the usual length.
function logPeriodStart(d, flow) {
  const P = cycleInfo().avgP;
  setFlow(d, Math.max(2, flow || 3), false);
  let filled = 0;
  for (let i = 1; i < P; i++) {
    const k = addDays(d, i);
    const x = S.cycle.days[k];
    if (x && x.flow !== undefined) continue;
    setFlow(k, i < 2 ? 3 : 2, true);
    filled++;
  }
  REV++;
  return filled;
}

// Clears flow logged after the last day, or fills the gap if the period ran longer.
function logPeriodEnd(e) {
  const info = cycleInfo();
  const cur = info.cur;
  if (!cur) return;
  for (let k = addDays(e, 1); k <= cur.end; k = addDays(k, 1)) if (flowOf(k)) setFlow(k, 0, false);
  if (e > cur.end) for (let k = addDays(cur.end, 1); k <= e; k = addDays(k, 1)) if (!flowOf(k)) setFlow(k, 2, true);
  REV++;
}

/* ---------- toast ---------- */
let toastTimer = null;
function toast(msg, opts = {}) {
  const root = $('#toast-root');
  clearTimeout(toastTimer);
  root.innerHTML = '';
  const action = opts.action || (opts.undo ? { label: 'Undo', fn: opts.undo } : null);
  const el = document.createElement('div');
  el.className = 'toast';
  el.innerHTML = `<span>${msg}</span>${action ? `<button type="button">${esc(action.label)}</button>` : ''}`;
  root.append(el);
  const hide = () => { clearTimeout(toastTimer); el.classList.add('out'); setTimeout(() => el.remove(), 260); };
  toastTimer = setTimeout(hide, opts.ms || (action ? 6000 : 2800));
  if (action) el.querySelector('button').addEventListener('click', () => { hide(); action.fn(); });
  return hide;
}

/* ---------- celebrations ---------- */
const reduceMotion = () => !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);
const fxOn = () => S.settings.fx && !reduceMotion();

function popAt(el, amount) {
  if (!el || !amount) return;
  const r = el.getBoundingClientRect();
  const p = document.createElement('div');
  p.className = 'pop' + (amount < 0 ? ' minus' : '');
  p.style.left = `${r.left + r.width / 2}px`;
  p.style.top = `${r.top - 6}px`;
  p.innerHTML = `${signed(amount)}${COIN}`;
  $('#fx-root').append(p);
  setTimeout(() => p.remove(), 1050);
}

function burstAt(el, colors) {
  if (!el || !fxOn()) return;
  const r = el.getBoundingClientRect();
  const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
  for (let i = 0; i < 12; i++) {
    const b = document.createElement('i');
    b.className = 'burst';
    const a = (i / 12) * Math.PI * 2 + Math.random() * 0.4;
    const dist = 30 + Math.random() * 22;
    b.style.left = `${cx}px`;
    b.style.top = `${cy}px`;
    b.style.background = colors[i % colors.length];
    b.style.setProperty('--bx', `${Math.cos(a) * dist}px`);
    b.style.setProperty('--by', `${Math.sin(a) * dist}px`);
    $('#fx-root').append(b);
    setTimeout(() => b.remove(), 760);
  }
}

function petals(n = 28, set = ['🌸', '🌼', '🌷', '🍃', '✨', '💮']) {
  if (!fxOn()) return;
  const W = window.innerWidth;
  for (let i = 0; i < n; i++) {
    const p = document.createElement('span');
    p.className = 'petal';
    p.textContent = set[i % set.length];
    p.style.left = `${Math.random() * (W - 24)}px`;
    p.style.fontSize = `${16 + Math.random() * 14}px`;
    p.style.setProperty('--dx', `${Math.random() * 140 - 70}px`);
    p.style.setProperty('--rot', `${Math.random() * 720 - 360}deg`);
    p.style.setProperty('--dur', `${2.3 + Math.random() * 1.7}s`);
    p.style.setProperty('--delay', `${Math.random() * 0.7}s`);
    $('#fx-root').append(p);
    setTimeout(() => p.remove(), 4800);
  }
}

let shownBal = null;
function paintBalance() {
  const b = balance();
  $('#balance').textContent = b;
  const pill = $('.coin-pill');
  pill.classList.toggle('neg', b < 0);
  pill.setAttribute('aria-label', `${b} coins — open rewards`);
  if (shownBal !== null && b !== shownBal) {
    pill.classList.remove('bump');
    void pill.offsetWidth;
    pill.classList.add('bump');
  }
  shownBal = b;
}

/* ---------- bottom sheets ---------- */
let SHEET = null;
function openSheet(html, opts = {}) {
  closeSheet(true);
  const root = $('#sheet-root');
  const back = document.createElement('div');
  back.className = 'backdrop';
  const el = document.createElement('div');
  el.className = 'sheet' + (opts.cls ? ' ' + opts.cls : '');
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  if (opts.label) el.setAttribute('aria-label', opts.label);
  el.tabIndex = -1;
  root.append(back, el);
  document.body.classList.add('locked');
  const sh = {
    el, back, opts, closed: false,
    close: () => closeSheet(),
    set(content) {
      const top = el.scrollTop;
      el.innerHTML = `<div class="grab"></div>${content}`;
      el.scrollTop = top;
    },
  };
  sh.set(html);
  SHEET = sh;
  back.addEventListener('click', () => closeSheet());
  el.addEventListener('click', e => {
    if (e.target.closest('[data-close]')) { e.preventDefault(); closeSheet(); return; }
    const a = e.target.closest('[data-act]');
    if (a && opts.act && opts.act[a.dataset.act] && !a.disabled) { e.preventDefault(); opts.act[a.dataset.act](a, e, sh); }
  });
  if (opts.input) el.addEventListener('input', e => opts.input(e, sh));
  if (opts.change) el.addEventListener('change', e => opts.change(e, sh));
  el.addEventListener('submit', e => { e.preventDefault(); if (opts.submit) opts.submit(e, sh); });
  el.focus({ preventScroll: true });
  if (opts.onOpen) opts.onOpen(sh);
  return sh;
}

function closeSheet(instant) {
  const sh = SHEET;
  if (!sh) return;
  SHEET = null;
  sh.closed = true;
  document.body.classList.remove('locked');
  if (sh.opts.onClose) sh.opts.onClose(sh);
  if (instant) { sh.el.remove(); sh.back.remove(); return; }
  sh.el.classList.add('closing');
  sh.back.classList.add('closing');
  setTimeout(() => { sh.el.remove(); sh.back.remove(); }, 230);
}

const sheetHead = title => `<div class="sheet-head"><h2>${title}</h2><button type="button" class="icon-btn" data-close aria-label="Close">${icon('close')}</button></div>`;

function confirmSheet({ title, body, yes = 'Yes', no = 'Cancel', danger = false, emoji = '', onYes }) {
  openSheet(`${sheetHead(title)}
    ${emoji ? `<div class="big-emoji" aria-hidden="true">${emoji}</div>` : ''}
    <p class="lead">${body}</p>
    <div class="btn-row"><button type="button" class="btn ghost" data-close>${no}</button><button type="button" class="btn ${danger ? 'danger' : 'sage'}" data-act="yes">${yes}</button></div>`,
  { label: title, act: { yes: (a, e, sh) => { sh.close(); onYes(); } } });
}

/* ---------- small form widgets ---------- */
function stepper(name, val, unit, label) {
  return `<div class="stepper" role="group" aria-label="${esc(label || name)}">
    <button type="button" data-act="step" data-name="${name}" data-d="-1" aria-label="Less">${icon('minus')}</button>
    <output aria-live="polite">${val}</output>${unit ? `<span class="unit">${unit}</span>` : ''}
    <button type="button" data-act="step" data-name="${name}" data-d="1" aria-label="More">${icon('plus')}</button></div>`;
}
function emojiGrid(cur) {
  return `<div class="emoji-grid">${EMOJIS.map(e => `<button type="button" data-act="emoji" data-e="${e}" class="${e === cur ? 'on' : ''}" aria-label="${e}">${e}</button>`).join('')}</div>`;
}
function stepValue(v, dir, steps) {
  // steps: [[upTo, step], ...] — bigger numbers move in bigger jumps
  const pick = x => { for (const [lim, st] of steps) if (x < lim) return st; return steps[steps.length - 1][1]; };
  if (dir > 0) { const st = pick(v); return Math.floor(v / st) * st + st; }
  const st = pick(v - 1);
  return Math.ceil(v / st) * st - st;
}

/* ---------- router ---------- */
const VIEWS = {};
const UI = { sel: null, week: null, restOpen: false, plantStage: null, hFilter: 'all', hDays: 14, calMonth: null, phaseTab: null, statRange: 'week', deep: new Set() };
let CUR = null;

function routeName() {
  const r = (location.hash || '').replace(/^#\/?/, '').split(/[?/]/)[0];
  if (!VIEWS[r]) return 'today';
  if (r === 'cycle' && !cycleOn()) return 'today';
  return r;
}

function render(fresh) {
  const name = routeName();
  if (name !== CUR) fresh = true;
  CUR = name;
  const v = VIEWS[name];
  const view = $('#view');
  view.classList.remove('view-in');
  view.innerHTML = v.render();
  if (fresh) {
    void view.offsetWidth;
    view.classList.add('view-in');
    window.scrollTo(0, 0);
  }
  if (v.after) v.after(view);
  for (const t of $$('.tab')) {
    const on = t.dataset.tab === name;
    t.classList.toggle('active', on);
    if (on) t.setAttribute('aria-current', 'page'); else t.removeAttribute('aria-current');
  }
  $('.tab[data-tab="cycle"]').hidden = !cycleOn();
  $('.tabbar').classList.toggle('four', !cycleOn());
  paintBalance();
  document.title = name === 'today' ? 'Little Grove' : `${v.title} · Little Grove`;
}

const GLOBAL_ACT = {
  settings: () => openSettings(),
};

function onViewClick(e) {
  const a = e.target.closest('[data-act]');
  if (!a || a.disabled || !$('#view').contains(a)) return;
  const v = VIEWS[CUR];
  const fn = (v && v.act && v.act[a.dataset.act]) || GLOBAL_ACT[a.dataset.act];
  if (fn) { e.preventDefault(); fn(a, e); }
}

let DAY = null;
function checkDay() {
  const t = today();
  if (t === DAY) return;
  if (UI.sel === DAY) UI.sel = t;
  UI.week = null;
  DAY = t;
  REV++;
  if (!SHEET) render();
}

function registerSW() {
  if (!('serviceWorker' in navigator) || !/^https?:$/.test(location.protocol)) return;
  navigator.serviceWorker.register('sw.js').catch(() => { /* offline support is optional */ });
}

function askPersist() {
  try {
    if (navigator.storage && navigator.storage.persist) navigator.storage.persisted().then(p => p || navigator.storage.persist()).catch(() => {});
  } catch (e) { /* not supported */ }
}

function boot() {
  replaceState(load());
  DAY = today();
  UI.sel = DAY;
  $('#view').addEventListener('click', onViewClick);
  document.addEventListener('click', e => {
    const a = e.target.closest('[data-action]');
    if (a && GLOBAL_ACT[a.dataset.action]) { e.preventDefault(); GLOBAL_ACT[a.dataset.action](a, e); }
  });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && SHEET) { closeSheet(); return; }
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[role="button"][data-act]')) { e.preventDefault(); e.target.click(); }
  });
  window.addEventListener('hashchange', () => {
    closeSheet(true);
    UI.phaseTab = null;
    UI.calMonth = null;
    render(true);
  });
  document.addEventListener('visibilitychange', () => { if (!document.hidden) checkDay(); });
  setInterval(checkDay, 30000);
  window.addEventListener('storage', e => {
    if (e.key !== STORE_KEY) return;
    replaceState(load());
    if (!SHEET) render();
  });
  render(true);
  if (!S.onboarded) startOnboarding();
  else askPersist();
  registerSW();
}

document.addEventListener('DOMContentLoaded', boot);
