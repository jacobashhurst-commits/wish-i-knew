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
    doNow: "If you are trying to conceive, gentle habits tend to beat obsessing over every symptom.",
  },
  2: {
    title: "Before the test line",
    subtitle: "Week 2 in the womb",
    wish: "Week two on the calendar is often before a positive test. Waiting is its own sport.",
    summary: "The body prepares for possible implantation. Home tests usually cannot detect pregnancy yet.",
    doNow: "Waiting to test? Picking a day and leaving the stick alone until then can spare some mental load.",
  },
  3: {
    title: "Implantation week",
    subtitle: "Week 3 in the womb",
    wish: "Some people notice implantation spotting. Many notice nothing. Both are normal.",
    summary: "The embryo may implant in the uterine lining. Early hormone shifts begin.",
    doNow: "Feeling wiped out is common this early — rest when you can, without needing a perfect reason.",
  },
  4: {
    title: "A positive test window",
    subtitle: "Week 4 in the womb",
    wish: "Two lines can feel like a plot twist. Take a breath before the to-do list explodes.",
    summary: "Many home tests turn positive around now. A GP visit can confirm and start care planning.",
    doNow: "Start thinking about a GP visit if you have not had one yet — search your local practice or healthdirect for early pregnancy care.",
  },
  5: {
    title: "The neural tube forms",
    subtitle: "Week 5 in the womb",
    wish: "Major structures are forming before you have told anyone. That is a lot to carry quietly.",
    summary: "The neural tube — future brain and spine — is developing. Folic acid support matters in early pregnancy.",
    doNow: "Start thinking about folate — a quick search of Pregnancy Care Guidelines, or a chat with your GP or pharmacist, beats guessing from random tips.",
  },
  6: {
    title: "Heart tissue starts",
    subtitle: "Week 6 in the womb",
    wish: "Morning sickness may arrive like an uninvited houseguest. Small snacks help some people.",
    summary: "The heart begins to form and beat. Nausea and fatigue are common even when everything is progressing normally.",
    doNow: "Some people find a bland bite before getting up helps with nausea. Experiment gently; what works varies.",
  },
  7: {
    title: "Brain growth spurt",
    subtitle: "Week 7 in the womb",
    wish: "Your uterus is still smaller than a lemon, but the growth inside is furious.",
    summary: "Brain development accelerates. You might feel emotional swings — hormones are real.",
    doNow: "If it feels right, telling one trusted person how you are actually going can take the lid off a hard week.",
  },
  8: {
    title: "First prenatal visit often",
    subtitle: "Week 8 in the womb",
    wish: "The dating scan window is approaching for many — seeing something on screen can make it real.",
    summary: "Many GPs refer for early ultrasound around eight to ten weeks. Limb buds are forming.",
    doNow: "Jotting a few appointment questions on your phone helps when brain fog hits — no need for a perfect list.",
  },
  9: {
    title: "Moving, invisibly",
    subtitle: "Week 9 in the womb",
    wish: "Bub is already making tiny movements you cannot feel. Secret gymnastics.",
    summary: "Embryo becomes fetus around now. Organs keep specialising rapidly.",
    doNow: "Sipping water more often can sit better than big gulps if nausea is around. Follow what your body tolerates.",
  },
  10: {
    title: "Critical period continues",
    subtitle: "Week 10 in the womb",
    wish: "The first trimester finish line is in sight. That does not mean symptoms vanish overnight.",
    summary: "Major organ formation continues. Risk of certain developmental issues drops as the first trimester progresses.",
    doNow: "Double digits are quietly worth marking — a small note to yourself is enough.",
  },
  11: {
    title: "Almost second trimester",
    subtitle: "Week 11 in the womb",
    wish: "Energy may start creeping back soon for some. For others, nausea lingers — both stories happen.",
    summary: "Bub looks more like a tiny human on scan. The placenta takes over more hormone production.",
    doNow: "A small treat for yourself this week is not frivolous. Growing a person is work.",
  },
  12: {
    title: "Fingers are separating",
    subtitle: "Week 12 in the womb",
    wish: "Those tiny hand bumps are starting to look like actual fingers — wild that this is happening while you are still in the first trimester fog.",
    summary: "Around now, fingers and toes are separating. Bub is still small, but the blueprint is getting clearer every day.",
    doNow: "If nausea is easing, noticing one small comfort win counts. No spreadsheet required.",
  },
  13: {
    title: "A more defined little body",
    subtitle: "Week 13 in the womb",
    wish: "The head is still oversized (classic baby proportions), but the rest of bub is catching up.",
    summary: "Your baby is growing quickly now. Organs keep maturing and movement is increasing, even if you cannot feel it yet.",
    doNow: "Hydration is one of those boring things that quietly helps — sip when you remember.",
  },
  14: {
    title: "Expressions are practising",
    subtitle: "Week 14 in the womb",
    wish: "Bub can squint and frown in there. It is practice, not commentary on your snack choices.",
    summary: "Facial muscles are active. Many parents start feeling a little more energy as the second trimester approaches.",
    doNow: "A slow walk or stretch only if it feels good. Comfort beats pushing through.",
  },
  15: {
    title: "Bones are hardening",
    subtitle: "Week 15 in the womb",
    wish: "The skeleton is shifting from soft cartilage toward bone. You are literally building a tiny human from scratch.",
    summary: "Bone development continues and bub is moving more. You might still not feel kicks — that is normal.",
    doNow: "Worth checking whether your care pathway booking is still on track — clinic websites or your GP can point you.",
  },
  16: {
    title: "Movement is happening",
    subtitle: "Week 16 in the womb",
    wish: "Some parents feel the first flutters around now. Others wait weeks longer. Both are normal.",
    summary: "Your baby is active in the womb. First movements can feel like bubbles or gentle taps.",
    doNow: "Noticing when you are most still can be when first movements show up. No pressure to feel them yet.",
  },
  17: {
    title: "Fat stores are starting",
    subtitle: "Week 17 in the womb",
    wish: "Bub is beginning to lay down fat that will help with temperature regulation after birth.",
    summary: "Growth continues and the body is preparing for life outside. The morphology scan window is often coming up.",
    doNow: "If a morphology scan is not booked, a quick call or online booking link can save last-minute stress.",
  },
  18: {
    title: "Ears are tuning in",
    subtitle: "Week 18 in the womb",
    wish: "Your baby can hear muffled sounds from inside your body — heartbeat, digestion, your voice nearby.",
    summary: "Hearing pathways are developing. Talking or singing to your bump is less silly than it feels.",
    doNow: "Saying something out loud to the bump (partner included) is optional and oddly nice for some people.",
  },
  19: {
    title: "A protective coating",
    subtitle: "Week 19 in the womb",
    wish: "A waxy coating called vernix is forming on the skin. It protects bub in the amniotic fluid.",
    summary: "Skin development continues. Movements may feel stronger if you have already felt kicks.",
    doNow: "Noting movement patterns for yourself is enough for now — counting usually comes later if your care team suggests it.",
  },
  20: {
    title: "Halfway there",
    subtitle: "Week 20 in the womb",
    wish: "The halfway mark is a mindset shift more than a medical one. You have come a long way.",
    summary: "Many parents have the morphology scan around this stage. Bub is swallowing and practising breathing movements.",
    doNow: "Halfway is worth a quiet acknowledgement — cake optional.",
  },
  21: {
    title: "Taste buds are forming",
    subtitle: "Week 21 in the womb",
    wish: "Bub is sampling amniotic fluid and developing taste preferences before you have even introduced solids.",
    summary: "Digestive practice continues. You might feel clearer kicks now, especially when lying down.",
    doNow: "Resting when tired without a guilt lecture is a solid move. Growing a person qualifies as work.",
  },
  22: {
    title: "Lips and brows appear",
    subtitle: "Week 22 in the womb",
    wish: "Facial features look more like a newborn every week. It can make the abstract suddenly very real.",
    summary: "Your baby looks more like a tiny person on scans. Brain development is rapid.",
    doNow: "Sharing a scan photo or update with someone you trust is optional — only if you want to.",
  },
  23: {
    title: "Sleep cycles begin",
    subtitle: "Week 23 in the womb",
    wish: "Bub is starting to have sleep and wake patterns. They will not match yours — practice for later.",
    summary: "Rest periods and active periods alternate. Movement at night is common and normal.",
    doNow: "If night kicks keep you awake, some parents like a pillow between the knees and slower breathing. Search sleep positions in pregnancy if you want more ideas.",
  },
  24: {
    title: "Viability milestone",
    subtitle: "Week 24 in the womb",
    wish: "Week 24 is often called the viability threshold — a medical label, not a prediction of your story.",
    summary: "Lungs are still developing but care for very premature babies has improved enormously. Follow your clinician's guidance.",
    doNow: "Saving your maternity unit contact in your phone is a small future-you favour. Ask your care team which number they prefer.",
  },
  25: {
    title: "Hands are busy",
    subtitle: "Week 25 in the womb",
    wish: "Bub may grab the umbilical cord or their own feet. In-womb gymnastics are underrated entertainment.",
    summary: "Coordination improves. You might see feet or hands push against your belly from inside.",
    doNow: "Responding to a kick with a gentle touch is a tiny early conversation if you feel like it.",
  },
  26: {
    title: "Eyes are opening",
    subtitle: "Week 26 in the womb",
    wish: "Eyelids have been fused; now they can open. Light filters through your belly dimly.",
    summary: "Vision is developing. Bub may react to bright light or loud sounds.",
    doNow: "A brief torch on the belly is a curiosity experiment some parents try — skip it if it feels silly.",
  },
  27: {
    title: "Brain grooves deepen",
    subtitle: "Week 27 in the womb",
    wish: "The brain is developing folds and grooves that increase surface area. Quietly impressive.",
    summary: "Third trimester is approaching. Brain growth accelerates through the rest of pregnancy.",
    doNow: "A short list of who to text when labour starts can cut one decision later. Keep it rough.",
  },
  28: {
    title: "Third trimester begins",
    subtitle: "Week 28 in the womb",
    wish: "Welcome to the third trimester — the home stretch with more frequent check-ins ahead.",
    summary: "Many care pathways increase monitoring from here. Bub can blink and may dream during sleep.",
    doNow: "Glancing at your next appointment date before you leave the last one is a habit many parents like.",
  },
  29: {
    title: "Muscles are strengthening",
    subtitle: "Week 29 in the womb",
    wish: "Kicks can feel sharper as muscles strengthen. Rib jabs are a shared parent experience.",
    summary: "Your baby is gaining weight steadily. Movement matters — know your usual pattern.",
    doNow: "If movements feel different from your usual, your care team would rather hear from you. Search 'reduced fetal movements' Australia for the usual guidance, and call if unsure.",
  },
  30: {
    title: "Lanugo may appear",
    subtitle: "Week 30 in the womb",
    wish: "Fine hair called lanugo sometimes covers the skin. It usually sheds before birth.",
    summary: "Bub is practising breathing movements and swallowing. Brain and lungs keep maturing.",
    doNow: "Packing one hospital-bag item a week beats a panic session — whatever pace works for you.",
  },
  31: {
    title: "Five senses in training",
    subtitle: "Week 31 in the womb",
    wish: "Touch, taste, smell, hearing and sight are all developing. A full sensory lab in there.",
    summary: "Your baby responds to sound, light and touch. Weight gain continues quickly.",
    doNow: "Music or reading aloud is optional; some babies seem to recognise familiar voices later.",
  },
  32: {
    title: "Toenails and fingernails",
    subtitle: "Week 32 in the womb",
    wish: "Tiny nails are forming. You will be trimming them sooner than you think.",
    summary: "Bub is getting chubbier. Space is tighter, so movement may feel different — rolls more than sharp kicks.",
    doNow: "Side sleeping is commonly suggested from here if it is comfortable — check current advice with your clinician or a trusted pregnancy guide.",
  },
  33: {
    title: "Immune helpers arrive",
    subtitle: "Week 33 in the womb",
    wish: "Antibodies from you start crossing to bub — one of the gifts of the last weeks.",
    summary: "The immune system prepares for the outside world. Brain development stays rapid.",
    doNow: "Washing hands before handling newborn gear is a small habit many families lean on. Hand hygiene guidance is easy to find from healthdirect.",
  },
  34: {
    title: "Lungs maturing",
    subtitle: "Week 34 in the womb",
    wish: "Lungs are still the last major system to finish. Every week in counts.",
    summary: "Surfactant production increases, helping lungs work after birth. Movements should stay familiar.",
    doNow: "Reviewing warning signs with your care provider, or searching your hospital's pregnancy advice page, can make the last stretch feel less foggy.",
  },
  35: {
    title: "Head may engage",
    subtitle: "Week 35 in the womb",
    wish: "Some babies drop lower into the pelvis now. Breathing can feel easier; bladder pressure may not.",
    summary: "Bub is gaining about 200g a week. Position varies — head down is common but not guaranteed yet.",
    doNow: "Pelvic floor ideas are worth asking your clinician or physiotherapist about — they can suggest what fits you.",
  },
  36: {
    title: "Almost ready",
    subtitle: "Week 36 in the womb",
    wish: "Bub is practising sucking and swallowing for feeding after birth.",
    summary: "Many babies are head down by now. Weekly or fortnightly checks are common in many pathways.",
    doNow: "A charged phone cable in the hospital bag is one of those boring items future-you tends to thank you for.",
  },
  37: {
    title: "Early term",
    subtitle: "Week 37 in the womb",
    wish: "From here, many babies are considered early term. Labour could still be weeks away.",
    summary: "Organs are nearly ready. Babbling practice and grip strength continue in the womb.",
    doNow: "Knowing practice contractions versus 'call now' signs is useful — ask your clinician, or search your maternity service's labour guidance.",
  },
  38: {
    title: "Full term approaches",
    subtitle: "Week 38 in the womb",
    wish: "Bub is mostly done building — now mainly gaining weight and fine-tuning.",
    summary: "Movements should stay familiar. Any reduction needs a prompt call to your care team.",
    doNow: "Rest, simple food, and a fuelled car if you are driving in are the gentle checklist many people keep in mind.",
  },
  39: {
    title: "Full term",
    subtitle: "Week 39 in the womb",
    wish: "Full term is a window, not a deadline. Babies pick their own entrance timing.",
    summary: "Your baby is ready for birth in most cases. Cervical changes may be happening quietly.",
    doNow: "If something feels off, trusting that instinct and calling for advice is never overreacting.",
  },
  40: {
    title: "Due week",
    subtitle: "Week 40 in the womb",
    wish: "Due dates are estimates. Only a small fraction of babies arrive on the exact day.",
    summary: "If you are still pregnant, monitoring continues. Induction may be discussed depending on your pathway.",
    doNow: "The waiting week is its own marathon — be kind to yourself. Induction timing, if discussed, belongs with your care team.",
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
