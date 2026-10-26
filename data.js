/* Little Grove — content and illustrations */
'use strict';

const INK = '#3b3530';

const COLORS = {
  sage: ['#a8c3a0', '#e3eddf'],
  blush: ['#f4b9b2', '#fbe4e0'],
  peach: ['#f7c59f', '#fde9d8'],
  butter: ['#f6e3a1', '#fbf3d5'],
  lavender: ['#c9b8e8', '#eee8f8'],
  sky: ['#a9cce3', '#e3eff7'],
  mint: ['#b5e2d0', '#e4f5ee'],
  rose: ['#e8a0b4', '#f9e1e8'],
};
const COLOR_KEYS = Object.keys(COLORS);

const EMOJIS = [
  '💧', '🥤', '🍵', '☕', '🍎', '🥗', '🥦', '🍳', '🥑', '🍓', '🍫', '🧁', '🍰', '🍕', '🧋', '🍿',
  '🚶', '🏃', '🧘', '🏋️', '🚴', '🏊', '💃', '⛹️', '😴', '🛏️', '🛁', '🧴', '🦷', '💊', '☀️', '🌙',
  '📖', '📚', '📝', '✍️', '🧠', '🎧', '🗣️', '🎨', '🎹', '🎸', '🎮', '🧶', '🧺', '🧹', '🍽️', '🪴',
  '🌱', '🌸', '🌼', '🌷', '🍃', '💌', '📞', '👯', '🫶', '❤️', '🐶', '🐱', '💸', '🛍️', '🎁', '🎬',
  '🎟️', '💅', '💆', '👟', '👗', '✈️', '🏖️', '⭐', '✨', '🔥', '🎉', '🙏', '📵', '🗓️', '🧃', '🫖',
];

