/* Little Grove — settings, backups and first-run setup */
'use strict';

const switchRow = (name, title, sub, on) => `<label class="switch-row"><span><b>${title}</b><small>${sub}</small></span><span class="switch"><input type="checkbox" name="${name}" ${on ? 'checked' : ''}><span></span></span></label>`;
const isStandalone = () => !!(window.navigator.standalone || (window.matchMedia && matchMedia('(display-mode: standalone)').matches));

function exportData() {
  S.settings.backup = today();
  save();
  const json = JSON.stringify(S, null, 1);
  const name = `little-grove-backup-${today()}.json`;
  const blob = new Blob([json], { type: 'application/json' });
  if (isStandalone() && navigator.canShare && typeof File === 'function') {
    const file = new File([blob], name, { type: 'application/json' });
    if (navigator.canShare({ files: [file] })) {
      navigator.share({ files: [file], title: 'Little Grove backup' })
        .then(() => toast('Backup shared 💾'))
        .catch(() => {});
      return;
    }
  }
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
  toast('Backup saved to your downloads 💾');
}

function importData(file) {
  const reader = new FileReader();
  reader.onload = () => {
    let obj;
    try { obj = JSON.parse(reader.result); } catch (e) { obj = null; }
    if (!obj || typeof obj !== 'object' || !Array.isArray(obj.habits) || !Array.isArray(obj.ledger)) {
      toast('That file doesn’t look like a Little Grove backup');
      return;
    }
    const when = obj.savedAt ? ` from ${fmtDay(dkey(new Date(obj.savedAt)))}` : '';
    confirmSheet({
      title: 'Restore this backup?',
      emoji: '💾',
      body: `This backup${when} has ${plural(obj.habits.length, 'habit')}, ${plural((obj.rewards || []).length, 'treat')} and ${plural(obj.ledger.length, 'history entry', 'history entries')}. It will replace everything on this device.`,
      yes: 'Restore it',
      danger: true,
      onYes: () => {
        const next = migrate(obj);
        next.onboarded = true;
        replaceState(next);
        UI.sel = today();
        UI.week = null;
        save();
        render(true);
        toast('Backup restored 🌱');
      },
    });
  };
  reader.onerror = () => toast('Couldn’t read that file');
  reader.readAsText(file);
}

