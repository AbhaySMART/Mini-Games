const params = new URLSearchParams(window.location.search);
const slug = params.get("game") || KIND_KINGDOM_GAMES[0].slug;
const game = KIND_KINGDOM_GAMES.find((item) => item.slug === slug) || KIND_KINGDOM_GAMES[0];
const root = document.querySelector("#game-root");
const state = { score: 0, streak: 0, time: 60, timer: null, level: 60, progress: 0 };
const completionState = { gameFinished: false, quizPassed: false, quizAnswers: {} };
let lessonSceneTimer = null;
let musicContext = null;
let musicTimer = null;
let musicGain = null;
const PIXEL_ASSETS = {
  wordForge: ["asset-forge", "asset-word", "asset-crown"],
  crownBalance: ["asset-crown", "asset-throne", "asset-word"],
  bridgeSequence: ["asset-bridge", "asset-stone", "asset-word"],
  signalFilter: ["asset-lantern", "asset-wave", "asset-moon"],
  emotionGarden: ["asset-flower", "asset-tree", "asset-wave"],
  timeDilation: ["asset-potion", "asset-clock", "asset-gem"],
  hiddenNeeds: ["asset-bread", "asset-market", "asset-word"],
  truthTimeline: ["asset-tower", "asset-shield", "asset-word"],
  memoryLink: ["asset-gem", "asset-cave", "asset-word"],
  reputationNetwork: ["asset-table", "asset-crown", "asset-word"],
  belongingMeters: ["asset-inn", "asset-table", "asset-flower"],
  fearCave: ["asset-cave", "asset-shield", "asset-lantern"],
  breathingDragon: ["asset-dragon", "asset-wave", "asset-potion"],
  teamRoles: ["asset-trophy", "asset-shield", "asset-crown"],
  equityFountain: ["asset-fountain", "asset-shield", "asset-word"],
  futurePath: ["asset-path", "asset-clock", "asset-bridge"],
  habitsHarbor: ["asset-harbor", "asset-bread", "asset-potion"],
  predictiveShield: ["asset-shield", "asset-clock", "asset-bridge"],
  questionClock: ["asset-clock", "asset-word", "asset-gem"],
  adaptivePeak: ["asset-peak", "asset-path", "asset-shield"],
  empathyWaves: ["asset-wave", "asset-cave", "asset-flower"],
  microManners: ["asset-market", "asset-bread", "asset-word"],
  solutionPortal: ["asset-portal", "asset-clock", "asset-path"],
  ecosystemNook: ["asset-tree", "asset-flower", "asset-harbor"],
  chatGate: ["asset-screen", "asset-word", "asset-shield"],
  relaxSequence: ["asset-moon", "asset-flower", "asset-clock"]
};

document.title = `${game.title} | Kind Kingdom`;
renderPage();
bindPage();

