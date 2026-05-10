import { AuthSystem } from "./systems/AuthSystem.js?v=79";
import { PlayerData } from "./systems/PlayerData.js?v=79";
import { QuestSystem } from "./systems/QuestSystem.js?v=79";
import { UnlockSystem } from "./systems/UnlockSystem.js?v=79";
import { RewardSystem, SHOP_ITEMS, BADGES, CURRENT_EVENT } from "./systems/RewardSystem.js?v=79";
import { StoryForgeSystem } from "./systems/StoryForgeSystem.js?v=79";
import { KingdomNewsSystem } from "./systems/KingdomNewsSystem.js?v=79";
import { ReflectionJournalSystem } from "./systems/ReflectionJournalSystem.js?v=79";
import { EmotionSystem } from "./systems/EmotionSystem.js?v=79";
import { NPCMemorySystem } from "./systems/NPCMemorySystem.js?v=79";
import { HEROES, HERO_LAYER_ASSETS, WALK_FRAMES, getHero } from "./systems/AssetCatalog.js?v=79";

const root = document.querySelector("#game");
const SHOP_CATEGORIES = ["outfits", "capes", "crowns", "pets", "trails", "room", "effects"];
const MAP_WIDTH = 3200;
const MAP_HEIGHT = 2100;

const state = {
  view: AuthSystem.isLoggedIn() ? "dashboard" : "login",
  message: "",
  shopCategory: "outfits",
  storySkill: "empathy",
  story: null,
  selectedNewsId: null,
  nearestSlug: null,
  showMapControls: false,
  arCameraActive: false,
  arMissionId: "kindness-spirit",
  multiplayerRoom: "kind-kingdom-room",
  multiplayerJoined: false,
  multiplayerLog: []
};

let scrollHoldTimer = null;
const pressedMapKeys = new Set();
let movementLoop = null;
let phaserMapGame = null;
let phaserMapApi = null;
let phaserLoadingPromise = null;
let arCameraStream = null;
let multiplayerChannel = null;
let threeLoadingPromise = null;
let arCreatureCleanups = [];

root.addEventListener("click", handleClick);
root.addEventListener("submit", handleSubmit);
root.addEventListener("change", handleChange);
root.addEventListener("pointerdown", handlePointerDown);
root.addEventListener("click", handleScrollClick);
document.addEventListener("pointerup", stopPageScrollHold);
document.addEventListener("pointercancel", stopPageScrollHold);
document.addEventListener("pointerleave", stopPageScrollHold);
document.addEventListener("keydown", handleKeydown, { capture: true });
document.addEventListener("keyup", handleKeyup, { capture: true });
window.addEventListener("load", () => {
  if (AuthSystem.isLoggedIn()) RewardSystem.awardDailyVisit();
  render();
});

function render() {
  if (!AuthSystem.isLoggedIn() && state.view !== "login") state.view = "login";

  root.className = `kind-kingdom-app-shell kk-view-${state.view}`;
  root.innerHTML = AuthSystem.isLoggedIn() ? renderAuthedView() : renderLogin();
  if (state.view === "map") {
    requestAnimationFrame(initPhaserMap);
    syncMapHint();
  } else {
    destroyPhaserMap();
    if (state.view !== "ar") stopARCamera();
    root.insertAdjacentHTML("beforeend", pageScrollControlsMarkup());
  }
  if (state.view === "ar" && state.arCameraActive) requestAnimationFrame(attachARVideo);
  if (state.view === "ar") requestAnimationFrame(initARCreatures);
}

function renderAuthedView() {
  const views = {
    dashboard: renderDashboard,
    character: renderCharacterSelect,
    map: renderMap,
    shop: renderShop,
    closet: renderCloset,
    room: renderRoom,
    story: renderStoryForge,
    news: renderNews,
    journal: renderJournal,
    ar: renderARExperience,
    multiplayer: renderMultiplayer
  };
  return (views[state.view] || renderDashboard)();
}

function renderLogin() {
  return `
    <section class="kk-dom-page kk-login-page">
      <div class="kk-dom-hero-panel">
        <p class="kk-eyebrow">Kind Kingdom</p>
        <h2>Enter your kindness world</h2>
        <p>Log in or create a local profile. Your points, character, rewards, stories, news, and journal stay saved on this device.</p>
      </div>
      <form class="kk-dom-card kk-auth-card" data-auth-form>
        <label>Username<input name="username" autocomplete="username" required></label>
        <label>Password<input name="password" type="password" autocomplete="current-password" required></label>
        <div class="kk-dom-actions">
          <button class="kk-primary" type="submit" data-auth="login">Log In</button>
          <button type="submit" data-auth="signup">Create Account</button>
        </div>
        ${messageMarkup()}
      </form>
    </section>
  `;
}

function renderDashboard() {
  const player = PlayerData.loadPlayer();
  const progress = PlayerData.loadProgress();
  const hero = getHero(PlayerData.getCharacter() || "knight");
  const quest = QuestSystem.getActiveQuest(progress);
  const mood = EmotionSystem.getKingdomMood(progress);
  const newsCount = KingdomNewsSystem.unreadCount(games());
  const title = RewardSystem.equippedTitle();
  const completedCount = progress.completed.length;
  const latestStory = StoryForgeSystem.latest(1)[0];

  return `
    <section class="kk-dom-page kk-old-scene kk-old-dashboard-scene ${moodClass(mood)}">
      <h2 class="kk-old-world-title">Welcome, ${escapeHtml(AuthSystem.currentUser())}</h2>
      <div class="kk-old-dashboard-pill">Your dashboard • ${escapeHtml(title.name)}</div>
      ${newsCount ? `<button class="kk-old-news-badge" data-action="nav" data-view="news">${newsCount} new Kingdom News post${newsCount === 1 ? "" : "s"}</button>` : ""}
      <div class="kk-old-stat-row">
        ${oldStatCard("Kindness Points", String(progress.points), "KP")}
        ${oldStatCard("Completed", String(completedCount), "DONE")}
        ${oldStatCard("Hero", player.character ? hero.title : "Choose one", "HERO")}
        ${oldStatCard("Pass Level", String(RewardSystem.passLevel()), "LVL")}
      </div>
      <div class="kk-old-dashboard-copy">
        <p>${escapeHtml(quest.npc)}: ${escapeHtml(quest.prompt)}</p>
        <p>${CURRENT_EVENT.name}: ${CURRENT_EVENT.description}</p>
        <p>Kingdom mood: ${mood.sky}. Helpful and calm choices brighten the world; rushed or unkind choices make it feel heavier.</p>
      </div>
      <div class="kk-old-button-row primary">
        <button data-action="nav" data-view="${player.character ? "map" : "character"}">Begin Gameplay</button>
        <button data-action="nav" data-view="ar">AR Experience</button>
        <button data-action="nav" data-view="multiplayer">Multiplayer</button>
        <button data-action="nav" data-view="story">Story Forge</button>
        <button data-action="nav" data-view="shop">Shop</button>
        <button data-action="nav" data-view="closet">Closet</button>
      </div>
      <div class="kk-old-button-row secondary">
        <button data-action="nav" data-view="news">Kingdom News</button>
        <button data-action="nav" data-view="journal">Journal</button>
        <button data-action="nav" data-view="room">My Room</button>
        <button data-action="nav" data-view="character">Choose Hero</button>
        <a href="card-view.html">Card View</a>
        <button data-action="logout">Log Out</button>
      </div>
      ${messageMarkup()}
    </section>
  `;
}

function renderCharacterSelect() {
  return `
    <section class="kk-dom-page">
      ${panelHead("Choose Your Hero", "Character Select", "Pick the character that will walk the kingdom map and appear in your dashboard.", true)}
      <div class="kk-character-grid">
        ${HEROES.map((hero) => `
          <button class="kk-character-card ${PlayerData.getCharacter() === hero.id ? "selected" : ""}" data-action="choose-character" data-hero="${hero.id}">
            ${heroMarkup(hero.id)}
            <strong>${escapeHtml(hero.title)}</strong>
            <span>${PlayerData.getCharacter() === hero.id ? "Selected" : "Choose"}</span>
          </button>
        `).join("")}
      </div>
      ${messageMarkup()}
    </section>
  `;
}

function renderMap() {
  const progress = PlayerData.loadProgress();
  const mood = EmotionSystem.getKingdomMood(progress);
  const showControls = shouldShowMapControls();
  const touchControls = isTouchMapDevice();

  return `
    <section class="kk-dom-page kk-map-page kk-phaser-only-map ${moodClass(mood)}">
      <div class="kk-phaser-map-stage" data-map-stage data-phaser-map tabindex="0" aria-label="Kind Kingdom map. Use arrow keys or WASD to move.">
        <div class="kk-map-loading">Loading kingdom map...</div>
      </div>
      <div class="kk-map-overlay-actions">
        <button data-action="nav" data-view="dashboard">Dashboard</button>
        <button data-action="nav" data-view="ar">AR</button>
        <button data-action="nav" data-view="multiplayer">Multiplayer</button>
        ${touchControls ? "" : `<button data-action="toggle-map-controls">${showControls ? "Hide" : "Touch"} Controls</button>`}
      </div>
      ${showControls ? `<div class="kk-map-floating-pad">${mapControlsMarkup()}</div>` : ""}
      ${messageMarkup()}
    </section>
  `;
}

