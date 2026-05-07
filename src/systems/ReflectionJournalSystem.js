import { userScopedKey } from "./AuthSystem.js?v=70";

export const REFLECTION_JOURNAL_KEY = "kindKingdomReflectionJournal";

const DEFAULT_JOURNAL = {
  entries: []
};

export const ReflectionJournalSystem = {
  load() {
    const journal = readJson(userScopedKey(REFLECTION_JOURNAL_KEY), readJson(REFLECTION_JOURNAL_KEY, DEFAULT_JOURNAL));
    return normalize(journal);
  },

  save(journal) {
    const next = normalize(journal);
    localStorage.setItem(userScopedKey(REFLECTION_JOURNAL_KEY), JSON.stringify(next));
    localStorage.setItem(REFLECTION_JOURNAL_KEY, JSON.stringify(next));
    return next;
  },

  entries() {
    return this.load().entries;
  },

  add(entry) {
    const journal = this.load();
    const nextEntry = {
      id: `reflection-${Date.now()}`,
      gameSlug: entry.gameSlug || "",
      gameTitle: entry.gameTitle || "Kindness Quest",
      category: entry.category || "Kindness",
      feeling: clean(entry.feeling),
      experience: clean(entry.experience),
      nextStep: clean(entry.nextStep),
      createdAt: new Date().toISOString()
    };
    return this.save({ entries: [nextEntry, ...journal.entries].slice(0, 80) });
  }
};

function normalize(journal) {
  return {
    entries: Array.isArray(journal.entries) ? journal.entries.slice(0, 80) : []
  };
}

function clean(value) {
  return String(value || "").trim().slice(0, 800);
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}
