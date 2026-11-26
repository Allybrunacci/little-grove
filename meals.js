/* Little Grove — Meals: a photo diary of what you eat. No calories, just what was on the plate and how it felt. */
'use strict';

const mealType = k => MEAL_TYPES.find(x => x[0] === k) || MEAL_TYPES[3];
const mealById = id => S.meals.find(m => m.id === id);
const mealsOn = d => S.meals.filter(m => m.d === d).sort((a, b) => a.tm.localeCompare(b.tm) || a.t - b.t);
// A sensible meal for the time of day.
function mealFor(tm) {
  const [h, mi] = String(tm).split(':').map(Number), x = h + mi / 60;
  return x < 10.5 ? 'breakfast' : x < 14.5 ? 'lunch' : x < 17 ? 'snack' : x < 21.5 ? 'dinner' : 'snack';
}
const mealName = m => `${mealType(m.type)[1]}${m.note ? `: ${m.note}` : ''}`;

/* ---------- the Meals page ---------- */
function mealTile(m) {
  const ty = mealType(m.type);
  return `<button type="button" class="meal-tile${m.photo ? '' : ' no-pic'}" data-act="mealopen" data-id="${m.id}" data-ph aria-label="${esc(`${mealName(m)}, ${fmtTm(m.tm)}`)}">
    ${m.photo ? photoImg(m.photo, '') : `<span class="mt-art" aria-hidden="true">${ty[2]}</span>${m.note ? `<span class="mt-note">${esc(m.note)}</span>` : ''}`}
    <span class="mt-label">${ty[1]}<small>${fmtTm(m.tm)}</small></span>
  </button>`;
}
function mealDayHtml(d, isToday) {
  const ms = mealsOn(d);
  return `<div class="hday"><div class="hday-head"><span class="hand">${fmtRel(d)}</span><span class="net">${ms.length ? plural(ms.length, 'meal') : ''}</span></div>
    <div class="meal-grid">${ms.map(mealTile).join('')}${isToday ? `<button type="button" class="meal-tile add" data-act="mealadd">${icon('plus')}<span>Add a meal</span></button>` : ''}</div></div>`;
}
function mealWeekHtml() {
  const t = today(), from = addDays(t, -6), ms = S.meals.filter(m => m.d >= from && m.d <= t);
  if (!ms.length) return '';
  const plate = MEAL_PLATE.map(([k, l]) => [l, ms.filter(m => m.plate.includes(k)).length]);
  const feels = MEAL_FEELS.map(([k, l]) => [l, ms.filter(m => m.feel === k).length]).filter(x => x[1]);
  const nPh = ms.filter(m => m.photo).length, nDays = new Set(ms.map(m => m.d)).size;
  return `<section class="card meal-week"><h3>Your last 7 days</h3>
    <div class="avg-grid"><div class="avg"><b>${ms.length}</b><small>${ms.length === 1 ? 'meal' : 'meals'}</small></div><div class="avg"><b>${nPh}</b><small>${nPh === 1 ? 'photo' : 'photos'}</small></div><div class="avg"><b>${nDays}</b><small>${nDays === 1 ? 'day logged' : 'days logged'}</small></div></div>
    ${plate.some(x => x[1]) ? `<div class="plate-bars">${plate.map(([l, n]) => `<div class="pb"><span>${l}</span><div class="track"><span style="width:${Math.round((100 * n) / ms.length)}%"></span></div><b>${n}</b></div>`).join('')}</div>
      <p class="hint">Meals with each on the plate, out of ${ms.length}.</p>` : ''}
    ${feels.length ? `<div class="feel-line"><span>After eating</span>${feels.map(([l, n]) => `<span class="tag">${l} · ${n}</span>`).join('')}</div>` : ''}
  </section>`;
}
function mealsHtml() {
  const t = today();
  let html = `<button type="button" class="btn sage block well-cta" data-act="mealadd">${icon('camera')} Add a meal</button>`;
  if (!S.meals.length) {
    return html + `<div class="card empty" style="margin-top:14px"><div class="art-wrap">${emojiArt('🥗')}</div><h3>A photo diary of your food</h3>
      <p>No calories and no counting. Snap a photo of your meal, and if you like, note what was on the plate and how you felt after.</p></div>`;
  }
  html += mealWeekHtml() + mealDayHtml(t, true);
  const days = Array.from(new Set(S.meals.map(m => m.d))).filter(d => d !== t).sort().reverse();
  for (const d of days.slice(0, UI.mealDays)) html += mealDayHtml(d, false);
  if (days.length > UI.mealDays) html += `<button type="button" class="btn ghost block" data-act="mealmore" style="margin-top:18px">Show older days</button>`;
  return html;
}

Object.assign(VIEWS.wellness.act, {
  mealadd() { openMealSheet(null); },
  mealopen(a) { const m = mealById(a.dataset.id); if (m) openMealView(m); },
  mealmore() { UI.mealDays += 14; render(); },
});