function renderShop() {
  const progress = PlayerData.loadProgress();
  const rewards = RewardSystem.load();
  const items = RewardSystem.itemsByCategory(state.shopCategory);

  return `
    <section class="kk-dom-page kk-old-scene kk-old-shop-scene">
      <div class="kk-reward-panel shop">
        <div class="kk-panel-head">
          <div>
            <span>Kindness Shop</span>
            <h2>Spend points on rewards</h2>
            <p>${CURRENT_EVENT.name}: ${CURRENT_EVENT.description}</p>
          </div>
          <div class="kk-head-actions">
            <strong>${progress.points} pts</strong>
            <button data-action="nav" data-view="dashboard" class="kk-home-button">Back to Home</button>
          </div>
        </div>
        ${categoryTabs("kk-tabs")}
        <div class="kk-shop-grid">
          ${items.map((item) => oldItemCard(item, rewards, false)).join("")}
        </div>
        <div class="kk-panel-message">${state.message || "Buy items here. Equip owned items in the Closet."}</div>
        <div class="kk-panel-actions">
          <button data-action="nav" data-view="closet">Avatar Closet</button>
          <button data-action="nav" data-view="room">Player Room</button>
          <button data-action="nav" data-view="dashboard">Dashboard</button>
        </div>
      </div>
    </section>
  `;
}

function renderCloset() {
  const rewards = RewardSystem.load();
  const owned = SHOP_ITEMS.filter((item) => rewards.owned.includes(item.id) && item.category !== "room");
  const titles = RewardSystem.unlockedTitles();

  return `
    <section class="kk-dom-page kk-old-scene kk-old-shop-scene">
      <div class="kk-reward-panel closet">
        <div class="kk-panel-head">
          <div>
            <span>Avatar Closet</span>
            <h2>Equip your owned rewards</h2>
            <p>Equipped items appear on the map: pets follow you, trails show while walking, and map effects change the world mood.</p>
          </div>
          <div class="kk-head-actions">
            <strong>${escapeHtml(RewardSystem.equippedTitle().name)}</strong>
            <button data-action="nav" data-view="dashboard" class="kk-home-button">Back to Home</button>
          </div>
        </div>
        <div class="kk-closet-preview">
          <div class="kk-avatar-preview">
            ${heroMarkup(PlayerData.getCharacter() || "knight")}
            <b>${escapeHtml(getHero(PlayerData.getCharacter() || "knight").title)}</b>
          </div>
          <div class="kk-equipped-list">
            ${equippedSummary(rewards).split(" | ").map((line) => `<p>${escapeHtml(line)}</p>`).join("")}
          </div>
        </div>
        <div class="kk-title-row">
          <b>Display Title</b>
          ${titles.map((title) => `<button data-action="equip-title" data-title="${title.id}" class="${rewards.equipped.title === title.id ? "active" : ""}">${escapeHtml(title.name)}</button>`).join("")}
        </div>
        <div class="kk-shop-grid compact">
          ${owned.map((item) => oldItemCard(item, rewards, true)).join("") || emptyCard("No owned avatar items yet.", "Visit the shop to buy outfits, crowns, pets, trails, and effects.")}
        </div>
        <div class="kk-panel-message">${state.message || "Equip owned items here."}</div>
        <div class="kk-panel-actions">
          <button data-action="nav" data-view="shop">Kindness Shop</button>
          <button data-action="nav" data-view="map">Map</button>
          <button data-action="nav" data-view="dashboard">Dashboard</button>
        </div>
      </div>
    </section>
  `;
}

function renderRoom() {
  const progress = PlayerData.loadProgress();
  const rewards = RewardSystem.load();
  const badges = RewardSystem.unlockedBadges();
  const quests = RewardSystem.dailyQuests();
  const passRewards = RewardSystem.passRewards();
  const roomItems = SHOP_ITEMS.filter((item) => rewards.room.includes(item.id));
  const streak = rewards.streak.count || 0;

  return `
    <section class="kk-dom-page">
      ${panelHead("Your castle room", "Player Room", "Decorations, badges, daily quests, streaks, events, and Kingdom Pass progress live here.", true)}
      <div class="kk-room-layout">
        <article class="kk-dom-card kk-room-scene">
          <h3>Badge Wall</h3>
          <div class="kk-badge-grid">
            ${BADGES.map((badge) => badgeTile(badge, badges)).join("")}
          </div>
          <h3>Room Decorations</h3>
          <div class="kk-room-items">
            ${roomItems.map(assetTile).join("") || emptyInline("No room decorations yet.")}
          </div>
        </article>
        <aside class="kk-dom-card kk-side-board">
          <h3>Daily Quest Board</h3>
          ${quests.map((quest) => `<button class="kk-quest-card" data-action="claim-quest" data-quest="${quest.id}"><b>${escapeHtml(quest.text)}</b><span>+${quest.reward} pts</span></button>`).join("")}
          <h3>Streak</h3>
          <p>Current streak: ${streak} day${streak === 1 ? "" : "s"}. Next visit reward: ${RewardSystem.streakReward(streak + 1)} points.</p>
          <h3>Kingdom Pass</h3>
          <p>Level ${RewardSystem.passLevel()}</p>
          ${passRewards.map((reward) => `<button class="kk-pass-row" data-action="claim-pass" data-level="${reward.level}" ${reward.claimed || !reward.unlocked ? "disabled" : ""}>Level ${reward.level}: ${escapeHtml(reward.reward)} ${reward.claimed ? "(claimed)" : reward.unlocked ? "Claim" : "(locked)"}</button>`).join("")}
        </aside>
      </div>
      ${messageMarkup()}
    </section>
  `;
}

function renderStoryForge() {
  const skills = StoryForgeSystem.skills();
  const story = state.story || StoryForgeSystem.latest(1)[0];

  return `
    <section class="kk-dom-page">
      ${panelHead("Fresh kindness situations", "Story Forge", "This is local story generation. It makes a new situation from our own model pieces each time, without external AI calls.", true)}
      <div class="kk-story-tools">
        <select data-action="story-skill">
          ${skills.map((skill) => `<option value="${skill.id}" ${state.storySkill === skill.id ? "selected" : ""}>${escapeHtml(skill.label)}</option>`).join("")}
        </select>
        <button class="kk-primary" data-action="generate-story">Generate New Story</button>
      </div>
      ${story ? storyMarkup(story) : emptyCard("No story yet.", "Choose a skill and generate a new kindness situation.")}
      ${messageMarkup()}
    </section>
  `;
}

function renderNews() {
  const news = KingdomNewsSystem.latest(8, games());
  const selected = news.find((post) => post.id === state.selectedNewsId) || news[0];

  return `
    <section class="kk-dom-page">
      ${panelHead("Kingdom News", "World updates", "Short articles report how the kingdom reacts to your progress.", true)}
      <div class="kk-news-layout">
        <div class="kk-news-list">
          ${news.map((post) => `<button data-action="select-news" data-news="${post.id}" class="${selected?.id === post.id ? "selected" : ""}"><b>${escapeHtml(post.title)}</b><span>${escapeHtml(post.kicker)}</span></button>`).join("")}
          <button data-action="mark-news-read">Mark All Read</button>
        </div>
        ${selected ? newsArticle(selected) : emptyCard("No news yet.", "Complete games to restore more areas of the kingdom.")}
      </div>
      ${messageMarkup()}
    </section>
  `;
}

function renderJournal() {
  const entries = ReflectionJournalSystem.entries();

  return `
    <section class="kk-dom-page">
      ${panelHead("Reflection Journal", "Private notebook", "Your game reflections are saved here as a growth timeline on this device.", true)}
      <div class="kk-journal-stack">
        ${entries.map(journalEntry).join("") || emptyCard("No journal entries yet.", "After completing games, reflection prompts can be saved here.")}
      </div>
    </section>
  `;
}

