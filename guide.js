/* Little Grove — the in-depth cycle guide: what's going on, how you might feel and what helps.
   General wellbeing information, not medical advice. */
'use strict';

// Where you are within a phase, for "Today in your cycle" and the phase chip on Today.
const STAGES = {
  'period-heavy': {
    label: 'Period, days 1–2',
    title: 'The heaviest days',
    short: 'Heaviest days: rest, warmth and iron',
    what: 'Oestrogen and progesterone are at their lowest and your uterus is shedding its lining. Prostaglandins, the chemicals that make it squeeze, peak now, so cramps, back ache and an upset tummy are most likely in the first day or two.',
    try: [
      'If you use pain relief, take it at the first twinge rather than waiting for the pain to build (follow the packet).',
      'Heat on your lower tummy or back for 15–20 minutes at a time.',
      'A warm, iron-rich meal: lentil soup, or a beef or tofu stir-fry with greens.',
      'A slow walk or a few gentle stretches if you’re up to it. Movement can ease cramps.',
    ],
    ease: [
      'Hard workouts and packed plans if you’re hurting.',
      'Tea or coffee with meals, as it blocks some iron. Have it an hour either side.',
    ],
  },
  'period-light': {
    label: 'Period, day 3 on',
    title: 'Flow easing off',
    short: 'Flow easing: gentle movement and reflection',
    what: 'Bleeding usually lightens from about day 3 as oestrogen starts climbing again. Many people feel their energy and mood lift towards the end of their period.',
    try: [
      'Keep the iron coming: leafy greens, beans, eggs, red meat or fortified cereal, with some vitamin C.',
      'Gentle to moderate movement: a longer walk, yoga or an easy swim.',
      'Look back on last cycle: what helped, and what you’d like more of this time.',
      'Get to bed a little earlier if you still feel flat.',
    ],
    ease: ['Pushing through exhaustion. Rest counts as progress.'],
  },
  'fol-early': {
    label: 'Follicular, early',
    title: 'A fresh start',
    short: 'Energy rising: a good time to start things',
    what: 'FSH from your brain is helping an egg mature, and the growing follicle makes more oestrogen each day. Your uterine lining rebuilds, and energy, mood and patience often lift.',
    try: [
      'Start something: a project, a routine or the habit you’ve been putting off.',
      'Build up your workouts: try a new class or add a little intensity.',
      'Plan the weeks ahead while your head feels clear.',
      'Colourful meals with protein to fuel the extra activity.',
    ],
    ease: ['Saying yes to everything. Leave some space as your energy builds.'],
  },
  'fol-late': {
    label: 'Follicular, late',
    title: 'Building to your peak',
    short: 'Near your peak: tackle the hard stuff',
    what: 'Oestrogen is climbing towards its peak. Many people feel more driven, confident and quick-thinking, and hard workouts often feel easier now.',
    try: [
      'Tackle the hardest thing on your list.',
      'Strength training, or go for a personal best if you feel strong.',
      'Brainstorm, pitch ideas or have that tricky conversation.',
      'Fibre and fermented foods like yoghurt, kefir or kimchi for your gut.',
    ],
    ease: ['Skipping your warm-up before hard sessions. It’s always worth the five minutes.'],
  },
  ovu: {
    label: 'Ovulation window',
    title: 'Ovulation window',
    short: 'Ovulation: speak up, connect, go for it',
    what: 'A surge of LH tells your ovary to release an egg, usually within about a day and a half. Oestrogen peaks just before, and testosterone rises a little, which can lift confidence and libido. The egg lives about a day, but sperm can survive up to five, so this is your most fertile time.',
    try: [
      'Big conversations, presentations, dates and catch-ups.',
      'High-energy movement like HIIT, a run or a dance class, if it feels good.',
      'Notice the signs: clear, stretchy discharge and a one-sided twinge are common around ovulation.',
      'Plenty of water and fibre-rich veg.',
    ],
    ease: ['Using app predictions as contraception. They’re estimates, not protection.'],
  },
  'lut-early': {
    label: 'Luteal, early',
    title: 'Steady and settled',
    short: 'Steady days: finish things and eat well',
    what: 'After ovulation, the empty follicle (now called the corpus luteum) makes progesterone. It nudges your temperature up by around 0.2–0.5 °C, can make you feel calmer and a bit sleepier, and slightly raises your appetite.',
    try: [
      'Steady, detailed work: finishing, editing, organising.',
      'Strength training, pilates or longer steady walks.',
      'Eat enough. Slightly bigger, protein-rich meals and snacks are normal now.',
      'Keep your room cool and your bedtime regular, as warmer nights can disturb sleep.',
    ],
    ease: ['Starting lots of new things at once. Finishing feels better than starting now.'],
  },
  'lut-late': {
    label: 'Pre-period days',
    title: 'Pre-period days',
    short: 'Pre-period: lower the bar and be kind to you',
    what: 'If you’re not pregnant, progesterone and oestrogen fall over these days. That drop brings PMS for many people: bloating, sore breasts, cravings, headaches, spots, lighter sleep and a shorter fuse. It usually eases within a few days of your period starting.',
    try: [
      'Lower the bar: shorter to-do lists and buffer time between plans.',
      'Regular meals with protein and slow carbs (oats, wholegrain bread, sweet potato) to steady cravings and moods.',
      'Gentle movement most days. Walking, yoga or swimming can ease PMS.',
      'Less salt and more water if you feel bloated.',
      'Pack your period kit so you’re not caught out.',
    ],
    ease: [
      'Alcohol and lots of caffeine, which can worsen sleep, anxiety and sore breasts.',
      'Big decisions when you’re feeling raw. Sleep on them.',
    ],
  },
  late: {
    label: 'Period late',
    title: 'Waiting for your period',
    short: 'Period late: be gentle and keep logging',
    what: 'Cycles can shift by several days, or more after stress, illness, travel, big changes in exercise or weight, or stopping hormonal contraception. It’s usually ovulation that moves: once you ovulate, your period tends to come about two weeks later.',
    try: [
      'If you could be pregnant, take a test. Most are accurate from the day your period was due.',
      'Keep logging so Little Grove learns your real rhythm.',
      'Look after the basics: sleep, regular meals and a break from stress.',
    ],
    ease: ['Worrying alone. If you’ve had no period for 3 months and you’re not pregnant, check in with your GP.'],
  },
};

