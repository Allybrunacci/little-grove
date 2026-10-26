/* Little Grove — Rewards: spend coins on treats you choose */
'use strict';

const rewardFromEl = el => { const w = el.closest('[data-id]'); return w ? rewardById(w.dataset.id) : null; };

// Average coins earned per day over the last two weeks (or since the start).
function dailyPace() {
  return memo('pace', () => {
    const t = today();
    const days = clamp(daysBetween(S.created, t) + 1, 1, 14);
    let total = 0;
    for (let i = 0; i < days; i++) total += calc().earnedDay[addDays(t, -i)] || 0;
    return total / days;
  });
}

function rewardCard(r, bal) {
  const can = bal >= r.cost;
  const pct = Math.round(100 * clamp(bal / r.cost, 0, 1));
  const times = calc().claimsBy[r.id] || 0;
  const meta = [`<span class="tag ${r.once ? 'once' : 'again'}">${r.once ? 'Just once' : 'Again & again'}</span>`];
  if (times && !r.once) meta.push(`<span>Treated ${times}×</span>`);
  if (!can) meta.push(`<span>${r.cost - Math.max(0, bal)} to go</span>`);
  const name = esc(r.name);
  return `<div class="card reward" data-id="${r.id}">
    <div class="blob" aria-hidden="true">${r.emoji}</div>
    <div class="info">
      <div class="name" data-act="edit" role="button" tabindex="0" aria-label="Edit ${name}">${name}</div>
      <div class="meta">${meta.join('')}</div>
      ${can ? '' : `<div class="bar" aria-hidden="true"><span style="width:${pct}%"></span></div>`}
    </div>
    <button type="button" class="btn gold claim" data-act="claim" ${can ? '' : 'disabled'} aria-label="${can ? `Claim ${name} for ${r.cost} coins` : `${name} costs ${r.cost} coins`}">${can ? 'Claim' : 'Save up'}<small>${COIN}${r.cost}</small></button>
  </div>`;
}

function treatedCard(r) {
  const name = esc(r.name);
  return `<div class="card reward claimed" data-id="${r.id}">
    <div class="blob" aria-hidden="true">${r.emoji}</div>
    <div class="info">
      <div class="name" data-act="edit" role="button" tabindex="0" aria-label="Edit ${name}">${name}</div>
      <div class="meta"><span>Treated ${relDay(r.done)}</span>${coinTag(r.cost)}</div>
    </div>
    <span class="stamp">Treated!</span>
  </div>`;
}

VIEWS.rewards = {
  title: 'Rewards',
  render() {
    const c = calc(), bal = c.bal;
    const live = S.rewards.filter(r => !r.archived);
    const open = live.filter(r => !(r.once && r.done)).sort((a, b) => a.cost - b.cost || a.name.localeCompare(b.name));
    const treated = live.filter(r => r.once && r.done).sort((a, b) => (a.done < b.done ? 1 : -1));
    const next = open.find(r => r.cost > bal);
    const pace = dailyPace();
    let html = `<section class="card wallet">
      <div><div class="hand">Your coin jar</div><div class="big">${COIN}<span>${bal}</span></div><div class="sub">${c.earned} earned · ${c.spent} spent</div></div>
      ${jarArt(Math.max(0, bal))}
    </section>`;
    if (next) {
      const gap = next.cost - Math.max(0, bal);
      const eta = pace >= 0.5 ? ` — about ${plural(Math.max(1, Math.ceil(gap / pace)), 'day')} at your pace` : '';
      html += `<div class="insight"><span class="em" aria-hidden="true">${next.emoji}</span><span>${plural(gap, 'more coin')} until <b>${esc(next.name)}</b>${eta}.</span></div>`;
    } else if (open.length) {
      html += `<div class="insight"><span class="em" aria-hidden="true">🎉</span><span>You can afford every treat on your list. Go on, you’ve earned it!</span></div>`;
    }
    html += `<div class="section-title"><div><h2>Treats</h2>${squiggle('var(--gold)')}</div><span class="hand">${open.length ? 'you’ve earned these' : ''}</span></div>`;
    if (!live.length) {
      html += `<div class="card empty">${giftArt()}<h3>What would feel like a treat?</h3><p>Add rewards to save up for — little ones for everyday wins and big ones to dream about.</p><button type="button" class="btn gold" data-act="add">${icon('plus')} Add a treat</button></div>`;
      return html;
    }
    html += open.length
      ? `<div class="rewards">${open.map(r => rewardCard(r, bal)).join('')}</div>`
      : `<div class="card empty"><p style="margin:0">All your treats are claimed — add something new to save up for ✨</p></div>`;
    html += `<div class="add-wrap"><button type="button" class="add-card" data-act="add">${icon('plus')} Add a treat</button></div>`;
    if (treated.length) {
      html += `<div class="section-title"><div><h2>Treated</h2>${squiggle('var(--lav)')}</div><span class="hand">one-offs you enjoyed</span></div>
        <div class="rewards">${treated.map(treatedCard).join('')}</div>`;
    }
    return html;
  },
  act: {
    claim(a) { const r = rewardFromEl(a); if (r) openClaimSheet(r); },
    edit(a) { const r = rewardFromEl(a); if (r) openRewardSheet(r); },
    add() { openRewardSheet(null); },
  },
};

