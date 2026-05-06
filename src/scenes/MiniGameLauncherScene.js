import { PlayerData } from "../systems/PlayerData.js?v=43";
import { QuestSystem } from "../systems/QuestSystem.js?v=43";

export class MiniGameLauncherScene extends Phaser.Scene {
  constructor() {
    super("MiniGameLauncherScene");
  }

  init(data) {
    this.portal = data;
  }

  create() {
    const { game, unlocked, required } = this.portal;
    const progress = PlayerData.loadProgress();
    const quest = QuestSystem.getQuestForGame(game);

    this.add.rectangle(480, 380, 960, 760, 0x160f29, 0.72);
    const card = this.add.rectangle(480, 380, 650, 410, 0xffffff, 0.96)
      .setStrokeStyle(6, unlocked ? 0xffd166 : 0x8d99ae);
    this.add.text(480, 230, game.title, {
      fontFamily: "Berkshire Swash, Georgia, serif",
      fontSize: "38px",
      color: "#4d2c83",
      align: "center",
      wordWrap: { width: 560 }
    }).setOrigin(0.5);
    this.add.text(480, 292, game.lesson, {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "20px",
      color: "#2d174d",
      align: "center",
      wordWrap: { width: 560 }
    }).setOrigin(0.5);
    this.add.text(480, 370, quest ? `NPC Quest: ${quest.prompt}` : `Skill XP: ${game.category}`, {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "17px",
      color: "#66517e",
      align: "center",
      wordWrap: { width: 540 }
    }).setOrigin(0.5);
    this.add.text(480, 445, unlocked
      ? `Current points: ${progress.points}. Complete the quiz in the mini-game to earn more.`
      : `Locked. Earn ${Math.max(0, required - progress.points)} more Kindness Points.`,
    {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "17px",
      color: unlocked ? "#1f6b35" : "#8e3026",
      align: "center"
    }).setOrigin(0.5);

    const enter = this.makeButton(370, 535, unlocked ? "Enter Game" : "Locked", unlocked ? 0x5a2da0 : 0x8d99ae);
    const cancel = this.makeButton(590, 535, "Back to Map", 0x2ec4b6);
    enter.on("pointerdown", () => {
      if (!unlocked) return;
      window.location.href = `game.html?game=${game.slug}&return=map`;
    });
    cancel.on("pointerdown", () => this.close());

    this.input.keyboard.once("keydown-ESC", () => this.close());
    this.input.keyboard.once("keydown-E", () => {
      if (unlocked) window.location.href = `game.html?game=${game.slug}&return=map`;
    });
  }

  makeButton(x, y, text, color) {
    const button = this.add.text(x, y, text, {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "22px",
      color: "#ffffff",
      backgroundColor: `#${color.toString(16).padStart(6, "0")}`,
      padding: { x: 22, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    button.on("pointerover", () => button.setScale(1.05));
    button.on("pointerout", () => button.setScale(1));
    return button;
  }

  close() {
    this.scene.stop();
    this.scene.resume("KingdomMapScene");
  }
}
