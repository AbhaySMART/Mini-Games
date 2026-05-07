import { PlayerData } from "./PlayerData.js?v=75";
import { userScopedKey } from "./AuthSystem.js?v=75";

export const EMOTION_KEY = "kindKingdomEmotion";

const DEFAULT_EMOTION = {
  helpful: 4,
  calm: 3,
  strain: 0,
  events: []
};

const CALM_SKILLS = ["Calm Choices", "Patience", "Rest", "Wellness", "Self-Control"];
const REPAIR_SKILLS = ["Conflict Repair", "Accountability", "Honesty", "Forgiveness"];

export const EmotionSystem = {
  load() {
    const stored = readJson(userScopedKey(EMOTION_KEY), readJson(EMOTION_KEY, DEFAULT_EMOTION));
    return normalize(stored);
  },

  save(state) {
    const next = normalize(state);
    localStorage.setItem(userScopedKey(EMOTION_KEY), JSON.stringify(next));
    localStorage.setItem(EMOTION_KEY, JSON.stringify(next));
    return next;
  },

  record(type, detail = {}) {
    const state = this.load();
    if (type === "helpful") state.helpful += detail.amount || 1;
    if (type === "calm") state.calm += detail.amount || 1;
    if (type === "strain") state.strain += detail.amount || 1;
    if (type === "repair") {
      state.helpful += detail.amount || 1;
      state.strain = Math.max(0, state.strain - 1);
    }
    state.events = [
      {
        type,
        skill: detail.skill || "",
        label: detail.label || "",
        at: Date.now()
      },
      ...state.events
    ].slice(0, 18);
    return this.save(decay(state));
  },

  recordGameCompletion(game) {
    const skill = game?.category || "";
    this.record("helpful", { amount: 2, skill, label: game?.title || "Completed game" });
    if (CALM_SKILLS.includes(skill)) this.record("calm", { amount: 2, skill, label: "Calm practice" });
    if (REPAIR_SKILLS.includes(skill)) this.record("repair", { amount: 1, skill, label: "Repair practice" });
  },

  recordChoice(correct, detail = {}) {
    return this.record(correct ? "helpful" : "strain", {
      amount: correct ? 1 : 2,
      skill: detail.skill || "",
      label: detail.label || ""
    });
  },

  getKingdomMood(progress = PlayerData.loadProgress()) {
    const state = this.load();
    const completed = progress.completed?.length || 0;
    const helpful = state.helpful + completed * 0.85;
    const calm = state.calm;
    const strain = state.strain;
    const warmth = clamp(0.42 + helpful * 0.035 + calm * 0.02 - strain * 0.035, 0.22, 0.94);
    const peace = clamp(0.34 + calm * 0.07 - strain * 0.04, 0.12, 0.95);
    const shadow = clamp(0.06 + strain * 0.055 - helpful * 0.018 - calm * 0.012, 0, 0.46);
    const speedMultiplier = clamp(1.04 - shadow * 0.55 + peace * 0.08, 0.72, 1.12);
    const sky = shadow > 0.26 ? "Stormy" : peace > 0.72 ? "Peaceful" : warmth > 0.72 ? "Radiant" : "Growing";
    return {
      ...state,
      warmth,
      peace,
      shadow,
      speedMultiplier,
      cloudDuration: shadow > 0.25 ? 1.55 : peace > 0.7 ? 1.28 : 1,
      sky
    };
  }
};

function normalize(state) {
  return {
    helpful: clampNumber(state.helpful, 0, 24, DEFAULT_EMOTION.helpful),
    calm: clampNumber(state.calm, 0, 18, DEFAULT_EMOTION.calm),
    strain: clampNumber(state.strain, 0, 16, DEFAULT_EMOTION.strain),
    events: Array.isArray(state.events) ? state.events.slice(0, 18) : []
  };
}

function decay(state) {
  return {
    ...state,
    helpful: Math.max(0, state.helpful - 0.08),
    calm: Math.max(0, state.calm - 0.05),
    strain: Math.max(0, state.strain - 0.04)
  };
}

function clampNumber(value, min, max, fallback) {
  const number = Number(value);
  return Number.isFinite(number) ? clamp(number, min, max) : fallback;
}

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}
