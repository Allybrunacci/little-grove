/* Little Grove — Stats: streaks, charts and your garden */
'use strict';

const maxKey = (a, b) => (a > b ? a : b);
const firstDay = () => memo('first', () => {
  let f = S.created;
  for (const e of S.ledger) if (e.d < f) f = e.d;
  return f;
});

function perfectDays() {
  return memo('perfectDays', () => {
    const t = today();
    let n = 0;
    for (let k = firstDay(), i = 0; k <= t && i < 5000; k = addDays(k, 1), i++) if (dayProgress(k).perfect) n++;
    return n;
  });
}

function niceTop(m) {
  if (m <= 5) return 5;
  const p = Math.pow(10, Math.floor(Math.log10(m)));
  const f = m / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 5 ? 5 : 10) * p;
}

function barChart(vals, labels, title) {
  const W = 320, H = 150, L = 30, R = 4, T = 10, B = 22;
  const top = niceTop(Math.max(0, ...vals));
  const n = vals.length, bw = (W - L - R) / n;
  const gap = n > 15 ? Math.max(1.5, bw * 0.22) : Math.min(12, bw * 0.3);
  const best = Math.max(...vals);
  const ph = H - T - B;
  let g = '';
  for (const fr of [1, 0.5]) {
    const y = T + ph * (1 - fr);
    g += `<line x1="${L}" x2="${W - R}" y1="${y}" y2="${y}" stroke="#d8ccb6" stroke-width="1" stroke-dasharray="3 4"/>`;
    if (fr === 1) g += `<text x="${L - 6}" y="${y + 4}" text-anchor="end">${top}</text>`;
  }
  g += `<text x="${L - 6}" y="${H - B + 4}" text-anchor="end">0</text>`;
  vals.forEach((v, i) => {
    const x = L + i * bw + gap / 2, w = bw - gap;
    if (v > 0) {
      const h = Math.max(3, (ph * v) / top);
      g += `<rect x="${f1(x)}" y="${f1(H - B - h)}" width="${f1(w)}" height="${f1(h)}" rx="${f1(Math.min(4, w / 2))}" fill="${v === best ? '#f2c94c' : '#c9b8e8'}" stroke="#3b3530" stroke-width="${n > 15 ? 1.2 : 1.8}"/>`;
    }
    if (labels[i]) g += `<text x="${f1(x + w / 2)}" y="${H - 5}" text-anchor="middle">${labels[i]}</text>`;
  });
  g += `<line x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}" stroke="#3b3530" stroke-width="2" stroke-linecap="round"/>`;
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(title)}">${g}</svg>`;
}

function coinChart() {
  const t = today(), ed = calc().earnedDay, range = UI.statRange;
  let vals = [], labels = [], total, line;
  if (range === 'year') {
    const now = fromKey(t);
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const pre = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
      vals.push(sum(Object.keys(ed).filter(k => k.startsWith(pre)).map(k => ed[k])));
      labels.push(MON[d.getMonth()][0]);
    }
    total = sum(vals);
    const bi = vals.indexOf(Math.max(...vals));
    const bd = new Date(now.getFullYear(), now.getMonth() - (11 - bi), 1);
    line = total ? `${total} coins in 12 months · best month ${MON_LONG[bd.getMonth()]}` : 'No coins yet this year';
  } else {
    const n = range === 'month' ? 30 : 7;
    const keys = Array.from({ length: n }, (_, i) => addDays(t, i - n + 1));
    vals = keys.map(k => ed[k] || 0);
    labels = keys.map((k, i) => (n === 7 ? WD[dowOf(k)].slice(0, 2) : (n - 1 - i) % 5 === 0 ? String(fromKey(k).getDate()) : ''));
    total = sum(vals);
    const best = Math.max(...vals);
    const bk = keys[vals.indexOf(best)];
    line = total
      ? `${total} coins in ${n} days · ${Math.round((total / n) * 10) / 10} a day · best ${fmtDay(bk)}`
      : `No coins in the last ${n} days — every tick counts!`;
  }
  const seg = [['week', '7 days'], ['month', '30 days'], ['year', '12 months']]
    .map(([k, l]) => `<button type="button" role="tab" class="${range === k ? 'on' : ''}" aria-selected="${range === k}" data-act="range" data-r="${k}">${l}</button>`).join('');
  return `<section class="card chart-card">
    <div class="seg" role="tablist">${seg}</div>
    <h3 class="chart-title">Coins earned</h3>
    <div class="chart">${barChart(vals, labels, 'Coins earned')}</div>
    <p class="total">${line}</p>
  </section>`;
}

