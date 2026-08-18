/**
 * Generates supabase/seed_content_library_batch5.sql (50 cards).
 * Run after generating card images:
 * node scripts/generate-batch5-seed.mjs && node scripts/export-card-library.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { batch5CardImages } from "./batch5-card-images.mjs";

const root = path.resolve(import.meta.dirname, "..");
const imageStyle = "cute 8-bit pixel art item";
const AU_REVIEW = "Review against current Australian guidance before production use.";

function pregnancy(card) {
  return { life_stage: "Pregnancy", pregnancy_week_start: 4, pregnancy_week_end: 40, conditions: { unborn_only: true }, ...card };
}

function born(stage, start, end, card) {
  return { life_stage: stage, start_age_days: start, end_age_days: end, conditions: { born_only: true }, ...card };
}

/** @type {Array<Record<string, unknown>>} */
const cards = [
  // Pregnancy (8)
  pregnancy({
    slug: "pregnancy-medicine-check", title: "Check before taking it", subtitle: "Even the familiar packet", card_type: "Heads Up", category: "Pregnancy / Health", priority: 88, medical_sensitivity: true,
    short_summary: "Check prescription, over-the-counter and complementary medicines with a doctor, pharmacist or midwife during pregnancy.",
    wish_i_knew: "Familiar does not always mean pregnancy-ready, and asking is a normal pharmacy question.",
    why_it_matters: "Some medicines need changing, while stopping an important medicine suddenly can also cause harm.",
    what_to_do_now: "Keep a list of everything you take and check before starting, stopping or changing it.", what_can_wait: "Clearing the whole bathroom cupboard in a panic.",
    checklist_items: ["List medicines and supplements", "Ask before changing anything", "Mention pregnancy at the pharmacy"],
    source_urls: ["https://www.pregnancybirthbaby.org.au/pregnancy/nutrition-and-lifestyle/medicines-during-pregnancy"], source_notes: `Medical content. ${AU_REVIEW}`,
  }),
  pregnancy({
    slug: "pregnancy-food-safety-shortlist", title: "Keep one food safety shortlist", subtitle: "A fridge note beats food fear", card_type: "Tiny Gear Shift", category: "Pregnancy / Food safety", priority: 76, medical_sensitivity: true, safety_sensitivity: true,
    short_summary: "A short Australian food safety list makes everyday choices easier without turning every meal into a research project.",
    wish_i_knew: "The useful version fits on the fridge, not in twelve anxious browser tabs.",
    why_it_matters: "Pregnancy changes the risk from some foodborne infections, and practical handling matters as much as individual foods.",
    what_to_do_now: "Save one trusted list and focus on clean preparation, safe storage and foods that need avoiding.", what_can_wait: "Building a perfect pregnancy menu.",
    checklist_items: ["Use one Australian source", "Refrigerate leftovers promptly", "Reheat ready-to-eat food until steaming"],
    source_urls: ["https://www.pregnancybirthbaby.org.au/pregnancy/nutrition-and-lifestyle/foods-to-avoid-when-pregnant"], source_notes: `Medical and food safety content. ${AU_REVIEW}`,
  }),
  pregnancy({
    slug: "pregnancy-movement-pattern", title: "Learn bub's movement pattern", subtitle: "A change is worth a call", card_type: "Heads Up", category: "Pregnancy / Baby movements", pregnancy_week_start: 20, priority: 96, time_critical: true, medical_sensitivity: true, safety_sensitivity: true,
    short_summary: "There is no single right kick count. Get to know your baby's usual pattern and seek advice promptly if movements reduce or change.",
    wish_i_knew: "You are never wasting the maternity unit's time by calling about changed movements.",
    why_it_matters: "A change in movement can be an early sign that a baby needs assessment.",
    what_to_do_now: "Contact your midwife, doctor or maternity unit immediately if movements feel reduced, stop or are clearly different.", what_can_wait: "Trying tricks at home before making the call.",
    checklist_items: ["Notice the usual pattern", "Call promptly about a change", "Do not wait until the next day"],
    source_urls: ["https://www.pregnancybirthbaby.org.au/pregnancy/health-conditions-and-complications/baby-movements-during-pregnancy"], source_notes: `Medical, safety and time-critical content. ${AU_REVIEW}`,
  }),
  pregnancy({
    slug: "preeclampsia-warning-signs", title: "Know the pre-eclampsia flags", subtitle: "Prompt advice, no self-diagnosis", card_type: "Heads Up", category: "Pregnancy / Warning signs", pregnancy_week_start: 20, priority: 98, time_critical: true, medical_sensitivity: true,
    short_summary: "Severe headache, vision changes, sudden swelling, pain under the ribs or feeling very unwell need prompt maternity advice.",
    wish_i_knew: "You do not need to decide whether a symptom is serious before you call.",
    why_it_matters: "Pre-eclampsia can develop during pregnancy or after birth and needs professional assessment.",
    what_to_do_now: "Call your maternity unit, midwife or doctor urgently about warning signs. Call 000 for an emergency.", what_can_wait: "Waiting for the next routine appointment.",
    checklist_items: ["Save the maternity unit number", "Call about warning signs", "Use 000 in an emergency"],
    source_urls: ["https://www.pregnancybirthbaby.org.au/pregnancy/health-conditions-and-complications/pre-eclampsia"], source_notes: `Medical and time-critical content. ${AU_REVIEW}`,
  }),
  pregnancy({
    slug: "pregnancy-exercise-comfort", title: "Let movement be comfortable", subtitle: "The pace can change", card_type: "Parent Sanity", category: "Pregnancy / Movement", priority: 58, medical_sensitivity: true,
    short_summary: "For many pregnancies, comfortable regular movement is useful. Your clinician can help adapt it to your health and pregnancy.",
    wish_i_knew: "Slower still counts, and rest is not a failed workout.",
    why_it_matters: "Movement can support wellbeing, while some symptoms and pregnancy conditions need individual advice.",
    what_to_do_now: "Choose a comfortable activity, stay hydrated and ask your clinician about any restrictions or warning signs.", what_can_wait: "Chasing your pre-pregnancy pace or personal best.",
    checklist_items: ["Choose comfortable movement", "Drink water", "Stop and seek advice about warning signs"],
    source_urls: ["https://www.pregnancybirthbaby.org.au/exercising-during-pregnancy"], source_notes: `Medical content. ${AU_REVIEW}`,
  }),
  pregnancy({
    slug: "birth-support-backup", title: "Name a backup support person", subtitle: "Plans enjoy a spare key", card_type: "Tiny Gear Shift", category: "Pregnancy / Preparation", pregnancy_week_start: 28, priority: 62,
    short_summary: "A second person who knows the broad plan can step in if illness, work or travel gets in the way.",
    wish_i_knew: "The backup is not bad luck. It is one less midnight phone tree.",
    why_it_matters: "Birth timing is unpredictable, and practical backup makes the main plan feel lighter.",
    what_to_do_now: "Ask one trusted person and share key contacts, transport details and pet or sibling jobs.", what_can_wait: "Rehearsing every possible birth scenario.",
    checklist_items: ["Choose one backup", "Share key contacts", "Explain practical jobs"], source_urls: [], source_notes: null,
  }),
  pregnancy({
    slug: "pet-plan-for-birth", title: "Give the pet plan a human", subtitle: "Someone owns the lead", card_type: "Tiny Gear Shift", category: "Pregnancy / Home", pregnancy_week_start: 30, priority: 50,
    short_summary: "Choose who feeds, walks or collects your pet if labour starts at an inconvenient hour.",
    wish_i_knew: "A pet plan becomes real when one actual person has the spare key.",
    why_it_matters: "Clear ownership removes one more job from labour and the first trip home.",
    what_to_do_now: "Give a trusted person access, written routines and your vet details.", what_can_wait: "Designing an elaborate first meeting between pet and baby.",
    checklist_items: ["Name the helper", "Share the routine", "Leave food, lead and vet details together"], source_urls: [], source_notes: null,
  }),
  pregnancy({
    slug: "hallway-night-lights", title: "Light the midnight path", subtitle: "Tiny glow, fewer stubbed toes", card_type: "Tiny Gear Shift", category: "Pregnancy / Home", pregnancy_week_start: 30, priority: 46,
    short_summary: "Low, warm night lights can make feeds, nappies and bathroom trips easier without switching on the whole house.",
    wish_i_knew: "The hallway chair leg becomes a supervillain at 3am.",
    why_it_matters: "A visible route removes friction when everyone is sleepy and carrying supplies.",
    what_to_do_now: "Place a soft light along the route you expect to use most.", what_can_wait: "A complete smart-home lighting overhaul.",
    checklist_items: ["Walk the night route", "Add one warm low light", "Keep cords out of the path"], source_urls: [], source_notes: null,
  }),

  // Newborn (10)
  born("Newborn (0-3 months)", 0, 14, {
    slug: "newborn-bloodspot-screen", title: "The heel-prick screen", subtitle: "Small test, important follow-up", card_type: "Big Milestone", category: "Newborn / Screening", priority: 88, medical_sensitivity: true,
    short_summary: "The newborn bloodspot screen is usually offered in the first few days to check for rare but serious conditions.",
    wish_i_knew: "It is a brief, routine offer in a week already full of new information.",
    why_it_matters: "Early detection can allow treatment or support to begin before symptoms appear.",
    what_to_do_now: "Ask when it will happen, keep the record and make sure the service can contact you about results.", what_can_wait: "Trying to memorise every condition on the panel.",
    checklist_items: ["Confirm the screen was offered", "Keep contact details current", "Follow up if asked"],
    source_urls: ["https://www.pregnancybirthbaby.org.au/labour-and-birth/after-birth/your-baby-in-the-first-few-days"], source_notes: `Medical screening content. ${AU_REVIEW}`,
  }),
  born("Newborn (0-3 months)", 0, 7, {
    slug: "vitamin-k-and-hep-b", title: "Ask about the first preventive care", subtitle: "Consent comes with questions", card_type: "Heads Up", category: "Newborn / Preventive care", priority: 84, medical_sensitivity: true,
    short_summary: "Soon after birth, parents are usually offered vitamin K and hepatitis B vaccination for their baby.",
    wish_i_knew: "You can ask what each one does before the room gets busy.",
    why_it_matters: "These offers protect against specific serious health risks in early life.",
    what_to_do_now: "Discuss benefits, timing and consent with your midwife or doctor, and keep the record.", what_can_wait: "Making the decision from social media summaries.",
    checklist_items: ["Ask questions before birth if helpful", "Record consent and doses", "Keep the baby health record handy"],
    source_urls: ["https://www.pregnancybirthbaby.org.au/labour-and-birth/after-birth/your-baby-in-the-first-few-days"], source_notes: `Medical preventive-care content. ${AU_REVIEW}`,
  }),
  born("Newborn (0-3 months)", 0, 90, {
    slug: "newborn-fever-call-now", title: "A young baby's fever needs a call", subtitle: "Under three months, act promptly", card_type: "Heads Up", category: "Newborn / Health", priority: 100, time_critical: true, medical_sensitivity: true, safety_sensitivity: true,
    short_summary: "A temperature of 38°C or more in a baby under 3 months needs urgent medical assessment.",
    wish_i_knew: "This is a call-now moment, not a wait-and-see overnight moment.",
    why_it_matters: "Young babies can become unwell quickly and may show few other signs.",
    what_to_do_now: "Seek urgent medical advice. Call 000 if your baby is very unwell, hard to wake or struggling to breathe.", what_can_wait: "Trying to manage the fever without professional advice.",
    checklist_items: ["Measure the temperature", "Seek urgent assessment", "Call 000 for emergency signs"],
    source_urls: ["https://www.healthdirect.gov.au/fever-and-high-temperature-in-children"], source_notes: `Medical, safety and time-critical content. ${AU_REVIEW}`,
  }),
  born("Newborn (0-3 months)", 0, 180, {
    slug: "second-hand-bassinet-check", title: "Check the hand-me-down bassinet", subtitle: "Lovely history, current safety", card_type: "Heads Up", category: "Safety / Sleep gear", priority: 86, safety_sensitivity: true,
    short_summary: "Before using second-hand sleep gear, check its condition, instructions, mattress fit and current Australian safety guidance.",
    wish_i_knew: "Sentimental and safe can coexist, but age alone is not the test.",
    why_it_matters: "Missing parts, damage or an unsuitable mattress can create hazards that are not obvious in a quick look.",
    what_to_do_now: "Identify the product, find its instructions, check recalls and inspect every part before use.", what_can_wait: "Using it because the first night is close.",
    checklist_items: ["Find the make and model", "Check recalls and warnings", "Inspect mattress and hardware"],
    source_urls: ["https://www.productsafety.gov.au/consumers/keep-baby-safe/settle-baby-to-sleep-safely/household-cots-guide"], source_notes: `Safety content. ${AU_REVIEW}`,
  }),
  born("Newborn (0-3 months)", 0, 365, {
    slug: "formula-scoop-stays-with-tin", title: "Keep each scoop with its tin", subtitle: "The ratio belongs to that product", card_type: "Tiny Gear Shift", category: "Feeding / Formula", priority: 82, feeding_sensitivity: true, safety_sensitivity: true,
    short_summary: "Use the scoop and mixing directions supplied with the formula you are preparing, because products can differ.",
    wish_i_knew: "A scoop is not universal just because it looks identical at 2am.",
    why_it_matters: "Using the correct amount of water and powder helps make feeds safely.",
    what_to_do_now: "Leave the scoop with its original tin and follow that label exactly each time.", what_can_wait: "Decanting formula into prettier unlabelled containers.",
    checklist_items: ["Use the supplied scoop", "Follow the tin directions", "Make feeds with safe preparation practices"],
    source_urls: ["https://www.pregnancybirthbaby.org.au/babies/feeding-and-nutrition/feeding-your-baby-with-formula"], source_notes: `Feeding and safety content. ${AU_REVIEW}`,
  }),
  born("Newborn (0-3 months)", 0, 180, {
    slug: "breast-pump-start-low", title: "Start the pump gently", subtitle: "More suction is not more success", card_type: "Tiny Gear Shift", category: "Feeding / Expressing", priority: 68, feeding_sensitivity: true, medical_sensitivity: true,
    short_summary: "Begin expressing with low comfortable suction and seek qualified help if pumping hurts or causes damage.",
    wish_i_knew: "The strongest setting is not a level you need to unlock.",
    why_it_matters: "Comfort supports repeatable expressing, while pain can signal that technique, fit or equipment needs attention.",
    what_to_do_now: "Start low, increase only while comfortable and contact a midwife, nurse or lactation professional about ongoing pain.", what_can_wait: "Buying a cupboard of accessories before checking the setup.",
    checklist_items: ["Start on low suction", "Stop if it hurts", "Ask for qualified help with ongoing pain"],
    source_urls: ["https://www.healthdirect.gov.au/expressing-and-storing-breast-milk"], source_notes: `Medical and feeding content. ${AU_REVIEW}`,
  }),
  born("Newborn (0-3 months)", 0, 365, {
    slug: "nappy-rash-air-time", title: "Give irritated skin some air", subtitle: "Dry, gentle, checked if worried", card_type: "Tiny Gear Shift", category: "Newborn / Skin", priority: 64, medical_sensitivity: true,
    short_summary: "Frequent changes, gentle cleaning and short nappy-free time can help mild nappy rash. Get advice if it is severe or not improving.",
    wish_i_knew: "The deluxe treatment is sometimes a towel, fresh air and no rushing.",
    why_it_matters: "Keeping skin clean and dry reduces irritation, while persistent rash may need assessment.",
    what_to_do_now: "Use a washable towel for a little air time and ask a pharmacist, nurse or doctor about concerning rash.", what_can_wait: "Trying several new creams at once.",
    checklist_items: ["Change wet or dirty nappies promptly", "Clean and dry gently", "Seek advice if severe or persistent"],
    source_urls: ["https://www.pregnancybirthbaby.org.au/babies/daily-care/nappies"], source_notes: `Medical skin-care content. ${AU_REVIEW}`,
  }),
  born("Newborn (0-3 months)", 0, 120, {
    slug: "burp-cloth-drop-zones", title: "Put cloths where life happens", subtitle: "One in every landing zone", card_type: "Tiny Gear Shift", category: "Newborn / Practical", priority: 42,
    short_summary: "A few washable cloths beside the sofa, cot and feeding chair prevent constant supply runs.",
    wish_i_knew: "The cloth in the nursery is no help when the shoulder event happens in the kitchen.",
    why_it_matters: "Tiny duplicated basics save energy during repetitive newborn days.",
    what_to_do_now: "Make three small cloth drop zones and refill them on laundry day.", what_can_wait: "A coordinated textile collection.",
    checklist_items: ["Choose three landing zones", "Add two cloths to each", "Refill them together"], source_urls: [], source_notes: null,
  }),
  born("Newborn (0-3 months)", 0, 180, {
    slug: "laundry-baskets-count", title: "Add the extra laundry basket", subtitle: "Containment is a system", card_type: "Parent Sanity", category: "Postpartum / Home", priority: 40,
    short_summary: "A basket where baby changes actually happen is more useful than one perfect hamper in another room.",
    wish_i_knew: "Laundry still counts as managed while it is safely inside a basket.",
    why_it_matters: "Reducing trips and floor piles makes a high-repeat job easier without demanding a new routine.",
    what_to_do_now: "Put one easy-carry basket near the busiest change area.", what_can_wait: "Folding every tiny item before anyone can wear it.",
    checklist_items: ["Place the basket nearby", "Choose one wash rhythm", "Accept clean-basket living when needed"], source_urls: [], source_notes: null,
  }),
  born("Newborn (0-3 months)", 0, 90, {
    slug: "upstairs-downstairs-recovery-kit", title: "Duplicate the recovery basics", subtitle: "Save the unnecessary stairs", card_type: "Tiny Gear Shift", category: "Postpartum / Recovery", priority: 56,
    short_summary: "If your home has levels, keep water, snacks, chargers and basic baby supplies where you rest on each one.",
    wish_i_knew: "The spare charger upstairs can feel like premium postnatal infrastructure.",
    why_it_matters: "Fewer supply trips can make feeding, resting and physical recovery gentler.",
    what_to_do_now: "Fill two small baskets with the things you reach for repeatedly.", what_can_wait: "Moving the whole nursery downstairs.",
    checklist_items: ["Water and snack", "Long charging cable", "Cloths and basic baby supplies"], source_urls: [], source_notes: null,
  }),

  // Baby 3-12 months (14)
  born("Baby (3-12 months)", 90, 730, {
    slug: "second-hand-gear-recall-check", title: "Search the gear before saying yes", subtitle: "A freebie still gets a safety check", card_type: "Heads Up", category: "Safety / Gear", priority: 82, safety_sensitivity: true,
    short_summary: "Before using second-hand baby gear, identify the model, check recalls and inspect it for damage or missing parts.", wish_i_knew: "The bargain price does not include the missing instruction manual.",
    why_it_matters: "Older, modified or recalled products may not meet current safety expectations.", what_to_do_now: "Search the product name and model on ACCC Product Safety before accepting or using it.", what_can_wait: "Collecting it because the listing ends tonight.",
    checklist_items: ["Find make and model", "Check recalls", "Inspect parts and instructions"], source_urls: ["https://www.productsafety.gov.au/consumers/know-your-product-safety-rights/buy-safe-second-hand-products-online"], source_notes: `Safety content. ${AU_REVIEW}`,
  }),
  born("Baby (3-12 months)", 150, 730, {
    slug: "lower-cot-before-standing", title: "Lower the cot before the pull-up", subtitle: "Do it before the surprise", card_type: "Heads Up", category: "Safety / Sleep gear", priority: 88, safety_sensitivity: true,
    short_summary: "Move the cot mattress to its lowest safe setting before your baby can pull to stand, following the product instructions.", wish_i_knew: "The first pull-to-stand often arrives without a calendar invitation.",
    why_it_matters: "Correct mattress height helps reduce the chance of a mobile baby climbing or falling out.", what_to_do_now: "Check the cot instructions and lower the base when mobility is approaching.", what_can_wait: "Waiting for the first successful climb.",
    checklist_items: ["Find the cot instructions", "Lower the mattress base", "Remove footholds near the cot"], source_urls: ["https://www.productsafety.gov.au/consumers/keep-baby-safe/settle-baby-to-sleep-safely/household-cots-guide"], source_notes: `Safety content. ${AU_REVIEW}`,
  }),
  born("Baby (3-12 months)", 90, 730, {
    slug: "pram-brake-every-stop", title: "Brake before you let go", subtitle: "Every stop, even the tiny ones", card_type: "Tiny Gear Shift", category: "Safety / Prams", priority: 86, safety_sensitivity: true,
    short_summary: "Use the pram parking brake whenever you stop, even on flat ground or for a moment.", wish_i_knew: "Flat ground has a talent for becoming not quite flat.",
    why_it_matters: "A secured pram is less likely to roll while you manage bags, doors or another child.", what_to_do_now: "Make brake-on the first move whenever the pram stops.", what_can_wait: "Trusting that one hand on the handle will cover every distraction.",
    checklist_items: ["Brake at every stop", "Check it has engaged", "Keep the pram within reach"], source_urls: ["https://www.productsafety.gov.au/consumers/keep-baby-safe/move-baby-safely/prams-and-strollers-guide"], source_notes: `Safety content. ${AU_REVIEW}`,
  }),
  born("Baby (3-12 months)", 90, 365, {
    slug: "infant-first-aid-before-mobile", title: "Learn first aid before the chase", subtitle: "Confidence for the mobile months", card_type: "Heads Up", category: "Safety / First aid", priority: 78, safety_sensitivity: true,
    short_summary: "An infant first aid course can build practical confidence before crawling, solids and exploration expand the hazards.", wish_i_knew: "The best time to practise is when nobody needs the skill.",
    why_it_matters: "Hands-on training helps carers recognise emergencies and respond while help is on the way.", what_to_do_now: "Find a reputable Australian infant first aid course and include regular carers if possible.", what_can_wait: "Buying a giant first aid kit without learning how to use it.",
    checklist_items: ["Choose a reputable course", "Invite regular carers", "Save emergency contacts"], source_urls: ["https://www.pregnancybirthbaby.org.au/babies/daily-care/keeping-baby-safe"], source_notes: `Safety content. ${AU_REVIEW}`,
  }),
  born("Baby (3-12 months)", 120, 730, {
    slug: "small-object-floor-sweep", title: "Do the crawler-level sweep", subtitle: "The floor has a new inspector", card_type: "Tiny Gear Shift", category: "Safety / Choking", priority: 90, safety_sensitivity: true,
    short_summary: "Get down to floor level and regularly remove coins, batteries, toy parts and other small objects from reach.", wish_i_knew: "The object you missed is exactly the one the crawler will find first.",
    why_it_matters: "Small objects can become choking hazards, and mobility expands reach quickly.", what_to_do_now: "Sweep the main play zone and check under furniture before floor time.", what_can_wait: "Making every room perfect before creating one safer play zone.",
    checklist_items: ["Check under furniture", "Separate older children's small toys", "Secure batteries and magnets"], source_urls: ["https://raisingchildren.net.au/toddlers/safety/choking-strangulation/choking-prevention"], source_notes: `Safety content. ${AU_REVIEW}`,
  }),
  born("Baby (3-12 months)", 180, 730, {
    slug: "iron-rich-food-most-days", title: "Put iron on the regular menu", subtitle: "Small serves, many options", card_type: "Tiny Gear Shift", category: "Feeding / Solids", priority: 80, feeding_sensitivity: true,
    short_summary: "From around 6 months, offer suitable iron-rich foods regularly alongside breast milk or formula.", wish_i_knew: "Iron-rich does not mean one special puree. Family foods can do the job in baby-safe forms.",
    why_it_matters: "Babies' stored iron reduces around this age while growth remains rapid.", what_to_do_now: "Add one age-appropriate iron-rich option such as meat, legumes, egg or iron-fortified cereal to regular meals.", what_can_wait: "Getting a large portion eaten every time.",
    checklist_items: ["Offer varied iron-rich foods", "Use a safe texture", "Keep milk feeds alongside solids"], source_urls: ["https://www.pregnancybirthbaby.org.au/babies/feeding-and-nutrition/balancing-introducing-solids-with-milk-feeds"], source_notes: `Feeding content. ${AU_REVIEW}`,
  }),
  born("Baby (3-12 months)", 180, 730, {
    slug: "keep-allergens-in-rotation", title: "Keep tolerated allergens in rotation", subtitle: "Introduction is not the finish line", card_type: "Heads Up", category: "Feeding / Allergy", priority: 84, allergy_sensitivity: true, feeding_sensitivity: true, medical_sensitivity: true,
    short_summary: "Once an allergen has been introduced without a reaction, Australian guidance recommends continuing to offer it regularly in suitable forms.", wish_i_knew: "The tiny first taste gets the attention. The calm repeats are the real routine.",
    why_it_matters: "Ongoing inclusion supports the recommended approach to allergy prevention.", what_to_do_now: "Keep tolerated allergens in the family meal rotation and seek medical advice about any reaction.", what_can_wait: "Introducing several new allergens in one complicated meal.",
    checklist_items: ["Use an age-safe form", "Repeat tolerated foods regularly", "Seek urgent help for severe reaction signs"], source_urls: ["https://www.pregnancybirthbaby.org.au/babies/feeding-and-nutrition/allergy-foods"], source_notes: `Medical, allergy and feeding content. ${AU_REVIEW}`,
  }),
  born("Baby (3-12 months)", 180, 730, {
    slug: "family-food-before-salt", title: "Serve bub's portion before the salt", subtitle: "One pot, tiny detour", card_type: "Tiny Gear Shift", category: "Feeding / Family meals", priority: 66, feeding_sensitivity: true,
    short_summary: "When family food suits your baby, spoon out their soft portion before adding salty sauces, stock or extra salt.", wish_i_knew: "Baby food can be the family dinner caught one step earlier.",
    why_it_matters: "This reduces separate cooking while keeping texture and ingredients appropriate for a baby.", what_to_do_now: "Pause before seasoning, remove a small portion and adapt its texture safely.", what_can_wait: "Cooking a second menu every night.",
    checklist_items: ["Check ingredients", "Serve the baby portion first", "Adapt to a safe texture"], source_urls: ["https://www.pregnancybirthbaby.org.au/babies/feeding-and-nutrition/balancing-introducing-solids-with-milk-feeds"], source_notes: `Feeding content. ${AU_REVIEW}`,
  }),
  born("Baby (3-12 months)", 90, 730, {
    slug: "pram-tether-strap-habit", title: "Loop in before rolling out", subtitle: "The tether strap earns its keep", card_type: "Tiny Gear Shift", category: "Safety / Prams", priority: 74, safety_sensitivity: true,
    short_summary: "Use the pram tether strap whenever the pram is moving, as well as the brake whenever it stops.", wish_i_knew: "The little wrist loop is not decorative trim.",
    why_it_matters: "The strap helps keep the pram connected to you on slopes, bumps and distracted moments.", what_to_do_now: "Make hand-through-strap part of taking hold of the pram.", what_can_wait: "Assuming the route is too flat to need it.",
    checklist_items: ["Use the tether strap", "Brake at stops", "Follow the pram instructions"], source_urls: ["https://www.productsafety.gov.au/consumers/keep-baby-safe/move-baby-safely/prams-and-strollers-guide"], source_notes: `Safety content. ${AU_REVIEW}`,
  }),
  born("Baby (3-12 months)", 120, 730, {
    slug: "swim-lessons-not-supervision", title: "Lessons do not replace supervision", subtitle: "Keep watch stays the rule", card_type: "Heads Up", category: "Safety / Water", priority: 92, safety_sensitivity: true,
    short_summary: "Swimming lessons build skills, but babies and toddlers still need active adult supervision around every body of water.", wish_i_knew: "Water confidence is a skill, not a force field.",
    why_it_matters: "Young children can get into difficulty quickly and quietly.", what_to_do_now: "Nominate the supervising adult and stay within reach around water.", what_can_wait: "Assuming flotation toys or lessons can supervise for you.",
    checklist_items: ["Nominate one watcher", "Stay within reach", "Empty small water containers after use"], source_urls: ["https://www.royallifesaving.com.au/programs/keep-watch"], source_notes: `Water safety content. ${AU_REVIEW}`,
  }),
  born("Baby (3-12 months)", 90, 545, {
    slug: "spare-outfit-in-car", title: "Put the spare outfit in the car", subtitle: "The nappy bag will forget once", card_type: "Tiny Gear Shift", category: "Baby / Outings", priority: 44,
    short_summary: "A simple size-current outfit in a zip pouch can rescue the day when the nappy bag spare has already been used.", wish_i_knew: "The backup needs a backup, but only one tiny one.",
    why_it_matters: "A permanent spare removes one common reason to cut an outing short.", what_to_do_now: "Pack a basic outfit and set a reminder to swap sizes in a few months.", what_can_wait: "A complete emergency wardrobe.",
    checklist_items: ["Pack one complete outfit", "Use a washable pouch", "Update the size seasonally"], source_urls: [], source_notes: null,
  }),
  born("Baby (3-12 months)", 180, 730, {
    slug: "label-childcare-everything", title: "Label the obvious things too", subtitle: "Bottle, hat, jumper, repeat", card_type: "Tiny Gear Shift", category: "Baby / Childcare", priority: 48,
    short_summary: "Put a durable name label or recognisable symbol on every item likely to travel through childcare.", wish_i_knew: "Every small blue drink bottle has an identical twin.",
    why_it_matters: "Clear labels reduce lost gear and make busy drop-offs easier for educators and families.", what_to_do_now: "Label the bottle, lunch box, hat, jumper, comfort item and spare-clothes bag.", what_can_wait: "A custom label for every individual sock.",
    checklist_items: ["Label daily essentials", "Use a clear symbol", "Check labels after washing"], source_urls: [], source_notes: null,
  }),
  born("Baby (3-12 months)", 150, 730, {
    slug: "messy-play-on-a-tray", title: "Put messy play on one tray", subtitle: "Big fun, bounded splat", card_type: "Fun First", category: "Baby / Play", priority: 42,
    short_summary: "A washable tray with a tiny amount of baby-safe messy material creates sensory play without claiming the whole room.", wish_i_knew: "The secret ingredient is not more paint. It is a wipeable boundary.",
    why_it_matters: "A simple setup makes experimentation easier to offer and easier to stop.", what_to_do_now: "Choose one washable material, one tray and an old cloth for the finish.", what_can_wait: "A social-media-ready sensory table.",
    checklist_items: ["Use a washable tray", "Offer a small amount", "Keep cleanup within reach"], source_urls: [], source_notes: null,
  }),
  born("Baby (3-12 months)", 0, 365, {
    slug: "photo-backup-first-year", title: "Back up the ordinary photos", subtitle: "The blurry ones become treasures", card_type: "Parent Sanity", category: "Family / Memories", priority: 38,
    short_summary: "Turn on an automatic photo backup and occasionally save a second copy somewhere you control.", wish_i_knew: "The photo you will love is often the badly lit Tuesday one.",
    why_it_matters: "A simple backup protects a year of small moments from a lost or broken phone.", what_to_do_now: "Check that automatic backup is running and test that you can open a saved photo elsewhere.", what_can_wait: "Sorting every image into a perfect album.",
    checklist_items: ["Turn on automatic backup", "Check storage space", "Test one restore"], source_urls: [], source_notes: null,
  }),

  // Toddler 12-24 months (18)
  born("Toddler (12-24 months)", 365, 730, {
    slug: "fussy-eating-week-view", title: "Zoom out to the whole week", subtitle: "One beige dinner is not the story", card_type: "Parent Sanity", category: "Feeding / Toddlers", priority: 70, feeding_sensitivity: true,
    short_summary: "Toddler appetite and variety can change from meal to meal. Looking across several days can feel more useful than judging one plate.", wish_i_knew: "Tuesday's rejected pea does not receive an annual performance review.",
    why_it_matters: "Pressure can make meals tense, while calm repeated exposure gives children chances to learn about food.", what_to_do_now: "Keep offering varied family foods and notice the broader pattern rather than chasing one perfect meal.", what_can_wait: "Negotiating one more bite at every sitting.",
    checklist_items: ["Look across several days", "Keep portions small", "Offer without pressure"], source_urls: ["https://raisingchildren.net.au/toddlers/nutrition-fitness/common-concerns/fussy-eating"], source_notes: `Feeding content. ${AU_REVIEW}`,
  }),
  born("Toddler (12-24 months)", 365, 730, {
    slug: "family-meal-one-safe-food", title: "Add one familiar food", subtitle: "Not a separate second dinner", card_type: "Tiny Gear Shift", category: "Feeding / Family meals", priority: 64, feeding_sensitivity: true,
    short_summary: "At a shared meal, include one familiar food your toddler can choose alongside the rest of the family food.", wish_i_knew: "A familiar item can be a welcome mat, not a reward.",
    why_it_matters: "Predictability can reduce pressure while still letting a child see and explore other foods.", what_to_do_now: "Put one accepted food on the table and let your toddler decide what and how much to eat from what is offered.", what_can_wait: "Cooking an entirely separate meal after each refusal.",
    checklist_items: ["Include one familiar option", "Eat together when practical", "Keep the mood neutral"], source_urls: ["https://raisingchildren.net.au/toddlers/nutrition-fitness/common-concerns/fussy-eating"], source_notes: `Feeding content. ${AU_REVIEW}`,
  }),
  born("Toddler (12-24 months)", 365, 730, {
    slug: "grapes-popcorn-choking-check", title: "Cut the grapes, skip the popcorn", subtitle: "Shape and texture matter", card_type: "Heads Up", category: "Safety / Choking", priority: 94, safety_sensitivity: true, feeding_sensitivity: true,
    short_summary: "Prepare round, firm foods such as grapes safely and avoid hard choking hazards such as popcorn for young children.", wish_i_knew: "Small is not always safe. A round shape can be the problem.",
    why_it_matters: "Toddlers are still learning to chew and can choke on foods that block the airway.", what_to_do_now: "Cut grapes lengthways into safe pieces, seat your child to eat and supervise closely.", what_can_wait: "Offering a tricky food because everyone else at the party has it.",
    checklist_items: ["Cut round foods lengthways", "Avoid popcorn and hard lollies", "Sit and supervise eating"], source_urls: ["https://raisingchildren.net.au/toddlers/safety/choking-strangulation/choking-prevention"], source_notes: `Feeding and choking safety content. ${AU_REVIEW}`,
  }),
  born("Toddler (12-24 months)", 365, 730, {
    slug: "dummy-weaning-gently", title: "Make the dummy goodbye gradual", subtitle: "Comfort can change in steps", card_type: "Parent Sanity", category: "Toddler / Sleep", priority: 54, medical_sensitivity: true,
    short_summary: "If you are ready to reduce dummy use, a calm gradual plan can start with limiting it to specific times such as sleep.", wish_i_knew: "It does not need to vanish in one dramatic ceremony.",
    why_it_matters: "Predictable limits and other comfort strategies can make change easier for a toddler and parent.", what_to_do_now: "Choose one small limit, offer another comfort and ask your child health professional or dentist if you have concerns.", what_can_wait: "Comparing your timeline with another child.",
    checklist_items: ["Pick one gentle first step", "Add another comfort cue", "Keep the boundary predictable"], source_urls: ["https://raisingchildren.net.au/toddlers/sleep/night-time-problems/dummies-helping-your-child-let-go"], source_notes: `Oral health and sleep content. ${AU_REVIEW}`,
  }),
  born("Toddler (12-24 months)", 365, 730, {
    slug: "screens-with-a-plan", title: "Give screens a job", subtitle: "Purpose before autoplay", card_type: "Parent Sanity", category: "Toddler / Screens", priority: 60, medical_sensitivity: true,
    short_summary: "Australian guidance recommends avoiding routine screen time under 2 except video calls. When screens happen, keep them purposeful and protect sleep, movement and connection.", wish_i_knew: "A plan is more useful than pretending the glowing rectangle does not exist.",
    why_it_matters: "Young children learn through responsive interaction, movement and hands-on play.", what_to_do_now: "Choose the purpose and stopping point before starting, and watch together when practical.", what_can_wait: "Turning one difficult day into a verdict on your parenting.",
    checklist_items: ["Decide the purpose", "Set a stopping cue", "Keep screens away from bedtime where possible"], source_urls: ["https://www.healthdirect.gov.au/internet-and-kids"], source_notes: `Child development and health content. ${AU_REVIEW}`,
  }),
  born("Toddler (12-24 months)", 270, 730, {
    slug: "anchor-climbing-furniture", title: "Anchor what looks climbable", subtitle: "Drawers become a ladder", card_type: "Heads Up", category: "Safety / Home", priority: 96, safety_sensitivity: true,
    short_summary: "Secure unstable furniture and televisions to a wall or suitable structure before climbing begins.", wish_i_knew: "A toddler sees a chest of drawers and immediately understands staircase technology.",
    why_it_matters: "Furniture tip-overs can cause severe injury, and supervision alone cannot prevent every sudden climb.", what_to_do_now: "Identify tall or unstable furniture, use suitable anchors and follow manufacturer guidance.", what_can_wait: "Assuming a heavy item cannot fall.",
    checklist_items: ["Anchor furniture and televisions", "Do not place tempting items on top", "Keep drawers closed"], source_urls: ["https://www.productsafety.gov.au/consumers/be-safe-around-the-home/use-products-inside-the-home-safely/toppling-furniture-and-televisions-guide"], source_notes: `Safety content. ${AU_REVIEW}`,
  }),
  born("Toddler (12-24 months)", 270, 730, {
    slug: "blind-cords-out-of-reach", title: "Secure every blind cord high", subtitle: "Check the rooms you visit too", card_type: "Heads Up", category: "Safety / Home", priority: 98, safety_sensitivity: true,
    short_summary: "Keep curtain and blind cords secured, tensioned and well out of children's reach, with furniture moved away from them.", wish_i_knew: "The cord is high until a cot, chair or toy box becomes a step.",
    why_it_matters: "Loose looped cords can cause strangulation quickly and silently.", what_to_do_now: "Check every window at child height, install suitable safety devices and move climbable furniture away.", what_can_wait: "Assuming a rarely used room is not part of the safety check.",
    checklist_items: ["Secure cords high", "Remove loops", "Move climbable furniture away"], source_urls: ["https://www.productsafety.gov.au/consumers/be-safe-around-the-home/use-products-inside-the-home-safely/blinds-curtains-and-window-fittings-guide"], source_notes: `Safety content. ${AU_REVIEW}`,
  }),
  born("Toddler (12-24 months)", 365, 730, {
    slug: "driveway-hand-hold-rule", title: "Hold hands before the driveway", subtitle: "The rule starts at the door", card_type: "Heads Up", category: "Safety / Roads", priority: 92, safety_sensitivity: true,
    short_summary: "Use a consistent hand-hold or secure-wait rule around driveways, car parks and roads.", wish_i_knew: "The safest driveway conversation happens before the front door opens.",
    why_it_matters: "Toddlers are small, fast and not yet able to judge traffic speed or danger.", what_to_do_now: "Choose simple words, hold hands and physically supervise every transition near vehicles.", what_can_wait: "Expecting a toddler to remember the rule while excited.",
    checklist_items: ["Start the rule at the door", "Hold hands near vehicles", "Check around the car before moving"], source_urls: ["https://raisingchildren.net.au/school-age/safety/car-pedestrian-safety/pedestrian-safety"], source_notes: `Road and driveway safety content. ${AU_REVIEW}`,
  }),
  born("Toddler (12-24 months)", 270, 730, {
    slug: "hot-drinks-high-zone", title: "Make a high zone for hot drinks", subtitle: "Bench edge is toddler territory", card_type: "Tiny Gear Shift", category: "Safety / Burns", priority: 94, safety_sensitivity: true,
    short_summary: "Keep hot drinks at the back of benches and tables, away from edges, cords and a toddler's reach.", wish_i_knew: "Their reach grows overnight and coffee stays hot longer than patience.",
    why_it_matters: "Hot drinks are a common cause of serious scalds in young children.", what_to_do_now: "Choose one default high spot and put every hot drink there before doing anything else.", what_can_wait: "Trusting a travel mug lid as the whole safety plan.",
    checklist_items: ["Use the back of the bench", "Keep cords out of reach", "Do not hold a child and hot drink together"], source_urls: ["https://raisingchildren.net.au/newborns/safety/burns-scalds-fire/scalds-prevention"], source_notes: `Burn and scald safety content. ${AU_REVIEW}`,
  }),
  born("Toddler (12-24 months)", 365, 730, {
    slug: "dogs-need-toddler-free-space", title: "Give the dog a toddler-free zone", subtitle: "Rest is part of safe togetherness", card_type: "Heads Up", category: "Safety / Pets", priority: 86, safety_sensitivity: true,
    short_summary: "Create a place where the dog can rest, eat and move away without a toddler following.", wish_i_knew: "Good family dogs still need an exit door from enthusiastic love.",
    why_it_matters: "Space and active supervision reduce stressful interactions for both child and dog.", what_to_do_now: "Set up a gated rest area and keep children away when the dog is eating, sleeping or has a toy.", what_can_wait: "Expecting the dog to tolerate every hug or climb.",
    checklist_items: ["Create a child-free rest zone", "Actively supervise together time", "Separate around food and sleep"], source_urls: ["https://raisingchildren.net.au/newborns/safety/home-pets/dogs"], source_notes: `Pet and child safety content. ${AU_REVIEW}`,
  }),
  born("Toddler (12-24 months)", 365, 730, {
    slug: "bath-water-temperature-check", title: "Check the bath before they climb in", subtitle: "Warm, not hot", card_type: "Tiny Gear Shift", category: "Safety / Bath", priority: 90, safety_sensitivity: true,
    short_summary: "Run and mix bath water carefully, check the temperature before your child enters, and keep hot taps inaccessible.", wish_i_knew: "Your hand check is part of bath setup, not an optional final flourish.",
    why_it_matters: "Young skin can scald quickly, and hot water can remain in the tap or pool unevenly.", what_to_do_now: "Test the mixed water before every bath and stay within arm's reach throughout.", what_can_wait: "Adding toys before the temperature and supervision are sorted.",
    checklist_items: ["Mix and test the water", "Keep the child away from taps", "Stay within arm's reach"], source_urls: ["https://raisingchildren.net.au/newborns/safety/burns-scalds-fire/scalds-prevention"], source_notes: `Bath and scald safety content. ${AU_REVIEW}`,
  }),
  born("Toddler (12-24 months)", 365, 730, {
    slug: "snack-tub-by-door", title: "Keep one outing snack tub", subtitle: "Refill it before the shoes go on", card_type: "Tiny Gear Shift", category: "Feeding / Outings", priority: 48, feeding_sensitivity: true,
    short_summary: "A small container of familiar age-appropriate snacks by the door can make short outings easier.", wish_i_knew: "The emergency snack is mostly an emergency for the adults' decision-making.",
    why_it_matters: "A ready option reduces last-minute packing while keeping food choices suitable for your child.", what_to_do_now: "Choose a few safe familiar options and refresh them before leaving.", what_can_wait: "Packing a full cafe menu for a trip to the playground.",
    checklist_items: ["Choose age-safe snacks", "Check dates and storage", "Offer food seated and supervised"], source_urls: ["https://raisingchildren.net.au/toddlers/nutrition-fitness/daily-food-guides/toddlers-food-groups"], source_notes: `Feeding content. ${AU_REVIEW}`,
  }),
  born("Toddler (12-24 months)", 365, 730, {
    slug: "wet-weather-door-kit", title: "Build a wet-weather door kit", subtitle: "Rain does not cancel the wobble walk", card_type: "Fun First", category: "Toddler / Outings", priority: 42,
    short_summary: "Gumboots, a rain layer and an old towel by the door turn a damp forecast into a low-effort outing.", wish_i_knew: "Puddles are free toddler programming.",
    why_it_matters: "Reducing the setup makes fresh air and a change of scene more available on long indoor days.", what_to_do_now: "Put weather gear and a cleanup towel together in one basket.", what_can_wait: "Keeping every item dry and spotless during the adventure.",
    checklist_items: ["Gumboots", "Rain layer", "Old towel", "Dry socks for home"], source_urls: [], source_notes: null,
  }),
  born("Toddler (12-24 months)", 365, 730, {
    slug: "picnic-dinner-reset", title: "Move dinner to the picnic rug", subtitle: "Same food, different night", card_type: "Parent Sanity", category: "Toddler / Family fun", priority: 38,
    short_summary: "When the evening is dragging, serve the ordinary dinner on a rug indoors or outside and call it a picnic.", wish_i_knew: "Novelty can be one metre of floor space.",
    why_it_matters: "A tiny setting change can soften a tense evening without adding a complicated activity.", what_to_do_now: "Put down a washable rug and bring the normal plates over.", what_can_wait: "A themed menu, decorations or photographic evidence.",
    checklist_items: ["Use the usual dinner", "Choose an easy-clean spot", "Let novelty do the work"], source_urls: [], source_notes: null,
  }),
  born("Toddler (12-24 months)", 450, 730, {
    slug: "first-ferry-or-train-ride", title: "Take the ride as the outing", subtitle: "No destination attraction required", card_type: "Fun First", category: "Toddler / Adventures", priority: 40,
    short_summary: "A short ferry or train trip can be the whole adventure, with no need to add a major destination.", wish_i_knew: "For a toddler, public transport is already the theme park ride.",
    why_it_matters: "A simple return trip offers new sounds, views and routines without overloading the day.", what_to_do_now: "Pick a quiet time, travel a few stops and come home while it is still fun.", what_can_wait: "Making the trip educational or productive.",
    checklist_items: ["Choose a short route", "Avoid the busiest time", "Pack only the basics"], source_urls: [], source_notes: null,
  }),
  born("Toddler (12-24 months)", 365, 730, {
    slug: "grandparent-care-cheat-sheet", title: "Make the care cheat sheet tiny", subtitle: "The useful bits fit on one page", card_type: "Tiny Gear Shift", category: "Toddler / Support", priority: 50,
    short_summary: "A one-page note with routines, comfort tricks and contacts helps occasional carers without scripting every minute.", wish_i_knew: "Nobody needs the full parenting operating manual to cover Tuesday afternoon.",
    why_it_matters: "Clear essentials reduce handover questions and leave room for carers to find their own rhythm.", what_to_do_now: "Write meal, sleep, comfort, allergy and contact essentials in plain language.", what_can_wait: "Documenting every possible mood or preference.",
    checklist_items: ["Emergency contacts", "Food and allergy essentials", "Sleep cues", "Favourite comfort"], source_urls: [], source_notes: null,
  }),
  born("Toddler (12-24 months)", 365, 730, {
    slug: "toddler-art-inbox", title: "Give the art one inbox", subtitle: "Keep some, photograph some, release some", card_type: "Parent Sanity", category: "Toddler / Memories", priority: 34,
    short_summary: "One folder or tray contains incoming artwork until you choose a few pieces to keep or photograph.", wish_i_knew: "Not every scribble needs a lifelong storage commitment.",
    why_it_matters: "A simple boundary preserves favourite memories without turning paper into household infrastructure.", what_to_do_now: "Choose one inbox and clear it at a relaxed interval.", what_can_wait: "A perfect archival system with labels and dates.",
    checklist_items: ["Choose one folder or tray", "Keep a few favourites", "Photograph bulky pieces"], source_urls: [], source_notes: null,
  }),
  born("Toddler (12-24 months)", 365, 730, {
    slug: "clothes-two-outfits-forward", title: "Pair two outfits ahead", subtitle: "Morning gets fewer decisions", card_type: "Tiny Gear Shift", category: "Toddler / Routines", priority: 36,
    short_summary: "Clip or fold two complete weather-ready outfits together so the next rushed morning has an easy answer.", wish_i_knew: "Finding the matching clean pants is apparently a high-level dawn puzzle.",
    why_it_matters: "A tiny preparation step removes choices when everyone is tired or late.", what_to_do_now: "Pair two tops, bottoms and layers after the next wash.", what_can_wait: "Planning a full week of coordinated clothing.",
    checklist_items: ["Check the forecast", "Pair two complete outfits", "Include one warm layer"], source_urls: [], source_notes: null,
  }),
];

