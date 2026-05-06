import { PlayerData } from "../systems/PlayerData.js?v=61";
import { RewardSystem, SHOP_ITEMS } from "../systems/RewardSystem.js?v=61";
import { HERO_LAYER_ASSETS, getHero } from "../systems/AssetCatalog.js?v=61";

const EQUIP_CATEGORIES = ["outfits", "crowns", "capes", "pets", "trails", "effects"];

export class ClosetScene extends Phaser.Scene {
  constructor() {
    super("ClosetScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#2f2b68");
    this.add.rectangle(480, 380, 960, 760, 0x2f2b68);
    this.add.circle(132, 620, 120, 0x7bdff2, 0.16);
    this.panel = this.add.dom(480, 380).createFromHTML(`<div class="kk-reward-panel closet"></div>`);
    this.enablePanelScroll();
    this.render();
  }

  render(message = "") {
    const player = PlayerData.loadPlayer();
    const rewards = RewardSystem.load();
    const ownedItems = SHOP_ITEMS.filter((item) => rewards.owned.includes(item.id) && EQUIP_CATEGORIES.includes(item.category));
    const titles = RewardSystem.unlockedTitles();
    this.panel.node.innerHTML = `
      <div class="kk-panel-head">
        <div>
          <span>Avatar Closet</span>
          <h2>Equip your owned rewards</h2>
          <p>Equipped items appear on the map: pets follow you, trails show while walking, and map effects change the world mood.</p>
        </div>
        <div class="kk-head-actions">
          <strong>${RewardSystem.equippedTitle().name}</strong>
          <button data-nav="dashboard" class="kk-home-button">Back to Home</button>
        </div>
      </div>
      <div class="kk-closet-preview">
        <div class="kk-avatar-preview">
          ${heroPreview(player.character || "knight", rewards)}
          <small>${equippedSummary()}</small>
        </div>
        <div class="kk-equipped-list">
          ${EQUIP_CATEGORIES.map((category) => `<p><b>${label(category)}:</b> ${RewardSystem.equippedItem(category)?.name || "None"}</p>`).join("")}
        </div>
      </div>
      <div class="kk-shop-grid compact">
        ${ownedItems.map((item) => `
          <article class="kk-shop-item owned">
            ${itemIcon(item)}
            <h3>${item.name}</h3>
            <small>${label(item.category)}</small>
            <button data-equip="${item.id}">${rewards.equipped[item.category] === item.id ? "Unequip" : "Equip"}</button>
          </article>
        `).join("") || `<p class="kk-empty">Buy rewards in the shop to fill your closet.</p>`}
      </div>
      <div class="kk-title-row">
        <b>Titles</b>
        ${titles.map((title) => `<button data-title="${title.id}" class="${rewards.equipped.title === title.id ? "active" : ""}">${title.name}</button>`).join("")}
      </div>
      <div class="kk-panel-message">${message || "Closet changes are saved automatically."}</div>
      <div class="kk-panel-actions">
        <button data-nav="shop">Shop</button>
        <button data-nav="room">Player Room</button>
        <button data-nav="dashboard">Dashboard</button>
      </div>
    `;
    this.bind();
  }

  bind() {
    this.panel.node.querySelectorAll("[data-equip]").forEach((button) => {
      button.addEventListener("click", () => {
        const result = RewardSystem.equip(button.dataset.equip);
        this.render(result.message);
      });
    });
    this.panel.node.querySelectorAll("[data-title]").forEach((button) => {
      button.addEventListener("click", () => {
        const result = RewardSystem.equipTitle(button.dataset.title);
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
      node.scrollTop += event.deltaY;
      event.preventDefault();
      event.stopPropagation();
    }, { passive: false });

    let lastY = 0;
    node.addEventListener("touchstart", (event) => {
      lastY = event.touches[0]?.clientY || 0;
    }, { passive: true });
    node.addEventListener("touchmove", (event) => {
      const y = event.touches[0]?.clientY || lastY;
      node.scrollTop += lastY - y;
      lastY = y;
      event.preventDefault();
      event.stopPropagation();
    }, { passive: false });
  }

  navigate(target) {
    if (target === "shop") this.scene.start("ShopScene");
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

function equippedSummary() {
  return ["crowns", "capes", "pets"]
    .map((category) => RewardSystem.equippedItem(category)?.name)
    .filter(Boolean)
    .join(" + ") || "No accessories equipped";
}

function heroPreview(character, rewards) {
  const hero = getHero(character);
  const cape = RewardSystem.equippedItem("capes");
  const outfit = RewardSystem.equippedItem("outfits");
  const crown = RewardSystem.equippedItem("crowns");
  const crownLayer = crown ? crown.id === "courage-crown" ? "crown-purple" : "crown-gold" : null;
  const floatingItems = ["effects"]
    .map((category) => RewardSystem.equippedItem(category))
    .filter(Boolean);
  const pet = RewardSystem.equippedItem("pets");
  const equippedLayers = [
    cape?.id === "gratitude-cape" ? "cape-purple" : null,
    outfit?.id === "empathy-wings" ? "wings-teal" : null,
    ...hero.layers,
    outfit?.id === "royal-helper-coat" ? "torso-plate" : null,
    crownLayer
  ].filter(Boolean);

  return `
    <div class="kk-avatar-stack">
      <div class="kk-avatar-trail ${RewardSystem.equippedItem("trails") ? "active" : ""}"></div>
      ${equippedLayers.map((layer) => lpcLayer(layer)).join("")}
      ${floatingItems.map((item, index) => `
        <img class="kk-avatar-accessory slot-${index}" src="${item.asset}" alt="${item.name}">
      `).join("")}
      ${pet ? `<img class="kk-avatar-pet" src="${pet.asset}" alt="${pet.name}">` : ""}
    </div>
  `;
}

function lpcLayer(layer) {
  return `<div class="kk-lpc-layer" style="background-image:url('${HERO_LAYER_ASSETS[layer]}')"></div>`;
}
