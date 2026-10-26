/* Little Grove — Today: tick off habits and earn coins */
'use strict';

const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

const plantStage = p => growth(p);

function greeting() {
  const h = new Date().getHours();
  const g = h < 5 ? 'Hi, night owl' : h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  return S.name ? `${g}, ${esc(S.name)}` : g;
}

function dayRing(pct, gold) {
  const r = 15, c = 2 * Math.PI * r;
  const arc = pct > 0
    ? `<circle cx="18" cy="18" r="${r}" fill="none" stroke="${gold ? 'var(--gold)' : 'var(--sage)'}" stroke-width="3.6" stroke-linecap="round" stroke-dasharray="${(c * Math.min(1, pct)).toFixed(1)} ${c.toFixed(1)}" transform="rotate(-90 18 18)"/>`
    : '';
  return `<svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="${r}" fill="none" stroke="var(--paper-3)" stroke-width="3.6"/>${arc}</svg>`;
}

function meterNote(p, stage, isToday) {
  if (p.perfect) return `✿ Perfect day${S.settings.bonus ? ` · +${S.settings.bonus} bonus coins` : ''}`;
  if (stage >= 4) return `✿ In bloom · ${plural(p.n - p.full, 'more habit')} for a perfect day`;
  if (!isToday) return `${Math.round(p.pct * 100)}% done`;
  const need = toBloom(p);
  return `${need} more ${need === 1 ? 'tick' : 'ticks'} to bloom`;
}

function heroHtml(d, p, stage) {
  const t = today(), isToday = d === t;
  const earned = calc().earnedDay[d] || 0;
  const pct = Math.round(p.pct * 100);
  let title;
  if (!isToday) title = fmtDay(d);
  else if (!liveHabits().length) title = 'Let’s plant something';
  else if (!p.n) title = p.any ? 'A bonus bloom on a rest day' : 'A rest day';
  else if (p.perfect) title = 'A perfect day!';
  else if (stage >= 4) title = 'You bloomed today!';
  else if (!p.got) title = 'Let’s grow today';
  else title = `${p.full} of ${p.n} done`;
  const first = isToday ? `<span>${fmtDay(d)}</span>` : `<span>${p.n ? `${p.full} of ${p.n} done` : 'Rest day'}</span>`;
  const mark = Math.round(bloomAt() * 100);
  const meter = p.n
    ? `<div class="meter-wrap">
        <div class="meter${p.got ? '' : ' zero'}${p.perfect ? ' gold' : ''}" role="progressbar" aria-label="Habits done" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}"><span style="width:${pct}%"></span></div>
        ${mark < 100 ? `<span class="bloom-mark${stage >= 4 ? ' on' : ''}" style="left:${mark}%" title="Blooms at ${mark}%">${bloomMark()}</span>` : ''}
      </div>
      <div class="meter-note">${meterNote(p, stage, isToday)}</div>`
    : '';
  return `<section class="card hero${isToday ? '' : ' past'}">
    <div>
      <div class="hello hand">${isToday ? greeting() : 'Looking back at'}</div>
      <h1>${title}</h1>
      <div class="sub">${first}${earned ? coinTag(`+${earned}`) : ''}</div>
      ${meter}
      ${isToday ? '' : `<button type="button" class="btn sm back" data-act="today">${icon('undo')} Back to today</button>`}
    </div>
    ${plantArt(stage)}
  </section>`;
}

function phaseChip(d) {
  if (!cycleOn()) return '';
  const info = cycleInfo();
  if (!info.has) {
    return `<a class="phase-chip" href="#/cycle" style="--chip-c:var(--blush-l)"><span class="em" aria-hidden="true">🌙</span><span><b>Track your cycle</b>Tips for what to focus on in each phase</span>${icon('chev-r')}</a>`;
  }
  const p = phaseOn(d);
  if (!p) return '';
  const ph = PHASES[p];
  let label = `${ph.name} phase`, short = ph.short;
  if (d === today()) {
    if (info.onPeriod) label = `Period · day ${info.day}`;
    else if (info.late) label = `Period ${plural(info.late, 'day')} late`;
    else label = `${ph.name} phase · day ${info.day}`;
    short = STAGES[stageKey(info)].short;
  }
  return `<a class="phase-chip" href="#/cycle" style="--chip-c:${ph.light}"><span class="em" aria-hidden="true">${ph.emoji}</span><span><b>${label}</b>${short}</span>${icon('chev-r')}</a>`;
}