const HABIT_IDEAS = [
  { group: 'Body', items: [
    { name: 'Drink 1L of water', emoji: '💧', coins: 2, target: 3, unit: 'L', color: 'sky' },
    { name: 'Go for a walk', emoji: '🚶', coins: 5, target: 1, color: 'sage' },
    { name: 'Stretch or yoga', emoji: '🧘', coins: 4, target: 1, color: 'lavender' },
    { name: 'Work out', emoji: '🏋️', coins: 8, target: 1, color: 'peach' },
    { name: 'Eat my veggies', emoji: '🥗', coins: 2, target: 2, unit: 'meals', color: 'mint' },
    { name: 'Eat a piece of fruit', emoji: '🍎', coins: 2, target: 2, color: 'rose' },
    { name: 'In bed by 10:30', emoji: '😴', coins: 5, target: 1, color: 'lavender' },
    { name: 'Take my vitamins', emoji: '💊', coins: 2, target: 1, color: 'butter' },
  ] },
  { group: 'Mind', items: [
    { name: 'Read 10 pages', emoji: '📖', coins: 4, target: 1, color: 'butter' },
    { name: 'Journal', emoji: '📝', coins: 4, target: 1, color: 'peach' },
    { name: 'Meditate for 5 minutes', emoji: '🧠', coins: 4, target: 1, color: 'lavender' },
    { name: 'Write 3 gratitudes', emoji: '🙏', coins: 3, target: 1, color: 'rose' },
    { name: 'Phone-free hour', emoji: '📵', coins: 5, target: 1, color: 'sky' },
  ] },
  { group: 'Home', items: [
    { name: 'Make my bed', emoji: '🛏️', coins: 2, target: 1, color: 'blush' },
    { name: 'Tidy for 10 minutes', emoji: '🧺', coins: 3, target: 1, color: 'mint' },
    { name: 'Cook at home', emoji: '🍳', coins: 5, target: 1, color: 'peach' },
    { name: 'Do the dishes', emoji: '🍽️', coins: 3, target: 1, color: 'sky' },
    { name: 'Water the plants', emoji: '🪴', coins: 2, target: 1, color: 'sage' },
  ] },
  { group: 'Self-care', items: [
    { name: 'Skincare', emoji: '🧴', coins: 2, target: 2, color: 'rose' },
    { name: 'Floss', emoji: '🦷', coins: 2, target: 1, color: 'sky' },
    { name: 'Get morning sunlight', emoji: '☀️', coins: 3, target: 1, color: 'butter' },
    { name: 'Pamper time', emoji: '🛁', coins: 4, target: 1, color: 'blush' },
  ] },
  { group: 'Grow & connect', items: [
    { name: 'Make something creative', emoji: '🎨', coins: 5, target: 1, color: 'lavender' },
    { name: 'Practise a language', emoji: '🗣️', coins: 4, target: 1, color: 'sky' },
    { name: 'No impulse spending', emoji: '💸', coins: 5, target: 1, color: 'mint' },
    { name: 'Message a friend', emoji: '💌', coins: 3, target: 1, color: 'blush' },
    { name: 'Learn something new', emoji: '🎧', coins: 4, target: 1, color: 'peach' },
  ] },
  { group: 'Every so often', items: [
    { name: 'Change the bed sheets', emoji: '🛏️', coins: 10, freq: 'week', color: 'blush' },
    { name: 'Clean the bathroom', emoji: '🧹', coins: 12, freq: 'week', color: 'mint' },
    { name: 'Meal prep for the week', emoji: '🍲', coins: 12, freq: 'week', color: 'peach' },
    { name: 'Call family', emoji: '📞', coins: 8, freq: 'week', color: 'sky' },
    { name: 'Gym or a class', emoji: '🏋️', coins: 8, target: 3, freq: 'week', color: 'peach' },
    { name: 'Deep clean a room', emoji: '✨', coins: 15, freq: 'fortnight', color: 'butter' },
    { name: 'Check my budget', emoji: '💸', coins: 10, freq: 'fortnight', color: 'mint' },
    { name: 'See a friend', emoji: '👯', coins: 10, freq: 'fortnight', color: 'blush' },
    { name: 'Plan something fun', emoji: '🎟️', coins: 12, freq: 'month', color: 'lavender' },
    { name: 'Declutter a drawer', emoji: '🧺', coins: 12, freq: 'month', color: 'sage' },
  ] },
];

const REWARD_IDEAS = [
  { group: 'Little treats', items: [
    { name: 'Guilt-free gaming hour', emoji: '🎮', cost: 30 },
    { name: 'Fancy dessert', emoji: '🍰', cost: 35 },
    { name: 'Bubble tea', emoji: '🧋', cost: 40 },
    { name: 'Bath & face mask', emoji: '🛁', cost: 50 },
    { name: 'Sleep in', emoji: '😴', cost: 50 },
  ] },
  { group: 'Nice treats', items: [
    { name: 'Movie night', emoji: '🎬', cost: 60 },
    { name: 'Café breakfast', emoji: '☕', cost: 80 },
    { name: 'Takeaway night', emoji: '🍕', cost: 100 },
    { name: 'A new book', emoji: '📚', cost: 120 },
    { name: 'A new plant', emoji: '🪴', cost: 150 },
  ] },
  { group: 'Big treats', items: [
    { name: 'Get my nails done', emoji: '💅', cost: 200 },
    { name: 'Something new to wear', emoji: '👗', cost: 300 },
    { name: 'A massage', emoji: '💆', cost: 350 },
    { name: 'Day trip adventure', emoji: '🎟️', cost: 400 },
  ] },
];

const STARTER_HABITS = ['Drink 1L of water', 'Go for a walk', 'Read 10 pages', 'Make my bed'];
const STARTER_REWARDS = ['Bubble tea', 'Movie night', 'Bath & face mask', 'A new book'];

