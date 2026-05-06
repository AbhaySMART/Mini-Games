import { PlayerData } from "../systems/PlayerData.js?v=43";
import { AuthSystem } from "../systems/AuthSystem.js?v=43";

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
    this.load.spritesheet("kk-heroes", "assets/sprites/third-party/grafxkid-rpg-assets.png", {
      frameWidth: 16,
      frameHeight: 16
    });
    this.load.image("pet-baby-dragon", "assets/sprites/third-party/tiny-creatures/tile_0032.png");
    this.load.image("pet-lantern-fox", "assets/sprites/third-party/tiny-creatures/tile_0180.png");
    this.load.image("pet-crystal-turtle", "assets/sprites/third-party/tiny-creatures/tile_0130.png");
    this.load.image("pet-cloud-owl", "assets/sprites/third-party/tiny-creatures/tile_0121.png");
    this.load.image("pet-cloud-owl-flap", "assets/sprites/third-party/tiny-creatures/tile_0122.png");
    this.load.image("pet-firefly-bunny", "assets/sprites/third-party/tiny-creatures/tile_0179.png");
    this.load.svg("kingdom-world-map", "src/assets/maps/kingdom-world-map.svg", { width: 3200, height: 2100 });
    games.forEach((game) => {
      this.load.image(`game-${game.slug}`, `assets/images/games/${game.slug}.jpg`);
    });
  }

  createCharacterAnimations() {
    const frameSets = {
      knight: [0, 1, 2, 1],
      mage: [3, 4, 5, 4],
      ranger: [8, 9, 10, 9],
      bard: [32, 33, 34, 33]
    };

    Object.entries(frameSets).forEach(([hero, frames]) => {
      const key = `hero-${hero}-walk`;
      if (this.anims.exists(key)) return;
      this.anims.create({
        key,
        frames: frames.map((frame) => ({ key: "kk-heroes", frame })),
        frameRate: 7,
        repeat: -1
      });
    });
  }
}