function gardenHtml() {
  const t = today(), weeks = 16;
  const start = addDays(weekStartOf(t), -7 * (weeks - 1));
  const first = firstDay();
  let cells = '';
  for (let i = 0; i < weeks * 7; i++) {
    const k = addDays(start, i);
    if (k > t) { cells += '<div class="g fut"></div>'; continue; }
    let kind = 'none';
    if (k >= first) {
      const p = dayProgress(k);
      kind = !p.n ? (p.any ? 'bloom' : 'none') : p.perfect ? 'bloom' : p.pct >= 0.5 ? 'bud' : p.done > 0 ? 'sprout' : 'soil';
    }
    cells += `<div class="g">${gardenCell(kind, i * 7 + 3)}</div>`;
  }
  const labels = Array(weeks).fill('');
  for (let c = 0; c < weeks; c++) {
    for (let j = 0; j < 7; j++) {
      const d = fromKey(addDays(start, c * 7 + j));
      if (d.getDate() === 1) labels[c] = MON[d.getMonth()];
    }
  }
  if (!labels[0] && !labels[1] && !labels[2]) labels[0] = MON[fromKey(start).getMonth()];
  return `<section class="card garden-card">
    <h3>Your garden</h3>
    <p class="small muted" style="font-weight:700;margin-top:2px">Each day grows from seed to flower as you tick off habits. Last 16 weeks.</p>
    <div class="garden" role="img" aria-label="Garden of your last 16 weeks">${cells}</div>
    <div class="garden-months cols" aria-hidden="true">${labels.map(l => `<span>${l}</span>`).join('')}</div>
    <div class="garden-key"><span>Less</span><span class="scale" aria-hidden="true">${['soil', 'sprout', 'bud', 'bloom'].map((k, i) => gardenCell(k, i + 1)).join('')}</span><span>All done</span></div>
  </section>`;
}

function rhythmHtml() {
  const t = today();
  const acc = Array.from({ length: 7 }, () => ({ s: 0, n: 0 }));
  for (let k = maxKey(firstDay(), addDays(t, -56)); k < t; k = addDays(k, 1)) {
    const p = dayProgress(k);
    if (!p.n) continue;
    const w = dowOf(k);
    acc[w].s += p.pct;
    acc[w].n++;
  }
  const order = weekOrder();
  const vals = order.map(w => (acc[w].n ? acc[w].s / acc[w].n : null));
  const known = vals.filter(v => v !== null);
  let body;
  if (known.length < 5) {
    body = '<div class="insight"><span class="em" aria-hidden="true">🗓️</span><span>Come back after a week of ticking to see which days you shine.</span></div>';
  } else {
    const best = Math.max(...known), low = Math.min(...known);
    const bars = order.map((w, i) => {
      const v = vals[i];
      return `<div class="${v !== null && v === best ? 'top' : ''}"><span class="b" style="height:${v === null ? 0 : Math.max(4, Math.round(v * 82))}%"></span>${WD[w][0]}</div>`;
    }).join('');
    const bw = order[vals.indexOf(best)], lw = order[vals.indexOf(low)];
    const tip = best - low > 0.15 ? ` ${WD_LONG[lw]}s are trickier — maybe plan a lighter one.` : ' You’re steady all week — lovely!';
    body = `<div class="wk-bars" role="img" aria-label="Average habits done by weekday">${bars}</div>
      <div class="insight"><span class="em" aria-hidden="true">🌟</span><span><b>${WD_LONG[bw]}s</b> are your strongest day (${Math.round(best * 100)}% done).${tip}</span></div>`;
  }
  return `<section class="card"><h3>Your week rhythm</h3><p class="small muted" style="font-weight:700;margin-top:2px">Average share of habits done, last 8 weeks</p>${body}</section>`;
}