const FLOWS = [
  { v: 0, name: 'None', drops: 0 },
  { v: 1, name: 'Spotting', drops: 0 },
  { v: 2, name: 'Light', drops: 1 },
  { v: 3, name: 'Medium', drops: 2 },
  { v: 4, name: 'Heavy', drops: 3 },
];

const SYMPTOMS = [
  ['Cramps', '🌀'], ['Headache', '🤕'], ['Bloating', '🎈'], ['Tender breasts', '💗'], ['Spots', '🔴'],
  ['Cravings', '🍫'], ['Tired', '🥱'], ['Back ache', '🦴'], ['Nausea', '🤢'], ['Poor sleep', '🌙'],
];
const MOODS = [
  ['Happy', '😊'], ['Calm', '😌'], ['Energetic', '⚡'], ['Loving', '🥰'],
  ['Sensitive', '🥺'], ['Irritable', '😤'], ['Anxious', '😟'], ['Low', '😔'],
];

const PHASE_ORDER = ['menstrual', 'follicular', 'ovulatory', 'luteal'];
const PHASES = {
  menstrual: {
    name: 'Menstrual', season: 'Inner winter', emoji: '🌙', color: '#f4b9b2', light: '#fbe4e0', energy: 2,
    short: 'Rest, warmth and gentle movement',
    blurb: 'Your period. Hormones are at their lowest, so energy can dip. It’s a natural time to slow down, rest and reflect.',
    focus: [
      { icon: '🛌', title: 'Rest', tips: ['Lighten your plans where you can', 'Aim for a little extra sleep', 'A heat pack or warm bath can ease cramps'] },
      { icon: '🧘', title: 'Move gently', tips: ['Walks, stretching or gentle yoga', 'Listen to your body — no PB attempts'] },
      { icon: '🍲', title: 'Nourish', tips: ['Iron-rich foods: leafy greens, lentils, red meat', 'Pair them with vitamin C to help absorb iron', 'Warm, cosy meals and plenty of water'] },
      { icon: '📓', title: 'Reflect', tips: ['Journal about the month that was', 'Set intentions for the cycle ahead', 'It’s okay to say no'] },
    ],
    habits: [
      { name: 'Gentle stretch', emoji: '🧘', coins: 3, color: 'lavender' },
      { name: 'Heat pack & rest', emoji: '🛁', coins: 3, color: 'blush' },
      { name: 'Iron-rich meal', emoji: '🥬', coins: 3, color: 'sage' },
      { name: 'Early night', emoji: '😴', coins: 4, color: 'lavender' },
    ],
  },
  follicular: {
    name: 'Follicular', season: 'Inner spring', emoji: '🌱', color: '#a8c3a0', light: '#e3eddf', energy: 4,
    short: 'Start new things and move more',
    blurb: 'Oestrogen is rising, and energy, mood and motivation usually rise with it. A lovely time for fresh starts and learning.',
    focus: [
      { icon: '✨', title: 'Start things', tips: ['Kick off a new project', 'Brainstorm and make plans', 'Learn a new skill'] },
      { icon: '🏃', title: 'Move more', tips: ['Try a new class or workout', 'Cardio and strength can feel easier', 'Build up the intensity'] },
      { icon: '🥗', title: 'Nourish', tips: ['Fresh, colourful plates', 'Fermented foods like yoghurt or kimchi', 'Protein to fuel your workouts'] },
      { icon: '👯', title: 'Connect', tips: ['Make plans with friends', 'Say yes to something new'] },
    ],
    habits: [
      { name: 'Try something new', emoji: '✨', coins: 4, color: 'butter' },
      { name: 'Cardio session', emoji: '🏃', coins: 6, color: 'peach' },
      { name: 'Plan my week', emoji: '🗓️', coins: 3, color: 'sky' },
      { name: 'Learn for 20 minutes', emoji: '🎧', coins: 4, color: 'mint' },
    ],
  },
  ovulatory: {
    name: 'Ovulatory', season: 'Inner summer', emoji: '☀️', color: '#f6e3a1', light: '#fbf3d5', energy: 5,
    short: 'Speak up, connect and go for it',
    blurb: 'Around ovulation, energy and confidence often peak. You might feel more social, chatty and brave.',
    focus: [
      { icon: '🗣️', title: 'Speak up', tips: ['Have the big conversations', 'Present, pitch or ask for what you want', 'Collaborate and network'] },
      { icon: '🔥', title: 'Go for it', tips: ['High-energy workouts, HIIT or a run', 'A good time to chase a personal best'] },
      { icon: '🥦', title: 'Nourish', tips: ['Fibre-rich veggies and wholegrains', 'Light, fresh meals', 'Keep your water up'] },
      { icon: '💌', title: 'Connect', tips: ['Plan dates and catch-ups', 'Reach out to someone you miss'] },
    ],
    habits: [
      { name: 'HIIT or a run', emoji: '🔥', coins: 8, color: 'peach' },
      { name: 'Message a friend', emoji: '💌', coins: 3, color: 'blush' },
      { name: 'Eat a rainbow', emoji: '🥦', coins: 3, color: 'mint' },
    ],
    note: 'This is your most fertile time of the cycle.',
  },
  luteal: {
    name: 'Luteal', season: 'Inner autumn', emoji: '🍂', color: '#c9b8e8', light: '#eee8f8', energy: 3,
    short: 'Wrap things up and be kind to yourself',
    blurb: 'Progesterone rises, then hormones fall before your period. Energy slowly winds down, and PMS can show up near the end.',
    focus: [
      { icon: '✅', title: 'Wrap things up', tips: ['Finish projects and tie up loose ends', 'Detail work, admin and organising', 'Nest: tidy, prep and batch-cook'] },
      { icon: '🏋️', title: 'Move steadily', tips: ['Strength, pilates and steady walks', 'Go gentler in the last week'] },
      { icon: '🍫', title: 'Nourish', tips: ['Complex carbs like oats and sweet potato', 'Magnesium: nuts, seeds, dark chocolate', 'Easy on caffeine, salt and sugar if PMS hits'] },
      { icon: '💗', title: 'Be kind to you', tips: ['Protect your sleep', 'Lower the bar on busy days', 'Plan cosy nights in'] },
    ],
    habits: [
      { name: 'Magnesium snack', emoji: '🍫', coins: 2, color: 'peach' },
      { name: 'Pilates or yoga', emoji: '🧘', coins: 5, color: 'lavender' },
      { name: 'Tidy for 10 minutes', emoji: '🧺', coins: 3, color: 'mint' },
      { name: 'In bed by 10:30', emoji: '😴', coins: 5, color: 'lavender' },
    ],
  },
};

