/**
 * Generates supabase/seed_pregnancy_weekly_anchors.sql (weeks 1–40).
 * Run: node scripts/generate-pregnancy-anchor-seed.mjs
 */
import path from "node:path";
import { writeAnchorSeed } from "./lib/write-anchor-seed.mjs";

const root = path.resolve(import.meta.dirname, "..");
const cardType = "This week with bub";

/** Development-focused one-liners — editorial review before publish. */
const weekContent = {
  1: {
    title: "Tiny beginnings",
    subtitle: "Week 1 in the womb",
    wish: "You might not even know yet — and that is okay. Week one is chemistry, not kicks.",
    summary: "Fertilisation and early cell division happen in the first week. Most people are not tracking pregnancy this early.",
    doNow: "If you are trying to conceive, gentle habits beat obsessing over symptoms.",
  },
  2: {
    title: "Before the test line",
    subtitle: "Week 2 in the womb",
    wish: "Week two on the calendar is often before a positive test. Waiting is its own sport.",
    summary: "The body prepares for possible implantation. Home tests usually cannot detect pregnancy yet.",
    doNow: "If you are waiting to test, pick a day and put the stick away until then.",
  },
  3: {
    title: "Implantation week",
    subtitle: "Week 3 in the womb",
    wish: "Some people notice implantation spotting. Many notice nothing. Both are normal.",
    summary: "The embryo may implant in the uterine lining. Early hormone shifts begin.",
    doNow: "Rest if you feel wiped out — early fatigue is common.",
  },
  4: {
    title: "A positive test window",
    subtitle: "Week 4 in the womb",
    wish: "Two lines can feel like a plot twist. Take a breath before the to-do list explodes.",
    summary: "Many home tests turn positive around now. A GP visit can confirm and start care planning.",
    doNow: "Book a GP appointment if you have not already — early care helps.",
  },
  5: {
    title: "The neural tube forms",
    subtitle: "Week 5 in the womb",
    wish: "Major structures are forming before you have told anyone. That is a lot to carry quietly.",
    summary: "The neural tube — future brain and spine — is developing. Folic acid support matters in early pregnancy.",
    doNow: "Keep taking pregnancy-safe folate unless your clinician says otherwise.",
  },
  6: {
    title: "Heart tissue starts",
    subtitle: "Week 6 in the womb",
    wish: "Morning sickness may arrive like an uninvited houseguest. Small snacks help some people.",
    summary: "The heart begins to form and beat. Nausea and fatigue are common even when everything is progressing normally.",
    doNow: "Eat something bland before getting out of bed if nausea hits early.",
  },
  7: {
    title: "Brain growth spurt",
    subtitle: "Week 7 in the womb",
    wish: "Your uterus is still smaller than a lemon, but the growth inside is furious.",
    summary: "Brain development accelerates. You might feel emotional swings — hormones are real.",
    doNow: "Tell one trusted person how you are actually feeling this week.",
  },
  8: {
    title: "First prenatal visit often",
    subtitle: "Week 8 in the womb",
    wish: "The dating scan window is approaching for many — seeing something on screen can make it real.",
    summary: "Many GPs refer for early ultrasound around eight to ten weeks. Limb buds are forming.",
    doNow: "Write down questions for your appointment — brain fog is allowed.",
  },
  9: {
    title: "Moving, invisibly",
    subtitle: "Week 9 in the womb",
    wish: "Bub is already making tiny movements you cannot feel. Secret gymnastics.",
    summary: "Embryo becomes fetus around now. Organs keep specialising rapidly.",
    doNow: "Hydrate in sips if big gulps trigger nausea.",
  },
  10: {
    title: "Critical period continues",
    subtitle: "Week 10 in the womb",
    wish: "The first trimester finish line is in sight. That does not mean symptoms vanish overnight.",
    summary: "Major organ formation continues. Risk of certain developmental issues drops as the first trimester progresses.",
    doNow: "Celebrate making it to double digits — ten weeks is worth noting.",
  },
  11: {
    title: "Almost second trimester",
    subtitle: "Week 11 in the womb",
    wish: "Energy may start creeping back soon for some. For others, nausea lingers — both stories happen.",
    summary: "Bub looks more like a tiny human on scan. The placenta takes over more hormone production.",
    doNow: "Plan one small treat for yourself this week — you are doing hard work.",
  },
  12: {
    title: "Fingers are separating",
    subtitle: "Week 12 in the womb",
    wish: "Those tiny hand bumps are starting to look like actual fingers — wild that this is happening while you are still in the first trimester fog.",
    summary: "Around now, fingers and toes are separating. Bub is still small, but the blueprint is getting clearer every day.",
    doNow: "If nausea is easing, notice one small comfort win this week — it counts.",
  },
  13: {
    title: "A more defined little body",
    subtitle: "Week 13 in the womb",
    wish: "The head is still oversized (classic baby proportions), but the rest of bub is catching up.",
    summary: "Your baby is growing quickly now. Organs keep maturing and movement is increasing, even if you cannot feel it yet.",
    doNow: "Drink water when you remember — hydration helps more than perfect tracking.",
  },
  14: {
    title: "Expressions are practising",
    subtitle: "Week 14 in the womb",
    wish: "Bub can squint and frown in there. It is practice, not commentary on your snack choices.",
    summary: "Facial muscles are active. Many parents start feeling a little more energy as the second trimester approaches.",
    doNow: "Take a slow walk or stretch if it feels good — comfort beats intensity.",
  },
  15: {
    title: "Bones are hardening",
    subtitle: "Week 15 in the womb",
    wish: "The skeleton is shifting from soft cartilage toward bone. You are literally building a tiny human from scratch.",
    summary: "Bone development continues and bub is moving more. You might still not feel kicks — that is normal.",
    doNow: "Check whether your care pathway booking is on track if you have not already.",
  },
  16: {
    title: "Movement is happening",
    subtitle: "Week 16 in the womb",
    wish: "Some parents feel the first flutters around now. Others wait weeks longer. Both are normal.",
    summary: "Your baby is active in the womb. First movements can feel like bubbles or gentle taps.",
    doNow: "Notice when you are most still — that is often when you will feel movement first.",
  },
  17: {
    title: "Fat stores are starting",
    subtitle: "Week 17 in the womb",
    wish: "Bub is beginning to lay down fat that will help with temperature regulation after birth.",
    summary: "Growth continues and the body is preparing for life outside. The morphology scan window is often coming up.",
    doNow: "If your scan is not booked, a quick call to the clinic saves last-minute stress.",
  },
  18: {
    title: "Ears are tuning in",
    subtitle: "Week 18 in the womb",
    wish: "Your baby can hear muffled sounds from inside your body — heartbeat, digestion, your voice nearby.",
    summary: "Hearing pathways are developing. Talking or singing to your bump is less silly than it feels.",
    doNow: "Say one thing out loud to bub today — partner counts too.",
  },
  19: {
    title: "A protective coating",
    subtitle: "Week 19 in the womb",
    wish: "A waxy coating called vernix is forming on the skin. It protects bub in the amniotic fluid.",
    summary: "Skin development continues. Movements may feel stronger if you have already felt kicks.",
    doNow: "Note any new movement patterns — you do not need to count yet, just notice.",
  },
  20: {
    title: "Halfway there",
    subtitle: "Week 20 in the womb",
    wish: "The halfway mark is a mindset shift more than a medical one. You have come a long way.",
    summary: "Many parents have the morphology scan around this stage. Bub is swallowing and practising breathing movements.",
    doNow: "Celebrate one small milestone — halfway is worth acknowledging.",
  },
  21: {
    title: "Taste buds are forming",
    subtitle: "Week 21 in the womb",
    wish: "Bub is sampling amniotic fluid and developing taste preferences before you have even introduced solids.",
    summary: "Digestive practice continues. You might feel clearer kicks now, especially when lying down.",
    doNow: "Rest when tired without guilt — growing a person is legitimate work.",
  },
  22: {
    title: "Lips and brows appear",
    subtitle: "Week 22 in the womb",
    wish: "Facial features look more like a newborn every week. It can make the abstract suddenly very real.",
    summary: "Your baby looks more like a tiny person on scans. Brain development is rapid.",
    doNow: "Share one scan photo or update with someone you trust, if you want to.",
  },
  23: {
    title: "Sleep cycles begin",
    subtitle: "Week 23 in the womb",
    wish: "Bub is starting to have sleep and wake patterns. They will not match yours — practice for later.",
    summary: "Rest periods and active periods alternate. Movement at night is common and normal.",
    doNow: "If kicks keep you awake, try a pillow between the knees and slow breathing.",
  },
  24: {
    title: "Viability milestone",
    subtitle: "Week 24 in the womb",
    wish: "Week 24 is often called the viability threshold — a medical label, not a prediction of your story.",
    summary: "Lungs are still developing but care for very premature babies has improved enormously. Follow your clinician's guidance.",
    doNow: "Save your maternity unit contact in your phone if you have not already.",
  },
  25: {
    title: "Hands are busy",
    subtitle: "Week 25 in the womb",
    wish: "Bub may grab the umbilical cord or their own feet. In-womb gymnastics are underrated entertainment.",
    summary: "Coordination improves. You might see feet or hands push against your belly from inside.",
    doNow: "Respond to a kick with a gentle touch — a tiny early conversation.",
  },
  26: {
    title: "Eyes are opening",
    subtitle: "Week 26 in the womb",
    wish: "Eyelids have been fused; now they can open. Light filters through your belly dimly.",
    summary: "Vision is developing. Bub may react to bright light or loud sounds.",
    doNow: "Try a torch on the belly briefly — some parents see a shift in movement.",
  },
  27: {
    title: "Brain grooves deepen",
    subtitle: "Week 27 in the womb",
    wish: "The brain is developing folds and grooves that increase surface area. Quietly impressive.",
    summary: "Third trimester is approaching. Brain growth accelerates through the rest of pregnancy.",
    doNow: "Start a short list of who to text when labour starts — one less decision later.",
  },
  28: {
    title: "Third trimester begins",
    subtitle: "Week 28 in the womb",
    wish: "Welcome to the third trimester — the home stretch with more frequent check-ins ahead.",
    summary: "Many care pathways increase monitoring from here. Bub can blink and may dream during sleep.",
    doNow: "Confirm your next appointment date before you leave the last one.",
  },
  29: {
    title: "Muscles are strengthening",
    subtitle: "Week 29 in the womb",
    wish: "Kicks can feel sharper as muscles strengthen. Rib jabs are a shared parent experience.",
    summary: "Your baby is gaining weight steadily. Movement matters — know your usual pattern.",
    doNow: "If movements feel different, call your care team — you are not bothering them.",
  },
  30: {
    title: "Lanugo may appear",
    subtitle: "Week 30 in the womb",
    wish: "Fine hair called lanugo sometimes covers the skin. It usually sheds before birth.",
    summary: "Bub is practising breathing movements and swallowing. Brain and lungs keep maturing.",
    doNow: "Pack one item for the hospital bag — one item per week beats a panic packing session.",
  },
  31: {
    title: "Five senses in training",
    subtitle: "Week 31 in the womb",
    wish: "Touch, taste, smell, hearing and sight are all developing. A full sensory lab in there.",
    summary: "Your baby responds to sound, light and touch. Weight gain continues quickly.",
    doNow: "Play music or read aloud — bub may recognise voices after birth.",
  },
  32: {
    title: "Toenails and fingernails",
    subtitle: "Week 32 in the womb",
    wish: "Tiny nails are forming. You will be trimming them sooner than you think.",
    summary: "Bub is getting chubbier. Space is tighter, so movement may feel different — rolls more than sharp kicks.",
    doNow: "Sleep on your side if comfortable — many clinicians recommend it from here.",
  },
  33: {
    title: "Immune helpers arrive",
    subtitle: "Week 33 in the womb",
    wish: "Antibodies from you start crossing to bub — one of the gifts of the last weeks.",
    summary: "The immune system prepares for the outside world. Brain development stays rapid.",
    doNow: "Wash hands before handling newborn gear — a small habit that pays off.",
  },
  34: {
    title: "Lungs maturing",
    subtitle: "Week 34 in the womb",
    wish: "Lungs are still the last major system to finish. Every week in counts.",
    summary: "Surfactant production increases, helping lungs work after birth. Movements should stay familiar.",
    doNow: "Review warning signs with your care provider if you have not recently.",
  },
  35: {
    title: "Head may engage",
    subtitle: "Week 35 in the womb",
    wish: "Some babies drop lower into the pelvis now. Breathing can feel easier; bladder pressure may not.",
    summary: "Bub is gaining about 200g a week. Position varies — head down is common but not guaranteed yet.",
    doNow: "Do pelvic floor exercises if your clinician recommends them.",
  },
  36: {
    title: "Almost ready",
    subtitle: "Week 36 in the womb",
    wish: "Bub is practising sucking and swallowing for feeding after birth.",
    summary: "Many babies are head down by now. Weekly or fortnightly checks are common in many pathways.",
    doNow: "Charge your phone charger for the hospital bag — you will want it.",
  },
  37: {
    title: "Early term",
    subtitle: "Week 37 in the womb",
    wish: "From here, many babies are considered early term. Labour could still be weeks away.",
    summary: "Organs are nearly ready. Babbling practice and grip strength continue in the womb.",
    doNow: "Know the difference between practice contractions and signs to call — ask your clinician.",
  },
  38: {
    title: "Full term approaches",
    subtitle: "Week 38 in the womb",
    wish: "Bub is mostly done building — now mainly gaining weight and fine-tuning.",
    summary: "Movements should stay familiar. Any reduction needs a prompt call to your care team.",
    doNow: "Rest, eat simply, and keep the car fuelled if you are driving to hospital.",
  },
  39: {
    title: "Full term",
    subtitle: "Week 39 in the womb",
    wish: "Full term is a window, not a deadline. Babies pick their own entrance timing.",
    summary: "Your baby is ready for birth in most cases. Cervical changes may be happening quietly.",
    doNow: "Trust your instincts about when something feels off — call if unsure.",
  },
  40: {
    title: "Due week",
    subtitle: "Week 40 in the womb",
    wish: "Due dates are estimates. Only a small fraction of babies arrive on the exact day.",
    summary: "If you are still pregnant, monitoring continues. Induction may be discussed depending on your pathway.",
    doNow: "Be kind to yourself — the waiting week is its own marathon.",
  },
};

