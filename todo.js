/* Little Grove — To do: one-off things, ticked off on Today for coins */
'use strict';

const todoById = id => S.todos.find(x => x.id === id);
// Ones with a date first (soonest first), then the rest in the order you added them.
const openTodos = () => S.todos.filter(x => !x.done).sort((a, b) => (a.due || '9999').localeCompare(b.due || '9999') || a.t - b.t);
const todoFromEl = el => { const w = el.closest('[data-tid]'); return w ? todoById(w.dataset.tid) : null; };

function todoDue(x) {
  if (!x.due) return '';
  const t = today(), near = k => (Math.abs(daysBetween(t, k)) < 7 ? WD[dowOf(k)] : fmtShort(k));
  if (x.due < t) return `<span class="due late">Overdue · was due ${near(x.due)}</span>`;
  if (x.due === t) return '<span class="due soon">Due today</span>';
  if (x.due === addDays(t, 1)) return '<span class="due">Due tomorrow</span>';
  return `<span class="due">Due ${near(x.due)}</span>`;
}

function todoRowHtml(x) {
  const done = !!x.done, name = esc(x.text), meta = [];
  if (x.coins) meta.push(coinTag(`+${x.coins}`));
  if (done) meta.push(`<span>Done ${relDay(x.done)}</span>`);
  else if (x.due) meta.push(todoDue(x));
  return `<div class="todo${done ? ' done' : ''}" data-tid="${x.id}">
    <button type="button" class="tcheck" data-act="ttick" aria-pressed="${done}" aria-label="${done ? 'Untick' : 'Tick off'} ${name}">${TICK}</button>
    <div class="tinfo" data-act="tedit" role="button" tabindex="0" aria-label="Edit ${name}"><div class="ttext">${name}</div>${meta.length ? `<div class="tmeta">${meta.join('')}</div>` : ''}</div>
  </div>`;
}

// The To do section at the end of Today.
function todoSectionHtml(d) {
  const t = today();
  if (d !== t) return '';
  const open = openTodos();
  const doneToday = S.todos.filter(x => x.done === t).sort((a, b) => a.doneT - b.doneT);
  const older = S.todos.filter(x => x.done && x.done !== t).sort((a, b) => b.doneT - a.doneT);
  const due = open.filter(x => x.due && x.due <= t).length;
  const note = open.length ? (due ? `${due} due` : `${open.length} to go`) : doneToday.length ? 'all done ✿' : 'one-off things';
  let html = `<div class="section-title todo-title"><div><h2>To do</h2>${squiggle('var(--peach)')}</div><span class="hand">${note}</span></div>`;
  const rows = open.concat(doneToday);
  if (rows.length) html += `<div class="card todo-list">${rows.map(todoRowHtml).join('')}</div>`;
  html += `<div class="add-wrap"><button type="button" class="add-card" data-act="tadd">${icon('plus')} Add a to-do</button></div>`;
  if (older.length) {
    html += `<details class="fold todo-fold"${UI.todoDone ? ' open' : ''}><summary>${icon('chev-r')} Done before today · ${older.length}</summary>
      <div class="card todo-list">${older.slice(0, 40).map(todoRowHtml).join('')}</div>
      <div class="btn-row"><button type="button" class="btn ghost sm" data-act="tclear">${icon('trash')} Clear these from the list</button></div></details>`;
  }
  return html;
}

/* ---------- ticking ---------- */
function tickTodo(x) {
  x.done = today();
  x.doneT = Date.now();
  const entry = x.coins > 0 ? addEntry({ k: 'todo', ref: x.id, d: x.done, a: x.coins, n: x.text, e: '✅' }) : null;
  save();
  buzz([10, 30, 10]);
  render();
  const row = $(`.todo[data-tid="${x.id}"]`);
  if (row) {
    row.classList.add('just');
    const b = $('.tcheck', row);
    if (entry) popAt(b, entry.a);
    burstAt(b, ['#f7c59f', '#f6d365', '#a8c3a0', '#f4b9b2']);
  }
  const cleared = !openTodos().length;
  if (cleared) setTimeout(() => petals(16, ['✅', '✨', '🌼', '🍃']), 300);
  toast(`✅ Done!${entry ? ` +${plural(entry.a, 'coin')}` : ''}${cleared ? ' Your list is clear ✿' : ''}`, {
    undo: () => { untickTodo(x); save(); render(); },
  });
}
// Takes the tick and its coins off. Returns what's needed to put them back.
function untickTodo(x) {
  const was = { done: x.done, doneT: x.doneT, entries: S.ledger.filter(e => e.k === 'todo' && e.ref === x.id) };
  for (const e of was.entries) removeEntry(e.id);
  x.done = '';
  x.doneT = 0;
  return was;
}
function retickTodo(x, was) {
  x.done = was.done;
  x.doneT = was.doneT;
  restoreEntries(was.entries);
}

