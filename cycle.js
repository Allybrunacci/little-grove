/* Little Grove — Cycle: period predictions and what to focus on in each phase */
'use strict';

const polar = (cx, cy, r, deg) => { const a = (deg * Math.PI) / 180; return [cx + r * Math.cos(a), cy + r * Math.sin(a)]; };
const emojiFor = name => { const hit = SYMPTOMS.concat(MOODS).find(x => x[0] === name); return hit ? hit[1] : '•'; };

function arcPath(cx, cy, r, a0, a1, color, sw) {
  const [x0, y0] = polar(cx, cy, r, a0), [x1, y1] = polar(cx, cy, r, a1);
  return `<path d="M${f1(x0)} ${f1(y0)}A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${f1(x1)} ${f1(y1)}" fill="none" stroke="${color}" stroke-width="${sw}"/>`;
}
function starPath(x, y, s, fill) {
  const q = v => f1(v * s);
  return `<path d="M${f1(x)} ${f1(y - s)}l${q(0.3)} ${q(0.7)} ${q(0.7)} ${q(0.3)}-${q(0.7)} ${q(0.3)}-${q(0.3)} ${q(0.7)}-${q(0.3)}-${q(0.7)}-${q(0.7)}-${q(0.3)} ${q(0.7)}-${q(0.3)}z" fill="${fill}" stroke="#3b3530" stroke-width="1.2" stroke-linejoin="round"/>`;
}

function cycleRing(info) {
  const L = Math.max(info.L, info.day);
  const cx = 125, cy = 125, r = 92, sw = 22;
  const seg = 360 / L, gap = L > 40 ? 0.5 : 1;
  let s = `<circle cx="${cx}" cy="${cy}" r="${r + sw / 2 + 1.5}" fill="#fffdf8" stroke="#3b3530" stroke-width="2.4"/>`;
  for (let i = 1; i <= L; i++) {
    const p = i > info.L ? 'luteal' : phaseOf(i, info.L, info.P);
    s += arcPath(cx, cy, r, -90 + (i - 1) * seg + gap / 2, -90 + i * seg - gap / 2, i <= info.day ? PHASES[p].color : PHASES[p].light, sw);
  }
  s += `<circle cx="${cx}" cy="${cy}" r="${r - sw / 2 - 1.5}" fill="#fffdf8" stroke="#3b3530" stroke-width="2.4"/>`;
  if (S.cycle.fertile) {
    for (let i = info.ovu - 5; i <= info.ovu + 1; i++) {
      if (i < 1 || i > info.L) continue;
      const [x, y] = polar(cx, cy, r - sw / 2 - 10, -90 + (i - 0.5) * seg);
      s += i === info.ovu ? starPath(x, y, 6.5, '#c9b8e8') : `<circle cx="${f1(x)}" cy="${f1(y)}" r="2.6" fill="#c9b8e8" stroke="#3b3530" stroke-width="1"/>`;
    }
  }
  for (const sp of phaseSpans(info.L, info.P)) {
    const [x, y] = polar(cx, cy, r + sw / 2 + 12, -90 + ((sp.a - 1 + sp.b) / 2) * seg);
    s += emojiArtIn(PHASES[sp.p].emoji, x, y, 19);
  }
  const [mx, my] = polar(cx, cy, r, -90 + (info.day - 0.5) * seg);
  s += `<circle cx="${f1(mx)}" cy="${f1(my)}" r="14" fill="#fffdf8" stroke="#3b3530" stroke-width="2.6"/><circle cx="${f1(mx)}" cy="${f1(my)}" r="6" fill="${PHASES[info.phase].color}" stroke="#3b3530" stroke-width="1.6"/>`;
  return `<svg viewBox="0 0 250 250" aria-hidden="true">${s}</svg>`;
}

