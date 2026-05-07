import { PlayerData } from "../systems/PlayerData.js?v=69";
import { RewardSystem, SHOP_ITEMS, CURRENT_EVENT } from "../systems/RewardSystem.js?v=69";

const CATEGORIES = ["outfits", "capes", "crowns", "pets", "trails", "room", "effects"];

export class ShopScene extends Phaser.Scene {
  constructor() {
    super("ShopScene");
  }

  create() {
    this.category = "outfits";
    this.cameras.main.setBackgroundColor("#3d2466");
    this.add.rectangle(480, 380, 960, 760, 0x3d2466);
    this.add.circle(840, 95, 76, 0xffd166, 0.88);
    this.panel = this.add.dom(480, 80).createFromHTML(`<div class="kk-reward-panel shop"></div>`);
    this.panel.setOrigin(0.5, 0);
    this.enablePanelScroll();
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
        <div class="kk-head-actions">
          <strong>${progress.points} pts</strong>
          <button data-nav="dashboard" class="kk-home-button">Back to Home</button>
        </div>
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
              ${itemIcon(item)}
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

  enablePanelScroll() {
    const node = this.panel.node;
    node.addEventListener("wheel", (event) => {
      const before = node.scrollTop;
      node.scrollTop += event.deltaY;
      if (node.scrollTop !== before) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, { passive: false });

    let lastY = 0;
    node.addEventListener("touchstart", (event) => {
      lastY = event.touches[0]?.clientY || 0;
    }, { passive: true });
    node.addEventListener("touchmove", (event) => {
      const y = event.touches[0]?.clientY || lastY;
      const before = node.scrollTop;
      node.scrollTop += lastY - y;
      lastY = y;
      if (node.scrollTop !== before) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, { passive: false });
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

function itemIcon(item) {
  if (item.sprite) {
    return `<div class="kk-item-icon" style="--item-color:#${item.color.toString(16).padStart(6, "0")}"><span class="kk-lpc-item-icon" style="background-image:url('${item.sprite}')"></span></div>`;
  }
  return `<div class="kk-item-icon" style="--item-color:#${item.color.toString(16).padStart(6, "0")}">${item.asset ? `<img src="${item.asset}" alt="">` : `<span>${item.icon}</span>`}</div>`;
}
