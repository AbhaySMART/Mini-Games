const grid = document.querySelector("#game-grid");
const filters = document.querySelector("#skill-filters");
const featured = document.querySelector("#dashboard-featured");
const recommendation = document.querySelector("#recommendation-panel");
const comingSoon = document.querySelector("#coming-soon");
const DASHBOARD_PROGRESS_KEY = "kindKingdomProgress";
const COMING_SOON_GAMES = [
  { title: "Wonder Workshop", skill: "Inventive Kindness", time: "7 min" },
  { title: "Harmony Harbor", skill: "Group Balance", time: "6 min" },
  { title: "Bravery Balloon", skill: "Trying New Things", time: "5 min" }
];
const skillAliases = {
  "Kind Words": "Kindness",
  "Communication": "Listening",
  "Cooperation": "Teamwork",
  "Gratitude": "Gratitude",
  "Respect": "Respect",
  "Empathy": "Empathy",
  "Generosity": "Sharing",
  "Belonging": "Inclusion",
  "Accountability": "Apology"
};
const progress = readProgress();
const DEV_UNLOCK_ALL_GAMES = true;
const currentUser = localStorage.getItem("kkCurrentUser");
let activeValue = "All";
let searchTerm = "";

renderDashboard();

function renderDashboard() {
  renderFeatured();
  renderFilters();
  renderRecommendation();
  renderGames();
  renderComingSoon();
}

function renderGames() {
  const visibleGames = KIND_KINGDOM_GAMES
    .map((game, index) => ({ game, index }))
    .filter(({ game }) => matchesValue(game) && matchesSearch(game));

  grid.innerHTML = visibleGames.length
    ? visibleGames.map(({ game, index }) => gameCard(game, index)).join("")
    : `<div class="no-results"><b>No games found</b><span>Try a skill like empathy, listening, gratitude, teamwork, or a game word like bridge, dragon, moon, or compliment.</span></div>`;
}

function gameCard(game, index) {
  const meta = gameMeta(game, index);
  const unlocked = DEV_UNLOCK_ALL_GAMES || progress.points >= meta.unlockAt;
  const tag = DEV_UNLOCK_ALL_GAMES
    ? "Dev unlocked"
    : unlocked
      ? "Unlocked"
      : `${meta.unlockAt - progress.points} pts to unlock`;
  const cardBody = `
    <span class="map-pin">${game.icon}</span>
    <span class="game-photo">
      <img
        class="game-image"
        src="${createLocalImageUrl(game)}"
        data-fallback="${createTileImage(game, index)}"
        alt="${game.title} preview"
        loading="lazy"
        onerror="this.onerror=null;this.src=this.dataset.fallback;"
      >
    </span>
    <span class="card-copy">
      <strong>${game.title}</strong>
      <span class="skill-line">Skill: ${dashboardSkill(game)}</span>
      <span class="meta-row">
        <span>${meta.difficulty}</span>
        <span>${meta.time} min</span>
      </span>
      <span class="unlock-row">${tag}</span>
    </span>
    <span class="play-button"><span></span> ${unlocked ? "PLAY" : "LOCKED"}</span>
  `;
  if (!unlocked) {
    return `<article class="dashboard-card locked theme-${game.slug}" data-skill="${dashboardSkill(game)}" style="--map-step:${index % 6}">${cardBody}</article>`;
  }
  return `<a class="dashboard-card theme-${game.slug}" data-skill="${dashboardSkill(game)}" style="--map-step:${index % 6}" href="game.html?game=${game.slug}">${cardBody}</a>`;
}