function heroCycle(info) {
  const t = today(), ph = PHASES[info.phase];
  let status, sub;
  if (info.onPeriod) {
    status = `Period · day ${info.day}`;
    sub = info.cur.end > t ? `Pencilled in until ${fmtDay(info.cur.end)}` : `Your periods usually last about ${plural(info.avgP, 'day')}`;
  } else if (info.late > 0) {
    status = `Period ${plural(info.late, 'day')} late`;
    sub = info.late > 10 ? 'Forgot to log one? Tap the day it started in the calendar below.' : 'Cycles can wobble — stress, travel and sleep can all shift things.';
  } else if (info.dueIn === 0) {
    status = 'Period could start today';
    sub = 'Maybe pop a pad or cup in your bag 💗';
  } else {
    status = `Period in ${plural(info.dueIn, 'day')}`;
    sub = `Expected around ${fmtLong(info.next)}`;
  }
  if (S.cycle.fertile && !info.onPeriod && cycleMarks(t).fert.has(t)) sub += ' · in your fertile window';
  const actions = [];
  if (info.onPeriod) {
    actions.push(`<button type="button" class="btn pink block" data-act="log" data-d="${t}">💧 Log today’s flow</button>`);
    actions.push(`<div class="btn-row"><button type="button" class="btn ghost" data-act="end">Period ended</button><button type="button" class="btn ghost" data-act="log" data-d="${t}">How I feel</button></div>`);
  } else {
    actions.push(`<button type="button" class="btn pink block" data-act="start">🩸 My period started</button>`);
    const still = info.sinceEnd >= 1 && info.sinceEnd <= 2;
    actions.push(`<div class="btn-row">${still ? '<button type="button" class="btn ghost" data-act="still">Still bleeding</button>' : ''}<button type="button" class="btn ghost" data-act="log" data-d="${t}">How I feel</button></div>`);
  }
  return `<section class="card cycle-hero" style="background:${ph.light}">
    <div class="ring">${cycleRing(info)}
      <div class="ring-center"><span class="hand">${info.onPeriod ? 'period day' : 'cycle day'}</span><span class="dayno">${info.day}</span><span class="ph">${ph.emoji} ${ph.name}</span></div>
    </div>
    <div class="status">${status}</div>
    <div class="status-sub">${sub}</div>
    <div class="cycle-actions">${actions.join('')}</div>
  </section>`;
}

function setupHero() {
  return `<section class="card cycle-hero">
    <div class="empty" style="padding:4px 4px 0">${moonArt()}<h3>Let’s get to know your cycle</h3>
      <p>Log when your last period started. Little Grove will predict the next one and share what each phase is good for.</p></div>
    <div class="cycle-actions"><button type="button" class="btn pink block" data-act="start">🩸 Log my last period</button></div>
  </section>`;
}

// Where a phase falls: now, later this cycle, or next cycle.
function phaseWhen(info, p) {
  const spans = phaseSpans(info.L, info.P);
  const sp = spans.find(x => x.p === p);
  const late = info.late > 0 && !info.onPeriod;
  if (p === 'luteal' && late) return 'Now · waiting for your period';
  if (sp && info.day >= sp.a && info.day <= sp.b) return `Now · until ${fmtDay(addDays(info.start, sp.b - 1))}`;
  if (sp && sp.a > info.day) return `Coming up · ${fmtRange(addDays(info.start, sp.a - 1), addDays(info.start, sp.b - 1))}`;
  const ns = predictedStart(info);
  const nsp = phaseSpans(info.L, info.avgP).find(x => x.p === p);
  if (!nsp) return '';
  return `Next · ${fmtRange(addDays(ns, nsp.a - 1), addDays(ns, nsp.b - 1))}`;
}