function sqlString(value) { return value == null ? "null" : `'${String(value).replace(/'/g, "''")}'`; }
function sqlJson(value) { return `${sqlString(JSON.stringify(value))}::jsonb`; }
function sqlBool(value) { return value ? "true" : "false"; }
function timingFields(card) {
  return card.start_age_days != null
    ? `${card.start_age_days}, ${card.end_age_days}, null, null`
    : `null, null, ${card.pregnancy_week_start}, ${card.pregnancy_week_end}`;
}
function needsEditorialReview(card) {
  return Boolean(card.medical_sensitivity || card.government_sensitivity || card.safety_sensitivity || card.allergy_sensitivity || card.feeding_sensitivity || String(card.source_notes ?? "").toLowerCase().includes("review"));
}
function imageFields(card, imageMeta) {
  const relativeUrl = `/card-images/pixel/px-${card.slug}.png`;
  const hasImage = fs.existsSync(path.join(root, "public", relativeUrl));
  const hasAlt = Boolean(imageMeta?.alt?.trim());
  return { hasPublishableImage: hasImage && hasAlt, imageUrl: hasImage ? relativeUrl : null, imageAlt: hasAlt ? imageMeta.alt : null, imageStatus: hasImage && hasAlt ? "approved" : "needed" };
}
function publishFields(card, hasPublishableImage) {
  return needsEditorialReview(card) || !hasPublishableImage
    ? `'in_review',\n  null,\n  null,\n  null`
    : `'published',\n  current_date,\n  current_date + interval '12 months',\n  now()`;
}