function openSettings() {
  let nameTimer = null;
  const archRow = (kind, x) => `<div class="arch-row"><span class="e" aria-hidden="true">${x.emoji}</span><b>${esc(x.name)}</b>
    <button type="button" class="btn sm" data-act="restore" data-kind="${kind}" data-id="${x.id}">Restore</button>
    <button type="button" class="icon-btn flat" data-act="purge" data-kind="${kind}" data-id="${x.id}" aria-label="Delete ${esc(x.name)} for good">${icon('trash')}</button></div>`;
  const tpl = () => {
    const archH = S.habits.filter(h => h.archived), archR = S.rewards.filter(r => r.archived);
    const cyc = S.cycle.on
      ? switchRow('fertile', 'Show fertile window', 'Estimated days around ovulation', S.cycle.fertile)
        + `<div class="switch-row"><span><b>Usual cycle</b><small>Days, used until you’ve logged two periods</small></span>${stepper('len', S.cycle.len, '', 'Usual cycle length')}</div>`
        + `<div class="switch-row"><span><b>Usual period</b><small>Days, used to pencil in your period</small></span>${stepper('plen', S.cycle.plen, '', 'Usual period length')}</div>`
      : '';
    return `${sheetHead('Settings')}
      <div class="set-group"><h3>You</h3><div class="card pad"><div class="field" style="margin:0"><label for="st-name">Your name</label><input id="st-name" class="input" name="name" maxlength="40" placeholder="For your daily hello" value="${esc(S.name)}" autocomplete="given-name"></div></div></div>
      <div class="set-group"><h3>Flower &amp; coins</h3><div class="card">
        <div class="switch-row"><span><b>Flower blooms at</b><small>Share of the day’s habits done</small></span>${stepper('bloom', `${S.settings.bloom}%`, '', 'Flower blooms at')}</div>
        <div class="switch-row"><span><b>Perfect-day bonus</b><small>Extra coins when every habit for the day is done</small></span>${stepper('bonus', S.settings.bonus, '', 'Perfect-day bonus')}</div>
      </div></div>
      <div class="set-group"><h3>Cycle</h3><div class="card">
        ${switchRow('cycle', 'Cycle tracker', 'Period predictions and tips for each phase', S.cycle.on)}${cyc}
      </div></div>
      <div class="set-group"><h3>Look &amp; feel</h3><div class="card">
        ${switchRow('fx', 'Celebrations', 'Petals, sparkles and coin pops', S.settings.fx)}
        ${switchRow('monday', 'Weeks start on Monday', 'Turn off to start on Sunday', S.settings.weekStart === 1)}
      </div></div>
      ${archH.length || archR.length ? `<div class="set-group"><h3>Removed</h3><div class="card">${archH.map(h => archRow('habit', h)).join('')}${archR.map(r => archRow('reward', r)).join('')}</div></div>` : ''}
      <div class="set-group"><h3>Your data</h3><div class="card pad">
        <div class="save-ok" style="padding-top:0">${SAVE_OK ? `${icon('check', 'ico')} Saved on this device` : '⚠️ Not saving — this browser is blocking storage'}</div>
        <p class="small muted" style="font-weight:700">Everything lives in this browser on this device, and nothing is sent anywhere. Back up now and then, especially before clearing your browser data or switching phones.${S.settings.backup ? ` Last backup: ${fmtDay(S.settings.backup)}.` : ''}</p>
        <div class="btn-row"><button type="button" class="btn sky" data-act="export">${icon('down')} Back up</button><button type="button" class="btn" data-act="import">${icon('up')} Restore</button></div>
        <input type="file" name="file" accept="application/json,.json" hidden>
        <div class="btn-row" style="margin-top:10px"><button type="button" class="btn ghost" data-act="reset">Start over</button></div>
      </div></div>
      <p class="disclaimer">Little Grove ${APP_VERSION} · made with 🌱<br>Cycle predictions are estimates, not medical advice or contraception.</p>`;
  };
  openSheet(tpl(), {
    label: 'Settings',
    act: {
      step(a, e, sh) {
        const n = a.dataset.name, d = +a.dataset.d;
        if (n === 'bonus') S.settings.bonus = clamp(S.settings.bonus + d, 0, 50);
        if (n === 'bloom') S.settings.bloom = clamp(S.settings.bloom + d * 5, 10, 100);
        if (n === 'len') S.cycle.len = clamp(S.cycle.len + d, 18, 60);
        if (n === 'plen') S.cycle.plen = clamp(S.cycle.plen + d, 1, 12);
        save();
        sh.set(tpl());
      },
      restore(a, e, sh) {
        const x = a.dataset.kind === 'habit' ? habitById(a.dataset.id) : rewardById(a.dataset.id);
        if (!x) return;
        x.archived = false;
        if ('archivedOn' in x) x.archivedOn = '';
        save();
        sh.set(tpl());
        render();
        toast(`${x.emoji} “${esc(x.name)}” is back`);
      },
      purge(a, e, sh) {
        const kind = a.dataset.kind, id = a.dataset.id;
        const x = kind === 'habit' ? habitById(id) : rewardById(id);
        if (!x) return;
        confirmSheet({
          title: 'Delete for good?',
          emoji: x.emoji,
          body: `“${esc(x.name)}” will be gone for good. Coins and history from it stay as they are.`,
          yes: 'Delete',
          danger: true,
          onYes: () => {
            if (kind === 'habit') S.habits = S.habits.filter(h => h.id !== id); else S.rewards = S.rewards.filter(r => r.id !== id);
            save();
            render();
            openSettings();
          },
        });
      },
      export() { exportData(); },
      import(a, e, sh) { $('input[name="file"]', sh.el).click(); },
      reset() {
        confirmSheet({
          title: 'Start over?',
          emoji: '🥀',
          body: 'This deletes all your habits, treats, coins, history and cycle logs on this device. Back up first if you might want them again.',
          yes: 'Delete everything',
          danger: true,
          onYes: () => {
            try { localStorage.removeItem(STORE_KEY); } catch (err) { /* blocked */ }
            replaceState(freshState());
            UI.sel = today();
            UI.week = null;
            UI.hFilter = 'all';
            save();
            location.hash = '#/today';
            render(true);
            startOnboarding();
          },
        });
      },
    },
    input(e) {
      if (e.target.name !== 'name') return;
      S.name = e.target.value.trim().slice(0, 40);
      clearTimeout(nameTimer);
      nameTimer = setTimeout(save, 350);
    },
    change(e, sh) {
      const t = e.target;
      if (t.name === 'file') { if (t.files && t.files[0]) importData(t.files[0]); t.value = ''; return; }
      if (t.type !== 'checkbox') return;
      if (t.name === 'cycle') S.cycle.on = t.checked;
      if (t.name === 'fertile') S.cycle.fertile = t.checked;
      if (t.name === 'fx') S.settings.fx = t.checked;
      if (t.name === 'monday') { S.settings.weekStart = t.checked ? 1 : 0; UI.week = null; }
      save();
      if (t.name === 'cycle') sh.set(tpl());
      render();
    },
    onClose() {
      clearTimeout(nameTimer);
      save();
      render();
    },
  });
}

