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
  const script = KIND_KINGDOM_VIDEO_SCRIPTS[game.slug] || fallbackVideoScript(game);
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

function fallbackVideoScript(game) {
  return {
    narration: [
      `In ${game.title}, a young helper discovers a real-life moment that needs ${game.category.toLowerCase()}.`,
      `The challenge feels tricky because one quick choice could make the problem harder.`,
      `The helper pauses, notices what matters, and practices the ${game.mechanicName.toLowerCase()} skill.`,
      `The kingdom grows brighter when the helper uses ${game.category.toLowerCase()} in daily life.`
    ],
    scenes: [
      game.scene,
      `A choice appears that tests ${game.category.toLowerCase()}.`,
      game.mission,
      game.lesson
    ]
  };
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
  [
    "conflictGates",
    "giftBranches",
    "focusSwarm",
    "boundaryBuoys",
    "mindfulMeteor",
    "friendshipForge",
    "responsibilityRail",
    "forgivenessFlow",
    "leadershipSignals",
    "confidenceCarnival",
    "adaptabilityAirship",
    "conversationCampfire",
    "choiceCompassCircus",
    "memoryMeadow",
    "selfAdvocacySummit",
    "turnTakingWharf",
    "cooperationKitchen",
    "kindnessKiteFestival",
    "perspectivePlanet",
    "conflictCompassCove",
    "careCarousel",
    "communityCaravan",
    "trustTelescope",
    "resilienceReef",
    "creativeSolutionsStudio"
  ].forEach((mechanic) => {
    renderers[mechanic] = renderNewKingdomQuest;
  });
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
  clearInterval(state.timer);
  state.timer = null;

  const challenges = [
    {
      text: "Your tower fell during a building game. Brew patience before trying again.",
      sequence: ["Breathe", "Wait", "Stir", "Wait", "Pour"],
      lesson: "When something falls apart, patience helps you slow down and rebuild."
    },
    {
      text: "You are waiting for your turn, but it feels hard not to interrupt.",
      sequence: ["Breathe", "Wait", "Wait", "Stir", "Pour"],
      lesson: "Waiting becomes easier when you breathe and remind yourself your turn is coming."
    },
    {
      text: "A puzzle is harder than expected. You want to quit quickly.",
      sequence: ["Breathe", "Stir", "Wait", "Breathe", "Pour"],
      lesson: "Trying again works better when you pause and choose a new strategy."
    },
    {
      text: "Someone else is taking longer than you wanted. Brew patience instead of getting upset.",
      sequence: ["Breathe", "Wait", "Breathe", "Stir", "Pour"],
      lesson: "Patience means giving others time without making them feel rushed."
    }
  ];

  let currentRound = 0;
  let localScore = 0;
  let rushes = 0;
  let stability = 50;
  let stepIndex = 0;
  let countdown = 0;
  let roundActive = false;
  let roundComplete = false;
  let timer = null;

  arena.innerHTML = `
    <div class="patience-potion-game">
      <div class="pp-bg"></div>
      <div class="pp-bubbles-bg"></div>
      <section class="pp-screen" data-pp-start>
        <div class="pp-screen-card">
          <div class="pp-big">🧪</div>
          <h2>Patience Potion</h2>
          <p>This potion only works when you stay calm. If you rush, the potion becomes unstable.</p>
          <p>Follow the rhythm: breathe, wait, stir, wait again, then pour.</p>
          <button class="pp-btn gold" type="button" data-pp-begin>Begin Brewing</button>
        </div>
      </section>
      <section class="pp-screen hidden" data-pp-end>
        <div class="pp-screen-card">
          <div class="pp-big">✨</div>
          <h2 data-pp-end-title>Potion Complete!</h2>
          <p data-pp-end-message></p>
          <button class="pp-btn gold" type="button" data-pp-restart>Play Again</button>
        </div>
      </section>
      <div class="pp-content">
        <div class="pp-top">
          <div class="pp-title-card">
            <h2>🧪 Patience Potion</h2>
            <p>Breathe, wait, and act at the right moment. Rushing weakens the potion.</p>
          </div>
          <div class="pp-stats">
            <div class="pp-pill">Round: <span data-pp-round>1</span>/4</div>
            <div class="pp-pill">Score: <span data-pp-score>0</span></div>
            <div class="pp-pill">Rushes: <span data-pp-rushes>0</span></div>
          </div>
        </div>
        <div class="pp-main">
          <div class="pp-panel pp-lab-panel">
            <div class="pp-challenge" data-pp-challenge></div>
            <div class="pp-lab">
              <div class="pp-timer-orb" data-pp-timer>0</div>
              <div class="pp-breath-circle" data-pp-breath>Breathe</div>
              <div class="pp-cauldron" data-pp-cauldron>
                <div class="pp-steam one"></div>
                <div class="pp-steam two"></div>
                <div class="pp-steam three"></div>
                <div class="pp-pot">
                  <div class="pp-liquid" data-pp-liquid></div>
                </div>
              </div>
              <div class="pp-shelf"></div>
            </div>
          </div>
          <div class="pp-panel pp-controls">
            <h2>Brewing Instructions</h2>
            <div class="pp-instructions">Watch the timer orb. Each step becomes ready after a short wait. Click the correct action only when it is ready.</div>
            <div class="pp-sequence" data-pp-sequence></div>
            <div class="pp-action-grid">
              <button class="pp-action" type="button" data-pp-action="Breathe">🌬️ Breathe</button>
              <button class="pp-action" type="button" data-pp-action="Wait">⏳ Wait</button>
              <button class="pp-action" type="button" data-pp-action="Stir">🥄 Stir</button>
              <button class="pp-action" type="button" data-pp-action="Pour">💧 Pour</button>
            </div>
            <div>
              <div class="pp-meter-label"><span>Potion Stability</span><span data-pp-stability-text>50%</span></div>
              <div class="pp-meter"><div class="pp-meter-fill" data-pp-stability-fill></div></div>
            </div>
            <div class="pp-feedback" data-pp-feedback>Press Start Round, then follow the potion rhythm.</div>
            <div class="pp-btn-row">
              <button class="pp-btn" type="button" data-pp-start-round>Start Round</button>
              <button class="pp-btn gold" type="button" data-pp-next>Next Potion</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const q = (selector) => arena.querySelector(selector);
  const buttons = () => [...arena.querySelectorAll("[data-pp-action]")];

  q("[data-pp-begin]").onclick = () => {
    q("[data-pp-start]").classList.add("hidden");
    loadRound();
  };
  q("[data-pp-restart]").onclick = () => {
    clearInterval(timer);
    currentRound = 0;
    localScore = 0;
    rushes = 0;
    stability = 50;
    q("[data-pp-end]").classList.add("hidden");
    loadRound();
  };
  q("[data-pp-start-round]").onclick = startRound;
  q("[data-pp-next]").onclick = nextRound;
  buttons().forEach((button) => button.onclick = () => doAction(button.dataset.ppAction));

  function loadRound() {
    clearInterval(timer);
    stepIndex = 0;
    countdown = 0;
    roundActive = false;
    roundComplete = false;
    stability = Math.max(35, stability);
    const challenge = challenges[currentRound];
    q("[data-pp-challenge]").textContent = challenge.text;
    q("[data-pp-timer]").textContent = "0";
    q("[data-pp-timer]").style.setProperty("--progress", "0%");
    q("[data-pp-feedback]").textContent = "Press Start Round, then follow the potion rhythm.";
    q("[data-pp-liquid]").style.height = "35%";
    q("[data-pp-liquid]").style.background = "linear-gradient(180deg, #7bdff2, #40c9a2)";
    q("[data-pp-breath]").textContent = "Breathe";
    clearReadyButtons();
    updateSequence();
    updateMeters();
    updateStats();
  }

  function startRound() {
    if (roundActive || roundComplete) return;
    roundActive = true;
    stepIndex = 0;
    setNextCountdown();
    q("[data-pp-feedback]").textContent = "The potion is listening. Wait until the correct action glows.";
    timer = setInterval(() => {
      countdown -= 1;
      updateTimerOrb();
      if (countdown <= 0) markReady();
    }, 1000);
  }

  function setNextCountdown() {
    countdown = 3;
    clearReadyButtons();
    updateTimerOrb();
  }

  function updateTimerOrb() {
    q("[data-pp-timer]").textContent = countdown > 0 ? countdown : "Ready";
    const progress = countdown > 0 ? ((3 - countdown) / 3) * 100 : 100;
    q("[data-pp-timer]").style.setProperty("--progress", `${progress}%`);
  }

  function markReady() {
    clearReadyButtons();
    const expected = challenges[currentRound].sequence[stepIndex];
    q(`[data-pp-action="${expected}"]`).classList.add("ready");
    q("[data-pp-feedback]").textContent = `${expected} is ready. Click it now, calmly.`;
  }

  function clearReadyButtons() {
    buttons().forEach((button) => button.classList.remove("ready"));
  }

  function doAction(action) {
    if (!roundActive || roundComplete) {
      q("[data-pp-feedback]").textContent = "Start the round before choosing actions.";
      return;
    }
    const expected = challenges[currentRound].sequence[stepIndex];
    if (countdown > 0) {
      rushes += 1;
      stability -= 12;
      q("[data-pp-feedback]").textContent = "Too early. That was rushing. Wait until the action is ready.";
      shakePotion();
      updateMeters();
      updateStats();
      return;
    }
    if (action !== expected) {
      rushes += 1;
      stability -= 15;
      q("[data-pp-feedback]").textContent = `Wrong action. The potion needed ${expected}, not ${action}.`;
      shakePotion();
      updateMeters();
      updateStats();
      return;
    }

    localScore += 25;
    stability += 10;
    stepIndex += 1;
    animateAction(action);
    spark("✨");
    if (stepIndex >= challenges[currentRound].sequence.length) {
      finishRound();
    } else {
      q("[data-pp-feedback]").textContent = `Good patience. Step ${stepIndex} completed. Wait for the next glow.`;
      updateSequence();
      setNextCountdown();
    }
    state.score = localScore;
    state.streak += 1;
    updateMeters();
    updateStats();
    sync();
  }

  function finishRound() {
    roundComplete = true;
    roundActive = false;
    clearInterval(timer);
    clearReadyButtons();
    const bonus = Math.max(0, Math.round(stability));
    localScore += bonus;
    state.score = localScore;
    q("[data-pp-liquid]").style.height = "75%";
    q("[data-pp-liquid]").style.background = "linear-gradient(180deg, #ffd166, #40c9a2)";
    q("[data-pp-feedback]").textContent = `Potion complete! ${challenges[currentRound].lesson}`;
    spark("🧪");
    updateSequence();
    updateMeters();
    updateStats();
    sync();
  }

  function nextRound() {
    if (!roundComplete) {
      q("[data-pp-feedback]").textContent = "Complete this potion before moving to the next one.";
      return;
    }
    currentRound += 1;
    if (currentRound >= challenges.length) endGame();
    else loadRound();
  }

  function updateSequence() {
    const sequence = challenges[currentRound].sequence;
    q("[data-pp-sequence]").innerHTML = sequence.map((step, index) => {
      if (index < stepIndex) return `✅ ${step}`;
      if (index === stepIndex && roundActive) return `➡️ ${step}`;
      return `⬜ ${step}`;
    }).join(" &nbsp; ");
  }

  function updateMeters() {
    stability = Math.max(0, Math.min(100, stability));
    q("[data-pp-stability-fill]").style.width = `${stability}%`;
    q("[data-pp-stability-text]").textContent = `${Math.round(stability)}%`;
    q("[data-pp-liquid]").style.boxShadow = `0 0 ${18 + stability / 2}px rgba(123,223,242,.75)`;
  }

  function updateStats() {
    q("[data-pp-round]").textContent = Math.min(currentRound + 1, challenges.length);
    q("[data-pp-score]").textContent = localScore;
    q("[data-pp-rushes]").textContent = rushes;
  }

  function animateAction(action) {
    if (action === "Breathe") {
      q("[data-pp-breath]").textContent = "Calm";
      stability += 2;
    }
    if (action === "Wait") q("[data-pp-breath]").textContent = "Wait";
    if (action === "Stir") q("[data-pp-liquid]").style.height = `${Math.min(75, 35 + stepIndex * 8)}%`;
    if (action === "Pour") q("[data-pp-liquid]").style.height = "70%";
  }

  function shakePotion() {
    q("[data-pp-cauldron]").animate(
      [
        { transform: "translateX(-50%) rotate(0deg)" },
        { transform: "translateX(-50%) rotate(-5deg)" },
        { transform: "translateX(-50%) rotate(5deg)" },
        { transform: "translateX(-50%) rotate(0deg)" }
      ],
      { duration: 350, iterations: 1 }
    );
    q("[data-pp-liquid]").style.background = "linear-gradient(180deg, #ff7eb3, #7c4dff)";
    state.streak = 0;
    sync();
  }

  function endGame() {
    clearInterval(timer);
    let title = "Potion Complete!";
    let message = "";
    if (localScore >= 520 && rushes <= 3) {
      title = "Patience Potion Master!";
      message = `Amazing work! Your score was ${localScore}. You stayed calm, waited for the right moment, and brewed with patience.`;
    } else if (localScore >= 380) {
      title = "Calm Brewer!";
      message = `Great job! Your score was ${localScore}. You showed that patience means breathing, waiting, and trying carefully.`;
    } else {
      title = "Potion Apprentice!";
      message = `Your score was ${localScore}. Keep practicing. Rushing makes things harder, but breathing and waiting help you try again.`;
    }
    q("[data-pp-end-title]").textContent = title;
    q("[data-pp-end-message]").textContent = message;
    q("[data-pp-end]").classList.remove("hidden");
    finish();
  }

  function spark(symbol) {
    for (let i = 0; i < 13; i += 1) {
      const sparkle = document.createElement("div");
      sparkle.className = "pp-spark";
      sparkle.textContent = symbol;
      sparkle.style.left = `${Math.random() * 85 + 8}%`;
      sparkle.style.top = `${Math.random() * 60 + 18}%`;
      q(".patience-potion-game").append(sparkle);
      setTimeout(() => sparkle.remove(), 850);
    }
  }
}

function renderHiddenNeeds(arena) {
  clearInterval(state.timer);
  state.timer = null;

  const customers = [
    {
      emoji: "🧑‍🎨",
      card: "Lina spilled paint on her project and says, “I ruined everything. I do not even want to look at it.”",
      speech: "I ruined everything...",
      need: "Encouragement first",
      help: "Say, “That feels frustrating. Let’s take one small step and see what can be fixed.”",
      tray: "🧁",
      wrongNeeds: ["A lecture", "Being ignored", "Someone taking over"],
      wrongHelps: ["Say, “You should have been more careful.”", "Grab the project and fix it without asking.", "Say nothing and walk away."]
    },
    {
      emoji: "🎻",
      card: "Marcus is stuck on a tricky music part and says, “I practiced, but I still cannot get this measure right.”",
      speech: "I can’t get this part right.",
      need: "Practice support",
      help: "Say, “Want to slow it down and practice that one measure together?”",
      tray: "🥨",
      wrongNeeds: ["A joke", "Space only", "Blame"],
      wrongHelps: ["Say, “Just play it faster.”", "Tell him everyone else already knows it.", "Change the subject."]
    },
    {
      emoji: "🧩",
      card: "Ava is quiet during group work. She says, “It is fine,” but she keeps looking at the materials and not joining in.",
      speech: "It’s fine...",
      need: "A chance to join",
      help: "Say, “Would you like to choose the next piece or share an idea?”",
      tray: "🥐",
      wrongNeeds: ["To be rushed", "To be teased", "To be corrected loudly"],
      wrongHelps: ["Say, “Why are you being so quiet?”", "Give her job to someone else.", "Tell the group she is not helping."]
    },
    {
      emoji: "📚",
      card: "Noah forgot his notes and says, “I am going to fail now.” He is panicking and flipping through his backpack.",
      speech: "I’m going to fail now.",
      need: "Calm problem-solving",
      help: "Say, “Take a breath. Let’s think of options, borrow notes, ask the teacher, or review together.”",
      tray: "🍪",
      wrongNeeds: ["More panic", "Criticism", "A competition"],
      wrongHelps: ["Say, “Yeah, that is bad.”", "Tell him you got everything right.", "Laugh and say he should remember next time."]
    },
    {
      emoji: "🧹",
      card: "Maya is cleaning up alone after an activity. She says, “I guess I will do it,” while everyone else leaves.",
      speech: "I guess I’ll do it...",
      need: "Real action help",
      help: "Say, “I can help. I’ll put away the supplies while you stack the bins.”",
      tray: "🍩",
      wrongNeeds: ["Only a compliment", "Being watched", "A random story"],
      wrongHelps: ["Say, “Good luck,” and leave.", "Tell her she is great at cleaning.", "Stand there and talk about your weekend."]
    }
  ];

  let current = 0;
  let localScore = 0;
  let orders = 0;
  let helpfulness = 50;
  let selectedNeed = null;
  let selectedHelp = null;
  let served = false;

  arena.innerHTML = `
    <div class="helping-bakery-game">
      <div class="hb-bg"></div>
      <div class="hb-counter"></div>
      <section class="hb-screen" data-hb-start>
        <div class="hb-screen-card">
          <div class="hb-big">🍞</div>
          <h2>Helping Hands Bakery</h2>
          <p>Every customer needs a different kind of help. Some need encouragement, some need space, and some need action.</p>
          <p>Read the clues, choose what they really need, then prepare the right help order.</p>
          <button class="hb-btn teal" type="button" data-hb-open>Open Bakery</button>
        </div>
      </section>
      <section class="hb-screen hidden" data-hb-end>
        <div class="hb-screen-card">
          <div class="hb-big">🥐</div>
          <h2 data-hb-end-title>Bakery Complete!</h2>
          <p data-hb-end-message></p>
          <button class="hb-btn teal" type="button" data-hb-restart>Play Again</button>
        </div>
      </section>
      <div class="hb-content">
        <div class="hb-top">
          <div class="hb-title-card">
            <h2>🍞 Helping Hands Bakery</h2>
            <p>Notice what kind of help someone actually needs.</p>
          </div>
          <div class="hb-stats">
            <div class="hb-pill">Customer: <span data-hb-round>1</span>/5</div>
            <div class="hb-pill">Score: <span data-hb-score>0</span></div>
            <div class="hb-pill">Orders: <span data-hb-orders>0</span> 🥐</div>
          </div>
        </div>
        <div class="hb-main">
          <div class="hb-panel hb-bakery-panel">
            <div class="hb-customer-card" data-hb-card></div>
            <div class="hb-scene">
              <div class="hb-speech" data-hb-speech></div>
              <div class="hb-customer" data-hb-customer>🧒</div>
              <div class="hb-tray" data-hb-tray>🍽️</div>
              <div class="hb-help-label" data-hb-label>No help order prepared yet</div>
            </div>
          </div>
          <div class="hb-panel hb-controls">
            <h2>How to Play</h2>
            <div class="hb-instructions">Read what the customer says, pick what they really need, choose the best helping action, then serve the order.</div>
            <div>
              <div class="hb-station-title">1. What does this person really need?</div>
              <div class="hb-options" data-hb-needs></div>
            </div>
            <div>
              <div class="hb-station-title">2. What help should you give?</div>
              <div class="hb-options" data-hb-helps></div>
            </div>
            <div>
              <div class="hb-meter-label"><span>Helpfulness Meter</span><span data-hb-help-text>50%</span></div>
              <div class="hb-meter"><div class="hb-meter-fill" data-hb-help-fill></div></div>
            </div>
            <div class="hb-feedback" data-hb-feedback>Choose the need first, then choose the best helping action.</div>
            <div class="hb-btn-row">
              <button class="hb-btn" type="button" data-hb-serve>Serve Help Order</button>
              <button class="hb-btn teal" type="button" data-hb-next>Next Customer</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const q = (selector) => arena.querySelector(selector);
  q("[data-hb-open]").onclick = () => {
    q("[data-hb-start]").classList.add("hidden");
    loadCustomer();
  };
  q("[data-hb-restart]").onclick = () => {
    current = 0;
    localScore = 0;
    orders = 0;
    helpfulness = 50;
    q("[data-hb-end]").classList.add("hidden");
    loadCustomer();
  };
  q("[data-hb-serve]").onclick = serveOrder;
  q("[data-hb-next]").onclick = nextCustomer;

  function loadCustomer() {
    const customer = customers[current];
    selectedNeed = null;
    selectedHelp = null;
    served = false;
    q("[data-hb-card]").textContent = customer.card;
    q("[data-hb-speech]").textContent = customer.speech;
    q("[data-hb-customer]").textContent = customer.emoji;
    q("[data-hb-tray]").textContent = "🍽️";
    q("[data-hb-label]").textContent = "No help order prepared yet";
    q("[data-hb-feedback]").textContent = "Choose the need first, then choose the best helping action.";
    renderNeedOptions();
    renderHelpOptions();
    updateStats();
    updateMeter();
  }

  function renderNeedOptions() {
    const customer = customers[current];
    q("[data-hb-needs]").innerHTML = "";
    shuffle([customer.need, ...customer.wrongNeeds]).forEach((need) => {
      const button = document.createElement("button");
      button.className = "hb-option";
      button.type = "button";
      button.textContent = need;
      button.onclick = () => {
        if (served) return;
        selectedNeed = need;
        q("[data-hb-needs]").querySelectorAll(".hb-option").forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
        q("[data-hb-feedback]").textContent = "Good. Now choose the action that matches this need.";
      };
      q("[data-hb-needs]").append(button);
    });
  }

  function renderHelpOptions() {
    const customer = customers[current];
    q("[data-hb-helps]").innerHTML = "";
    shuffle([customer.help, ...customer.wrongHelps]).forEach((help) => {
      const button = document.createElement("button");
      button.className = "hb-option";
      button.type = "button";
      button.textContent = help;
      button.onclick = () => {
        if (served) return;
        selectedHelp = help;
        q("[data-hb-helps]").querySelectorAll(".hb-option").forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
        q("[data-hb-label]").textContent = "Help order prepared";
        q("[data-hb-feedback]").textContent = "Action chosen. Serve the help order to see if it works.";
      };
      q("[data-hb-helps]").append(button);
    });
  }

  function serveOrder() {
    if (served) {
      q("[data-hb-feedback]").textContent = "This order has already been served. Move to the next customer.";
      return;
    }
    if (!selectedNeed || !selectedHelp) {
      q("[data-hb-feedback]").textContent = "Choose both the real need and the helping action before serving.";
      return;
    }
    const customer = customers[current];
    const needCorrect = selectedNeed === customer.need;
    const helpCorrect = selectedHelp === customer.help;
    served = true;
    if (needCorrect && helpCorrect) {
      localScore += 100;
      orders += 1;
      helpfulness += 18;
      q("[data-hb-tray]").textContent = customer.tray;
      q("[data-hb-customer]").style.transform = "scale(1.08)";
      q("[data-hb-feedback]").textContent = "Perfect help order! You noticed the real need and chose help that matched it.";
      state.streak += 1;
      spark("🥐");
    } else if (needCorrect && !helpCorrect) {
      localScore += 55;
      helpfulness += 4;
      q("[data-hb-tray]").textContent = "🥖";
      q("[data-hb-feedback]").textContent = "You understood the need, but the action did not fully help. Good helpers match their action to the person's need.";
      state.streak = 0;
    } else if (!needCorrect && helpCorrect) {
      localScore += 45;
      helpfulness += 2;
      q("[data-hb-tray]").textContent = "🍞";
      q("[data-hb-feedback]").textContent = "The action was kind, but you misread the need. Look for clues in words, tone, and behavior.";
      state.streak = 0;
    } else {
      localScore += 10;
      helpfulness -= 14;
      q("[data-hb-tray]").textContent = "🥀";
      q("[data-hb-customer]").style.transform = "rotate(-4deg)";
      q("[data-hb-feedback]").textContent = `That help did not match. This customer needed: ${customer.need}.`;
      state.streak = 0;
    }
    state.score = localScore;
    updateStats();
    updateMeter();
    sync();
    setTimeout(() => { q("[data-hb-customer]").style.transform = "none"; }, 500);
  }

  function nextCustomer() {
    if (!served) {
      q("[data-hb-feedback]").textContent = "Serve the help order before moving to the next customer.";
      return;
    }
    current += 1;
    if (current >= customers.length) endGame();
    else loadCustomer();
  }

  function updateStats() {
    q("[data-hb-round]").textContent = Math.min(current + 1, customers.length);
    q("[data-hb-score]").textContent = localScore;
    q("[data-hb-orders]").textContent = orders;
  }

  function updateMeter() {
    helpfulness = Math.max(0, Math.min(100, helpfulness));
    q("[data-hb-help-fill]").style.width = `${helpfulness}%`;
    q("[data-hb-help-text]").textContent = `${Math.round(helpfulness)}%`;
  }

  function endGame() {
    let title = "Bakery Complete!";
    let message = "";
    if (localScore >= 430) {
      title = "Master Helper!";
      message = `Amazing work! Your score was ${localScore}. You noticed what people actually needed and gave help that matched.`;
    } else if (localScore >= 300) {
      title = "Kind Helper!";
      message = `Great job! Your score was ${localScore}. You are learning that helpfulness means listening for the real need.`;
    } else {
      title = "Helping Apprentice!";
      message = `Your score was ${localScore}. Keep practicing. Before helping, ask: what does this person actually need?`;
    }
    q("[data-hb-end-title]").textContent = title;
    q("[data-hb-end-message]").textContent = message;
    q("[data-hb-end]").classList.remove("hidden");
    finish();
  }

  function spark(symbol) {
    for (let i = 0; i < 14; i += 1) {
      const sparkle = document.createElement("div");
      sparkle.className = "hb-spark";
      sparkle.textContent = symbol;
      sparkle.style.left = `${Math.random() * 85 + 8}%`;
      sparkle.style.top = `${Math.random() * 60 + 18}%`;
      q(".helping-bakery-game").append(sparkle);
      setTimeout(() => sparkle.remove(), 850);
    }
  }
}