function renderPage() {
  root.innerHTML = `
    <section class="single-game ${game.mechanic} theme-${game.slug}">
      <a class="small-back" href="index.html">BACK</a>
      ${flowMapMarkup(game)}
      <h1 class="story-title">${game.title}</h1>
      <div class="storybook">
        ${speech("intro", `Before we set out on our noble quest, let's watch a quick clip about ${game.category.toLowerCase()}.`, "boy", "left")}
        ${lessonVideoMarkup(game)}
        ${speech("lesson", `Now you've seen it, ${game.lesson.toLowerCase()} Let's get ready for the mission.`, "girl", "right")}
        ${applicationsMarkup(game)}
        <div class="arrow-down" aria-hidden="true">&darr;</div>
        ${speech("mission", `Greetings, royal helper! Your mission is to ${game.mission.toLowerCase()}`, "boy", "left")}
        ${speech("success", `Ready, champion? Step into the royal challenge and practice ${game.category.toLowerCase()} until the kingdom shines.`, "girl", "right")}
      </div>
      <section class="play-card">
        <div class="play-head">
          <div>
            <h2>${game.icon} ${game.title}</h2>
            <p>${game.mechanicName}: ${game.lesson}</p>
          </div>
          <div class="stats">
            <span>Time: <b id="time">60</b>s</span>
            <span>Score: <b id="score">0</b></span>
            <span>Streak: <b id="streak">0</b></span>
          </div>
        </div>
        <div class="play-body">
          <div class="start-panel">
            <h3>${game.mechanicName}</h3>
            <p>${game.mission}</p>
            <div class="difficulty-row">
              <button type="button" class="active" data-level="60">Easy (60s)</button>
              <button type="button" data-level="50">Medium (50s)</button>
              <button type="button" data-level="40">Hard (40s)</button>
            </div>
            <button id="start" class="start-button" type="button">Begin Quest</button>
          </div>
          <div id="arena" class="arena"></div>
          <div id="feedback" class="feedback">Choose a level, then begin.</div>
        </div>
      </section>
      ${quizMarkup(game)}
      <section class="completion-card" data-completion-card>
        <h2>Complete ${game.title}</h2>
        <p>Pass the knowledge check to earn kindness points and unlock more games.</p>
        <button class="complete-button" type="button" data-complete-game>Complete Game</button>
        <div class="completion-status" data-completion-status>Pass the quiz first.</div>
      </section>
      <a class="big-back" href="index.html">BACK</a>
    </section>
  `;
}

function speech(kind, text, character, side) {
  const characterFile = character === "boy" ? "KK_Boy.png" : "KK_Girl.png";
  const characterMarkup = `
    <img
      class="story-character ${character}"
      src="assets/characters/${characterFile}"
      alt="${character === "boy" ? "Boy guide" : "Girl guide"}"
      onerror="this.classList.add('missing')"
    >
  `;
  return `
    <div class="speech-row ${side} ${character}">
      ${side === "left" ? characterMarkup : ""}
      <div class="speech ${kind}">
        ${text}
        <button class="audio-control" type="button" data-audio="${kind}" data-text="${escapeAttr(text)}" title="Generate narration: assets/audio/${game.slug}-${kind}.mp3">
          <span></span><span></span>
        </button>
      </div>
      ${side === "right" ? characterMarkup : ""}
    </div>
  `;
}

function bindPage() {
  document.querySelectorAll("[data-level]").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-level]").forEach((item) => item.classList.toggle("active", item === button));
      state.level = Number(button.dataset.level);
      state.time = state.level;
      sync();
    });
  });
  document.querySelector("#start").addEventListener("click", startGame);
  document.querySelectorAll("[data-audio]").forEach((button) => {
    button.addEventListener("click", () => generateAudioClip(button.dataset.text, button.dataset.audio));
  });
  document.querySelector("[data-video-control]").addEventListener("click", () => playLessonVideo(true));
  document.querySelector("[data-music-toggle]").addEventListener("click", toggleMusic);
  document.querySelector("[data-flow-toggle]").addEventListener("click", toggleFlowMap);
  document.querySelector("[data-flow-close]").addEventListener("click", closeFlowMap);
  document.querySelectorAll("[data-quiz-answer]").forEach((button) => {
    button.addEventListener("click", () => chooseQuizAnswer(button));
  });
  document.querySelector("[data-complete-game]").addEventListener("click", completeGame);
  playLessonVideo(false);
  syncCompletionStatus();
}

function lessonVideoMarkup(game) {
  const script = KIND_KINGDOM_VIDEO_SCRIPTS[game.slug];
  const labels = ["Notice", "Problem", "Kind Choice", "Lesson"];
  const symbols = ["!", "?", "+", "OK"];
  return `
    <div class="video-box has-generated-video">
      <video
        class="generated-lesson-video"
        src="assets/videos/${game.slug}.mp4"
        controls
        preload="auto"
        playsinline
        poster="assets/images/games/${game.slug}.jpg"
        onloadedmetadata="this.closest('.video-box').classList.add('has-generated-video')"
        onloadeddata="this.closest('.video-box').classList.add('has-generated-video')"
        onerror="this.closest('.video-box').classList.remove('has-generated-video')"
      ></video>
      <div class="lesson-scene-player" aria-label="${game.title} lesson video storyboard">
        ${script.narration.map((line, index) => `
          <section class="lesson-scene scene-${index + 1}${index === 0 ? " active" : ""}" data-scene="${index}">
            <img src="assets/images/games/${game.slug}.jpg" alt="">
            <div class="scene-art">
              <span class="scene-symbol">${symbols[index]}</span>
              <span class="scene-chip">${["Setting", "Problem", "Action", "Result"][index]}</span>
            </div>
            <div class="caption-card">
              <b>${labels[index]}</b>
              <span>${line}</span>
            </div>
          </section>
        `).join("")}
        <div class="lesson-progress"></div>
      </div>
      <button class="video-button" type="button" data-video-control>Replay Lesson</button>
      <button class="video-button music-toggle" type="button" data-music-toggle aria-pressed="true">Music On</button>
      <small>Generated lesson video for ${game.title}.</small>
    </div>
  `;
}

function applicationsMarkup(game) {
  const apps = realWorldApplications(game);
  return `
    <section class="applications-card" aria-label="${game.title} real world applications">
      <h2>Real World Applications</h2>
      <div class="application-grid">
        ${apps.map((item, index) => `
          <article class="application-item">
            <span>${index + 1}</span>
            <div>
              <b>${item.title}</b>
              <p>${item.text}</p>
            </div>
          </article>
        `).join("")}
      </div>
    </section>
  `;
}

function quizMarkup(game) {
  const questions = quizQuestions(game);
  return `
    <section class="quiz-card" data-quiz-card>
      <div class="quiz-head">
        <span>Knowledge Check</span>
        <h2>${game.icon} ${game.title}</h2>
        <p>Answer these to unlock the Complete button and earn kindness points.</p>
      </div>
      <div class="quiz-questions">
        ${questions.map((question, qIndex) => `
          <article class="quiz-question" data-quiz-question="${qIndex}">
            <h3>${qIndex + 1}. ${question.prompt}</h3>
            <div class="quiz-options">
              ${question.options.map((option, oIndex) => `
                <button type="button" data-quiz-answer data-question="${qIndex}" data-correct="${option.correct}" data-option="${oIndex}">
                  ${option.text}
                </button>
              `).join("")}
            </div>
            <p class="quiz-result" data-quiz-result="${qIndex}">Choose one answer.</p>
          </article>
        `).join("")}
      </div>
      <div class="quiz-summary" data-quiz-summary>Quiz not passed yet.</div>
    </section>
  `;
}

function realWorldApplications(game) {
  const bySkill = {
    "Kind Words": [
      ["Family moments", "Tell someone exactly what you noticed, like “You stayed patient while fixing dinner, and it helped everyone relax.”"],
      ["Neighborhood life", "Thank a cashier, coach, or neighbor with a specific compliment about their effort."]
    ],
    "Generosity": [
      ["Playing with friends", "Share the controller, ball, choice of game, or spotlight before one person controls the whole time."],
      ["Family routines", "Let someone else pick the music, seat, snack, or activity so everyone gets a turn."]
    ],
    "Accountability": [
      ["At home", "If you break, spill, lose, or forget something, say what happened and help repair it."],
      ["With friends", "After hurting someone’s feelings, apologize with action instead of only saying “sorry.”"]
    ],
    "Communication": [
      ["Conversations at home", "Listen for the feeling, reason, and need before jumping in with advice."],
      ["Texting or calling", "Ask one clarifying question when a message sounds confusing or emotional."]
    ],
    "Emotional Awareness": [
      ["Family moods", "Notice when stress, excitement, or sadness spreads through the room and respond gently."],
      ["Friend hangouts", "Name the feeling you notice before deciding whether to joke, help, wait, or listen."]
    ],
    "Empathy": [
      ["Out in public", "If someone looks overwhelmed in a line or waiting room, give space and patience."],
      ["At home", "Look at body language and tone before deciding how to support someone."]
    ],
    "Self-Control": [
      ["Waiting in lines", "Use calm breathing instead of complaining or rushing the people around you."],
      ["Screens and games", "Pause before tapping, sending, or reacting when you feel frustrated."]
    ],
    "Calm Choices": [
      ["Big feelings", "Use slow breathing before a feeling turns into yelling, slamming, or unsafe action."],
      ["Helping someone settle", "Keep your voice and pace steady when another person is upset."]
    ],
    "Service": [
      ["Chores and errands", "Notice what would actually help, like carrying bags, opening a door, or clearing space."],
      ["Community moments", "Offer useful help to a sibling, grandparent, neighbor, or teammate without waiting to be asked."]
    ],
    "Honesty": [
      ["When something goes wrong", "Tell the truth early about a mistake so trust can be repaired."],
      ["Online and offline", "Be honest about what you did, saw, or shared instead of covering it up."]
    ],
    "Gratitude": [
      ["Daily thanks", "Thank someone for the specific ride, meal, reminder, favor, or time they gave you."],
      ["Quiet reflection", "At the end of the day, connect gratitude to one real moment you remember."]
    ],
    "Respect": [
      ["Family decisions", "Let others speak about dinner, plans, or rules without interrupting or mocking."],
      ["Disagreements", "Use respectful words even when you think someone is wrong."]
    ],
    "Belonging": [
      ["Parks and parties", "Notice who is standing alone and invite them into the game or conversation."],
      ["Shared spaces", "Use small welcoming actions that help guests, relatives, or new neighbors feel comfortable."]
    ],
    "Courage": [
      ["Trying something new", "Name the fear and take one careful next step, like ordering food or joining a group."],
      ["Asking for help", "Speak up when you are lost, confused, hurt, or unsure instead of hiding it."]
    ],
    "Cooperation": [
      ["Family tasks", "Use everyone’s strengths when cleaning, cooking, packing, or planning an outing."],
      ["Games and sports", "Pay attention to what teammates need, not only your own move."]
    ],
    "Fairness": [
      ["Sharing food or supplies", "Notice that fair may mean different portions, tools, or help based on need."],
      ["Planning activities", "Choose options that let younger, older, tired, or nervous people participate too."]
    ],
    "Reliability": [
      ["Keeping promises", "Set reminders or prepare early so your future self can follow through."],
      ["Daily responsibilities", "Think about obstacles before they happen, like traffic, chores, batteries, or weather."]
    ],
    "Wellness": [
      ["Daily habits", "Balance sleep, food, water, and movement because they affect each other."],
      ["Busy days", "Notice whether your body needs rest, water, food, fresh air, or a screen break."]
    ],
    "Safety": [
      ["Before acting", "Predict what could happen before crossing, climbing, sharing info, or trying a dare."],
      ["Online and offline", "Use a safety check before taking risks or following someone else’s idea."]
    ],
    "Learning": [
      ["Everyday curiosity", "Ask deeper questions about cooking, weather, machines, nature, or how people feel."],
      ["Trying skills", "Use curiosity when learning recipes, sports, music, crafts, or tech."]
    ],
    "Growth Mindset": [
      ["After mistakes", "Change your strategy after burning food, losing a game, or missing a goal."],
      ["Hard goals", "Use setbacks as information for the next attempt instead of proof you cannot do it."]
    ],
    "Courtesy": [
      ["Public places", "Use small respectful actions like greetings, patience, and thanks."],
      ["Everyday moments", "Hold doors, wait your turn, clean your space, and make tiny choices that help others feel valued."]
    ],
    "Problem Solving": [
      ["Daily problems", "Compare solutions before fixing a schedule, mess, broken item, or disagreement."],
      ["Conflict repair", "Think through outcomes before choosing what to say or do next."]
    ],
    "Environmental Care": [
      ["Outside", "Notice cause and effect before picking plants, feeding animals, or leaving trash."],
      ["Shared places", "Protect parks, sidewalks, yards, beaches, and living things with small choices."]
    ],
    "Digital Citizenship": [
      ["Online chats", "Pause before posting and choose words that help, not hurt."],
      ["Texting", "Remember that messages, screenshots, jokes, and comments affect real people."]
    ],
    "Rest": [
      ["Bedtime", "Use a calming order of steps to help your body settle."],
      ["Stressful evenings", "Choose gentle routines instead of rushing into sleep."]
    ]
  };
  const fallback = [
    ["Everyday life", `Use ${game.category.toLowerCase()} when you ${game.mission.toLowerCase()}`],
    ["Home and community", game.lesson]
  ];
  return (bySkill[game.category] || fallback).map(([title, text]) => ({ title, text }));
}

function quizQuestions(game) {
  const apps = realWorldApplications(game);
  return [
    {
      prompt: "What is the main lesson this game is teaching?",
      options: shuffle([
        { text: game.lesson, correct: true },
        { text: "Rush through the challenge without thinking.", correct: false },
        { text: "Ignore how other people feel.", correct: false }
      ])
    },
    {
      prompt: "Which real-world moment is a good place to use this skill?",
      options: shuffle([
        { text: `${apps[0].title}: ${apps[0].text}`, correct: true },
        { text: "Only inside this computer game.", correct: false },
        { text: "Only when there are no other people around.", correct: false }
      ])
    },
    {
      prompt: "What should you practice in the mini game?",
      options: shuffle([
        { text: game.mission, correct: true },
        { text: "Click random choices and hope they work.", correct: false },
        { text: "Skip the lesson and move on.", correct: false }
      ])
    }
  ];
}

function chooseQuizAnswer(button) {
  const questionIndex = button.dataset.question;
  const question = document.querySelector(`[data-quiz-question="${questionIndex}"]`);
  question.querySelectorAll("[data-quiz-answer]").forEach((item) => {
    item.classList.remove("selected", "correct", "wrong");
  });
  const isCorrect = button.dataset.correct === "true";
  button.classList.add("selected", isCorrect ? "correct" : "wrong");
  completionState.quizAnswers[questionIndex] = isCorrect;
  const result = document.querySelector(`[data-quiz-result="${questionIndex}"]`);
  result.textContent = isCorrect ? "Correct." : "Try again. Choose the answer that matches the game lesson.";
  result.classList.toggle("correct", isCorrect);
  result.classList.toggle("wrong", !isCorrect);
  updateQuizStatus();
}

function updateQuizStatus() {
  const total = quizQuestions(game).length;
  const correct = Object.values(completionState.quizAnswers).filter(Boolean).length;
  completionState.quizPassed = correct === total;
  const summary = document.querySelector("[data-quiz-summary]");
  summary.textContent = completionState.quizPassed
    ? "Quiz passed. You can complete the game now."
    : `Quiz progress: ${correct}/${total} correct.`;
  summary.classList.toggle("passed", completionState.quizPassed);
  syncCompletionStatus();
}

function completeGame() {
  if (!completionState.quizPassed) {
    syncCompletionStatus("Pass the knowledge check before completing.");
    return;
  }
  const result = awardKindnessPoints();
  syncCompletionStatus(result.awarded
    ? `Completed. You earned 25 kindness points and unlocked more of the kingdom. Total: ${result.points}.`
    : `Already completed. Kindness points: ${result.points}.`);
}

function syncCompletionStatus(message) {
  const status = document.querySelector("[data-completion-status]");
  if (!status) return;
  status.textContent = message || (
    completionState.quizPassed
      ? "Quiz passed. Ready to complete."
      : "Pass the quiz first."
  );
  const button = document.querySelector("[data-complete-game]");
  if (button) {
    button.disabled = !completionState.quizPassed;
  }
}

function flowMapMarkup(game) {
  const script = KIND_KINGDOM_VIDEO_SCRIPTS[game.slug] || { narration: [], scenes: [] };
  const apps = realWorldApplications(game);
  const steps = [
    {
      label: "Hook",
      title: "Enter the Lesson",
      text: script.narration[0] || `Meet the challenge in ${game.title}.`
    },
    {
      label: "Problem",
      title: "Notice What Is Hard",
      text: script.scenes[1] || `Look for the choice connected to ${game.category.toLowerCase()}.`
    },
    {
      label: "Skill",
      title: game.mechanicName,
      text: game.mission
    },
    {
      label: "Real Life",
      title: apps[0].title,
      text: apps[0].text
    },
    {
      label: "Real Life",
      title: apps[1].title,
      text: apps[1].text
    },
    {
      label: "Practice",
      title: "Try the Mini Game",
      text: `Use the ${game.mechanicName.toLowerCase()} mechanic to make kind choices yourself.`
    },
    {
      label: "Check",
      title: "Knowledge Check",
      text: "Answer the quiz to show you understand the lesson."
    },
    {
      label: "Complete",
      title: "Earn Kindness Points",
      text: "Press Complete after passing the knowledge check."
    }
  ];
  return `
    <aside class="flow-drawer" data-flow-drawer aria-label="${game.title} lesson flow">
      <button class="flow-tab" type="button" data-flow-toggle aria-expanded="false">
        <span>Flow</span>
      </button>
      <div class="flow-panel">
        <button class="flow-close" type="button" data-flow-close aria-label="Close lesson flow">×</button>
        <div class="flow-kicker">Storyboard Flow</div>
        <h2>${game.title}</h2>
        <p class="flow-summary">${game.lesson}</p>
        <div class="flow-steps">
          ${steps.map((step, index) => `
            <article class="flow-step">
              <span class="flow-dot">${index + 1}</span>
              <div>
                <small>${step.label}</small>
                <h3>${step.title}</h3>
                <p>${step.text}</p>
              </div>
            </article>
          `).join("")}
        </div>
      </div>
    </aside>
  `;
}

function toggleFlowMap(event) {
  const drawer = document.querySelector("[data-flow-drawer]");
  const willOpen = !drawer.classList.contains("open");
  drawer.classList.toggle("open", willOpen);
  event.currentTarget.setAttribute("aria-expanded", String(willOpen));
}

function closeFlowMap() {
  const drawer = document.querySelector("[data-flow-drawer]");
  drawer.classList.remove("open");
  document.querySelector("[data-flow-toggle]").setAttribute("aria-expanded", "false");
}

function playLessonVideo(withMusic) {
  const generatedVideo = document.querySelector(".video-box.has-generated-video .generated-lesson-video");
  if (generatedVideo) {
    generatedVideo.currentTime = 0;
    generatedVideo.play();
    if (withMusic && document.querySelector("[data-music-toggle]")?.getAttribute("aria-pressed") !== "false") {
      startLessonMusic();
    }
    return;
  }
  const player = document.querySelector(".lesson-scene-player");
  if (!player) return;
  const scenes = [...player.querySelectorAll(".lesson-scene")];
  const progress = player.querySelector(".lesson-progress");
  let index = 0;
  clearInterval(lessonSceneTimer);
  scenes.forEach((scene, sceneIndex) => scene.classList.toggle("active", sceneIndex === 0));
  player.classList.remove("is-playing");
  void player.offsetWidth;
  player.classList.add("is-playing");
  if (progress) {
    progress.classList.remove("run");
    void progress.offsetWidth;
    progress.classList.add("run");
  }
  if (withMusic && document.querySelector("[data-music-toggle]")?.getAttribute("aria-pressed") !== "false") {
    startLessonMusic();
  }
  lessonSceneTimer = window.setInterval(() => {
    index += 1;
    if (index >= scenes.length) {
      clearInterval(lessonSceneTimer);
      return;
    }
    scenes.forEach((scene, sceneIndex) => scene.classList.toggle("active", sceneIndex === index));
  }, 4000);
}

function toggleMusic(event) {
  const button = event.currentTarget;
  const isOn = button.getAttribute("aria-pressed") !== "false";
  button.setAttribute("aria-pressed", String(!isOn));
  button.textContent = isOn ? "Music Off" : "Music On";
  if (isOn) stopLessonMusic();
  else startLessonMusic();
}

function startLessonMusic() {
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  if (!AudioContext) return;
  stopLessonMusic();
  musicContext = new AudioContext();
  musicGain = musicContext.createGain();
  musicGain.gain.value = 0.035;
  musicGain.connect(musicContext.destination);
  const notes = [523.25, 659.25, 783.99, 659.25, 587.33, 698.46, 880, 698.46];
  let step = 0;
  const playNote = () => {
    if (!musicContext || !musicGain) return;
    const oscillator = musicContext.createOscillator();
    const noteGain = musicContext.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = notes[step % notes.length];
    noteGain.gain.setValueAtTime(0.0001, musicContext.currentTime);
    noteGain.gain.exponentialRampToValueAtTime(0.35, musicContext.currentTime + 0.03);
    noteGain.gain.exponentialRampToValueAtTime(0.0001, musicContext.currentTime + 0.42);
    oscillator.connect(noteGain);
    noteGain.connect(musicGain);
    oscillator.start();
    oscillator.stop(musicContext.currentTime + 0.45);
    step += 1;
  };
  playNote();
  musicTimer = window.setInterval(playNote, 480);
  window.setTimeout(stopLessonMusic, 16000);
}

function stopLessonMusic() {
  if (musicTimer) clearInterval(musicTimer);
  musicTimer = null;
  if (musicContext) musicContext.close();
  musicContext = null;
  musicGain = null;
}

function generateAudioClip(text, role) {
  if (!("speechSynthesis" in window)) {
    feedback("This browser does not support generated narration.");
    return;
  }
  window.speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = role === "mission" ? 0.88 : 0.94;
  utterance.pitch = role === "success" ? 1.18 : 1;
  window.speechSynthesis.speak(utterance);
  feedback(`Generated ${role} narration in the browser.`);
}

function startGame() {
  clearInterval(state.timer);
  state.score = 0;
  state.streak = 0;
  state.progress = 0;
  state.time = state.level;
  completionState.gameFinished = false;
  sync();
  syncCompletionStatus();
  state.timer = setInterval(() => {
    state.time -= 1;
    sync();
    if (state.time <= 0) {
      clearInterval(state.timer);
      feedback("Time is up. Try again with what you learned.");
    }
  }, 1000);
  renderMechanic();
}

function renderMechanic() {
  const arena = document.querySelector("#arena");
  completionState.gameFinished = false;
  syncCompletionStatus();
  const data = game.data.map(parseDatum);
  const renderers = {
    wordForge: renderWordForge,
    crownBalance: renderCrownBalance,
    bridgeSequence: renderBridgeSequence,
    signalFilter: renderSignalFilter,
    emotionGarden: renderEmotionGarden,
    timeDilation: renderTimeDilation,
    hiddenNeeds: renderHiddenNeeds,
    truthTimeline: renderTruthTimeline,
    memoryLink: renderMemoryLink,
    reputationNetwork: renderReputationNetwork,
    belongingMeters: renderBelongingMeters,
    fearCave: renderFearCave,
    breathingDragon: renderBreathingDragon,
    teamRoles: renderTeamRoles,
    equityFountain: renderEquityFountain,
    futurePath: renderFuturePath,
    habitsHarbor: renderHabitsHarbor,
    predictiveShield: renderPredictiveShield,
    questionClock: renderQuestionClock,
    adaptivePeak: renderAdaptivePeak,
    empathyWaves: renderEmpathyWaves,
    microManners: renderMicroManners,
    solutionPortal: renderSolutionPortal,
    ecosystemNook: renderEcosystemNook,
    chatGate: renderChatGate,
    relaxSequence: renderRelaxSequence
  };
  (renderers[game.mechanic] || renderCollect)(arena, data);
}

function renderWordForge(arena, data) {
  const scenarios = [
    {
      icon: "artist",
      emoji: "🧑‍🎨",
      text: "Lina spent extra time adding details to her art project, even after she made a mistake and had to redo part of it.",
      best: {
        effort: "you kept improving your artwork even after it got difficult",
        trait: "that shows perseverance",
        impact: "and it made your final project feel really thoughtful"
      }
    },
    {
      icon: "music",
      emoji: "🎻",
      text: "Marcus practiced his music part many times so his group could perform smoothly together.",
      best: {
        effort: "you practiced your part so the whole group sounded better",
        trait: "that shows responsibility",
        impact: "and it helped everyone feel more prepared"
      }
    },
    {
      icon: "friend",
      emoji: "🤝",
      text: "Ava invited a new student to join her group instead of letting them sit alone.",
      best: {
        effort: "you noticed someone was left out and invited them in",
        trait: "that shows kindness",
        impact: "and it helped them feel included"
      }
    },
    {
      icon: "book",
      emoji: "📚",
      text: "Noah helped a classmate understand a confusing assignment without making them feel embarrassed.",
      best: {
        effort: "you explained the assignment patiently",
        trait: "that shows empathy",
        impact: "and it made learning feel safer for them"
      }
    },
    {
      icon: "clean",
      emoji: "🧹",
      text: "Maya cleaned up supplies after the activity, even though nobody asked her to do it.",
      best: {
        effort: "you helped clean up without being asked",
        trait: "that shows initiative",
        impact: "and it made the room easier for everyone to use"
      }
    }
  ];
  const distractors = {
    effort: ["you did something", "you were there", "you finished fast", "you looked nice today", "you got lucky"],
    trait: ["that was cool", "that was random", "that shows you are better than everyone", "that was fine", "that was okay"],
    impact: ["and everyone should copy you", "and that was not a big deal", "and I guess it worked", "and now you are the best", "and it was just normal"]
  };
  const cc = {
    current: 0,
    score: 0,
    gems: 0,
    selected: { effort: null, trait: null, impact: null },
    forgedThisRound: false
  };

  arena.innerHTML = `
    <div class="compliment-castle-game">
      <div class="cc-sky"></div>
      <div class="cc-castle-bg"></div>
      <section class="cc-screen" data-cc-start>
        <div class="cc-start-card">
          <div class="cc-big-icon">🏰✨</div>
          <h2>Compliment Castle</h2>
          <p>Welcome to the Royal Forge of Words. Create compliments that are specific, sincere, and connected to real effort.</p>
          <p>Build each compliment with <strong>Effort + Trait + Impact</strong>.</p>
          <button class="cc-btn" type="button" data-cc-enter>Enter the Castle</button>
        </div>
      </section>
      <section class="cc-screen hidden" data-cc-end>
        <div class="cc-start-card">
          <div class="cc-big-icon">👑</div>
          <h2>Castle Restored!</h2>
          <p data-cc-final></p>
          <button class="cc-btn" type="button" data-cc-restart>Play Again</button>
        </div>
      </section>
      <div class="cc-content">
        <div class="cc-top-bar">
          <div class="cc-title-box">
            <h2>🏰 Compliment Castle</h2>
            <p>Forge sincere compliments with Effort, Trait, and Impact.</p>
          </div>
          <div class="cc-stats">
            <div class="cc-pill">Score: <span data-cc-score>0</span></div>
            <div class="cc-pill">Round: <span data-cc-round>1</span>/5</div>
            <div class="cc-pill">Gems: <span data-cc-gems>0</span> 💎</div>
          </div>
        </div>
        <div class="cc-main-grid">
          <div class="cc-panel cc-scenario-card">
            <div>
              <div class="cc-character" data-cc-character>🧑‍🎨</div>
              <div class="cc-scenario-text" data-cc-scenario></div>
            </div>
            <div class="cc-lesson-box">
              A weak compliment is too general, like “good job.” A strong compliment notices what the person actually did and why it mattered.
            </div>
          </div>
          <div class="cc-panel">
            <h2 class="cc-forge-title">🔥 Royal Word Forge</h2>
            <div class="cc-forge">
              ${ccWordGroup("effort", "1. Choose the effort you noticed")}
              ${ccWordGroup("trait", "2. Choose the kind trait it shows")}
              ${ccWordGroup("impact", "3. Choose the impact it had")}
            </div>
            <div class="cc-output" data-cc-output>Your compliment will appear here.</div>
            <div class="cc-meter-wrap">
              <div class="cc-meter-label"><span>Sincerity Meter</span><span data-cc-meter-text>0%</span></div>
              <div class="cc-meter"><div data-cc-meter-fill></div></div>
            </div>
            <div class="cc-feedback" data-cc-feedback>Select one piece from each category to forge your compliment.</div>
            <div class="cc-buttons">
              <button class="cc-btn" type="button" data-cc-forge>Forge Compliment</button>
              <button class="cc-btn secondary" type="button" data-cc-next>Next Challenge</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const q = (selector) => arena.querySelector(selector);
  const qa = (selector) => [...arena.querySelectorAll(selector)];

  q("[data-cc-enter]").onclick = () => {
    q("[data-cc-start]").classList.add("hidden");
    loadRound();
  };
  q("[data-cc-restart]").onclick = () => {
    cc.current = 0;
    cc.score = 0;
    cc.gems = 0;
    cc.selected = { effort: null, trait: null, impact: null };
    q("[data-cc-end]").classList.add("hidden");
    loadRound();
  };
  q("[data-cc-forge]").onclick = forgeCompliment;
  q("[data-cc-next]").onclick = nextRound;

  loadRound();

  function ccWordGroup(type, title) {
    return `
      <div class="cc-word-group">
        <h3>${title}</h3>
        <div class="cc-options" data-cc-options="${type}"></div>
      </div>
    `;
  }

  function makeOptions(type, correctText) {
    const container = q(`[data-cc-options="${type}"]`);
    const choices = shuffle([correctText, ...shuffle(distractors[type]).slice(0, 3)]);
    container.innerHTML = choices.map((choice) => `<button class="cc-option" type="button">${choice}</button>`).join("");
    [...container.children].forEach((button) => {
      button.onclick = () => {
        cc.selected[type] = button.textContent;
        [...container.children].forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
        updatePreview();
      };
    });
  }

  function updatePreview() {
    if (cc.selected.effort || cc.selected.trait || cc.selected.impact) {
      q("[data-cc-output]").textContent = `I noticed that ${cc.selected.effort || "___"}, ${cc.selected.trait || "___"}, ${cc.selected.impact || "___. "}`;
    }
    const percent = calculateSincerity(false);
    q("[data-cc-meter-fill]").style.width = `${percent}%`;
    q("[data-cc-meter-text]").textContent = `${percent}%`;
  }

  function calculateSincerity(showFeedback) {
    const s = scenarios[cc.current];
    let points = 0;
    if (cc.selected.effort === s.best.effort) points += 34;
    if (cc.selected.trait === s.best.trait) points += 33;
    if (cc.selected.impact === s.best.impact) points += 33;
    if (showFeedback) {
      if (points === 100) q("[data-cc-feedback]").textContent = "Excellent forge! Your compliment is specific, sincere, and shows why the action mattered.";
      else if (points >= 67) q("[data-cc-feedback]").textContent = "Strong compliment! One part could be more specific or connected to the person’s real effort.";
      else if (points >= 34) q("[data-cc-feedback]").textContent = "Good start, but the compliment needs more detail. Notice the effort and explain why it mattered.";
      else q("[data-cc-feedback]").textContent = "This sounds too general or not sincere yet. Try choosing words that notice real effort.";
    }
    return points;
  }

  function forgeCompliment() {
    if (!cc.selected.effort || !cc.selected.trait || !cc.selected.impact) {
      q("[data-cc-feedback]").textContent = "Choose one effort, one trait, and one impact before forging.";
      return;
    }
    if (cc.forgedThisRound) {
      q("[data-cc-feedback]").textContent = "You already forged this compliment. Move to the next challenge.";
      return;
    }
    const percent = calculateSincerity(true);
    cc.score += percent;
    state.score += Math.round(percent / 10);
    if (percent === 100) {
      cc.gems += 3;
      createSparkles("💎");
    } else if (percent >= 67) {
      cc.gems += 2;
      createSparkles("✨");
    } else if (percent >= 34) {
      cc.gems += 1;
      createSparkles("⭐");
    }
    cc.forgedThisRound = true;
    updateStats();
    sync();
  }

  function nextRound() {
    if (!cc.forgedThisRound) {
      q("[data-cc-feedback]").textContent = "Forge your compliment first, then continue.";
      return;
    }
    cc.current += 1;
    if (cc.current >= scenarios.length) endGame();
    else loadRound();
  }

  function loadRound() {
    const s = scenarios[cc.current];
    cc.selected = { effort: null, trait: null, impact: null };
    cc.forgedThisRound = false;
    q("[data-cc-character]").textContent = s.emoji;
    q("[data-cc-scenario]").textContent = s.text;
    q("[data-cc-output]").textContent = "Your compliment will appear here.";
    q("[data-cc-feedback]").textContent = "Select one piece from each category to forge your compliment.";
    q("[data-cc-meter-fill]").style.width = "0%";
    q("[data-cc-meter-text]").textContent = "0%";
    makeOptions("effort", s.best.effort);
    makeOptions("trait", s.best.trait);
    makeOptions("impact", s.best.impact);
    updateStats();
  }

  function updateStats() {
    q("[data-cc-score]").textContent = cc.score;
    q("[data-cc-round]").textContent = Math.min(cc.current + 1, scenarios.length);
    q("[data-cc-gems]").textContent = cc.gems;
  }

  function endGame() {
    const average = Math.round(cc.score / scenarios.length);
    const message = average >= 90
      ? `Amazing work! Your average sincerity score was ${average}%. You are a Royal Compliment Master because your compliments noticed effort, character, and impact.`
      : average >= 70
        ? `Great job! Your average sincerity score was ${average}%. You are building strong compliment skills. Keep making your compliments more specific.`
        : `Good effort! Your average sincerity score was ${average}%. Remember, the best compliments explain what someone did and why it mattered.`;
    q("[data-cc-final]").textContent = message;
    q("[data-cc-end]").classList.remove("hidden");
    finish();
  }

  function createSparkles(symbol) {
    for (let i = 0; i < 15; i += 1) {
      const sparkle = document.createElement("div");
      sparkle.className = "cc-sparkle";
      sparkle.textContent = symbol;
      sparkle.style.left = `${Math.random() * 90 + 5}%`;
      sparkle.style.top = `${Math.random() * 65 + 15}%`;
      q(".compliment-castle-game").append(sparkle);
      window.setTimeout(() => sparkle.remove(), 850);
    }
  }
}