const cards = Object.entries(weekContent).map(([week, content]) => {
  const w = Number(week);
  const slug = `pregnancy-week-${w}`;

  return {
    slug,
    title: content.title,
    subtitle: content.subtitle,
    card_type: cardType,
    category: "Pregnancy / This week",
    life_stage: "Pregnancy",
    start_age_days: null,
    end_age_days: null,
    pregnancy_week_start: w,
    pregnancy_week_end: w,
    priority: 100,
    short_summary: content.summary,
    wish_i_knew: content.wish,
    what_to_do_now: content.doNow,
    conditions: { unborn_only: true },
    illustration_prompt: `Cute pixel art collectible: gentle womb week ${w} milestone, soft heart or tiny baby silhouette, warm cream and teal palette.`,
    image_url: `/card-images/pixel/px-pregnancy-week-${w}.png`,
    image_alt: `Illustration for pregnancy week ${w}.`,
    image_status: "needed",
    status: "in_review",
  };
});

const outPath = path.join(root, "supabase", "seed_pregnancy_weekly_anchors.sql");
writeAnchorSeed({
  outPath,
  headerComment:
    "Pregnancy weekly anchor cards (weeks 1–40). Safe to re-run (upserts by slug).",
  cards,
});
console.log(`Wrote ${cards.length} pregnancy anchor cards to ${outPath}`);