function renderTruthTimeline(arena) {
  clearInterval(state.timer);
  state.timer = null;

  const rounds = [
    {
      scenario: "You accidentally broke a classroom ruler while using it. No one saw it happen.",
      correct: "Tell the teacher what happened and offer to help replace it.",
      choices: [
        "Tell the teacher what happened and offer to help replace it.",
        "Put it back and hope nobody notices.",
        "Say someone else probably broke it."
      ],
      cover: "At first, you avoid trouble. Later, someone else may get blamed and trust gets weaker.",
      truth: "It feels scary at first, but the teacher sees that you are responsible and honest."
    },
    {
      scenario: "Your friend asks if you finished your part of the project, but you forgot to do it.",
      correct: "Admit you forgot, apologize, and explain your plan to finish it.",
      choices: [
        "Say it is done even though it is not.",
        "Admit you forgot, apologize, and explain your plan to finish it.",
        "Blame your computer even though that is not true."
      ],
      cover: "The lie buys time, but the group may be unprepared and upset later.",
      truth: "Your friend may be disappointed, but now the group can make a real plan."
    },
    {
      scenario: "You got a lower quiz grade than expected. Your parent asks how the quiz went.",
      correct: "Tell the truth and ask for help studying differently next time.",
      choices: [
        "Say you did great so they do not ask questions.",
        "Hide the quiz paper in your backpack.",
        "Tell the truth and ask for help studying differently next time."
      ],
      cover: "Hiding it avoids an awkward talk, but the problem does not get solved.",
      truth: "The conversation might be hard, but it opens the door to support and improvement."
    },
    {
      scenario: "During a game, the ball touched your hand, but the referee did not notice.",
      correct: "Admit it touched your hand, even if your team loses the point.",
      choices: [
        "Stay quiet because winning matters most.",
        "Admit it touched your hand, even if your team loses the point.",
        "Tell your teammates not to say anything."
      ],
      cover: "You may keep the point, but the game becomes less fair.",
      truth: "You might lose the point, but everyone knows you care about fairness."
    },
    {
      scenario: "You used AI to write too much of an assignment. Your teacher asks if it is fully your own work.",
      correct: "Be honest, explain what happened, and ask how to fix it properly.",
      choices: [
        "Be honest, explain what happened, and ask how to fix it properly.",
        "Say yes because the teacher might not know.",
        "Change a few words and pretend it is all yours."
      ],
      cover: "It may seem easier now, but it can damage trust if discovered.",
      truth: "It takes courage, but you can repair the mistake and learn the right way."
    }
  ];

  let current = 0;
  let selectedChoice = null;
  let revealed = false;
  let score = 0;
  let light = 0;
  let trust = 50;

  arena.innerHTML = `
    <div class="truth-tower-game">
      <div class="tt-bg"></div>
      <div class="tt-stars"></div>
      <section class="tt-screen" data-tt-start>
        <div class="tt-screen-card">
          <div class="tt-big">🗼</div>
          <h2>Truth-Teller Tower</h2>
          <p>Every difficult choice creates two timelines. One path hides the truth, the other path tells the truth bravely.</p>
          <p>Read the situation, choose what to do, then reveal the short-term and long-term consequences.</p>
          <button class="tt-btn gold" type="button" data-tt-enter>Enter the Tower</button>
        </div>
      </section>
      <section class="tt-screen hidden" data-tt-end>
        <div class="tt-screen-card">
          <div class="tt-big">✨</div>
          <h2 data-tt-end-title>Tower Complete!</h2>
          <p data-tt-end-message></p>
          <button class="tt-btn gold" type="button" data-tt-restart>Play Again</button>
        </div>
      </section>
      <div class="tt-content">
        <div class="tt-top">
          <div class="tt-title-card">
            <h2>🗼 Truth-Teller Tower</h2>
            <p>Compare the cover-up path and the truth path.</p>
          </div>
          <div class="tt-stats">
            <div class="tt-pill">Choice: <span data-tt-round>1</span>/5</div>
            <div class="tt-pill">Score: <span data-tt-score>0</span></div>
            <div class="tt-pill">Light: <span data-tt-light>0</span> ✨</div>
          </div>
        </div>
        <div class="tt-main">
          <div class="tt-panel tt-tower-panel">
            <div class="tt-scenario" data-tt-scenario></div>
            <div class="tt-timeline-stage">
              <div class="tt-path cover">
                <div class="tt-path-title">🌑 Cover-Up Path</div>
                <div class="tt-tower" data-tt-cover-tower></div>
                <div class="tt-path-note" data-tt-cover-note>This path is hidden until you reveal consequences.</div>
              </div>
              <div class="tt-path truth">
                <div class="tt-path-title">☀️ Truth Path</div>
                <div class="tt-tower" data-tt-truth-tower></div>
                <div class="tt-path-note" data-tt-truth-note>This path is hidden until you reveal consequences.</div>
              </div>
            </div>
          </div>
          <div class="tt-panel tt-controls">
            <h2>How to Play</h2>
            <div class="tt-instructions">
              Choose the most honest and responsible action. Then press “Reveal Timelines” to see how hiding the truth compares to telling the truth.
            </div>
            <div class="tt-choice-grid" data-tt-choices></div>
            <div>
              <div class="tt-meter-label"><span>Trust Light</span><span data-tt-trust-label>50%</span></div>
              <div class="tt-meter"><div data-tt-trust-fill></div></div>
            </div>
            <div class="tt-feedback" data-tt-feedback>Pick the choice that tells the truth and takes responsibility.</div>
            <div class="tt-btn-row">
              <button class="tt-btn" type="button" data-tt-reveal>Reveal Timelines</button>
              <button class="tt-btn gold" type="button" data-tt-next>Next Choice</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const q = (selector) => arena.querySelector(selector);

  q("[data-tt-enter]").onclick = () => {
    q("[data-tt-start]").classList.add("hidden");
    loadRound();
  };
  q("[data-tt-restart]").onclick = () => {
    current = 0;
    selectedChoice = null;
    revealed = false;
    score = 0;
    light = 0;
    trust = 50;
    q("[data-tt-end]").classList.add("hidden");
    loadRound();
  };
  q("[data-tt-reveal]").onclick = revealTimelines;
  q("[data-tt-next]").onclick = nextChoice;

  function loadRound() {
    const round = rounds[current];
    selectedChoice = null;
    revealed = false;
    q("[data-tt-scenario]").textContent = round.scenario;
    q("[data-tt-feedback]").textContent = "Pick the choice that tells the truth and takes responsibility.";
    q("[data-tt-cover-note]").textContent = "This path is hidden until you reveal consequences.";
    q("[data-tt-truth-note]").textContent = "This path is hidden until you reveal consequences.";
    renderChoices();
    renderTowers(0, 0);
    updateStats();
    updateTrust();
  }

  function renderChoices() {
    const round = rounds[current];
    q("[data-tt-choices]").innerHTML = "";
    shuffle(round.choices).forEach((choice) => {
      const button = document.createElement("button");
      button.className = "tt-choice";
      button.type = "button";
      button.textContent = choice;
      button.onclick = () => {
        if (revealed) return;
        selectedChoice = choice;
        q("[data-tt-choices]").querySelectorAll(".tt-choice").forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
        q("[data-tt-feedback]").textContent = "Choice selected. Reveal the timelines to see the consequences.";
      };
      q("[data-tt-choices]").append(button);
    });
  }

  function renderTowers(coverStrength, truthStrength) {
    q("[data-tt-cover-tower]").innerHTML = "";
    q("[data-tt-truth-tower]").innerHTML = "";
    for (let i = 1; i <= 5; i += 1) {
      const coverBlock = document.createElement("div");
      coverBlock.className = `tt-block${i <= coverStrength ? " crack" : ""}`;
      q("[data-tt-cover-tower]").append(coverBlock);

      const truthBlock = document.createElement("div");
      truthBlock.className = `tt-block${i <= truthStrength ? " active" : ""}`;
      q("[data-tt-truth-tower]").append(truthBlock);
    }
  }

  function revealTimelines() {
    if (revealed) {
      q("[data-tt-feedback]").textContent = "Timelines already revealed. Move to the next choice.";
      return;
    }
    if (!selectedChoice) {
      q("[data-tt-feedback]").textContent = "Choose an action first.";
      return;
    }
    const round = rounds[current];
    const honest = selectedChoice === round.correct;
    revealed = true;
    q("[data-tt-cover-note]").textContent = round.cover;
    q("[data-tt-truth-note]").textContent = round.truth;
    if (honest) {
      score += 100;
      light += 2;
      trust += 18;
      renderTowers(1, 5);
      q("[data-tt-feedback]").textContent = "Strong truth-telling! You chose honesty even though it might feel difficult at first.";
      state.streak += 1;
      sparkle("✨");
    } else {
      score += 20;
      trust -= 16;
      renderTowers(5, 2);
      q("[data-tt-feedback]").textContent = `That choice hides the truth. A stronger choice would be: ${round.correct}`;
      state.streak = 0;
      sparkle("🌑");
    }
    state.score = score;
    updateStats();
    updateTrust();
    sync();
  }

  function nextChoice() {
    if (!revealed) {
      q("[data-tt-feedback]").textContent = "Reveal the timelines before moving on.";
      return;
    }
    current += 1;
    if (current >= rounds.length) {
      endTower();
    } else {
      loadRound();
    }
  }

  function updateTrust() {
    trust = Math.max(0, Math.min(100, trust));
    q("[data-tt-trust-fill]").style.width = `${trust}%`;
    q("[data-tt-trust-label]").textContent = `${Math.round(trust)}%`;
  }

  function updateStats() {
    q("[data-tt-round]").textContent = Math.min(current + 1, rounds.length);
    q("[data-tt-score]").textContent = score;
    q("[data-tt-light]").textContent = light;
  }

  function endTower() {
    let title = "Tower Complete!";
    let message = "";
    if (score >= 430) {
      title = "Truth-Teller Champion!";
      message = `Amazing work! Your score was ${score}. You showed that honesty builds trust, even when telling the truth feels difficult.`;
    } else if (score >= 300) {
      title = "Brave Truth Builder!";
      message = `Great job! Your score was ${score}. You are learning that telling the truth helps repair problems faster.`;
    } else {
      title = "Truth Apprentice!";
      message = `Your score was ${score}. Keep practicing. A brave truth admits what happened and helps make things right.`;
    }
    q("[data-tt-end-title]").textContent = title;
    q("[data-tt-end-message]").textContent = message;
    q("[data-tt-end]").classList.remove("hidden");
    finish();
  }

  function sparkle(symbol) {
    for (let i = 0; i < 14; i += 1) {
      const spark = document.createElement("div");
      spark.className = "tt-spark";
      spark.textContent = symbol;
      spark.style.left = `${Math.random() * 85 + 8}%`;
      spark.style.top = `${Math.random() * 60 + 18}%`;
      q(".truth-tower-game").append(spark);
      setTimeout(() => spark.remove(), 850);
    }
  }
}

function renderMemoryLink(arena) {
  clearInterval(state.timer);
  state.timer = null;

  const gems = [
    {
      memory: "You were nervous before presenting your project. Someone practiced with you and helped you feel more ready.",
      person: "my friend",
      action: "practiced my presentation with me",
      impact: "it helped me feel more confident",
      note: "Thank you for practicing my presentation with me. It helped me feel more confident."
    },
    {
      memory: "You dropped your supplies in the hallway. Someone stopped, helped pick them up, and waited until you were okay.",
      person: "my classmate",
      action: "helped me pick up my supplies",
      impact: "it made a stressful moment easier",
      note: "Thank you for helping me pick up my supplies. It made a stressful moment easier."
    },
    {
      memory: "You did not understand the homework. Someone explained it patiently without making you feel embarrassed.",
      person: "my teacher",
      action: "explained the homework patiently",
      impact: "it helped me understand without feeling embarrassed",
      note: "Thank you for explaining the homework patiently. It helped me understand without feeling embarrassed."
    },
    {
      memory: "You felt left out during a group activity. Someone invited you to join and gave you a role.",
      person: "my teammate",
      action: "invited me to join and gave me a role",
      impact: "it helped me feel included",
      note: "Thank you for inviting me to join and giving me a role. It helped me feel included."
    },
    {
      memory: "You were having a hard day. Someone noticed and asked if you wanted to talk or take a quiet break.",
      person: "my counselor",
      action: "noticed I was having a hard day",
      impact: "it reminded me that someone cared",
      note: "Thank you for noticing I was having a hard day. It reminded me that someone cared."
    }
  ];
  const wrongPeople = ["a random stranger", "nobody", "my backpack", "the weather", "a video game"];
  const wrongActions = ["said something random", "walked away quickly", "changed the subject", "made the problem harder", "ignored what happened"];
  const wrongImpacts = ["it did not matter", "it made everyone confused", "it was just lucky", "it made me stop trying", "it was not connected"];

  let current = 0;
  let selectedPerson = null;
  let selectedAction = null;
  let selectedImpact = null;
  let localScore = 0;
  let polished = 0;
  let clarity = 30;
  let completed = false;

  arena.innerHTML = `
    <div class="gratitude-gems-game">
      <div class="gg-cave-bg"></div>
      <div class="gg-crystal-dots"></div>
      <section class="gg-screen" data-gg-start>
        <div class="gg-screen-card">
          <div class="gg-big">💎</div>
          <h2>Gratitude Gems</h2>
          <p>A vague “thanks” is like a rough crystal. A meaningful thank-you becomes brighter when it names who helped, what they did, and why it mattered.</p>
          <p>Cut the gratitude gem in three steps: Person, Action, and Impact.</p>
          <button class="gg-btn gold" type="button" data-gg-enter>Enter the Crystal Cave</button>
        </div>
      </section>
      <section class="gg-screen hidden" data-gg-end>
        <div class="gg-screen-card">
          <div class="gg-big">✨</div>
          <h2 data-gg-end-title>Gems Complete!</h2>
          <p data-gg-end-message></p>
          <button class="gg-btn gold" type="button" data-gg-restart>Play Again</button>
        </div>
      </section>
      <div class="gg-content">
        <div class="gg-top">
          <div class="gg-title-card">
            <h2>💎 Gratitude Gems</h2>
            <p>Polish a thank-you by linking it to a real memory and impact.</p>
          </div>
          <div class="gg-stats">
            <div class="gg-pill">Gem: <span data-gg-round>1</span>/5</div>
            <div class="gg-pill">Score: <span data-gg-score>0</span></div>
            <div class="gg-pill">Polished: <span data-gg-polished>0</span> 💎</div>
          </div>
        </div>
        <div class="gg-main">
          <div class="gg-panel gg-gem-panel">
            <div class="gg-memory-card" data-gg-memory></div>
            <div class="gg-stage" data-gg-stage>
              <div class="gg-gem rough" data-gg-gem>💎</div>
              <div class="gg-table"></div>
              <div class="gg-note" data-gg-note>Your gratitude message will appear here.</div>
            </div>
          </div>
          <div class="gg-panel gg-controls">
            <h2>How to Play</h2>
            <div class="gg-instructions">Choose one option from each section. A strong thank-you should include who helped, what they did, and why it mattered.</div>
            <div>
              <div class="gg-section-title">1. Who helped?</div>
              <div class="gg-choice-group" data-gg-person></div>
            </div>
            <div>
              <div class="gg-section-title">2. What did they do?</div>
              <div class="gg-choice-group" data-gg-action></div>
            </div>
            <div>
              <div class="gg-section-title">3. Why did it matter?</div>
              <div class="gg-choice-group" data-gg-impact></div>
            </div>
            <div>
              <div class="gg-meter-label"><span>Gem Clarity</span><span data-gg-clarity-text>30%</span></div>
              <div class="gg-meter"><div data-gg-clarity-fill></div></div>
            </div>
            <div class="gg-feedback" data-gg-feedback>Start by choosing who deserves the thank-you.</div>
            <div class="gg-btn-row">
              <button class="gg-btn" type="button" data-gg-polish>Polish Gem</button>
              <button class="gg-btn gold" type="button" data-gg-next>Next Gem</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const q = (selector) => arena.querySelector(selector);

  q("[data-gg-enter]").onclick = () => {
    q("[data-gg-start]").classList.add("hidden");
    loadGem();
  };
  q("[data-gg-restart]").onclick = () => {
    current = 0;
    selectedPerson = null;
    selectedAction = null;
    selectedImpact = null;
    localScore = 0;
    polished = 0;
    clarity = 30;
    completed = false;
    q("[data-gg-end]").classList.add("hidden");
    loadGem();
  };
  q("[data-gg-polish]").onclick = polishGem;
  q("[data-gg-next]").onclick = nextGem;

  function loadGem() {
    const gemData = gems[current];
    selectedPerson = null;
    selectedAction = null;
    selectedImpact = null;
    completed = false;
    clarity = 30;
    q("[data-gg-memory]").textContent = gemData.memory;
    q("[data-gg-note]").textContent = "Your gratitude message will appear here.";
    q("[data-gg-gem]").textContent = "💎";
    q("[data-gg-gem]").className = "gg-gem rough";
    q("[data-gg-feedback]").textContent = "Start by choosing who deserves the thank-you.";
    renderChoices("person", q("[data-gg-person]"), gemData.person, wrongPeople);
    renderChoices("action", q("[data-gg-action]"), gemData.action, wrongActions);
    renderChoices("impact", q("[data-gg-impact]"), gemData.impact, wrongImpacts);
    updateStats();
    updateClarity();
  }

  function renderChoices(type, container, correct, wrongList) {
    container.innerHTML = "";
    shuffle([correct, ...shuffle(wrongList).slice(0, 2)]).forEach((choice) => {
      const button = document.createElement("button");
      button.className = "gg-choice";
      button.type = "button";
      button.textContent = choice;
      button.onclick = () => {
        if (completed) return;
        if (type === "person") selectedPerson = choice;
        if (type === "action") selectedAction = choice;
        if (type === "impact") selectedImpact = choice;
        [...container.children].forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
        updatePreview();
        q("[data-gg-feedback]").textContent = "Good. Keep choosing pieces until your gratitude gem has all three parts.";
      };
      container.append(button);
    });
  }

  function updatePreview() {
    const person = selectedPerson || "someone";
    const action = selectedAction || "did something helpful";
    const impact = selectedImpact || "it mattered";
    q("[data-gg-note]").textContent = `Thank you, ${person}, for ${action}. ${capitalize(impact)}.`;
    let pieces = 0;
    if (selectedPerson) pieces += 1;
    if (selectedAction) pieces += 1;
    if (selectedImpact) pieces += 1;
    clarity = 30 + pieces * 15;
    updateClarity();
    if (pieces === 1) {
      q("[data-gg-gem]").className = "gg-gem rough";
      cutFlash("-25deg");
    } else if (pieces === 2) {
      q("[data-gg-gem]").className = "gg-gem mid";
      cutFlash("20deg");
    } else if (pieces === 3) {
      q("[data-gg-gem]").className = "gg-gem mid";
      cutFlash("0deg");
    }
  }

  function polishGem() {
    if (completed) {
      q("[data-gg-feedback]").textContent = "This gem is already polished. Move to the next gem.";
      return;
    }
    if (!selectedPerson || !selectedAction || !selectedImpact) {
      q("[data-gg-feedback]").textContent = "Choose a person, an action, and an impact before polishing.";
      return;
    }
    const gemData = gems[current];
    let correct = 0;
    if (selectedPerson === gemData.person) correct += 1;
    if (selectedAction === gemData.action) correct += 1;
    if (selectedImpact === gemData.impact) correct += 1;
    completed = true;
    if (correct === 3) {
      localScore += 100;
      polished += 1;
      clarity = 100;
      q("[data-gg-gem]").className = "gg-gem polished";
      q("[data-gg-note]").textContent = gemData.note;
      q("[data-gg-feedback]").textContent = "Brilliant gem! Your thank-you was specific, sincere, and connected to a real impact.";
      state.streak += 1;
      sparkle("💎");
    } else if (correct === 2) {
      localScore += 65;
      clarity = 75;
      q("[data-gg-gem]").className = "gg-gem mid";
      q("[data-gg-feedback]").textContent = "Good gratitude, but one part is not quite connected to the memory. Strong thanks are specific.";
      state.streak = 0;
      sparkle("✨");
    } else if (correct === 1) {
      localScore += 35;
      clarity = 55;
      q("[data-gg-gem]").className = "gg-gem mid";
      q("[data-gg-feedback]").textContent = "This thank-you has a good start, but it needs more accurate detail to feel meaningful.";
      state.streak = 0;
    } else {
      localScore += 10;
      clarity = 25;
      q("[data-gg-gem]").className = "gg-gem rough";
      q("[data-gg-feedback]").textContent = "This gem stayed rough. Gratitude works best when it names the real person, action, and impact.";
      state.streak = 0;
    }
    state.score = localScore;
    updateStats();
    updateClarity();
    sync();
  }

  function nextGem() {
    if (!completed) {
      q("[data-gg-feedback]").textContent = "Polish this gem before moving on.";
      return;
    }
    current += 1;
    if (current >= gems.length) {
      endGame();
    } else {
      loadGem();
    }
  }

  function updateClarity() {
    clarity = Math.max(0, Math.min(100, clarity));
    q("[data-gg-clarity-fill]").style.width = `${clarity}%`;
    q("[data-gg-clarity-text]").textContent = `${Math.round(clarity)}%`;
  }

  function updateStats() {
    q("[data-gg-round]").textContent = Math.min(current + 1, gems.length);
    q("[data-gg-score]").textContent = localScore;
    q("[data-gg-polished]").textContent = polished;
  }

  function endGame() {
    let title = "Gems Complete!";
    let message = "";
    if (localScore >= 430) {
      title = "Gratitude Gem Master!";
      message = `Amazing work! Your score was ${localScore}. You learned how to make gratitude specific by naming the person, action, and impact.`;
    } else if (localScore >= 300) {
      title = "Gratitude Builder!";
      message = `Great job! Your score was ${localScore}. You are learning that sincere thanks should explain what someone did and why it mattered.`;
    } else {
      title = "Gratitude Apprentice!";
      message = `Your score was ${localScore}. Keep practicing. A strong thank-you is clear, specific, and connected to a real memory.`;
    }
    q("[data-gg-end-title]").textContent = title;
    q("[data-gg-end-message]").textContent = message;
    q("[data-gg-end]").classList.remove("hidden");
    finish();
  }

  function cutFlash(angle) {
    const beam = document.createElement("div");
    beam.className = "gg-cut-beam";
    beam.style.setProperty("--angle", angle);
    q("[data-gg-stage]").append(beam);
    setTimeout(() => beam.remove(), 500);
  }

  function sparkle(symbol) {
    for (let i = 0; i < 14; i += 1) {
      const spark = document.createElement("div");
      spark.className = "gg-spark";
      spark.textContent = symbol;
      spark.style.left = `${Math.random() * 85 + 8}%`;
      spark.style.top = `${Math.random() * 60 + 18}%`;
      q(".gratitude-gems-game").append(spark);
      setTimeout(() => spark.remove(), 850);
    }
  }

  function capitalize(text) {
    if (!text) return "";
    return text.charAt(0).toUpperCase() + text.slice(1);
  }
}