function openClaimSheet(r) {
  const bal = balance();
  if (bal < r.cost) { toast(`${plural(r.cost - Math.max(0, bal), 'more coin')} to go — you’ve got this!`); return; }
  openSheet(`${sheetHead('Treat time?')}
    <div class="big-emoji" aria-hidden="true">${r.emoji}</div>
    <h3 class="center">${esc(r.name)}</h3>
    <p class="lead center" style="margin-top:6px">This spends ${coinTag(r.cost)} and leaves ${coinTag(bal - r.cost)} in your jar.</p>
    <div class="btn-row"><button type="button" class="btn ghost" data-close>Not yet</button><button type="button" class="btn gold" data-act="yes">${icon('sparkle')} Treat me!</button></div>`,
  { label: 'Claim a treat', act: { yes: (a, e, sh) => { sh.close(); claimReward(r); } } });
}

function claimReward(r) {
  const entry = addEntry({ k: 'reward', ref: r.id, d: today(), a: -r.cost, n: r.name, e: r.emoji });
  if (r.once) r.done = today();
  save();
  render();
  buzz([15, 30, 15]);
  petals(30, [r.emoji, '✨', '🌸', '💛', '🌼']);
  toast(`Enjoy it — you earned it! ${r.emoji}`, {
    undo: () => {
      removeEntry(entry.id);
      if (r.once) r.done = '';
      save();
      render();
      toast('Coins are back in your jar');
    },
  });
}

function rewardIdeasHtml() {
  const have = new Set(S.rewards.filter(r => !r.archived).map(r => r.name.toLowerCase()));
  return `<div class="ideas">${REWARD_IDEAS.map((g, gi) => `<div class="idea-group"><h4>${g.group}</h4>${g.items.map((it, ii) => {
    const got = have.has(it.name.toLowerCase());
    return `<button type="button" class="idea${got ? ' have' : ''}" data-act="idea" data-g="${gi}" data-i="${ii}">
      <span class="e" aria-hidden="true">${it.emoji}</span>
      <span><b>${esc(it.name)}</b><small>${it.cost} coins${got ? ' · already yours' : ''}</small></span>
      <span class="pick">${icon('plus')}</span></button>`;
  }).join('')}</div>`).join('')}</div>`;
}

