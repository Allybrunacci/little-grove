/* Little Grove — Wellness: Move, Meals and Weight in one place (in place of the old History tab) */
'use strict';

const WELL_SUBS = [['move', 'Move'], ['meals', 'Meals'], ['weight', 'Weight']];
const WELL_LINES = { move: 'move in ways you love', meals: 'no calories, just noticing', weight: 'one number, not the whole story' };
const wellArt = k => (k === 'move' ? emojiArt('👟') : k === 'meals' ? emojiArt('🥗') : ACT_ART.scale);

/* ---------- small shared bits ---------- */
// 45 → "45 min", 90 → "1 h 30 min"
function fmtMin(n) {
  n = Math.round(n || 0);
  if (n < 60) return `${n} min`;
  const h = Math.floor(n / 60), m = n % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}
const nowTm = () => { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
function fmtTm(tm) {
  const [h, m] = String(tm || '12:00').split(':').map(Number);
  return `${h % 12 || 12}:${pad(m)} ${h < 12 ? 'am' : 'pm'}`;
}
// Today, Yesterday, or another day: a date box sits invisibly over the last chip, so a tap opens the phone's own picker.
function dayField(label, d) {
  const t = today(), y = addDays(t, -1), other = d !== t && d !== y;
  return `<div class="field"><span class="label">${label}</span><div class="chips day-chips">
    <button type="button" class="chip${d === t ? ' on' : ''}" data-act="dpick" data-d="${t}" ${pressed(d === t)}>Today</button>
    <button type="button" class="chip${d === y ? ' on' : ''}" data-act="dpick" data-d="${y}" ${pressed(d === y)}>Yesterday</button>
    <label class="chip date-chip${other ? ' on' : ''}">${other ? fmtDay(d) : 'Another day'}<input type="date" name="day" max="${t}" value="${d}" aria-label="Pick a day"></label>
  </div></div>`;
}
// On save, take whatever the date box says: where there's no date picker it's a text box, and its change only fires on blur.
function dateBoxVal(sh, name) {
  const inp = $(`input[name="${name}"]`, sh.el);
  return inp && isKey(inp.value) ? inp.value : '';
}
// On a computer, clicking the date box opens its calendar too (phones do this by themselves).
function showDatePicker(e) {
  const inp = e.target.closest && e.target.closest('input[type="date"]');
  if (!inp || !inp.showPicker || !(window.matchMedia && matchMedia('(pointer: fine)').matches)) return;
  try { inp.showPicker(); } catch (err) { /* opens on its own */ }
}
document.addEventListener('click', showDatePicker);

/* ---------- the page ---------- */
VIEWS.wellness = {
  title: 'Wellness',
  render() {
    const want = routeSub();
    const sub = WELL_SUBS.some(s => s[0] === want) ? want : UI.well;
    UI.well = sub;
    let html = `<div class="section-title page-title"><div><h1>Wellness</h1>${squiggle('var(--mint)')}</div><span class="hand">${WELL_LINES[sub]}</span></div>
      <div class="seg well-seg" role="tablist" aria-label="Wellness">${WELL_SUBS.map(([k, l]) => `<button type="button" role="tab" class="${sub === k ? 'on' : ''}" aria-selected="${sub === k}" data-act="wsub" data-s="${k}"><span class="ws-ic" aria-hidden="true">${wellArt(k)}</span>${l}</button>`).join('')}</div>`;
    html += sub === 'meals' ? mealsHtml() : sub === 'weight' ? weightHtml() : moveHtml();
    return html;
  },
  after(view) { fillPhotos(view); },
  act: {
    wsub(a) {
      const s = a.dataset.s;
      if (s === UI.well && routeSub() === s) return;
      UI.well = s;
      try { history.replaceState(null, '', `#/wellness/${s}`); } catch (e) { /* file:// */ }
      render(true);
    },
  },
};