const tuples = cards.map((card) => {
  const imageMeta = batch5CardImages[card.slug];
  if (!imageMeta) throw new Error(`Missing batch 5 image metadata for ${card.slug}`);
  const image = imageFields(card, imageMeta);
  return `(
  ${sqlString(card.slug)},
  ${sqlString(card.title)},
  ${sqlString(card.subtitle)},
  ${sqlString(card.card_type)},
  ${sqlString(card.category)},
  ${sqlString(card.life_stage)},
  ${timingFields(card)},
  ${card.priority ?? 50},
  ${sqlBool(card.time_critical)},
  ${sqlString(card.short_summary)},
  ${sqlString(card.wish_i_knew)},
  ${sqlString(card.why_it_matters)},
  ${sqlString(card.what_to_do_now)},
  ${sqlString(card.what_can_wait)},
  ${sqlJson(card.checklist_items ?? [])},
  ${sqlJson(card.source_urls ?? [])},
  ${sqlString(card.source_notes)},
  ${sqlBool(card.medical_sensitivity)},
  ${sqlBool(card.government_sensitivity)},
  ${sqlBool(card.safety_sensitivity)},
  ${sqlBool(card.allergy_sensitivity)},
  ${sqlBool(card.feeding_sensitivity)},
  ${sqlJson(card.conditions ?? {})},
  ${sqlString(`Cute pixel art collectible: ${imageMeta.subject}.`)},
  ${sqlString(image.imageUrl)},
  ${sqlString(image.imageAlt)},
  ${sqlString(imageStyle)},
  ${sqlString(image.imageStatus)},
  ${publishFields(card, image.hasPublishableImage)}
)`;
});