function renderARExperience() {
  const mission = arMissions().find((item) => item.id === state.arMissionId) || arMissions()[0];
  const progress = PlayerData.loadProgress();
  const steps = [
    { number: "1", title: "Open the Camera", text: "Tap the AR button to scan your surroundings.", mode: "scan" },
    { number: "2", title: "Discover Magic", text: "Magical creatures and portals appear around you.", mode: "discover" },
    { number: "3", title: "Interact & Complete", text: "Tap the creature or portal to start a kindness challenge.", mode: "interact" },
    { number: "4", title: "Earn & Grow", text: "Complete the challenge and earn rewards.", mode: "reward" }
  ];

  return `
    <section class="kk-dom-page kk-ar-page kk-ar-showcase-page">
      <header class="kk-ar-showcase-head">
        <button data-action="nav" data-view="dashboard" aria-label="Back to dashboard">←</button>
        <div>
          <h2>Kind Kingdom AR Experience</h2>
          <p>Kindness comes to life in your world.</p>
        </div>
        <div class="kk-ar-mini-creature" data-kk-3d-creature data-creature-size="small"></div>
      </header>
      <div class="kk-ar-steps-grid">
        ${steps.map((step) => arPhoneStep(step, mission)).join("")}
      </div>
      <div class="kk-ar-bottom-grid">
        <article class="kk-ar-flow-card">
          <h3>How the AR feature works</h3>
          <div class="kk-ar-flow">
            ${[
              ["Camera", "You scan the real world"],
              ["Creature", "AR places magical elements"],
              ["Challenge", "You complete real-world missions"],
              ["Reward", "You earn kindness points"],
              ["Kingdom", "Your actions improve your kingdom"]
            ].map(([label, text]) => `<div><span>${escapeHtml(label)}</span><p>${escapeHtml(text)}</p></div>`).join("<b>→</b>")}
          </div>
        </article>
        <aside class="kk-ar-challenge-list">
          <h3>Examples of AR challenges</h3>
          <button data-action="spawn-ar-mission" data-mission="gratitude-crystal">Find something you are grateful for</button>
          <button data-action="spawn-ar-mission" data-mission="kindness-spirit">Give someone a kind compliment</button>
          <button data-action="spawn-ar-mission" data-mission="empathy-lantern">Listen and repeat what you heard</button>
          <button data-action="spawn-ar-mission" data-mission="calm-dragon">Do a breathing challenge</button>
          <button data-action="nav" data-view="multiplayer">Work together with a friend</button>
        </aside>
      </div>
      <div class="kk-ar-action-bar">
        <button class="kk-primary" data-action="start-ar-camera">${state.arCameraActive ? "Restart Camera" : "Enter AR Camera"}</button>
        <button data-action="complete-ar-mission" data-mission="${mission.id}">Complete ${escapeHtml(mission.name)}</button>
        <span>${progress.points} Kindness Points</span>
      </div>
      ${messageMarkup()}
    </section>
  `;
}

function arPhoneStep(step, mission) {
  return `
    <article class="kk-ar-step-card">
      <div class="kk-ar-step-copy">
        <span>${escapeHtml(step.number)}</span>
        <div><h3>${escapeHtml(step.title)}</h3><p>${escapeHtml(step.text)}</p></div>
      </div>
      <div class="kk-phone">
        <div class="kk-phone-screen ${step.mode} ${state.arCameraActive ? "camera-on" : ""}">
          <video data-ar-video autoplay playsinline muted></video>
          <div class="kk-room-sim">
            <div class="kk-room-window"></div>
            <div class="kk-room-plant"></div>
            <div class="kk-room-couch"></div>
            <div class="kk-room-table"></div>
            <div class="kk-ar-crystal one"></div>
            ${step.mode !== "scan" ? `<div class="kk-ar-portal"></div><div class="kk-ar-crystal two"></div><div class="kk-phone-creature" data-kk-3d-creature></div>` : ""}
            ${step.mode === "interact" ? `
              <div class="kk-phone-mission">
                <b>${escapeHtml(mission.name)}</b>
                <p>${escapeHtml(mission.prompt)}</p>
                <small>Reward: +${mission.points} Kindness Points</small>
              </div>
              <button class="kk-phone-accept" data-action="complete-ar-mission" data-mission="${mission.id}">Accept</button>
            ` : ""}
            ${step.mode === "reward" ? `
              <div class="kk-phone-reward"><b>Challenge Complete!</b><span>+${mission.points}</span><p>Kindness Points</p></div>
            ` : ""}
          </div>
          <div class="kk-phone-top"><span>×</span><span>?</span></div>
          <div class="kk-phone-bottom"><span>Map</span><b>AR</b><span>Bag</span></div>
          ${step.mode === "scan" ? `<button class="kk-phone-shutter" data-action="start-ar-camera">AR</button>` : ""}
        </div>
      </div>
    </article>
  `;
}

function renderMultiplayer() {
  const progress = PlayerData.loadProgress();
  const log = state.multiplayerLog.slice(-6).reverse();

  return `
    <section class="kk-dom-page kk-multiplayer-page">
      ${panelHead("Kind Kingdom Multiplayer", "Co-op kindness missions", "Join a shared room on this device/browser network flow. Students can coordinate missions, send kindness signals, and earn co-op rewards.", true, `${progress.points} pts`)}
      <div class="kk-multiplayer-layout">
        <article class="kk-dom-card kk-room-code-card">
          <label>Room Code
            <input data-multiplayer-room value="${escapeAttr(state.multiplayerRoom)}" maxlength="32">
          </label>
          <div class="kk-dom-actions">
            <button class="kk-primary" data-action="join-multiplayer">${state.multiplayerJoined ? "Rejoin Room" : "Join Room"}</button>
            <button data-action="multiplayer-ping">Send Kindness Signal</button>
          </div>
          <p>${state.multiplayerJoined ? `Connected to ${escapeHtml(state.multiplayerRoom)}.` : "Join a room to start a co-op mission."}</p>
        </article>
        <article class="kk-dom-card kk-coop-card">
          <p class="kk-eyebrow">Active co-op mission</p>
          <h3>Restore the Shared Portal</h3>
          <p>Each player does one helpful action nearby, then confirms it. When the group completes the mission, everyone can earn points.</p>
          <div class="kk-ar-steps">
            <span>1. Choose a real-world helpful action.</span>
            <span>2. Tell your teammate what you did.</span>
            <span>3. Confirm the portal together.</span>
          </div>
          <button class="kk-primary" data-action="complete-multiplayer-mission">Complete Co-op Mission</button>
        </article>
        <aside class="kk-dom-card kk-multiplayer-log">
          <h3>Room Activity</h3>
          ${log.map((item) => `<p><b>${escapeHtml(item.name)}:</b> ${escapeHtml(item.text)}</p>`).join("") || "<p>No room activity yet.</p>"}
        </aside>
      </div>
      ${messageMarkup()}
    </section>
  `;
}

function arMissions() {
  return [
    {
      id: "kindness-spirit",
      name: "Kindness Spirit",
      type: "Encouragement mission",
      npc: "Crystal Guide",
      skill: "Empathy",
      points: 30,
      xp: 12,
      prompt: "A floating kindness spirit appears nearby. Give someone a sincere compliment that names something specific.",
      steps: ["Find a person nearby or message someone kindly.", "Say exactly what you appreciate.", "Notice how the moment changes."]
    },
    {
      id: "gratitude-crystal",
      name: "Gratitude Crystal",
      type: "Gratitude hunt",
      npc: "Garden Sage",
      skill: "Gratitude",
      points: 25,
      xp: 12,
      prompt: "A crystal is glowing around something meaningful. Pick one object in your space and explain why you are thankful for it.",
      steps: ["Choose an object in the room.", "Name who or what it reminds you of.", "Say why it matters today."]
    },
    {
      id: "calm-dragon",
      name: "Calm Dragon",
      type: "Breathing challenge",
      npc: "Gate Keeper",
      skill: "Calm Choices",
      points: 25,
      xp: 12,
      prompt: "A little dragon stirs up a storm. Take four slow breaths and let the storm fade before acting.",
      steps: ["Breathe in for four counts.", "Hold for two counts.", "Breathe out slowly four times."]
    },
    {
      id: "empathy-lantern",
      name: "Empathy Lantern",
      type: "Emotional discovery",
      npc: "Lantern Keeper",
      skill: "Listening",
      points: 30,
      xp: 12,
      prompt: "A lantern lights up a feeling clue. Ask someone how they are doing and listen without interrupting.",
      steps: ["Ask one kind question.", "Listen to the full answer.", "Repeat one thing you heard."]
    }
  ];
}

async function startARCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    state.arCameraActive = false;
    return setMessage("Camera access is not available here, so AR preview is running in practice mode.");
  }
  stopARCamera();
  try {
    arCameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: "environment" } },
      audio: false
    });
    state.arCameraActive = true;
    state.message = "Camera opened. Tap a glowing AR object to choose a mission.";
    render();
  } catch {
    state.arCameraActive = false;
    setMessage("Camera permission was blocked. You can still use AR missions in practice mode.");
  }
}

function attachARVideo() {
  if (!arCameraStream) return;
  root.querySelectorAll("[data-ar-video]").forEach((video) => {
    video.srcObject = arCameraStream;
    video.play?.().catch(() => {});
  });
}

function stopARCamera() {
  if (!arCameraStream) return;
  arCameraStream.getTracks().forEach((track) => track.stop());
  arCameraStream = null;
  state.arCameraActive = false;
}

async function initARCreatures() {
  arCreatureCleanups.forEach((cleanup) => cleanup());
  arCreatureCleanups = [];
  const mounts = [...root.querySelectorAll("[data-kk-3d-creature]")];
  if (!mounts.length) return;
  try {
    const THREE = await loadThree();
    mounts.forEach((mount, index) => {
      if (!mount.isConnected || mount.dataset.threeReady) return;
      mount.dataset.threeReady = "true";
      arCreatureCleanups.push(createThreeKindnessCreature(THREE, mount, index));
    });
  } catch {
    mounts.forEach((mount) => {
      mount.innerHTML = `<div class="kk-css-creature"><i></i><b></b><span></span></div>`;
    });
  }
}

