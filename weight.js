/* Little Grove — Weight: one number a day if you like, and how it changes over time. Shown in calm, neutral
   colours: no goals, no red or green, nothing to "fix". */
'use strict';

const WT_RANGES = [['30', '1 month'], ['90', '3 months'], ['365', '1 year'], ['all', 'All']];
const wtSorted = () => S.weights.slice().sort((a, b) => (a.d === b.d ? a.t - b.t : a.d < b.d ? -1 : 1));
const fmtKg = kg => (Math.round(kg * 10) / 10).toFixed(1);
const fmtChange = n => `${n > 0 ? '+' : n < 0 ? '−' : '±'}${fmtKg(Math.abs(n))}\u00a0kg`;
const weightById = id => S.weights.find(w => w.id === id);
function wtInRange(list) {
  if (UI.wtRange === 'all' || !list.length) return list;
  const from = addDays(today(), -(+UI.wtRange - 1));
  return list.filter(w => w.d >= from);
}

// A line through your weigh-ins, with the latest one marked.
function wtChart(list) {
  const W = 320, H = 168, L = 38, R = 14, T = 16, B = 24;
  const xs = list.map(w => fromKey(w.d).getTime()), ys = list.map(w => w.kg);
  let x1 = Math.max(...xs), x0 = Math.min(...xs);
  if (x1 - x0 < 6 * 864e5) x0 = x1 - 6 * 864e5;
  let lo = Math.min(...ys), hi = Math.max(...ys);
  const padK = Math.max(0.5, (hi - lo) * 0.2);
  lo = Math.floor((lo - padK) * 2) / 2;
  hi = Math.ceil((hi + padK) * 2) / 2;
  const X = t => L + ((W - L - R) * (t - x0)) / (x1 - x0), Y = v => T + ((H - T - B) * (hi - v)) / (hi - lo);
  let g = '';
  for (const v of [hi, (hi + lo) / 2, lo]) {
    const y = Y(v);
    g += `<line x1="${L}" x2="${W - R}" y1="${f1(y)}" y2="${f1(y)}" stroke="#d8ccb6" stroke-width="1" stroke-dasharray="3 4"/><text x="${L - 6}" y="${f1(y + 4)}" text-anchor="end">${fmtKg(v)}</text>`;
  }
  const pts = list.map((w, i) => [X(xs[i]), Y(w.kg)]);
  if (pts.length > 1) {
    const line = pts.map((p, i) => `${i ? 'L' : 'M'}${f1(p[0])} ${f1(p[1])}`).join(' ');
    g += `<path d="${line} L${f1(pts[pts.length - 1][0])} ${H - B} L${f1(pts[0][0])} ${H - B}Z" fill="#eee8f8"/>`;
    g += `<path d="${line}" fill="none" stroke="#7d68ad" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  }
  const big = pts.length <= 40;
  pts.forEach((p, i) => {
    const last = i === pts.length - 1;
    if (big || last) g += `<circle cx="${f1(p[0])}" cy="${f1(p[1])}" r="${last ? 5.5 : 3.4}" fill="${last ? '#c9b8e8' : '#fffdf8'}" stroke="#3b3530" stroke-width="${last ? 2.2 : 1.6}"/>`;
  });
  g += `<line x1="${L}" x2="${W - R}" y1="${H - B}" y2="${H - B}" stroke="#3b3530" stroke-width="2" stroke-linecap="round"/>`;
  const dl = t => { const d = new Date(t); return `${d.getDate()} ${MON[d.getMonth()]}`; };
  g += `<text x="${L}" y="${H - 6}" text-anchor="start">${dl(x0)}</text><text x="${W - R}" y="${H - 6}" text-anchor="end">${dl(x1)}</text>`;
  const first = list[0], last = list[list.length - 1];
  return `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Weight from ${fmtKg(first.kg)} kg on ${fmtDay(first.d)} to ${fmtKg(last.kg)} kg on ${fmtDay(last.d)}">${g}</svg>`;
}

function weightHtml() {
  const all = wtSorted();
  const add = `<button type="button" class="btn lav block well-cta" data-act="wadd">${icon('plus')} Add your weight</button>`;
  if (!all.length) {
    return add + `<div class="card empty" style="margin-top:14px"><div class="art-wrap">${ACT_ART.scale}</div><h3>Keep an eye on it, gently</h3>
      <p>Log your weight whenever you like and see how it changes over time. No goals and no judgement, just the trend.</p></div>`;
  }
  const last = all[all.length - 1], list = wtInRange(all), first = list[0];
  const change = list.length > 1 && list[list.length - 1] === last ? last.kg - first.kg : null;
  let html = `<section class="card wt-hero"><div><div class="hand">Latest</div>
      <div class="big">${fmtKg(last.kg)}<small>kg</small></div>
      <div class="sub">${fmtRel(last.d)}${change !== null ? ` · ${fmtChange(change)} since ${fmtShort(first.d)}` : ''}</div></div>
      <div class="wt-art" aria-hidden="true">${ACT_ART.scale}</div></section>` + add;
  const seg = WT_RANGES.map(([k, l]) => `<button type="button" role="tab" class="${UI.wtRange === k ? 'on' : ''}" aria-selected="${UI.wtRange === k}" data-act="wrange" data-r="${k}">${l}</button>`).join('');
  const avg = list.length ? Math.round((sum(list.map(w => w.kg)) / list.length) * 10) / 10 : 0;
  html += `<section class="card chart-card wt-chart"><div class="seg" role="tablist">${seg}</div>
    <div class="chart">${list.length > 1 ? wtChart(list) : `<p class="wt-one">${list.length ? 'Add another day to see a line here.' : 'Nothing logged in this time.'}</p>`}</div>
    <p class="total">${list.length > 1 ? `${plural(list.length, 'weigh-in')} · low ${fmtKg(Math.min(...list.map(w => w.kg)))} · high ${fmtKg(Math.max(...list.map(w => w.kg)))} · average&nbsp;${fmtKg(avg)}&nbsp;kg` : `${plural(list.length, 'weigh-in')} in this time`}</p>
  </section>`;
  const rows = all.slice().reverse(), shown = UI.wtAll ? rows : rows.slice(0, 10);
  html += `<div class="section-title"><div><h2>Weigh-ins</h2>${squiggle('var(--lav)')}</div><span class="hand">tap to edit</span></div>
    <div class="card wt-list">${shown.map(w => {
      const i = all.indexOf(w), prev = i > 0 ? all[i - 1] : null;
      return `<button type="button" class="hrow wrow" data-act="wedit" data-id="${w.id}"><span class="t">${fmtRel(w.d)}${w.note ? `<small>${esc(w.note)}</small>` : ''}</span>
        ${prev ? `<span class="wdiff">${fmtChange(w.kg - prev.kg)}</span>` : ''}<span class="wkg">${fmtKg(w.kg)} <small>kg</small></span></button>`;
    }).join('')}</div>`;
  if (rows.length > shown.length) html += `<button type="button" class="btn ghost block" data-act="wall" style="margin-top:14px">Show all ${rows.length}</button>`;
  return html;
}

Object.assign(VIEWS.wellness.act, {
  wadd() { openWeightSheet(null); },
  wedit(a) { const w = weightById(a.dataset.id); if (w) openWeightSheet(w); },
  wrange(a) { UI.wtRange = a.dataset.r; render(); },
  wall() { UI.wtAll = true; render(); },
});

/* ---------- add or edit a weigh-in ---------- */
function openWeightSheet(w) {
  const isNew = !w, last = wtSorted().pop();
  const f = w ? { d: w.d, note: w.note } : { d: today(), note: '' };
  let txt = w ? fmtKg(w.kg) : last ? fmtKg(last.kg) : '';
  const tpl = () => `${sheetHead(isNew ? 'Add your weight' : 'Edit weigh-in')}<form novalidate>
    ${dayField('When?', f.d)}
    <div class="field"><label for="wt-kg">Weight</label>
      <div class="kg-row"><button type="button" class="kg-step" data-act="kg" data-d="-1" aria-label="0.1 kg less">${icon('minus')}</button>
        <div class="kg-box"><input id="wt-kg" class="input" name="kg" inputmode="decimal" autocomplete="off" maxlength="5" placeholder="e.g. 62.5" value="${esc(txt)}"><span>kg</span></div>
        <button type="button" class="kg-step" data-act="kg" data-d="1" aria-label="0.1 kg more">${icon('plus')}</button></div></div>
    <div class="field"><label for="wt-note">Note <span class="faint">(optional)</span></label>
      <input id="wt-note" class="input" name="note" maxlength="200" placeholder="e.g. After a big weekend" value="${esc(f.note)}" autocomplete="off" enterkeyhint="done"></div>
    <div class="btn-row"><button type="submit" class="btn lav">${icon('check')} Save</button></div>
    ${isNew ? '' : `<div class="btn-row" style="margin-top:10px"><button type="button" class="btn ghost" data-act="del">${icon('trash')} Delete</button></div>`}
  </form>`;
  const shake = sh => { const inp = $('#wt-kg', sh.el); inp.classList.remove('shake'); void inp.offsetWidth; inp.classList.add('shake'); inp.focus(); };
  openSheet(tpl(), {
    label: isNew ? 'Add your weight' : 'Edit weigh-in',
    act: {
      kg(a, e, sh) {
        const v = parseFloat(String(txt).replace(',', '.'));
        const base = isFinite(v) ? v : last ? last.kg : 60;
        txt = fmtKg(clamp(base + (+a.dataset.d) * 0.1, 20, 400));
        const inp = $('#wt-kg', sh.el);
        if (inp) inp.value = txt;
      },
      dpick(a, e, sh) { f.d = a.dataset.d; sh.set(tpl()); },
      del(a, e, sh) {
        sh.close();
        const i = S.weights.indexOf(w);
        if (i < 0) return;
        S.weights.splice(i, 1);
        save();
        render();
        toast(`Deleted ${fmtKg(w.kg)} kg from ${fmtDay(w.d)}`, { undo: () => { if (!weightById(w.id)) S.weights.push(w); save(); render(); } });
      },
    },
    input(e) {
      if (e.target.name === 'kg') txt = e.target.value;
      else if (e.target.name === 'note') f.note = e.target.value;
    },
    change(e, sh) {
      const t = e.target;
      if (t.name === 'day' && isKey(t.value) && t.value <= today()) { f.d = t.value; sh.set(tpl()); }
    },
    submit(e, sh) {
      const dv = dateBoxVal(sh, 'day');
      if (dv && dv <= today()) f.d = dv;
      const kg = Math.round(parseFloat(String(txt).replace(',', '.')) * 10) / 10;
      if (!(kg >= 20 && kg <= 400)) { shake(sh); toast('Pop in your weight in kg, like 62.5'); return; }
      // One weigh-in a day: saving on a day that already has one updates it.
      const other = S.weights.find(x => x.d === f.d && x !== w);
      let msg = 'Saved ✿';
      if (w) {
        Object.assign(w, normWeight(Object.assign({}, w, { d: f.d, kg, note: f.note })));
        if (other) S.weights.splice(S.weights.indexOf(other), 1);
      } else if (other) {
        Object.assign(other, normWeight(Object.assign({}, other, { kg, note: f.note || other.note, t: Date.now() })));
        msg = `Updated ${f.d === today() ? 'today’s' : `${fmtDay(f.d)}’s`} weigh-in`;
      } else {
        S.weights.push(normWeight({ id: uid(), d: f.d, kg, note: f.note, t: Date.now() }));
        msg = `${fmtKg(kg)} kg logged`;
      }
      save();
      sh.close();
      if (routeName() !== 'wellness' || UI.well !== 'weight') location.hash = '#/wellness/weight'; else render();
      toast(msg);
    },
  });
}
