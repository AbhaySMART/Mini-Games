import { userScopedKey } from "./AuthSystem.js?v=79";
import { PlayerData } from "./PlayerData.js?v=79";

const REWARDS_KEY = "kindKingdomRewards";
const CLAIMS_KEY = "kindKingdomRewardClaims";
const MS_PER_DAY = 86400000;

export const SHOP_ITEMS = [
  { id: "gratitude-cape", name: "Gratitude Cape", category: "capes", price: 100, icon: "GC", asset: "assets/lpc-generated/items/gratitude-cape.svg", sprite: "assets/lpc-generated/accessories/cape-purple-behind.png", color: 0x8b6dff, description: "A soft purple cape that glows after thank-you quests." },
  { id: "courage-crown", name: "Courage Crown", category: "crowns", price: 150, icon: "CR", asset: "assets/lpc-generated/items/courage-crown.svg", sprite: "assets/lpc-generated/accessories/crown-purple.png", color: 0xffd166, description: "A bright crown for brave next steps." },
  { id: "baby-dragon", name: "Baby Dragon Pet", category: "pets", price: 250, icon: "BD", asset: "assets/lpc-generated/pets/baby-dragon.svg", sprite: "assets/lpc-generated/pets/baby-dragon.svg", color: 0xff7b54, description: "A tiny dragon companion that bounces behind you." },
  { id: "rainbow-trail", name: "Rainbow Trail", category: "trails", price: 200, icon: "RT", asset: "assets/lpc-generated/items/rainbow-trail.svg", sprite: "assets/lpc-generated/items/rainbow-trail.svg", color: 0xff7eb3, description: "Leaves a rainbow sparkle trail while walking." },
  { id: "calm-waterfall", name: "Calm Waterfall Room Item", category: "room", price: 175, icon: "CW", asset: "assets/lpc-generated/items/calm-waterfall.svg", sprite: "assets/lpc-generated/items/calm-waterfall.svg", color: 0x70d6ff, description: "A peaceful waterfall for your castle room." },
  { id: "lantern-fox", name: "Lantern Fox", category: "pets", price: 180, icon: "LF", asset: "assets/lpc-generated/pets/lantern-fox.svg", sprite: "assets/lpc-generated/pets/lantern-fox.svg", color: 0xff9f1c, description: "A glowing fox that loves listening quests." },
  { id: "crystal-turtle", name: "Crystal Turtle", category: "pets", price: 220, icon: "CT", asset: "assets/lpc-generated/pets/crystal-turtle.svg", sprite: "assets/lpc-generated/pets/crystal-turtle.svg", color: 0x7bdff2, description: "A calm turtle with a crystal shell." },
  { id: "cloud-owl", name: "Cloud Owl", category: "pets", price: 210, icon: "CO", asset: "assets/lpc-generated/pets/cloud-owl.svg", sprite: "assets/lpc-generated/pets/cloud-owl.svg", color: 0xbfd7ea, description: "A wise owl that floats like a cloud." },
  { id: "firefly-bunny", name: "Firefly Bunny", category: "pets", price: 190, icon: "FB", asset: "assets/lpc-generated/pets/firefly-bunny.svg", sprite: "assets/lpc-generated/pets/firefly-bunny.svg", color: 0xfff2a8, description: "A bunny that leaves tiny firefly lights." },
  { id: "empathy-wings", name: "Empathy Wings", category: "outfits", price: 160, icon: "EW", asset: "assets/lpc-generated/items/empathy-wings.svg", sprite: "assets/lpc-generated/accessories/wings-teal-behind.png", color: 0x95d5b2, description: "Gentle wings for noticing feelings." },
  { id: "royal-helper-coat", name: "Royal Helper Coat", category: "outfits", price: 125, icon: "RH", asset: "assets/lpc-generated/items/royal-helper-coat.svg", sprite: "assets/lpc-generated/heroes/torso-plate.png", color: 0x2ec4b6, description: "A polished coat for helpers in the kingdom." },
  { id: "kindness-crown", name: "Kindness Crown", category: "crowns", price: 90, icon: "KC", asset: "assets/lpc-generated/items/kindness-crown.svg", sprite: "assets/lpc-generated/accessories/crown-gold.png", color: 0xfff2a8, description: "A starter crown with a warm shine." },
  { id: "star-trail", name: "Star Trail", category: "trails", price: 135, icon: "ST", asset: "assets/lpc-generated/items/star-trail.svg", sprite: "assets/lpc-generated/items/star-trail.svg", color: 0xffd166, description: "A trail of soft golden stars." },
  { id: "garden-desk", name: "Gratitude Journal Desk", category: "room", price: 140, icon: "JD", asset: "assets/lpc-generated/items/garden-desk.svg", sprite: "assets/lpc-generated/items/garden-desk.svg", color: 0xcaffbf, description: "A journal desk for reflection and gratitude." },
  { id: "pet-bed", name: "Pet Bed", category: "room", price: 95, icon: "PB", asset: "assets/lpc-generated/items/pet-bed.svg", sprite: "assets/lpc-generated/items/pet-bed.svg", color: 0xffb4a2, description: "A cozy bed for your companion." },
  { id: "lantern-night-sky", name: "Lantern Night Map Effect", category: "effects", price: 240, icon: "LN", asset: "assets/lpc-generated/items/lantern-night-sky.svg", sprite: "assets/lpc-generated/items/lantern-night-sky.svg", color: 0x44318f, description: "Adds a lantern-night glow to the kingdom map." }
];