function loadThree() {
  if (threeLoadingPromise) return threeLoadingPromise;
  threeLoadingPromise = import("../assets/vendor/three.module.min.js");
  return threeLoadingPromise;
}

function createThreeKindnessCreature(THREE, mount, index = 0) {
  const width = Math.max(90, mount.clientWidth || 140);
  const height = Math.max(90, mount.clientHeight || 140);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(34, width / height, 0.1, 100);
  camera.position.set(0, 1.1, 5.3);
  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(width, height);
  mount.innerHTML = "";
  mount.appendChild(renderer.domElement);

  const creature = new THREE.Group();
  const blue = new THREE.MeshStandardMaterial({ color: 0x5ddcff, roughness: 0.42 });
  const purple = new THREE.MeshStandardMaterial({ color: 0x9b6dff, roughness: 0.45 });
  const dark = new THREE.MeshStandardMaterial({ color: 0x101032, roughness: 0.25 });
  const white = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.1 });
  const blush = new THREE.MeshStandardMaterial({ color: 0xff8fab, roughness: 0.4 });

  const body = new THREE.Mesh(new THREE.SphereGeometry(1.05, 32, 24), blue);
  body.scale.set(1, 1.05, 0.82);
  body.position.y = -0.35;
  creature.add(body);
  const head = new THREE.Mesh(new THREE.SphereGeometry(1.08, 32, 24), blue);
  head.scale.set(1.05, 0.92, 0.9);
  head.position.y = 0.75;
  creature.add(head);

  [-0.55, 0.55].forEach((x) => {
    const eye = new THREE.Mesh(new THREE.SphereGeometry(0.18, 24, 16), dark);
    eye.scale.set(1, 1.22, 0.42);
    eye.position.set(x, 0.92, 0.86);
    creature.add(eye);
    const shine = new THREE.Mesh(new THREE.SphereGeometry(0.055, 12, 8), white);
    shine.position.set(x - 0.045, 0.99, 0.98);
    creature.add(shine);
    const cheek = new THREE.Mesh(new THREE.SphereGeometry(0.13, 16, 10), blush);
    cheek.scale.set(1.25, 0.75, 0.26);
    cheek.position.set(x * 1.12, 0.62, 0.89);
    creature.add(cheek);
  });

  [-0.54, 0.54].forEach((x) => {
    const ear = new THREE.Mesh(new THREE.ConeGeometry(0.28, 0.7, 24), purple);
    ear.position.set(x, 1.56, 0.02);
    ear.rotation.z = -x * 0.48;
    creature.add(ear);
    const wing = new THREE.Mesh(new THREE.ConeGeometry(0.35, 0.9, 3), purple);
    wing.scale.set(0.8, 1, 0.18);
    wing.position.set(x * 1.38, 0.05, -0.1);
    wing.rotation.z = x * 0.82;
    creature.add(wing);
  });

  [-0.42, 0.42].forEach((x) => {
    const foot = new THREE.Mesh(new THREE.SphereGeometry(0.25, 18, 12), blue);
    foot.scale.set(1.1, 0.55, 0.65);
    foot.position.set(x, -1.34, 0.42);
    creature.add(foot);
  });

  scene.add(creature);
  scene.add(new THREE.AmbientLight(0xffffff, 1.75));
  const key = new THREE.DirectionalLight(0xffffff, 2.2);
  key.position.set(3, 5, 4);
  scene.add(key);
  const rim = new THREE.PointLight(0x9b6dff, 2.4, 7);
  rim.position.set(-2.5, 1.5, 3);
  scene.add(rim);

  let frame = 0;
  let stopped = false;
  const animate = () => {
    if (stopped || !mount.isConnected) return;
    frame += 0.018 + index * 0.001;
    creature.rotation.y = Math.sin(frame) * 0.22;
    creature.position.y = Math.sin(frame * 2.1) * 0.11;
    renderer.render(scene, camera);
    requestAnimationFrame(animate);
  };
  animate();
  return () => {
    stopped = true;
    renderer.dispose();
    mount.innerHTML = "";
    mount.dataset.threeReady = "";
  };
}

function joinMultiplayerRoom() {
  const input = root.querySelector("[data-multiplayer-room]");
  state.multiplayerRoom = String(input?.value || state.multiplayerRoom || "kind-kingdom-room").trim() || "kind-kingdom-room";
  if (multiplayerChannel) multiplayerChannel.close();
  if ("BroadcastChannel" in window) {
    multiplayerChannel = new BroadcastChannel(`kk-${state.multiplayerRoom}`);
    multiplayerChannel.onmessage = (event) => {
      if (!event.data || event.data.user === AuthSystem.currentUser()) return;
      state.multiplayerLog.push(event.data);
      if (state.view === "multiplayer") render();
    };
  }
  state.multiplayerJoined = true;
  state.multiplayerLog.push({ name: AuthSystem.currentUser(), text: `joined ${state.multiplayerRoom}.`, at: Date.now() });
  return render();
}

function sendMultiplayerMessage(text) {
  if (!state.multiplayerJoined) joinMultiplayerRoom();
  const message = { user: AuthSystem.currentUser(), name: AuthSystem.currentUser(), text, at: Date.now() };
  state.multiplayerLog.push(message);
  multiplayerChannel?.postMessage(message);
  return render();
}

function panelHead(title, eyebrow, text, backButton = false, pill = "") {
  return `
    <header class="kk-dom-head">
      <div>
        <p class="kk-eyebrow">${escapeHtml(eyebrow)}</p>
        <h2>${escapeHtml(title)}</h2>
        <p>${escapeHtml(text)}</p>
      </div>
      <div class="kk-head-buttons">
        ${pill ? `<span class="kk-points-pill">${escapeHtml(pill)}</span>` : ""}
        ${backButton ? `<button data-action="nav" data-view="dashboard">Back to Home</button>` : ""}
      </div>
    </header>
  `;
}

function pageScrollControlsMarkup() {
  return `
    <div class="kk-page-scroll-controls" aria-label="Page scroll controls">
      <button type="button" data-scroll-page="up" aria-label="Scroll up">↑</button>
      <button type="button" data-scroll-page="down" aria-label="Scroll down">↓</button>
    </div>
  `;
}

function oldStatCard(label, value, icon) {
  return `
    <article class="kk-old-stat-card">
      <b>${escapeHtml(icon)}</b>
      <strong>${escapeHtml(value)}</strong>
      <span>${escapeHtml(label)}</span>
    </article>
  `;
}

function categoryTabs(className = "kk-tabs-dom") {
  return `
    <div class="${className}">
      ${SHOP_CATEGORIES.map((category) => `<button data-action="shop-category" data-category="${category}" class="${state.shopCategory === category ? className === "kk-tabs" ? "active" : "selected" : ""}">${titleCase(category)}</button>`).join("")}
    </div>
  `;
}

function oldItemCard(item, rewards, closetMode) {
  const owned = rewards.owned.includes(item.id);
  const equipped = rewards.equipped[item.category] === item.id;
  const action = closetMode ? "equip-item" : owned && item.category !== "room" ? "equip-item" : "buy-item";
  const label = closetMode ? (equipped ? "Equipped" : "Equip") : owned ? (equipped ? "Equipped" : item.category === "room" ? "In Room" : "Equip") : "Buy";

  return `
    <article class="kk-shop-item ${owned ? "owned" : ""}">
      ${oldItemIcon(item)}
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.description)}</p>
      <small>${owned ? "Owned" : `${item.price} points`}</small>
      <button data-action="${action}" data-item="${item.id}" ${item.category === "room" && owned ? "disabled" : ""}>${label}</button>
    </article>
  `;
}

function oldItemIcon(item) {
  const color = Number(item.color || 0x7b4dff).toString(16).padStart(6, "0");
  const src = item.sprite || item.asset;
  return `
    <div class="kk-item-icon" style="--item-color:#${color}">
      ${src ? `<span class="kk-lpc-item-icon" style="background-image:url('${escapeAttr(src)}')"></span>` : `<span>${escapeHtml(item.icon)}</span>`}
    </div>
  `;
}

function itemCard(item, rewards, closetMode) {
  const owned = rewards.owned.includes(item.id);
  const equipped = rewards.equipped[item.category] === item.id;
  const action = closetMode ? "equip-item" : owned && item.category !== "room" ? "equip-item" : "buy-item";
  const label = closetMode ? (equipped ? "Unequip" : "Equip") : owned ? (item.category === "room" ? "Owned" : "Equip") : "Buy";

  return `
    <article class="kk-dom-card kk-shop-card ${owned ? "owned" : ""}">
      ${assetImage(item.asset, item.name, "kk-item-art")}
      <h3>${escapeHtml(item.name)}</h3>
      <p>${escapeHtml(item.description)}</p>
      <small>${owned ? "Owned" : `${item.price} points`}</small>
      <button data-action="${action}" data-item="${item.id}" ${item.category === "room" && owned ? "disabled" : ""}>${label}</button>
    </article>
  `;
}