function phaseSection(info) {
  const cur = info.has ? info.phase : null;
  const sel = UI.phaseTab || cur || 'menstrual';
  const ph = PHASES[sel];
  const when = info.has ? phaseWhen(info, sel) : `${ph.season}`;
  const have = new Set(liveHabits().map(h => h.name.toLowerCase()));
  const energy = Array.from({ length: 5 }, (_, i) => `<i class="${i < ph.energy ? 'on' : ''}"></i>`).join('');
  return `<div class="section-title"><div><h2>${sel === cur ? 'Your focus right now' : 'Phase guide'}</h2>${squiggle()}</div><span class="hand">${cur ? 'tap a phase' : 'what each phase is for'}</span></div>
    <div class="seg phases" role="tablist">${PHASE_ORDER.map(p => `<button type="button" role="tab" class="${p === sel ? 'on' : ''}" data-act="ph" data-p="${p}" aria-selected="${p === sel}"><span aria-hidden="true">${PHASES[p].emoji}</span>${PHASES[p].name}</button>`).join('')}</div>
    <section class="card phase-card" style="--ph-l:${ph.light}">
      <div class="phase-top"><div class="big" aria-hidden="true">${ph.emoji}</div><div><div class="season">${ph.season}</div><h2>${ph.name} phase</h2>${info.has ? `<div class="when">${when}</div>` : ''}</div></div>
      <p class="blurb">${ph.blurb}</p>
      <div class="energy"><span>Energy</span>${energy}</div>
      ${ph.note && S.cycle.fertile ? `<div class="note-pill"><span aria-hidden="true">🌼</span><span>${ph.note}</span></div>` : ''}
      <div class="focus-grid">${ph.focus.map(f => `<div class="focus"><h4><span aria-hidden="true">${f.icon}</span>${f.title}</h4><ul>${f.tips.map(tip => `<li>${tip}</li>`).join('')}</ul></div>`).join('')}</div>
      <div class="phase-habits"><div class="label">Habits that suit this phase</div>
        <div class="chips">${ph.habits.map((h, i) => { const got = have.has(h.name.toLowerCase()); return `<button type="button" class="chip${got ? ' have' : ''}" data-act="ph-habit" data-p="${sel}" data-i="${i}" aria-label="${got ? `${esc(h.name)} is already a habit` : `Add ${esc(h.name)} as a habit for this phase`}">${h.emoji} ${esc(h.name)} ${got ? '✓' : '+'}</button>`; }).join('')}</div>
        <div class="hint">Added habits only show up during this phase.</div>
      </div>
    </section>`;
}

function patternsHtml() {
  const counts = {};
  let logs = 0;
  for (const [k, x] of Object.entries(S.cycle.days)) {
    const items = (x.sym || []).concat(x.mood || []);
    if (!items.length) continue;
    const ph = phaseOn(k);
    if (!ph) continue;
    logs++;
    for (const it of items) {
      const c = counts[it] || (counts[it] = { total: 0, by: {} });
      c.total++;
      c.by[ph] = (c.by[ph] || 0) + 1;
    }
  }
  const tops = Object.entries(counts)
    .map(([name, c]) => {
      const by = Object.entries(c.by).sort((a, b) => b[1] - a[1]);
      return { name, total: c.total, ph: by[0][0], n: by[0][1], clear: by[0][1] >= 2 && (!by[1] || by[0][1] > by[1][1]) };
    })
    .filter(x => x.clear)
    .sort((a, b) => b.n - a.n || b.total - a.total)
    .slice(0, 4);
  if (logs < 3 || !tops.length) return '';
  return `<div class="section-title"><div><h2>Your patterns</h2>${squiggle()}</div><span class="hand">from your logs</span></div>
    ${tops.map(x => `<div class="insight"><span class="em" aria-hidden="true">${emojiFor(x.name)}</span><span><b>${esc(x.name)}</b> shows up most in your <b>${PHASES[x.ph].name.toLowerCase()}</b> phase (${x.n} of ${x.total} times).</span></div>`).join('')}`;
}

function timelineHtml(info) {
  const late = info.late > 0 && !info.onPeriod;
  const rows = phaseSpans(info.L, info.P).map(sp => {
    const a = addDays(info.start, sp.a - 1), b = addDays(info.start, sp.b - 1);
    const now = (info.day >= sp.a && info.day <= sp.b) || (late && sp.p === 'luteal');
    const past = !now && info.day > sp.b;
    const ph = PHASES[sp.p];
    return `<div class="tl-row${now ? ' now' : ''}${past ? ' past' : ''}" style="--ph-l:${ph.light}"><span class="em" aria-hidden="true">${ph.emoji}</span><span><b>${ph.name}${now ? ' · now' : ''}</b><small>${ph.short}</small></span><span class="when">${fmtRange(a, b)}</span></div>`;
  });
  const ns = predictedStart(info);
  const away = daysBetween(today(), ns);
  rows.push(`<div class="tl-row"><span class="em" aria-hidden="true">🩸</span><span><b>Next period</b><small>${late ? 'Any day now' : away === 1 ? 'Tomorrow' : `In ${plural(away, 'day')}`}</small></span><span class="when">${fmtDay(ns)}</span></div>`);
  return `<div class="section-title"><div><h2>This cycle</h2>${squiggle()}</div><span class="hand">day ${info.day}${late ? '' : ` of about ${info.L}`}</span></div>
    <div class="timeline">${rows.join('')}</div>`;
}

