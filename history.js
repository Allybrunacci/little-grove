/* Little Grove — History: everything you've done and spent */
'use strict';

const KIND = { habit: 'Habit', reward: 'Treat', bonus: 'Bonus' };
const FILTERS = [['all', 'All'], ['habit', 'Habits'], ['reward', 'Treats'], ['bonus', 'Bonuses']];

// One row per habit per day (water ×3), and one row per treat or bonus.
function historyRows(es) {
  const rows = [], byHabit = {};
  for (const e of es) {
    if (e.k === 'habit') {
      let r = byHabit[e.ref];
      if (!r) { r = byHabit[e.ref] = { k: 'habit', d: e.d, n: e.n, e: e.e, a: 0, count: 0, t: 0, ids: [] }; rows.push(r); }
      r.a += e.a;
      r.count++;
      r.t = Math.max(r.t, e.t);
      r.ids.push(e.id);
      r.n = e.n;
      r.e = e.e;
    } else rows.push({ k: e.k, d: e.d, n: e.n, e: e.e, a: e.a, count: 1, t: e.t, ids: [e.id] });
  }
  return rows.sort((a, b) => b.t - a.t);
}

function historyRowHtml(r) {
  const logged = dkey(new Date(r.t));
  const later = logged !== r.d ? ` · added ${relDay(logged)}` : '';
  const amt = r.a ? `<span class="amt ${r.a > 0 ? 'plus' : 'minus'}">${signed(r.a)}${COIN}</span>` : '<span class="amt faint">0</span>';
  return `<button type="button" class="hrow" data-act="row" data-ids="${r.ids.join(',')}">
    <span class="e" aria-hidden="true">${r.e}</span>
    <span class="t">${esc(r.n)}${r.count > 1 ? ` <span class="faint">×${r.count}</span>` : ''}<small>${KIND[r.k]} · ${fmtTime(r.t)}${later}</small></span>
    ${amt}
  </button>`;
}

VIEWS.history = {
  title: 'History',
  render() {
    const f = UI.hFilter;
    const t = today(), ws = weekStartOf(t);
    const week = S.ledger.filter(e => e.d >= ws && e.d <= t);
    const wkHabits = week.filter(e => e.k === 'habit').length;
    const wkCoins = sum(week.filter(e => e.a > 0).map(e => e.a));
    const wkTreats = week.filter(e => e.k === 'reward').length;
    const hasBonus = S.ledger.some(e => e.k === 'bonus');
    let html = `<div class="section-title page-title"><div><h1>History</h1>${squiggle('var(--sky)')}</div><span class="hand">everything you’ve grown</span></div>
      <div class="avg-grid">
        <div class="avg"><b>${wkHabits}</b><small>habits this week</small></div>
        <div class="avg"><b>${wkCoins}</b><small>coins this week</small></div>
        <div class="avg"><b>${wkTreats}</b><small>${wkTreats === 1 ? 'treat' : 'treats'} this week</small></div>
      </div>
      <div class="filters" role="tablist">${FILTERS.filter(([k]) => k !== 'bonus' || hasBonus).map(([k, l]) => `<button type="button" class="chip${f === k ? ' on' : ''}" role="tab" aria-selected="${f === k}" data-act="filter" data-f="${k}">${l}</button>`).join('')}</div>`;
    const list = f === 'all' ? S.ledger : S.ledger.filter(e => e.k === f);
    if (!list.length) {
      html += `<div class="card empty" style="margin-top:8px">${bookArt()}<h3>${S.ledger.length ? 'Nothing here yet' : 'Your story starts here'}</h3><p>${f === 'reward' ? 'Treats you claim will show up here.' : 'Tick off a habit and it’ll show up here.'}</p><a class="btn sky" href="${f === 'reward' ? '#/rewards' : '#/today'}">${f === 'reward' ? 'See treats' : 'Go to today'}</a></div>`;
      return html;
    }
    const byDay = new Map();
    for (const e of list) {
      if (!byDay.has(e.d)) byDay.set(e.d, []);
      byDay.get(e.d).push(e);
    }
    const days = Array.from(byDay.keys()).sort().reverse();
    for (const d of days.slice(0, UI.hDays)) {
      const es = byDay.get(d);
      const net = sum(es.map(e => e.a));
      html += `<div class="hday"><div class="hday-head"><span class="hand">${fmtRel(d)}</span><span class="net amt ${net >= 0 ? 'plus' : 'minus'}">${signed(net)}${COIN}</span></div>
        <div class="card">${historyRows(es).map(historyRowHtml).join('')}</div></div>`;
    }
    if (days.length > UI.hDays) html += `<button type="button" class="btn ghost block" data-act="more" style="margin-top:18px">Show older days</button>`;
    return html;
  },
  act: {
    filter(a) { UI.hFilter = a.dataset.f; UI.hDays = 14; render(); },
    more() { UI.hDays += 21; render(); },
    row(a) { openEntrySheet(a.dataset.ids.split(',')); },
  },
};

