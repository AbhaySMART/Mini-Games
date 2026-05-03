const KIND_KINGDOM_GAMES = [
  g("Compliment Castle", "Kind Words", "Specific compliments name real effort, traits, and impact.", "forge a sincere compliment from effort, trait, and impact word pieces.", "Royal Forge of Words", "wordForge", "🏰", {
    theme: "Medieval word forge with glowing text magic",
    scene: "A castle workshop where kind words become shining bricks.",
    data: ["Effort: kept trying|effort", "Effort: helped clean|effort", "Trait: creative|trait", "Trait: patient|trait", "Impact: made us proud|impact", "Impact: helped the team|impact"]
  }),
  g("Share The Crown", "Generosity", "Sharing power helps every friend feel trusted and included.", "keep the magical crown moving before one ruler holds power too long.", "Control Transfer Physics", "crownBalance", "👑", {
    theme: "Magical throne room with shifting royal power",
    scene: "A glowing crown floats between young rulers as the room reacts.",
    data: ["Mina", "Leo", "Ari", "Nora"]
  }),
  g("Brave Apology Bridge", "Accountability", "A sincere apology repairs trust one honest step at a time.", "rebuild a cracked bridge by placing apology steps in the right order.", "Structural Repair Sequencing", "bridgeSequence", "🌉", {
    theme: "Cracked glowing bridge over a deep starlit void",
    scene: "Each true apology stone lights a new bridge segment.",
    data: ["Notice what happened", "Name the hurt", "Say sorry clearly", "Offer a repair", "Do better next time"]
  }),
  g("Listening Lanterns", "Communication", "Good listening means filtering distractions and holding onto what matters.", "catch important signals while letting noisy distractions drift away.", "Signal Filtering System", "signalFilter", "🏮", {
    theme: "Floating lantern path in a quiet night sky",
    scene: "Lanterns carry clues through a sky full of distracting sparks.",
    data: ["Important: I felt left out|important", "Noise: random drumbeat|noise", "Important: please wait your turn|important", "Noise: shiny comet|noise", "Important: meet by the fountain|important"]
  }),
  g("Feelings Garden", "Emotional Awareness", "Feelings affect one another, and naming them helps the whole system calm.", "stabilize a living garden where one emotion can change nearby blooms.", "Emotion Chain Reactions", "emotionGarden", "🌸", {
    theme: "Living emotional ecosystem of color-changing flowers",
    scene: "A garden of mood blooms brightens or wilts together.",
    data: ["Sad|comfort", "Worried|breathing", "Frustrated|space", "Excited|share", "Lonely|invite"]
  }),
  g("Patience Potion", "Self-Control", "Patience grows when calm choices slow the rush inside us.", "slow the potion clock by waiting calmly instead of clicking too fast.", "Time Dilation Control", "timeDilation", "⏳", {
    theme: "Time-bending wizard lab with clocks and potion steam",
    scene: "A potion bubbles faster or slower based on the player's calm.",
    data: ["Breathe", "Wait", "Stir slowly", "Try again"]
  }),
  g("Helping Hands Bakery", "Service", "Helpful people notice the need behind the words.", "read each customer and choose what they actually need.", "Hidden Needs System", "hiddenNeeds", "🍞", {
    theme: "Busy magical bakery with warm ovens and chaotic orders",
    scene: "Customers ask in imperfect ways while pastries fly across the counter.",
    data: ["My tray is wobbling!|steady tray", "This bread looks lonely.|share a basket", "I said I am fine...|gentle check-in", "The line is long.|call another helper"]
  }),
  g("Truth-Teller Tower", "Honesty", "Truth builds a stronger future than avoidance, even when it is hard.", "compare truth and avoidance timelines before choosing the honest path.", "Dual Path Timeline", "truthTimeline", "🗼", {
    theme: "Vertical tower split between light and shadow",
    scene: "Two tower timelines rise side by side, one clear and one cracked.",
    data: ["I broke the cup|truth", "The wind did it|avoid", "I forgot my promise|truth", "Nobody told me|avoid"]
  }),
  g("Gratitude Gems", "Gratitude", "Specific gratitude is stronger than vague thanks.", "link each thank-you gem to the real event that made it shine.", "Memory Linking System", "memoryLink", "💎", {
    theme: "Crystal cavern of glowing memory gems",
    scene: "Gems brighten only when gratitude connects to a clear memory.",
    data: ["Thanks for helping me read|read together", "Thanks for sharing lunch|shared lunch", "Thanks for waiting for me|waited kindly", "Thanks for cheering me on|cheered"]
  }),
  g("Respectful Roundtable", "Respect", "Respectful words can help many people feel heard at once.", "choose replies that improve the whole council's trust network.", "Reputation Network System", "reputationNetwork", "🏛️", {
    theme: "Council chamber with shifting alliances",
    scene: "A roundtable glows as each response affects several listeners.",
    data: ["I hear your idea|+all", "That is silly|-all", "Can I add another thought?|+speaker", "Only my plan matters|-listener"]
  }),
  g("Inclusion Inn", "Belonging", "Small invitations can make different people feel welcome in different ways.", "raise each guest's comfort by choosing actions that fit them.", "Belonging Meter", "belongingMeters", "🏨", {
    theme: "Ever-changing magical inn with rooms that rearrange for guests",
    scene: "The inn reshapes itself as guests feel more or less at home.",
    data: ["Quiet Guest|gentle invite", "New Guest|tour", "Left-Out Guest|seat together", "Helper Guest|shared job"]
  }),
  g("Courage Cave", "Courage", "Courage does not erase fear; it helps us move with care.", "clear fear-made obstacles by naming brave next steps.", "Fear Visualization System", "fearCave", "🕳️", {
    theme: "Dark cave where fear becomes visible obstacles",
    scene: "Shadows turn into rocks until courage lights the path.",
    data: ["Name the fear", "Take one step", "Ask for support", "Try the brave choice"]
  }),
  g("Calm Dragon Den", "Calm Choices", "Steady breathing can calm big feelings before they become unsafe choices.", "match the breathing rhythm to soothe the emotional dragon.", "Breathing Rhythm Control", "breathingDragon", "🐉", {
    theme: "Dragon den linked to the player's rhythm",
    scene: "A dragon's fire rises and falls with calm breathing.",
    data: ["Inhale", "Hold", "Exhale", "Rest"]
  }),
  g("Teamwork Tournament", "Cooperation", "Teams succeed when different roles work together.", "use each teammate's unique role at the right moment.", "Asymmetric Roles", "teamRoles", "🏆", {
    theme: "Fantasy arena with rotating teamwork challenges",
    scene: "A tournament field changes as each role completes its part.",
    data: ["Scout|spot", "Builder|lift", "Planner|route", "Finisher|score"]
  }),
  g("Fairness Fountain", "Fairness", "Fairness means giving each person what helps them participate.", "balance the fountain by matching resources to different needs.", "Equity Balancing Puzzle", "equityFountain", "⛲", {
    theme: "Scales and flowing water system",
    scene: "Water flows evenly only when each helper receives the right support.",
    data: ["Short helper|step stool", "Tired helper|lighter bucket", "Fast helper|extra distance", "New helper|clear directions"]
  }),
  g("Promise Path", "Reliability", "Keeping promises works best when we plan for future obstacles.", "choose promise plans now and watch future paths change.", "Future Planning Simulation", "futurePath", "🛤️", {
    theme: "Journey map with branching routes",
    scene: "A glowing path reveals future bumps based on today's plan.",
    data: ["Pack early|smooth", "Wait until late|storm", "Ask for help|bridge", "Forget to check|blocked"]
  }),
  g("Healthy Habits Harbor", "Wellness", "Sleep, food, water, and movement affect one another.", "balance the harbor ecosystem by keeping healthy systems connected.", "System Balance Meter", "habitsHarbor", "⚓", {
    theme: "Living harbor ecosystem of boats, waves, and healthy supplies",
    scene: "The harbor gets brighter when body habits stay balanced.",
    data: ["Water", "Sleep", "Food", "Movement", "Clean hands"]
  }),
  g("Safety Shield", "Safety", "Safe choices begin with predicting what could happen next.", "predict outcomes before raising the shield or stepping forward.", "Predictive Decision System", "predictiveShield", "🛡️", {
    theme: "Defensive barrier against glowing hazards",
    scene: "A shield shows possible outcomes before anyone moves.",
    data: ["Ball rolls into road|ask adult", "Helmet before biking|go", "Unknown link online|stop", "Wet floor running|slow down"]
  }),
  g("Curiosity Clock", "Learning", "Deeper questions unlock deeper learning.", "turn the clock by choosing stronger question layers.", "Question Depth Unlocking", "questionClock", "⏰", {
    theme: "Giant clock with unlockable layers",
    scene: "Clock gears open as questions move from simple to deep.",
    data: ["What happened?|1", "Why did it happen?|2", "What could we test?|3", "How does this connect?|4"]
  }),
  g("Perseverance Peak", "Growth Mindset", "After a setback, changing strategy matters more than giving up.", "climb changing terrain by adapting after failure.", "Adaptive Difficulty System", "adaptivePeak", "🏔️", {
    theme: "Mountain climb with changing terrain",
    scene: "The mountain changes its footholds after each mistake.",
    data: ["Try a new route", "Practice one part", "Ask for coaching", "Notice progress"]
  }),
  g("Empathy Echoes", "Empathy", "Empathy means matching care to another person's feeling.", "match emotional wave frequencies in the echo cave.", "Wave Matching System", "empathyWaves", "🔊", {
    theme: "Echo cave of emotional waves",
    scene: "Colored sound waves ripple when care matches a feeling.",
    data: ["Lonely|invite", "Sad|comfort", "Worried|reassure", "Excited|celebrate"]
  }),
  g("Manners Market", "Courtesy", "Courtesy lives in small repeated choices.", "score every tiny market interaction with polite timing.", "Micro-Interaction Scoring", "microManners", "🛍️", {
    theme: "Interactive marketplace simulation",
    scene: "A busy market responds to each polite word and careful action.",
    data: ["Please", "Thank you", "Excuse me", "Wait turn", "Gentle voice"]
  }),
  g("Problem-Solving Portal", "Problem Solving", "Testing a solution first helps us choose wisely.", "simulate outcomes before committing to a problem-solving portal.", "Outcome Simulation Engine", "solutionPortal", "🌀", {
    theme: "Portal with branching realities",
    scene: "Portals preview the result of each possible plan.",
    data: ["Talk it out|calmer", "Grab it back|worse", "Take turns|fair", "Walk away forever|unsolved"]
  }),
  g("Nature Nook", "Environmental Care", "Nature is connected; one choice can help or hurt the whole nook.", "experiment with cause and effect in a mini ecosystem.", "Cause-Effect Simulation", "ecosystemNook", "🌿", {
    theme: "Mini ecosystem sandbox of plants, water, paths, and tiny habitats",
    scene: "Plants, water, and paths react to every caring choice.",
    data: ["Water plant|plants", "Pick up plastic|animals", "Stay on path|soil", "Plant seeds|future"]
  }),
  g("Digital Kindness Gate", "Digital Citizenship", "Online messages change real feelings and shared spaces.", "moderate chat streams and watch the digital world react instantly.", "Real-Time Chat Consequence System", "chatGate", "🌐", {
    theme: "Cyber world with glowing message streams",
    scene: "Kind messages brighten the gate while harmful ones dim it.",
    data: ["You tried hard!|kind", "Nobody wants you here|unkind", "Can I help?|kind", "Share their secret|unkind"]
  }),
  g("Restful Moon Meadow", "Rest", "Calming down works best when restful steps happen in a gentle order.", "complete the meadow's bedtime sequence in the calming order.", "Sequence Relaxation Mechanic", "relaxSequence", "🌙", {
    theme: "Calm dream-like nighttime field",
    scene: "Moonlit flowers dim as each bedtime step happens in order.",
    data: ["Screens away", "Wash up", "Read quietly", "Breathe slowly", "Sleep steady"]
  })
];

function g(title, category, lesson, mission, mechanicName, mechanic, icon, config) {
  return {
    title,
    category,
    lesson,
    mission,
    mechanicName,
    mechanic,
    icon,
    theme: config.theme,
    scene: config.scene,
    data: config.data,
    slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")
  };
}