function renderCrownBalance(arena) {
  clearInterval(state.timer);
  state.timer = null;

  const rounds = [
    {
      mission: "A group is decorating the castle hall. Everyone needs a chance to help.",
      goal: "Keep each player involved and avoid letting one person hold the crown too long."
    },
    {
      mission: "The royal team is choosing a game to play. Make sure quiet voices get included too.",
      goal: "Give the crown to characters who have had fewer turns."
    },
    {
      mission: "The kingdom is building a parade float. Share leadership so the whole team feels valued.",
      goal: "Balance the crown between all teammates before time runs out."
    }
  ];
  const players = [
    { name: "Lina", icon: "🧑‍🎨", need: "Wants a chance to share a creative idea.", turns: 0, holdTime: 0 },
    { name: "Marcus", icon: "🎻", need: "Has been waiting quietly for a turn.", turns: 0, holdTime: 0 },
    { name: "Ava", icon: "🧩", need: "Likes helping but sometimes takes over.", turns: 0, holdTime: 0 },
    { name: "Noah", icon: "📚", need: "Needs encouragement to speak up.", turns: 0, holdTime: 0 }
  ];
  let currentRound = 0;
  let activePlayer = 0;
  let inclusion = 100;
  let localScore = 0;
  let timeLeft = 45;
  let timer = null;
  let gameRunning = false;

  arena.innerHTML = `
    <div class="share-crown-game">
      <div class="sc-bg"></div>
      <div class="sc-floor"></div>
      <section class="sc-screen" data-sc-start>
        <div class="sc-screen-card">
          <div class="sc-big">👑</div>
          <h2>Share The Crown</h2>
          <p>The magical crown gives someone the spotlight, but if one person keeps it too long, the kingdom feels left out.</p>
          <p>Pass the crown fairly, include everyone, and complete each royal mission.</p>
          <button class="sc-btn gold" type="button" data-sc-start-button>Start Sharing</button>
        </div>
      </section>
      <section class="sc-screen hidden" data-sc-end>
        <div class="sc-screen-card">
          <div class="sc-big">🏆</div>
          <h2 data-sc-end-title>Tournament Complete!</h2>
          <p data-sc-end-message></p>
          <button class="sc-btn gold" type="button" data-sc-restart>Play Again</button>
        </div>
      </section>
      <div class="sc-content">
        <div class="sc-top">
          <div class="sc-title-card">
            <h2>👑 Share The Crown</h2>
            <p>A real-time game about sharing, taking turns, and including everyone.</p>
          </div>
          <div class="sc-stats">
            <div class="sc-pill">Round: <span data-sc-round>1</span>/3</div>
            <div class="sc-pill">Score: <span data-sc-score>0</span></div>
            <div class="sc-pill">Time: <span data-sc-time>45</span>s</div>
          </div>
        </div>
        <div class="sc-arena">
          <div class="sc-panel sc-throne-room" data-sc-throne-room></div>
          <div class="sc-panel sc-control-panel">
            <div class="sc-mission">
              <div class="sc-mission-title">Royal Mission</div>
              <div data-sc-mission></div>
            </div>
            <div>
              <div class="sc-meter-label">
                <span>Inclusion Meter</span>
                <span data-sc-inclusion-text>100%</span>
              </div>
              <div class="sc-meter"><div data-sc-inclusion-fill></div></div>
            </div>
            <div class="sc-feedback" data-sc-feedback>Click a character to pass them the crown. Try not to let anyone hold it too long.</div>
            <div class="sc-log" data-sc-log>Royal log will appear here.</div>
            <div class="sc-btn-row">
              <button class="sc-btn" type="button" data-sc-neediest>Pass to Someone Left Out</button>
              <button class="sc-btn gold" type="button" data-sc-complete>Finish Round</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const q = (selector) => arena.querySelector(selector);

  q("[data-sc-start-button]").onclick = startCrownGame;
  q("[data-sc-restart]").onclick = restartCrownGame;
  q("[data-sc-neediest]").onclick = passToNeediest;
  q("[data-sc-complete]").onclick = completeRound;
  renderPlayers();
  updateUI();

  function startCrownGame() {
    q("[data-sc-start]").classList.add("hidden");
    resetRound();
    gameRunning = true;
    clearInterval(timer);
    timer = setInterval(gameLoop, 500);
  }

  function restartCrownGame() {
    q("[data-sc-end]").classList.add("hidden");
    currentRound = 0;
    localScore = 0;
    state.score = 0;
    state.streak = 0;
    resetRound();
    gameRunning = true;
    clearInterval(timer);
    timer = setInterval(gameLoop, 500);
    sync();
  }

  function resetRound() {
    players.forEach((player) => {
      player.turns = 0;
      player.holdTime = 0;
    });
    activePlayer = Math.floor(Math.random() * players.length);
    players[activePlayer].turns = 1;
    inclusion = 100;
    timeLeft = 45;
    q("[data-sc-mission]").textContent = rounds[currentRound].mission;
    q("[data-sc-feedback]").textContent = rounds[currentRound].goal;
    q("[data-sc-log]").innerHTML = "The crown has entered the room. Share it fairly!";
    renderPlayers();
    updateUI();
  }

  function renderPlayers() {
    const throneRoom = q("[data-sc-throne-room]");
    throneRoom.innerHTML = players.map((player, index) => `
      <button class="sc-player-card ${index === activePlayer ? "active" : ""}" type="button" data-sc-player="${index}">
        <span class="sc-crown">👑</span>
        <span class="sc-avatar">${player.icon}</span>
        <span class="sc-name">${player.name}</span>
        <span class="sc-need">${player.need}</span>
        <span class="sc-turn-bar"><span style="width:${Math.min(player.holdTime * 14, 100)}%"></span></span>
      </button>
    `).join("");
    throneRoom.querySelectorAll("[data-sc-player]").forEach((button) => {
      button.onclick = () => passCrown(Number(button.dataset.scPlayer));
    });
  }

  function passCrown(index) {
    if (!gameRunning) return;
    if (index === activePlayer) {
      q("[data-sc-feedback]").textContent = `${players[index].name} already has the crown. Share it with someone else.`;
      inclusion -= 4;
      updateUI();
      return;
    }

    const newPlayer = players[index];
    activePlayer = index;
    newPlayer.turns += 1;
    newPlayer.holdTime = 0;

    const leastTurns = Math.min(...players.map((player) => player.turns));
    if (newPlayer.turns === leastTurns + 1 || newPlayer.turns === leastTurns) {
      inclusion += 6;
      localScore += 8;
      state.score = localScore;
      state.streak += 1;
      q("[data-sc-feedback]").textContent = `Great sharing! ${newPlayer.name} got a fair chance to join in.`;
      addLog(`✅ The crown was shared with ${newPlayer.name}.`);
      spark("✨");
    } else {
      inclusion -= 5;
      state.streak = 0;
      q("[data-sc-feedback]").textContent = `${newPlayer.name} has already had several turns. Try including someone quieter next.`;
      addLog(`⚠️ ${newPlayer.name} got another turn, but someone else may need one more.`);
    }

    inclusion = clamp(inclusion, 0, 100);
    renderPlayers();
    updateUI();
    sync();
  }

  function passToNeediest() {
    if (!gameRunning) return;
    let neediestIndex = 0;
    for (let i = 1; i < players.length; i += 1) {
      if (players[i].turns < players[neediestIndex].turns) neediestIndex = i;
    }
    if (neediestIndex === activePlayer) {
      neediestIndex = players
        .map((player, i) => ({ turns: player.turns, i }))
        .filter((item) => item.i !== activePlayer)
        .sort((a, b) => a.turns - b.turns)[0].i;
    }
    passCrown(neediestIndex);
  }

  function gameLoop() {
    if (!gameRunning) return;
    if (!document.body.contains(arena)) {
      clearInterval(timer);
      return;
    }
    timeLeft -= 0.5;
    players[activePlayer].holdTime += 0.5;

    const hold = players[activePlayer].holdTime;
    if (hold > 4 && hold <= 7) {
      inclusion -= 1.3;
      q("[data-sc-feedback]").textContent = `${players[activePlayer].name} has held the crown for a while. It may be time to share.`;
    } else if (hold > 7) {
      inclusion -= 2.5;
      q("[data-sc-feedback]").textContent = "The crown is losing magic because one person is holding it too long. Pass it now!";
    }

    const turnSpread = Math.max(...players.map((player) => player.turns)) - Math.min(...players.map((player) => player.turns));
    if (turnSpread <= 1 && hold < 5) inclusion += 0.4;
    inclusion = clamp(inclusion, 0, 100);

    if (timeLeft <= 0 || inclusion <= 0) completeRound();
    renderPlayers();
    updateUI();
  }

  function completeRound() {
    if (!gameRunning) return;
    const turnSpread = Math.max(...players.map((player) => player.turns)) - Math.min(...players.map((player) => player.turns));
    let bonus = Math.round(inclusion);

    if (turnSpread <= 1) {
      bonus += 35;
      q("[data-sc-feedback]").textContent = "Excellent teamwork! Everyone had a balanced chance to participate.";
      addLog("🏆 Bonus earned: Everyone was included fairly.");
      spark("👑");
    } else if (turnSpread <= 2) {
      bonus += 15;
      q("[data-sc-feedback]").textContent = "Good round! Most people were included, but one person could have had more chances.";
      addLog("⭐ Good sharing, but the balance could be stronger.");
    } else {
      bonus -= 10;
      q("[data-sc-feedback]").textContent = "Some players were left out. Sharing means noticing who has not had a turn yet.";
      addLog("💡 Lesson: fairness means watching who needs a chance.");
    }

    localScore += Math.max(0, bonus);
    state.score = localScore;
    currentRound += 1;

    if (currentRound >= rounds.length) endCrownGame();
    else resetRound();

    updateUI();
    sync();
  }

  function endCrownGame() {
    gameRunning = false;
    clearInterval(timer);

    let title = "Tournament Complete!";
    let message = "";
    if (localScore >= 360) {
      title = "Royal Sharing Champion!";
      message = `Amazing work! Your score was ${localScore}. You shared the crown fairly, noticed who needed a turn, and helped everyone feel included.`;
    } else if (localScore >= 250) {
      title = "Kindness Leader!";
      message = `Great job! Your score was ${localScore}. You showed strong sharing skills. Keep watching for quieter teammates too.`;
    } else {
      title = "Sharing Apprentice!";
      message = `Your score was ${localScore}. Keep practicing. A strong teammate shares turns and notices when someone feels left out.`;
    }

    q("[data-sc-end-title]").textContent = title;
    q("[data-sc-end-message]").textContent = message;
    q("[data-sc-end]").classList.remove("hidden");
    finish();
  }

  function updateUI() {
    q("[data-sc-inclusion-fill]").style.width = `${inclusion}%`;
    q("[data-sc-inclusion-text]").textContent = `${Math.round(inclusion)}%`;
    q("[data-sc-round]").textContent = Math.min(currentRound + 1, rounds.length);
    q("[data-sc-score]").textContent = localScore;
    q("[data-sc-time]").textContent = Math.max(0, Math.ceil(timeLeft));
    state.time = Math.max(0, Math.ceil(timeLeft));
  }

  function addLog(text) {
    q("[data-sc-log]").innerHTML = `${text}<br>${q("[data-sc-log]").innerHTML}`;
  }

  function clamp(num, min, max) {
    return Math.max(min, Math.min(max, num));
  }

  function spark(symbol) {
    for (let i = 0; i < 14; i += 1) {
      const sparkle = document.createElement("div");
      sparkle.className = "sc-spark";
      sparkle.textContent = symbol;
      sparkle.style.left = `${Math.random() * 85 + 8}%`;
      sparkle.style.top = `${Math.random() * 60 + 18}%`;
      q(".share-crown-game").append(sparkle);
      setTimeout(() => sparkle.remove(), 850);
    }
  }
}

function renderBridgeSequence(arena) {
  clearInterval(state.timer);
  state.timer = null;

  const correctOrder = [
    "Admit what happened",
    "Take responsibility",
    "Explain without excuses",
    "Make it right",
    "Promise better action"
  ];
  const scenarios = [
    {
      text: "You borrowed your friend's colored pencils and forgot to return them. Now your friend needs them for class and feels upset.",
      apology: [
        "I forgot to return your colored pencils.",
        "That was my responsibility because I borrowed them.",
        "I got distracted, but I should have kept track of them.",
        "I will return them now and help you find any missing ones.",
        "Next time, I will put borrowed supplies in my backpack reminder pocket."
      ]
    },
    {
      text: "During a group project, you interrupted a teammate and made their idea seem unimportant.",
      apology: [
        "I interrupted you when you were sharing your idea.",
        "That was unfair because you deserved a chance to speak.",
        "I was excited, but that does not make it okay.",
        "I want to hear your idea now and include it in our plan.",
        "Next time, I will pause and let people finish before I talk."
      ]
    },
    {
      text: "You accidentally knocked over someone's tower during a game and laughed because you felt nervous.",
      apology: [
        "I knocked over your tower and laughed afterward.",
        "That hurt your feelings, and I need to own that.",
        "I felt nervous, but laughing made it worse.",
        "I can help rebuild it with you.",
        "Next time, I will say sorry right away instead of laughing."
      ]
    }
  ];
  let currentRound = 0;
  let selectedSteps = [];
  let selectedButtons = [];
  let localScore = 0;
  let repaired = 0;
  let testedThisRound = false;

  arena.innerHTML = `
    <div class="apology-bridge-game">
      <div class="ab-sky"></div>
      <div class="ab-mountains"></div>
      <section class="ab-screen" data-ab-start>
        <div class="ab-screen-card">
          <div class="ab-big">🌉</div>
          <h2>Brave Apology Bridge</h2>
          <p>Trust is like a bridge. When someone gets hurt, the bridge can crack. A brave apology repairs it step by step.</p>
          <p>Choose the apology steps in the correct order to rebuild the bridge.</p>
          <button class="ab-btn gold" type="button" data-ab-start-button>Begin Repair</button>
        </div>
      </section>
      <section class="ab-screen hidden" data-ab-end>
        <div class="ab-screen-card">
          <div class="ab-big">✨</div>
          <h2 data-ab-end-title>Bridge Restored!</h2>
          <p data-ab-end-message></p>
          <button class="ab-btn gold" type="button" data-ab-restart>Play Again</button>
        </div>
      </section>
      <div class="ab-content">
        <div class="ab-top">
          <div class="ab-title-card">
            <h2>🌉 Brave Apology Bridge</h2>
            <p>Repair trust by building a sincere apology in the right order.</p>
          </div>
          <div class="ab-stats">
            <div class="ab-pill">Round: <span data-ab-round>1</span>/3</div>
            <div class="ab-pill">Score: <span data-ab-score>0</span></div>
            <div class="ab-pill">Repairs: <span data-ab-repairs>0</span>/5</div>
          </div>
        </div>
        <div class="ab-main">
          <div class="ab-panel ab-bridge-panel">
            <div class="ab-scenario" data-ab-scenario></div>
            <div class="ab-bridge-stage">
              <div class="ab-glow" data-ab-glow></div>
              <div class="ab-void"></div>
              <div class="ab-cliff left"></div>
              <div class="ab-cliff right"></div>
              <div class="ab-character player">🧒</div>
              <div class="ab-character friend" data-ab-friend>😟</div>
              <div class="ab-bridge">
                <div class="ab-segment" style="--tilt:-9deg"></div>
                <div class="ab-segment" style="--tilt:7deg"></div>
                <div class="ab-segment" style="--tilt:-11deg"></div>
                <div class="ab-segment" style="--tilt:10deg"></div>
                <div class="ab-segment" style="--tilt:-6deg"></div>
              </div>
            </div>
          </div>
          <div class="ab-panel ab-controls">
            <h2>Repair Blueprint</h2>
            <div class="ab-step-slots" data-ab-slots></div>
            <div class="ab-choice-bank" data-ab-choice-bank></div>
            <div class="ab-meters">
              <div>
                <div class="ab-meter-label"><span>Trust Repaired</span><span data-ab-trust-text>0%</span></div>
                <div class="ab-meter"><div data-ab-trust-fill></div></div>
              </div>
              <div>
                <div class="ab-meter-label"><span>Apology Strength</span><span data-ab-strength-text>0%</span></div>
                <div class="ab-meter"><div data-ab-strength-fill></div></div>
              </div>
            </div>
            <div class="ab-feedback" data-ab-feedback>Pick the first step of a sincere apology.</div>
            <div class="ab-btn-row">
              <button class="ab-btn" type="button" data-ab-check>Test Bridge</button>
              <button class="ab-btn gold" type="button" data-ab-reset>Reset Steps</button>
              <button class="ab-btn" type="button" data-ab-next>Next Scenario</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const q = (selector) => arena.querySelector(selector);
  q("[data-ab-start-button]").onclick = startBridgeGame;
  q("[data-ab-restart]").onclick = restartBridgeGame;
  q("[data-ab-check]").onclick = checkBlueprint;
  q("[data-ab-reset]").onclick = resetChoices;
  q("[data-ab-next]").onclick = nextRound;
  loadRound();

  function startBridgeGame() {
    q("[data-ab-start]").classList.add("hidden");
    loadRound();
  }

  function restartBridgeGame() {
    currentRound = 0;
    localScore = 0;
    state.score = 0;
    state.streak = 0;
    q("[data-ab-end]").classList.add("hidden");
    loadRound();
    sync();
  }

  function loadRound() {
    selectedSteps = [];
    selectedButtons = [];
    testedThisRound = false;
    repaired = 0;
    q("[data-ab-scenario]").textContent = scenarios[currentRound].text;
    q("[data-ab-feedback]").textContent = "Pick the first step of a sincere apology.";
    q("[data-ab-friend]").textContent = "😟";
    renderSlots();
    renderChoices();
    updateMeters();
    updateBridge();
    updateStats();
  }

  function renderSlots() {
    q("[data-ab-slots]").innerHTML = Array.from({ length: 5 }, (_, index) => `
      <div class="ab-slot ${selectedSteps[index] ? "filled" : ""}">
        <span>${index + 1}. ${selectedSteps[index] || "Waiting for apology step..."}</span>
        <span>${selectedSteps[index] ? "🔧" : "□"}</span>
      </div>
    `).join("");
  }

  function renderChoices() {
    q("[data-ab-choice-bank]").innerHTML = shuffle(correctOrder).map((choice) => (
      `<button class="ab-choice" type="button">${choice}</button>`
    )).join("");
    q("[data-ab-choice-bank]").querySelectorAll(".ab-choice").forEach((button) => {
      button.onclick = () => chooseStep(button.textContent, button);
    });
  }

  function chooseStep(choice, button) {
    if (selectedSteps.length >= 5 || testedThisRound) return;
    selectedSteps.push(choice);
    selectedButtons.push(button);
    button.classList.add("used");

    const index = selectedSteps.length - 1;
    if (choice === correctOrder[index]) {
      repaired += 1;
      localScore += 15;
      state.score = localScore;
      state.streak += 1;
      q("[data-ab-feedback]").textContent = `Good repair! Step ${index + 1} belongs here.`;
      spark("✨");
    } else {
      state.streak = 0;
      q("[data-ab-feedback]").textContent = `Careful, that step may not belong at position ${index + 1}. Apologies work best in a thoughtful order.`;
      shakeSegment(index);
    }
    renderSlots();
    updateMeters();
    updateBridge();
    updateStats();
    sync();
  }

  function checkBlueprint() {
    if (selectedSteps.length < 5) {
      q("[data-ab-feedback]").textContent = "Complete all 5 apology steps before testing the bridge.";
      return;
    }
    if (testedThisRound) {
      q("[data-ab-feedback]").textContent = "You already tested this bridge. Move to the next scenario.";
      return;
    }
    testedThisRound = true;
    const correct = selectedSteps.filter((step, index) => step === correctOrder[index]).length;

    if (correct === 5) {
      localScore += 75;
      repaired = 5;
      q("[data-ab-feedback]").innerHTML = `Perfect repair! Now here is the sincere apology:<br><br>“${scenarios[currentRound].apology.join(" ")}”`;
      q("[data-ab-friend]").textContent = "😊";
      spark("🌟");
    } else if (correct >= 3) {
      localScore += 35;
      q("[data-ab-feedback]").textContent = "The bridge mostly holds, but some steps are out of order. A strong apology needs responsibility before repair.";
      q("[data-ab-friend]").textContent = "🙂";
    } else {
      localScore += 10;
      q("[data-ab-feedback]").textContent = "The bridge is still shaky. Try remembering: admit, responsibility, explain without excuses, make it right, promise better action.";
      q("[data-ab-friend]").textContent = "😟";
    }

    repaired = correct;
    state.score = localScore;
    updateMeters();
    updateBridge();
    updateStats();
    sync();
  }

  function resetChoices() {
    if (testedThisRound) {
      q("[data-ab-feedback]").textContent = "This round has already been tested. Go to the next scenario.";
      return;
    }
    selectedSteps = [];
    selectedButtons.forEach((button) => button.classList.remove("used"));
    selectedButtons = [];
    repaired = 0;
    q("[data-ab-feedback]").textContent = "Steps reset. Try building the apology again.";
    renderSlots();
    updateMeters();
    updateBridge();
    updateStats();
  }

  function nextRound() {
    if (!testedThisRound) {
      q("[data-ab-feedback]").textContent = "Test the bridge first before moving on.";
      return;
    }
    currentRound += 1;
    if (currentRound >= scenarios.length) endBridgeGame();
    else loadRound();
  }

  function updateMeters() {
    const trust = Math.round((repaired / 5) * 100);
    const strength = Math.round((selectedSteps.length / 5) * 100);
    q("[data-ab-trust-fill]").style.width = `${trust}%`;
    q("[data-ab-trust-text]").textContent = `${trust}%`;
    q("[data-ab-strength-fill]").style.width = `${strength}%`;
    q("[data-ab-strength-text]").textContent = `${strength}%`;
    q("[data-ab-glow]").style.opacity = 0.25 + trust / 130;
  }

  function updateBridge() {
    q(".apology-bridge-game").querySelectorAll(".ab-segment").forEach((segment, index) => {
      segment.classList.toggle("fixed", index < repaired);
    });
  }

  function shakeSegment(index) {
    const segment = q(".apology-bridge-game").querySelectorAll(".ab-segment")[index];
    if (!segment) return;
    segment.classList.add("shake");
    setTimeout(() => segment.classList.remove("shake"), 400);
  }

  function updateStats() {
    q("[data-ab-round]").textContent = Math.min(currentRound + 1, scenarios.length);
    q("[data-ab-score]").textContent = localScore;
    q("[data-ab-repairs]").textContent = repaired;
  }

  function endBridgeGame() {
    let title = "Bridge Journey Complete!";
    let message = "";
    if (localScore >= 250) {
      title = "Trust Repair Master!";
      message = `Amazing work! Your score was ${localScore}. You showed that a sincere apology admits the mistake, takes responsibility, and repairs trust.`;
    } else if (localScore >= 170) {
      title = "Brave Apology Builder!";
      message = `Great job! Your score was ${localScore}. You understand that apologies are stronger when they include action, not just words.`;
    } else {
      title = "Apology Apprentice!";
      message = `Your score was ${localScore}. Keep practicing the order: admit, take responsibility, explain without excuses, make it right, and promise better action.`;
    }
    q("[data-ab-end-title]").textContent = title;
    q("[data-ab-end-message]").textContent = message;
    q("[data-ab-end]").classList.remove("hidden");
    finish();
  }

  function spark(symbol) {
    for (let i = 0; i < 14; i += 1) {
      const sparkle = document.createElement("div");
      sparkle.className = "ab-spark";
      sparkle.textContent = symbol;
      sparkle.style.left = `${Math.random() * 85 + 8}%`;
      sparkle.style.top = `${Math.random() * 60 + 18}%`;
      q(".apology-bridge-game").append(sparkle);
      setTimeout(() => sparkle.remove(), 850);
    }
  }
}