function renderFilters() {
  const values = ["All", ...new Set(KIND_KINGDOM_GAMES.map(dashboardSkill))];
  filters.innerHTML = `
    <div class="points-pill">Kindness Points: <b>${progress.points}</b></div>
    <div class="search-panel">
      <label class="search-box">
        <span>Search games or values</span>
        <input id="game-search" type="search" value="${escapeAttr(searchTerm)}" placeholder="Try empathy, bridge, dragon, gratitude, teamwork...">
      </label>
      <label class="value-dropdown">
        <span>Value</span>
        <select id="value-filter">
          ${values.map((value) => `<option value="${escapeAttr(value)}" ${value === activeValue ? "selected" : ""}>${value}</option>`).join("")}
        </select>
      </label>
      <div class="search-hint">
        Showing smart matches from titles, lessons, skills, mechanics, missions, and game choices.
      </div>
    </div>
  `;
  filters.querySelector("#game-search").addEventListener("input", (event) => {
    searchTerm = event.target.value;
    renderRecommendation();
    renderGames();
  });
  filters.querySelector("#value-filter").addEventListener("change", (event) => {
    activeValue = event.target.value;
    renderRecommendation();
    renderGames();
  });
}

function renderFeatured() {
  const week = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 1).getTime()) / 604800000);
  const game = KIND_KINGDOM_GAMES[week % KIND_KINGDOM_GAMES.length];
  const meta = gameMeta(game, week);
  featured.innerHTML = `
    <a class="featured-card theme-${game.slug}" href="game.html?game=${game.slug}">
      <span class="featured-label">Featured Game of the Week</span>
      <img src="${createLocalImageUrl(game)}" data-fallback="${createTileImage(game, week)}" alt="${game.title} preview" onerror="this.onerror=null;this.src=this.dataset.fallback;">
      <span>
        <b>${game.icon} ${game.title}</b>
        <small>${dashboardSkill(game)} • ${meta.difficulty} • ${meta.time} min</small>
        <em>${game.lesson}</em>
      </span>
    </a>
  `;
}

function renderRecommendation() {
  const pool = KIND_KINGDOM_GAMES.filter((game, index) => (DEV_UNLOCK_ALL_GAMES || progress.points >= gameMeta(game, index).unlockAt) && matchesValue(game) && matchesSearch(game));
  const preferred = pool.find((game) => dashboardSkill(game) === "Listening") || pool[0] || KIND_KINGDOM_GAMES[0];
  recommendation.innerHTML = `
    <div>
      <b>You should try ${preferred.title} next</b>
      <span>because it builds ${dashboardSkill(preferred).toLowerCase()} through ${preferred.mechanicName.toLowerCase()}.</span>
    </div>
    <a class="mini-play" href="game.html?game=${preferred.slug}">Try It</a>
  `;
}

function renderComingSoon() {
  comingSoon.innerHTML = `
    <h2>Coming Soon</h2>
    <div class="coming-grid">
      ${COMING_SOON_GAMES.map((item) => `
        <article class="coming-card">
          <span class="coming-image"></span>
          <strong>${item.title}</strong>
          <span>Skill: ${item.skill}</span>
          <small>${item.time} • Locked design preview</small>
        </article>
      `).join("")}
    </div>
  `;
}

function dashboardSkill(game) {
  return skillAliases[game.category] || game.category;
}

function matchesValue(game) {
  return activeValue === "All" || dashboardSkill(game) === activeValue || game.category === activeValue;
}

function matchesSearch(game) {
  const query = normalize(searchTerm);
  if (!query) return true;
  const text = searchableText(game);
  return query.split(/\s+/).every((part) => text.includes(part) || fuzzyIncludes(text, part));
}

function searchableText(game) {
  return normalize([
    game.title,
    game.category,
    dashboardSkill(game),
    game.lesson,
    game.mission,
    game.mechanicName,
    game.mechanic,
    game.theme,
    game.scene,
    game.data.join(" ")
  ].join(" "));
}

function fuzzyIncludes(text, part) {
  if (part.length < 4) return false;
  return text.split(/\s+/).some((word) => word.startsWith(part) || part.startsWith(word));
}

