import { PlayerData } from "../systems/PlayerData.js";
import { AuthSystem } from "../systems/AuthSystem.js";

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
    this.add.rectangle(480, 270, 960, 540, 0x6fb7ff);
    this.add.text(480, 224, "Kind Kingdom", {
      fontFamily: "Berkshire Swash, Georgia, serif",
      fontSize: "58px",
      color: "#ffffff",
      stroke: "#4b2a7b",
      strokeThickness: 8
    }).setOrigin(0.5);
    this.add.text(480, 292, "Loading your kindness world...", {
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
    this.load.svg("kingdom-world-map", "src/assets/maps/kingdom-world-map.svg", { width: 3200, height: 2100 });
    games.forEach((game) => {
      this.load.image(`game-${game.slug}`, `assets/images/games/${game.slug}.jpg`);
    });
  }
}