// Deep dives for each phase, shown as fold-out sections on the Cycle page.
// Each section has any of: intro (a line), rows ([label, text]), points (a list) and tip.
const GUIDE = {
  menstrual: [
    {
      icon: '🧠', title: 'What’s happening in your body',
      intro: 'Day 1 of your cycle is the first day of real bleeding, not spotting.',
      points: [
        'Oestrogen and progesterone are at their lowest. Their drop at the end of last cycle is what started your period.',
        'Your uterus sheds the lining it built up. Periods usually last 2–7 days, and the total loss is often only 2–3 tablespoons of blood, even if it looks like more.',
        'Prostaglandins make the uterus squeeze to shed its lining. They cause cramps, and can also bring back ache, nausea, headaches and loose poos.',
        'Behind the scenes, FSH is already rising to start growing next cycle’s egg.',
      ],
    },
    {
      icon: '💗', title: 'How you might feel',
      rows: [
        ['Energy', 'Often lowest on days 1–2, then picking up as bleeding eases.'],
        ['Mood', 'Many people feel relief as PMS lifts. Some feel quieter and more inward.'],
        ['Body', 'Cramps, back ache, a sensitive tummy and sometimes headaches. Sore breasts usually settle.'],
        ['Sleep', 'Pain and worry about leaks can break your sleep, so you may need more of it.'],
        ['Appetite', 'Warm, hearty food often appeals. That’s normal.'],
      ],
    },
    {
      icon: '🍲', title: 'Food & drink',
      rows: [
        ['Iron', 'Replaces what you lose. Red meat, chicken, fish, eggs, lentils, chickpeas, tofu, spinach and iron-fortified cereal.'],
        ['Vitamin C', 'Helps you absorb iron from plant foods. Add capsicum, citrus, berries, kiwi fruit or tomato.'],
        ['Omega-3 fats', 'May ease period pain. Salmon, sardines, walnuts, chia and flaxseed.'],
        ['Magnesium', 'Helps muscles relax. Nuts, seeds, wholegrains, leafy greens and dark chocolate.'],
        ['Warm drinks', 'Water, ginger tea for nausea, and peppermint tea for a crampy tummy.'],
      ],
      tip: 'Easy ideas: lentil and veggie soup, a beef or tofu stir-fry with broccoli and capsicum, or porridge with berries and seeds. Go easy on very salty food, alcohol, and tea or coffee right with meals.',
    },
    {
      icon: '🧘', title: 'Movement',
      points: [
        'Gentle is great: walking, stretching, yin or restorative yoga, an easy swim or bike ride.',
        'Stretches for cramps and back ache: child’s pose, cat–cow, knees to chest and lying twists.',
        'Regular exercise across the whole month is linked with less painful periods.',
        'If you feel good, train as normal. There’s no rule that says you must rest.',
      ],
    },
    {
      icon: '📝', title: 'Work & focus',
      points: [
        'A good time to review rather than launch: look back at the month, tidy loose ends and plan.',
        'Batch easy admin on the sorest days, and move non-urgent meetings if you can.',
        'Ask for flexibility if you need it, like working from home or a later start on a rough day.',
      ],
    },
    {
      icon: '👯', title: 'Relationships',
      points: [
        'Wanting more time alone is normal. Let people close to you know how you’re going.',
        'Cosy, low-key plans: a movie night, a slow walk, a phone call.',
        'Period sex is fine if you both want it, and orgasms ease cramps for some people. Pregnancy is less likely but still possible, and STIs can still pass on.',
      ],
    },
    {
      icon: '🛌', title: 'Sleep & self-care',
      points: [
        'Aim for an extra half hour of sleep if you can.',
        'Lying on your side with your knees tucked up can ease cramps. Period undies or an overnight pad can stop leak worries.',
        'A warm bath, heat pack or hot water bottle helps muscles relax.',
        'Change tampons every 4–8 hours (never longer than 8), and pads and cups as their instructions say.',
        'Journal: what drained you this cycle, and what filled you up?',
      ],
    },
    {
      icon: '🌿', title: 'Common symptoms & what helps',
      rows: [
        ['Cramps', 'Heat, gentle movement and anti-inflammatory pain relief such as ibuprofen or naproxen, started early and taken as the packet says. Ask a pharmacist first if you have asthma, or stomach, kidney or heart problems.'],
        ['Back ache', 'Heat on your lower back, stretches like child’s pose, and the same pain relief as for cramps.'],
        ['Nausea', 'Small plain snacks, ginger, fresh air and sips of water. Anti-inflammatory pain relief taken with food can help too.'],
        ['Loose poos', 'Common on days 1–2. Keep your fluids up and go easy on spicy or greasy food.'],
        ['Tiredness', 'Rest, iron-rich food, and a blood test from your GP if you’re always exhausted or breathless. Low iron is common with periods.'],
        ['Headaches', 'Water, regular meals and steady sleep. Migraines around periods are common, and a GP can help prevent them.'],
      ],
    },
    {
      icon: '⚠️', title: 'Check with a doctor if',
      points: [
        'You soak a pad or tampon every 1–2 hours, pass clots bigger than about 2.5 cm, or bleed for more than 7 days.',
        'Pain relief doesn’t help, or the pain stops you doing everyday things. Conditions like endometriosis are common, often missed, and treatable.',
        'You feel faint, dizzy, breathless or tired all the time.',
        'You get a sudden fever, vomiting, a sunburn-like rash or feel faint while using a tampon or cup. Take it out and get urgent help, as this can be toxic shock syndrome.',
      ],
    },
  ],
  follicular: [
    {
      icon: '🧠', title: 'What’s happening in your body',
      intro: 'The follicular phase officially starts on day 1, but you feel it most in the days after your period, up to ovulation. It’s the part of the cycle that varies most in length.',
      points: [
        'FSH from your brain wakes up a group of follicles in your ovaries. Usually one takes the lead and matures an egg.',
        'That follicle makes oestrogen, which rises day by day and rebuilds the lining of your uterus.',
        'Discharge often goes from dry or sticky to creamier and wetter as ovulation gets closer.',
        'Stress, illness and travel can stretch this phase, which is why some cycles run long.',
      ],
    },
    {
      icon: '💗', title: 'How you might feel',
      rows: [
        ['Energy', 'Climbing day by day. Many people feel their best mix of energy and calm.'],
        ['Mood', 'Often brighter, more optimistic and more patient.'],
        ['Focus', 'A good time for learning, planning and creative thinking.'],
        ['Body', 'Bloating eases, and skin often looks clearer.'],
        ['Sleep', 'Usually steady and refreshing.'],
        ['Appetite', 'Often a little lower than before your period.'],
      ],
    },
    {
      icon: '🥗', title: 'Food & drink',
      rows: [
        ['Protein', 'Helps you recover as you move more. Eggs, Greek yoghurt, fish, chicken, tofu, tempeh and beans.'],
        ['Fibre & fermented foods', 'Feed a happy gut. Wholegrains, veg, fruit, yoghurt, kefir, kimchi and sauerkraut.'],
        ['Iron, still', 'Keep topping up after your period, especially if it was heavy.'],
        ['Healthy fats', 'Avocado, olive oil, nuts and seeds help you absorb vitamins and stay full.'],
      ],
      tip: 'Easy ideas: a grain bowl with chicken or tofu and lots of colourful veg, overnight oats with yoghurt and berries, or eggs on wholegrain toast with spinach.',
    },
    {
      icon: '🏃', title: 'Movement',
      points: [
        'A great time to build: try a new class, add a little weight or speed, or start a running plan.',
        'Many people find hard sessions feel easier and recovery quicker now.',
        'Mix strength training with cardio you enjoy.',
        'Warm up properly as the intensity rises.',
      ],
    },
    {
      icon: '📝', title: 'Work & focus',
      points: [
        'Start projects, brainstorm and set goals for the month.',
        'Learn something new or tackle the skill you’ve been avoiding.',
        'Book in the tasks that need fresh energy over the next week or two.',
      ],
    },
    {
      icon: '👯', title: 'Relationships',
      points: [
        'You may feel more open and social, so say yes to plans you’ll enjoy.',
        'Try something new together: a class, a new walk or a new place to eat.',
      ],
    },
    {
      icon: '🛌', title: 'Sleep & self-care',
      points: [
        'Keep a regular bedtime, even if you feel full of energy.',
        'Get outside in the morning light. It helps your body clock and mood.',
        'Jot down how you feel this week, so you can spot your own patterns.',
      ],
    },
    {
      icon: '🌿', title: 'Common symptoms & what helps',
      rows: [
        ['Spotting', 'Light spotting just after a period can be normal, but tell your GP about bleeding between periods.'],
        ['Restlessness', 'Put it into movement or a project, and keep caffeine moderate so you still sleep well.'],
        ['Still flat', 'If you’re still low on energy a week after your period, think about iron, sleep and stress, and see your GP if it lasts.'],
      ],
    },
    {
      icon: '⚠️', title: 'Check with a doctor if',
      points: [
        'Your period hasn’t come for 3 months or more and you’re not pregnant.',
        'You bleed between periods or after sex.',
        'Your cycles are often shorter than 21 days or longer than 35.',
      ],
    },
  ],
  ovulatory: [
    {
      icon: '🧠', title: 'What’s happening in your body',
      intro: 'Ovulation usually happens about two weeks before your next period, which isn’t always day 14.',
      points: [
        'Peak oestrogen triggers a surge of LH, and the follicle releases an egg, usually within about a day and a half.',
        'The egg survives 12–24 hours. Sperm can live up to 5 days, so the fertile window is roughly the 5 days before ovulation plus the day itself.',
        'Discharge becomes clear, slippery and stretchy, like raw egg white, to help sperm along.',
        'Testosterone rises a little too, which is linked with higher libido and confidence.',
        'Some people feel a one-sided twinge or ache when they ovulate (mittelschmerz). It can last a few minutes or a day or two.',
      ],
    },
    {
      icon: '💗', title: 'How you might feel',
      rows: [
        ['Energy', 'Often at its peak.'],
        ['Mood', 'Confident, social and chatty for many people.'],
        ['Libido', 'Commonly at its highest around now.'],
        ['Body', 'A possible ovulation twinge, mild bloating, more discharge and, for some, tender breasts.'],
        ['Appetite', 'Often at its lowest of the whole cycle.'],
      ],
    },
    {
      icon: '🥦', title: 'Food & drink',
      rows: [
        ['Fibre', 'Keeps digestion moving and your gut happy. Veg, fruit, legumes, oats and wholegrains.'],
        ['Colourful plants', 'Berries, leafy greens, tomatoes, capsicum and herbs are packed with antioxidants.'],
        ['Zinc & B vitamins', 'Support energy. Seafood, meat, eggs, nuts, seeds and wholegrains.'],
        ['Water', 'You may sweat more if you’re training hard, so keep a bottle handy.'],
      ],
      tip: 'Easy ideas: a big salad with chickpeas and feta, salmon with greens and quinoa, or fruit and nuts for snacks.',
    },
    {
      icon: '🔥', title: 'Movement',
      points: [
        'Go for it if you feel strong: HIIT, sprints, a long run, a spin or dance class, or team sport.',
        'Group fitness can be extra fun while you’re feeling social.',
        'Warm up well and land jumps softly. Listen to any joint niggles.',
      ],
    },
    {
      icon: '📝', title: 'Work & focus',
      points: [
        'Present, pitch, negotiate or ask for that raise.',
        'Have the important conversations you’ve been putting off.',
        'Collaborate, network and run the meeting.',
      ],
    },
    {
      icon: '👯', title: 'Relationships',
      points: [
        'Lovely for dates, catch-ups and parties.',
        'Reach out to people you’ve lost touch with.',
        'If you don’t want to get pregnant, use reliable contraception. This is your most fertile time, and app predictions aren’t protection.',
      ],
    },
    {
      icon: '🛌', title: 'Sleep & self-care',
      points: [
        'Don’t let a full social calendar eat into your sleep.',
        'A nice time for a little pampering.',
        'Learning your signs (discharge, a twinge, a slightly higher temperature afterwards) helps you know when you ovulate.',
      ],
    },
    {
      icon: '🌿', title: 'Common symptoms & what helps',
      rows: [
        ['Ovulation pain', 'Heat, gentle movement and simple pain relief if needed.'],
        ['Bloating', 'Water, a walk, and go easy on fizzy drinks and very salty food.'],
        ['Spotting', 'A little spotting around ovulation can be normal. Mention it to a GP if it keeps happening.'],
      ],
    },
    {
      icon: '⚠️', title: 'Check with a doctor if',
      points: [
        'Ovulation pain is severe, lasts more than 2–3 days, or comes with fever or vomiting.',
        'You’ve been trying for a baby for a year, or for 6 months if you’re 35 or older.',
        'You have pain during or after sex.',
      ],
    },
  ],
  luteal: [
    {
      icon: '🧠', title: 'What’s happening in your body',
      intro: 'The luteal phase runs from ovulation to your next period. It’s usually 10–16 days and more consistent than the first half of the cycle.',
      points: [
        'The empty follicle becomes the corpus luteum and makes progesterone, plus some oestrogen.',
        'Progesterone raises your resting temperature by around 0.2–0.5 °C and keeps the uterine lining ready for a possible pregnancy.',
        'It also slows your gut, so constipation and bloating are more common.',
        'If you’re not pregnant, the corpus luteum fades after about 10–14 days. Progesterone and oestrogen fall, and that drop starts your period.',
        'That fall is also what brings PMS for many people in the last week.',
      ],
    },
    {
      icon: '💗', title: 'How you might feel',
      rows: [
        ['Energy', 'Steady at first, then lower in the last few days.'],
        ['Mood', 'Calm and focused early on. In the last week you may feel more sensitive, irritable, anxious or low.'],
        ['Focus', 'Good for detail, finishing and organising.'],
        ['Body', 'Bloating, sore breasts, headaches, spots and constipation are common in the last week.'],
        ['Sleep', 'Can be lighter and more broken, especially near your period, partly because you run warmer.'],
        ['Appetite', 'Often higher. Your body uses a little more energy now, so the hunger is real, not a lack of willpower.'],
      ],
    },
    {
      icon: '🍫', title: 'Food & drink',
      rows: [
        ['Slow carbs', 'Steadier energy and mood. Oats, brown rice, wholegrain bread, sweet potato and legumes.'],
        ['Calcium', 'Getting enough has been shown to ease PMS. Dairy, calcium-set tofu, fortified plant milk, almonds and tinned fish with bones.'],
        ['Magnesium', 'May help with bloating, mood and sleep. Pumpkin seeds, almonds, spinach, wholegrains and dark chocolate.'],
        ['Protein at every meal', 'Keeps blood sugar and cravings steadier.'],
        ['Fibre & water', 'Help with constipation and bloating.'],
      ],
      tip: 'Easy ideas: porridge with banana and seeds, a baked sweet potato with beans and yoghurt, or a few squares of dark chocolate with almonds when a craving hits.',
    },
    {
      icon: '🏋️', title: 'Movement',
      points: [
        'Early on, strength training, pilates and steady runs or rides all suit.',
        'In the last week, go gentler if you need to: walks, yoga, swimming, stretching.',
        'Regular aerobic exercise is one of the best-supported ways to ease PMS.',
        'You run warmer now, so you may feel the heat more. Drink water and pace yourself on hot days.',
      ],
    },
    {
      icon: '📝', title: 'Work & focus',
      points: [
        'Finish projects, edit, check details and tie up loose ends.',
        'Clear admin and life admin, and get organised.',
        'In the last week, pad your schedule and avoid stacking big deadlines if you can.',
      ],
    },
    {
      icon: '👯', title: 'Relationships',
      points: [
        'Early on, cosy plans with close people.',
        'In the last week, it helps to tell the people close to you how you’re feeling.',
        'If you feel snappy, pause before reacting. The feeling is real, but it may be louder than usual.',
      ],
    },
    {
      icon: '🛌', title: 'Sleep & self-care',
      points: [
        'Keep your bedroom cool and your bed and wake times regular.',
        'No caffeine after midday, and keep alcohol low. Both hit sleep harder now.',
        'A gentle wind-down: a warm shower, stretching, a book instead of your phone.',
        'Nest: tidy up, prep some meals and get your period kit ready.',
      ],
    },
    {
      icon: '🌿', title: 'Common symptoms & what helps',
      rows: [
        ['Bloating', 'Less salty and processed food, plenty of water, potassium-rich foods (banana, potato, leafy greens) and a walk.'],
        ['Sore breasts', 'A soft, supportive bra (even to sleep in), a warm or cool pack, and less caffeine may help.'],
        ['Cravings', 'Regular meals with protein and slow carbs, satisfying snacks on hand, and a little of what you crave.'],
        ['Spots', 'A gentle cleanser, non-comedogenic moisturiser, and spot treatments with salicylic acid or benzoyl peroxide. Try not to pick.'],
        ['Headaches', 'Water, regular meals and sleep. See a GP if headaches or migraines around your period are frequent.'],
        ['Mood changes', 'Exercise, daylight, people you trust and fewer big decisions. If it’s severe, see a GP: PMDD is real and treatable.'],
      ],
    },
    {
      icon: '⚠️', title: 'Check with a doctor if',
      points: [
        'PMS seriously affects your work, relationships or how you feel about yourself.',
        'Symptoms don’t ease within a few days of your period starting.',
        'Breast pain is in one spot, comes with a lump, or doesn’t follow your cycle.',
        'You have thoughts of harming yourself. Get help now: Lifeline 13 11 14, or 000 in an emergency.',
      ],
    },
  ],
};