function perHabitHtml() {
  const t = today(), from = addDays(t, -29);
  const rows = liveHabits().map(h => {
    let sched = 0, done = 0;
    for (let k = maxKey(from, h.created); k <= t; k = addDays(k, 1)) {
      if (!onDay(h, k)) continue;
      const ok = countOf(k, h.id) >= h.target;
      if (k === t && !ok) continue;
      sched++;
      if (ok) done++;
    }
    return { h, sched, done, pct: sched ? done / sched : 0 };
  }).filter(r => r.sched > 0).sort((a, b) => b.pct - a.pct || b.done - a.done);
  if (!rows.length) return '';
  const top = rows[0], low = rows[rows.length - 1];
  let tip = '';
  if (rows.length > 1 && top.pct - low.pct >= 0.25) {
    tip = `<div class="insight"><span class="em" aria-hidden="true">💡</span><span><b>${esc(top.h.name)}</b> is your most consistent habit. <b>${esc(low.h.name)}</b> could use some love — could you make it smaller or easier?</span></div>`;
  } else if (top.pct >= 0.8) {
    tip = '<div class="insight"><span class="em" aria-hidden="true">🌻</span><span>You’re keeping up with everything beautifully.</span></div>';
  }
  return `<section class="card"><h3>Habit by habit</h3><p class="small muted" style="font-weight:700;margin-top:2px">Days done out of days planned, last 30 days</p>
    <div style="margin-top:6px">${rows.map(r => {
      const pct = Math.round(r.pct * 100);
      return `<div class="hstat" style="--c:${colorOf(r.h.color)[0]}"><span class="e" aria-hidden="true">${r.h.emoji}</span><b>${esc(r.h.name)}</b><span class="pc">${pct}%</span><span class="bar" aria-hidden="true"><span style="width:${pct}%"></span></span><small>${r.done} of ${plural(r.sched, 'day')}</small></div>`;
    }).join('')}</div>${tip}</section>`;
}

function donutHtml() {
  const by = {};
  for (const e of S.ledger) {
    if (e.k !== 'habit' || e.a <= 0) continue;
    const o = by[e.ref] || (by[e.ref] = { a: 0 });
    o.a += e.a;
    o.n = e.n;
    o.e = e.e;
  }
  const list = Object.entries(by).map(([id, o]) => {
    const h = habitById(id);
    return { n: h ? h.name : o.n, e: h ? h.emoji : o.e, a: o.a, color: colorOf(h ? h.color : 'sage')[0] };
  }).sort((a, b) => b.a - a.a);
  if (!list.length) return '';
  const top = list.slice(0, 5);
  if (list.length > 5) top.push({ n: 'Everything else', e: '🌿', a: sum(list.slice(5).map(r => r.a)), color: '#ece1cc' });
  const total = sum(top.map(r => r.a));
  let off = 0;
  const segs = top.map(r => {
    const p = (r.a / total) * 100;
    const s = `<circle cx="21" cy="21" r="15.915" fill="none" stroke="${r.color}" stroke-width="7" stroke-dasharray="${p.toFixed(2)} ${(100 - p).toFixed(2)}" stroke-dashoffset="${(25 - off).toFixed(2)}"/>`;
    off += p;
    return s;
  }).join('');
  const svg = `<svg viewBox="0 0 42 42" role="img" aria-label="Coins earned by habit"><circle cx="21" cy="21" r="19.4" fill="#fffdf8" stroke="#3b3530" stroke-width="1"/>${segs}<circle cx="21" cy="21" r="12.4" fill="#fffdf8" stroke="#3b3530" stroke-width="1"/><text x="21" y="21" text-anchor="middle" dominant-baseline="central" font-size="6" font-weight="900" fill="#3b3530">${total}</text></svg>`;
  return `<section class="card"><h3>Where your coins come from</h3>
    <div class="donut-row" style="margin-top:10px">${svg}<div>${top.map(r => `<div class="dn-row"><i style="background:${r.color}"></i><span>${r.e} ${esc(r.n)}</span><b>${r.a}</b></div>`).join('')}</div></div></section>`;
}

