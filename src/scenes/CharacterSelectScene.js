import { PlayerData } from "../systems/PlayerData.js?v=45";

const HEROES = [
  { id: "knight", frame: 0, title: "Kind Knight", color: 0x7b4dff },
  { id: "mage", frame: 3, title: "Mindful Mage", color: 0x2ec4b6 },
  { id: "ranger", frame: 8, title: "Helping Ranger", color: 0x52b788 },
  { id: "bard", frame: 32, title: "Listening Bard", color: 0xff8fab }
];

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
      const portrait = this.add.sprite(x, 367, "kk-heroes", hero.frame).setScale(4.2);
      portrait.play(`hero-${hero.id}-walk`);
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
}
