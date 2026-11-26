/* Little Grove — Move: log classes, runs, swims and anything else that gets you moving */
'use strict';

const actById = id => ACTIVITIES.find(a => a.id === id) || S.acts.custom.find(a => a.id === id) || null;
const actOf = id => actById(id) || { id, name: 'Something active', art: '', emoji: '✨', min: 30, color: 'sage' };
const visibleActs = () => ACTIVITIES.concat(S.acts.custom).filter(a => !S.acts.hidden.includes(a.id));
const moveById = id => S.moves.find(m => m.id === id);
const movesIn = (a, b) => S.moves.filter(m => m.d >= a && m.d <= b);
const actBlob = a => `<span class="ai" style="--c:${colorOf(a.color)[1]}">${actArtSvg(a)}</span>`;
function fmtDist(n, unit) {
  if (!n) return '';
  return unit === 'm' ? `${Math.round(n).toLocaleString('en-AU')} m` : `${Number(n.toFixed(2))} km`;
}
// Coins a session earned (they're kept in the coin history).
const moveCoinsOf = m => sum(S.ledger.filter(e => e.k === 'move' && e.ref === m.id).map(e => e.a));
// Activities you've done most in the last three months.
function usualActs(n) {
  const from = addDays(today(), -90), count = new Map();
  for (const m of S.moves) if (m.d >= from) count.set(m.act, (count.get(m.act) || 0) + 1);
  const vis = new Set(visibleActs().map(a => a.id));
  return Array.from(count.entries()).filter(([id]) => vis.has(id)).sort((a, b) => b[1] - a[1]).slice(0, n).map(([id]) => actOf(id));
}
function topAct(list) {
  const count = new Map();
  for (const m of list) count.set(m.act, (count.get(m.act) || 0) + 1);
  let best = null, n = 0;
  for (const [id, c] of count) if (c > n) { best = id; n = c; }
  return best ? actOf(best) : null;
}

/* ---------- logging ---------- */
function logMove(f) {
  const m = normMove(Object.assign({}, f, { id: uid(), t: Date.now() }));
  S.moves.push(m);
  const a = actOf(m.act), c = S.settings.moveCoins;
  const entry = c > 0 ? addEntry({ k: 'move', ref: m.id, d: m.d, a: c, n: a.name, e: a.emoji || '✨' }) : null;
  save();
  return { m, entry };
}
// Removes a session and the coins it earned. Returns what's needed to put it back.
function removeMove(m) {
  const i = S.moves.indexOf(m);
  if (i >= 0) S.moves.splice(i, 1);
  const entries = S.ledger.filter(e => e.k === 'move' && e.ref === m.id);
  for (const e of entries) removeEntry(e.id);
  return { m, entries };
}
function restoreMove(gone) {
  if (!moveById(gone.m.id)) S.moves.push(gone.m);
  restoreEntries(gone.entries);
}
function deleteMove(m, after) {
  const gone = removeMove(m);
  save();
  render();
  const back = sum(gone.entries.map(e => e.a));
  toast(`Deleted ${esc(actOf(m.act).name)}${back ? ` · −${back} coins` : ''}`, {
    undo: () => { restoreMove(gone); save(); render(); },
  });
  if (after) after();
}

/* ---------- the Move page ---------- */
function moveHeroHtml() {
  const t = today(), ws = weekStartOf(t), wk = movesIn(ws, addDays(ws, 6));
  const mins = sum(wk.map(m => m.min)), days = new Set(wk.map(m => m.d)).size;
  const top = topAct(wk);
  const cells = Array.from({ length: 7 }, (_, i) => addDays(ws, i)).map(k => {
    const ms = wk.filter(m => m.d === k).sort((a, b) => a.t - b.t);
    const a = ms.length ? actOf(ms[0].act) : null;
    const label = `${fmtLong(k)}: ${ms.length ? ms.map(m => actOf(m.act).name).join(', ') : 'nothing logged'}`;
    return `<div class="md${k === t ? ' today' : ''}${ms.length ? ' on' : ''}${k > t ? ' fut' : ''}" role="img" aria-label="${esc(label)}">
      <span class="dow">${WD[dowOf(k)].slice(0, 2)}</span><span class="dot">${a ? actArtSvg(a) : ''}${ms.length > 1 ? `<b>${ms.length}</b>` : ''}</span></div>`;
  }).join('');
  return `<section class="card move-hero">
    <div class="mh-top"><div><div class="hand">This week</div><h2>${wk.length ? plural(wk.length, 'session') : 'Nothing yet'}</h2>
      <div class="sub">${wk.length ? `${fmtMin(mins)} · ${plural(days, 'active day')}` : 'Every bit of movement counts'}</div></div>
      <div class="mh-art" aria-hidden="true">${top ? actArtSvg(top) : emojiArt('👟')}</div></div>
    <div class="mweek">${cells}</div>
  </section>`;
}

