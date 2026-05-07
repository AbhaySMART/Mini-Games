import { AuthSystem } from "../systems/AuthSystem.js?v=77";
import { PlayerData } from "../systems/PlayerData.js?v=77";
import { QuestSystem } from "../systems/QuestSystem.js?v=77";
import { RewardSystem, CURRENT_EVENT } from "../systems/RewardSystem.js?v=77";
import { EmotionSystem } from "../systems/EmotionSystem.js?v=77";
import { KingdomNewsSystem } from "../systems/KingdomNewsSystem.js?v=77";

const HERO_NAMES = {
  knight: "Kind Knight",
  mage: "Mindful Mage",
  ranger: "Helping Ranger",
  bard: "Listening Bard"
};

const HERO_ICONS = {
  knight: "Hero I",
  mage: "Hero II",
  ranger: "Hero III",
  bard: "Hero IV"
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
    const mood = EmotionSystem.getKingdomMood(progress);
    const unreadNews = KingdomNewsSystem.unreadCount(window.KIND_KINGDOM_GAMES || []);

    this.cameras.main.setBackgroundColor("#6fb7ff");
    this.add.rectangle(480, 380, 960, 760, 0x6fb7ff);
    this.add.rectangle(480, 505, 960, 510, 0xb9ef9a);
    this.add.circle(820, 145, 72, 0xffd166, 0.94);

    this.add.text(480, 82, `Welcome, ${user}`, {
      fontFamily: "Berkshire Swash, Georgia, serif",
      fontSize: "44px",
      color: "#ffffff",
      stroke: "#4d2c83",
      strokeThickness: 7,
      align: "center",
      wordWrap: { width: 830 }
    }).setOrigin(0.5, 0);

    this.add.text(62, 145, `Your dashboard • ${title.name}`, {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "20px",
      color: "#2d174d",
      backgroundColor: "#ffffffcc",
      padding: { x: 12, y: 6 }
    });
    if (unreadNews > 0) {
      this.add.rectangle(788, 132, 250, 48, 0xfff2a8, 0.96).setStrokeStyle(4, 0xffb703);
      this.add.text(788, 132, `${unreadNews} new Kingdom News post${unreadNews === 1 ? "" : "s"}`, {
        fontFamily: "Nunito, Arial, sans-serif",
        fontSize: "15px",
        color: "#3a2900",
        fontStyle: "bold",
        align: "center",
        wordWrap: { width: 218 }
      }).setOrigin(0.5);
    }

    const updatedProgress = PlayerData.loadProgress();
    this.createStatCard(142, 285, "Kindness Points", String(updatedProgress.points), "KP");
    this.createStatCard(362, 285, "Completed", String(progress.completed.length), "DONE");
    this.createStatCard(582, 285, "Hero", player.character ? HERO_NAMES[player.character] : "Choose one", HERO_ICONS[player.character] || "HERO");
    this.createStatCard(802, 285, "Pass Level", String(RewardSystem.passLevel()), "LVL");

    this.add.text(480, 405, `${activeQuest.npc}: ${activeQuest.prompt}`, {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "18px",
      color: "#2d174d",
      align: "center",
      wordWrap: { width: 760 }
    }).setOrigin(0.5);
    this.add.text(480, 452, `${CURRENT_EVENT.name}: ${CURRENT_EVENT.description}${streak.awarded ? ` Daily login reward claimed.` : ""}`, {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "16px",
      color: "#4d2c83",
      align: "center",
      wordWrap: { width: 800 }
    }).setOrigin(0.5);
    this.add.text(480, 494, `Kingdom mood: ${mood.sky}. Helpful and calm choices brighten the world; rushed or unkind choices make it feel heavier.`, {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "15px",
      color: "#2d174d",
      align: "center",
      wordWrap: { width: 780 }
    }).setOrigin(0.5);

    this.makeButton(170, 548, "Begin Gameplay", 0x5a2da0, () => {
      this.scene.start(player.character ? "KingdomMapScene" : "CharacterSelectScene");
    });
    this.makeButton(372, 548, "Story Forge", 0xd76d77, () => this.scene.start("StoryForgeScene"));
    this.makeButton(548, 548, "Shop", 0xff9f1c, () => this.scene.start("ShopScene"));
    this.makeButton(724, 548, "Closet", 0x2ec4b6, () => this.scene.start("ClosetScene"));
    this.makeButton(132, 636, "Kingdom News", 0xffb703, () => this.scene.start("KingdomNewsScene"), "#3a2900");
    this.makeButton(324, 636, "Journal", 0xfff2a8, () => this.scene.start("ReflectionJournalScene"), "#3a2900");
    this.makeButton(492, 636, "My Room", 0x7b4dff, () => this.scene.start("PlayerRoomScene"));
    this.makeButton(682, 636, "Choose Hero", 0x2ec4b6, () => this.scene.start("CharacterSelectScene", { returnToDashboard: true }));
    this.makeButton(842, 636, "Card View", 0xff9f1c, () => {
      window.location.href = "card-view.html";
    });
    this.makeButton(848, 710, "Log Out", 0x3d315b, () => {
      AuthSystem.logout();
      this.scene.start("LoginScene");
    });
  }

  createStatCard(x, y, label, value, icon) {
    this.add.rectangle(x, y, 185, 112, 0xffffff, 0.92).setStrokeStyle(4, 0x5a2da0);
    this.add.text(x, y - 30, icon, {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: icon.length > 3 ? "18px" : "24px",
      color: "#4d2c83",
      fontStyle: "bold",
      align: "center"
    }).setOrigin(0.5);
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

  makeButton(x, y, text, color, onClick, textColor = "#ffffff") {
    const button = this.add.text(x, y, text, {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "22px",
      color: textColor,
      backgroundColor: `#${color.toString(16).padStart(6, "0")}`,
      padding: { x: 20, y: 12 }
    }).setOrigin(0.5).setInteractive({ useHandCursor: true });
    button.on("pointerover", () => button.setScale(1.05));
    button.on("pointerout", () => button.setScale(1));
    button.on("pointerdown", onClick);
  }
}