function calendarHtml() {
  const t = today();
  const m = UI.calMonth || t.slice(0, 7);
  const [y, mo] = m.split('-').map(Number);
  const daysIn = new Date(y, mo, 0).getDate();
  const lead = (dowOf(`${m}-01`) - S.settings.weekStart + 7) % 7;
  const marks = cycleMarks(`${m}-${pad(daysIn)}`);
  const fert = S.cycle.fertile;
  let cells = weekOrder().map(i => `<span class="dow">${WD[i][0]}</span>`).join('');
  for (let i = 0; i < lead; i++) cells += '<span aria-hidden="true"></span>';
  for (let n = 1; n <= daysIn; n++) {
    const k = `${m}-${pad(n)}`;
    const fl = flowOf(k);
    const cls = [], said = [];
    if (k > t) cls.push('fut');
    if (k === t) { cls.push('today'); said.push('today'); }
    if (fl) { cls.push(`f${fl}`); said.push(`${FLOWS[fl].name.toLowerCase()} flow`); } else if (marks.pred.has(k)) { cls.push('pred'); said.push('period predicted'); }
    if (fert && !fl && !marks.pred.has(k) && marks.fert.has(k)) { cls.push('fertile'); said.push('fertile window'); }
    if (fert && !fl && marks.ovu.has(k)) { cls.push('ovu'); said.push('estimated ovulation'); }
    if (hasNotes(k)) { cls.push('logged'); said.push('notes logged'); }
    cells += `<button type="button" class="${cls.join(' ')}" data-act="cal" data-d="${k}" aria-label="${fmtLong(k)}${said.length ? ': ' + said.join(', ') : ''}">${n}</button>`;
  }
  const maxM = (() => { const d = new Date(); d.setMonth(d.getMonth() + 6); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; })();
  return `<div class="section-title"><div><h2>Calendar</h2>${squiggle()}</div><span class="hand">tap a day to log it</span></div>
    <section class="card cal-card">
      <div class="cal-head"><button type="button" class="icon-btn" data-act="mon" data-d="-1" aria-label="Previous month">${icon('chev-l')}</button><h3>${MON_LONG[mo - 1]} ${y}</h3><button type="button" class="icon-btn" data-act="mon" data-d="1" aria-label="Next month" ${m >= maxM ? 'disabled' : ''}>${icon('chev-r')}</button></div>
      <div class="cal">${cells}</div>
      <div class="legend"><span><i class="lp"></i>Period</span><span><i class="lpred"></i>Predicted</span>${fert ? '<span><i class="lf"></i>Fertile</span><span><i class="lo">✦</i>Ovulation</span>' : ''}<span><i class="ll"></i>Notes</span></div>
    </section>`;
}