function weekHtml(sel) {
  const t = today();
  const thisWs = weekStartOf(t);
  const ws = UI.week || weekStartOf(sel);
  const label = ws === thisWs ? 'This week' : ws === addDays(thisWs, -7) ? 'Last week' : fmtRange(ws, addDays(ws, 6));
  const days = Array.from({ length: 7 }, (_, i) => addDays(ws, i)).map(k => {
    const fut = k > t, before = k < S.created;
    const off = fut || before;
    const p = off ? null : dayProgress(k);
    const pct = !p ? 0 : p.n ? p.pct : p.any ? 1 : 0;
    const g = p ? growth(p) : 0;
    const cls = `day${k === sel ? ' sel' : ''}${k === t ? ' today' : ''}${p && p.perfect ? ' perfect' : g === 4 ? ' bloom' : ''}`;
    const aria = off ? `${fmtLong(k)}${before ? ', before you started' : ''}` : `${fmtLong(k)}: ${p.n ? `${p.full} of ${p.n} done` : 'rest day'}${p.perfect ? ', a perfect day' : g === 4 ? ', in bloom' : ''}`;
    return `<button type="button" class="${cls}" data-act="day" data-d="${k}" ${off ? 'disabled' : ''} aria-pressed="${k === sel}" aria-label="${aria}">
      <span class="dow">${WD[dowOf(k)].slice(0, 2)}</span><span class="ring">${dayRing(pct, p && p.perfect)}<b>${fromKey(k).getDate()}</b></span></button>`;
  }).join('');
  return `<div class="week-head"><span class="hand">${label}</span><div class="arrows">
      <button type="button" class="icon-btn" data-act="wk" data-d="-7" aria-label="Previous week" ${ws <= weekStartOf(S.created) ? 'disabled' : ''}>${icon('chev-l')}</button>
      <button type="button" class="icon-btn" data-act="wk" data-d="7" aria-label="Next week" ${ws >= thisWs ? 'disabled' : ''}>${icon('chev-r')}</button>
    </div></div>
    <div class="week">${days}</div>`;
}

// The latest day this habit was ticked between a and b.
function lastTickIn(h, a, b) {
  let k = '';
  for (const e of S.ledger) if (e.k === 'habit' && e.ref === h.id && e.d >= a && e.d <= b && e.d > k) k = e.d;
  return k;
}

// "Weekly · due by Sun", "Fortnightly · done Mon" and so on.
function dueTag(h, d, n) {
  const f = FREQS[h.freq], per = periodOf(h, d), t = today();
  if (n >= h.target) {
    const last = h.target === 1 ? lastTickIn(h, per.start, per.end) : '';
    const when = !last ? periodWord(h, d) : last === t ? 'today' : last === addDays(t, -1) ? 'yesterday' : daysBetween(last, t) < 7 ? WD[dowOf(last)] : fmtShort(last);
    return `<span class="due ok">${f.label} · done ${when}</span>`;
  }
  if (per.end < t) return `<span class="due missed">${f.label} · missed</span>`;
  const left = daysBetween(t, per.end);
  const when = left === 0 ? 'due today' : left === 1 ? 'due tomorrow' : left < 7 ? `due by ${WD[dowOf(per.end)]}` : `due by ${fmtShort(per.end)}`;
  return `<span class="due${left <= 1 ? ' soon' : ''}">${f.label} · ${when}</span>`;
}