/* ---------- illustrations ---------- */

function plantArt(stage) {
  const leaf = (d, fill) => `<path d="${d}" fill="${fill || '#a8c3a0'}" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
  const flower = (x, y, rx, ry, dist, fill, alt, core) => {
    const n = core > 5 ? 6 : 5;
    const petals = Array.from({ length: n }, (_, i) => `<ellipse cx="0" cy="-${dist}" rx="${rx}" ry="${ry}" transform="rotate(${(360 / n) * i})" fill="${i % 2 ? alt : fill}" stroke="${INK}" stroke-width="1.8"/>`).join('');
    return `<g transform="translate(${x} ${y})">${petals}<circle r="${core}" fill="#f6d365" stroke="${INK}" stroke-width="1.8"/><circle cx="-${(core * 0.28).toFixed(2)}" cy="-${(core * 0.28).toFixed(2)}" r="${(core * 0.24).toFixed(2)}" fill="#fff" opacity=".8"/></g>`;
  };
  let plant = '';
  if (stage === 0) {
    plant = `<ellipse cx="60" cy="83" rx="7" ry="5" fill="#c8a27a" stroke="${INK}" stroke-width="2"/><path d="M57.5 80.5q2.5-2.4 5 0" stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  } else {
    const top = [0, 70, 54, 46, 44, 44][stage];
    if (stage === 5) {
      plant += `<path d="M59.6 77C50 76.5 39 72 32.5 62" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M60.4 67.5C70 67.5 81.5 64 87.5 55" stroke="${INK}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
    }
    plant += `<path d="M60 88C59 ${(88 + top) / 2} 61.5 ${top + 8} 60 ${top}" stroke="${INK}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    if (stage === 1) {
      plant += leaf('M60 73c-8 1-13.5-3-14.5-9.5 7.5-1 12.5 2.5 14.5 9.5z') + leaf('M60 72.5c7.5 0 12.5-4.5 13.5-10.5-7.5 0-12.5 3.5-13.5 10.5z', '#c4dbbb');
    } else {
      plant += leaf('M60 78c-10.5 1-16.5-4-17.5-11.5 8.5-1 15.5 3 17.5 11.5z') + leaf('M60.5 71c9.5-1 14.5-6.5 15.5-13.5-8.5 0-14.5 5-15.5 13.5z', '#c4dbbb');
      plant += leaf('M60 62c-8.5 0-12.5-4.5-13.5-10.5 7.5 0 12.5 4 13.5 10.5z', '#c4dbbb') + leaf('M60.5 58.5c7.5-1 11.5-5.5 12.5-11.5-7.5 0-11.5 4.5-12.5 11.5z');
    }
    if (stage === 3) {
      plant += `<path d="M60 47c-6-3.5-6.5-11.5 0-16.5 6.5 5 6 13 0 16.5z" fill="#f4b9b2" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M60 47c-2.5-2-3-6.5 0-10" stroke="${INK}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
    }
    if (stage >= 4) plant += flower(60, 36, 6, 8.6, 9, '#f4b9b2', '#f8cfc9', 5.8);
    if (stage === 5) plant += flower(31.5, 58, 4.2, 5.6, 6, '#c9b8e8', '#ddd2f1', 3.6) + flower(88.5, 52, 4.2, 5.6, 6, '#f7c59f', '#fbd9bd', 3.6);
  }
  const happy = stage >= 4;
  const eyes = happy
    ? `<path d="M48.5 106.5q3-3.4 6 0M65.5 106.5q3-3.4 6 0" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>`
    : `<circle cx="51.5" cy="105.5" r="2" fill="${INK}"/><circle cx="68.5" cy="105.5" r="2" fill="${INK}"/>`;
  const pot = `
    <path d="M33.5 93h53l-6 25.5a5 5 0 0 1-4.9 3.9H44.4a5 5 0 0 1-4.9-3.9z" fill="#e9a17f" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
    <rect x="29" y="84.5" width="62" height="11" rx="4" fill="#f2b896" stroke="${INK}" stroke-width="2.4"/>
    ${eyes}
    <path d="M57 110.5q3 2.8 6 0" stroke="${INK}" stroke-width="1.9" fill="none" stroke-linecap="round"/>
    <ellipse cx="45.5" cy="110.5" rx="3.4" ry="2" fill="#f4b9b2"/><ellipse cx="74.5" cy="110.5" rx="3.4" ry="2" fill="#f4b9b2"/>`;
  const star = (x, y, s) => `<path class="twinkle" d="M${x} ${y - s}l${s * .3} ${s * .7} ${s * .7} ${s * .3}-${s * .7} ${s * .3}-${s * .3} ${s * .7}-${s * .3}-${s * .7}-${s * .7}-${s * .3} ${s * .7}-${s * .3}z" fill="#f6d365" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>`;
  const sparkles = stage === 5 ? star(18, 34, 6) + star(100, 22, 7) + star(106, 76, 5) : stage === 4 ? star(96, 28, 6) : '';
  return `<svg class="plant" viewBox="0 0 120 130" aria-hidden="true"><g class="sway${stage ? ' grow' : ''}">${plant}</g>${pot}${sparkles}</svg>`;
}

// The little flower on Today's progress bar that marks where the plant blooms.
function bloomMark() {
  const petals = [0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-4.4" rx="3.1" ry="4.2" transform="rotate(${a})" fill="#f4b9b2" stroke="${INK}" stroke-width="1.3"/>`).join('');
  return `<svg viewBox="-10.5 -10.5 21 21" aria-hidden="true">${petals}<circle r="2.7" fill="#f6d365" stroke="${INK}" stroke-width="1.3"/></svg>`;
}

