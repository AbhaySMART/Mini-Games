import { PlayerData } from "../systems/PlayerData.js?v=75";
import { AuthSystem } from "../systems/AuthSystem.js?v=75";
import { HERO_LAYER_ASSETS, WALK_FRAMES } from "../systems/AssetCatalog.js?v=75";

export class BootScene extends Phaser.Scene {
  constructor() {
    super("BootScene");
  }

  create() {
    if (!this.textures.exists("hero-hitbox")) {
      const graphics = this.make.graphics({ x: 0, y: 0, add: false });
      graphics.fillStyle(0xffffff, 0.01);
      graphics.fillRect(0, 0, 40, 40);
      graphics.generateTexture("hero-hitbox", 40, 40);
      graphics.destroy();
    }
    this.cameras.main.setBackgroundColor("#6fb7ff");
    this.createCharacterAnimations();
    this.add.rectangle(480, 380, 960, 760, 0x6fb7ff);
    this.add.text(480, 335, "Kind Kingdom", {
      fontFamily: "Berkshire Swash, Georgia, serif",
      fontSize: "58px",
      color: "#ffffff",
      stroke: "#4b2a7b",
      strokeThickness: 8
    }).setOrigin(0.5);
    this.add.text(480, 405, "Loading your kindness world...", {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "22px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this.time.delayedCall(500, () => {
      if (!AuthSystem.isLoggedIn()) {
        this.scene.start("LoginScene");
        return;
      }
      this.scene.start("DashboardScene");
    });
  }

  preload() {
    const games = window.KIND_KINGDOM_GAMES || [];
    Object.entries(HERO_LAYER_ASSETS).forEach(([key, path]) => {
      this.load.spritesheet(`lpc-${key}`, path, { frameWidth: 64, frameHeight: 64 });
    });
    ["baby-dragon", "lantern-fox", "crystal-turtle", "cloud-owl", "firefly-bunny"].forEach((pet) => {
      this.load.svg(`pet-${pet}`, `assets/lpc-generated/pets/${pet}.svg`, { width: 96, height: 96 });
    });
    [
      "gratitude-cape", "courage-crown", "rainbow-trail", "calm-waterfall", "empathy-wings",
      "royal-helper-coat", "kindness-crown", "star-trail", "garden-desk", "pet-bed", "lantern-night-sky"
    ].forEach((item) => {
      this.load.svg(`item-${item}`, `assets/lpc-generated/items/${item}.svg`, { width: 96, height: 96 });
    });
    this.load.svg("kingdom-world-map", "src/assets/maps/kingdom-world-map.svg", { width: 3200, height: 2100 });
    games.forEach((game) => {
      this.load.image(`game-${game.slug}`, `assets/images/games/${game.slug}.jpg`);
    });
  }

  createCharacterAnimations() {
    Object.keys(HERO_LAYER_ASSETS).forEach((key) => {
      const animationKey = `lpc-${key}-walk`;
      if (this.anims.exists(animationKey)) return;
      this.anims.create({
        key: animationKey,
        frames: WALK_FRAMES.map((frame) => ({ key: `lpc-${key}`, frame })),
        frameRate: 8,
        repeat: -1
      });
    });
  }
}