function pastCyclesHtml(info) {
  const past = info.past;
  const rows = [];
  for (let i = past.length - 1; i >= 0 && rows.length < 6; i--) {
    const c = past[i], nx = past[i + 1];
    const len = nx ? daysBetween(c.start, nx.start) : 0;
    const span = nx ? len : Math.max(info.L, info.day);
    const pw = clamp(Math.round((100 * Math.min(c.len, span)) / span), 3, 100);
    const title = nx ? fmtRange(c.start, addDays(nx.start, -1)) : `Since ${fmtShort(c.start)}`;
    const sub = nx ? `${plural(len, 'day')} · period ${plural(c.len, 'day')}` : `Now · day ${info.day} · period ${plural(c.len, 'day')}`;
    rows.push(`<div class="cyc-row"><b>${title}</b><small>${sub}</small><div class="cyc-bar" aria-hidden="true"><span class="p" style="width:${pw}%"></span></div></div>`);
  }
  return `<div class="section-title"><div><h2>Your cycles</h2>${squiggle()}</div><span class="hand">${info.gaps.length ? 'from your logs' : 'log more to learn'}</span></div>
    <div class="avg-grid">
      <div class="avg"><b>${info.avgLen}</b><small>${info.gaps.length ? 'avg cycle' : 'usual cycle'}</small></div>
      <div class="avg"><b>${info.avgP}</b><small>${info.plens.length ? 'avg period' : 'usual period'}</small></div>
      <div class="avg"><b>${past.length}</b><small>${past.length === 1 ? 'period logged' : 'periods logged'}</small></div>
    </div>
    <div class="cycle-list" style="margin-top:12px">${rows.join('')}</div>`;
}

VIEWS.cycle = {
  title: 'Cycle',
  render() {
    const info = cycleInfo();
    let html = info.has ? heroCycle(info) : setupHero();
    html += phaseSection(info);
    if (info.has) html += patternsHtml() + timelineHtml(info);
    html += calendarHtml();
    if (info.has) html += pastCyclesHtml(info);
    html += '<p class="disclaimer">Predictions are estimates from what you log. They aren’t medical advice and aren’t a form of contraception. If something feels off, talk to a doctor.</p>';
    return html;
  },
  act: {
    start() { openPeriodStart(); },
    end() { openPeriodEnd(); },
    log(a) { openDayLog(a.dataset.d || today()); },
    still() {
      const t = today();
      setFlow(t, Math.max(2, flowOf(t)), false);
      save();
      render();
      toast('Logged a light flow for today 💧', { action: { label: 'Change', fn: () => openDayLog(t) } });
    },
    ph(a) { UI.phaseTab = a.dataset.p; render(); },
    'ph-habit'(a) {
      const p = a.dataset.p, it = PHASES[p].habits[+a.dataset.i];
      if (liveHabits().some(h => h.name.toLowerCase() === it.name.toLowerCase())) { toast(`${it.emoji} “${esc(it.name)}” is already one of your habits`); return; }
      const nh = normHabit({ id: uid(), name: it.name, emoji: it.emoji, coins: it.coins, color: it.color, target: 1, phase: p, created: today() });
      S.habits.push(nh);
      save();
      render();
      toast(`${it.emoji} Added — it’ll show up in your ${PHASES[p].name.toLowerCase()} phase`, { undo: () => { S.habits = S.habits.filter(h => h.id !== nh.id); save(); render(); } });
    },
    mon(a) {
      const [y, mo] = (UI.calMonth || today().slice(0, 7)).split('-').map(Number);
      const d = new Date(y, mo - 1 + +a.dataset.d, 1);
      UI.calMonth = `${d.getFullYear()}-${pad(d.getMonth() + 1)}`;
      render();
    },
    cal(a) {
      const k = a.dataset.d;
      if (k <= today()) { openDayLog(k); return; }
      const m = cycleMarks(k);
      const what = flowOf(k) ? 'pencilled in as a period day' : m.pred.has(k) ? 'period predicted' : S.cycle.fertile && m.ovu.has(k) ? 'estimated ovulation' : S.cycle.fertile && m.fert.has(k) ? 'estimated fertile day' : 'nothing predicted';
      const ph = phaseOn(k);
      toast(`${fmtDay(k)}: ${what}${ph ? ` · ${PHASES[ph].name.toLowerCase()} phase` : ''}`);
    },
  },
};

/* ---------- sheets ---------- */
function flowPick(cur, only) {
  const list = FLOWS.filter(f => !only || only.includes(f.v));
  return `<div class="flow-pick" style="grid-template-columns:repeat(${list.length},1fr)">${list.map(f => `<button type="button" class="${cur === f.v ? 'on' : ''}" data-act="flow" data-v="${f.v}" aria-pressed="${cur === f.v}"><span class="drops-ico" aria-hidden="true">${f.v === 1 ? '<i class="tiny"></i>' : '<i></i>'.repeat(f.drops)}</span>${f.name}</button>`).join('')}</div>`;
}

