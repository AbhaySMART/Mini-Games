import { PlayerData } from "./PlayerData.js?v=79";
import { userScopedKey } from "./AuthSystem.js?v=79";

const QUEST_KEY = "kindKingdomQuests";

const QUESTS = [
  {
    id: "restore-crystal",
    npc: "Crystal Guide",
    prompt: "Visit Gratitude Gems or Generous Grove to brighten the kindness crystal.",
    targetCategories: ["Gratitude", "Giving"],
    reward: 10
  },
  {
    id: "calm-the-gates",
    npc: "Gate Keeper",
    prompt: "Practice calm, courage, or conflict repair to open peaceful paths.",
    targetCategories: ["Calm Choices", "Courage", "Conflict Repair"],
    reward: 10
  },
  {
    id: "council-harmony",
    npc: "Roundtable Page",
    prompt: "Complete a respect or teamwork quest to help the council listen.",
    targetCategories: ["Respect", "Cooperation", "Collaboration"],
    reward: 10
  }
];

export const QuestSystem = {
  all() {
    return QUESTS;
  },

  getActiveQuest(progress = PlayerData.loadProgress()) {
    const completed = readCompleted();
    return QUESTS.find((quest) => !completed.includes(quest.id)) || QUESTS[0];
  },

  getQuestForGame(game) {
    return QUESTS.find((quest) => quest.targetCategories.includes(game.category));
  },

  maybeCompleteForGame(game) {
    const quest = this.getQuestForGame(game);
    if (!quest) return null;
    const completed = readCompleted();
    if (completed.includes(quest.id)) return null;
    completed.push(quest.id);
    localStorage.setItem(userScopedKey(QUEST_KEY), JSON.stringify(completed));
    localStorage.setItem(QUEST_KEY, JSON.stringify(completed));
    const points = PlayerData.addPoints(quest.reward);
    return { quest, points };
  }
};

function readCompleted() {
  try {
    const data = JSON.parse(localStorage.getItem(userScopedKey(QUEST_KEY)) || localStorage.getItem(QUEST_KEY) || "[]");
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
