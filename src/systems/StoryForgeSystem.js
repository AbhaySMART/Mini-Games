import { PlayerData } from "./PlayerData.js?v=79";
import { userScopedKey } from "./AuthSystem.js?v=79";

const STORY_HISTORY_KEY = "kindKingdomStoryForge";
const LEGACY_STORY_HISTORY_KEY = "kindKingdomAIStories";

const SKILLS = [
  {
    id: "empathy",
    label: "Empathy",
    verbs: ["notice the feeling", "ask what would help", "listen before fixing"],
    challenge: "Choose a response that names the feeling and offers support."
  },
  {
    id: "honesty",
    label: "Honesty",
    verbs: ["tell what happened", "own the mistake", "make a repair plan"],
    challenge: "Choose the truth path even if it feels awkward at first."
  },
  {
    id: "patience",
    label: "Patience",
    verbs: ["pause before acting", "wait without rushing", "try again slowly"],
    challenge: "Choose the calm step before the quick reaction."
  },
  {
    id: "teamwork",
    label: "Teamwork",
    verbs: ["share the role", "invite a quiet idea", "combine two plans"],
    challenge: "Choose the action that helps the whole group participate."
  },
  {
    id: "gratitude",
    label: "Gratitude",
    verbs: ["name who helped", "describe what they did", "say why it mattered"],
    challenge: "Build a thank-you that includes person, action, and impact."
  },
  {
    id: "respect",
    label: "Respect",
    verbs: ["disagree calmly", "repeat the other idea", "look for common ground"],
    challenge: "Choose words that disagree without dismissing someone."
  }
];

const LOCATIONS = [
  "at a neighborhood park",
  "during a family errand",
  "while waiting in a busy line",
  "at a weekend sports practice",
  "on a video call with cousins",
  "inside a community center",
  "during a rainy-day hangout",
  "at a birthday party",
  "while helping at home",
  "on the walk back from the library"
];

const CHARACTERS = [
  { name: "Lina", trait: "creative" },
  { name: "Marcus", trait: "careful" },
  { name: "Ava", trait: "thoughtful" },
  { name: "Noah", trait: "curious" },
  { name: "Maya", trait: "energetic" },
  { name: "Sami", trait: "quiet" },
  { name: "Nora", trait: "brave" },
  { name: "Theo", trait: "helpful" }
];

const PROBLEMS = [
  "someone's plan changes at the last minute",
  "a borrowed item gets lost",
  "two people want the same turn",
  "someone feels left out of the conversation",
  "a mistake causes extra work for another person",
  "a group decision starts to feel unfair",
  "someone is nervous about trying again",
  "a message online sounds harsher than intended",
  "a helper does not get thanked",
  "someone needs more time than everyone expected"
];

const NPCS = [
  "Crystal Guide",
  "Gate Keeper",
  "Roundtable Page",
  "Lantern Keeper",
  "Garden Sage",
  "Harbor Helper"
];

export const StoryForgeSystem = {
  skills() {
    return SKILLS;
  },

  async generate(options = {}) {
    return this.save(localStory(options));
  },

  latest(count = 5) {
    return readHistory().slice(0, count);
  },

  save(story) {
    const history = readHistory();
    const stored = { ...story, id: `story-${Date.now()}`, createdAt: new Date().toISOString() };
    localStorage.setItem(userScopedKey(STORY_HISTORY_KEY), JSON.stringify([stored, ...history].slice(0, 20)));
    return stored;
  }
};

function localStory(options = {}) {
  const skill = pickSkill(options.skill);
  const hero = PlayerData.getCharacter() || "kind hero";
  const primary = choose(CHARACTERS);
  const secondary = choose(CHARACTERS.filter((item) => item.name !== primary.name));
  const location = choose(LOCATIONS);
  const problem = choose(PROBLEMS);
  const npc = choose(NPCS);
  const action = choose(skill.verbs);
  const seed = Math.floor(Math.random() * 9000) + 1000;

  return {
    title: `${skill.label} Quest ${seed}`,
    skill: skill.label,
    npcName: npc,
    setting: location,
    situation: `${primary.name} and ${secondary.name} are ${location} when ${problem}. ${primary.name} looks unsure, and ${secondary.name} is waiting to see what the ${hero} will do.`,
    dialogue: [
      `${primary.name}: "I do not know what to say. I do not want this to get worse."`,
      `${secondary.name}: "Can we slow down and figure out what is fair?"`,
      `${npc}: "A kindness choice starts with this: ${action}."`
    ],
    challenge: skill.challenge,
    choices: buildChoices(skill, primary.name, secondary.name),
    npcConversation: [
      {
        speaker: npc,
        line: `This is a ${skill.label.toLowerCase()} moment. Look for the need behind the words.`
      },
      {
        speaker: "You",
        line: `I can ${action} before I decide what to do.`
      },
      {
        speaker: npc,
        line: "Good. The kingdom changes when small choices become steady habits."
      }
    ],
    reflection: `Where could you use ${skill.label.toLowerCase()} today outside the game?`
  };
}

function buildChoices(skill, primary, secondary) {
  const good = {
    text: `Pause, ${skill.verbs[0]}, and ask ${primary} what would help next.`,
    result: "Trust rises because the choice responds to the real need.",
    correct: true
  };
  const rushed = {
    text: `Decide quickly for everyone so the problem ends faster.`,
    result: "The moment moves fast, but someone may feel unheard.",
    correct: false
  };
  const avoid = {
    text: `Walk away and hope ${secondary} handles it alone.`,
    result: "The problem stays in the group because nobody repairs it.",
    correct: false
  };
  return shuffle([good, rushed, avoid]);
}

function pickSkill(id) {
  return SKILLS.find((skill) => skill.id === id || skill.label === id) || choose(SKILLS);
}

function normalizeStory(story, options) {
  const fallback = localStory(options);
  return {
    ...fallback,
    ...story,
    dialogue: Array.isArray(story.dialogue) ? story.dialogue.slice(0, 4) : fallback.dialogue,
    choices: Array.isArray(story.choices) ? story.choices.slice(0, 4) : fallback.choices,
    npcConversation: Array.isArray(story.npcConversation) ? story.npcConversation.slice(0, 4) : fallback.npcConversation
  };
}

function choose(items) {
  return items[Math.floor(Math.random() * items.length)];
}

function shuffle(items) {
  return items.slice().sort(() => Math.random() - 0.5);
}

function readHistory() {
  try {
    const data = JSON.parse(
      localStorage.getItem(userScopedKey(STORY_HISTORY_KEY))
        || localStorage.getItem(userScopedKey(LEGACY_STORY_HISTORY_KEY))
        || "[]"
    );
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}