function renderSignalFilter(arena) {
  clearInterval(state.timer);
  state.timer = null;

  const stories = [
    {
      speaker: "🧑‍🎨",
      text: "Lina says: I felt nervous when my drawing got smudged because I worked on it for a long time. I do not need someone to fix it for me, I just want encouragement while I try again.",
      key: ["felt nervous", "drawing got smudged", "wants encouragement"],
      noise: ["favorite color is purple", "lunch was pasta", "the room has windows", "likes funny stickers"],
      correct: "You felt nervous because your drawing got smudged, and you want encouragement while you try again.",
      wrong: ["You want me to fix the drawing for you right away.", "You are upset because lunch was pasta.", "You do not want to try again."]
    },
    {
      speaker: "🎻",
      text: "Marcus says: I practiced my music part, but I am worried I will mess up during the group performance. I would feel better if someone practiced the tricky section with me.",
      key: ["worried about performance", "practiced music part", "wants practice help"],
      noise: ["has a blue backpack", "likes sunny days", "walked down the hallway", "saw a pencil"],
      correct: "You practiced, but you are worried about the performance and want someone to practice the tricky part with you.",
      wrong: ["You did not practice at all and want to quit.", "You are mostly talking about your blue backpack.", "You want everyone else to perform without you."]
    },
    {
      speaker: "🧩",
      text: "Ava says: During the group activity, I had an idea but people kept talking over me. I felt ignored, and I want a chance to explain my idea before we choose.",
      key: ["had an idea", "felt ignored", "wants chance to explain"],
      noise: ["table was round", "there were four chairs", "saw a poster", "likes puzzles"],
      correct: "You had an idea, felt ignored when people talked over you, and want a chance to explain before the group chooses.",
      wrong: ["You want to make every decision by yourself.", "You are mainly upset about the round table.", "You do not have any idea to share."]
    }
  ];
  let currentRound = 0;
  let localScore = 0;
  let focus = 50;
  let timeLeft = 25;
  let timer = null;
  let spawning = false;
  let caughtKeys = [];
  let skills = { look: false, pause: false, ask: false, check: false };
  let checkedThisRound = false;

  arena.innerHTML = `
    <div class="listening-lanterns-game">
      <div class="ll-sky"></div>
      <div class="ll-stars"></div>
      <div class="ll-hills"></div>
      <section class="ll-screen" data-ll-start>
        <div class="ll-screen-card">
          <div class="ll-big">🏮</div>
          <h2>Listening Lanterns</h2>
          <p>In the quiet night sky, important details glow as golden lanterns. Distractions float by too.</p>
          <p>Catch the key details, ignore the noise, pause before answering, ask a helpful question, and check your understanding.</p>
          <button class="ll-btn gold" type="button" data-ll-start-button>Light the Lanterns</button>
        </div>
      </section>
      <section class="ll-screen hidden" data-ll-end>
        <div class="ll-screen-card">
          <div class="ll-big">🌟</div>
          <h2 data-ll-end-title>Lantern Path Complete!</h2>
          <p data-ll-end-message></p>
          <button class="ll-btn gold" type="button" data-ll-restart>Play Again</button>
        </div>
      </section>
      <div class="ll-content">
        <div class="ll-top">
          <div class="ll-title-card">
            <h2>🏮 Listening Lanterns</h2>
            <p>Catch key details, ignore distractions, and respond with care.</p>
          </div>
          <div class="ll-stats">
            <div class="ll-pill">Round: <span data-ll-round>1</span>/3</div>
            <div class="ll-pill">Score: <span data-ll-score>0</span></div>
            <div class="ll-pill">Time: <span data-ll-time>25</span>s</div>
          </div>
        </div>
        <div class="ll-main">
          <div class="ll-panel ll-lantern-panel">
            <div class="ll-story-box">
              <div class="ll-story-title">Speaker's Story</div>
              <div data-ll-story></div>
            </div>
            <div class="ll-lantern-field" data-ll-field>
              <div class="ll-speaker" data-ll-speaker>🧒</div>
              <div class="ll-listener">👂</div>
            </div>
          </div>
          <div class="ll-panel ll-controls">
            <h2>Active Listening Tools</h2>
            <div class="ll-skill-row">
              <button class="ll-skill" type="button" data-ll-skill="look">👀 Look</button>
              <button class="ll-skill" type="button" data-ll-skill="pause">⏸ Pause</button>
              <button class="ll-skill" type="button" data-ll-skill="ask">❓ Ask</button>
              <button class="ll-skill" type="button" data-ll-skill="check">🔁 Check</button>
            </div>
            <div>
              <div class="ll-meter-label"><span>Listening Focus</span><span data-ll-focus-text>50%</span></div>
              <div class="ll-meter"><div data-ll-focus-fill></div></div>
            </div>
            <div class="ll-caught-box" data-ll-caught>Key details caught: none yet.</div>
            <div class="ll-feedback" data-ll-feedback>Click golden lanterns with important details. Avoid purple distraction lanterns.</div>
            <div class="ll-answers" data-ll-answers></div>
            <div class="ll-btn-row">
              <button class="ll-btn" type="button" data-ll-begin>Start Listening</button>
              <button class="ll-btn gold" type="button" data-ll-submit>Check Understanding</button>
              <button class="ll-btn" type="button" data-ll-next>Next Story</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const q = (selector) => arena.querySelector(selector);
  q("[data-ll-start-button]").onclick = () => {
    q("[data-ll-start]").classList.add("hidden");
    loadRound();
  };
  q("[data-ll-restart]").onclick = restartLanterns;
  q("[data-ll-begin]").onclick = beginLanterns;
  q("[data-ll-submit]").onclick = submitUnderstanding;
  q("[data-ll-next]").onclick = nextRound;
  q(".listening-lanterns-game").querySelectorAll("[data-ll-skill]").forEach((button) => {
    button.onclick = () => markSkill(button.dataset.llSkill, button);
  });
  loadRound();

  function restartLanterns() {
    currentRound = 0;
    localScore = 0;
    state.score = 0;
    state.streak = 0;
    q("[data-ll-end]").classList.add("hidden");
    loadRound();
    sync();
  }

  function loadRound() {
    clearInterval(timer);
    removeLanterns();
    const story = stories[currentRound];
    q("[data-ll-story]").textContent = story.text;
    q("[data-ll-speaker]").textContent = story.speaker;
    focus = 50;
    timeLeft = 25;
    spawning = false;
    caughtKeys = [];
    checkedThisRound = false;
    skills = { look: false, pause: false, ask: false, check: false };
    q(".listening-lanterns-game").querySelectorAll("[data-ll-skill]").forEach((button) => button.classList.remove("done"));
    q("[data-ll-caught]").textContent = "Key details caught: none yet.";
    q("[data-ll-feedback]").textContent = "Click Start Listening. Catch golden key details and avoid purple distractions.";
    q("[data-ll-answers]").innerHTML = "";
    updateStats();
    updateFocus();
  }

  function beginLanterns() {
    if (spawning) return;
    spawning = true;
    q("[data-ll-feedback]").textContent = "Listen carefully. Golden lanterns are key details. Purple lanterns are distractions.";
    const story = stories[currentRound];
    const items = shuffle([
      ...story.key.map((text) => ({ text, type: "key" })),
      ...story.noise.map((text) => ({ text, type: "noise" }))
    ]);
    let index = 0;
    clearInterval(timer);
    timer = setInterval(() => {
      timeLeft -= 1;
      state.time = timeLeft;
      updateStats();
      sync();
      if (index < items.length) {
        spawnLantern(items[index]);
        index += 1;
      }
      if (timeLeft <= 0) {
        clearInterval(timer);
        spawning = false;
        showAnswers();
        q("[data-ll-feedback]").textContent = "Now check understanding by choosing the response that proves you listened.";
      }
    }, 1000);
  }

  function spawnLantern(item) {
    const lantern = document.createElement("button");
    lantern.className = `ll-lantern ${item.type}`;
    lantern.type = "button";
    lantern.textContent = item.text;
    lantern.style.left = `${Math.random() * 65 + 14}%`;
    lantern.style.top = "-50px";
    lantern.style.animationDuration = `${6 + Math.random() * 2}s`;
    lantern.onclick = () => catchLantern(lantern, item);
    q("[data-ll-field]").append(lantern);
    setTimeout(() => {
      if (lantern.parentElement) {
        if (item.type === "key" && !caughtKeys.includes(item.text)) {
          focus -= 6;
          updateFocus();
        }
        lantern.remove();
      }
    }, 7600);
  }

  function catchLantern(lantern, item) {
    if (item.type === "key") {
      if (!caughtKeys.includes(item.text)) {
        caughtKeys.push(item.text);
        focus += 12;
        localScore += 12;
        state.score = localScore;
        state.streak += 1;
        q("[data-ll-feedback]").textContent = "Good listening! You caught an important detail.";
        spark("🏮");
      }
    } else {
      focus -= 12;
      state.streak = 0;
      q("[data-ll-feedback]").textContent = "That was a distraction. Active listening means filtering out extra noise.";
      spark("💨");
    }
    lantern.remove();
    updateCaught();
    updateFocus();
    updateStats();
    sync();
  }

  function markSkill(skill, button) {
    if (skills[skill]) return;
    skills[skill] = true;
    button.classList.add("done");
    focus += 7;
    localScore += 5;
    state.score = localScore;
    const messages = {
      look: "Looking at the speaker shows you are paying attention.",
      pause: "Pausing helps you avoid interrupting.",
      ask: "Asking a question helps you understand better.",
      check: "Checking understanding proves you listened carefully."
    };
    q("[data-ll-feedback]").textContent = messages[skill];
    updateFocus();
    updateStats();
    sync();
  }

  function showAnswers() {
    const story = stories[currentRound];
    q("[data-ll-answers]").innerHTML = shuffle([
      { text: story.correct, correct: true },
      ...story.wrong.map((text) => ({ text, correct: false }))
    ]).map((answer) => `<button class="ll-answer" type="button" data-correct="${answer.correct}">${answer.text}</button>`).join("");
    q("[data-ll-answers]").querySelectorAll(".ll-answer").forEach((button) => {
      button.onclick = () => chooseAnswer(button.dataset.correct === "true");
    });
  }

  function chooseAnswer(correct) {
    if (checkedThisRound) return;
    if (correct) {
      localScore += 40;
      focus += 18;
      state.score = localScore;
      state.streak += 1;
      q("[data-ll-feedback]").textContent = "Excellent check! You repeated the speaker's feeling, reason, and need.";
      spark("🌟");
    } else {
      focus -= 15;
      state.streak = 0;
      q("[data-ll-feedback]").textContent = "That response misses the main message. Try listening for feeling, reason, and need.";
    }
    checkedThisRound = true;
    updateFocus();
    updateStats();
    sync();
  }

  function submitUnderstanding() {
    if (!q("[data-ll-answers]").children.length) {
      showAnswers();
      q("[data-ll-feedback]").textContent = "Choose the response that best checks understanding.";
    } else if (!checkedThisRound) {
      q("[data-ll-feedback]").textContent = "Pick one response from the answer choices.";
    } else {
      q("[data-ll-feedback]").textContent = "Understanding checked. You may move to the next story.";
    }
  }

  function nextRound() {
    if (!checkedThisRound) {
      q("[data-ll-feedback]").textContent = "Check understanding before moving to the next story.";
      return;
    }
    currentRound += 1;
    if (currentRound >= stories.length) endLanterns();
    else loadRound();
  }

  function updateCaught() {
    q("[data-ll-caught]").textContent = caughtKeys.length
      ? `Key details caught: ${caughtKeys.join(", ")}.`
      : "Key details caught: none yet.";
  }

  function updateFocus() {
    focus = Math.max(0, Math.min(100, focus));
    q("[data-ll-focus-fill]").style.width = `${focus}%`;
    q("[data-ll-focus-text]").textContent = `${Math.round(focus)}%`;
  }

  function updateStats() {
    q("[data-ll-round]").textContent = Math.min(currentRound + 1, stories.length);
    q("[data-ll-score]").textContent = localScore;
    q("[data-ll-time]").textContent = Math.max(0, timeLeft);
    state.time = Math.max(0, timeLeft);
  }

  function endLanterns() {
    clearInterval(timer);
    removeLanterns();
    let title = "Lantern Path Complete!";
    let message = "";
    if (localScore >= 240) {
      title = "Master Listener!";
      message = `Amazing work! Your score was ${localScore}. You caught key details, ignored distractions, and checked understanding with care.`;
    } else if (localScore >= 160) {
      title = "Focused Listener!";
      message = `Great job! Your score was ${localScore}. You showed strong active listening. Keep practicing catching the speaker's feeling, reason, and need.`;
    } else {
      title = "Listening Apprentice!";
      message = `Your score was ${localScore}. Keep practicing. Active listening means looking, pausing, asking, and checking understanding.`;
    }
    q("[data-ll-end-title]").textContent = title;
    q("[data-ll-end-message]").textContent = message;
    q("[data-ll-end]").classList.remove("hidden");
    finish();
  }

  function removeLanterns() {
    q(".listening-lanterns-game").querySelectorAll(".ll-lantern").forEach((lantern) => lantern.remove());
  }

  function spark(symbol) {
    for (let i = 0; i < 12; i += 1) {
      const sparkle = document.createElement("div");
      sparkle.className = "ll-spark";
      sparkle.textContent = symbol;
      sparkle.style.left = `${Math.random() * 85 + 8}%`;
      sparkle.style.top = `${Math.random() * 60 + 18}%`;
      q(".listening-lanterns-game").append(sparkle);
      setTimeout(() => sparkle.remove(), 850);
    }
  }
}