/* ---------- one meal ---------- */
function deleteMeal(m) {
  const i = S.meals.indexOf(m);
  if (i < 0) return;
  S.meals.splice(i, 1);
  save();
  render();
  dropPhotoLater(m.photo);
  toast(`Deleted ${esc(mealType(m.type)[1].toLowerCase())}`, { undo: () => { if (!mealById(m.id)) S.meals.push(m); save(); render(); } });
}

function openMealView(m) {
  const ty = mealType(m.type);
  const tags = m.plate.map(k => MEAL_PLATE.find(p => p[0] === k)[1]).concat(m.feel ? [`Felt ${MEAL_FEELS.find(x => x[0] === m.feel)[1].toLowerCase()}`] : []);
  openSheet(`${sheetHead(`${ty[2]} ${ty[1]}`)}
    <p class="lead center">${fmtLong(m.d)} · ${fmtTm(m.tm)}</p>
    ${m.photo ? `<div class="ph-full" data-ph>${photoImg(m.photo, `Photo of ${mealName(m)}`, 'full')}</div>` : ''}
    ${m.note ? `<h3 class="center meal-note">${esc(m.note)}</h3>` : ''}
    ${tags.length ? `<div class="tag-row">${tags.map(x => `<span class="tag">${esc(x)}</span>`).join('')}</div>` : ''}
    <div class="btn-row"><button type="button" class="btn" data-act="edit">${icon('edit')} Edit</button><button type="button" class="btn ghost" data-act="del">${icon('trash')} Delete</button></div>`, {
    label: ty[1],
    onOpen: sh => fillPhotos(sh.el),
    act: {
      edit(a, e, sh) { sh.close(); setTimeout(() => openMealSheet(m), 60); },
      del(a, e, sh) { sh.close(); deleteMeal(m); },
    },
  });
}