function jarArt(balance) {
  const n = Math.max(0, Math.min(10, Math.ceil(balance / 20)));
  const spots = [[45, 105], [61, 107], [77, 104], [53, 94], [69, 94], [44, 84], [60, 83], [76, 85], [52, 72], [68, 73]];
  const coins = spots.slice(0, n).map(([x, y], i) => `<g transform="translate(${x} ${y}) rotate(${(i * 37) % 50 - 25})"><ellipse rx="8.5" ry="7" fill="#f6d365" stroke="${INK}" stroke-width="1.8"/><ellipse rx="4.8" ry="3.8" fill="none" stroke="#d9a62e" stroke-width="1.4"/></g>`).join('');
  const body = 'M41 35h38v5c11 4 17 12 17 25v41a13 13 0 0 1-13 13H37a13 13 0 0 1-13-13V65c0-13 6-21 17-25z';
  return `<svg class="jar" viewBox="0 0 120 130" aria-hidden="true">
    <path d="${body}" fill="#eef6f4"/>
    ${coins}
    <path d="${body}" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
    <rect x="36" y="22" width="48" height="14" rx="5" fill="#c9b8e8" stroke="${INK}" stroke-width="2.4"/>
    <path d="M42 29h36" stroke="${INK}" stroke-width="1.4" stroke-dasharray="3 3" stroke-linecap="round"/>
    <path d="M32 70c0-6 2-11 7-14" stroke="#fff" stroke-width="3.2" fill="none" stroke-linecap="round" opacity=".9"/>
    <circle cx="52" cy="58" r="2" fill="${INK}"/><circle cx="68" cy="58" r="2" fill="${INK}"/>
    <path d="M57 62.5q3 2.8 6 0" stroke="${INK}" stroke-width="1.9" fill="none" stroke-linecap="round"/>
    <ellipse cx="46.5" cy="63" rx="3.2" ry="1.9" fill="#f4b9b2"/><ellipse cx="73.5" cy="63" rx="3.2" ry="1.9" fill="#f4b9b2"/>
  </svg>`;
}