function habitCard(h, d) {
  const iv = isInterval(h);
  const n = doneFor(h, d), done = n >= h.target, multi = h.target > 1;
  const [c, cl] = colorOf(h.color);
  const streak = d === today() ? habitStreak(h) : 0;
  const meta = [coinTag(`+${h.coins}${multi ? ' each' : ''}`)];
  if (iv) meta.push(dueTag(h, d, n));
  if (multi) meta.push(`<span>${n} / ${h.target}${h.unit ? ' ' + esc(h.unit) : ''}</span>`);
  if (streak >= 2) meta.push(`<span title="${streak} ${iv ? FREQS[h.freq].unit + 's' : 'days'} in a row">🔥 ${streak}</span>`);
  if (h.phase && cycleOn()) meta.push(`<span>${PHASES[h.phase].emoji} ${PHASES[h.phase].name}</span>`);
  let prog = '';
  if (multi) {
    prog = h.target <= 12
      ? `<div class="drops" aria-hidden="true">${Array.from({ length: h.target }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</div>`
      : `<div class="mini-meter" aria-hidden="true"><span style="width:${Math.round((100 * Math.min(n, h.target)) / h.target)}%"></span></div>`;
  }
  const name = esc(h.name);
  const ctl = multi
    ? `<div class="counter">
        <button type="button" class="minus" data-act="minus" aria-label="Take one off ${name}" ${n ? '' : 'disabled'}>${icon('minus')}</button>
        <button type="button" class="check plus" data-act="plus" aria-label="${done ? `${name} is done` : `Add one to ${name}`}">${done ? TICK : icon('plus')}<span class="count">${n}/${h.target}</span></button>
      </div>`
    : `<button type="button" class="check" data-act="toggle" aria-pressed="${done}" aria-label="${done ? 'Untick' : 'Tick off'} ${name}">${TICK}</button>`;
  return `<div class="card habit${done ? ' done' : ''}" style="--c:${c};--cl:${cl}" data-id="${h.id}">
    <div class="blob" aria-hidden="true">${h.emoji}</div>
    <div class="info" data-act="edit" role="button" tabindex="0" aria-label="Edit ${name}">
      <div class="name">${name}</div><div class="meta">${meta.join('')}</div>${prog}
    </div>
    ${ctl}
  </div>`;
}

const habitFromEl = el => { const w = el.closest('[data-id]'); return w ? habitById(w.dataset.id) : null; };

function flashHabit(id) {
  const card = $(`.habit[data-id="${id}"]`);
  if (card) card.classList.add('just');
  return card;
}

function tickHabit(h, d) {
  const before = plantStage(dayProgress(d));
  addEntry({ k: 'habit', ref: h.id, d, a: h.coins, n: h.name, e: h.emoji });
  const bonus = syncBonus(d);
  save();
  buzz(10);
  render();
  const card = flashHabit(h.id);
  if (card) {
    const btn = $('.check', card);
    popAt(btn, h.coins);
    if (doneFor(h, d) >= h.target) burstAt(btn, [colorOf(h.color)[0], '#f6d365', '#f4b9b2', '#c9b8e8']);
  }
  const p = dayProgress(d), after = plantStage(p);
  if (after === 5 && before < 5) {
    setTimeout(() => {
      petals();
      buzz([20, 40, 20]);
      toast(bonus === 'added' ? `🌸 Perfect day! +${S.settings.bonus} bonus coins` : '🌸 A perfect day — everything’s done!');
    }, 380);
  } else if (after === 4 && before < 4 && p.n) {
    setTimeout(() => {
      petals(14, ['🌸', '🌼', '🍃', '✨']);
      buzz([15, 30, 15]);
      toast(`🌸 Your flower bloomed! ${plural(p.n - p.full, 'more habit')} for a perfect day`);
    }, 380);
  }
}