// What can help with each symptom and mood you can log. "doctor" finishes the sentence "See a GP if…".
const SYMPTOM_TIPS = {
  Cramps: {
    why: 'Prostaglandins make the muscles of your uterus squeeze to shed its lining. They’re highest on the first day or two.',
    help: [
      'Heat on your lower tummy or back: a heat pack, hot water bottle or warm bath. It can work about as well as over-the-counter pain relief.',
      'Anti-inflammatory pain relief such as ibuprofen or naproxen works best started early, at the first sign of pain or bleeding, and taken regularly for a day or two. Follow the packet, and ask a pharmacist first if you have asthma, or stomach, kidney or heart problems.',
      'Gentle movement: a walk, stretching, or yoga poses like child’s pose and knees to chest.',
      'Ginger (tea, capsules or fresh) has some evidence for easing period pain.',
      'A TENS machine eases cramps for some people.',
      'Regular exercise through the month is linked with less painful periods.',
    ],
    doctor: 'pain relief doesn’t help, the pain stops you doing everyday things or is getting worse over time, or you have pain during sex or between periods.',
  },
  Headache: {
    why: 'Falling oestrogen just before and during your period can trigger headaches and migraines. Not drinking enough, poor sleep and skipped meals make them more likely.',
    help: [
      'Drink a big glass of water, and eat something if it’s been a while.',
      'Rest in a dark, quiet room with a cool cloth on your forehead or neck.',
      'Simple pain relief taken early, following the packet. Using it on more than about 10 days a month can cause rebound headaches.',
      'Keep sleep and meal times regular in the days before your period.',
      'Keep logging them. If they always come at the same point in your cycle, a GP can suggest ways to prevent them.',
    ],
    doctor: 'headaches are severe, frequent or changing. Get urgent help for a sudden, severe “worst ever” headache, or one with weakness, confusion, vision changes or a stiff neck.',
  },
  Bloating: {
    why: 'Shifting hormones make your body hold on to more water before your period, and progesterone slows digestion.',
    help: [
      'Go easy on salty and processed food, and fizzy drinks.',
      'Keep drinking water. Being short on fluids makes constipation and bloating worse.',
      'Eat potassium-rich foods: bananas, potatoes, tomatoes, spinach and avocado.',
      'Go for a walk. Movement gets things moving.',
      'Peppermint tea may settle your tummy.',
      'Add fibre slowly, as too much at once can cause more wind.',
    ],
    doctor: 'bloating happens most days for 3 weeks or more, or comes with tummy pain, feeling full quickly, weight loss or changes to your bowel habits.',
  },
  'Tender breasts': {
    why: 'Higher oestrogen and progesterone in the second half of your cycle can make breast tissue swell and feel sore.',
    help: [
      'Wear a soft, supportive bra that fits well. A sports bra can help, even overnight.',
      'Try a warm compress or a cool pack, whichever feels better.',
      'Cutting back on caffeine helps some people.',
      'Simple pain relief can take the edge off.',
    ],
    doctor: 'you find a new lump, the pain is in one spot, there’s nipple discharge or skin changes, or the pain doesn’t follow your cycle.',
  },
  Spots: {
    why: 'Before your period, oestrogen drops while androgens stay steady, so your skin makes more oil and pores block more easily.',
    help: [
      'Wash twice a day with a gentle cleanser, and after sweating.',
      'Use a non-comedogenic (won’t block pores) moisturiser and sunscreen.',
      'Spot treatments with benzoyl peroxide or salicylic acid can help. Start slowly to avoid dryness.',
      'Try not to pick or squeeze, as it can scar.',
      'Change pillowcases often, and keep hands and phones off your face.',
    ],
    doctor: 'acne is painful, deep or scarring, or it’s getting you down. There are effective prescription treatments.',
  },
  Cravings: {
    why: 'In the luteal phase your body uses a little more energy, and shifting hormones can affect serotonin, which makes sweet and starchy food extra tempting.',
    help: [
      'Eat regular meals with protein, fibre and slow carbs so you’re not running on empty.',
      'Plan satisfying snacks: yoghurt and fruit, toast with peanut butter, a handful of nuts or popcorn.',
      'Enjoy a little of what you crave. Dark chocolate is a lovely choice.',
      'Check whether you’re actually tired, thirsty or stressed.',
      'Be kind to yourself. Eating a bit more now is normal.',
    ],
    doctor: 'eating feels out of control, or the cravings come with feeling very low.',
  },
  Tired: {
    why: 'Low hormones and blood loss during your period, and lighter sleep before it, can all drain your energy.',
    help: [
      'Put sleep first, and keep naps to 20 minutes or less if you need one.',
      'Eat iron-rich foods with some vitamin C, and don’t skip meals.',
      'Get outside in daylight and move a little. It often lifts energy.',
      'Lighten your load where you can.',
    ],
    doctor: 'you’re exhausted most days, breathless, dizzy or pale, or your periods are heavy. A blood test can check your iron.',
  },
  'Back ache': {
    why: 'The same prostaglandins that cause cramps can send pain into your lower back.',
    help: [
      'Heat on your lower back.',
      'Stretches: child’s pose, cat–cow, knees to chest and gentle lying twists.',
      'Anti-inflammatory pain relief, as for cramps.',
      'A gentle walk rather than lots of sitting.',
    ],
    doctor: 'the pain is severe or constant, or comes with fever, numb legs or trouble weeing.',
  },
  Nausea: {
    why: 'Prostaglandins released around your period can upset your gut as well as your uterus.',
    help: [
      'Small, plain snacks often: crackers, toast or rice.',
      'Ginger: tea, ginger biscuits or crystallised ginger.',
      'Sip water or an electrolyte drink slowly.',
      'Fresh air, and rest sitting up.',
      'Anti-inflammatory pain relief taken with food can help, as it lowers prostaglandins.',
    ],
    doctor: 'you can’t keep fluids down, the nausea is severe, or your period is late (you could be pregnant).',
  },
  'Poor sleep': {
    why: 'Progesterone raises your body temperature, and the hormone drop before your period can disturb sleep. Pain and night sweats don’t help.',
    help: [
      'Keep your bedroom cool, dark and quiet, with light bedding.',
      'Go to bed and get up at the same times, even on weekends.',
      'No caffeine after midday, and keep alcohol low.',
      'Wind down for 30 minutes: dim lights, a warm shower, reading or stretching.',
      'If you can’t sleep, get up and do something calm until you feel sleepy.',
    ],
    doctor: 'poor sleep goes on for weeks and affects your days.',
  },
  Happy: {
    why: 'Lovely! Notice what’s helping, so you can come back to it.',
    help: ['Write down what made today good.', 'Use the good energy on something you’ve been putting off.', 'Share it: message someone you love.'],
  },
  Calm: {
    why: 'A settled mind is great for focused work and good decisions.',
    help: ['Take on a task that needs patience or detail.', 'Make the decision you’ve been waiting on.', 'Notice what’s keeping you calm: sleep, routine, people?'],
  },
  Energetic: {
    why: 'Often linked with rising oestrogen in the follicular and ovulatory phases.',
    help: ['Try a harder workout or something new.', 'Tackle a big task or a creative project.', 'Keep your bedtime steady so the energy lasts.'],
  },
  Loving: {
    why: 'Feeling close and affectionate is common around ovulation, when oestrogen and testosterone peak.',
    help: ['Plan time with people you love.', 'Tell someone what you appreciate about them.', 'Do something kind for yourself too.'],
  },
  Sensitive: {
    why: 'Feelings can seem bigger before your period as hormones fall.',
    help: [
      'Name it. “I’m feeling tender today” helps it pass.',
      'Lower the bar and give yourself extra time.',
      'Limit the news and doom-scrolling.',
      'Cry if you need to, then do something soothing.',
      'Tell people you trust what you need.',
    ],
  },
  Irritable: {
    why: 'Falling oestrogen and progesterone, poor sleep and hunger can all shorten your fuse.',
    help: [
      'Eat something. Hunger makes irritability worse.',
      'Move: a brisk walk burns off tension.',
      'Breathe in for 4 and out for 6–8, a few times. A long out-breath calms your body.',
      'Step away before replying to anything that annoys you.',
      'Plan quieter days for your pre-period week.',
    ],
  },
  Anxious: {
    why: 'Hormone shifts can make anxiety louder in the days before your period.',
    help: [
      'Slow your breathing: in for 4, out for 6–8, for a few minutes.',
      'Ground yourself: name 5 things you can see, 4 you can hear and 3 you can touch.',
      'Cut back on caffeine and alcohol.',
      'Move your body, outside if you can.',
      'Write the worries down and pick one small next step.',
    ],
    doctor: 'anxiety is strong or frequent, or stops you doing things. Beyond Blue is there 24/7 on 1300 22 4636.',
  },
  Low: {
    why: 'Feeling down before or during your period is common. If it’s severe every cycle, it could be PMDD, which is treatable.',
    help: [
      'Get some daylight and gentle movement, even 10 minutes.',
      'Reach out to someone, even just a message.',
      'Do one small, kind thing for yourself.',
      'Keep regular meals and sleep.',
      'Keep logging, so you can see if it follows your cycle.',
    ],
    doctor: 'low mood lasts more than two weeks or doesn’t lift after your period. If you have thoughts of harming yourself, call Lifeline on 13 11 14 any time, or 000 in an emergency.',
  },
};