function moveMonthHtml() {
  const t = today(), first = `${t.slice(0, 7)}-01`, list = movesIn(first, t);
  if (!list.length) return '';
  const by = new Map();
  for (const m of list) { const x = by.get(m.act) || { n: 0, min: 0 }; x.n++; x.min += m.min; by.set(m.act, x); }
  const rows = Array.from(by.entries()).sort((a, b) => b[1].min - a[1].min || b[1].n - a[1].n);
  const max = Math.max(1, rows[0][1].min);
  return `<section class="card move-month"><h3>${MON_LONG[fromKey(t).getMonth()]} so far</h3>
    <p class="small muted">${plural(list.length, 'session')} · ${fmtMin(sum(list.map(m => m.min)))} · ${plural(new Set(list.map(m => m.d)).size, 'active day')}</p>
    ${rows.slice(0, 8).map(([id, x]) => {
      const a = actOf(id);
      return `<div class="hstat" style="--c:${colorOf(a.color)[0]}"><span class="e">${actArtSvg(a)}</span><b>${esc(a.name)}</b><span class="pc">${x.n}×</span>
        <div class="bar"><span style="width:${Math.max(4, Math.round((100 * x.min) / max))}%"></span></div><small>${fmtMin(x.min)}</small></div>`;
    }).join('')}
  </section>`;
}

function moveRowHtml(m) {
  const a = actOf(m.act), bits = [fmtMin(m.min)];
  if (m.dist) bits.push(fmtDist(m.dist, a.dist || 'km'));
  if (m.eff) bits.push(EFFORTS[m.eff - 1][1]);
  const fe = MOVE_FEELS.find(x => x[0] === m.feel);
  if (fe) bits.push(`${fe[2]} ${fe[1]}`);
  const coins = moveCoinsOf(m);
  return `<button type="button" class="hrow mrow" data-act="medit" data-id="${m.id}">
    ${actBlob(a)}
    <span class="t">${esc(a.name)}<small>${bits.join(' · ')}</small>${m.note ? `<small class="note">${esc(m.note)}</small>` : ''}</span>
    ${coins ? `<span class="amt plus">+${coins}${COIN}</span>` : ''}
  </button>`;
}

function moveHtml() {
  let html = moveHeroHtml() + `<button type="button" class="btn sage block well-cta" data-act="mlog">${icon('plus')} Log movement</button>`;
  if (!S.moves.length) {
    return html + `<div class="card empty" style="margin-top:14px"><div class="art-wrap">${actArtSvg(actOf('hot-yoga'))}</div><h3>What got you moving?</h3>
      <p>Log classes, runs, swims and walks to see your week take shape${S.settings.moveCoins ? `, and earn ${plural(S.settings.moveCoins, 'coin')} for each one` : ''}.</p>
      <button type="button" class="btn ghost" data-act="macts">Choose your activities</button></div>`;
  }
  html += moveMonthHtml();
  const byDay = new Map();
  for (const m of S.moves.slice().sort((a, b) => (a.d === b.d ? b.t - a.t : a.d < b.d ? 1 : -1))) {
    if (!byDay.has(m.d)) byDay.set(m.d, []);
    byDay.get(m.d).push(m);
  }
  const days = Array.from(byDay.keys());
  html += `<div class="section-title"><div><h2>Recent</h2>${squiggle('var(--mint)')}</div><span class="hand">tap to edit</span></div>`;
  for (const d of days.slice(0, UI.moveDays)) {
    const ms = byDay.get(d);
    html += `<div class="hday"><div class="hday-head"><span class="hand">${fmtRel(d)}</span><span class="net">${fmtMin(sum(ms.map(m => m.min)))}</span></div>
      <div class="card">${ms.map(moveRowHtml).join('')}</div></div>`;
  }
  if (days.length > UI.moveDays) html += `<button type="button" class="btn ghost block" data-act="mmore" style="margin-top:18px">Show older days</button>`;
  html += `<div class="add-wrap"><button type="button" class="add-card" data-act="macts">${icon('edit')} Your activities</button></div>`;
  return html;
}