// Takes off the latest tick from day d. For weekly-type habits, if there isn't one that day,
// it takes the latest tick from the rest of that week, fortnight or month.
function untickHabit(h, d) {
  const find = test => {
    for (let i = S.ledger.length - 1; i >= 0; i--) {
      const e = S.ledger[i];
      if (e.k === 'habit' && e.ref === h.id && test(e)) return i;
    }
    return -1;
  };
  let i = find(e => e.d === d);
  if (i < 0 && isInterval(h)) {
    const per = periodOf(h, d);
    i = find(e => e.d >= per.start && e.d <= per.end);
  }
  if (i < 0) return;
  const gone = S.ledger.splice(i, 1)[0];
  REV++;
  const bonus = syncBonus(gone.d);
  save();
  render();
  const card = $(`.habit[data-id="${h.id}"]`);
  if (card) popAt($('.check', card), -gone.a);
  if (gone.d !== d) {
    toast(`Unticked the one from ${fmtDay(gone.d)}${bonus === 'removed' ? ' and that day’s bonus' : ''}`, {
      undo: () => { restoreEntries([gone]); syncBonus(gone.d); save(); render(); },
    });
  } else if (bonus === 'removed') toast('Perfect-day bonus taken back — finish them all to earn it again');
}

VIEWS.today = {
  title: 'Today',
  render() {
    const t = today();
    if (!UI.sel || UI.sel > t || (UI.sel < S.created && S.created <= t)) UI.sel = t;
    const d = UI.sel;
    const live = S.habits.filter(h => existsOn(h, d));
    const sched = live.filter(h => !isInterval(h) && onDay(h, d));
    const every = live.filter(h => isInterval(h) && onDay(h, d)).sort((a, b) => {
      const da = doneFor(a, d) >= a.target, db = doneFor(b, d) >= b.target;
      return da !== db ? (da ? 1 : -1) : periodOf(a, d).end.localeCompare(periodOf(b, d).end);
    });
    const rest = live.filter(h => !onDay(h, d));
    const p = dayProgress(d);
    UI.stageNow = plantStage(p);
    let html = heroHtml(d, p, UI.stageNow) + phaseChip(d) + weekHtml(d);
    if (!liveHabits().length) {
      html += `<div class="card empty" style="margin-top:18px">${canArt()}<h3>Plant your first habit</h3><p>Pick something small you’d like to do more often. Every tick earns coins.</p><button type="button" class="btn sage" data-act="add">${icon('plus')} Add a habit</button></div>`;
      return html;
    }
    if (sched.length || !every.length || live.some(h => !isInterval(h))) {
      html += `<div class="section-title"><div><h2>${d === t ? 'Today’s habits' : `Habits on ${fmtDay(d)}`}</h2>${squiggle()}</div><span class="hand">${sched.length ? (p.perfect ? 'all done ✿' : 'tap to tick') : ''}</span></div>`;
      html += sched.length
        ? `<div class="habits">${sched.map(h => habitCard(h, d)).join('')}</div>`
        : `<div class="card empty"><p style="margin:0">Nothing planned for ${d === t ? 'today' : 'this day'} — enjoy the rest 🌿</p></div>`;
    }
    if (every.length) {
      const left = every.filter(h => doneFor(h, d) < h.target).length;
      html += `<div class="section-title"><div><h2>Every so often</h2>${squiggle('var(--lav)')}</div><span class="hand">${left ? `${left} to go` : 'all done ✿'}</span></div>`;
      html += `<div class="habits">${every.map(h => habitCard(h, d)).join('')}</div>`;
    }
    if (rest.length) {
      html += `<details class="fold"${UI.restOpen ? ' open' : ''}><summary>${icon('chev-r')} Not planned for ${d === t ? 'today' : 'this day'} · ${rest.length}</summary><div class="habits rest-list">${rest.map(h => habitCard(h, d)).join('')}</div></details>`;
    }
    html += `<div class="add-wrap"><button type="button" class="add-card" data-act="add">${icon('plus')} Add a habit</button></div>`;
    return html;
  },
  after(view) {
    const g = $('.hero .grow', view);
    if (g) {
      if (UI.plantStage === UI.stageNow) g.classList.remove('grow');
      else g.addEventListener('animationend', () => g.classList.remove('grow'), { once: true });
    }
    UI.plantStage = UI.stageNow;
    const f = $('details.fold', view);
    if (f) f.addEventListener('toggle', () => { UI.restOpen = f.open; });
  },
  act: {
    toggle(a) {
      const h = habitFromEl(a);
      if (!h) return;
      if (doneFor(h, UI.sel) >= h.target) untickHabit(h, UI.sel); else tickHabit(h, UI.sel);
    },
    plus(a) {
      const h = habitFromEl(a);
      if (!h) return;
      if (doneFor(h, UI.sel) >= h.target) {
        const when = isInterval(h) ? periodWord(h, UI.sel) : UI.sel === today() ? 'today' : 'that day';
        toast(`${h.emoji} Goal reached for ${when}! Tap − to take one off.`);
        return;
      }
      tickHabit(h, UI.sel);
    },
    minus(a) { const h = habitFromEl(a); if (h) untickHabit(h, UI.sel); },
    edit(a) { const h = habitFromEl(a); if (h) openHabitSheet(h); },
    add() { openHabitSheet(null); },
    day(a) { UI.sel = a.dataset.d; UI.week = null; render(); },
    wk(a) {
      const ws = UI.week || weekStartOf(UI.sel);
      const next = addDays(ws, +a.dataset.d);
      if (next > weekStartOf(today()) || next < weekStartOf(S.created)) return;
      UI.week = next;
      render();
    },
    today() { UI.sel = today(); UI.week = null; render(); },
  },
};