function renderEmotionGarden(arena) {
  clearInterval(state.timer);
  state.timer = null;

  const rounds = [
    {
      scenario: "Lina worked hard on her drawing, but someone accidentally smudged it. She gets quiet and looks like she might cry.",
      feeling: "Sad",
      plant: "🌧️",
      correctResponse: "Say, “I can tell that hurt. Do you want help fixing it or some time first?”",
      responses: ["Say, “I can tell that hurt. Do you want help fixing it or some time first?”", "Say, “It is not a big deal, just draw another one.”", "Laugh so she knows you are not trying to be too serious."]
    },
    {
      scenario: "Marcus has to perform his music part in front of others. His hands are shaky, and he keeps saying, “What if I mess up?”",
      feeling: "Nervous",
      plant: "🌿",
      correctResponse: "Say, “It makes sense to feel nervous. Want to practice the tricky part once together?”",
      responses: ["Say, “It makes sense to feel nervous. Want to practice the tricky part once together?”", "Say, “Do not be nervous. That is easy.”", "Tell everyone he is scared so they can watch him more closely."]
    },
    {
      scenario: "Ava shares an idea during group work, but two people talk over her. She crosses her arms and stops talking.",
      feeling: "Ignored",
      plant: "🌻",
      correctResponse: "Say, “I think Ava was sharing something. Can we pause and hear her idea?”",
      responses: ["Say, “I think Ava was sharing something. Can we pause and hear her idea?”", "Keep talking because the group needs to move fast.", "Tell Ava she should just talk louder next time."]
    },
    {
      scenario: "Noah studied hard and finally improved his quiz score. He smiles and keeps looking at his paper.",
      feeling: "Proud",
      plant: "🌷",
      correctResponse: "Say, “You should feel proud. Your studying really paid off.”",
      responses: ["Say, “You should feel proud. Your studying really paid off.”", "Say, “That quiz was easy anyway.”", "Ignore it because talking about success is awkward."]
    },
    {
      scenario: "Maya made a mistake during a game, and her team lost a point. She says, “Everyone is probably mad at me.”",
      feeling: "Embarrassed",
      plant: "🌺",
      correctResponse: "Say, “Mistakes happen. We are still a team, and we can try the next round together.”",
      responses: ["Say, “Mistakes happen. We are still a team, and we can try the next round together.”", "Say, “Yeah, that was a bad mistake.”", "Avoid her so she can figure it out alone."]
    }
  ];
  const emotions = ["Sad", "Nervous", "Ignored", "Proud", "Embarrassed", "Angry"];
  let currentRound = 0;
  let selectedEmotion = null;
  let selectedResponse = null;
  let localScore = 0;
  let blooms = 0;
  let balance = 50;
  let completedRound = false;

  arena.innerHTML = `
    <div class="feelings-garden-game">
      <div class="fg-sky"></div>
      <div class="fg-ground"></div>
      <section class="fg-screen" data-fg-start>
        <div class="fg-screen-card">
          <div class="fg-big">🌸</div>
          <h2>Feelings Garden</h2>
          <p>Every feeling is like a seed. When you name the feeling correctly and choose a helpful response, the garden grows stronger.</p>
          <p>Step 1: Read the situation. Step 2: Pick the feeling seed. Step 3: Choose the most helpful response.</p>
          <button class="fg-btn gold" type="button" data-fg-start-button>Enter the Garden</button>
        </div>
      </section>
      <section class="fg-screen hidden" data-fg-end>
        <div class="fg-screen-card">
          <div class="fg-big">🌼</div>
          <h2 data-fg-end-title>Garden Complete!</h2>
          <p data-fg-end-message></p>
          <button class="fg-btn gold" type="button" data-fg-restart>Play Again</button>
        </div>
      </section>
      <div class="fg-content">
        <div class="fg-top">
          <div class="fg-title-card">
            <h2>🌸 Feelings Garden</h2>
            <p>Name the feeling, choose a helpful response, and restore emotional balance.</p>
          </div>
          <div class="fg-stats">
            <div class="fg-pill">Round: <span data-fg-round>1</span>/5</div>
            <div class="fg-pill">Score: <span data-fg-score>0</span></div>
            <div class="fg-pill">Blooms: <span data-fg-blooms>0</span> 🌼</div>
          </div>
        </div>
        <div class="fg-main">
          <div class="fg-panel fg-garden-panel">
            <div class="fg-scenario" data-fg-scenario></div>
            <div class="fg-garden" data-fg-garden>
              <div class="fg-sun" data-fg-sun></div>
              <div class="fg-cloud" data-fg-cloud>☁️</div>
              <div class="fg-plant-zone">
                <div class="fg-plant neutral" data-fg-plant>🌱</div>
              </div>
              <div class="fg-soil"></div>
            </div>
          </div>
          <div class="fg-panel fg-controls">
            <h2>Garden Instructions</h2>
            <div class="fg-instructions">First, choose the emotion seed that best matches the character's feeling. Then choose the response that would actually help them. Press “Grow Garden” to see what happens.</div>
            <div class="fg-emotion-seeds" data-fg-emotions></div>
            <div class="fg-response-box" data-fg-responses></div>
            <div>
              <div class="fg-meter-label"><span>Garden Balance</span><span data-fg-balance-text>50%</span></div>
              <div class="fg-meter"><div data-fg-balance-fill></div></div>
            </div>
            <div class="fg-feedback" data-fg-feedback>Pick the feeling seed that matches the situation.</div>
            <div class="fg-btn-row">
              <button class="fg-btn" type="button" data-fg-grow>Grow Garden</button>
              <button class="fg-btn gold" type="button" data-fg-next>Next Feeling</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const q = (selector) => arena.querySelector(selector);
  q("[data-fg-start-button]").onclick = () => {
    q("[data-fg-start]").classList.add("hidden");
    loadRound();
  };
  q("[data-fg-restart]").onclick = restartGarden;
  q("[data-fg-grow]").onclick = growGarden;
  q("[data-fg-next]").onclick = nextRound;
  loadRound();

  function restartGarden() {
    currentRound = 0;
    selectedEmotion = null;
    selectedResponse = null;
    localScore = 0;
    state.score = 0;
    state.streak = 0;
    blooms = 0;
    balance = 50;
    completedRound = false;
    q("[data-fg-end]").classList.add("hidden");
    loadRound();
    sync();
  }

  function loadRound() {
    const round = rounds[currentRound];
    selectedEmotion = null;
    selectedResponse = null;
    completedRound = false;
    q("[data-fg-scenario]").textContent = round.scenario;
    q("[data-fg-plant]").textContent = "🌱";
    q("[data-fg-plant]").className = "fg-plant neutral";
    q("[data-fg-feedback]").textContent = "Pick the feeling seed that matches the situation.";
    renderEmotionSeeds();
    renderResponses();
    updateStats();
    updateBalance();
  }

  function renderEmotionSeeds() {
    const round = rounds[currentRound];
    const choices = shuffle([round.feeling, ...shuffle(emotions.filter((emotion) => emotion !== round.feeling)).slice(0, 3)]);
    q("[data-fg-emotions]").innerHTML = choices.map((emotion) => (
      `<button class="fg-seed" type="button" data-emotion="${escapeAttr(emotion)}">${emotionSeedIcon(emotion)} ${emotion}</button>`
    )).join("");
    q("[data-fg-emotions]").querySelectorAll(".fg-seed").forEach((button) => {
      button.onclick = () => {
        if (completedRound) return;
        selectedEmotion = button.dataset.emotion;
        q("[data-fg-emotions]").querySelectorAll(".fg-seed").forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
        q("[data-fg-feedback]").textContent = `You planted the ${selectedEmotion} seed. Now choose a helpful response.`;
      };
    });
  }

  function renderResponses() {
    const choices = shuffle(rounds[currentRound].responses);
    q("[data-fg-responses]").innerHTML = choices.map((response) => (
      `<button class="fg-response" type="button">${response}</button>`
    )).join("");
    q("[data-fg-responses]").querySelectorAll(".fg-response").forEach((button) => {
      button.onclick = () => {
        if (completedRound) return;
        selectedResponse = button.textContent;
        q("[data-fg-responses]").querySelectorAll(".fg-response").forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
        q("[data-fg-feedback]").textContent = "Response chosen. Press Grow Garden to see if the garden blooms.";
      };
    });
  }

  function growGarden() {
    if (completedRound) {
      q("[data-fg-feedback]").textContent = "This feeling has already grown. Move to the next feeling.";
      return;
    }
    if (!selectedEmotion || !selectedResponse) {
      q("[data-fg-feedback]").textContent = "Choose both a feeling seed and a helpful response before growing the garden.";
      return;
    }

    const round = rounds[currentRound];
    const emotionCorrect = selectedEmotion === round.feeling;
    const responseCorrect = selectedResponse === round.correctResponse;
    completedRound = true;

    if (emotionCorrect && responseCorrect) {
      localScore += 100;
      blooms += 1;
      balance += 18;
      q("[data-fg-plant]").textContent = round.plant;
      q("[data-fg-plant]").className = "fg-plant grow";
      q("[data-fg-feedback]").textContent = "Beautiful bloom! You named the feeling correctly and chose a caring response.";
      state.streak += 1;
      createRipple();
      spark("🌼");
    } else if (emotionCorrect && !responseCorrect) {
      localScore += 55;
      balance += 5;
      q("[data-fg-plant]").textContent = "🌿";
      q("[data-fg-plant]").className = "fg-plant grow";
      q("[data-fg-feedback]").textContent = "Good feeling match, but the response could be more helpful. Naming the feeling is only step one.";
      state.streak = 0;
      createRipple();
    } else if (!emotionCorrect && responseCorrect) {
      localScore += 45;
      balance += 3;
      q("[data-fg-plant]").textContent = "🍃";
      q("[data-fg-plant]").className = "fg-plant grow";
      q("[data-fg-feedback]").textContent = "Helpful response, but the feeling seed was not quite right. Try noticing clues in body language and words.";
      state.streak = 0;
      createRipple();
    } else {
      localScore += 10;
      balance -= 14;
      q("[data-fg-plant]").textContent = "🥀";
      q("[data-fg-plant]").className = "fg-plant wilt";
      q("[data-fg-feedback]").textContent = `The garden wilted. The feeling was ${round.feeling}. A helpful response would show understanding and support.`;
      state.streak = 0;
    }
    state.score = localScore;
    updateStats();
    updateBalance();
    sync();
  }

  function nextRound() {
    if (!completedRound) {
      q("[data-fg-feedback]").textContent = "Grow the garden first before moving to the next feeling.";
      return;
    }
    currentRound += 1;
    if (currentRound >= rounds.length) endGarden();
    else loadRound();
  }

  function updateStats() {
    q("[data-fg-round]").textContent = Math.min(currentRound + 1, rounds.length);
    q("[data-fg-score]").textContent = localScore;
    q("[data-fg-blooms]").textContent = blooms;
  }

  function updateBalance() {
    balance = Math.max(0, Math.min(100, balance));
    q("[data-fg-balance-fill]").style.width = `${balance}%`;
    q("[data-fg-balance-text]").textContent = `${Math.round(balance)}%`;
    q("[data-fg-sun]").style.opacity = 0.35 + balance / 120;
    q("[data-fg-cloud]").style.opacity = 0.8 - balance / 140;
    q("[data-fg-garden]").style.filter = balance > 70
      ? "saturate(1.15) brightness(1.04)"
      : balance < 35
        ? "saturate(0.75) brightness(0.9)"
        : "none";
  }

  function endGarden() {
    let title = "Garden Complete!";
    let message = "";
    if (localScore >= 430) {
      title = "Emotion Garden Master!";
      message = `Amazing work! Your score was ${localScore}. You named feelings clearly and chose responses that helped the characters feel understood.`;
    } else if (localScore >= 300) {
      title = "Feelings Helper!";
      message = `Great job! Your score was ${localScore}. You are learning how to notice feelings and respond with care.`;
    } else {
      title = "Garden Apprentice!";
      message = `Your score was ${localScore}. Keep practicing. Look for clues, name the feeling, and choose a response that helps.`;
    }
    q("[data-fg-end-title]").textContent = title;
    q("[data-fg-end-message]").textContent = message;
    q("[data-fg-end]").classList.remove("hidden");
    finish();
  }

  function emotionSeedIcon(emotion) {
    return { Sad: "🌧️", Nervous: "🌿", Ignored: "🌻", Proud: "🌷", Embarrassed: "🌺", Angry: "🔥" }[emotion] || "🌱";
  }

  function createRipple() {
    const ripple = document.createElement("div");
    ripple.className = "fg-emotion-ripple";
    q("[data-fg-garden]").append(ripple);
    setTimeout(() => ripple.remove(), 850);
  }

  function spark(symbol) {
    for (let i = 0; i < 14; i += 1) {
      const sparkle = document.createElement("div");
      sparkle.className = "fg-spark";
      sparkle.textContent = symbol;
      sparkle.style.left = `${Math.random() * 85 + 8}%`;
      sparkle.style.top = `${Math.random() * 60 + 18}%`;
      q(".feelings-garden-game").append(sparkle);
      setTimeout(() => sparkle.remove(), 850);
    }
  }
}

function renderTimeDilation(arena) {
  arena.innerHTML = `<div class="time-lab"><div class="clock-face"><span class="clock-hand"></span></div><meter id="rush" min="0" max="100" value="55"></meter><button class="tap-button">Calm Wait</button><button class="tap-button rush">Rush Click</button></div>`;
  let rush = 55;
  const syncRush = () => {
    arena.querySelector("#rush").value = rush;
    arena.querySelector(".clock-hand").style.transform = `translate(-50%, -100%) rotate(${rush * 3.6}deg)`;
  };
  arena.querySelector(".tap-button:not(.rush)").onclick = () => {
    rush = Math.max(0, rush - 15);
    syncRush();
    point("Time slows because you stayed calm.");
    if (rush <= 5) finish();
  };
  arena.querySelector(".rush").onclick = () => {
    rush = Math.min(100, rush + 18);
    syncRush();
    miss("Fast clicking makes the potion clock speed up.");
  };
  syncRush();
}

function renderHiddenNeeds(arena, data) {
  let index = 0;
  arena.innerHTML = `<div class="bakery-counter">${sprite("asset-market", "scene-sprite")}<span></span><span></span><span></span></div><div class="order-ticket"></div><div class="creative-grid">${data.map((item) => `<button class="token" data-value="${escapeAttr(item.value)}">${sprite("asset-bread", "token-sprite")}<span>${item.value}</span></button>`).join("")}</div>`;
  const show = () => arena.querySelector(".order-ticket").textContent = `Customer says: "${data[index].label}"`;
  show();
  arena.querySelectorAll(".token").forEach((button) => button.onclick = () => {
    if (button.dataset.value !== data[index].value) return miss("Look for the need behind the words.");
    point("You noticed the hidden need.");
    index += 1;
    if (index >= data.length) return finish();
    show();
  });
}

function renderTruthTimeline(arena, data) {
  arena.innerHTML = `<div class="tower-split">${sprite("asset-tower", "scene-sprite")}</div><div class="timeline-split"><div><b>Truth Path</b><p>Trust rises, repair begins.</p></div><div><b>Avoidance Path</b><p>Confusion grows, trust cracks.</p></div></div><div class="creative-grid">${data.map((item, index) => buttonHtml(item, index)).join("")}</div>`;
  arena.querySelectorAll(".token").forEach((button) => button.onclick = () => {
    if (button.dataset.value !== "truth") return miss("The shadow timeline shows this choice makes repair harder.");
    completeToken(button);
    if (![...arena.querySelectorAll('.token[data-value="truth"]')].some((item) => !item.disabled)) finish();
  });
}

function renderMemoryLink(arena, data) {
  arena.innerHTML = `<div class="cavern-shine">${sprite("asset-cave", "scene-sprite")}${sprite("asset-gem", "scene-sprite")}</div><div class="pairs">${data.map((item) => `<button class="gem token" data-label="${escapeAttr(item.label)}" data-value="${escapeAttr(item.value)}">${sprite("asset-gem", "token-sprite")}<span>${item.label}</span></button>`).join("")}</div><div class="target-row">${shuffle(data).map((item) => `<button class="target-chip" data-memory="${escapeAttr(item.value)}">${item.value}</button>`).join("")}</div>`;
  bindPairMatch(arena, "data-memory", "Specific gratitude makes the gem shine.");
}

function renderReputationNetwork(arena, data) {
  arena.innerHTML = `<div class="table">${sprite("asset-table", "scene-sprite")}<div>Speaker <meter min="0" max="100" value="50"></meter></div><div>Listeners <meter min="0" max="100" value="50"></meter></div><div>Council <meter min="0" max="100" value="50"></meter></div></div><div class="creative-grid">${data.map((item, index) => buttonHtml(item, index)).join("")}</div>`;
  arena.querySelectorAll(".token").forEach((button) => button.onclick = () => {
    const good = button.dataset.value.startsWith("+");
    adjustAllMeters(arena, good ? 16 : -18);
    good ? completeToken(button) : miss("That reply lowered trust around the table.");
  });
}

function renderBelongingMeters(arena, data) {
  arena.innerHTML = `<div class="inn-guests">${data.map((item) => `<button class="person" data-need="${escapeAttr(item.value)}">${item.label}<meter min="0" max="100" value="25"></meter></button>`).join("")}</div><div class="target-row">${data.map((item) => `<button class="target-chip" data-action="${escapeAttr(item.value)}">${item.value}</button>`).join("")}</div>`;
  let selected = null;
  arena.querySelectorAll(".person").forEach((person) => person.onclick = () => { selected = person; markSelected(person); });
  arena.querySelectorAll(".target-chip").forEach((chip) => chip.onclick = () => {
    if (!selected) return miss("Choose a guest first.");
    if (selected.dataset.need !== chip.dataset.action) return miss("That guest needs a different welcome.");
    selected.querySelector("meter").value = 100;
    selected.disabled = true;
    point("Comfort rises in the inn.");
    if ([...arena.querySelectorAll(".person")].every((item) => item.disabled)) finish();
  });
}

function renderFearCave(arena, data) {
  arena.innerHTML = `<div class="cave-path">${data.map((item, index) => `<button class="rock" data-step="${index}">${item.label}</button>`).join("")}</div>`;
  let next = 0;
  arena.querySelectorAll(".rock").forEach((rock) => rock.onclick = () => {
    if (Number(rock.dataset.step) !== next) return miss("Courage takes one clear step at a time.");
    rock.classList.add("complete");
    rock.disabled = true;
    next += 1;
    point("A fear-rock fades.");
    if (next >= data.length) finish();
  });
}

function renderBreathingDragon(arena, data) {
  arena.innerHTML = `<div class="dragon-den"><button class="dragon-button">Dragon Breath</button><p id="breath-step">${data[0].label}</p><meter min="0" max="${data.length}" value="0"></meter></div>`;
  let step = 0;
  arena.querySelector(".dragon-button").onclick = () => {
    step += 1;
    arena.querySelector("meter").value = step;
    arena.querySelector(".dragon-button").style.transform = `scale(${1 + (step % 2) * 0.08})`;
    point(`${data[Math.min(step - 1, data.length - 1)].label} matched.`);
    if (step >= data.length) return finish();
    arena.querySelector("#breath-step").textContent = data[step].label;
  };
}

function renderTeamRoles(arena, data) {
  renderSequence(arena, data, "pass-field", "That teammate's role comes at a different moment.");
}

function renderEquityFountain(arena, data) {
  arena.innerHTML = `<div class="fountain-grid">${data.map((item) => `<div class="need-card"><b>${item.label}</b><meter min="0" max="100" value="20"></meter><button class="token" data-value="${escapeAttr(item.value)}">${item.value}</button></div>`).join("")}</div>`;
  arena.querySelectorAll(".token").forEach((button) => button.onclick = () => {
    button.previousElementSibling.value = 100;
    completeToken(button);
  });
}

function renderFuturePath(arena, data) {
  arena.innerHTML = `<div class="journey-map">${sprite("asset-path", "scene-sprite")}<p id="future">Choose a promise plan to reveal tomorrow.</p></div><div class="creative-grid">${data.map((item, index) => buttonHtml(item, index)).join("")}</div>`;
  arena.querySelectorAll(".token").forEach((button) => button.onclick = () => {
    const good = ["smooth", "bridge"].includes(button.dataset.value);
    arena.querySelector("#future").textContent = good ? "Future path clears because you planned ahead." : "Future path gets harder because the plan was weak.";
    good ? completeToken(button) : miss("That future obstacle could have been planned for.");
  });
}

function renderHabitsHarbor(arena, data) {
  arena.innerHTML = `<div class="harbor-system">${data.map((item) => `<button class="plant token" data-label="${escapeAttr(item.label)}">${item.label}<meter min="0" max="100" value="45"></meter></button>`).join("")}</div>`;
  arena.querySelectorAll(".token").forEach((button) => button.onclick = () => {
    button.querySelector("meter").value = 90;
    rippleMeters(arena, 6);
    completeToken(button);
  });
}

function renderPredictiveShield(arena, data) {
  arena.innerHTML = `<div class="shield-readout">${sprite("asset-shield", "scene-sprite")}<span>Predict the safest outcome first.</span></div><div class="creative-grid">${data.map((item, index) => buttonHtml(item, index)).join("")}</div>`;
  arena.querySelectorAll(".token").forEach((button) => button.onclick = () => {
    arena.querySelector(".shield-readout").textContent = `${button.dataset.label} → ${button.dataset.value}`;
    completeToken(button);
  });
}

function renderQuestionClock(arena, data) {
  arena.innerHTML = `<div class="clock-face">${sprite("asset-clock", "scene-sprite")}<span class="clock-hand"></span></div><div class="creative-grid">${data.map((item, index) => buttonHtml(item, index)).join("")}</div>`;
  let depth = 0;
  arena.querySelectorAll(".token").forEach((button) => button.onclick = () => {
    if (Number(button.dataset.value) !== depth + 1) return miss("Unlock the clock from simple questions to deeper ones.");
    depth += 1;
    arena.querySelector(".clock-hand").style.transform = `translate(-50%, -100%) rotate(${depth * 72}deg)`;
    completeToken(button);
    if (depth === data.length) finish();
  });
}

function renderAdaptivePeak(arena, data) {
  let terrain = 0;
  arena.innerHTML = `<div class="mountain">${sprite("asset-peak", "scene-sprite")}<span>Terrain: icy ledge. Choose, learn, adapt.</span></div><div class="creative-grid">${data.map((item, index) => buttonHtml(item, index)).join("")}</div>`;
  arena.querySelectorAll(".token").forEach((button, index) => button.onclick = () => {
    if (index !== terrain) {
      terrain = Math.min(data.length - 1, terrain + 1);
      arena.querySelector(".mountain").textContent = `Terrain changed. New strategy needed: ${data[terrain].label}`;
      return miss("The mountain changed after that setback.");
    }
    terrain += 1;
    completeToken(button);
    if (terrain >= data.length) finish();
  });
}

function renderEmpathyWaves(arena, data) {
  arena.innerHTML = `<div class="wave-cave">${data.map((item) => `<button class="token wave" data-label="${escapeAttr(item.label)}" data-value="${escapeAttr(item.value)}">${item.label}</button>`).join("")}</div><div class="target-row">${shuffle(data).map((item) => `<button class="target-chip" data-care="${escapeAttr(item.value)}">${item.value}</button>`).join("")}</div>`;
  bindPairMatch(arena, "data-care", "The echo matched their feeling.");
}

function renderMicroManners(arena, data) {
  arena.innerHTML = `<div class="market-score">Market kindness: <b>0</b>/5</div><div class="runner-track">${data.map((item) => `<button class="coin token" data-label="${escapeAttr(item.label)}">${item.label}</button>`).join("")}</div>`;
  arena.querySelectorAll(".token").forEach((button) => button.onclick = () => {
    completeToken(button);
    arena.querySelector(".market-score b").textContent = state.score / 10;
  });
}

function renderSolutionPortal(arena, data) {
  arena.innerHTML = `<div class="portal-preview">${sprite("asset-portal", "scene-sprite")}<span>Test a solution before committing.</span></div><div class="creative-grid">${data.map((item, index) => buttonHtml(item, index)).join("")}</div><button class="start-button" id="commit-solution">Commit Best Portal</button>`;
  let best = false;
  arena.querySelectorAll(".token").forEach((button) => button.onclick = () => {
    best = ["calmer", "fair"].includes(button.dataset.value);
    arena.querySelector(".portal-preview").textContent = `Simulation result: ${button.dataset.value}`;
    best ? point("That simulation looks promising.") : miss("Test result warns this plan may hurt.");
  });
  arena.querySelector("#commit-solution").onclick = () => best ? finish() : miss("Simulate a better outcome first.");
}

function renderEcosystemNook(arena, data) {
  arena.innerHTML = `<div class="nature-grid">${data.map((item, index) => buttonHtml(item, index)).join("")}</div><div class="system-readout">${sprite("asset-tree", "scene-sprite")}<span>Plants 40 | Animals 40 | Soil 40 | Future 40</span></div>`;
  const systems = { plants: 40, animals: 40, soil: 40, future: 40 };
  arena.querySelectorAll(".token").forEach((button) => button.onclick = () => {
    systems[button.dataset.value] += 30;
    if (button.dataset.value === "plants") systems.animals += 10;
    if (button.dataset.value === "soil") systems.future += 10;
    arena.querySelector(".system-readout").innerHTML = `${sprite("asset-tree", "scene-sprite")}<span>${Object.entries(systems).map(([key, value]) => `${key} ${value}`).join(" | ")}</span>`;
    completeToken(button);
  });
}

function renderChatGate(arena, data) {
  arena.innerHTML = `<div class="digital-world">${sprite("asset-screen", "scene-sprite")}<span>Gate glow:</span> <meter min="0" max="100" value="50"></meter></div><div class="creative-grid">${data.map((item, index) => buttonHtml(item, index)).join("")}</div>`;
  const meter = arena.querySelector("meter");
  arena.querySelectorAll(".token").forEach((button) => button.onclick = () => {
    if (button.dataset.value === "kind") {
      meter.value = Number(meter.value) + 12;
      completeToken(button);
    } else {
      meter.value = Number(meter.value) - 18;
      miss("The message stream dimmed because that could hurt someone.");
    }
  });
}

function renderRelaxSequence(arena, data) {
  renderSequence(arena, data, "moon-lights", "The meadow calms in a gentle bedtime order.");
}

function renderCollect(arena, data) {
  arena.innerHTML = `<div class="creative-grid">${data.map((item, index) => buttonHtml(item, index)).join("")}</div>`;
  arena.querySelectorAll(".token").forEach((button) => button.onclick = () => completeToken(button));
}

function renderSequence(arena, data, targetClass = "path-target", error = "That step comes later.") {
  arena.innerHTML = `<div class="${targetClass}">${sceneSpriteForTarget(targetClass)}</div><div class="creative-grid">${shuffle(data).map((item, index) => buttonHtml(item, index)).join("")}</div>`;
  let next = 0;
  arena.querySelectorAll(".token").forEach((button) => button.onclick = () => {
    if (button.dataset.label === data[next].label) {
      arena.querySelector(`.${targetClass}`).append(button);
      next += 1;
      completeToken(button);
    } else miss(error);
  });
}

function bindPairMatch(arena, targetAttribute, successMessage) {
  let selected = null;
  arena.querySelectorAll(".token").forEach((button) => button.onclick = () => {
    selected = button;
    markSelected(button);
  });
  arena.querySelectorAll(".target-chip").forEach((chip) => chip.onclick = () => {
    if (!selected) return miss("Choose a matching item first.");
    if (selected.dataset.value !== chip.getAttribute(targetAttribute)) return miss("That match is close, but not specific enough.");
    completeToken(selected);
    chip.disabled = true;
    point(successMessage);
    selected = null;
    if (![...arena.querySelectorAll(".token")].some((item) => !item.disabled)) finish();
  });
}

function chainMood(arena, message) {
  rippleMeters(arena, -12);
  miss(message);
}

function rippleMeters(arena, amount) {
  arena.querySelectorAll("meter").forEach((meter) => {
    meter.value = Math.max(0, Math.min(100, Number(meter.value) + amount));
  });
}

function adjustAllMeters(arena, amount) {
  rippleMeters(arena, amount);
}

function renderBinary(arena, data, goodValue) {
  arena.innerHTML = `<div class="gate-row"><button class="gate good">Allow</button><button class="gate bad">Block</button></div><div class="creative-grid">${data.map((item, index) => buttonHtml(item, index)).join("")}</div>`;
  let chosen = null;
  arena.querySelectorAll(".token").forEach((button) => button.onclick = () => {
    chosen = button;
    markSelected(button);
  });
  arena.querySelector(".good").onclick = () => chosen && (chosen.dataset.value === goodValue ? completeToken(chosen) : miss("That one should be blocked."));
  arena.querySelector(".bad").onclick = () => chosen && (chosen.dataset.value !== goodValue ? completeToken(chosen) : miss("That one should pass."));
}

function renderTap(arena, data) {
  arena.innerHTML = `<div class="potion"><div class="bubble"></div><button class="tap-button">Tap</button><p>${data.map((item) => item.label).join(" -> ")}</p></div>`;
  arena.querySelector(".tap-button").onclick = () => {
    state.progress += 1;
    arena.querySelector(".bubble").style.transform = `scale(${1 + state.progress * 0.16})`;
    point("Good rhythm.");
    if (state.progress >= data.length) finish();
  };
}

function renderMaze(arena, data) {
  arena.innerHTML = `<div class="maze-board"><span class="hero-dot"></span></div><div class="target-row">${["up", "down", "left", "right"].map((dir) => `<button class="target-chip" data-dir="${dir}">${dir}</button>`).join("")}</div>`;
  let step = 0;
  arena.querySelectorAll("[data-dir]").forEach((button) => button.onclick = () => {
    if (button.dataset.dir === data[step].label) {
      step += 1;
      arena.querySelector(".hero-dot").style.transform = `translate(${step * 34}px, ${step % 2 ? 36 : 0}px)`;
      point("Brave step taken.");
      if (step >= data.length) finish();
    } else miss("The path turns another way.");
  });
}

function renderScale(arena, data) {
  arena.innerHTML = `<div class="scale"><div>Need: 5</div><div id="right-pan">Tools: 0</div></div><div class="creative-grid">${data.map((item, index) => buttonHtml(item, index)).join("")}</div>`;
  let total = 0;
  arena.querySelectorAll(".token").forEach((button) => button.onclick = () => {
    total += Number(button.dataset.value);
    arena.querySelector("#right-pan").textContent = `Tools: ${total}`;
    completeToken(button);
    if (total === 5) finish();
    if (total > 5) miss("Too much for this helper. Balance carefully.");
  });
}

function buttonHtml(item, index = 0) {
  return `<button class="token" type="button" data-label="${escapeAttr(item.label)}" data-value="${escapeAttr(item.value || item.label)}">${sprite(assetForItem(item, index), "token-sprite")}<span>${item.label}</span></button>`;
}

function sprite(id, className = "token-sprite") {
  return `<svg class="${className}" viewBox="0 0 64 64" aria-hidden="true"><use href="assets/pixel-assets.svg?v=15#${id}"></use></svg>`;
}

function assetForItem(item, index = 0) {
  const label = `${item.label || ""} ${item.value || ""}`.toLowerCase();
  const byWord = [
    ["bridge", "asset-bridge"],
    ["stone", "asset-stone"],
    ["crown", "asset-crown"],
    ["truth", "asset-tower"],
    ["avoid", "asset-tower"],
    ["thank", "asset-gem"],
    ["gem", "asset-gem"],
    ["dragon", "asset-dragon"],
    ["breath", "asset-wave"],
    ["clock", "asset-clock"],
    ["time", "asset-clock"],
    ["moon", "asset-moon"],
    ["sleep", "asset-moon"],
    ["water", "asset-harbor"],
    ["harbor", "asset-harbor"],
    ["plant", "asset-tree"],
    ["nature", "asset-tree"],
    ["message", "asset-screen"],
    ["online", "asset-screen"],
    ["portal", "asset-portal"],
    ["market", "asset-market"],
    ["bread", "asset-bread"],
    ["path", "asset-path"],
    ["shield", "asset-shield"],
    ["safe", "asset-shield"],
    ["question", "asset-clock"],
    ["team", "asset-trophy"],
    ["role", "asset-trophy"],
    ["feeling", "asset-flower"],
    ["sad", "asset-flower"],
    ["worried", "asset-wave"],
    ["compliment", "asset-word"],
    ["word", "asset-word"]
  ];
  const found = byWord.find(([word]) => label.includes(word));
  if (found) return found[1];
  const ids = PIXEL_ASSETS[game.mechanic] || ["asset-word", "asset-crown", "asset-shield"];
  return ids[index % ids.length];
}

function sceneSpriteForTarget(targetClass) {
  const sceneAssets = {
    "path-target": "asset-path",
    "pass-field": "asset-trophy",
    "moon-lights": "asset-moon",
    "bridge-segments": "asset-bridge"
  };
  return sceneAssets[targetClass] ? sprite(sceneAssets[targetClass], "scene-sprite") : "";
}

function parseDatum(item) {
  const [label, value] = item.split("|");
  return { label, value };
}

function markSelected(button) {
  document.querySelectorAll(".selected").forEach((item) => item.classList.remove("selected"));
  button.classList.add("selected");
}

function completeToken(button) {
  button.classList.add("complete");
  button.disabled = true;
  point("Great choice.");
  if (!document.querySelector("#arena button:not(:disabled):not(.target-chip):not(.gate):not(.tap-button)")) finish();
}

function point(message) {
  state.score += 10;
  state.streak += 1;
  feedback(message);
  sync();
}

function miss(message) {
  state.streak = 0;
  feedback(message);
  sync();
}

function finish() {
  clearInterval(state.timer);
  completionState.gameFinished = true;
  feedback(`Quest complete. ${game.lesson}`);
  syncCompletionStatus();
}

function awardKindnessPoints() {
  const key = "kindKingdomProgress";
  try {
    const progress = JSON.parse(localStorage.getItem(key) || '{"points":100,"completed":[]}');
    progress.completed = Array.isArray(progress.completed) ? progress.completed : [];
    progress.points = Number(progress.points) || 100;
    let awarded = false;
    if (!progress.completed.includes(game.slug)) {
      progress.completed.push(game.slug);
      progress.points += 25;
      awarded = true;
    }
    localStorage.setItem(key, JSON.stringify(progress));
    return { awarded, points: progress.points };
  } catch {
    const progress = { points: 125, completed: [game.slug] };
    localStorage.setItem(key, JSON.stringify(progress));
    return { awarded: true, points: progress.points };
  }
}

function feedback(message) {
  const target = document.querySelector("#feedback");
  if (target) target.textContent = message;
}

function sync() {
  document.querySelector("#time").textContent = state.time;
  document.querySelector("#score").textContent = state.score;
  document.querySelector("#streak").textContent = state.streak;
}

function shuffle(items) {
  return [...items].sort(() => Math.random() - 0.5);
}

function escapeAttr(value) {
  return String(value).replace(/"/g, "&quot;");
}