function moonArt() {
  return `<svg class="art" viewBox="0 0 120 110" aria-hidden="true">
    <path d="M100 66A36 36 0 1 1 58 22a28 28 0 0 0 42 44z" fill="#f6e3a1" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M41 63q3.5 3 7 0M55 70q3.5 3 7 0" stroke="${INK}" stroke-width="2" fill="none" stroke-linecap="round"/>
    <path d="M48.5 78q4 3 8 0" stroke="${INK}" stroke-width="1.8" fill="none" stroke-linecap="round"/>
    <ellipse cx="38" cy="71" rx="3.4" ry="2" fill="#f4b9b2"/><ellipse cx="64" cy="79" rx="3.4" ry="2" fill="#f4b9b2"/>
    <path d="M92 16l1.6 3.6 3.6 1.6-3.6 1.6-1.6 3.6-1.6-3.6-3.6-1.6 3.6-1.6z" fill="#fff" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M104 38l1.1 2.4 2.4 1.1-2.4 1.1-1.1 2.4-1.1-2.4-2.4-1.1 2.4-1.1z" fill="#f4b9b2" stroke="${INK}" stroke-width="1.2" stroke-linejoin="round"/>
    <circle cx="22" cy="24" r="2.2" fill="#c9b8e8" stroke="${INK}" stroke-width="1.2"/>
  </svg>`;
}

