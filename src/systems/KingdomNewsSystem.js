import { userScopedKey } from "./AuthSystem.js?v=61";
import { PlayerData } from "./PlayerData.js?v=61";
import { EmotionSystem } from "./EmotionSystem.js?v=61";
import { CURRENT_EVENT } from "./RewardSystem.js?v=61";

export const KINGDOM_NEWS_KEY = "kindKingdomNews";

const DEFAULT_NEWS = {
  posts: [],
  readIds: []
};

const CATEGORY_HEADLINES = {
  Accountability: "Brave Apology Bridge repaired",
  "Calm Choices": "Calm winds return to the kingdom gates",
  Communication: "Lantern paths glow with better listening",
  Gratitude: "The Gratitude Tree is blooming again",
  Courage: "Courage Cave restored",
  Respect: "Roundtable bells ring in harmony",
  Cooperation: "Tournament banners rise for teamwork",
  Service: "Helping hands warm the bakery quarter",
  Honesty: "Truth light shines from the tower"
};

export const KingdomNewsSystem = {
  load() {
    const stored = readJson(userScopedKey(KINGDOM_NEWS_KEY), readJson(KINGDOM_NEWS_KEY, DEFAULT_NEWS));
    return normalize(stored);
  },

  save(news) {
    const next = normalize(news);
    localStorage.setItem(userScopedKey(KINGDOM_NEWS_KEY), JSON.stringify(next));
    localStorage.setItem(KINGDOM_NEWS_KEY, JSON.stringify(next));
    return next;
  },

  refresh(games = window.KIND_KINGDOM_GAMES || []) {
    const progress = PlayerData.loadProgress();
    const mood = EmotionSystem.getKingdomMood(progress);
    const current = this.load();
    const generated = buildPosts(progress, mood, games);
    const byId = new Map([...generated, ...current.posts].map((post) => [post.id, post]));
    const posts = Array.from(byId.values())
      .sort((a, b) => Number(b.priority || 0) - Number(a.priority || 0) || String(b.date).localeCompare(String(a.date)))
      .slice(0, 18);
    return this.save({ ...current, posts });
  },

  latest(count = 5, games = window.KIND_KINGDOM_GAMES || []) {
    return this.refresh(games).posts.slice(0, count);
  },

  unreadCount(games = window.KIND_KINGDOM_GAMES || []) {
    const news = this.refresh(games);
    return news.posts.filter((post) => !news.readIds.includes(post.id)).length;
  },

  markAllRead() {
    const news = this.load();
    return this.save({ ...news, readIds: news.posts.map((post) => post.id) });
  }
};

function buildPosts(progress, mood, games) {
  const posts = [];
  const completed = Array.isArray(progress.completed) ? progress.completed : [];
  const completedGames = completed
    .map((slug) => games.find((game) => game.slug === slug))
    .filter(Boolean);
  const newestGame = completedGames[completedGames.length - 1];

  if (newestGame) {
    posts.push(gameRestoredPost(newestGame, completedGames.length));
  }

  if (completedGames.length >= 3) {
    posts.push({
      id: `milestone-${Math.floor(completedGames.length / 3) * 3}`,
      title: `${completedGames.length} kindness quests completed`,
      kicker: "Progress Path",
      summary: "Citizens across Kind Kingdom are noticing steady acts of care, courage, and repair.",
      body: `The royal record keepers counted ${completedGames.length} completed quests. New lanterns have been lit along the roads so travelers can see how daily practice changes the kingdom.`,
      image: imageFor(newestGame) || "assets/images/games/compliment-castle.jpg",
      date: todayStamp(),
      priority: 70 + completedGames.length
    });
  }

  posts.push({
    id: `mood-${mood.sky.toLowerCase()}`,
    title: `${mood.sky} skies over Kind Kingdom`,
    kicker: "World Mood",
    summary: moodSummary(mood),
    body: `The weather scribes say the world is reacting to recent choices. Helpful choices brighten the clouds, calm choices slow the wind, and rushed choices can make the roads feel heavier until the next repair.`,
    image: moodImage(mood.sky, games),
    date: todayStamp(),
    priority: 55
  });

  posts.push({
    id: `event-${CURRENT_EVENT.id}`,
    title: `${CURRENT_EVENT.name} begins tonight`,
    kicker: "Festival Notice",
    summary: CURRENT_EVENT.description,
    body: `Lantern keepers are preparing special lights for players who practice ${CURRENT_EVENT.bonusCategories.join(", ")}. Citizens say the festival makes small helpful choices easier to notice.`,
    image: "assets/images/games/listening-lanterns.jpg",
    date: todayStamp(),
    priority: 50
  });

  return posts;
}

function gameRestoredPost(game, count) {
  const headline = CATEGORY_HEADLINES[game.category] || `${game.title} restored`;
  return {
    id: `game-${game.slug}`,
    title: `${headline}!`,
    kicker: game.category,
    summary: `A new glow appeared around ${game.title} after your latest quest.`,
    body: `Witnesses report that ${game.title} changed after a player practiced ${game.category.toLowerCase()}. The lesson is spreading through Kind Kingdom: ${game.lesson}`,
    image: imageFor(game),
    date: todayStamp(),
    priority: 100 + count
  };
}

function imageFor(game) {
  return game?.slug ? `assets/images/games/${game.slug}.jpg` : "";
}

function moodImage(sky, games) {
  if (sky === "Peaceful") return "assets/images/games/restful-moon-meadow.jpg";
  if (sky === "Radiant") return "assets/images/games/gratitude-gems.jpg";
  if (sky === "Stormy") return "assets/images/games/calm-dragon-den.jpg";
  return imageFor(games.find((game) => game.slug === "compliment-castle")) || "assets/images/games/compliment-castle.jpg";
}

function moodSummary(mood) {
  if (mood.sky === "Peaceful") return "The kingdom feels slower, softer, and steadier after calm practice.";
  if (mood.sky === "Radiant") return "Helpful choices are brightening roads, rooftops, and garden paths.";
  if (mood.sky === "Stormy") return "The sky is asking for repair, patience, and the next kind choice.";
  return "The kingdom is growing, and each choice is shaping what happens next.";
}

function normalize(news) {
  return {
    posts: Array.isArray(news.posts) ? news.posts.slice(0, 18) : [],
    readIds: Array.isArray(news.readIds) ? news.readIds.slice(0, 50) : []
  };
}

function todayStamp() {
  return new Date().toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}