function openPeriodStart() {
  const t = today();
  let d = t, flow = 3;
  const P = cycleInfo().avgP;
  const tpl = () => `${sheetHead('Period started')}
    <p class="lead">When did it start? We’ll pencil in ${P > 1 ? `the next ${plural(P - 1, 'day')}` : 'that day'} from your usual length — you can change any day later.</p>
    <div class="field"><span class="label">Started</span>
      <div class="chips" style="--chip-on:var(--blush)">${[0, 1, 2].map(i => { const k = addDays(t, -i); return `<button type="button" class="chip${d === k ? ' on' : ''}" data-act="when" data-d="${k}" aria-pressed="${d === k}">${i === 0 ? 'Today' : i === 1 ? 'Yesterday' : fmtDay(k)}</button>`; }).join('')}</div>
      <input class="input" type="date" name="date" max="${t}" value="${d}" style="margin-top:10px" aria-label="Start date"></div>
    <div class="field"><span class="label">Flow that day</span>${flowPick(flow, [2, 3, 4])}</div>
    <div class="btn-row"><button type="button" class="btn ghost" data-close>Cancel</button><button type="button" class="btn pink" data-act="ok">${icon('check')} Log it</button></div>`;
  openSheet(tpl(), {
    label: 'Period started',
    act: {
      when(a, e, sh) { d = a.dataset.d; sh.set(tpl()); },
      flow(a, e, sh) { flow = +a.dataset.v; sh.set(tpl()); },
      ok(a, e, sh) {
        if (!isKey(d) || d > t) { toast('Pick a day up to today'); return; }
        const filled = logPeriodStart(d, flow);
        save();
        sh.close();
        UI.calMonth = null;
        UI.phaseTab = null;
        if (routeName() !== 'cycle') location.hash = '#/cycle'; else render();
        toast(`Logged 💗${filled ? ` Pencilled in ${plural(filled, 'more day')}.` : ''}`);
      },
    },
    change(e, sh) {
      const v = e.target.value;
      if (e.target.name === 'date' && isKey(v)) { d = v > t ? t : v; sh.set(tpl()); }
    },
  });
}

function openPeriodEnd() {
  const info = cycleInfo();
  if (!info.cur) return;
  const t = today();
  const opts = [t, addDays(t, -1), addDays(t, -2)].filter(k => k >= info.cur.start);
  let e = opts[0];
  const tpl = () => `${sheetHead('Period ended')}
    <p class="lead">What was your last day of bleeding? Any pencilled-in days after it will be cleared.</p>
    <div class="field"><div class="chips" style="--chip-on:var(--blush)">${opts.map((k, i) => `<button type="button" class="chip${e === k ? ' on' : ''}" data-act="when" data-d="${k}" aria-pressed="${e === k}">${i === 0 ? 'Today' : i === 1 ? 'Yesterday' : fmtDay(k)}</button>`).join('')}</div>
      <input class="input" type="date" name="date" min="${info.cur.start}" max="${t}" value="${e}" style="margin-top:10px" aria-label="Last day"></div>
    <div class="btn-row"><button type="button" class="btn ghost" data-close>Cancel</button><button type="button" class="btn pink" data-act="ok">${icon('check')} Save</button></div>`;
  openSheet(tpl(), {
    label: 'Period ended',
    act: {
      when(a, ev, sh) { e = a.dataset.d; sh.set(tpl()); },
      ok(a, ev, sh) {
        if (!isKey(e) || e < info.cur.start || e > t) { toast('Pick a day during this period'); return; }
        logPeriodEnd(e);
        save();
        sh.close();
        render();
        toast(`Got it — period ended ${relDay(e)} 🌱`);
      },
    },
    change(ev, sh) {
      const v = ev.target.value;
      if (ev.target.name === 'date' && isKey(v)) { e = v > t ? t : v < info.cur.start ? info.cur.start : v; sh.set(tpl()); }
    },
  });
}