/* ---------- add or edit a meal ---------- */
function openMealSheet(m) {
  const isNew = !m;
  const f = m
    ? { d: m.d, tm: m.tm, type: m.type, note: m.note, plate: m.plate.slice(), feel: m.feel }
    : { d: today(), tm: nowTm(), type: mealFor(nowTm()), note: '', plate: [], feel: '' };
  let typeSet = !isNew;   // once a meal is chosen, changing the time leaves it alone
  let pend = null;        // a new photo, not saved yet: { full, thumb, url }
  let dropOld = false;    // the saved photo is being removed or replaced
  let busy = false, saving = false;
  const oldPhoto = m ? m.photo : '';

  const photoArea = () => {
    if (busy) return `<div class="ph-pick busy" role="status"><span class="ph-spin" aria-hidden="true"></span>Getting your photo ready…</div>`;
    const keep = !dropOld && oldPhoto;
    if (pend || keep) {
      return `<div class="ph-pick"><div class="ph-preview" data-ph>${pend ? `<img src="${pend.url}" alt="Your meal">` : photoImg(oldPhoto, 'Your meal', 'full')}</div>
        <div class="btn-row"><button type="button" class="btn sm" data-act="lib">${icon('image')} Change</button><button type="button" class="btn sm ghost" data-act="phrm">${icon('trash')} Remove</button></div></div>`;
    }
    return `<div class="ph-pick empty"><div class="ph-art" aria-hidden="true">${emojiArt(mealType(f.type)[2])}</div>
      <div class="btn-row"><button type="button" class="btn sky" data-act="cam">${icon('camera')} Take a photo</button><button type="button" class="btn" data-act="lib">${icon('image')} Choose one</button></div></div>`;
  };
  const tpl = () => `${sheetHead(isNew ? 'Add a meal' : 'Edit meal')}<form novalidate>
    ${photoArea()}
    <div class="field"><span class="label">Which meal?</span><div class="chips">${MEAL_TYPES.map(([k, l, e]) => `<button type="button" class="chip${f.type === k ? ' on' : ''}" data-act="mtype" data-k="${k}" ${pressed(f.type === k)}>${e} ${l}</button>`).join('')}</div></div>
    ${dayField('When?', f.d)}
    <div class="field"><label for="ml-tm">Time</label><input id="ml-tm" class="input time-in" type="time" name="tm" value="${f.tm}"></div>
    <div class="field"><label for="ml-note">What was it? <span class="faint">(optional)</span></label>
      <input id="ml-note" class="input" name="note" maxlength="300" placeholder="e.g. Salmon poke bowl" value="${esc(f.note)}" autocomplete="off" enterkeyhint="done"></div>
    <div class="field"><span class="label">On the plate <span class="faint">(optional)</span></span>
      <div class="chips">${MEAL_PLATE.map(([k, l]) => `<button type="button" class="chip${f.plate.includes(k) ? ' on' : ''}" data-act="plate" data-k="${k}" ${pressed(f.plate.includes(k))}>${l}</button>`).join('')}</div></div>
    <div class="field"><span class="label">How did you feel after? <span class="faint">(optional)</span></span>
      <div class="chips">${MEAL_FEELS.map(([k, l]) => `<button type="button" class="chip${f.feel === k ? ' on' : ''}" data-act="mfeel" data-k="${k}" ${pressed(f.feel === k)}>${l}</button>`).join('')}</div></div>
    <div class="btn-row"><button type="submit" class="btn sage" ${busy || saving ? 'disabled' : ''}>${icon('check')} ${isNew ? 'Add meal' : 'Save'}</button></div>
    ${isNew ? '' : `<div class="btn-row" style="margin-top:10px"><button type="button" class="btn ghost" data-act="del">${icon('trash')} Delete meal</button></div>`}
  </form>
  <input type="file" name="cam" accept="image/*" capture="environment" hidden><input type="file" name="lib" accept="image/*" hidden>`;

  const dropPend = () => { if (pend) { URL.revokeObjectURL(pend.url); pend = null; } };
  const sh0 = openSheet(tpl(), {
    label: isNew ? 'Add a meal' : 'Edit meal',
    onOpen: sh => fillPhotos(sh.el),
    act: {
      cam(a, e, sh) { $('input[name=cam]', sh.el).click(); },
      lib(a, e, sh) { $('input[name=lib]', sh.el).click(); },
      phrm(a, e, sh) { dropPend(); dropOld = true; sh.set(tpl()); },
      mtype(a, e, sh) { f.type = a.dataset.k; typeSet = true; sh.set(tpl()); fillPhotos(sh.el); },
      plate(a, e, sh) { const k = a.dataset.k; f.plate = f.plate.includes(k) ? f.plate.filter(x => x !== k) : f.plate.concat(k); sh.set(tpl()); fillPhotos(sh.el); },
      mfeel(a, e, sh) { const k = a.dataset.k; f.feel = f.feel === k ? '' : k; sh.set(tpl()); fillPhotos(sh.el); },
      dpick(a, e, sh) { f.d = a.dataset.d; sh.set(tpl()); fillPhotos(sh.el); },
      del(a, e, sh) { sh.close(); deleteMeal(m); },
    },
    input(e) { if (e.target.name === 'note') f.note = e.target.value; },
    change(e, sh) {
      const t = e.target;
      if (t.name === 'cam' || t.name === 'lib') {
        const file = t.files && t.files[0];
        t.value = '';
        if (!file) return;
        busy = true;
        sh.set(tpl());
        makePhoto(file).then(p => {
          if (sh.closed) return;
          dropPend();
          pend = { full: p.full, thumb: p.thumb, url: URL.createObjectURL(p.full) };
          dropOld = !!oldPhoto;
          busy = false;
          sh.set(tpl());
        }).catch(err => {
          busy = false;
          if (!sh.closed) { sh.set(tpl()); fillPhotos(sh.el); }
          toast(esc(err && err.message ? err.message : 'Couldn’t open that photo'));
        });
        return;
      }
      if (t.name === 'day' && isKey(t.value) && t.value <= today()) { f.d = t.value; sh.set(tpl()); fillPhotos(sh.el); }
      if (t.name === 'tm' && cleanTm(String(t.value).slice(0, 5))) {
        f.tm = String(t.value).slice(0, 5);
        if (!typeSet) { f.type = mealFor(f.tm); sh.set(tpl()); fillPhotos(sh.el); }
      }
    },
    async submit(e, sh) {
      if (busy || saving) return;
      const dv = dateBoxVal(sh, 'day');
      if (dv && dv <= today()) f.d = dv;
      const ti = $('input[name="tm"]', sh.el), tv = ti ? cleanTm(String(ti.value).slice(0, 5)) : '';
      if (tv && tv !== f.tm) { f.tm = tv; if (!typeSet) f.type = mealFor(tv); }
      saving = true;
      let photo = dropOld ? '' : oldPhoto;
      if (pend) {
        const id = uid();
        try {
          await phPut(id, { full: pend.full, thumb: pend.thumb });
        } catch (err) {
          saving = false;
          toast('Couldn’t save the photo. Your phone may be low on space.', { ms: 5000 });
          return;
        }
        PH.urls.set(photoKey(id, 'full'), pend.url); // reuse the preview rather than load it again
        pend = null;
        photo = id;
      }
      if (oldPhoto && photo !== oldPhoto) phDel(oldPhoto);
      const data = Object.assign({}, f, { photo });
      sh.close();
      if (isNew) {
        const nm = normMeal(Object.assign(data, { id: uid(), t: Date.now() }));
        S.meals.push(nm);
        save();
        if (routeName() !== 'wellness' || UI.well !== 'meals') location.hash = '#/wellness/meals'; else render();
        const tile = $(`.meal-tile[data-id="${nm.id}"]`);
        if (tile) tile.classList.add('just');
        buzz(12);
        toast(`${mealType(nm.type)[2]} ${mealType(nm.type)[1]} added`, { undo: () => { const i = S.meals.indexOf(nm); if (i >= 0) S.meals.splice(i, 1); save(); render(); dropPhotoLater(nm.photo, 0); } });
      } else {
        Object.assign(m, normMeal(Object.assign({}, m, data)));
        save();
        render();
        toast('Saved ✿');
      }
    },
    onClose() { if (!saving) dropPend(); },
  });
  return sh0;
}
