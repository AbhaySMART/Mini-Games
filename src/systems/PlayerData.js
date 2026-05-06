import { userScopedKey } from "./AuthSystem.js?v=61";

export const PLAYER_KEY = "kindKingdomPlayer";
export const PROGRESS_KEY = "kindKingdomProgress";

const DEFAULT_PLAYER = {
  character: null,
  x: 520,
  y: 420,
  skillXP: {},
  cosmetics: []
};

const DEFAULT_PROGRESS = {
  points: 100,
  completed: []
};

export const PlayerData = {
  loadPlayer() {
    return { ...DEFAULT_PLAYER, ...readJson(userScopedKey(PLAYER_KEY), readJson(PLAYER_KEY, DEFAULT_PLAYER)) };
  },

  savePlayer(data) {
    const next = { ...this.loadPlayer(), ...data };
    localStorage.setItem(userScopedKey(PLAYER_KEY), JSON.stringify(next));
    localStorage.setItem(PLAYER_KEY, JSON.stringify(next));
  },

  getCharacter() {
    return this.loadPlayer().character || localStorage.getItem("kkCharacter") || null;
  },

  setCharacter(character) {
    localStorage.setItem("kkCharacter", character);
    this.savePlayer({ character });
  },

  savePosition(x, y) {
    this.savePlayer({ x: Math.round(x), y: Math.round(y) });
  },

  loadProgress() {
    const progress = { ...DEFAULT_PROGRESS, ...readJson(userScopedKey(PROGRESS_KEY), readJson(PROGRESS_KEY, DEFAULT_PROGRESS)) };
    progress.completed = Array.isArray(progress.completed) ? progress.completed : [];
    progress.points = Number(progress.points) || DEFAULT_PROGRESS.points;
    return progress;
  },

  saveProgress(progress) {
    localStorage.setItem(userScopedKey(PROGRESS_KEY), JSON.stringify(progress));
    localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress));
    localStorage.setItem("kkPoints", String(progress.points));
  },

  addPoints(amount) {
    const progress = this.loadProgress();
    progress.points += amount;
    this.saveProgress(progress);
    return progress.points;
  },

  addSkillXP(skill, amount) {
    const player = this.loadPlayer();
    const skillXP = { ...(player.skillXP || {}) };
    skillXP[skill] = Number(skillXP[skill] || 0) + amount;
    localStorage.setItem(`${skill.toLowerCase().replace(/[^a-z0-9]+/g, "-")}XP`, String(skillXP[skill]));
    this.savePlayer({ skillXP });
    return skillXP[skill];
  }
};

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}