function flameArt() {
  return `<svg class="flame" viewBox="0 0 60 64" aria-hidden="true">
    <path d="M30 61c-12.5 0-20.5-8-20.5-18.5C9.5 30 20 26 22 11c8.5 4.5 12.5 11 12.5 17 3-2 4.2-6 4.2-9.5 6.3 5.3 12.3 13.8 12.3 24C51 53 42.5 61 30 61z" fill="#f7c59f" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M30 58c-6.5 0-10.8-4.2-10.8-9.6 0-6.4 6.2-8.6 7.4-15.6 5 3 7.2 7.2 7.2 11.4 2-1 3-3 3-5.2 3.4 3 5.6 6.4 5.6 10.4 0 5.2-5 8.6-12.4 8.6z" fill="#f6d365" stroke="${INK}" stroke-width="1.8" stroke-linejoin="round"/>
    <circle cx="25.5" cy="47.5" r="1.8" fill="${INK}"/><circle cx="34.5" cy="47.5" r="1.8" fill="${INK}"/>
    <path d="M27.5 51.5q2.5 2.2 5 0" stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/>
  </svg>`;
}

function canArt() {
  return `<svg class="art" viewBox="0 0 120 110" aria-hidden="true">
    <path d="M30 48h46l-4 46a6 6 0 0 1-6 5.5H40a6 6 0 0 1-6-5.5z" fill="#a9cce3" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M76 58l24-16 4 5-22 20" fill="#a9cce3" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M38 48c0-12 30-12 30 0" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>
    <path d="M106 52l3 5M100 56l2 6M110 46l4 3" stroke="#a9cce3" stroke-width="2.4" stroke-linecap="round"/>
    <circle cx="46" cy="72" r="2" fill="${INK}"/><circle cx="60" cy="72" r="2" fill="${INK}"/>
    <path d="M50 77q3 2.8 6 0" stroke="${INK}" stroke-width="1.9" fill="none" stroke-linecap="round"/>
    <ellipse cx="40.5" cy="77" rx="3.2" ry="1.9" fill="#f4b9b2"/><ellipse cx="65.5" cy="77" rx="3.2" ry="1.9" fill="#f4b9b2"/>
    <path d="M14 98c4-8 10-8 12 0" fill="#a8c3a0" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>
    <path d="M20 98v-6" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
  </svg>`;
}

function giftArt() {
  return `<svg class="art" viewBox="0 0 120 110" aria-hidden="true">
    <rect x="28" y="46" width="64" height="18" rx="4" fill="#f4b9b2" stroke="${INK}" stroke-width="2.4"/>
    <path d="M33 64h54v30a5 5 0 0 1-5 5H38a5 5 0 0 1-5-5z" fill="#fbe4e0" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M60 46v53" stroke="${INK}" stroke-width="2.4"/><rect x="54" y="46" width="12" height="53" fill="#c9b8e8" stroke="${INK}" stroke-width="2.4"/>
    <path d="M60 46c-6-14-24-18-24-8 0 6 10 8 24 8zM60 46c6-14 24-18 24-8 0 6-10 8-24 8z" fill="#c9b8e8" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
    <circle cx="44" cy="80" r="2" fill="${INK}"/><circle cx="76" cy="80" r="2" fill="${INK}"/>
    <path d="M13 30l2 4.4 4.4 2-4.4 2-2 4.4-2-4.4-4.4-2 4.4-2z" fill="#f6d365" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
    <path d="M104 22l1.6 3.4 3.4 1.6-3.4 1.6-1.6 3.4-1.6-3.4-3.4-1.6 3.4-1.6z" fill="#f6d365" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
  </svg>`;
}

