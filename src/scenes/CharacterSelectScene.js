import { PlayerData } from "../systems/PlayerData.js?v=61";
import { FRONT_FRAME, HEROES } from "../systems/AssetCatalog.js?v=61";

export class CharacterSelectScene extends Phaser.Scene {
  constructor() {
    super("CharacterSelectScene");
  }

  init(data) {
    this.returnToDashboard = Boolean(data?.returnToDashboard);
  }

  create() {
    this.cameras.main.setBackgroundColor("#8b6dff");
    this.add.rectangle(480, 380, 960, 760, 0x8b6dff);
    this.add.circle(180, 150, 90, 0xffffff, 0.16);
    this.add.circle(820, 610, 130, 0xffd166, 0.22);

    this.add.text(480, 130, "Choose Your Hero", {
      fontFamily: "Berkshire Swash, Georgia, serif",
      fontSize: "54px",
      color: "#ffffff",
      stroke: "#4d2c83",
      strokeThickness: 7
    }).setOrigin(0.5);

    this.add.text(480, 190, "Your hero explores the kingdom map and enters kindness quests.", {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "20px",
      color: "#fff8d6"
    }).setOrigin(0.5);

    HEROES.forEach((hero, index) => {
      const x = 210 + index * 180;
      const card = this.add.rectangle(x, 410, 142, 178, 0xffffff, 0.92)
        .setStrokeStyle(5, hero.color)
        .setInteractive({ useHandCursor: true });
      const portrait = this.createHeroPortrait(x, 367, hero).setScale(1.85);
      this.tweens.add({ targets: portrait, y: 360, duration: 850, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      const title = this.add.text(x, 443, hero.title, {
        fontFamily: "Nunito, Arial, sans-serif",
        fontSize: "18px",
        color: "#3b225f",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: 120 }
      }).setOrigin(0.5);

      [card, portrait, title].forEach((item) => {
        item.setInteractive({ useHandCursor: true });
        item.on("pointerover", () => card.setScale(1.05));
        item.on("pointerout", () => card.setScale(1));
        item.on("pointerdown", () => this.chooseHero(hero));
      });
    });
  }

  chooseHero(hero) {
    PlayerData.setCharacter(hero.id);
    this.cameras.main.flash(260, 255, 255, 255);
    this.time.delayedCall(260, () => this.scene.start(this.returnToDashboard ? "DashboardScene" : "KingdomMapScene"));
  }

  createHeroPortrait(x, y, hero) {
    const container = this.add.container(x, y);
    hero.layers.forEach((layer) => {
      const sprite = this.add.sprite(0, 0, `lpc-${layer}`, FRONT_FRAME);
      sprite.play(`lpc-${layer}-walk`);
      container.add(sprite);
    });
    container.setSize(78, 92);
    return container;
  }
}