function normalize(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function gameMeta(game, index) {
  const difficulty = ["Easy", "Medium", "Hard"][index % 3];
  const time = difficulty === "Easy" ? 5 : difficulty === "Medium" ? 7 : 9;
  const unlockAt = Math.floor(index / 4) * 50;
  return { difficulty, time, unlockAt };
}

function readProgress() {
  const fallback = { points: 100, completed: [] };
  try {
    const scopedKey = currentUser ? `${DASHBOARD_PROGRESS_KEY}:${currentUser}` : DASHBOARD_PROGRESS_KEY;
    return { ...fallback, ...JSON.parse(localStorage.getItem(scopedKey) || localStorage.getItem(DASHBOARD_PROGRESS_KEY) || "{}") };
  } catch {
    return fallback;
  }
}

function createLocalImageUrl(game) {
  return `assets/images/games/${game.slug}.jpg`;
}

function createLoadingTile(game) {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 300" role="img" aria-label="${escapeXml(game.title)} image loading">
      <rect width="360" height="300" fill="#efe6c9"/>
      <rect x="22" y="22" width="316" height="256" rx="16" fill="#fff7df" stroke="#c8b98e" stroke-width="4"/>
      <text x="180" y="136" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#11144d">Image loading</text>
      <text x="180" y="172" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#11144d">${escapeXml(shortTitle(game.title))}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function realisticImageQuery(game) {
  const queries = {
    "compliment-castle": "children compliment castle friendship",
    "share-the-crown": "children crown castle",
    "brave-apology-bridge": "children bridge friendship",
    "listening-lanterns": "children lanterns dusk",
    "feelings-garden": "colorful flower garden children",
    "patience-potion": "magic potion glowing",
    "helping-hands-bakery": "children bakery bread",
    "truth-teller-tower": "castle tower bell",
    "gratitude-gems": "glowing gems treasure children",
    "respectful-roundtable": "children round table discussion",
    "inclusion-inn": "cozy inn children friends",
    "courage-cave": "child cave glowing light",
    "calm-dragon-den": "fantasy dragon cave",
    "teamwork-tournament": "children soccer teamwork",
    "fairness-fountain": "fountain children courtyard",
    "promise-path": "sunny path child basket",
    "healthy-habits-harbor": "harbor healthy food water",
    "safety-shield": "children crosswalk safety",
    "curiosity-clock": "clock tower children books",
    "perseverance-peak": "children mountain hiking",
    "empathy-echoes": "children valley moonlight",
    "manners-market": "market children polite",
    "problem-solving-portal": "glowing portal fantasy",
    "nature-nook": "children forest nature animals",
    "digital-kindness-gate": "children tablet kindness",
    "restful-moon-meadow": "moon meadow peaceful"
  };
  return queries[game.slug] || game.title;
}

function createTileImage(game, index) {
  const theme = getTileTheme(game.slug, index);
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 360 300" role="img" aria-label="${escapeXml(game.title)}">
      <defs>
        <linearGradient id="sky" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stop-color="${theme.skyTop}"/>
          <stop offset="55%" stop-color="${theme.skyMid}"/>
          <stop offset="100%" stop-color="${theme.ground}"/>
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="35%" r="55%">
          <stop offset="0%" stop-color="${theme.glow}" stop-opacity=".9"/>
          <stop offset="100%" stop-color="${theme.glow}" stop-opacity="0"/>
        </radialGradient>
      </defs>
      <rect width="360" height="300" fill="url(#sky)"/>
      <circle cx="${theme.sunX}" cy="58" r="38" fill="${theme.sun}" opacity=".9"/>
      <ellipse cx="180" cy="116" rx="150" ry="90" fill="url(#glow)"/>
      ${theme.scene}
      <g transform="translate(42 156)">
        <ellipse cx="45" cy="94" rx="42" ry="12" fill="#000" opacity=".15"/>
        <circle cx="45" cy="26" r="25" fill="#ffc17b"/>
        <path d="M18 26c5-24 48-33 58 2-16-10-35-10-58-2z" fill="#8a431f"/>
        <path d="M20 58c16-22 54-23 70 0l-9 68H29z" fill="${theme.hero}"/>
        <path d="M26 73l-22 24M82 73l26 20" stroke="#ffc17b" stroke-width="12" stroke-linecap="round"/>
        <path d="M36 122l-9 31M65 122l14 31" stroke="#8b572d" stroke-width="13" stroke-linecap="round"/>
        <text x="45" y="73" text-anchor="middle" font-size="34" font-family="Arial, sans-serif" font-weight="900" fill="#fff">${escapeXml(game.icon)}</text>
      </g>
      <g transform="translate(232 170) scale(.75)">
        <ellipse cx="45" cy="94" rx="38" ry="10" fill="#000" opacity=".13"/>
        <circle cx="45" cy="26" r="24" fill="#ffc17b"/>
        <path d="M20 21c12-27 55-18 55 10-14-8-33-12-55-10z" fill="#5b2f1c"/>
        <path d="M23 58c15-20 51-21 65 0l-9 66H31z" fill="${theme.friend}"/>
        <path d="M28 72L5 92M80 72l24 18" stroke="#ffc17b" stroke-width="11" stroke-linecap="round"/>
      </g>
      <text x="180" y="278" text-anchor="middle" font-family="Nunito, Arial, sans-serif" font-size="24" font-weight="900" fill="${theme.text}">${escapeXml(shortTitle(game.title))}</text>
    </svg>
  `;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

function getTileTheme(slug, index) {
  const scenes = {
    "compliment-castle": castleScene("#caa0d8", "#6b3c80", false),
    "share-the-crown": crownScene(),
    "brave-apology-bridge": bridgeScene(),
    "listening-lanterns": lanternScene(),
    "feelings-garden": gardenScene(),
    "patience-potion": potionScene(),
    "helping-hands-bakery": bakeryScene(),
    "truth-teller-tower": towerScene(),
    "gratitude-gems": gemScene(),
    "respectful-roundtable": tableScene(),
    "inclusion-inn": innScene(),
    "courage-cave": caveScene(),
    "calm-dragon-den": dragonScene(),
    "teamwork-tournament": fieldScene(),
    "fairness-fountain": fountainScene(),
    "promise-path": pathScene(),
    "healthy-habits-harbor": harborScene(),
    "safety-shield": shieldScene(),
    "curiosity-clock": clockScene(),
    "perseverance-peak": mountainScene(),
    "empathy-echoes": echoScene(),
    "manners-market": marketScene(),
    "problem-solving-portal": portalScene(),
    "nature-nook": forestScene(),
    "digital-kindness-gate": digitalScene(),
    "restful-moon-meadow": moonScene()
  };
  const palettes = [
    ["#bfe8ff", "#e7d6b1", "#7fc46b", "#fff0a3", "#fff7c2", "#2d8b61", "#7b58c8"],
    ["#ffd3ec", "#c9a5ec", "#92cf77", "#ffe16e", "#fff2ba", "#9c4fc4", "#2f8d61"],
    ["#19336f", "#405f98", "#193929", "#fff7a8", "#bdf7ff", "#5742a6", "#d66f5d"],
    ["#ffe5b8", "#d79a68", "#8d603e", "#fff0ad", "#fff1cf", "#2d8b61", "#7b58c8"]
  ];
  const palette = palettes[index % palettes.length];
  return {
    skyTop: palette[0],
    skyMid: palette[1],
    ground: palette[2],
    sun: palette[3],
    glow: palette[4],
    hero: palette[5],
    friend: palette[6],
    text: "#11144d",
    sunX: index % 2 ? 288 : 72,
    scene: scenes[slug] || castleScene("#b49274", "#7b6149", false)
  };
}

function castleScene(wall, trim, messy) {
  return `
    <g transform="translate(128 92)">
      <rect x="26" y="42" width="98" height="96" rx="8" fill="${wall}" stroke="${trim}" stroke-width="8"/>
      <rect x="-16" y="70" width="54" height="68" rx="6" fill="${wall}" stroke="${trim}" stroke-width="8"/>
      <rect x="112" y="62" width="58" height="76" rx="6" fill="${wall}" stroke="${trim}" stroke-width="8"/>
      <path d="M45 42l30-40 30 40zM-4 70l16-30 17 30zM128 62l17-32 17 32z" fill="${trim}"/>
      <rect x="65" y="92" width="24" height="46" rx="12" fill="#4b3728"/>
    </g>
    ${messy ? '<g fill="#6d6d6d"><circle cx="150" cy="236" r="7"/><rect x="215" y="229" width="18" height="10" rx="2"/><circle cx="252" cy="238" r="5"/></g>' : ""}
  `;
}

function crownScene() {
  return '<path d="M132 144l28-45 29 36 32-52 36 61z" fill="#ffd85e" stroke="#8d5a16" stroke-width="8"/><circle cx="160" cy="98" r="9" fill="#fff"/><circle cx="222" cy="82" r="9" fill="#fff"/>';
}

function bridgeScene() {
  return '<path d="M88 204c46-62 136-62 184 0" fill="none" stroke="#7a5030" stroke-width="26" stroke-linecap="round"/><path d="M94 204h172" stroke="#d6a06b" stroke-width="16" stroke-linecap="round"/><rect x="0" y="222" width="360" height="78" fill="#63a8c6"/>';
}

function lanternScene() {
  return '<g fill="#ffe879" stroke="#7b4e21" stroke-width="5"><path d="M110 86h46v58h-46z"/><path d="M230 112h42v54h-42z"/><path d="M176 64h52v70h-52z"/></g>';
}

function gardenScene() {
  return '<g><circle cx="108" cy="198" r="22" fill="#ff80a8"/><circle cx="178" cy="180" r="28" fill="#ffd45e"/><circle cx="256" cy="202" r="24" fill="#9bf08a"/><path d="M108 220v34M178 208v46M256 226v28" stroke="#287840" stroke-width="8"/></g>';
}

function potionScene() {
  return '<g transform="translate(145 112)"><path d="M30 0h40v48c30 18 44 48 28 75-18 31-82 31-100 0-16-27-2-57 28-75z" fill="#7ef1ff" opacity=".85" stroke="#3d2d68" stroke-width="8"/><circle cx="48" cy="88" r="20" fill="#fff" opacity=".45"/></g>';
}

function bakeryScene() {
  return '<g fill="#e8a74f" stroke="#8c552c" stroke-width="6"><ellipse cx="132" cy="202" rx="50" ry="30"/><ellipse cx="220" cy="202" rx="56" ry="34"/><circle cx="184" cy="158" r="28"/></g>';
}

function towerScene() {
  return '<g transform="translate(150 54)"><rect x="0" y="52" width="76" height="154" fill="#c9a06e" stroke="#6d4d32" stroke-width="8"/><path d="M-8 52l46-48 46 48z" fill="#6d4d32"/><rect x="28" y="142" width="22" height="64" rx="11" fill="#3f2d22"/></g>';
}

function gemScene() {
  return '<g stroke="#fff" stroke-width="4"><path d="M176 82l38 34-38 78-38-78z" fill="#7ef1ff"/><path d="M250 138l28 24-28 56-28-56z" fill="#ff8beb"/><path d="M104 142l30 26-30 58-30-58z" fill="#ffe15f"/></g>';
}

function tableScene() {
  return '<ellipse cx="188" cy="202" rx="96" ry="44" fill="#8b5a33" stroke="#4a2f1b" stroke-width="8"/><circle cx="118" cy="154" r="20" fill="#ffc17b"/><circle cx="250" cy="154" r="20" fill="#ffc17b"/>';
}

function innScene() {
  return '<path d="M82 172h196v82H82z" fill="#b96f52" stroke="#633a29" stroke-width="8"/><path d="M65 172l116-78 118 78z" fill="#7a3f2e"/><rect x="164" y="198" width="36" height="56" rx="16" fill="#3f2a22"/>';
}

function caveScene() {
  return '<path d="M0 300V98c52-36 104-42 152 18 48-66 120-52 208-6v190z" fill="#2c243c"/><ellipse cx="180" cy="214" rx="60" ry="80" fill="#5c4a6d"/>';
}

function dragonScene() {
  return '<path d="M100 210c22-80 134-88 168-16 18 38-26 58-82 56-62-2-98-10-86-40z" fill="#e47b5d"/><circle cx="142" cy="156" r="14" fill="#fff"/><circle cx="218" cy="156" r="14" fill="#fff"/>';
}

function fieldScene() {
  return '<rect x="0" y="190" width="360" height="110" fill="#4da357"/><circle cx="180" cy="216" r="20" fill="#fff" stroke="#111" stroke-width="5"/><path d="M60 190h240" stroke="#fff" stroke-width="6" opacity=".7"/>';
}

function fountainScene() {
  return '<g fill="#8ed7f2" stroke="#4d89a3" stroke-width="7"><path d="M180 80c-34 40-40 76 0 112 40-36 34-72 0-112z"/><ellipse cx="180" cy="208" rx="82" ry="30"/><rect x="142" y="206" width="76" height="48" rx="12"/></g>';
}

function pathScene() {
  return '<path d="M170 300c20-88 44-140 18-220" fill="none" stroke="#d5a461" stroke-width="46" stroke-linecap="round"/><g fill="#fff"><rect x="110" y="100" width="46" height="34" rx="5"/><rect x="196" y="156" width="46" height="34" rx="5"/></g>';
}

function harborScene() {
  return '<rect x="0" y="188" width="360" height="112" fill="#4fa5d3"/><path d="M116 184h116l-28 46h-60z" fill="#8b5a33"/><path d="M174 88v96M174 94l70 48h-70z" stroke="#fff" stroke-width="8" fill="#fff"/>';
}

function shieldScene() {
  return '<path d="M180 82l76 28v58c0 54-32 86-76 108-44-22-76-54-76-108v-58z" fill="#8ed7ff" stroke="#254a8a" stroke-width="8"/><path d="M147 174l24 24 46-58" stroke="#fff" stroke-width="14" fill="none" stroke-linecap="round"/>';
}

function clockScene() {
  return '<circle cx="184" cy="162" r="76" fill="#fff6c0" stroke="#755433" stroke-width="10"/><path d="M184 162V110M184 162l48 26" stroke="#11144d" stroke-width="9" stroke-linecap="round"/>';
}

function mountainScene() {
  return '<path d="M72 270l98-176 54 76 38-56 78 156z" fill="#7f8f72"/><path d="M170 94l24 34-44 0z" fill="#fff"/>';
}

function echoScene() {
  return '<g fill="none" stroke="#d7c0ff" stroke-width="10" opacity=".85"><path d="M132 150c24-34 72-34 96 0"/><path d="M104 180c42-58 110-58 152 0"/><path d="M82 212c58-78 138-78 196 0"/></g>';
}

function marketScene() {
  return '<g><rect x="76" y="154" width="208" height="86" fill="#c4774c" stroke="#6c3f2c" stroke-width="8"/><path d="M70 154h220l-24-54H94z" fill="#ffcf77"/><path d="M94 100v54M136 100v54M178 100v54M220 100v54M262 100v54" stroke="#b54d5e" stroke-width="8"/></g>';
}

function portalScene() {
  return '<ellipse cx="180" cy="164" rx="72" ry="92" fill="#7ef1ff" opacity=".8" stroke="#5c45c7" stroke-width="12"/><ellipse cx="180" cy="164" rx="38" ry="56" fill="#312075"/>';
}

function forestScene() {
  return '<g><rect x="44" y="60" width="24" height="210" fill="#5b3a25"/><rect x="286" y="58" width="25" height="212" fill="#5b3a25"/><circle cx="55" cy="74" r="54" fill="#4d9d5a"/><circle cx="300" cy="82" r="62" fill="#4d9d5a"/></g>';
}

function digitalScene() {
  return '<g fill="none" stroke="#8ef1ff" stroke-width="7"><rect x="92" y="88" width="176" height="128" rx="18"/><path d="M120 126h120M120 160h92M120 194h132"/></g>';
}

function moonScene() {
  return '<path d="M236 52c-34 20-34 70 2 88-54 12-92-46-60-88 16-22 38-26 58 0z" fill="#fff5bd"/><g fill="#fff8d1"><circle cx="80" cy="86" r="5"/><circle cx="124" cy="52" r="4"/><circle cx="292" cy="102" r="5"/></g>';
}

function shortTitle(title) {
  return title.length > 22 ? `${title.slice(0, 20)}...` : title;
}

function escapeXml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&apos;"
  })[char]);
}

function escapeAttr(value) {
  return escapeXml(value);
}