function openDayLog(d) {
  const t = today();
  if (d > t) { toast('You can log days up to today'); return; }
  const orig = S.cycle.days[d] ? JSON.parse(JSON.stringify(S.cycle.days[d])) : null;
  const x = orig || {};
  const f = { flow: x.flow || 0, sym: (x.sym || []).slice(), mood: (x.mood || []).slice(), note: x.note || '' };
  const origFlow = f.flow;
  const ph = phaseOn(d);
  const toggle = (list, v) => (list.includes(v) ? list.filter(i => i !== v) : list.concat(v));
  const tpl = () => `${sheetHead(d === t ? 'Today' : fmtLong(d))}
    ${ph ? `<p class="lead">${PHASES[ph].emoji} ${PHASES[ph].name} phase${d === t ? '' : ` · ${fmtDay(d)}`}</p>` : ''}
    <div class="field"><span class="label">Flow</span>${flowPick(f.flow)}
      ${x.auto && f.flow === origFlow ? '<div class="hint">Pencilled in from your usual period length — change it if it’s not right.</div>' : ''}</div>
    <div class="field"><span class="label">Symptoms</span><div class="chips" style="--chip-on:var(--blush)">${SYMPTOMS.map(([n, em]) => `<button type="button" class="chip${f.sym.includes(n) ? ' on' : ''}" data-act="sym" data-n="${n}" aria-pressed="${f.sym.includes(n)}">${em} ${n}</button>`).join('')}</div></div>
    <div class="field"><span class="label">Mood</span><div class="chips" style="--chip-on:var(--lav)">${MOODS.map(([n, em]) => `<button type="button" class="chip${f.mood.includes(n) ? ' on' : ''}" data-act="mood" data-n="${n}" aria-pressed="${f.mood.includes(n)}">${em} ${n}</button>`).join('')}</div></div>
    <div class="field"><label for="dl-note">Notes</label><textarea id="dl-note" class="input" name="note" maxlength="1000" placeholder="Anything worth remembering?">${esc(f.note)}</textarea></div>
    <div class="btn-row"><button type="button" class="btn ghost" data-close>Cancel</button><button type="button" class="btn pink" data-act="ok">${icon('check')} Save</button></div>
    ${orig ? `<div class="btn-row" style="margin-top:10px"><button type="button" class="btn ghost" data-act="clear">${icon('trash')} Clear this day</button></div>` : ''}`;
  openSheet(tpl(), {
    label: `Log ${fmtLong(d)}`,
    act: {
      flow(a, e, sh) { f.flow = +a.dataset.v; sh.set(tpl()); },
      sym(a, e, sh) { f.sym = toggle(f.sym, a.dataset.n); sh.set(tpl()); },
      mood(a, e, sh) { f.mood = toggle(f.mood, a.dataset.n); sh.set(tpl()); },
      ok(a, e, sh) {
        const before = periodClusters().map(c => c.start);
        const next = {};
        if (f.flow) next.flow = f.flow;
        if (f.flow && x.auto && f.flow === origFlow) next.auto = 1;
        if (f.sym.length) next.sym = f.sym;
        if (f.mood.length) next.mood = f.mood;
        const note = f.note.trim();
        if (note) next.note = note;
        if (isEmptyLog(next)) delete S.cycle.days[d]; else S.cycle.days[d] = next;
        save();
        sh.close();
        render();
        const started = f.flow >= 2 && !before.includes(d) && periodClusters().some(c => c.start === d && c.n === 1) && d >= addDays(t, -3);
        if (started && cycleInfo().avgP > 1) {
          toast('Saved 💗 Is this the start of a period?', { action: { label: 'Pencil in the rest', fn: () => { const n = logPeriodStart(d, f.flow); save(); render(); toast(`Pencilled in ${plural(n, 'more day')} 🌸`); } } });
        } else toast('Saved 💗');
      },
      clear(a, e, sh) {
        delete S.cycle.days[d];
        save();
        sh.close();
        render();
        toast(`Cleared ${fmtDay(d)}`, { undo: () => { S.cycle.days[d] = orig; save(); render(); } });
      },
    },
    input(e) { if (e.target.name === 'note') f.note = e.target.value; },
  });
}