function renderReputationNetwork(arena) {
  clearInterval(state.timer);
  state.timer = null;

  const topics = [
    {
      topic: "The council must choose one class reward. Lina wants art time, Marcus wants music time, Noah wants reading time, and Ava wants a team game.",
      phases: [
        { name: "Phase 1: Listen First", correct: "I hear that each person wants something different. Can we each explain why?", wrong: ["My idea is obviously better.", "Let’s ignore the ideas I do not like."] },
        { name: "Phase 2: Disagree Respectfully", correct: "I see your point, but I have a different idea because some students may want movement.", wrong: ["That idea is terrible.", "You are wrong, so stop talking."] },
        { name: "Phase 3: Add a Reason", correct: "A team game might work because it includes everyone and still feels like a reward.", wrong: ["Because I said so.", "No reason, I just want it."] },
        { name: "Phase 4: Find Common Ground", correct: "Could we choose a team game today and art or music next time?", wrong: ["Only my choice should win.", "Let’s keep arguing forever."] }
      ]
    },
    {
      topic: "The group is designing a poster. Some want it colorful, while others want it simple and easy to read.",
      phases: [
        { name: "Phase 1: Listen First", correct: "So one side wants creativity, and the other wants clarity. Did I understand that right?", wrong: ["Simple posters are boring.", "Colorful posters are messy."] },
        { name: "Phase 2: Disagree Respectfully", correct: "I like the colorful idea, but I think we should make sure the words are still easy to read.", wrong: ["Your design looks bad.", "Nobody should use your idea."] },
        { name: "Phase 3: Add a Reason", correct: "If the title is clear and the border is colorful, the poster can be both fun and readable.", wrong: ["Just do it my way.", "I do not care what anyone thinks."] },
        { name: "Phase 4: Find Common Ground", correct: "Let’s use bright colors around the edge and keep the middle clean.", wrong: ["Let’s vote without hearing anyone.", "Let’s quit the project."] }
      ]
    },
    {
      topic: "During a group game, one person wants to lead every decision, but others want turns too.",
      phases: [
        { name: "Phase 1: Listen First", correct: "It sounds like you enjoy leading, and others also want a chance to help decide.", wrong: ["You are bossy.", "Nobody wants your ideas."] },
        { name: "Phase 2: Disagree Respectfully", correct: "I understand you have ideas, but I disagree with one person making every decision.", wrong: ["Stop talking completely.", "You should never lead."] },
        { name: "Phase 3: Add a Reason", correct: "Taking turns helps everyone feel included and gives the team more ideas.", wrong: ["Because everyone is annoyed.", "Because I want control instead."] },
        { name: "Phase 4: Find Common Ground", correct: "You can lead this round, and someone else can lead the next round.", wrong: ["No one should lead anything.", "Only I should decide now."] }
      ]
    },
    {
      topic: "The class is choosing where to sit for a project. Some students want friends together, but others worry people will get distracted.",
      phases: [
        { name: "Phase 1: Listen First", correct: "I hear that friends want to work together, but some people are worried about focus.", wrong: ["Friends always ruin projects.", "Focus does not matter at all."] },
        { name: "Phase 2: Disagree Respectfully", correct: "I get wanting to sit with friends, but I think we need a plan so the work still gets done.", wrong: ["That is a dumb reason.", "Your opinion does not count."] },
        { name: "Phase 3: Add a Reason", correct: "If groups have clear roles, friends can work together without losing focus.", wrong: ["Because I just want my seat.", "Because my group is better."] },
        { name: "Phase 4: Find Common Ground", correct: "Let’s allow friends together if each person has a role and the group stays on task.", wrong: ["Let’s punish everyone.", "Let’s ignore the teacher."] }
      ]
    }
  ];

  let currentTopic = 0;
  let currentPhase = 0;
  let selectedToken = null;
  let used = false;
  let localScore = 0;
  let harmony = 0;
  let respect = 50;

  arena.innerHTML = `
    <div class="respect-roundtable-game">
      <div class="rr-bg"></div>
      <div class="rr-columns"></div>
      <section class="rr-screen" data-rr-start>
        <div class="rr-screen-card">
          <div class="rr-big">🏛️</div>
          <h2>Respectful Roundtable</h2>
          <p>The council disagrees, but the goal is not to “win.” The goal is to listen, speak calmly, and build a better idea together.</p>
          <p>Choose the right discussion token for each phase: listen, disagree respectfully, add an idea, and find common ground.</p>
          <button class="rr-btn gold" type="button" data-rr-join>Join the Council</button>
        </div>
      </section>
      <section class="rr-screen hidden" data-rr-end>
        <div class="rr-screen-card">
          <div class="rr-big">🤝</div>
          <h2 data-rr-end-title>Council Complete!</h2>
          <p data-rr-end-message></p>
          <button class="rr-btn gold" type="button" data-rr-restart>Play Again</button>
        </div>
      </section>
      <div class="rr-content">
        <div class="rr-top">
          <div class="rr-title-card">
            <h2>🏛️ Respectful Roundtable</h2>
            <p>Practice disagreement without disrespect.</p>
          </div>
          <div class="rr-stats">
            <div class="rr-pill">Topic: <span data-rr-round>1</span>/4</div>
            <div class="rr-pill">Score: <span data-rr-score>0</span></div>
            <div class="rr-pill">Harmony: <span data-rr-harmony>0</span> 🤝</div>
          </div>
        </div>
        <div class="rr-main">
          <div class="rr-panel rr-council-panel">
            <div class="rr-topic-card" data-rr-topic></div>
            <div class="rr-stage">
              <div class="rr-member m1" data-rr-member="0">
                <div class="emoji">🧑‍🎨</div><div class="name">Lina</div><div class="status">Has a creative idea.</div>
              </div>
              <div class="rr-member m2" data-rr-member="1">
                <div class="emoji">🎻</div><div class="name">Marcus</div><div class="status">Disagrees politely.</div>
              </div>
              <div class="rr-member m3" data-rr-member="2">
                <div class="emoji">📚</div><div class="name">Noah</div><div class="status">Wants reasons.</div>
              </div>
              <div class="rr-member m4" data-rr-member="3">
                <div class="emoji">🧩</div><div class="name">Ava</div><div class="status">Feels unheard.</div>
              </div>
              <div class="rr-table"></div>
              <div class="rr-center-seal" data-rr-seal>💬</div>
              <div class="rr-token-orbit" data-rr-orbit>💬</div>
            </div>
          </div>
          <div class="rr-panel rr-controls">
            <h2>How to Play</h2>
            <div class="rr-instructions">Each council topic has four discussion phases. Pick the response token that fits the current phase.</div>
            <div class="rr-phase-box" data-rr-phase></div>
            <div class="rr-token-grid" data-rr-tokens></div>
            <div>
              <div class="rr-meter-label"><span>Respect Meter</span><span data-rr-respect-text>50%</span></div>
              <div class="rr-meter"><div data-rr-respect-fill></div></div>
            </div>
            <div class="rr-feedback" data-rr-feedback>Choose the token that fits the current discussion phase.</div>
            <div class="rr-btn-row">
              <button class="rr-btn" type="button" data-rr-use>Use Token</button>
              <button class="rr-btn gold" type="button" data-rr-next>Next Topic</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;

  const q = (selector) => arena.querySelector(selector);

  q("[data-rr-join]").onclick = () => {
    q("[data-rr-start]").classList.add("hidden");
    loadTopic();
  };
  q("[data-rr-restart]").onclick = () => {
    currentTopic = 0;
    currentPhase = 0;
    selectedToken = null;
    used = false;
    localScore = 0;
    harmony = 0;
    respect = 50;
    q("[data-rr-end]").classList.add("hidden");
    loadTopic();
  };
  q("[data-rr-use]").onclick = useToken;
  q("[data-rr-next]").onclick = nextTopic;

  function loadTopic() {
    currentPhase = 0;
    q("[data-rr-topic]").textContent = topics[currentTopic].topic;
    updatePhase();
    updateStats();
    updateRespect();
  }

  function updatePhase() {
    const phase = topics[currentTopic].phases[currentPhase];
    selectedToken = null;
    used = false;
    q("[data-rr-phase]").textContent = phase.name;
    q("[data-rr-feedback]").textContent = "Choose the token that fits the current discussion phase.";
    q("[data-rr-seal]").textContent = ["👂", "🤝", "💡", "🌉"][currentPhase] || "💬";
    renderTokens();
    updateMembers("waiting");
  }

  function renderTokens() {
    const phase = topics[currentTopic].phases[currentPhase];
    q("[data-rr-tokens]").innerHTML = "";
    shuffle([phase.correct, ...phase.wrong]).forEach((text) => {
      const button = document.createElement("button");
      button.className = "rr-token";
      button.type = "button";
      button.textContent = text;
      button.onclick = () => {
        if (used) return;
        selectedToken = text;
        q("[data-rr-tokens]").querySelectorAll(".rr-token").forEach((item) => item.classList.remove("selected"));
        button.classList.add("selected");
        q("[data-rr-feedback]").textContent = "Token selected. Press Use Token to add it to the roundtable.";
      };
      q("[data-rr-tokens]").append(button);
    });
  }

  function useToken() {
    if (used) {
      q("[data-rr-feedback]").textContent = "This token has already been used. Continue to the next phase.";
      return;
    }
    if (!selectedToken) {
      q("[data-rr-feedback]").textContent = "Choose a discussion token first.";
      return;
    }
    const phase = topics[currentTopic].phases[currentPhase];
    const correct = selectedToken === phase.correct;
    used = true;
    animateToken(correct);
    if (correct) {
      localScore += 50;
      respect += 12;
      harmony += 1;
      q("[data-rr-feedback]").textContent = "Respectful move! This helps the group disagree without making anyone feel attacked.";
      updateMembers("happy");
      state.streak += 1;
      sparkle("🤝");
    } else {
      localScore += 10;
      respect -= 14;
      q("[data-rr-feedback]").textContent = "That token weakens the discussion. Respectful disagreement uses calm words and listens to others.";
      updateMembers("uneasy");
      state.streak = 0;
      sparkle("💬");
    }
    state.score = localScore;
    updateStats();
    updateRespect();
    sync();
    setTimeout(() => {
      currentPhase += 1;
      if (currentPhase >= topics[currentTopic].phases.length) {
        q("[data-rr-feedback]").textContent = "Topic complete. Move to the next council topic.";
        currentPhase = topics[currentTopic].phases.length - 1;
      } else {
        updatePhase();
      }
    }, 950);
  }

  function nextTopic() {
    if (currentPhase < topics[currentTopic].phases.length - 1 || !used) {
      q("[data-rr-feedback]").textContent = "Finish all four discussion phases before moving to the next topic.";
      return;
    }
    currentTopic += 1;
    if (currentTopic >= topics.length) {
      endGame();
    } else {
      loadTopic();
    }
  }

  function animateToken(correct) {
    const positions = [
      { left: "50%", top: "30%" },
      { left: "70%", top: "52%" },
      { left: "50%", top: "72%" },
      { left: "30%", top: "52%" }
    ];
    const orbit = q("[data-rr-orbit]");
    orbit.textContent = correct ? "🤝" : "⚠️";
    orbit.style.left = positions[currentPhase].left;
    orbit.style.top = positions[currentPhase].top;
    orbit.style.transform = "translate(-50%, -50%)";
    orbit.classList.add("show");
    setTimeout(() => orbit.classList.remove("show"), 850);
  }

  function updateMembers(mood) {
    const statuses = {
      waiting: ["Listening...", "Thinking...", "Considering...", "Waiting..."],
      happy: ["Feels heard", "Stays calm", "Adds a reason", "Feels respected"],
      uneasy: ["Feels ignored", "Tenses up", "Loses focus", "Feels dismissed"]
    };
    arena.querySelectorAll("[data-rr-member]").forEach((member, index) => {
      member.querySelector(".status").textContent = statuses[mood][index];
    });
  }

  function updateRespect() {
    respect = Math.max(0, Math.min(100, respect));
    q("[data-rr-respect-fill]").style.width = `${respect}%`;
    q("[data-rr-respect-text]").textContent = `${Math.round(respect)}%`;
  }

  function updateStats() {
    q("[data-rr-round]").textContent = Math.min(currentTopic + 1, topics.length);
    q("[data-rr-score]").textContent = localScore;
    q("[data-rr-harmony]").textContent = harmony;
  }

  function endGame() {
    let title = "Council Complete!";
    let message = "";
    if (localScore >= 700) {
      title = "Roundtable Respect Champion!";
      message = `Amazing work! Your score was ${localScore}. You listened, disagreed calmly, gave reasons, and found common ground.`;
    } else if (localScore >= 500) {
      title = "Respectful Speaker!";
      message = `Great job! Your score was ${localScore}. You are learning how to disagree without disrespect.`;
    } else {
      title = "Council Apprentice!";
      message = `Your score was ${localScore}. Keep practicing. Respectful disagreement means listening first and using calm words.`;
    }
    q("[data-rr-end-title]").textContent = title;
    q("[data-rr-end-message]").textContent = message;
    q("[data-rr-end]").classList.remove("hidden");
    finish();
  }

  function sparkle(symbol) {
    for (let i = 0; i < 14; i += 1) {
      const spark = document.createElement("div");
      spark.className = "rr-spark";
      spark.textContent = symbol;
      spark.style.left = `${Math.random() * 85 + 8}%`;
      spark.style.top = `${Math.random() * 60 + 18}%`;
      q(".respect-roundtable-game").append(spark);
      setTimeout(() => spark.remove(), 850);
    }
  }
}

function renderEmbeddedGame(arena, file, title) {
  clearInterval(state.timer);
  state.timer = null;
  state.time = state.level;
  sync();
  arena.innerHTML = `
    <div class="embedded-game-shell">
      <iframe
        class="embedded-game-frame"
        title="${escapeAttr(title)}"
        src="assets/embedded-games/${file}"
        loading="eager"
      ></iframe>
    </div>
  `;
  feedback(`${title} is loaded. Play it here, then complete the knowledge check below.`);
}

function renderBelongingMeters(arena) {
  renderEmbeddedGame(arena, "inclusion-inn.html", "Inclusion Inn");
}

function renderFearCave(arena) {
  renderEmbeddedGame(arena, "courage-cave.html", "Courage Cave");
}

function renderBreathingDragon(arena) {
  renderEmbeddedGame(arena, "calm-dragon-den.html", "Calm Dragon Den");
}

function renderTeamRoles(arena) {
  renderEmbeddedGame(arena, "teamwork-tournament.html", "Teamwork Tournament");
}

function renderEquityFountain(arena) {
  renderEmbeddedGame(arena, "fairness-fountain.html", "Fairness Fountain");
}

function renderFuturePath(arena) {
  renderEmbeddedGame(arena, "promise-path.html", "Promise Path");
}

function renderHabitsHarbor(arena) {
  renderEmbeddedGame(arena, "healthy-habits-harbor.html", "Healthy Habits Harbor");
}

function renderPredictiveShield(arena) {
  renderEmbeddedGame(arena, "safety-shield.html", "Safety Shield");
}

function renderQuestionClock(arena) {
  renderEmbeddedGame(arena, "curiosity-clock.html", "Curiosity Clock");
}

function renderAdaptivePeak(arena) {
  renderEmbeddedGame(arena, "perseverance-peak.html", "Perseverance Peak");
}

function renderEmpathyWaves(arena) {
  renderEmbeddedGame(arena, "empathy-echoes.html", "Empathy Echoes");
}

function renderMicroManners(arena) {
  renderEmbeddedGame(arena, "manners-market.html", "Manners Market");
}

function renderSolutionPortal(arena) {
  renderEmbeddedGame(arena, "problem-solving-portal.html", "Problem-Solving Portal");
}

function renderEcosystemNook(arena) {
  renderEmbeddedGame(arena, "nature-nook.html", "Nature Nook");
}

function renderChatGate(arena) {
  renderEmbeddedGame(arena, "digital-kindness-gate.html", "Digital Kindness Gate");
}

function renderRelaxSequence(arena) {
  renderEmbeddedGame(arena, "restful-moon-meadow.html", "Restful Moon Meadow");
}

function renderNewKingdomQuest(arena, data) {
  const palette = newQuestPalette(game.mechanic);
  const glyphs = ["✦", "◆", "●", "▲"];
  let current = 0;
  let localScore = 0;
  let power = 35;
  let solved = 0;
  const steps = data.map((item) => ({
    scenario: item.label,
    correct: item.value || "Choose the kind action",
    risky: item.extra?.[0] || "Choose the rushed action",
    result: item.extra?.[1] || "The kingdom brightens"
  }));

  arena.innerHTML = `
    <div class="new-quest-game ${game.mechanic}" style="--nq-a:${palette[0]}; --nq-b:${palette[1]}; --nq-c:${palette[2]};">
      <section class="nq-stage">
        <div class="nq-orbit" data-nq-orbit>
          ${steps.map((_, index) => `<span style="--i:${index}">${glyphs[index % glyphs.length]}</span>`).join("")}
        </div>
        <div class="nq-core" data-nq-core>${game.icon}</div>
        <div class="nq-scene-text">
          <small>${game.mechanicName}</small>
          <h3 data-nq-scenario></h3>
          <p data-nq-result>${game.scene}</p>
        </div>
      </section>
      <section class="nq-controls">
        <div class="nq-meter-label">
          <span>${game.category} Power</span>
          <b data-nq-power>${power}%</b>
        </div>
        <div class="nq-meter"><span data-nq-fill></span></div>
        <div class="nq-choices" data-nq-choices></div>
        <div class="nq-mini-stats">
          <span>Step <b data-nq-step>1</b>/${steps.length}</span>
          <span>Score <b data-nq-score>0</b></span>
          <span>Wins <b data-nq-solved>0</b></span>
        </div>
      </section>
    </div>
  `;

  const q = (selector) => arena.querySelector(selector);

  function loadStep() {
    const step = steps[current];
    q("[data-nq-scenario]").textContent = step.scenario;
    q("[data-nq-result]").textContent = "Choose the action that best matches the lesson.";
    q("[data-nq-step]").textContent = Math.min(current + 1, steps.length);
    q("[data-nq-core]").textContent = game.icon;
    q("[data-nq-core]").classList.remove("nq-good", "nq-risk");
    const choices = shuffle([
      { text: step.correct, correct: true },
      { text: step.risky, correct: false },
      { text: newQuestNeutralChoice(game.category), correct: false }
    ]);
    q("[data-nq-choices]").innerHTML = choices.map((choice, index) => `
      <button type="button" class="nq-choice" data-correct="${choice.correct}" data-index="${index}">
        <span>${index + 1}</span>${choice.text}
      </button>
    `).join("");
    q("[data-nq-choices]").querySelectorAll(".nq-choice").forEach((button) => {
      button.addEventListener("click", () => choose(button));
    });
    updateReadout();
  }

  function choose(button) {
    const step = steps[current];
    const correct = button.dataset.correct === "true";
    q("[data-nq-choices]").querySelectorAll(".nq-choice").forEach((item) => {
      item.disabled = true;
      item.classList.toggle("selected", item === button);
    });
    if (correct) {
      power = Math.min(100, power + 17);
      localScore += 25;
      solved += 1;
      q("[data-nq-core]").classList.add("nq-good");
      q("[data-nq-result]").textContent = step.result;
      point(step.result);
    } else {
      power = Math.max(0, power - 14);
      q("[data-nq-core]").classList.add("nq-risk");
      q("[data-nq-result]").textContent = `Try the stronger move: ${step.correct}`;
      miss(`That weakens ${game.category.toLowerCase()}. Try the choice that practices the lesson.`);
    }
    updateReadout();
    window.setTimeout(() => {
      current += 1;
      if (current >= steps.length) {
        endQuest();
      } else {
        loadStep();
      }
    }, 1100);
  }

  function updateReadout() {
    q("[data-nq-fill]").style.width = `${power}%`;
    q("[data-nq-power]").textContent = `${power}%`;
    q("[data-nq-score]").textContent = localScore;
    q("[data-nq-solved]").textContent = solved;
    q("[data-nq-orbit]").style.transform = `rotate(${solved * 18}deg)`;
  }

  function endQuest() {
    clearInterval(state.timer);
    state.score += localScore;
    state.streak = solved;
    sync();
    completionState.gameFinished = true;
    arena.querySelector(".new-quest-game").classList.add("complete");
    q("[data-nq-scenario]").textContent = solved >= Math.ceil(steps.length * 0.75)
      ? `${game.title} complete!`
      : `${game.title} ready for another try.`;
    q("[data-nq-result]").textContent = solved >= Math.ceil(steps.length * 0.75)
      ? game.lesson
      : `Replay to strengthen ${game.category.toLowerCase()} before using it in daily life.`;
    q("[data-nq-choices]").innerHTML = `<button type="button" class="nq-choice replay" data-nq-replay>Play Again</button>`;
    q("[data-nq-replay]").addEventListener("click", () => renderNewKingdomQuest(arena, data));
    feedback(`Quest complete. ${game.lesson}`);
    syncCompletionStatus();
  }

  loadStep();
}

function newQuestNeutralChoice(category) {
  const choices = [
    `Pause and think about ${category.toLowerCase()} later, but do nothing now`,
    "Choose whatever is easiest for you",
    "Wait for someone else to solve the whole problem",
    "Ignore the clues and keep moving"
  ];
  return choices[Math.floor(Math.random() * choices.length)];
}

function newQuestPalette(mechanic) {
  const palettes = [
    ["#5c2ea6", "#ffb703", "#7bdff2"],
    ["#1f7a5c", "#ffd166", "#ff7eb3"],
    ["#23395d", "#70d6ff", "#f9c74f"],
    ["#6d597a", "#ffb4a2", "#b5ead7"],
    ["#0b3954", "#bfd7ea", "#ff6663"],
    ["#2d6a4f", "#95d5b2", "#fefae0"],
    ["#3a0ca3", "#4cc9f0", "#f72585"],
    ["#8a5a44", "#f2cc8f", "#81b29a"]
  ];
  const sum = [...mechanic].reduce((total, char) => total + char.charCodeAt(0), 0);
  return palettes[sum % palettes.length];
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
  const [label, value, ...extra] = item.split("|");
  return { label, value, extra };
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