/* ---------- first-run setup ---------- */
function startOnboarding() {
  const root = $('#onboard-root');
  const st = { step: 0, name: S.name || '', habits: new Set(STARTER_HABITS), rewards: new Set(STARTER_REWARDS), cycle: true, last: '', len: S.cycle.len, plen: S.cycle.plen };
  const pickList = (groups, set, act, sub) => `<div class="ideas${act === 'pick-r' ? ' treats' : ''}">${groups.map(g => `<div class="idea-group"><h4>${g.group}</h4>${g.items.map(it => {
    const on = set.has(it.name);
    return `<button type="button" class="idea${on ? ' on' : ''}" data-act="${act}" data-name="${esc(it.name)}" aria-pressed="${on}"><span class="e" aria-hidden="true">${it.emoji}</span><span><b>${esc(it.name)}</b><small>${sub(it)}</small></span><span class="pick">${icon(on ? 'check' : 'plus')}</span></button>`;
  }).join('')}</div>`).join('')}</div>`;

  const body = () => {
    if (st.step === 0) {
      return `<div class="art">${plantArt(5)}</div>
        <h1>Little Grove</h1>
        <p class="hand tag-line">grow good habits, one sprout at a time</p>
        <p class="lead">Tick off habits to earn coins, then spend them on treats you choose. There’s a cycle tracker too, with ideas for every phase.</p>
        <div class="field" style="max-width:340px;margin:22px auto 0"><label for="ob-name">What should we call you?</label><input id="ob-name" class="input" name="name" maxlength="40" placeholder="Your name (optional)" value="${esc(st.name)}" autocomplete="given-name"></div>`;
    }
    if (st.step === 1) {
      return `<h1>Pick a few habits</h1>
        <p class="lead">Start small. You can change the coins, add your own or remove any of these later.</p>
        ${pickList(HABIT_IDEAS, st.habits, 'pick-h', ideaSub)}`;
    }
    if (st.step === 2) {
      return `<h1>Choose some treats</h1>
        <p class="lead">What will you save your coins for? Prices are easy to change later.</p>
        ${pickList(REWARD_IDEAS, st.rewards, 'pick-r', it => `${it.cost} coins`)}`;
    }
    return `<div class="art-moon">${moonArt()}</div>
      <h1>Track your cycle?</h1>
      <p class="lead">Get a heads-up before your period, plus ideas for what to focus on in each phase. It all stays on this device.</p>
      <div class="seg" style="max-width:340px;margin:18px auto 0"><button type="button" class="${st.cycle ? 'on' : ''}" data-act="cyc" data-v="1" aria-pressed="${st.cycle}">Yes please</button><button type="button" class="${st.cycle ? '' : 'on'}" data-act="cyc" data-v="0" aria-pressed="${!st.cycle}">Not now</button></div>
      ${st.cycle ? `<div class="field"><label for="ob-last">When did your last period start?</label><input id="ob-last" class="input" type="date" name="last" max="${today()}" value="${st.last}"><div class="hint">Not sure? Leave it blank and log it when it comes.</div></div>
        <div class="two-col">
          <div class="field"><span class="label">Cycle length (days)</span>${stepper('len', st.len, '', 'Cycle length in days')}</div>
          <div class="field"><span class="label">Period length (days)</span>${stepper('plen', st.plen, '', 'Period length in days')}</div>
        </div>
        <p class="hint" style="margin-top:8px">28 and 5 are good guesses — Little Grove learns as you log.</p>` : ''}`;
  };

  const foot = () => {
    if (st.step === 0) return `<button type="button" class="btn sage block" data-act="next">Let’s get growing ${icon('chev-r')}</button><button type="button" class="link-btn skip" data-act="skip">Skip — use the starter set</button>`;
    if (st.step === 1) return `<button type="button" class="btn sage block" data-act="next">${st.habits.size ? `Next · ${plural(st.habits.size, 'habit')}` : 'Skip for now'} ${icon('chev-r')}</button><button type="button" class="link-btn skip" data-act="back">Back</button>`;
    if (st.step === 2) return `<button type="button" class="btn gold block" data-act="next">${st.rewards.size ? `Next · ${plural(st.rewards.size, 'treat')}` : 'Skip for now'} ${icon('chev-r')}</button><button type="button" class="link-btn skip" data-act="back">Back</button>`;
    return `<button type="button" class="btn sage block" data-act="finish">${icon('sprout')} Plant my grove</button><button type="button" class="link-btn skip" data-act="back">Back</button>`;
  };

  const draw = keepScroll => {
    const old = $('.onboard', root);
    const top = keepScroll && old ? old.scrollTop : 0;
    root.innerHTML = `<div class="onboard" role="dialog" aria-modal="true" aria-label="Welcome to Little Grove"><div class="onboard-inner">
      <div class="dots" aria-hidden="true">${[0, 1, 2, 3].map(i => `<i class="${i === st.step ? 'on' : ''}"></i>`).join('')}</div>
      <div class="step-body">${body()}</div>
      <div class="foot">${foot()}</div>
    </div></div>`;
    $('.onboard', root).scrollTop = top;
  };

  const finish = () => {
    S.name = st.name.trim().slice(0, 40);
    const haveH = new Set(S.habits.map(h => h.name));
    for (const g of HABIT_IDEAS) for (const it of g.items) {
      if (st.habits.has(it.name) && !haveH.has(it.name)) S.habits.push(normHabit(Object.assign({}, it, { id: uid(), created: today() })));
    }
    const haveR = new Set(S.rewards.map(r => r.name));
    for (const g of REWARD_IDEAS) for (const it of g.items) {
      if (st.rewards.has(it.name) && !haveR.has(it.name)) S.rewards.push(normReward(Object.assign({}, it, { id: uid(), created: today() })));
    }
    S.cycle.on = st.cycle;
    S.cycle.len = st.len;
    S.cycle.plen = st.plen;
    S.onboarded = true;
    REV++;
    if (st.cycle && isKey(st.last) && st.last <= today()) logPeriodStart(st.last, 3);
    save();
    const ob = $('.onboard', root);
    ob.classList.add('closing');
    document.body.classList.remove('locked');
    setTimeout(() => { root.innerHTML = ''; }, 320);
    UI.sel = today();
    location.hash = '#/today';
    render(true);
    setTimeout(() => {
      petals(34);
      toast(`Welcome${S.name ? `, ${esc(S.name)}` : ''}! Your grove is planted 🌱`);
    }, 250);
    askPersist();
  };

  document.body.classList.add('locked');
  draw();
  root.onclick = e => {
    const a = e.target.closest('[data-act]');
    if (!a) return;
    const act = a.dataset.act;
    if (act === 'next') { st.step = Math.min(3, st.step + 1); draw(); }
    else if (act === 'back') { st.step = Math.max(0, st.step - 1); draw(); }
    else if (act === 'skip') finish();
    else if (act === 'finish') finish();
    else if (act === 'pick-h' || act === 'pick-r') {
      const set = act === 'pick-h' ? st.habits : st.rewards;
      const n = a.dataset.name;
      if (set.has(n)) set.delete(n); else set.add(n);
      draw(true);
    } else if (act === 'cyc') { st.cycle = a.dataset.v === '1'; draw(true); }
    else if (act === 'step') {
      const d = +a.dataset.d;
      if (a.dataset.name === 'len') st.len = clamp(st.len + d, 18, 60);
      else st.plen = clamp(st.plen + d, 1, 12);
      draw(true);
    }
  };
  root.oninput = e => {
    if (e.target.name === 'name') st.name = e.target.value;
    if (e.target.name === 'last') st.last = e.target.value;
  };
  root.onchange = e => {
    if (e.target.name === 'last') st.last = e.target.value > today() ? today() : e.target.value;
  };
}
