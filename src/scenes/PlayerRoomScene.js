import { PlayerData } from "../systems/PlayerData.js?v=35";
import { RewardSystem, SHOP_ITEMS, BADGES, CURRENT_EVENT } from "../systems/RewardSystem.js?v=35";

export class PlayerRoomScene extends Phaser.Scene {
  constructor() {
    super("PlayerRoomScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#6d4b8d");
    this.add.rectangle(480, 270, 960, 540, 0x6d4b8d);
    this.panel = this.add.dom(480, 282).createFromHTML(`<div class="kk-reward-panel room"></div>`);
    this.render();
  }

  render(message = "") {
    const progress = PlayerData.loadProgress();
    const rewards = RewardSystem.load();
    const roomItems = SHOP_ITEMS.filter((item) => rewards.room.includes(item.id));
    const badges = RewardSystem.unlockedBadges();
    const quests = RewardSystem.dailyQuests();
    const passRewards = RewardSystem.passRewards();
    this.panel.node.innerHTML = `
      <div class="kk-panel-head">
        <div>
          <span>Player Room</span>
          <h2>Your castle room</h2>
          <p>Decorations, badges, daily quests, streaks, events, and Kingdom Pass progress live here.</p>
        </div>
        <strong>${progress.points} pts</strong>
      </div>
      <div class="kk-room-grid">
        <section class="kk-room-space">
          <div class="kk-room-wall">
            <h3>Badge Wall</h3>
            <div class="kk-badges">
              ${BADGES.map((badge) => {
                const unlocked = badges.some((item) => item.id === badge.id);
                return `<span class="${unlocked ? "unlocked" : ""}" title="${badge.name}">${unlocked ? badge.icon : "🔒"}<small>${badge.name}</small></span>`;
              }).join("")}
            </div>
          </div>
          <div class="kk-room-floor">
            ${roomItems.map((item) => `<span style="--item-color:#${item.color.toString(16).padStart(6, "0")}">${item.icon}<small>${item.name}</small></span>`).join("")}
            <span>${RewardSystem.equippedItem("pets")?.icon || "🧸"}<small>Pet Bed</small></span>
          </div>
        </section>
        <section class="kk-side-board">
          <h3>Daily Quest Board</h3>
          ${quests.map((quest) => `<button data-quest="${quest.id}">${quest.text}<small>+${quest.reward} pts</small></button>`).join("")}
          <h3>Streak</h3>
          <p>Current streak: <b>${rewards.streak.count}</b> day${rewards.streak.count === 1 ? "" : "s"}. Next visit reward: ${RewardSystem.streakReward(rewards.streak.count + 1)} pts.</p>
        </section>
      </div>
      <div class="kk-pass">
        <b>Kingdom Pass Level ${RewardSystem.passLevel()}</b>
        <div>${passRewards.map((reward) => `
          <button data-pass="${reward.level}" class="${reward.unlocked ? "unlocked" : ""}" ${reward.unlocked && !reward.claimed ? "" : "disabled"}>
            Lv ${reward.level}: ${reward.reward}
            <small>${reward.claimed ? "Claimed" : reward.unlocked ? "Claim" : "Locked"}</small>
          </button>
        `).join("")}</div>
      </div>
      <div class="kk-event-card">
        <b>${CURRENT_EVENT.name}</b>
        <span>${CURRENT_EVENT.description}</span>
      </div>
      <div class="kk-panel-message">${message || "Claim daily quests when you complete them in real life or in the kingdom."}</div>
      <div class="kk-panel-actions">
        <button data-nav="shop">Shop</button>
        <button data-nav="closet">Closet</button>
        <button data-nav="dashboard">Dashboard</button>
      </div>
    `;
    this.bind();
  }

  bind() {
    this.panel.node.querySelectorAll("[data-quest]").forEach((button) => {
      button.addEventListener("click", () => {
        const result = RewardSystem.claimDailyQuest(button.dataset.quest);
        this.render(result.message);
      });
    });
    this.panel.node.querySelectorAll("[data-pass]").forEach((button) => {
      button.addEventListener("click", () => {
        const result = RewardSystem.claimPassReward(button.dataset.pass);
        this.render(result.message);
      });
    });
    this.panel.node.querySelectorAll("[data-nav]").forEach((button) => {
      button.addEventListener("click", () => this.navigate(button.dataset.nav));
    });
  }

  navigate(target) {
    if (target === "shop") this.scene.start("ShopScene");
    if (target === "closet") this.scene.start("ClosetScene");
    if (target === "dashboard") this.scene.start("DashboardScene");
  }
}