const GET_HELP = {
  gp: [
    'Your periods stop for 3 months or more and you’re not pregnant, or your cycle is often shorter than 21 days or longer than 35.',
    'You bleed between periods or after sex.',
    'Periods are heavy: soaking a pad or tampon every 1–2 hours, clots bigger than about 2.5 cm, or bleeding for more than 7 days.',
    'Period pain isn’t helped by pain relief or stops you doing everyday things, or you have pain during or after sex.',
    'PMS or low mood seriously affects your life, work or relationships. It could be PMDD, which is treatable.',
    'You’re always tired, dizzy or short of breath. You could be low in iron.',
    'Something has changed and doesn’t feel right for you.',
  ],
  urgent: [
    'Severe pain low in your tummy, especially on one side with a late or missed period, or with shoulder-tip pain or fainting.',
    'Very heavy bleeding with dizziness, a racing heart or feeling faint.',
    'A sudden high fever, vomiting, diarrhoea, a sunburn-like rash or confusion while using a tampon or cup. Take it out and get help straight away.',
    'Thoughts of harming yourself.',
  ],
  lines: [
    ['000', '000', 'Emergency'],
    ['1800022222', '1800 022 222', 'healthdirect: talk to a registered nurse, 24/7'],
    ['131114', '13 11 14', 'Lifeline: crisis support, 24/7'],
  ],
};
