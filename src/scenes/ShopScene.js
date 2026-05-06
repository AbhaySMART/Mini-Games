import { PlayerData } from "../systems/PlayerData.js?v=35";
import { RewardSystem, SHOP_ITEMS, CURRENT_EVENT } from "../systems/RewardSystem.js?v=35";

const CATEGORIES = ["outfits", "capes", "crowns", "pets", "trails", "room", "effects"];

export class ShopScene extends Phaser.Scene {
  constructor() {
    super("ShopScene");
  }

  create() {
    this.category = "outfits";
    this.cameras.main.setBackgroundColor("#3d2466");
    this.add.rectangle(480, 270, 960, 540, 0x3d2466);
    this.add.circle(840, 95, 76, 0xffd166, 0.88);
    this.panel = this.add.dom(480, 282).createFromHTML(`<div class="kk-reward-panel"></div>`);
    this.render();
  }

  render(message = "") {
    const progress = PlayerData.loadProgress();
    const rewards = RewardSystem.load();
    const items = SHOP_ITEMS.filter((item) => item.category === this.category);
    this.panel.node.innerHTML = `
      <div class="kk-panel-head">
        <div>
          <span>Kindness Shop</span>
          <h2>Spend points on rewards</h2>
          <p>${CURRENT_EVENT.name}: ${CURRENT_EVENT.description}</p>
        </div>
        <strong>${progress.points} pts</strong>
      </div>
      <div class="kk-tabs">
        ${CATEGORIES.map((category) => `<button data-category="${category}" class="${category === this.category ? "active" : ""}">${label(category)}</button>`).join("")}
      </div>
      <div class="kk-shop-grid">
        ${items.map((item) => {
          const owned = rewards.owned.includes(item.id);
          const equipped = rewards.equipped[item.category] === item.id;
          return `
            <article class="kk-shop-item ${owned ? "owned" : ""}">
              <div class="kk-item-icon" style="--item-color:#${item.color.toString(16).padStart(6, "0")}">${item.icon}</div>
              <h3>${item.name}</h3>
              <p>${item.description}</p>
              <small>${owned ? "Owned" : `${item.price} points`}</small>
              <button data-buy="${item.id}" ${owned && item.category === "room" ? "disabled" : ""}>${owned ? equipped ? "Equipped" : item.category === "room" ? "In Room" : "Equip" : "Buy"}</button>
            </article>
          `;
        }).join("")}
      </div>
      <div class="kk-panel-message">${message || "Buy items here. Equip owned items in the Closet."}</div>
      <div class="kk-panel-actions">
        <button data-nav="closet">Avatar Closet</button>
        <button data-nav="room">Player Room</button>
        <button data-nav="dashboard">Dashboard</button>
      </div>
    `;
    this.bind();
  }

  bind() {
    this.panel.node.querySelectorAll("[data-category]").forEach((button) => {
      button.addEventListener("click", () => {
        this.category = button.dataset.category;
        this.render();
      });
    });
    this.panel.node.querySelectorAll("[data-buy]").forEach((button) => {
      button.addEventListener("click", () => {
        const id = button.dataset.buy;
        const item = RewardSystem.item(id);
        const result = RewardSystem.owns(id) && item.category !== "room"
          ? RewardSystem.equip(id)
          : RewardSystem.purchase(id);
        this.render(result.message);
      });
    });
    this.panel.node.querySelectorAll("[data-nav]").forEach((button) => {
      button.addEventListener("click", () => this.navigate(button.dataset.nav));
    });
  }

  navigate(target) {
    if (target === "closet") this.scene.start("ClosetScene");
    if (target === "room") this.scene.start("PlayerRoomScene");
    if (target === "dashboard") this.scene.start("DashboardScene");
  }
}

function label(category) {
  return category.replace(/^\w/, (letter) => letter.toUpperCase());
}
