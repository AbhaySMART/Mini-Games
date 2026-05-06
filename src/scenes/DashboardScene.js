import { AuthSystem } from "../systems/AuthSystem.js?v=35";
import { PlayerData } from "../systems/PlayerData.js?v=35";
import { QuestSystem } from "../systems/QuestSystem.js?v=35";
import { RewardSystem, CURRENT_EVENT } from "../systems/RewardSystem.js?v=35";

const HERO_NAMES = {
  knight: "Kind Knight",
  mage: "Mindful Mage",
  ranger: "Helping Ranger",
  bard: "Listening Bard"
};

const HERO_ICONS = {
  knight: "🧒",
  mage: "🧙",
  ranger: "🧑‍🌾",
  bard: "🧑‍🎤"
};

export class DashboardScene extends Phaser.Scene {
  constructor() {
    super("DashboardScene");
  }

  create() {
    const user = AuthSystem.currentUser();
    const player = PlayerData.loadPlayer();
    const progress = PlayerData.loadProgress();
    const activeQuest = QuestSystem.getActiveQuest(progress);
    const streak = RewardSystem.awardDailyVisit();
    const title = RewardSystem.equippedTitle();

    this.cameras.main.setBackgroundColor("#6fb7ff");
    this.add.rectangle(480, 270, 960, 540, 0x6fb7ff);
    this.add.rectangle(480, 330, 960, 420, 0xb9ef9a);
    this.add.circle(820, 116, 72, 0xffd166, 0.94);

    this.add.text(60, 42, `Welcome, ${user}`, {
      fontFamily: "Berkshire Swash, Georgia, serif",
      fontSize: "44px",
      color: "#ffffff",
      stroke: "#4d2c83",
      strokeThickness: 7
    });

    this.add.text(62, 100, `Your dashboard • ${title.name}`, {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "20px",
      color: "#2d174d",
      backgroundColor: "#ffffffcc",
      padding: { x: 12, y: 6 }
    });

    const updatedProgress = PlayerData.loadProgress();
    this.createStatCard(142, 205, "Kindness Points", String(updatedProgress.points), "✨");
    this.createStatCard(362, 205, "Completed", String(progress.completed.length), "✅");
    this.createStatCard(582, 205, "Hero", player.character ? HERO_NAMES[player.character] : "Choose one", HERO_ICONS[player.character] || "👤");
    this.createStatCard(802, 205, "Pass Level", String(RewardSystem.passLevel()), "🎟️");

    this.add.text(480, 298, `${activeQuest.npc}: ${activeQuest.prompt}`, {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "18px",
      color: "#2d174d",
      align: "center",
      wordWrap: { width: 760 }
    }).setOrigin(0.5);
    this.add.text(480, 336, `${CURRENT_EVENT.name}: ${CURRENT_EVENT.description}${streak.awarded ? ` Daily login reward claimed.` : ""}`, {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "16px",
      color: "#4d2c83",
      align: "center",
      wordWrap: { width: 800 }
    }).setOrigin(0.5);

    this.makeButton(176, 392, "Begin Gameplay", 0x5a2da0, () => {
      this.scene.start(player.character ? "KingdomMapScene" : "CharacterSelectScene");
    });
    this.makeButton(384, 392, "Shop", 0xff9f1c, () => this.scene.start("ShopScene"));
    this.makeButton(556, 392, "Closet", 0x2ec4b6, () => this.scene.start("ClosetScene"));
    this.makeButton(744, 392, "My Room", 0x7b4dff, () => this.scene.start("PlayerRoomScene"));
    this.makeButton(254, 470, "Choose Character", 0x2ec4b6, () => this.scene.start("CharacterSelectScene", { returnToDashboard: true }));
    this.makeButton(480, 470, "Card View", 0xff9f1c, () => {
      window.location.href = "card-view.html";
    });
    this.makeButton(704, 470, "Log Out", 0x3d315b, () => {
      AuthSystem.logout();
      this.scene.start("LoginScene");
    });
  }

  createStatCard(x, y, label, value, icon) {
    this.add.rectangle(x, y, 185, 112, 0xffffff, 0.92).setStrokeStyle(4, 0x5a2da0);
    this.add.text(x, y - 28, icon, { fontSize: "32px" }).setOrigin(0.5);
    this.add.text(x, y + 4, value, {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "18px",
      color: "#2d174d",
      fontStyle: "bold",
      align: "center",
      wordWrap: { width: 155 }
    }).setOrigin(0.5);
    this.add.text(x, y + 38, label, {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "13px",
      color: "#66517e",
      fontStyle: "bold"
    }).setOrigin(0.5);
  }

  makeButton(x, y, text, color, onClick) {
    const button = this.add.text(x, y, text, {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "22px",
      color: "#ffffff",
      backgroundColor: `#${color.toString(16).padStart(6, "0")}`,
      padding: { x: 20, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    button.on("pointerover", () => button.setScale(1.05));
    button.on("pointerout", () => button.setScale(1));
    button.on("pointerdown", onClick);
  }
}