function openEntrySheet(ids) {
  const es = ids.map(id => S.ledger.find(e => e.id === id)).filter(Boolean).sort((a, b) => a.t - b.t);
  if (!es.length) return;
  const last = es[es.length - 1];
  const total = sum(es.map(e => e.a));
  const kind = last.k;
  const times = es.map(e => fmtTime(e.t)).join(', ');
  const logged = dkey(new Date(last.t));
  let buttons;
  if (kind === 'habit') {
    buttons = es.length > 1
      ? `<button type="button" class="btn ghost" data-act="one">${icon('undo')} Untick one</button><button type="button" class="btn danger" data-act="all">Remove all ${es.length}</button>`
      : `<button type="button" class="btn ghost" data-close>Keep it</button><button type="button" class="btn danger" data-act="all">${icon('undo')} Untick it</button>`;
  } else if (kind === 'reward') {
    buttons = `<button type="button" class="btn ghost" data-close>Keep it</button><button type="button" class="btn danger" data-act="all">${icon('undo')} Refund coins</button>`;
  } else {
    buttons = `<button type="button" class="btn ghost" data-close>Keep it</button><button type="button" class="btn danger" data-act="all">Remove bonus</button>`;
  }
  const undoMsg = removed => {
    const back = removed.reduce((s, e) => s - e.a, 0);
    return `${removed.length > 1 ? `Removed ${removed.length} ticks` : 'Removed'} · ${signed(back)} coins`;
  };
  const remove = (list, sh) => {
    const removed = [];
    for (const e of list) { const g = removeEntry(e.id); if (g) removed.push(g); }
    let bonusGone = null;
    if (kind === 'habit') { const before = calc().bonusDay[last.d]; if (syncBonus(last.d) === 'removed') bonusGone = before; }
    if (kind === 'reward') { const r = rewardById(last.ref); if (r && r.once) r.done = ''; }
    save();
    sh.close();
    render();
    toast(`${undoMsg(removed)}${bonusGone ? ` and the ${bonusGone.a}-coin perfect-day bonus` : ''}`, {
      undo: () => {
        restoreEntries(removed.concat(bonusGone ? [bonusGone] : []));
        if (kind === 'reward') { const r = rewardById(last.ref); if (r && r.once) r.done = last.d; }
        save();
        render();
      },
    });
  };
  openSheet(`${sheetHead(KIND[kind])}
    <div class="big-emoji" aria-hidden="true">${last.e}</div>
    <h3 class="center">${esc(last.n)}${es.length > 1 ? ` ×${es.length}` : ''}</h3>
    <p class="lead center">${fmtLong(last.d)}</p>
    <div class="card" style="margin-top:14px;padding:4px 14px">
      <div class="switch-row"><span><b>Coins</b><small>${kind === 'reward' ? 'spent' : 'earned'}</small></span><span class="amt ${total >= 0 ? 'plus' : 'minus'}">${signed(total)}${COIN}</span></div>
      <div class="switch-row"><span><b>Logged</b><small>${logged === last.d ? times : `${fmtDay(logged)} · ${times}`}</small></span></div>
    </div>
    <div class="btn-row">${buttons}</div>`, {
    label: KIND[kind],
    act: {
      one: (a, e, sh) => remove([last], sh),
      all: (a, e, sh) => remove(es, sh),
    },
  });
}
