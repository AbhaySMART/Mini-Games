import { userScopedKey } from "./AuthSystem.js?v=75";
import { PlayerData } from "./PlayerData.js?v=75";
import { EmotionSystem } from "./EmotionSystem.js?v=75";

export const NPC_MEMORY_KEY = "kindKingdomNPCMemory";

const DEFAULT_MEMORY = {};

const CATEGORY_NPCS = [
  { npc: "Crystal Guide", skills: ["Gratitude", "Giving", "Empathy", "Compassion"] },
  { npc: "Gate Keeper", skills: ["Calm Choices", "Courage", "Conflict Repair", "Patience"] },
  { npc: "Roundtable Page", skills: ["Respect", "Cooperation", "Collaboration", "Communication"] },
  { npc: "Lantern Keeper", skills: ["Communication", "Listening", "Digital Citizenship", "Kind Words"] },
  { npc: "Garden Sage", skills: ["Empathy", "Compassion", "Forgiveness", "Wellness"] },
  { npc: "Harbor Helper", skills: ["Service", "Responsibility", "Problem Solving", "Perseverance"] }
];

export const NPCMemorySystem = {
  load() {
    return readJson(userScopedKey(NPC_MEMORY_KEY), readJson(NPC_MEMORY_KEY, DEFAULT_MEMORY));
  },

  save(memory) {
    localStorage.setItem(userScopedKey(NPC_MEMORY_KEY), JSON.stringify(memory));
    localStorage.setItem(NPC_MEMORY_KEY, JSON.stringify(memory));
    return memory;
  },

  npcForSkill(skill = "") {
    return CATEGORY_NPCS.find((entry) => entry.skills.includes(skill))?.npc || "Crystal Guide";
  },

  recordVisit(npcName) {
    return this.update(npcName, (entry) => ({
      ...entry,
      visits: entry.visits + 1,
      lastSeen: Date.now()
    }));
  },

  recordGameCompletion(game = {}) {
    const npcName = this.npcForSkill(game.category);
    return this.update(npcName, (entry) => {
      const skills = { ...entry.skills };
      const skill = game.category || "Kindness";
      skills[skill] = Number(skills[skill] || 0) + 1;
      return {
        ...entry,
        helped: entry.helped + 1,
        skills,
        lastGame: game.title || "a kindness quest",
        lastSkill: skill,
        lastPositive: Date.now(),
        lines: remember(entry.lines, `You helped with ${game.title || "a kindness quest"}.`)
      };
    });
  },

  recordStoryChoice({ npcName, skill, title, correct }) {
    return this.update(npcName || this.npcForSkill(skill), (entry) => {
      const skills = { ...entry.skills };
      const key = skill || "Story Practice";
      skills[key] = Number(skills[key] || 0) + (correct ? 1 : 0);
      return {
        ...entry,
        storyChoices: entry.storyChoices + 1,
        skills,
        lastSkill: key,
        lastStory: title || "Story Forge",
        lastPositive: correct ? Date.now() : entry.lastPositive,
        lastStrain: correct ? entry.lastStrain : Date.now(),
        lines: remember(entry.lines, correct
          ? `You chose a thoughtful path in ${title || "Story Forge"}.`
          : `You practiced a harder choice in ${title || "Story Forge"}.`)
      };
    });
  },

  memoryFor(npcName, progress = PlayerData.loadProgress(), mood = EmotionSystem.getKingdomMood(progress)) {
    const entry = normalizeEntry(this.load()[npcName]);
    const bestSkill = topSkill(entry.skills);
    const completed = progress.completed?.length || 0;
    const opener = entry.visits > 0
      ? `Welcome back. I remember you.`
      : `Hello, kind traveler. I will remember what you practice.`;
    if (entry.helped > 0 && bestSkill) {
      return `${opener} Last time, you helped with ${bestSkill}.`;
    }
    if (entry.storyChoices > 0 && bestSkill) {
      return `${opener} I noticed your ${bestSkill} practice in Story Forge.`;
    }
    if (mood.peace > 0.7) return `${opener} The kingdom feels calmer around you today.`;
    if (mood.shadow > 0.22) return `${opener} The paths feel heavy, but we can brighten them with your next choice.`;
    if (completed > 0) return `${opener} You have completed ${completed} kindness quest${completed === 1 ? "" : "s"}.`;
    return opener;
  },

  statusFor(npcName) {
    const entry = normalizeEntry(this.load()[npcName]);
    const bestSkill = topSkill(entry.skills);
    if (entry.helped > 2) return "Trusts your kindness.";
    if (bestSkill) return `Remembers ${bestSkill}.`;
    if (entry.visits > 0) return "Recognizes you.";
    return "Has a quest.";
  },

  update(npcName, updater) {
    const name = npcName || "Crystal Guide";
    const memory = this.load();
    memory[name] = normalizeEntry(updater(normalizeEntry(memory[name])));
    return this.save(memory)[name];
  }
};

function normalizeEntry(entry = {}) {
  return {
    visits: Number(entry.visits || 0),
    helped: Number(entry.helped || 0),
    storyChoices: Number(entry.storyChoices || 0),
    skills: entry.skills && typeof entry.skills === "object" ? entry.skills : {},
    lastGame: entry.lastGame || "",
    lastStory: entry.lastStory || "",
    lastSkill: entry.lastSkill || "",
    lastSeen: Number(entry.lastSeen || 0),
    lastPositive: Number(entry.lastPositive || 0),
    lastStrain: Number(entry.lastStrain || 0),
    lines: Array.isArray(entry.lines) ? entry.lines.slice(0, 6) : []
  };
}

function topSkill(skills) {
  return Object.entries(skills || {})
    .sort((a, b) => Number(b[1]) - Number(a[1]))[0]?.[0] || "";
}

function remember(lines = [], line) {
  return [line, ...lines].slice(0, 6);
}

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}