export const BADGES = [
  { id: "empathy-builder", name: "Empathy Builder", icon: "EB", asset: "assets/lpc-generated/badges/empathy-builder.svg", skill: "Empathy", xp: 20 },
  { id: "courage-climber", name: "Courage Climber", icon: "CC", asset: "assets/lpc-generated/badges/courage-climber.svg", skill: "Courage", xp: 20 },
  { id: "gratitude-guardian", name: "Gratitude Guardian", icon: "GG", asset: "assets/lpc-generated/badges/gratitude-guardian.svg", skill: "Gratitude", xp: 20 },
  { id: "teamwork-champion", name: "Teamwork Champion", icon: "TC", asset: "assets/lpc-generated/badges/teamwork-champion.svg", skill: "Cooperation", xp: 20 },
  { id: "respect-leader", name: "Respect Leader", icon: "RL", asset: "assets/lpc-generated/badges/respect-leader.svg", skill: "Respect", xp: 20 },
  { id: "calm-choices-master", name: "Calm Choices Master", icon: "CM", asset: "assets/lpc-generated/badges/calm-choices-master.svg", skill: "Calm Choices", xp: 20 }
];

export const TITLES = [
  { id: "kindness-explorer", name: "Kindness Explorer", points: 0 },
  { id: "royal-helper", name: "Royal Helper", points: 150 },
  { id: "peace-builder", name: "Peace Builder", points: 250 },
  { id: "empathy-knight", name: "Empathy Knight", points: 350 },
  { id: "gratitude-guardian-title", name: "Gratitude Guardian", points: 450 },
  { id: "courage-champion", name: "Courage Champion", points: 600 },
  { id: "royal-mentor", name: "Royal Mentor", points: 0, passLevel: 15 }
];

export const CURRENT_EVENT = {
  id: "lantern-night",
  name: "Lantern Night",
  description: "This week, listening and kindness quests light lanterns across the kingdom.",
  rewardItem: "lantern-night-sky",
  bonusCategories: ["Communication", "Kind Words", "Digital Citizenship"]
};

const DEFAULT_REWARDS = {
  owned: ["kindness-crown", "garden-desk"],
  equipped: {
    outfits: null,
    capes: null,
    crowns: "kindness-crown",
    pets: null,
    trails: null,
    effects: null,
    title: "kindness-explorer"
  },
  room: ["garden-desk"],
  passClaims: [],
  streak: { lastVisit: null, count: 0 }
};

const PASS_REWARDS = [
  { level: 1, reward: "Starter Crown", itemId: "kindness-crown" },
  { level: 3, reward: "Kindness Trail", itemId: "star-trail" },
  { level: 5, reward: "Gratitude Cape", itemId: "gratitude-cape" },
  { level: 10, reward: "Baby Dragon Pet", itemId: "baby-dragon" },
  { level: 15, reward: "Royal Mentor Title", titleId: "royal-mentor" }
];