/* ---------- add / edit a habit ---------- */
function daysHint(days) {
  if (days.length === 7) return 'Every day';
  const s = days.slice().sort().join();
  if (s === '1,2,3,4,5') return 'Weekdays only';
  if (s === '0,6') return 'Weekends only';
  return `${plural(days.length, 'day')} a week`;
}

function habitIdeasHtml() {
  const have = new Set(liveHabits().map(h => h.name.toLowerCase()));
  return `<div class="ideas">${HABIT_IDEAS.map((g, gi) => `<div class="idea-group"><h4>${g.group}</h4>${g.items.map((it, ii) => {
    const got = have.has(it.name.toLowerCase());
    return `<button type="button" class="idea${got ? ' have' : ''}" data-act="idea" data-g="${gi}" data-i="${ii}">
      <span class="e" aria-hidden="true">${it.emoji}</span>
      <span><b>${esc(it.name)}</b><small>${ideaSub(it)}${got ? ' · already yours' : ''}</small></span>
      <span class="pick">${icon('plus')}</span></button>`;
  }).join('')}</div>`).join('')}</div>`;
}

function openHabitSheet(h, preset) {
  const isNew = !h;
  const f = h
    ? { name: h.name, emoji: h.emoji, coins: h.coins, target: h.target, unit: h.unit, color: h.color, days: h.days.slice(), phase: h.phase, freq: h.freq, anchor: h.anchor }
    : Object.assign({ name: '', emoji: '🌱', coins: 3, target: 1, unit: '', color: COLOR_KEYS[S.habits.length % COLOR_KEYS.length], days: ALL_DAYS.slice(), phase: '', freq: 'day', anchor: today() }, preset || {});
  let mode = isNew && !preset ? 'ideas' : 'form';
  let emojiOpen = false;

  const formHtml = () => {
    const fr = FREQS[f.freq], iv = f.freq !== 'day';
    const earn = f.coins
      ? `Earns ${plural(f.coins, 'coin')} each time${f.target > 1 ? `, up to ${f.coins * f.target} ${fr.per}` : ''}.`
      : 'Worth no coins — just for tracking.';
    const phaseField = cycleOn()
      ? `<div class="field"><span class="label">When in my cycle?</span><div class="chips">${['', ...PHASE_ORDER].map(p => `<button type="button" class="chip${f.phase === p ? ' on' : ''}" data-act="phase" data-p="${p}" aria-pressed="${f.phase === p}">${p ? `${PHASES[p].emoji} ${PHASES[p].name}` : 'Any time'}</button>`).join('')}</div>
        <div class="hint">${f.phase ? `Only shows up in your ${PHASES[f.phase].name.toLowerCase()} phase.` : 'Shows up whatever phase you’re in.'}</div></div>`
      : '';
    const freqField = `<div class="field"><span class="label">How often?</span>
        <div class="seg freq" role="radiogroup" aria-label="How often">${Object.keys(FREQS).map(k => `<button type="button" role="radio" class="${f.freq === k ? 'on' : ''}" aria-checked="${f.freq === k}" data-act="freq" data-f="${k}">${FREQS[k].label}</button>`).join('')}</div>
        ${iv ? `<div class="hint">Do it any day in the ${fr.unit}. It stays on Today until it’s done, and it never counts against a day.</div>` : ''}</div>`;
    let when = '';
    if (!iv) {
      when = `<div class="field"><span class="label">Which days?</span>
        <div class="days-pick">${weekOrder().map(i => `<button type="button" class="${f.days.includes(i) ? 'on' : ''}" data-act="dow" data-i="${i}" aria-pressed="${f.days.includes(i)}" aria-label="${WD_LONG[i]}">${WD[i][0]}</button>`).join('')}</div>
        <div class="hint">${daysHint(f.days)}</div></div>`;
    } else if (f.freq === 'fortnight') {
      const per = periodOf({ freq: 'fortnight', anchor: f.anchor }, today());
      when = `<div class="field"><span class="label">Which fortnight?</span>
        <div class="fort-row"><span>This one runs <b class="nowrap">${fmtRange(per.start, per.end)}</b></span><button type="button" class="btn sm" data-act="shift">Shift a week</button></div></div>`;
    }
    return `<form novalidate>
      <div class="field"><label for="hf-name">What’s the habit?</label>
        <div class="input-row"><button type="button" class="emoji-btn" data-act="emo" aria-label="Choose an emoji" aria-expanded="${emojiOpen}">${f.emoji}</button>
        <input id="hf-name" class="input" name="name" maxlength="60" placeholder="e.g. Drink 1L of water" value="${esc(f.name)}" autocomplete="off" enterkeyhint="done"></div>
        ${emojiOpen ? emojiGrid(f.emoji) : ''}
      </div>
      ${freqField}
      <div class="two-col">
        <div class="field"><span class="label">Coins each time</span>${stepper('coins', f.coins, '', 'Coins each time')}</div>
        <div class="field"><span class="label">Times ${fr.per}</span>${stepper('target', f.target, '', `Times ${fr.per}`)}</div>
      </div>
      ${f.target > 1 ? `<div class="field"><label for="hf-unit">Unit <span class="faint">(optional)</span></label><input id="hf-unit" class="input" name="unit" maxlength="14" placeholder="e.g. L, glasses, pages" value="${esc(f.unit)}" autocomplete="off"></div>` : ''}
      <div class="hint" style="margin-top:8px">${earn}</div>
      ${when}
      ${phaseField}
      <div class="field"><span class="label">Colour</span><div class="swatches">${COLOR_KEYS.map(k => `<button type="button" class="swatch${f.color === k ? ' on' : ''}" style="--sw:${COLORS[k][0]}" data-act="color" data-k="${k}" aria-label="${k}" aria-pressed="${f.color === k}"></button>`).join('')}</div></div>
      <div class="btn-row"><button type="submit" class="btn sage">${isNew ? `${icon('sprout')} Plant it` : `${icon('check')} Save`}</button></div>
      ${isNew ? '' : `<div class="btn-row" style="margin-top:10px"><button type="button" class="btn ghost" data-act="archive">${icon('trash')} Remove habit</button></div>`}
    </form>`;
  };

  const tpl = () => {
    const seg = isNew
      ? `<div class="seg" role="tablist"><button type="button" role="tab" class="${mode === 'ideas' ? 'on' : ''}" aria-selected="${mode === 'ideas'}" data-act="mode" data-m="ideas">Ideas</button><button type="button" role="tab" class="${mode === 'form' ? 'on' : ''}" aria-selected="${mode === 'form'}" data-act="mode" data-m="form">Make my own</button></div>`
      : '';
    const body = mode === 'ideas' ? `<p class="lead">Tap an idea to tweak it before you plant it.</p>${habitIdeasHtml()}` : formHtml();
    return sheetHead(isNew ? 'New habit' : 'Edit habit') + seg + body;
  };

  openSheet(tpl(), {
    label: isNew ? 'New habit' : 'Edit habit',
    act: {
      mode(a, e, sh) { mode = a.dataset.m; sh.set(tpl()); },
      idea(a, e, sh) {
        const it = HABIT_IDEAS[+a.dataset.g].items[+a.dataset.i];
        Object.assign(f, { name: it.name, emoji: it.emoji, coins: it.coins, target: it.target || 1, unit: it.unit || '', color: it.color || f.color, freq: it.freq || 'day' });
        mode = 'form';
        sh.set(tpl());
        sh.el.scrollTop = 0;
      },
      emo(a, e, sh) { emojiOpen = !emojiOpen; sh.set(tpl()); },
      emoji(a, e, sh) { f.emoji = a.dataset.e; emojiOpen = false; sh.set(tpl()); },
      step(a, e, sh) {
        const dir = +a.dataset.d;
        if (a.dataset.name === 'coins') f.coins = clamp(stepValue(f.coins, dir, [[20, 1], [100, 5], [Infinity, 10]]), 0, 500);
        else f.target = clamp(f.target + dir, 1, 50);
        sh.set(tpl());
      },
      dow(a, e, sh) {
        const i = +a.dataset.i;
        if (f.days.includes(i)) {
          if (f.days.length === 1) { toast('Pick at least one day'); return; }
          f.days = f.days.filter(x => x !== i);
        } else f.days.push(i);
        sh.set(tpl());
      },
      phase(a, e, sh) { f.phase = a.dataset.p; sh.set(tpl()); },
      freq(a, e, sh) { f.freq = a.dataset.f; sh.set(tpl()); },
      shift(a, e, sh) { f.anchor = addDays(f.anchor, 7); sh.set(tpl()); },
      color(a, e, sh) { f.color = a.dataset.k; sh.set(tpl()); },
      archive(a, e, sh) {
        h.archived = true;
        h.archivedOn = today();
        save();
        sh.close();
        render();
        toast(`Removed “${esc(h.name)}” — its history is kept`, { undo: () => { h.archived = false; h.archivedOn = ''; save(); render(); } });
      },
    },
    input(e) {
      const t = e.target;
      if (t.name === 'name') f.name = t.value;
      else if (t.name === 'unit') f.unit = t.value;
    },
    submit(e, sh) {
      const name = f.name.trim();
      if (!name) {
        const inp = $('#hf-name', sh.el);
        inp.classList.remove('shake');
        void inp.offsetWidth;
        inp.classList.add('shake');
        inp.focus();
        return;
      }
      if (isNew) {
        const nh = normHabit(Object.assign({}, f, { name, id: uid(), created: today() }));
        S.habits.push(nh);
        save();
        sh.close();
        UI.sel = today();
        UI.week = null;
        if (routeName() !== 'today') location.hash = '#/today'; else render();
        setTimeout(() => flashHabit(nh.id), 30);
        toast(`🌱 Planted “${esc(nh.name)}”`);
      } else {
        Object.assign(h, normHabit(Object.assign({}, h, f, { name })));
        save();
        sh.close();
        render();
        toast('Saved ✿');
      }
    },
  });
}