function heroMarkup(heroId, compact = false) {
  const hero = getHero(heroId);
  const rewards = RewardSystem.load();
  const equipped = rewards.equipped || {};
  const accessoryLayers = [
    RewardSystem.item(equipped.capes)?.sprite,
    RewardSystem.item(equipped.outfits)?.sprite,
    RewardSystem.item(equipped.crowns)?.sprite
  ].filter(Boolean);
  const pet = RewardSystem.item(equipped.pets);

  return `
    <div class="kk-hero ${compact ? "compact" : ""}" aria-label="${escapeHtml(hero.title)}">
      ${hero.layers.map((layer) => heroLayerMarkup(HERO_LAYER_ASSETS[layer], layer)).join("")}
      ${accessoryLayers.map((src) => heroLayerMarkup(src, "Equipped accessory", true)).join("")}
      ${pet ? assetImage(pet.asset, pet.name, "kk-hero-pet") : ""}
    </div>
  `;
}

function heroLayerMarkup(src, label, accessory = false) {
  if (!src) return "";
  return `<span class="kk-lpc-layer ${accessory ? "accessory" : ""}" role="img" aria-label="${escapeAttr(label)}" style="background-image:url('${escapeAttr(src)}')"></span>`;
}

function portalMarkup(portal, progress) {
  const completed = progress.completed.includes(portal.game.slug);
  const required = UnlockSystem.requiredPoints(portal.index);
  const unlocked = UnlockSystem.isUnlocked(required);
  return `
    <button class="kk-map-portal ${completed ? "complete" : ""} ${unlocked ? "" : "locked"}" style="left:${portal.x}px; top:${portal.y}px;" data-action="enter-game" data-slug="${portal.game.slug}">
      <span class="kk-portal-icon">${escapeHtml(portal.game.icon)}</span>
      <b>${escapeHtml(portal.game.title)}</b>
      <small>${completed ? "Complete" : unlocked ? portal.game.category : `${required} pts`}</small>
    </button>
  `;
}

function guideMarkup(npc, index, progress, mood) {
  const points = [
    { x: 365, y: 235 },
    { x: 1340, y: 230 },
    { x: 2790, y: 250 },
    { x: 1820, y: 1000 }
  ];
  return `
    <button class="kk-map-guide" style="left:${points[index].x}px; top:${points[index].y}px;" data-action="talk-guide" data-npc="${escapeHtml(npc)}">
      <span>${["CG", "GK", "RP", "LK"][index]}</span>
      <b>${escapeHtml(npc)}</b>
      <small>${escapeHtml(NPCMemorySystem.statusFor(npc))}</small>
    </button>
  `;
}

function mapControlsMarkup() {
  return `
    <div class="kk-map-pad">
      <button data-action="move" data-dx="0" data-dy="-45" aria-label="Move up">↑</button>
      <button data-action="move" data-dx="-45" data-dy="0" aria-label="Move left">←</button>
      <button data-action="enter-nearest" class="kk-primary" aria-label="Enter nearest portal">↵</button>
      <button data-action="move" data-dx="45" data-dy="0" aria-label="Move right">→</button>
      <button data-action="move" data-dx="0" data-dy="45" aria-label="Move down">↓</button>
    </div>
  `;
}

function shouldShowMapControls() {
  return state.showMapControls || isTouchMapDevice();
}

function isTouchMapDevice() {
  return Boolean(window.matchMedia?.("(pointer: coarse)")?.matches || window.innerWidth < 760);
}

function mapPortals() {
  const positions = [
    [380, 300], [610, 250], [845, 330], [560, 520],
    [1350, 310], [1650, 260], [1900, 380], [1555, 570],
    [2470, 350], [2740, 530], [2355, 680],
    [430, 1260], [720, 1450], [980, 1240],
    [1680, 1280], [2050, 1460], [2360, 1250], [2640, 1540]
  ];
  return games().slice(0, positions.length).map((game, index) => ({
    game,
    index,
    x: positions[index][0],
    y: positions[index][1]
  }));
}

function islandMarkup() {
  return `
    <div class="kk-island castle"></div>
    <div class="kk-island lantern"></div>
    <div class="kk-island crystal"></div>
    <div class="kk-island harbor"></div>
    <div class="kk-island moon"></div>
    <div class="kk-waterfall wf1"></div>
    <div class="kk-waterfall wf2"></div>
    <div class="kk-map-gem g1"></div>
    <div class="kk-map-gem g2"></div>
    <div class="kk-map-lantern l1"></div>
    <div class="kk-map-lantern l2"></div>
    <div class="kk-map-ship"></div>
  `;
}

function bridgeMarkup() {
  return `
    <div class="kk-bridge b1"></div>
    <div class="kk-bridge b2"></div>
    <div class="kk-bridge b3"></div>
    <div class="kk-bridge b4"></div>
  `;
}

function regionLabelMarkup() {
  return `
    <div class="kk-region-label castle">Castle Commons</div>
    <div class="kk-region-label lantern">Lantern Woods</div>
    <div class="kk-region-label crystal">Crystal Highlands</div>
    <div class="kk-region-label harbor">Harbor Coast</div>
    <div class="kk-region-label moon">Moon Meadow</div>
  `;
}

function nearestPortal() {
  const player = PlayerData.loadPlayer();
  return mapPortals()
    .map((portal) => ({
      ...portal,
      distance: Math.hypot(player.x - portal.x, player.y - portal.y)
    }))
    .sort((a, b) => a.distance - b.distance)[0];
}

function movePlayer(dx, dy) {
  if (phaserMapApi) {
    phaserMapApi.moveBy(dx, dy);
    return;
  }
  const player = PlayerData.loadPlayer();
  PlayerData.savePosition(clamp(player.x + dx, 50, MAP_WIDTH - 50), clamp(player.y + dy, 70, MAP_HEIGHT - 70));
  const marker = root.querySelector("[data-player-marker]");
  if (marker) {
    const next = PlayerData.loadPlayer();
    marker.style.left = `${next.x}px`;
    marker.style.top = `${next.y}px`;
    syncMapHint();
    centerMapOnPlayer();
  } else {
    render();
  }
}

function centerMapOnPlayer() {
  if (phaserMapApi) {
    phaserMapApi.centerOnPlayer();
    return;
  }
  const stage = root.querySelector("[data-map-stage]");
  if (!stage) return;
  const player = PlayerData.loadPlayer();
  if (document.activeElement !== stage && state.view === "map") stage.focus({ preventScroll: true });
  stage.scrollTo({
    left: Math.max(0, player.x - stage.clientWidth / 2),
    top: Math.max(0, player.y - stage.clientHeight / 2),
    behavior: "smooth"
  });
}

function syncMapHint() {
  const hint = root.querySelector("[data-map-hint]");
  if (!hint) return;
  const nearby = phaserMapApi?.nearby() || nearestPortal();
  state.nearestSlug = nearby && nearby.distance < 105 ? nearby.game.slug : null;
  hint.textContent = state.nearestSlug ? `Press E to enter ${nearby.game.title}` : "Move near a portal.";
}

function enterGame(slug) {
  const game = games().find((item) => item.slug === slug);
  if (!game) return setMessage("That game was not found.");
  window.location.href = `game.html?game=${encodeURIComponent(slug)}`;
}