export const RewardSystem = {
  load() {
    const rewards = { ...DEFAULT_REWARDS, ...readJson(userScopedKey(REWARDS_KEY), readJson(REWARDS_KEY, DEFAULT_REWARDS)) };
    rewards.owned = Array.isArray(rewards.owned) ? [...new Set([...DEFAULT_REWARDS.owned, ...rewards.owned])] : [...DEFAULT_REWARDS.owned];
    rewards.room = Array.isArray(rewards.room) ? [...new Set([...DEFAULT_REWARDS.room, ...rewards.room])] : [...DEFAULT_REWARDS.room];
    rewards.passClaims = Array.isArray(rewards.passClaims) ? rewards.passClaims : [...DEFAULT_REWARDS.passClaims];
    rewards.equipped = { ...DEFAULT_REWARDS.equipped, ...(rewards.equipped || {}) };
    rewards.streak = { ...DEFAULT_REWARDS.streak, ...(rewards.streak || {}) };
    return rewards;
  },

  save(rewards) {
    localStorage.setItem(userScopedKey(REWARDS_KEY), JSON.stringify(rewards));
    localStorage.setItem(REWARDS_KEY, JSON.stringify(rewards));
  },

  item(id) {
    return SHOP_ITEMS.find((item) => item.id === id);
  },

  itemsByCategory(category) {
    return SHOP_ITEMS.filter((item) => item.category === category);
  },

  owns(id) {
    return this.load().owned.includes(id);
  },

  purchase(id) {
    const item = this.item(id);
    if (!item) return { ok: false, message: "Item not found." };
    const rewards = this.load();
    if (rewards.owned.includes(id)) return { ok: false, message: "Already owned." };
    const progress = PlayerData.loadProgress();
    if (progress.points < item.price) return { ok: false, message: `Need ${item.price - progress.points} more points.` };
    progress.points -= item.price;
    rewards.owned.push(id);
    if (item.category === "room" && !rewards.room.includes(id)) rewards.room.push(id);
    PlayerData.saveProgress(progress);
    this.save(rewards);
    return { ok: true, message: `Purchased ${item.name}.`, points: progress.points };
  },

  equip(id) {
    const item = this.item(id);
    if (!item) return { ok: false, message: "Item not found." };
    const rewards = this.load();
    if (!rewards.owned.includes(id)) return { ok: false, message: "Buy this item first." };
    if (["outfits", "capes", "crowns", "pets", "trails", "effects"].includes(item.category)) {
      rewards.equipped[item.category] = rewards.equipped[item.category] === id ? null : id;
      this.save(rewards);
      return { ok: true, message: rewards.equipped[item.category] ? `Equipped ${item.name}.` : `Unequipped ${item.name}.` };
    }
    return { ok: false, message: "This item decorates your room." };
  },

  equipTitle(id) {
    const title = TITLES.find((item) => item.id === id);
    if (!title || !this.unlockedTitles().some((item) => item.id === id)) return { ok: false, message: "Title locked." };
    const rewards = this.load();
    rewards.equipped.title = id;
    this.save(rewards);
    return { ok: true, message: `Title equipped: ${title.name}.` };
  },

  equippedItem(category) {
    const id = this.load().equipped[category];
    return id ? this.item(id) : null;
  },

  equippedTitle() {
    const id = this.load().equipped.title;
    return TITLES.find((item) => item.id === id) || TITLES[0];
  },

  unlockedTitles() {
    const points = PlayerData.loadProgress().points;
    const level = this.passLevel();
    return TITLES.filter((title) => points >= title.points && (!title.passLevel || level >= title.passLevel));
  },

  unlockedBadges() {
    const player = PlayerData.loadPlayer();
    const progress = PlayerData.loadProgress();
    const skillXP = player.skillXP || {};
    return BADGES.filter((badge) => Number(skillXP[badge.skill] || 0) >= badge.xp || progress.completed.length >= 8);
  },

  awardDailyVisit() {
    const rewards = this.load();
    const today = dayStamp();
    const last = rewards.streak.lastVisit;
    if (last === today) return { awarded: false, streak: rewards.streak.count };
    const yesterday = dayStamp(Date.now() - MS_PER_DAY);
    rewards.streak.count = last === yesterday ? rewards.streak.count + 1 : 1;
    rewards.streak.lastVisit = today;
    PlayerData.addPoints(streakReward(rewards.streak.count));
    if (rewards.streak.count >= 7 && !rewards.owned.includes("gratitude-cape")) {
      rewards.owned.push("gratitude-cape");
    }
    this.save(rewards);
    return { awarded: true, streak: rewards.streak.count };
  },

  streakReward(count) {
    return streakReward(count);
  },

  dailyQuests() {
    const stamp = dayStamp();
    const pool = [
      { id: "play-empathy", text: "Play one empathy or compassion game", reward: 20, xp: "Empathy" },
      { id: "earn-50", text: "Earn or spend 50 kindness points", reward: 25, xp: "Kind Words" },
      { id: "visit-map", text: "Visit the kingdom map and enter a portal", reward: 15, xp: "Courage" },
      { id: "real-life-kindness", text: "Complete one real-life kindness action", reward: 20, xp: "Service" },
      { id: "calm-strategy", text: "Use one calm-down strategy today", reward: 20, xp: "Calm Choices" },
      { id: "try-new", text: "Try one game you have not completed", reward: 25, xp: "Learning" }
    ];
    const start = Math.abs([...stamp].reduce((sum, char) => sum + char.charCodeAt(0), 0)) % pool.length;
    return [0, 1, 2].map((offset) => ({ ...pool[(start + offset) % pool.length], stamp }));
  },

  claimDailyQuest(id) {
    const quest = this.dailyQuests().find((item) => item.id === id);
    if (!quest) return { ok: false, message: "Quest not found." };
    const claims = readJson(userScopedKey(CLAIMS_KEY), {});
    const key = `${quest.stamp}:${id}`;
    if (claims[key]) return { ok: false, message: "Already claimed today." };
    claims[key] = true;
    localStorage.setItem(userScopedKey(CLAIMS_KEY), JSON.stringify(claims));
    PlayerData.addPoints(quest.reward);
    PlayerData.addSkillXP(quest.xp, 5);
    return { ok: true, message: `Claimed ${quest.reward} points.`, quest };
  },

  passLevel() {
    const player = PlayerData.loadPlayer();
    const totalXP = Object.values(player.skillXP || {}).reduce((sum, value) => sum + Number(value || 0), 0);
    return Math.max(1, Math.floor(totalXP / 30) + 1);
  },

  passRewards() {
    const level = this.passLevel();
    const rewards = this.load();
    return PASS_REWARDS.map((reward) => ({
      ...reward,
      unlocked: level >= reward.level,
      claimed: rewards.passClaims.includes(passRewardKey(reward))
    }));
  },

  claimPassReward(level) {
    const reward = PASS_REWARDS.find((item) => item.level === Number(level));
    if (!reward) return { ok: false, message: "Reward not found." };
    if (this.passLevel() < reward.level) return { ok: false, message: `Reach level ${reward.level} first.` };
    const rewards = this.load();
    const key = passRewardKey(reward);
    if (rewards.passClaims.includes(key)) return { ok: false, message: "Reward already claimed." };
    if (reward.itemId && !rewards.owned.includes(reward.itemId)) {
      rewards.owned.push(reward.itemId);
      const item = this.item(reward.itemId);
      if (item?.category === "room" && !rewards.room.includes(reward.itemId)) rewards.room.push(reward.itemId);
    }
    rewards.passClaims.push(key);
    this.save(rewards);
    return { ok: true, message: `Claimed ${reward.reward}.` };
  }
};

function readJson(key, fallback) {
  try {
    return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback));
  } catch {
    return fallback;
  }
}

function dayStamp(time = Date.now()) {
  return new Date(time).toISOString().slice(0, 10);
}

function streakReward(count) {
  if (count >= 7) return 40;
  if (count >= 5) return 25;
  if (count >= 3) return 15;
  return 10;
}

function passRewardKey(reward) {
  return reward.itemId || reward.titleId || `level-${reward.level}`;
}