function phaseStatsHtml() {
  if (!cycleOn() || !cycleInfo().has) return '';
  const t = today();
  const acc = {};
  for (const p of PHASE_ORDER) acc[p] = { s: 0, n: 0 };
  for (let k = maxKey(firstDay(), addDays(t, -180)); k < t; k = addDays(k, 1)) {
    const ph = phaseOn(k);
    if (!ph) continue;
    const p = dayProgress(k);
    if (!p.n) continue;
    acc[ph].s += p.pct;
    acc[ph].n++;
  }
  const days = sum(PHASE_ORDER.map(p => acc[p].n));
  const head = '<h3>Habits &amp; your cycle</h3><p class="small muted" style="font-weight:700;margin-top:2px">Average share of habits done in each phase</p>';
  if (days < 7) {
    return `<section class="card">${head}<div class="insight"><span class="em" aria-hidden="true">🌙</span><span>After a week or two of ticking, you’ll see how your habits flow with your cycle.</span></div></section>`;
  }
  const pct = p => (acc[p].n ? Math.round((acc[p].s / acc[p].n) * 100) : null);
  const bars = PHASE_ORDER.map(p => `<div class="phase-bar"><span>${PHASES[p].emoji} ${PHASES[p].name}</span><span class="track"><span style="width:${pct(p) || 0}%;background:${PHASES[p].color}"></span></span><b>${pct(p) === null ? '–' : pct(p) + '%'}</b></div>`).join('');
  const have = PHASE_ORDER.filter(p => acc[p].n >= 2);
  let tip = '';
  if (have.length >= 2) {
    const hi = have.reduce((a, b) => (pct(b) > pct(a) ? b : a)), lo = have.reduce((a, b) => (pct(b) < pct(a) ? b : a));
    tip = pct(hi) - pct(lo) >= 10
      ? `<div class="insight"><span class="em" aria-hidden="true">${PHASES[hi].emoji}</span><span>You’re most on it in your <b>${PHASES[hi].name.toLowerCase()}</b> phase. In your ${PHASES[lo].name.toLowerCase()} phase it’s okay to go gentler 💗</span></div>`
      : '<div class="insight"><span class="em" aria-hidden="true">🌗</span><span>You keep your habits going through every phase — impressive!</span></div>';
  }
  return `<section class="card">${head}<div class="phase-bars">${bars}</div>${tip}</section>`;
}

VIEWS.stats = {
  title: 'Stats',
  render() {
    const c = calc(), t = today(), ws = weekStartOf(t);
    let html = `<div class="section-title page-title"><div><h1>Stats</h1>${squiggle('var(--lav)')}</div><span class="hand">look how you’ve grown</span></div>`;
    if (!S.ledger.length) {
      html += `<div class="card empty"><div class="art-wrap">${plantArt(1)}</div><h3>Nothing to count yet</h3><p>Tick off a few habits and your stats will bloom here.</p><a class="btn sage" href="#/today">Go to today</a></div>`;
      return html;
    }
    const weekTicks = S.ledger.filter(e => e.k === 'habit' && e.d >= ws && e.d <= t).length;
    const st = streakInfo();
    const msg = !st.cur ? 'tick a habit to start one' : !anyTicks(t) ? 'tick one today to keep it' : st.cur < 3 ? 'a lovely start' : st.cur < 7 ? 'keep it growing' : 'you’re on fire!';
    html += `<div class="stat-grid">
      <div class="card stat c1"><div class="lbl">🪙 Coins earned</div><div class="num">${c.earned}</div><div class="foot">${c.bal} in your jar</div></div>
      <div class="card stat c2"><div class="lbl">🌱 Habits done</div><div class="num">${c.ticks}</div><div class="foot">${weekTicks} this week</div></div>
      <div class="card stat c3"><div class="lbl">🎁 Treats</div><div class="num">${c.claims}</div><div class="foot">${c.spent} coins spent</div></div>
      <div class="card stat c4"><div class="lbl">🌸 Perfect days</div><div class="num">${perfectDays()}</div><div class="foot">every habit done</div></div>
    </div>
    <section class="card streak-card">${flameArt()}
      <div><div class="num">${st.cur}</div><div class="streak-lbl">${st.cur === 1 ? 'day' : 'days'} in a row</div><div class="hand streak-msg">${msg}</div></div>
      <div class="best">Best<b>${st.best}</b>${st.best === 1 ? 'day' : 'days'}</div>
    </section>`;
    html += coinChart() + gardenHtml() + rhythmHtml() + perHabitHtml() + donutHtml() + phaseStatsHtml();
    return html;
  },
  act: {
    range(a) { UI.statRange = a.dataset.r; render(); },
  },
};