async function handleClick(event) {
  const target = event.target.closest("[data-action]");
  if (!target) return;
  const action = target.dataset.action;

  if (action === "nav") return navigate(target.dataset.view);
  if (action === "logout") {
    clearMovementState();
    AuthSystem.logout();
    state.view = "login";
    state.message = "";
    return render();
  }
  if (action === "choose-character") {
    PlayerData.setCharacter(target.dataset.hero);
    return navigate("dashboard", "Hero selected.");
  }
  if (action === "enter-game") return enterGame(target.dataset.slug);
  if (action === "enter-nearest") {
    const nearby = phaserMapApi?.nearby() || nearestPortal();
    if (nearby?.distance < 120) return enterGame(nearby.game.slug);
    return setMessage("Move closer to a game portal first.");
  }
  if (action === "move") {
    root.querySelector("[data-map-stage]")?.focus();
    return movePlayer(Number(target.dataset.dx), Number(target.dataset.dy));
  }
  if (action === "talk-guide") {
    NPCMemorySystem.recordVisit(target.dataset.npc);
    return setMessage(NPCMemorySystem.memoryFor(target.dataset.npc));
  }
  if (action === "toggle-map-controls") {
    state.showMapControls = !state.showMapControls;
    return render();
  }
  if (action === "shop-category") {
    state.shopCategory = target.dataset.category;
    state.message = "";
    return render();
  }
  if (action === "buy-item") {
    const result = RewardSystem.purchase(target.dataset.item);
    return setMessage(result.message);
  }
  if (action === "equip-item") {
    const result = RewardSystem.equip(target.dataset.item);
    return setMessage(result.message);
  }
  if (action === "equip-title") {
    const result = RewardSystem.equipTitle(target.dataset.title);
    return setMessage(result.message);
  }
  if (action === "claim-quest") {
    const result = RewardSystem.claimDailyQuest(target.dataset.quest);
    return setMessage(result.message);
  }
  if (action === "claim-pass") {
    const result = RewardSystem.claimPassReward(target.dataset.level);
    return setMessage(result.message);
  }
  if (action === "generate-story") {
    target.disabled = true;
    state.story = await StoryForgeSystem.generate({ skill: state.storySkill });
    state.message = "New story generated.";
    return render();
  }
  if (action === "story-choice") {
    const correct = target.dataset.correct === "true";
    const story = state.story || StoryForgeSystem.latest(1)[0];
    EmotionSystem.recordChoice(correct, { skill: story?.skill, label: story?.title });
    NPCMemorySystem.recordStoryChoice({ npcName: story?.npcName, skill: story?.skill, title: story?.title, correct });
    return setMessage(target.dataset.result || (correct ? "Helpful choice." : "Try a repair next."));
  }
  if (action === "select-news") {
    state.selectedNewsId = target.dataset.news;
    return render();
  }
  if (action === "mark-news-read") {
    KingdomNewsSystem.markAllRead();
    return setMessage("News marked as read.");
  }
  if (action === "start-ar-camera") return startARCamera();
  if (action === "spawn-ar-mission") {
    state.arMissionId = target.dataset.mission;
    return render();
  }
  if (action === "complete-ar-mission") {
    const mission = arMissions().find((item) => item.id === target.dataset.mission) || arMissions()[0];
    UnlockSystem.addPoints(mission.points);
    PlayerData.addSkillXP(mission.skill, mission.xp);
    EmotionSystem.recordChoice(true, { skill: mission.skill, label: mission.name });
    NPCMemorySystem.recordStoryChoice({ npcName: mission.npc, skill: mission.skill, title: mission.name, correct: true });
    return navigate("dashboard", `${mission.name} complete. +${mission.points} Kindness Points earned.`);
  }
  if (action === "join-multiplayer") return joinMultiplayerRoom();
  if (action === "multiplayer-ping") return sendMultiplayerMessage("sent a kindness signal to the room.");
  if (action === "complete-multiplayer-mission") {
    UnlockSystem.addPoints(35);
    PlayerData.addSkillXP("Teamwork", 15);
    EmotionSystem.recordChoice(true, { skill: "Teamwork", label: "Shared Portal Mission" });
    sendMultiplayerMessage("completed the Shared Portal co-op mission.");
    return setMessage("Co-op mission complete. +35 Kindness Points and +15 Teamwork XP.");
  }
}

function handlePointerDown(event) {
  const button = event.target.closest("[data-scroll-page]");
  if (!button || state.view === "map") return;
  event.preventDefault();
  event.stopPropagation();
  const direction = button.dataset.scrollPage === "up" ? -1 : 1;
  scrollCurrentPage(direction);
  stopPageScrollHold();
  scrollHoldTimer = window.setInterval(() => scrollCurrentPage(direction), 45);
}

function handleScrollClick(event) {
  const button = event.target.closest("[data-scroll-page]");
  if (!button || state.view === "map") return;
  event.preventDefault();
  event.stopPropagation();
  scrollCurrentPage(button.dataset.scrollPage === "up" ? -1 : 1, 150);
}

function stopPageScrollHold() {
  if (!scrollHoldTimer) return;
  window.clearInterval(scrollHoldTimer);
  scrollHoldTimer = null;
}

function scrollCurrentPage(direction, amount = 54) {
  const target = scrollTarget();
  target.scrollBy({ top: direction * amount, behavior: "auto" });
}

function scrollTarget() {
  const page = root.querySelector(".kk-dom-page");
  if (page && page.scrollHeight > page.clientHeight + 2) return page;
  if (root.scrollHeight > root.clientHeight + 2) return root;
  return document.scrollingElement || document.documentElement;
}

function handleSubmit(event) {
  const form = event.target.closest("[data-auth-form]");
  if (!form) return;
  event.preventDefault();
  const submitter = event.submitter || root.querySelector("[data-auth='login']");
  const formData = new FormData(form);
  const method = submitter.dataset.auth === "signup" ? "signup" : "login";
  const result = AuthSystem[method](formData.get("username"), formData.get("password"));
  if (!result.ok) return setMessage(result.message);
  RewardSystem.awardDailyVisit();
  state.view = "dashboard";
  state.message = method === "signup" ? "Account created." : "Welcome back.";
  render();
}

function handleChange(event) {
  if (event.target.matches("[data-action='story-skill']")) {
    state.storySkill = event.target.value;
  }
}

function handleKeydown(event) {
  if (!AuthSystem.isLoggedIn() || state.view !== "map") return;
  if (["INPUT", "TEXTAREA", "SELECT"].includes(event.target?.tagName)) return;
  const movementKey = normalizedMovementKey(event);
  if (movementKey) {
    event.preventDefault();
    event.stopPropagation();
    pressedMapKeys.add(movementKey);
    runMovementLoop();
  }
  if (event.key.toLowerCase() === "e" || event.code === "KeyE") {
    event.preventDefault();
    event.stopPropagation();
    const nearby = phaserMapApi?.nearby() || nearestPortal();
    if (nearby?.distance < 120) enterGame(nearby.game.slug);
  }
}

function handleKeyup(event) {
  const movementKey = normalizedMovementKey(event);
  if (!movementKey) return;
  pressedMapKeys.delete(movementKey);
  if (!pressedMapKeys.size && movementLoop) {
    window.clearInterval(movementLoop);
    movementLoop = null;
  }
}

function normalizedMovementKey(event) {
  const codeMap = {
    ArrowLeft: "left",
    KeyA: "left",
    ArrowRight: "right",
    KeyD: "right",
    ArrowUp: "up",
    KeyW: "up",
    ArrowDown: "down",
    KeyS: "down"
  };
  const keyMap = {
    arrowleft: "left",
    a: "left",
    arrowright: "right",
    d: "right",
    arrowup: "up",
    w: "up",
    arrowdown: "down",
    s: "down"
  };
  return codeMap[event.code] || keyMap[String(event.key || "").toLowerCase()] || "";
}

function runMovementLoop() {
  if (movementLoop) return;
  moveFromPressedKeys();
  movementLoop = window.setInterval(moveFromPressedKeys, 60);
}

function moveFromPressedKeys() {
  if (!pressedMapKeys.size || state.view !== "map") return;
  let dx = 0;
  let dy = 0;
  if (pressedMapKeys.has("left")) dx -= 18;
  if (pressedMapKeys.has("right")) dx += 18;
  if (pressedMapKeys.has("up")) dy -= 18;
  if (pressedMapKeys.has("down")) dy += 18;
  if (dx || dy) movePlayer(dx, dy);
}

async function initPhaserMap() {
  const parent = root.querySelector("[data-phaser-map]");
  if (!parent || phaserMapGame) return;
  await loadPhaser();
  if (!root.querySelector("[data-phaser-map]") || state.view !== "map") return;

  const width = Math.max(960, parent.clientWidth || 960);
  const height = Math.max(760, parent.clientHeight || 760);
  const { KingdomMapScene } = await import("./scenes/KingdomMapScene.js?v=79");
  const scenes = createLegacyPhaserMapScenes(KingdomMapScene);

  phaserMapGame = new window.Phaser.Game({
    type: window.Phaser.AUTO,
    parent,
    width,
    height,
    backgroundColor: "#6fb7ff",
    pixelArt: true,
    physics: {
      default: "arcade",
      arcade: { debug: false }
    },
    scale: {
      mode: window.Phaser.Scale.RESIZE,
      autoCenter: window.Phaser.Scale.CENTER_BOTH
    },
    scene: scenes
  });
}

function destroyPhaserMap() {
  phaserMapApi = null;
  if (!phaserMapGame) return;
  phaserMapGame.destroy(true);
  phaserMapGame = null;
}

function loadPhaser() {
  if (window.Phaser) return Promise.resolve();
  if (phaserLoadingPromise) return phaserLoadingPromise;
  phaserLoadingPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "assets/vendor/phaser.min.js";
    script.onload = resolve;
    script.onerror = () => {
      const fallback = document.createElement("script");
      fallback.src = "https://cdn.jsdelivr.net/npm/phaser@3.80.1/dist/phaser.min.js";
      fallback.onload = resolve;
      fallback.onerror = reject;
      document.head.appendChild(fallback);
    };
    document.head.appendChild(script);
  });
  return phaserLoadingPromise;
}

