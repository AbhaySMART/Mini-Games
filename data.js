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
  }),
  g("Peacekeeper Palace", "Conflict Repair", "Peace grows when we lower the heat, name the problem, and choose a repair.", "guide a tense argument through calm repair gates before the palace bells ring.", "Conflict Temperature Gates", "conflictGates", "🕊️", {
    theme: "Pearl palace with warm and cool rooms",
    scene: "A palace hallway cools as arguments become repair plans.",
    data: ["Lower your voice|Say: let us pause and talk calmly|Blame them louder|The room cools", "Name the problem|Say what happened without insults|Call names|The map clears", "Offer a repair|Suggest taking turns or replacing what broke|Walk away forever|The gate opens", "Check feelings|Ask if the plan feels fair|Declare you won|Peace bells ring"]
  }),
  g("Generous Grove", "Giving", "Generosity means noticing what you can offer without making someone feel small.", "grow a giving tree by choosing helpful gifts of time, attention, and care.", "Gift Growth Branches", "giftBranches", "🌳", {
    theme: "Sunlit grove with glowing kindness fruit",
    scene: "A tree grows different fruit for different kinds of generosity.",
    data: ["Busy parent|Offer to carry one bag|Ask for a reward first|A time fruit grows", "Lonely neighbor|Wave and ask how their day is|Pretend not to see them|A welcome fruit grows", "Friend forgot snack|Share a piece if you have enough|Tease them|A sharing fruit grows", "Sibling needs quiet|Lower the volume|Turn it louder|A respect fruit grows"]
  }),
  g("Focus Fireflies", "Attention", "Focus improves when distractions are noticed, parked, and returned to later.", "catch glowing focus fireflies while placing distractions in the later jar.", "Attention Sorting Swarm", "focusSwarm", "✨", {
    theme: "Twilight field full of focus fireflies and distraction sparks",
    scene: "Fireflies brighten when attention returns to the task.",
    data: ["Homework step|Focus now|Check random videos|Firefly saved", "Water break|Helpful pause|Scroll for ten minutes|Energy steadies", "Loud thought|Write it for later|Follow every thought|Distraction parked", "Finish one piece|Do the next small step|Quit the whole task|Focus circle closes"]
  }),
  g("Boundary Bay", "Boundaries", "Healthy boundaries are kind words that protect space, time, and comfort.", "steer boats through boundary buoys by choosing clear respectful limits.", "Boundary Buoy Navigation", "boundaryBuoys", "🛟", {
    theme: "Bright bay with boats, buoys, and calm water lanes",
    scene: "Boats move safely when boundaries are clear.",
    data: ["Too much hugging|Say: I prefer a wave today|Push and yell|The boat gets space", "Not ready to share|Say: I can share after I finish|Grab everything back|The buoy lights", "Need quiet|Say: I need ten quiet minutes|Slam the door|The bay settles", "Online message late|Reply tomorrow instead of rushing|Stay up upset|The lighthouse glows"]
  }),
  g("Mindful Meteor", "Mindfulness", "Mindfulness helps us notice thoughts and feelings before reacting.", "pilot a meteor through thought clouds by naming what is happening now.", "Present-Moment Piloting", "mindfulMeteor", "☄️", {
    theme: "Deep space with soft thought clouds and glowing stars",
    scene: "A meteor flies smoothly when thoughts are noticed instead of chased.",
    data: ["Body clue|Notice tight shoulders|Ignore every signal|The meteor steadies", "Thought cloud|Say: this is a worry thought|Believe it instantly|Stars clear", "Feeling wave|Name the feeling quietly|Explode at someone|Orbit softens", "Next breath|Take one slow breath|Rush the reaction|Landing lights appear"]
  }),
  g("Friendship Forge", "Friendship", "Friendship is built through listening, reliability, repair, and shared joy.", "forge friendship links by heating, shaping, cooling, and shining each bond.", "Friendship Link Forging", "friendshipForge", "🔗", {
    theme: "Cozy forge where metal links become friendship bracelets",
    scene: "Friendship links glow when care is shaped into action.",
    data: ["Heat|Listen before talking|Interrupt with your story|The link warms", "Shape|Keep the plan you made|Forget and shrug|The link bends true", "Cool|Apologize after a mistake|Act like nothing happened|The link strengthens", "Shine|Celebrate their good news|Change the topic to yourself|The bracelet sparkles"]
  }),
  g("Responsibility Railway", "Responsibility", "Responsibility means owning the job, the mistake, and the next step.", "route trains by matching tasks to ownership, reminders, and repair actions.", "Responsibility Track Switches", "responsibilityRail", "🚂", {
    theme: "Mountain railway with glowing switch tracks",
    scene: "Trains arrive on time when responsibility switches are set.",
    data: ["Chore assigned|Set a reminder and do it|Hope someone else does it|Train leaves on time", "Forgot task|Admit it and finish now|Make excuses|Track repairs", "Shared mess|Clean your part first|Point at others|Cargo balances", "Future job|Prepare supplies early|Wait until rushed|Station lights up"]
  }),
  g("Forgiveness Falls", "Forgiveness", "Forgiveness can release hurt while still keeping wise boundaries.", "clear river stones by choosing release, repair, and safe next steps.", "Forgiveness River Flow", "forgivenessFlow", "💧", {
    theme: "Waterfall canyon with glowing river stones",
    scene: "The river flows when hurt is named and handled wisely.",
    data: ["Small accident|Accept apology and move forward|Keep reminding them forever|Water clears", "Repeated hurt|Forgive but set a boundary|Pretend it is fine|Riverbank strengthens", "Your own guilt|Learn and make repair|Call yourself terrible|Stone lifts", "Friend wants trust back|Watch for changed actions|Trust instantly with no plan|Falls shine"]
  }),
  g("Leadership Lighthouse", "Leadership", "Good leaders guide, listen, include, and take responsibility.", "send lighthouse signals that help a group move together safely.", "Leadership Signal Tower", "leadershipSignals", "🗺️", {
    theme: "Stormy coast with a lighthouse and team boats",
    scene: "Signals guide the fleet when leadership serves the group.",
    data: ["Group is confused|Explain the goal simply|Boss everyone around|Boats align", "Quiet person ignored|Invite their idea|Only ask loud voices|Signal widens", "Plan failed|Own your part and adjust|Blame the group|Storm fades", "Team succeeds|Share credit with everyone|Take all the praise|Beacon shines"]
  }),
  g("Confidence Carnival", "Confidence", "Confidence grows when we remember strengths and try brave next steps.", "power carnival rides by choosing realistic self-talk and small actions.", "Confidence Ride Power", "confidenceCarnival", "🎡", {
    theme: "Night carnival with glowing rides and courage tickets",
    scene: "Rides light up when confidence is honest and brave.",
    data: ["New activity|I can try one part first|I must be perfect|Ferris wheel turns", "Made a mistake|Mistakes help me learn|I am bad at everything|Lights return", "Need help|Asking can make me stronger|I should hide it|Ticket glows", "Success moment|I worked for that|It was only luck|Carnival cheers"]
  }),
  g("Adaptability Airship", "Adaptability", "Adaptability means adjusting when plans, weather, or people change.", "pilot an airship by changing sails when the wind shifts.", "Changing-Wind Planning", "adaptabilityAirship", "🛩️", {
    theme: "Sky harbor with colorful sails and moving weather",
    scene: "The airship stays on course by changing strategy.",
    data: ["Rain starts|Move the picnic indoors|Complain all day|Sails turn", "Friend cancels|Make a new plan kindly|Say they ruined everything|Clouds part", "Tool breaks|Try another tool|Quit instantly|Engine hums", "Schedule changes|Ask what still works|Refuse to adjust|Sky opens"]
  }),
  g("Conversation Campfire", "Conversation", "Good conversation takes turns: ask, listen, share, and connect.", "keep the campfire glowing by balancing questions, listening, and sharing.", "Conversation Flame Balance", "conversationCampfire", "🔥", {
    theme: "Forest campfire circle with story sparks",
    scene: "The fire glows when everyone has room to speak.",
    data: ["Start talking|Ask an open question|Talk for ten minutes|Flame grows", "They answer|Listen and nod|Look away|Sparks rise", "Your turn|Share a related short thought|Take over the topic|Circle warms", "Awkward pause|Ask a follow-up|Mock the silence|Fire steadies"]
  }),
  g("Choice Compass Circus", "Decision Making", "Wise choices compare safety, kindness, and consequences before acting.", "spin the circus compass toward the choice with the best outcome.", "Consequence Compass", "choiceCompassCircus", "🎪", {
    theme: "Colorful circus ring with a spinning choice compass",
    scene: "The compass points true when choices are thoughtful.",
    data: ["Dare feels unsafe|Say no and step back|Do it to impress people|Compass steadies", "Tempted to copy|Do your own work|Copy quickly|Spotlight clears", "Angry reply|Wait before responding|Send it fast|Crowd calms", "Hard option|Choose safe and kind|Choose easy but harmful|Tent shines"]
  }),
  g("Memory Meadow", "Reflection", "Reflection helps us notice what worked, what hurt, and what to try next.", "place memory stones into learn, thank, repair, and repeat circles.", "Reflection Stone Sorting", "memoryMeadow", "🪨", {
    theme: "Quiet meadow with memory stones and soft morning light",
    scene: "Stones reveal lessons when reflected on with care.",
    data: ["Something went well|Notice what helped|Forget it instantly|Learn circle glows", "Someone helped|Say specific thanks|Assume they know|Thank circle glows", "You hurt someone|Plan a repair|Avoid thinking about it|Repair circle glows", "Good habit worked|Repeat it tomorrow|Start from zero|Path appears"]
  }),
  g("Self-Advocacy Summit", "Self-Advocacy", "Self-advocacy means explaining what you need clearly and respectfully.", "climb summit stations by naming the need, reason, and request.", "Need-Request Climb", "selfAdvocacySummit", "📣", {
    theme: "Snowy summit with flags for clear requests",
    scene: "Flags rise when needs become respectful requests.",
    data: ["Cannot see board|Say: I need to move closer|Stay silent and struggle|Flag rises", "Too much noise|Say: headphones help me focus|Yell at everyone|Wind slows", "Confused instructions|Ask for the first step again|Pretend to know|Trail clears", "Feeling overwhelmed|Ask for a short break|Run away|Summit shines"]
  }),
  g("Turn-Taking Wharf", "Turn Taking", "Turn-taking helps games, talks, and shared spaces feel fair.", "dock boats in order by noticing who has waited and who needs a turn.", "Turn Dock Queue", "turnTakingWharf", "⛵", {
    theme: "Harbor wharf with boats waiting for fair turns",
    scene: "Boats dock smoothly when turns are shared.",
    data: ["You went twice|Offer someone else a turn|Take a third turn|Boat docks", "Someone waiting|Invite them next|Pretend not to notice|Harbor brightens", "You feel impatient|Use wait words|Grab the item|Rope steadies", "Group choice|Rotate the picker|Let one person choose all|Bell rings"]
  }),
  g("Cooperation Kitchen", "Collaboration", "Collaboration works when people divide jobs and combine strengths.", "cook a team recipe by assigning prep, mix, cook, and serve roles.", "Recipe Role Coordination", "cooperationKitchen", "🍲", {
    theme: "Warm kitchen with bubbling pots and role cards",
    scene: "A recipe succeeds when helpers coordinate instead of crowding.",
    data: ["Many helpers|Give each person a role|Everyone grab at once|Prep begins", "One person stuck|Offer a specific assist|Take over without asking|Mixing smooths", "Timing matters|Wait for the next step|Rush the oven|Soup settles", "Meal finished|Thank each helper|Praise only yourself|Kitchen cheers"]
  }),
  g("Kindness Kite Festival", "Encouragement", "Encouragement lifts people by naming effort and giving hope.", "launch kites by choosing words that lift without pressure.", "Encouragement Wind Tuning", "kindnessKiteFestival", "🪁", {
    theme: "Windy festival field filled with colorful kites",
    scene: "Kites rise when encouragement feels honest and gentle.",
    data: ["Friend nervous|You practiced and can take one step|Do not mess up|Kite lifts", "Sibling learning|I see you trying again|This is easy|Tail steadies", "Teammate missed|Next play, we stay together|You ruined it|Wind warms", "Someone starts over|Trying again is brave|Finally|Sky fills"]
  }),
  g("Perspective Planet", "Perspective Taking", "Perspective taking asks what the world might look like from another person's side.", "rotate a planet to view the same moment from different sides.", "Perspective Orbit Shift", "perspectivePlanet", "🪐", {
    theme: "Small planet with orbiting viewpoints and star windows",
    scene: "New windows open when another viewpoint is considered.",
    data: ["Friend is quiet|They might feel left out|They are just boring|Orbit turns", "Adult says no|They may be thinking about safety|They never want fun|Moon appears", "Teammate rushes|They might feel worried about time|They are selfish|Stars align", "Someone snaps|They may be overwhelmed|They are always mean|Planet glows"]
  }),
  g("Conflict Compass Cove", "Conflict Resolution", "Conflict resolution uses calm words, shared facts, and a next-step plan.", "turn a compass through calm, facts, needs, and agreement points.", "Conflict Compass Points", "conflictCompassCove", "🧭", {
    theme: "Rocky seaside cove with a giant glowing compass",
    scene: "The compass points toward repair when conflict steps are chosen.",
    data: ["Calm|Take a breath before speaking|Start shouting|North lights", "Facts|Say what happened clearly|Add insults|East lights", "Needs|Say what each person needs|Ignore one side|South lights", "Agreement|Choose a next step together|Demand victory|West lights"]
  }),
  g("Care Carousel", "Compassion", "Compassion notices suffering and chooses a helpful gentle action.", "match care animals to people who need comfort, space, help, or hope.", "Compassion Carousel Match", "careCarousel", "🎠", {
    theme: "Soft carousel with glowing care animals",
    scene: "Carousel animals move toward the care each person needs.",
    data: ["Crying person|Offer comfort and ask what helps|Say stop crying|Carousel turns", "Overwhelmed person|Give space and quiet|Crowd them|Music softens", "Carrying too much|Offer real help|Just watch|Lantern glows", "Discouraged friend|Give hope and stay near|Say give up|Ride shines"]
  }),
  g("Community Caravan", "Community", "Community grows when people look beyond themselves and care for shared places.", "pack a caravan with choices that help neighbors and shared spaces.", "Community Supply Packing", "communityCaravan", "🐪", {
    theme: "Desert caravan with supply crates and neighbor tents",
    scene: "The caravan moves when supplies help the whole group.",
    data: ["Shared sidewalk|Pick up trash safely|Step over it forever|Crate packed", "New neighbor|Introduce yourself kindly|Ignore them|Tent opens", "Community event|Help set up chairs|Arrive only for prizes|Wagon rolls", "Shared problem|Ask how to help|Assume someone else will|Caravan shines"]
  }),
  g("Trust Telescope", "Trust", "Trust grows through honest actions repeated over time.", "align telescope lenses by choosing actions that make trust clearer.", "Trust Lens Alignment", "trustTelescope", "🔭", {
    theme: "Moonlit observatory with brass lenses and star charts",
    scene: "Stars sharpen when trustworthy choices line up.",
    data: ["Say you will call|Call when you said you would|Forget and pretend|Lens clears", "Borrowed item|Return it in good shape|Keep it hidden|Stars sharpen", "Private story|Keep the secret safe|Tell it for attention|Chart glows", "Made mistake|Admit it and repair|Cover it up|Telescope aligns"]
  }),
  g("Resilience Reef", "Resilience", "Resilience means recovering after rough waves and choosing the next helpful move.", "restore coral after setbacks by choosing recovery actions.", "Setback Recovery Reef", "resilienceReef", "🪸", {
    theme: "Underwater reef with coral, currents, and glowing bubbles",
    scene: "Coral returns to color when setbacks become recovery steps.",
    data: ["Plan failed|Try a smaller next step|Quit the whole goal|Coral brightens", "Felt embarrassed|Talk kindly to yourself|Replay it forever|Current slows", "Lost a game|Practice one skill|Throw the pieces|Fish return", "Hard day|Rest and try tomorrow|Decide nothing can change|Reef glows"]
  }),
  g("Creative Solutions Studio", "Creativity", "Creative problem solving uses imagination, testing, and flexible thinking.", "build idea prototypes by combining wild ideas with practical checks.", "Prototype Idea Studio", "creativeSolutionsStudio", "🎨", {
    theme: "Colorful studio with invention tables and idea sparks",
    scene: "Prototype machines glow when ideas are creative and useful.",
    data: ["Messy room|Make a labeled basket game|Pretend it is invisible|Prototype hums", "Boring wait|Create a quiet word challenge|Complain the whole time|Idea sparks", "Broken plan|Combine two smaller plans|Refuse all changes|Machine whirs", "Group stuck|Ask for three possible ideas|Say there is no solution|Studio shines"]
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

window.KIND_KINGDOM_GAMES = KIND_KINGDOM_GAMES;
