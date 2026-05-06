import { AuthSystem } from "../systems/AuthSystem.js?v=45";
import { PlayerData } from "../systems/PlayerData.js?v=45";
import { UnlockSystem, DEV_UNLOCK_ALL_GAMES } from "../systems/UnlockSystem.js?v=45";
import { QuestSystem } from "../systems/QuestSystem.js?v=45";
import { RewardSystem } from "../systems/RewardSystem.js?v=45";

const WORLD_WIDTH = 3200;
const WORLD_HEIGHT = 2100;
const HERO_COLORS = {
  knight: { body: 0x4f63d8, cape: 0xffd166, trim: 0xffffff },
  mage: { body: 0x7b4dff, cape: 0x2ec4b6, trim: 0xfff2a8 },
  ranger: { body: 0x2d6a4f, cape: 0x95d5b2, trim: 0xfff2a8 },
  bard: { body: 0xd65d8c, cape: 0xffb4a2, trim: 0xffffff }
};

const HERO_FRAMES = {
  knight: 0,
  mage: 3,
  ranger: 8,
  bard: 32
};

const PET_SPRITES = {
  "baby-dragon": "pet-baby-dragon",
  "lantern-fox": "pet-lantern-fox",
  "crystal-turtle": "pet-crystal-turtle",
  "cloud-owl": "pet-cloud-owl",
  "firefly-bunny": "pet-firefly-bunny"
};

const REGIONS = [
  { name: "Castle Commons", color: 0xd9f2b4, stroke: 0x81b29a, x: 700, y: 520, w: 900, h: 620 },
  { name: "Lantern Woods", color: 0x7fcf9f, stroke: 0x2d6a4f, x: 1660, y: 540, w: 900, h: 650 },
  { name: "Crystal Highlands", color: 0xc8b6ff, stroke: 0x5a2da0, x: 2550, y: 620, w: 760, h: 700 },
  { name: "Harbor Coast", color: 0x91e5f6, stroke: 0x247ba0, x: 900, y: 1450, w: 980, h: 620 },
  { name: "Moon Meadow", color: 0xfde2ff, stroke: 0xa06cd5, x: 2050, y: 1500, w: 980, h: 650 }
];

export class KingdomMapScene extends Phaser.Scene {
  constructor() {
    super("KingdomMapScene");
  }

  create() {
    this.games = window.KIND_KINGDOM_GAMES || [];
    this.locations = [];
    this.progress = PlayerData.loadProgress();
    this.playerData = PlayerData.loadPlayer();
    this.rewards = RewardSystem.load();

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setZoom(0.88);

    this.drawWorld();
    this.applyMapEffect();
    this.createLocations();
    this.createNPCs();
    this.createPlayer();
    this.createPetCompanion();
    this.createHUD();
    this.createMinimap();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("W,A,S,D,E,SPACE,C,M,L");
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
  }