const header = `-- Wish I Knew content library batch 5 (50 cards).
-- Run after seed_content_library_batch4.sql. Safe to re-run (upserts by slug).
-- Sensitive cards remain in_review with null review dates until editorial review.

insert into public.timeline_cards (
  slug, title, subtitle, card_type, category, life_stage,
  start_age_days, end_age_days, pregnancy_week_start, pregnancy_week_end,
  priority, time_critical, short_summary, wish_i_knew, why_it_matters,
  what_to_do_now, what_can_wait, checklist_items, source_urls, source_notes,
  medical_sensitivity, government_sensitivity, safety_sensitivity,
  allergy_sensitivity, feeding_sensitivity, conditions, illustration_prompt,
  image_url, image_alt, image_style, image_status, status,
  last_reviewed_at, review_due_date, published_at
) values
`;

const footer = `
on conflict (slug) do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  card_type = excluded.card_type,
  category = excluded.category,
  life_stage = excluded.life_stage,
  start_age_days = excluded.start_age_days,
  end_age_days = excluded.end_age_days,
  pregnancy_week_start = excluded.pregnancy_week_start,
  pregnancy_week_end = excluded.pregnancy_week_end,
  priority = excluded.priority,
  time_critical = excluded.time_critical,
  short_summary = excluded.short_summary,
  wish_i_knew = excluded.wish_i_knew,
  why_it_matters = excluded.why_it_matters,
  what_to_do_now = excluded.what_to_do_now,
  what_can_wait = excluded.what_can_wait,
  checklist_items = excluded.checklist_items,
  source_urls = excluded.source_urls,
  source_notes = excluded.source_notes,
  medical_sensitivity = excluded.medical_sensitivity,
  government_sensitivity = excluded.government_sensitivity,
  safety_sensitivity = excluded.safety_sensitivity,
  allergy_sensitivity = excluded.allergy_sensitivity,
  feeding_sensitivity = excluded.feeding_sensitivity,
  conditions = excluded.conditions,
  illustration_prompt = excluded.illustration_prompt,
  image_url = excluded.image_url,
  image_alt = excluded.image_alt,
  image_style = excluded.image_style,
  image_status = excluded.image_status,
  status = excluded.status,
  last_reviewed_at = excluded.last_reviewed_at,
  review_due_date = excluded.review_due_date,
  published_at = excluded.published_at,
  updated_at = now();
`;

const outPath = path.join(root, "supabase", "seed_content_library_batch5.sql");
fs.writeFileSync(outPath, `${header}${tuples.join(",\n")}${footer}\n`);
console.log(`Wrote ${cards.length} cards to ${outPath}`);