function openRewardSheet(r) {
  const isNew = !r;
  const f = r ? { name: r.name, emoji: r.emoji, cost: r.cost, once: r.once } : { name: '', emoji: '🎁', cost: 50, once: false };
  let mode = isNew ? 'ideas' : 'form';
  let emojiOpen = false;
  const pace = dailyPace();

  const formHtml = () => {
    const hint = pace >= 0.5
      ? `At your pace (about ${Math.round(pace)} a day) that’s roughly ${plural(Math.max(1, Math.ceil(f.cost / pace)), 'day')} of habits.`
      : 'Tip: bigger treats make lovely long-term goals.';
    return `<form novalidate>
      <div class="field"><label for="rf-name">What’s the treat?</label>
        <div class="input-row"><button type="button" class="emoji-btn" data-act="emo" aria-label="Choose an emoji" aria-expanded="${emojiOpen}">${f.emoji}</button>
        <input id="rf-name" class="input" name="name" maxlength="60" placeholder="e.g. Bubble tea" value="${esc(f.name)}" autocomplete="off" enterkeyhint="done"></div>
        ${emojiOpen ? emojiGrid(f.emoji) : ''}
      </div>
      <div class="field"><span class="label">It costs</span>${stepper('cost', f.cost, 'coins', 'Cost in coins')}
        <div class="chips quick-costs">${[20, 50, 100, 200, 500].map(v => `<button type="button" class="chip${f.cost === v ? ' on' : ''}" data-act="cost" data-v="${v}">${v}</button>`).join('')}</div>
        <div class="hint">${hint}</div></div>
      <div class="field"><span class="label">How often?</span>
        <div class="seg" style="margin-top:0"><button type="button" class="${f.once ? '' : 'on'}" data-act="once" data-v="0" aria-pressed="${!f.once}">Again &amp; again</button><button type="button" class="${f.once ? 'on' : ''}" data-act="once" data-v="1" aria-pressed="${f.once}">Just once</button></div>
        <div class="hint">${f.once ? 'Gets a “Treated!” stamp once you claim it.' : 'Stays on your list to claim whenever you like.'}</div></div>
      <div class="btn-row"><button type="submit" class="btn gold">${isNew ? `${icon('gift')} Add treat` : `${icon('check')} Save`}</button></div>
      ${!isNew && r.once && r.done ? `<div class="btn-row" style="margin-top:10px"><button type="button" class="btn sky" data-act="again">${icon('undo')} Make it available again</button></div>` : ''}
      ${isNew ? '' : `<div class="btn-row" style="margin-top:10px"><button type="button" class="btn ghost" data-act="archive">${icon('trash')} Remove treat</button></div>`}
    </form>`;
  };

  const tpl = () => {
    const seg = isNew
      ? `<div class="seg" role="tablist"><button type="button" role="tab" class="${mode === 'ideas' ? 'on' : ''}" aria-selected="${mode === 'ideas'}" data-act="mode" data-m="ideas">Ideas</button><button type="button" role="tab" class="${mode === 'form' ? 'on' : ''}" aria-selected="${mode === 'form'}" data-act="mode" data-m="form">Make my own</button></div>`
      : '';
    const body = mode === 'ideas' ? `<p class="lead">Tap an idea to set your own price.</p>${rewardIdeasHtml()}` : formHtml();
    return sheetHead(isNew ? 'New treat' : 'Edit treat') + seg + body;
  };

  openSheet(tpl(), {
    label: isNew ? 'New treat' : 'Edit treat',
    act: {
      mode(a, e, sh) { mode = a.dataset.m; sh.set(tpl()); },
      idea(a, e, sh) {
        const it = REWARD_IDEAS[+a.dataset.g].items[+a.dataset.i];
        Object.assign(f, { name: it.name, emoji: it.emoji, cost: it.cost });
        mode = 'form';
        sh.set(tpl());
        sh.el.scrollTop = 0;
      },
      emo(a, e, sh) { emojiOpen = !emojiOpen; sh.set(tpl()); },
      emoji(a, e, sh) { f.emoji = a.dataset.e; emojiOpen = false; sh.set(tpl()); },
      step(a, e, sh) { f.cost = clamp(stepValue(f.cost, +a.dataset.d, [[50, 5], [200, 10], [1000, 50], [Infinity, 100]]), 1, 99999); sh.set(tpl()); },
      cost(a, e, sh) { f.cost = +a.dataset.v; sh.set(tpl()); },
      once(a, e, sh) { f.once = a.dataset.v === '1'; sh.set(tpl()); },
      again(a, e, sh) {
        r.done = '';
        save();
        sh.close();
        render();
        toast(`${r.emoji} Back on your list`);
      },
      archive(a, e, sh) {
        r.archived = true;
        save();
        sh.close();
        render();
        toast(`Removed “${esc(r.name)}”`, { undo: () => { r.archived = false; save(); render(); } });
      },
    },
    input(e) { if (e.target.name === 'name') f.name = e.target.value; },
    submit(e, sh) {
      const name = f.name.trim();
      if (!name) {
        const inp = $('#rf-name', sh.el);
        inp.classList.remove('shake');
        void inp.offsetWidth;
        inp.classList.add('shake');
        inp.focus();
        return;
      }
      if (isNew) {
        S.rewards.push(normReward(Object.assign({}, f, { name, id: uid(), created: today() })));
        save();
        sh.close();
        if (routeName() !== 'rewards') location.hash = '#/rewards'; else render();
        toast(`${f.emoji} Added “${esc(name)}”`);
      } else {
        Object.assign(r, normReward(Object.assign({}, r, f, { name })));
        if (!r.once) r.done = '';
        save();
        sh.close();
        render();
        toast('Saved ✿');
      }
    },
  });
}