  drawWorld() {
    if (this.textures.exists("kingdom-world-map")) {
      this.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, "kingdom-world-map").setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT);
    } else {
      this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0x7cc7ff);
      REGIONS.forEach((region) => this.drawFallbackRegion(region));
    }
    this.createAtmosphere();
  }

  drawFallbackRegion(region) {
    const g = this.add.graphics();
    g.fillStyle(region.color, 1);
    g.lineStyle(10, region.stroke, 0.32);
    g.fillRoundedRect(region.x - region.w / 2, region.y - region.h / 2, region.w, region.h, 95);
    g.strokeRoundedRect(region.x - region.w / 2, region.y - region.h / 2, region.w, region.h, 95);
  }

  createAtmosphere() {
    for (let i = 0; i < 18; i += 1) {
      const cloud = this.add.ellipse(260 + i * 170, 145 + (i % 4) * 90, 180 + (i % 3) * 40, 54, 0xffffff, 0.12);
      cloud.setDepth(2);
      this.tweens.add({
        targets: cloud,
        x: cloud.x + 50,
        duration: 8000 + i * 400,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    }
  }

  createLocations() {
    const regionSlots = this.makeRegionSlots();
    this.games.forEach((game, index) => {
      const slot = regionSlots[index % regionSlots.length];
      const loop = Math.floor(index / regionSlots.length);
      const x = slot.x + (loop % 2 ? 56 : 0);
      const y = slot.y + loop * 42;
      this.createPortal(game, index, x, y, slot.region);
    });
  }

  makeRegionSlots() {
    const slots = [];
    REGIONS.forEach((region, regionIndex) => {
      const cols = regionIndex === 2 ? 3 : 4;
      const rows = 3;
      for (let row = 0; row < rows; row += 1) {
        for (let col = 0; col < cols; col += 1) {
          slots.push({
            region,
            x: region.x - region.w / 2 + 150 + col * ((region.w - 260) / Math.max(1, cols - 1)),
            y: region.y - region.h / 2 + 160 + row * ((region.h - 270) / Math.max(1, rows - 1))
          });
        }
      }
    });
    return slots;
  }

  createPortal(game, index, x, y, region) {
    const required = UnlockSystem.requiredPoints(index);
    const unlocked = UnlockSystem.isUnlocked(required);
    const complete = UnlockSystem.isCompleted(game.slug);
    const portal = this.add.container(x, y).setDepth(20);
    const shadow = this.add.ellipse(0, 58, 144, 40, 0x000000, 0.24);
    const glow = this.add.circle(0, 8, 78, complete ? 0xffd166 : region.stroke, complete ? 0.26 : 0.1);
    const foundation = this.add.ellipse(0, 48, 118, 44, 0xe7d2a0, unlocked ? 0.95 : 0.38)
      .setStrokeStyle(4, 0x7a5a35, unlocked ? 0.42 : 0.22);
    const tower = this.add.rectangle(0, -10, 122, 116, complete ? 0xfff2a8 : 0xfffbef, unlocked ? 0.98 : 0.42)
      .setStrokeStyle(5, complete ? 0x2ec4b6 : region.stroke, unlocked ? 0.95 : 0.4);
    const roof = this.add.triangle(0, -88, -76, -25, 76, -25, 0, -88, complete ? 0xffb703 : region.stroke, unlocked ? 0.98 : 0.45);
    const roofTrim = this.add.rectangle(0, -26, 136, 14, 0x4d2c83, unlocked ? 0.55 : 0.2);
    let image = null;
    if (this.textures.exists(`game-${game.slug}`)) {
      image = this.add.image(0, -13, `game-${game.slug}`).setDisplaySize(96, 64).setAlpha(unlocked ? 0.92 : 0.36);
    }
    const windowFrame = this.add.rectangle(0, -13, 104, 72, 0xffffff, 0).setStrokeStyle(4, 0xffffff, unlocked ? 0.85 : 0.25);
    const seal = this.add.circle(0, 35, 17, complete ? 0x14746f : region.stroke, unlocked ? 0.95 : 0.36)
      .setStrokeStyle(3, 0xffffff, unlocked ? 0.85 : 0.2);
    const sealText = this.add.text(0, 35, portalCode(game), {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "11px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5);
    const done = complete ? this.add.text(48, -52, "DONE", {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "10px",
      color: "#ffffff",
      backgroundColor: "#14746f",
      padding: { x: 5, y: 3 }
    }).setOrigin(0.5) : null;
    const label = this.add.text(0, 80, game.title, {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "14px",
      color: "#ffffff",
      backgroundColor: complete ? "#14746f" : "#2d174dcc",
      padding: { x: 8, y: 5 },
      align: "center",
      wordWrap: { width: 150 }
    }).setOrigin(0.5, 0);
    portal.add([shadow, glow, foundation, tower, roof, roofTrim, ...(image ? [image] : []), windowFrame, seal, sealText, ...(done ? [done] : []), label]);
    if (complete) {
      this.tweens.add({
        targets: glow,
        alpha: 0.46,
        scale: 1.08,
        duration: 1100,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    }
    portal.setSize(150, 170);
    portal.setInteractive(new Phaser.Geom.Rectangle(-75, -85, 150, 170), Phaser.Geom.Rectangle.Contains);
    portal.on("pointerdown", () => this.openLauncher(game, index, unlocked, required));
    portal.on("pointerover", () => {
      portal.setScale(1.08);
      this.hoverText.setText(game.title);
    });
    portal.on("pointerout", () => {
      portal.setScale(1);
      this.hoverText.setText("");
    });
    portal.game = game;
    portal.index = index;
    portal.required = required;
    portal.locked = !unlocked;
    this.locations.push(portal);
  }

  createNPCs() {
    const npcs = [
      { x: 600, y: 305, code: "CG", name: "Crystal Guide" },
      { x: 1515, y: 310, code: "GK", name: "Gate Keeper" },
      { x: 2395, y: 325, code: "RP", name: "Roundtable Page" }
    ];
    npcs.forEach((npc) => {
      const body = this.add.circle(npc.x, npc.y, 42, 0xffffff, 0.94).setStrokeStyle(5, 0x7b4dff).setDepth(30);
      const icon = this.add.text(npc.x, npc.y - 4, npc.code, {
        fontFamily: "Nunito, Arial, sans-serif",
        fontSize: "22px",
        color: "#4d2c83",
        fontStyle: "bold"
      }).setOrigin(0.5).setDepth(31);
      const label = this.add.text(npc.x, npc.y + 50, npc.name, {
        fontFamily: "Nunito, Arial, sans-serif",
        fontSize: "15px",
        color: "#2d174d",
        backgroundColor: "#ffffffdd",
        padding: { x: 8, y: 5 }
      }).setOrigin(0.5).setDepth(31);
      this.tweens.add({ targets: [body, icon], y: "-=7", duration: 1300, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    });
  }

  createPlayer() {
    const character = PlayerData.getCharacter() || "knight";
    this.player = this.physics.add.sprite(this.playerData.x || 530, this.playerData.y || 760, "hero-hitbox");
    this.player.setDisplaySize(40, 40);
    this.player.setCollideWorldBounds(true);
    this.player.body.setSize(34, 34);
    this.playerAura = this.add.circle(this.player.x, this.player.y + 18, 32, 0xffd166, 0.24).setDepth(899);
    this.playerAvatar = this.createHeroAvatar(character);
  }

  createHeroAvatar(character) {
    const colors = HERO_COLORS[character] || HERO_COLORS.knight;
    const capeItem = RewardSystem.equippedItem("capes");
    const crown = RewardSystem.equippedItem("crowns");
    const avatar = this.add.container(this.player.x, this.player.y - 14).setDepth(900);
    this.heroFrame = HERO_FRAMES[character] ?? HERO_FRAMES.knight;
    this.heroAnimationKey = `hero-${character}-walk`;

    const shadow = this.add.ellipse(0, 30, 50, 16, 0x000000, 0.24);
    const cape = this.add.triangle(0, 8, -24, 42, 24, 42, 0, -9, capeItem?.color || colors.cape, 0.85);
    const sprite = this.add.sprite(0, 0, "kk-heroes", this.heroFrame).setScale(4.2);
    const crownShape = crown ? this.add.triangle(0, -38, -14, -24, 14, -24, 0, -44, crown.color || 0xffd166, 1)
      .setStrokeStyle(2, 0xffffff, 0.9) : null;
    avatar.add([shadow, cape, sprite, ...(crownShape ? [crownShape] : [])]);
    this.heroSprite = sprite;
    return avatar;
  }

  createPetCompanion() {
    const pet = RewardSystem.equippedItem("pets");
    if (!pet) return;
    const texture = PET_SPRITES[pet.id] || "pet-lantern-fox";
    this.petCompanion = this.add.container(this.player.x - 58, this.player.y + 22).setDepth(880);
    const glow = this.add.circle(0, 4, 22, pet.color, 0.2);
    const sprite = this.add.image(0, 0, texture).setScale(3.15);
    const sparkle = this.add.circle(18, -18, 4, 0xfff2a8, 0.75);
    this.petCompanion.add([glow, sprite, sparkle]);
    this.petSprite = sprite;
    this.tweens.add({ targets: this.petCompanion, y: "+=8", duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    this.tweens.add({ targets: sparkle, alpha: 0.2, scale: 1.6, duration: 650, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  applyMapEffect() {
    const effect = RewardSystem.equippedItem("effects");
    if (!effect) return;
    if (effect.id === "lantern-night-sky") {
      this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0x1a1445, 0.18).setDepth(1);
      for (let i = 0; i < 42; i += 1) {
        const light = this.add.circle(180 + (i * 227) % 2850, 260 + (i * 151) % 1500, 8, 0xffd166, 0.55).setDepth(2);
        this.tweens.add({ targets: light, alpha: 0.95, scale: 1.45, duration: 1200 + i * 30, yoyo: true, repeat: -1 });
      }
    }
  }

  createHUD() {
    this.hud = this.add.container(0, 0).setScrollFactor(0).setDepth(1000);
    const panel = this.add.rectangle(480, 38, 928, 62, 0x2d174d, 0.86).setStrokeStyle(3, 0xffffff);
    this.pointsText = this.add.text(36, 17, "", {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "17px",
      color: "#ffffff",
      fontStyle: "bold"
    });
    this.infoText = this.add.text(480, 16, "", {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "18px",
      color: "#fff3b0",
      fontStyle: "bold",
      align: "center"
    }).setOrigin(0.5, 0);
    this.questText = this.add.text(918, 13, "", {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "13px",
      color: "#ffffff",
      align: "right",
      wordWrap: { width: 260 }
    }).setOrigin(1, 0);
    this.hoverText = this.add.text(480, 690, "", {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "18px",
      color: "#2d174d",
      backgroundColor: "#ffffffdd",
      padding: { x: 12, y: 7 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);
    this.hud.add([panel, this.pointsText, this.infoText, this.questText]);
    this.createHudButton(82, 720, "Dashboard", () => this.scene.start("DashboardScene"));
    this.createHudButton(238, 720, "Shop", () => this.scene.start("ShopScene"));
    this.createHudButton(370, 720, "Closet", () => this.scene.start("ClosetScene"));
    this.createHudButton(520, 720, "Room", () => this.scene.start("PlayerRoomScene"));
    this.createHudButton(850, 720, "Card View", () => { window.location.href = "card-view.html"; });
    this.refreshHUD();
  }

  createMinimap() {
    const x = 806;
    const y = 92;
    const w = 132;
    const h = 88;
    this.minimap = { x, y, w, h };
    this.minimapGraphics = this.add.graphics().setScrollFactor(0).setDepth(1002);
    this.minimapFrame = this.add.rectangle(x + w / 2, y + h / 2, w + 12, h + 12, 0x2d174d, 0.76)
      .setStrokeStyle(3, 0xffffff, 0.9)
      .setScrollFactor(0)
      .setDepth(1001);
    this.minimapLabel = this.add.text(x + w / 2, y - 4, "WORLD", {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "11px",
      color: "#ffffff",
      fontStyle: "bold"
    }).setOrigin(0.5, 1).setScrollFactor(0).setDepth(1003);
  }

  createHudButton(x, y, text, onClick) {
    const button = this.add.text(x, y, text, {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "16px",
      color: "#ffffff",
      backgroundColor: "#5a2da0",
      padding: { x: 12, y: 7 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1001).setInteractive({ useHandCursor: true });
    button.on("pointerdown", onClick);
  }

  refreshHUD() {
    this.progress = PlayerData.loadProgress();
    const activeQuest = QuestSystem.getActiveQuest(this.progress);
    this.pointsText.setText(`Points: ${this.progress.points}${DEV_UNLOCK_ALL_GAMES ? " • Dev unlocked" : ""}`);
    this.questText.setText(`${activeQuest.npc}: ${activeQuest.prompt}`);
  }

  update() {
    const speed = 230;
    this.player.setVelocity(0);

    if (this.cursors.left.isDown || this.keys.A.isDown) this.player.setVelocityX(-speed);
    if (this.cursors.right.isDown || this.keys.D.isDown) this.player.setVelocityX(speed);
    if (this.cursors.up.isDown || this.keys.W.isDown) this.player.setVelocityY(-speed);
    if (this.cursors.down.isDown || this.keys.S.isDown) this.player.setVelocityY(speed);
    this.player.body.velocity.normalize().scale(speed);

    this.playerAura.setPosition(this.player.x, this.player.y + 12);
    this.playerAvatar.setPosition(this.player.x, this.player.y - 14);
    this.playerAvatar.setScale(this.player.body.velocity.x < 0 ? -1 : 1, 1);
    this.updateHeroAnimation();
    this.updateTrail();
    this.updatePet();
    PlayerData.savePosition(this.player.x, this.player.y);

    const nearby = this.getNearbyLocation();
    if (nearby) {
      this.infoText.setText(nearby.locked
        ? `${nearby.game.title} needs ${nearby.required} points.`
        : `Press E to enter ${nearby.game.title}`);
      if (Phaser.Input.Keyboard.JustDown(this.enterKey) || Phaser.Input.Keyboard.JustDown(this.keys.SPACE)) {
        this.openLauncher(nearby.game, nearby.index, !nearby.locked, nearby.required);
      }
    } else {
      this.infoText.setText("Explore portals. E enters. C changes hero. M dashboard. L logout.");
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.C)) this.scene.start("CharacterSelectScene", { returnToDashboard: false });
    if (Phaser.Input.Keyboard.JustDown(this.keys.M)) this.scene.start("DashboardScene");
    if (Phaser.Input.Keyboard.JustDown(this.keys.L)) {
      AuthSystem.logout();
      this.scene.start("LoginScene");
    }
    this.updateMinimap();
  }

  updateTrail() {
    const trail = RewardSystem.equippedItem("trails");
    if (!trail || this.player.body.velocity.length() < 20) return;
    if (this.time.now - (this.lastTrailAt || 0) < 90) return;
    this.lastTrailAt = this.time.now;
    const spark = this.add.circle(this.player.x, this.player.y + 22, 6, trail.color, 0.65).setDepth(870);
    this.tweens.add({
      targets: spark,
      alpha: 0,
      scale: 2.2,
      y: spark.y + 12,
      duration: 520,
      onComplete: () => spark.destroy()
    });
  }

  updatePet() {
    if (!this.petCompanion) return;
    const targetX = this.player.x - 58 * Math.sign(this.player.body.velocity.x || 1);
    const targetY = this.player.y + 28;
    this.petCompanion.x += (targetX - this.petCompanion.x) * 0.055;
    this.petCompanion.y += (targetY - this.petCompanion.y) * 0.055;
    if (this.petSprite) this.petSprite.rotation = Math.sin(this.time.now / 180) * 0.07;
    if (this.petSprite && this.player.body.velocity.x !== 0) this.petSprite.setFlipX(this.player.body.velocity.x > 0);
  }

  updateHeroAnimation() {
    if (!this.heroSprite) return;
    if (this.player.body.velocity.length() > 20) {
      if (!this.heroSprite.anims.isPlaying) this.heroSprite.play(this.heroAnimationKey);
      return;
    }
    this.heroSprite.stop();
    this.heroSprite.setFrame(this.heroFrame);
  }

  updateMinimap() {
    if (!this.minimapGraphics) return;
    const { x, y, w, h } = this.minimap;
    const g = this.minimapGraphics;
    g.clear();
    g.fillStyle(0x87d6ff, 0.9);
    g.fillRoundedRect(x, y, w, h, 10);
    g.fillStyle(0xa8df86, 0.92);
    REGIONS.forEach((region) => {
      g.fillRoundedRect(
        x + (region.x - region.w / 2) / WORLD_WIDTH * w,
        y + (region.y - region.h / 2) / WORLD_HEIGHT * h,
        region.w / WORLD_WIDTH * w,
        region.h / WORLD_HEIGHT * h,
        5
      );
    });
    g.fillStyle(0xffd166, 1);
    this.locations.forEach((loc, index) => {
      if (index % 3 !== 0) return;
      g.fillCircle(x + loc.x / WORLD_WIDTH * w, y + loc.y / WORLD_HEIGHT * h, 1.8);
    });
    g.fillStyle(0xff4d6d, 1);
    g.fillCircle(x + this.player.x / WORLD_WIDTH * w, y + this.player.y / WORLD_HEIGHT * h, 4);
    g.lineStyle(2, 0xffffff, 0.85);
    const view = this.cameras.main.worldView;
    g.strokeRect(x + view.x / WORLD_WIDTH * w, y + view.y / WORLD_HEIGHT * h, view.width / WORLD_WIDTH * w, view.height / WORLD_HEIGHT * h);
  }

  getNearbyLocation() {
    return this.locations.find((loc) => Phaser.Math.Distance.Between(this.player.x, this.player.y, loc.x, loc.y) < 120);
  }

  openLauncher(game, index, unlocked, required) {
    this.scene.launch("MiniGameLauncherScene", { game, index, unlocked, required });
    this.scene.pause();
  }
}

function portalCode(game) {
  const words = String(game.category || game.title || "KK")
    .split(/[^a-z0-9]+/i)
    .filter(Boolean);
  return (words[0]?.slice(0, 2) || "KK").toUpperCase();
}