Object.assign(VIEWS.wellness.act, {
  mlog() { openMoveSheet(null); },
  medit(a) { const m = moveById(a.dataset.id); if (m) openMoveSheet(m); },
  mmore() { UI.moveDays += 21; render(); },
  macts() { openActsSheet(); },
});

/* ---------- log or edit a session ---------- */
const MIN_QUICK = [20, 30, 45, 60, 75, 90];

function openMoveSheet(m, opts = {}) {
  const isNew = !m;
  const f = m
    ? { act: m.act, d: m.d, min: m.min, eff: m.eff, dist: m.dist, feel: m.feel, note: m.note }
    : { act: opts.act || '', d: today(), min: 0, eff: 0, dist: 0, feel: '', note: '' };
  if (f.act && !f.min) f.min = actOf(f.act).min;
  let mode = f.act ? 'form' : 'pick';
  let distTxt = f.dist ? String(f.dist) : '';

  const tile = a => `<button type="button" class="act-tile${f.act === a.id ? ' on' : ''}" data-act="pick" data-a="${a.id}">${actBlob(a)}<span class="an">${esc(a.name)}</span></button>`;
  const pickHtml = () => {
    const vis = visibleActs(), usual = usualActs(6);
    return `<p class="lead">What did you do?</p>
      ${usual.length >= 2 ? `<h4 class="grid-h">Your usual</h4><div class="act-grid">${usual.map(tile).join('')}</div><h4 class="grid-h">Everything</h4>` : ''}
      <div class="act-grid">${vis.map(tile).join('')}</div>
      <div class="btn-row"><button type="button" class="btn ghost" data-act="acts">${icon('edit')} Add your own or hide some</button></div>`;
  };
  const formHtml = () => {
    const a = actOf(f.act), coins = S.settings.moveCoins;
    return `<form novalidate>
      <div class="act-chosen">${actBlob(a)}<b>${esc(a.name)}</b><button type="button" class="btn sm ghost" data-act="change">Change</button></div>
      ${dayField('When?', f.d)}
      <div class="field"><span class="label">How long?</span>${stepper('min', f.min, 'min', 'Minutes')}
        <div class="chips quick-min">${MIN_QUICK.map(n => `<button type="button" class="chip${f.min === n ? ' on' : ''}" data-act="dur" data-v="${n}" ${pressed(f.min === n)}>${n}</button>`).join('')}</div></div>
      ${a.dist ? `<div class="field"><label for="mv-dist">How far? <span class="faint">(optional)</span></label>
        <div class="unit-input"><input id="mv-dist" class="input" name="dist" inputmode="decimal" autocomplete="off" maxlength="8" placeholder="${a.dist === 'm' ? 'e.g. 1500' : 'e.g. 5.2'}" value="${esc(distTxt)}"><span>${a.dist}</span></div></div>` : ''}
      <div class="field"><span class="label">How hard was it? <span class="faint">(optional)</span></span>
        <div class="chips">${EFFORTS.map(([v, l]) => `<button type="button" class="chip${f.eff === v ? ' on' : ''}" data-act="eff" data-v="${v}" ${pressed(f.eff === v)}>${l}</button>`).join('')}</div></div>
      <div class="field"><span class="label">How did you feel after? <span class="faint">(optional)</span></span>
        <div class="chips">${MOVE_FEELS.map(([k, l, e]) => `<button type="button" class="chip${f.feel === k ? ' on' : ''}" data-act="feel" data-k="${k}" ${pressed(f.feel === k)}>${e} ${l}</button>`).join('')}</div></div>
      <div class="field"><label for="mv-note">Note <span class="faint">(optional)</span></label>
        <textarea id="mv-note" class="input" name="note" maxlength="500" rows="2" placeholder="A new move, a PB, how the class felt…">${esc(f.note)}</textarea></div>
      <div class="btn-row"><button type="submit" class="btn sage">${icon('check')} ${isNew ? `Log it${coins ? ` · +${coins}` : ''}` : 'Save'}</button></div>
      ${isNew ? '' : `<div class="btn-row" style="margin-top:10px"><button type="button" class="btn ghost" data-act="del">${icon('trash')} Delete</button></div>`}
    </form>`;
  };
  const tpl = () => sheetHead(isNew ? 'Log movement' : 'Edit movement') + (mode === 'pick' ? pickHtml() : formHtml());

  openSheet(tpl(), {
    label: isNew ? 'Log movement' : 'Edit movement',
    act: {
      pick(a, e, sh) {
        const was = f.act;
        f.act = a.dataset.a;
        if (!was || !f.min || f.min === actOf(was).min) f.min = actOf(f.act).min;
        if (!actOf(f.act).dist) { f.dist = 0; distTxt = ''; }
        mode = 'form';
        sh.set(tpl());
        sh.el.scrollTop = 0;
      },
      change(a, e, sh) { mode = 'pick'; sh.set(tpl()); sh.el.scrollTop = 0; },
      acts() { openActsSheet(() => openMoveSheet(m, { act: f.act })); },
      dpick(a, e, sh) { f.d = a.dataset.d; sh.set(tpl()); },
      step(a, e, sh) { f.min = clamp(stepValue(f.min, +a.dataset.d, [[60, 5], [Infinity, 15]]), 5, 600); sh.set(tpl()); },
      dur(a, e, sh) { f.min = +a.dataset.v; sh.set(tpl()); },
      eff(a, e, sh) { const v = +a.dataset.v; f.eff = f.eff === v ? 0 : v; sh.set(tpl()); },
      feel(a, e, sh) { const k = a.dataset.k; f.feel = f.feel === k ? '' : k; sh.set(tpl()); },
      del(a, e, sh) { sh.close(); deleteMove(m); },
    },
    input(e) {
      const t = e.target;
      if (t.name === 'note') f.note = t.value;
      else if (t.name === 'dist') distTxt = t.value;
    },
    change(e, sh) {
      const t = e.target;
      if (t.name === 'day' && isKey(t.value) && t.value <= today()) { f.d = t.value; sh.set(tpl()); }
    },
    submit(e, sh) {
      if (!f.act) return;
      const dv = dateBoxVal(sh, 'day');
      if (dv && dv <= today()) f.d = dv;
      const unit = actOf(f.act).dist;
      const dist = unit ? parseFloat(String(distTxt).replace(',', '.')) : 0;
      if (unit && distTxt.trim() && !(dist >= 0 && isFinite(dist))) {
        const inp = $('#mv-dist', sh.el);
        inp.classList.remove('shake');
        void inp.offsetWidth;
        inp.classList.add('shake');
        return;
      }
      f.dist = unit && dist > 0 ? dist : 0;
      f.min = clamp(f.min || actOf(f.act).min, 1, 600);
      if (isNew) {
        const { m: nm, entry } = logMove(f);
        sh.close();
        if (routeName() !== 'wellness' || UI.well !== 'move') location.hash = '#/wellness/move'; else render();
        const row = $(`.mrow[data-id="${nm.id}"]`);
        if (row) {
          row.classList.add('just');
          if (entry) popAt(row.querySelector('.ai'), entry.a);
          burstAt(row.querySelector('.ai'), [colorOf(actOf(nm.act).color)[0], '#f6d365', '#f4b9b2', '#c9b8e8']);
        }
        buzz([10, 30, 10]);
        toast(`${esc(actOf(nm.act).name)} logged!${entry ? ` +${plural(entry.a, 'coin')}` : ''}`, {
          undo: () => { removeMove(nm); save(); render(); },
        });
        return;
      }
      const a = actOf(f.act);
      Object.assign(m, normMove(Object.assign({}, m, f)));
      for (const en of S.ledger) if (en.k === 'move' && en.ref === m.id) { en.d = m.d; en.n = a.name; en.e = a.emoji || '✨'; }
      REV++;
      save();
      sh.close();
      render();
      toast('Saved ✿');
    },
  });
}