function createLegacyPhaserMapScenes(KingdomMapScene) {
  class MapAssetBootScene extends window.Phaser.Scene {
    constructor() {
      super("MapAssetBootScene");
    }

    preload() {
      const allGames = games();
      Object.entries(HERO_LAYER_ASSETS).forEach(([key, path]) => {
        if (!this.textures.exists(`lpc-${key}`)) {
          this.load.spritesheet(`lpc-${key}`, path, { frameWidth: 64, frameHeight: 64 });
        }
      });
      ["baby-dragon", "lantern-fox", "crystal-turtle", "cloud-owl", "firefly-bunny"].forEach((pet) => {
        if (!this.textures.exists(`pet-${pet}`)) this.load.svg(`pet-${pet}`, `assets/lpc-generated/pets/${pet}.svg`, { width: 96, height: 96 });
      });
      [
        "gratitude-cape", "courage-crown", "rainbow-trail", "calm-waterfall", "empathy-wings",
        "royal-helper-coat", "kindness-crown", "star-trail", "garden-desk", "pet-bed", "lantern-night-sky"
      ].forEach((item) => {
        if (!this.textures.exists(`item-${item}`)) this.load.svg(`item-${item}`, `assets/lpc-generated/items/${item}.svg`, { width: 96, height: 96 });
      });
      if (!this.textures.exists("kingdom-world-map")) {
        this.load.svg("kingdom-world-map", "src/assets/maps/kingdom-world-map.svg", { width: 3200, height: 2100 });
      }
      allGames.forEach((game) => {
        if (!this.textures.exists(`game-${game.slug}`)) this.load.image(`game-${game.slug}`, `assets/images/games/${game.slug}.jpg`);
      });
    }

    create() {
      if (!this.textures.exists("hero-hitbox")) {
        const graphics = this.make.graphics({ x: 0, y: 0, add: false });
        graphics.fillStyle(0xffffff, 0.01);
        graphics.fillRect(0, 0, 40, 40);
        graphics.generateTexture("hero-hitbox", 40, 40);
        graphics.destroy();
      }
      Object.keys(HERO_LAYER_ASSETS).forEach((key) => {
        const animationKey = `lpc-${key}-walk`;
        if (this.anims.exists(animationKey)) return;
        this.anims.create({
          key: animationKey,
          frames: WALK_FRAMES.map((frame) => ({ key: `lpc-${key}`, frame })),
          frameRate: 8,
          repeat: -1
        });
      });
      this.scene.start("KingdomMapScene");
    }
  }

  class DomConnectedKingdomMapScene extends KingdomMapScene {
    create() {
      super.create();
      this.installDomRoutes();
      phaserMapApi = {
        moveBy: (dx, dy) => this.nudgePlayer(dx, dy),
        centerOnPlayer: () => this.cameras.main.centerOn(this.player.x, this.player.y),
        nearby: () => {
          const nearby = this.getNearbyLocation();
          return nearby ? { game: nearby.game, distance: window.Phaser.Math.Distance.Between(this.player.x, this.player.y, nearby.x, nearby.y) } : null;
        }
      };
      syncMapHint();
    }

    installDomRoutes() {
      const plugin = this.scene;
      plugin.start = (key) => {
        const route = {
          DashboardScene: "dashboard",
          CharacterSelectScene: "character",
          ShopScene: "shop",
          ClosetScene: "closet",
          PlayerRoomScene: "room",
          StoryForgeScene: "story",
          KingdomNewsScene: "news",
          ReflectionJournalScene: "journal",
          LoginScene: "login"
        }[key];
        if (route === "login") {
          state.view = "login";
          state.message = "";
          render();
        } else if (route) {
          navigate(route);
        }
        return plugin;
      };
      plugin.launch = () => plugin;
      plugin.pause = () => plugin;
    }

    nudgePlayer(dx, dy) {
      if (!this.player) return;
      const nextX = window.Phaser.Math.Clamp(this.player.x + dx, 40, MAP_WIDTH - 40);
      const nextY = window.Phaser.Math.Clamp(this.player.y + dy, 40, MAP_HEIGHT - 40);
      this.player.setPosition(nextX, nextY);
      PlayerData.savePosition(nextX, nextY);
      syncMapHint();
    }

    openLauncher(game, index, unlocked, required) {
      if (!unlocked) {
        this.infoText?.setText(`${game.title} needs ${required} points.`);
        return;
      }
      enterGame(game.slug);
    }
  }

  return [MapAssetBootScene, DomConnectedKingdomMapScene];
}

function createPhaserMapScene() {
  return class DomOnlyKingdomMapScene extends window.Phaser.Scene {
    constructor() {
      super("DomOnlyKingdomMapScene");
    }

    create() {
      this.locations = [];
      this.playerData = PlayerData.loadPlayer();
      this.progress = PlayerData.loadProgress();
      this.rewards = RewardSystem.load();
      this.mood = EmotionSystem.getKingdomMood(this.progress);
      this.cameras.main.setBounds(0, 0, MAP_WIDTH, MAP_HEIGHT);
      this.cameras.main.setZoom(0.88);
      this.drawWorld();
      this.createPortals();
      this.createGuides();
      this.createPlayer();
      this.createHud();
      this.cursors = this.input.keyboard.createCursorKeys();
      this.keys = this.input.keyboard.addKeys("W,A,S,D,E");
      this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
      phaserMapApi = {
        moveBy: (dx, dy) => this.movePlayer(dx, dy),
        centerOnPlayer: () => this.cameras.main.centerOn(this.player.x, this.player.y),
        nearby: () => this.nearestPortal()
      };
      syncMapHint();
    }

    drawWorld() {
      this.add.rectangle(MAP_WIDTH / 2, MAP_HEIGHT / 2, MAP_WIDTH, MAP_HEIGHT, 0x7cc7ff);
      this.add.rectangle(MAP_WIDTH / 2, MAP_HEIGHT / 2 + 520, MAP_WIDTH, MAP_HEIGHT, 0x91e5f6, 0.24);
      this.add.circle(2780, 180, 82, 0xffd166, 0.94);
      const regions = [
        { name: "Castle Commons", color: 0xd9f2b4, stroke: 0x81b29a, x: 700, y: 520, w: 900, h: 620 },
        { name: "Lantern Woods", color: 0x7fcf9f, stroke: 0x2d6a4f, x: 1660, y: 540, w: 900, h: 650 },
        { name: "Crystal Highlands", color: 0xc8b6ff, stroke: 0x5a2da0, x: 2550, y: 620, w: 760, h: 700 },
        { name: "Harbor Coast", color: 0x91e5f6, stroke: 0x247ba0, x: 900, y: 1450, w: 980, h: 620 },
        { name: "Moon Meadow", color: 0xfde2ff, stroke: 0xa06cd5, x: 2050, y: 1500, w: 980, h: 650 }
      ];
      regions.forEach((region) => {
        const g = this.add.graphics();
        g.fillStyle(region.color, 1);
        g.lineStyle(10, region.stroke, 0.32);
        g.fillRoundedRect(region.x - region.w / 2, region.y - region.h / 2, region.w, region.h, 95);
        g.strokeRoundedRect(region.x - region.w / 2, region.y - region.h / 2, region.w, region.h, 95);
        this.add.text(region.x, region.y - region.h / 2 + 42, region.name.toUpperCase(), {
          fontFamily: "Nunito, Arial, sans-serif",
          fontSize: "18px",
          color: "#ffffff",
          fontStyle: "bold",
          backgroundColor: "#2d174dcc",
          padding: { x: 14, y: 7 },
          stroke: "#1d1236",
          strokeThickness: 3
        }).setOrigin(0.5).setDepth(50);
      });
      for (let i = 0; i < 10; i += 1) {
        this.add.ellipse(280 + i * 290, 145 + (i % 4) * 90, 180 + (i % 3) * 40, 54, 0xffffff, 0.14).setDepth(2);
      }
    }

    createPortals() {
      mapPortals().forEach((portal) => this.createPortal(portal));
    }

    createPortal(portalData) {
      const { game, index, x, y } = portalData;
      const required = UnlockSystem.requiredPoints(index);
      const complete = UnlockSystem.isCompleted(game.slug);
      const unlocked = UnlockSystem.isUnlocked(required);
      const container = this.add.container(x, y).setDepth(20);
      container.game = game;
      container.index = index;
      container.required = required;
      container.locked = !unlocked;
      container.add(this.add.ellipse(0, 50, 130, 34, 0x000000, 0.2));
      container.add(this.add.circle(0, -2, 68, complete ? 0xffd166 : 0x5a2da0, complete ? 0.28 : 0.12));
      container.add(this.add.ellipse(0, 44, 110, 36, 0xe7d2a0, unlocked ? 0.92 : 0.34).setStrokeStyle(3, 0x7a5a35, unlocked ? 0.36 : 0.18));
      container.add(this.add.rectangle(0, -8, 108, 104, complete ? 0xfff2a8 : 0xfffbef, unlocked ? 0.96 : 0.38).setStrokeStyle(4, complete ? 0x2ec4b6 : 0x5a2da0, unlocked ? 0.82 : 0.32));
      container.add(this.add.rectangle(0, -68, 114, 22, complete ? 0xffb703 : 0x5a2da0, unlocked ? 0.94 : 0.4).setStrokeStyle(3, 0xffffff, unlocked ? 0.55 : 0.16));
      container.add(this.add.text(0, -16, game.icon, { fontSize: "34px" }).setOrigin(0.5));
      container.add(this.add.text(0, 70, game.title, {
        fontFamily: "Nunito, Arial, sans-serif",
        fontSize: "13px",
        color: "#ffffff",
        backgroundColor: complete ? "#14746f" : "#2d174dcc",
        padding: { x: 8, y: 5 },
        align: "center",
        wordWrap: { width: 138 },
        stroke: "#1d1236",
        strokeThickness: 3
      }).setOrigin(0.5, 0));
      container.setSize(150, 170);
      container.setInteractive(new window.Phaser.Geom.Rectangle(-75, -85, 150, 170), window.Phaser.Geom.Rectangle.Contains);
      container.on("pointerdown", () => unlocked ? enterGame(game.slug) : setMessage(`Need ${required} points.`));
      this.locations.push(container);
    }

    createGuides() {
      [
        { x: 365, y: 235, name: "Crystal Guide", color: 0x7b4dff },
        { x: 1340, y: 230, name: "Gate Keeper", color: 0x2ec4b6 },
        { x: 2790, y: 250, name: "Roundtable Page", color: 0xd76d77 },
        { x: 1820, y: 1000, name: "Lantern Keeper", color: 0xffb703 }
      ].forEach((npc) => {
        this.add.circle(npc.x, npc.y, 34, npc.color, 0.95).setStrokeStyle(4, 0xffffff).setDepth(35);
        this.add.text(npc.x, npc.y, npc.name.split(" ").map((part) => part[0]).join(""), {
          fontFamily: "Nunito, Arial, sans-serif",
          fontSize: "16px",
          color: "#ffffff",
          fontStyle: "bold"
        }).setOrigin(0.5).setDepth(36);
        this.add.text(npc.x, npc.y + 48, npc.name, {
          fontFamily: "Nunito, Arial, sans-serif",
          fontSize: "15px",
          color: "#2d174d",
          backgroundColor: "#ffffffdd",
          padding: { x: 8, y: 5 },
          stroke: "#ffffff",
          strokeThickness: 2
        }).setOrigin(0.5).setDepth(36);
      });
    }

    createPlayer() {
      const x = clamp(this.playerData.x || 520, 60, MAP_WIDTH - 60);
      const y = clamp(this.playerData.y || 420, 80, MAP_HEIGHT - 80);
      this.player = this.add.container(x, y).setDepth(100);
      this.player.add(this.add.circle(0, 0, 42, 0xffd166, 0.72).setStrokeStyle(5, 0xffffff));
      this.player.add(this.add.rectangle(0, 4, 28, 44, 0x2ec4b6).setStrokeStyle(4, 0x053f3b));
      this.player.add(this.add.circle(0, -28, 17, 0xffd6bd).setStrokeStyle(3, 0x2d174d));
      this.player.add(this.add.text(0, 45, "YOU", {
        fontFamily: "Nunito, Arial, sans-serif",
        fontSize: "14px",
        color: "#053f3b",
        backgroundColor: "#77e5dc",
        padding: { x: 8, y: 3 },
        fontStyle: "bold"
      }).setOrigin(0.5));
      this.player.setSize(80, 100);
    }

    createHud() {
      this.hud = this.add.text(24, 22, "WASD / Arrow keys move • E enters nearby portal", {
        fontFamily: "Nunito, Arial, sans-serif",
        fontSize: "18px",
        color: "#ffffff",
        backgroundColor: "#2d174dcc",
        padding: { x: 12, y: 8 }
      }).setScrollFactor(0).setDepth(200);
    }

    update() {
      let dx = 0;
      let dy = 0;
      const speed = 5.2;
      if (this.cursors.left.isDown || this.keys.A.isDown) dx -= speed;
      if (this.cursors.right.isDown || this.keys.D.isDown) dx += speed;
      if (this.cursors.up.isDown || this.keys.W.isDown) dy -= speed;
      if (this.cursors.down.isDown || this.keys.S.isDown) dy += speed;
      if (dx || dy) this.movePlayer(dx, dy);
      if (window.Phaser.Input.Keyboard.JustDown(this.keys.E)) {
        const nearby = this.nearestPortal();
        if (nearby?.distance < 120) enterGame(nearby.game.slug);
      }
      syncMapHint();
    }

    movePlayer(dx, dy) {
      this.player.x = clamp(this.player.x + dx, 60, MAP_WIDTH - 60);
      this.player.y = clamp(this.player.y + dy, 80, MAP_HEIGHT - 80);
      PlayerData.savePosition(this.player.x, this.player.y);
    }

    nearestPortal() {
      return this.locations
        .map((portal) => ({
          game: portal.game,
          distance: window.Phaser.Math.Distance.Between(this.player.x, this.player.y, portal.x, portal.y)
        }))
        .sort((a, b) => a.distance - b.distance)[0];
    }
  };
}