function bookArt() {
  return `<svg class="art" viewBox="0 0 120 110" aria-hidden="true">
    <path d="M60 36c-12-8-28-9-40-5v58c12-4 28-3 40 5z" fill="#fbf3d5" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M60 36c12-8 28-9 40-5v58c-12-4-28-3-40 5z" fill="#fffdf8" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>
    <path d="M29 46c8-2 16-1 22 2M29 56c8-2 16-1 22 2M69 48c6-3 14-4 22-2M69 58c6-3 14-4 22-2" stroke="#c9b9a4" stroke-width="2" stroke-linecap="round"/>
    <path d="M86 70c-4-6 2-12 8-8-1 6-4 8-8 8z" fill="#a8c3a0" stroke="${INK}" stroke-width="1.8"/>
    <path d="M60 36v58" stroke="${INK}" stroke-width="2"/>
    <path d="M100 18l1.6 3.4 3.4 1.6-3.4 1.6-1.6 3.4-1.6-3.4-3.4-1.6 3.4-1.6z" fill="#f4b9b2" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>
  </svg>`;
}

const BLOOMS = ['#f4b9b2', '#c9b8e8', '#f7c59f', '#e8a0b4', '#a9cce3', '#f6e3a1'];
function gardenCell(kind, seed) {
  const soil = '<ellipse cx="10" cy="16.2" rx="5.2" ry="2" fill="#d6c0a0"/>';
  const stem = `<path d="M10 16V8.5" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/>`;
  const leaves = `<path d="M10 13.2c-2.6.2-4-1-4.4-2.8 2.2-.3 3.8.8 4.4 2.8zM10 12c2.4 0 3.7-1.2 4-3-2.1 0-3.6 1.1-4 3z" fill="#a8c3a0" stroke="${INK}" stroke-width=".9" stroke-linejoin="round"/>`;
  if (kind === 'none') return '<svg viewBox="0 0 20 20"><circle cx="10" cy="15" r="1.3" fill="#d6c0a0"/></svg>';
  if (kind === 'soil') return `<svg viewBox="0 0 20 20">${soil}<path d="M8.6 14.6q1.4-1.6 2.8 0" stroke="#b39674" stroke-width="1" fill="none" stroke-linecap="round"/></svg>`;
  if (kind === 'sprout') return `<svg viewBox="0 0 20 20">${soil}<path d="M10 16v-3.4" stroke="${INK}" stroke-width="1.3" stroke-linecap="round"/><path d="M10 13.4c-2.2.1-3.4-.9-3.7-2.4 1.9-.2 3.2.7 3.7 2.4zM10 13c2 0 3.1-1 3.4-2.5-1.8 0-3 .9-3.4 2.5z" fill="#a8c3a0" stroke="${INK}" stroke-width=".9" stroke-linejoin="round"/></svg>`;
  const col = BLOOMS[seed % BLOOMS.length];
  if (kind === 'bud') return `<svg viewBox="0 0 20 20">${soil}${stem}${leaves}<path d="M10 9.4c-2-1.2-2.2-3.8 0-5.4 2.2 1.6 2 4.2 0 5.4z" fill="${col}" stroke="${INK}" stroke-width="1" stroke-linejoin="round"/></svg>`;
  const petals = [0, 72, 144, 216, 288].map(a => `<ellipse cx="0" cy="-3" rx="2.3" ry="3.1" transform="rotate(${a})" fill="${col}" stroke="${INK}" stroke-width=".9"/>`).join('');
  const sparkle = kind === 'perfect' ? `<path d="M16.6 1.4l.7 1.6 1.6.7-1.6.7-.7 1.6-.7-1.6-1.6-.7 1.6-.7z" fill="#f6d365" stroke="${INK}" stroke-width=".7" stroke-linejoin="round"/>` : '';
  return `<svg viewBox="0 0 20 20">${soil}${stem}${leaves}<g transform="translate(10 6.6)">${petals}<circle r="1.8" fill="#f6d365" stroke="${INK}" stroke-width=".9"/></g>${sparkle}</svg>`;
}