/* ---------- your activities: hide some, add your own ---------- */
function openActsSheet(onDone) {
  const nf = { name: '', emoji: '✨', dist: '', min: 30 };
  let emojiOpen = false;
  const used = id => S.moves.some(m => m.act === id);
  const tpl = () => `${sheetHead('Your activities')}
    <p class="lead">Switch off the ones you don’t do so the list stays short. Your past sessions keep them either way.</p>
    <div class="card acts-list">${ACTIVITIES.map(a => `<label class="switch-row act-row">${actBlob(a)}<span><b>${esc(a.name)}</b></span>
        <span class="switch"><input type="checkbox" name="show" value="${a.id}" ${S.acts.hidden.includes(a.id) ? '' : 'checked'}><span></span></span></label>`).join('')}
      ${S.acts.custom.filter(a => !S.acts.hidden.includes(a.id)).map(a => `<div class="switch-row act-row">${actBlob(a)}<span><b>${esc(a.name)}</b><small>Your own${a.dist ? ` · ${a.dist}` : ''}</small></span>
        <button type="button" class="icon-btn flat" data-act="cdel" data-a="${a.id}" aria-label="Remove ${esc(a.name)}">${icon('trash')}</button></div>`).join('')}</div>
    <div class="set-group"><h3>Add your own</h3><form class="card pad" novalidate>
      <div class="input-row"><button type="button" class="emoji-btn" data-act="emo" aria-label="Choose an emoji" aria-expanded="${emojiOpen}">${nf.emoji}</button>
        <input class="input" name="cname" maxlength="30" placeholder="e.g. Aerial hoop, Tennis" value="${esc(nf.name)}" autocomplete="off" enterkeyhint="done" aria-label="Activity name"></div>
      ${emojiOpen ? emojiGrid(nf.emoji) : ''}
      <div class="field"><span class="label">Track distance?</span><div class="seg dist-seg" role="radiogroup" aria-label="Track distance">${[['', 'No'], ['km', 'In km'], ['m', 'In metres']].map(([k, l]) => `<button type="button" role="radio" class="${nf.dist === k ? 'on' : ''}" aria-checked="${nf.dist === k}" data-act="cdist" data-k="${k}">${l}</button>`).join('')}</div></div>
      <div class="field"><span class="label">Usual length</span>${stepper('cmin', nf.min, 'min', 'Usual length in minutes')}</div>
      <div class="btn-row"><button type="submit" class="btn sage">${icon('plus')} Add it</button></div>
    </form></div>`;
  openSheet(tpl(), {
    label: 'Your activities',
    act: {
      emo(a, e, sh) { emojiOpen = !emojiOpen; sh.set(tpl()); },
      emoji(a, e, sh) { nf.emoji = a.dataset.e; emojiOpen = false; sh.set(tpl()); },
      cdist(a, e, sh) { nf.dist = a.dataset.k; sh.set(tpl()); },
      step(a, e, sh) { nf.min = clamp(stepValue(nf.min, +a.dataset.d, [[60, 5], [Infinity, 15]]), 5, 600); sh.set(tpl()); },
      cdel(a, e, sh) {
        const id = a.dataset.a, x = actById(id);
        if (!x) return;
        // Ones you've logged stay (hidden) so those sessions keep their name.
        if (used(id)) S.acts.hidden.push(id); else S.acts.custom = S.acts.custom.filter(c => c.id !== id);
        save();
        sh.set(tpl());
        render();
        toast(`Removed ${esc(x.name)}`, {
          undo: () => {
            S.acts.hidden = S.acts.hidden.filter(h => h !== id);
            if (!actById(id)) S.acts.custom.push(x);
            save();
            render();
          },
        });
      },
    },
    input(e) { if (e.target.name === 'cname') nf.name = e.target.value; },
    change(e) {
      const t = e.target;
      if (t.name !== 'show') return;
      S.acts.hidden = t.checked ? S.acts.hidden.filter(h => h !== t.value) : S.acts.hidden.concat(t.value);
      save();
      render();
    },
    submit(e, sh) {
      const name = nf.name.trim();
      if (!name) {
        const inp = $('input[name=cname]', sh.el);
        inp.classList.remove('shake');
        void inp.offsetWidth;
        inp.classList.add('shake');
        inp.focus();
        return;
      }
      S.acts = normActs({ custom: S.acts.custom.concat({ id: 'c-' + uid(), name, emoji: nf.emoji, dist: nf.dist, min: nf.min }), hidden: S.acts.hidden });
      save();
      Object.assign(nf, { name: '', emoji: '✨', dist: '', min: 30 });
      sh.set(tpl());
      render();
      toast(`Added ${esc(name)} ✿`);
    },
    onClose() { if (onDone) setTimeout(onDone, 240); },
  });
}