function navigate(view, message = "") {
  if (view !== "map") clearMovementState();
  state.view = view;
  state.message = message;
  render();
}

function clearMovementState() {
  pressedMapKeys.clear();
  if (!movementLoop) return;
  window.clearInterval(movementLoop);
  movementLoop = null;
}

function setMessage(message) {
  state.message = message;
  render();
}

function storyMarkup(story) {
  return `
    <article class="kk-dom-card kk-story-card">
      <p class="kk-eyebrow">${escapeHtml(story.skill)} with ${escapeHtml(story.npcName)}</p>
      <h3>${escapeHtml(story.title)}</h3>
      <p>${escapeHtml(story.situation)}</p>
      <div class="kk-dialogue">${story.dialogue.map((line) => `<p>${escapeHtml(line)}</p>`).join("")}</div>
      <h4>${escapeHtml(story.challenge)}</h4>
      <div class="kk-choice-list">
        ${story.choices.map((choice) => `<button data-action="story-choice" data-correct="${Boolean(choice.correct)}" data-result="${escapeAttr(choice.result)}">${escapeHtml(choice.text)}</button>`).join("")}
      </div>
      <p class="kk-reflection-prompt">${escapeHtml(story.reflection)}</p>
    </article>
  `;
}

function newsArticle(post) {
  return `
    <article class="kk-news-article-dom">
      ${assetImage(post.image, post.title, "kk-news-image")}
      <p class="kk-eyebrow">${escapeHtml(post.kicker)} | ${escapeHtml(post.date)}</p>
      <h3>${escapeHtml(post.title)}</h3>
      <p><b>${escapeHtml(post.summary)}</b></p>
      <p>${escapeHtml(post.body)}</p>
    </article>
  `;
}

function journalEntry(entry) {
  return `
    <article class="kk-journal-paper">
      <p class="kk-eyebrow">${escapeHtml(entry.category)} | ${new Date(entry.createdAt).toLocaleDateString()}</p>
      <h3>${escapeHtml(entry.gameTitle)}</h3>
      <p><b>How I might feel:</b> ${escapeHtml(entry.feeling || "Not answered")}</p>
      <p><b>My connection:</b> ${escapeHtml(entry.experience || "Not answered")}</p>
      <p><b>Next time:</b> ${escapeHtml(entry.nextStep || "Not answered")}</p>
    </article>
  `;
}

function badgeTile(badge, unlockedBadges) {
  const unlocked = unlockedBadges.some((item) => item.id === badge.id);
  return `
    <div class="kk-badge-tile ${unlocked ? "unlocked" : ""}">
      ${assetImage(badge.asset, badge.name, "kk-badge-art")}
      <b>${escapeHtml(unlocked ? badge.name : "Locked")}</b>
      <span>${escapeHtml(badge.name)}</span>
    </div>
  `;
}

function assetTile(item) {
  return `
    <div class="kk-room-item">
      ${assetImage(item.asset, item.name, "kk-room-art")}
      <b>${escapeHtml(item.name)}</b>
    </div>
  `;
}

function equippedSummary(rewards) {
  const entries = ["outfits", "crowns", "capes", "pets", "trails", "effects"]
    .map((category) => `${titleCase(category)}: ${RewardSystem.item(rewards.equipped[category])?.name || "None"}`);
  return entries.join(" | ");
}

function messageMarkup() {
  return state.message ? `<p class="kk-panel-message kk-dom-message">${escapeHtml(state.message)}</p>` : "";
}

function emptyCard(title, text) {
  return `<article class="kk-dom-card kk-empty-card"><h3>${escapeHtml(title)}</h3><p>${escapeHtml(text)}</p></article>`;
}

function emptyInline(text) {
  return `<p>${escapeHtml(text)}</p>`;
}

function assetImage(src, alt, className) {
  if (!src) return "";
  return `<img class="${className}" src="${escapeAttr(src)}" alt="${escapeAttr(alt)}" loading="lazy">`;
}

function games() {
  return window.KIND_KINGDOM_GAMES || [];
}

function titleCase(value) {
  return String(value || "").replace(/-/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
}

function moodClass(mood) {
  return `kk-mood-${String(mood.sky || "growing").toLowerCase()}`;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, Number(value) || 0));
}

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[char]));
}

function escapeAttr(value) {
  return escapeHtml(value).replace(/`/g, "&#096;");
}