Object.assign(VIEWS.today.act, {
  tadd() { openTodoSheet(null); },
  tedit(a) { const x = todoFromEl(a); if (x) openTodoSheet(x); },
  ttick(a) {
    const x = todoFromEl(a);
    if (!x) return;
    if (!x.done) { tickTodo(x); return; }
    const was = untickTodo(x);
    save();
    render();
    const back = sum(was.entries.map(e => e.a));
    toast(`Unticked “${esc(x.text)}”${back ? ` · −${back} coins` : ''}`, { undo: () => { retickTodo(x, was); save(); render(); } });
  },
  tclear() {
    const t = today(), gone = S.todos.filter(x => x.done && x.done !== t);
    if (!gone.length) return;
    S.todos = S.todos.filter(x => !gone.includes(x));
    save();
    render();
    toast(`Cleared ${plural(gone.length, 'done to-do')} · coins kept`, { undo: () => { S.todos = S.todos.concat(gone.filter(x => !todoById(x.id))); save(); render(); } });
  },
});

/* ---------- add or edit ---------- */
function openTodoSheet(x) {
  const isNew = !x;
  const f = x ? { text: x.text, due: x.due, coins: x.coins } : { text: '', due: '', coins: S.settings.todoCoins };
  const tpl = () => {
    const t = today(), tm = addDays(t, 1), other = f.due && f.due !== t && f.due !== tm;
    const chip = (v, l) => `<button type="button" class="chip${f.due === v ? ' on' : ''}" data-act="due" data-d="${v}" ${pressed(f.due === v)}>${l}</button>`;
    return `${sheetHead(isNew ? 'New to-do' : 'Edit to-do')}<form novalidate>
      <div class="field"><label for="td-text">What needs doing?</label>
        <input id="td-text" class="input" name="text" maxlength="80" placeholder="e.g. Book the dentist" value="${esc(f.text)}" autocomplete="off" enterkeyhint="done"></div>
      <div class="field"><span class="label">When by? <span class="faint">(optional)</span></span><div class="chips day-chips">
        ${chip('', 'No date')}${chip(t, 'Today')}${chip(tm, 'Tomorrow')}
        <label class="chip date-chip${other ? ' on' : ''}">${other ? fmtDay(f.due) : 'Pick a day'}<input type="date" name="due" min="${t}" value="${f.due || ''}" aria-label="Pick a day"></label></div></div>
      <div class="field"><span class="label">Coins when it’s done</span>${stepper('coins', f.coins, '', 'Coins when it’s done')}</div>
      <div class="btn-row"><button type="submit" class="btn sage">${isNew ? `${icon('plus')} Add it` : `${icon('check')} Save`}</button></div>
      ${isNew ? '' : `<div class="btn-row" style="margin-top:10px"><button type="button" class="btn ghost" data-act="del">${icon('trash')} Delete to-do</button></div>`}
    </form>`;
  };
  openSheet(tpl(), {
    label: isNew ? 'New to-do' : 'Edit to-do',
    onOpen(sh) { if (isNew) { const inp = $('#td-text', sh.el); if (inp) inp.focus({ preventScroll: true }); } },
    act: {
      due(a, e, sh) { f.due = a.dataset.d; sh.set(tpl()); },
      step(a, e, sh) { f.coins = clamp(stepValue(f.coins, +a.dataset.d, [[20, 1], [100, 5]]), 0, 100); sh.set(tpl()); },
      del(a, e, sh) {
        sh.close();
        const i = S.todos.indexOf(x);
        if (i < 0) return;
        S.todos.splice(i, 1);
        save();
        render();
        toast(`Deleted “${esc(x.text)}”${x.done ? ' · coins kept' : ''}`, { undo: () => { if (!todoById(x.id)) S.todos.splice(Math.min(i, S.todos.length), 0, x); save(); render(); } });
      },
    },
    input(e) { if (e.target.name === 'text') f.text = e.target.value; },
    change(e, sh) {
      const t = e.target;
      if (t.name === 'due' && isKey(t.value)) { f.due = t.value; sh.set(tpl()); }
    },
    submit(e, sh) {
      const text = f.text.trim();
      const dv = dateBoxVal(sh, 'due');
      if (dv) f.due = dv;
      if (!text) {
        const inp = $('#td-text', sh.el);
        inp.classList.remove('shake');
        void inp.offsetWidth;
        inp.classList.add('shake');
        inp.focus();
        return;
      }
      if (isNew) {
        const nx = normTodo({ id: uid(), text, due: f.due, coins: f.coins, created: today(), t: Date.now() });
        S.todos.push(nx);
        S.settings.todoCoins = f.coins;
        save();
        sh.close();
        UI.sel = today();
        UI.week = null;
        if (routeName() !== 'today') location.hash = '#/today';
        else {
          render();
          const row = $(`.todo[data-tid="${nx.id}"]`);
          if (row) { row.classList.add('just'); row.scrollIntoView({ block: 'nearest', behavior: reduceMotion() ? 'auto' : 'smooth' }); }
        }
        toast('📝 Added to your list');
      } else {
        Object.assign(x, normTodo(Object.assign({}, x, { text, due: f.due, coins: f.coins })));
        for (const en of S.ledger) if (en.k === 'todo' && en.ref === x.id) en.n = x.text.slice(0, 60);
        REV++;
        save();
        sh.close();
        render();
        toast('Saved ✿');
      }
    },
  });
}
