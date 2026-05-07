import { AuthSystem } from "../systems/AuthSystem.js?v=72";
import { PlayerData } from "../systems/PlayerData.js?v=72";
import { UnlockSystem, DEV_UNLOCK_ALL_GAMES } from "../systems/UnlockSystem.js?v=72";
import { QuestSystem } from "../systems/QuestSystem.js?v=72";
import { RewardSystem } from "../systems/RewardSystem.js?v=72";
import { EmotionSystem } from "../systems/EmotionSystem.js?v=72";
import { NPCMemorySystem } from "../systems/NPCMemorySystem.js?v=72";
import { FRONT_FRAME, getHero } from "../systems/AssetCatalog.js?v=72";

const WORLD_WIDTH = 3200;
const WORLD_HEIGHT = 2100;
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
    this.mood = EmotionSystem.getKingdomMood(this.progress);

    this.physics.world.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setBounds(0, 0, WORLD_WIDTH, WORLD_HEIGHT);
    this.cameras.main.setZoom(0.88);

    this.drawWorld();
    this.applyEmotionAdaptiveWorld();
    this.applyMapEffect();
    this.createLocations();
    this.createNPCs();
    this.createPlayer();
    this.createPetCompanion();
    this.createHUD();
    this.createMinimap();

    this.cursors = this.input.keyboard.createCursorKeys();
    this.keys = this.input.keyboard.addKeys("W,A,S,D,E,SPACE,C,M,L,I");
    this.enterKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
  }

  drawWorld() {
    if (this.textures.exists("kingdom-world-map")) {
      this.add.image(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, "kingdom-world-map").setDisplaySize(WORLD_WIDTH, WORLD_HEIGHT);
      this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0x102a43, 0.06);
    } else {
      this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0x7cc7ff);
      REGIONS.forEach((region) => this.drawFallbackRegion(region));
    }
    this.createAtmosphere();
    this.createRegionLabels();
  }

  drawFallbackRegion(region) {
    const g = this.add.graphics();
    g.fillStyle(region.color, 1);
    g.lineStyle(10, region.stroke, 0.32);
    g.fillRoundedRect(region.x - region.w / 2, region.y - region.h / 2, region.w, region.h, 95);
    g.strokeRoundedRect(region.x - region.w / 2, region.y - region.h / 2, region.w, region.h, 95);
  }

  createAtmosphere() {
    for (let i = 0; i < 10; i += 1) {
      const cloud = this.add.ellipse(260 + i * 170, 145 + (i % 4) * 90, 180 + (i % 3) * 40, 54, 0xffffff, 0.12);
      cloud.setDepth(2);
      this.tweens.add({
        targets: cloud,
        x: cloud.x + 50,
        duration: (8000 + i * 400) * (this.mood?.cloudDuration || 1),
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    }
  }

  createRegionLabels() {
    REGIONS.forEach((region) => {
      const label = this.add.text(region.x, region.y - region.h / 2 + 42, region.name.toUpperCase(), {
        fontFamily: "Nunito, Arial, sans-serif",
        fontSize: "18px",
        color: "#ffffff",
        fontStyle: "bold",
        backgroundColor: "#2d174dcc",
        padding: { x: 14, y: 7 },
        letterSpacing: 1,
        stroke: "#1d1236",
        strokeThickness: 3
      }).setOrigin(0.5).setDepth(12);
      const underline = this.add.rectangle(region.x, label.y + 22, 130, 4, region.stroke, 0.8).setDepth(11);
      this.tweens.add({
        targets: underline,
        scaleX: 1.18,
        alpha: 0.45,
        duration: 1500,
        yoyo: true,
        repeat: -1,
        ease: "Sine.easeInOut"
      });
    });
  }

  createLocations() {
    const regionSlots = this.makeRegionSlots();
    this.games.forEach((game, index) => {
      const slot = regionSlots[index % regionSlots.length];
      const loop = Math.floor(index / regionSlots.length);
      const x = slot.x + (loop % 2 ? 38 : -18);
      const y = slot.y + loop * 46;
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
            x: region.x - region.w / 2 + 185 + col * ((region.w - 350) / Math.max(1, cols - 1)),
            y: region.y - region.h / 2 + 190 + row * ((region.h - 350) / Math.max(1, rows - 1))
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
    const shadow = this.add.ellipse(0, 50, 130, 34, 0x000000, 0.2);
    const glow = this.add.circle(0, -2, 68, complete ? 0xffd166 : region.stroke, complete ? 0.24 : 0.08);
    const foundation = this.add.ellipse(0, 44, 110, 36, 0xe7d2a0, unlocked ? 0.92 : 0.34)
      .setStrokeStyle(3, 0x7a5a35, unlocked ? 0.36 : 0.18);
    const tower = this.add.rectangle(0, -8, 108, 104, complete ? 0xfff2a8 : 0xfffbef, unlocked ? 0.96 : 0.38)
      .setStrokeStyle(4, complete ? 0x2ec4b6 : region.stroke, unlocked ? 0.82 : 0.32);
    const roof = this.add.rectangle(0, -68, 114, 22, complete ? 0xffb703 : region.stroke, unlocked ? 0.94 : 0.4)
      .setStrokeStyle(3, 0xffffff, unlocked ? 0.55 : 0.16);
    const roofTrim = this.add.rectangle(0, -50, 122, 10, 0x4d2c83, unlocked ? 0.48 : 0.16);
    let image = null;
    if (this.textures.exists(`game-${game.slug}`)) {
      image = this.add.image(0, -12, `game-${game.slug}`).setDisplaySize(88, 58).setAlpha(unlocked ? 0.92 : 0.34);
    }
    const windowFrame = this.add.rectangle(0, -12, 96, 66, 0xffffff, 0).setStrokeStyle(3, 0xffffff, unlocked ? 0.78 : 0.2);
    const seal = this.add.circle(0, 32, 15, complete ? 0x14746f : region.stroke, unlocked ? 0.92 : 0.32)
      .setStrokeStyle(2, 0xffffff, unlocked ? 0.75 : 0.18);
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
    const label = this.add.text(0, 70, game.title, {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "13px",
      color: "#ffffff",
      backgroundColor: complete ? "#14746f" : "#2d174dcc",
      padding: { x: 8, y: 5 },
      align: "center",
      wordWrap: { width: 138 },
      stroke: "#1d1236",
      strokeThickness: 3
    }).setOrigin(0.5, 0);
    const lock = unlocked ? null : this.add.text(40, -54, "LOCKED", {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "9px",
      color: "#ffffff",
      backgroundColor: "#3f315f",
      padding: { x: 5, y: 3 }
    }).setOrigin(0.5);
    portal.add([shadow, glow, foundation, tower, roof, roofTrim, ...(image ? [image] : []), windowFrame, seal, sealText, ...(done ? [done] : []), ...(lock ? [lock] : []), label]);
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
      { x: 365, y: 235, character: "mage", name: "Crystal Guide", questId: "restore-crystal" },
      { x: 1340, y: 230, character: "knight", name: "Gate Keeper", questId: "calm-the-gates" },
      { x: 2790, y: 250, character: "bard", name: "Roundtable Page", questId: "council-harmony" },
      { x: 1820, y: 1000, character: "ranger", name: "Lantern Keeper", questId: "council-harmony" },
      { x: 2390, y: 1350, character: "mage", name: "Garden Sage", questId: "restore-crystal" },
      { x: 760, y: 1245, character: "ranger", name: "Harbor Helper", questId: "calm-the-gates" }
    ];
    npcs.forEach((npc) => {
      const glow = this.add.ellipse(npc.x, npc.y + 28, 84, 28, 0xffffff, 0.26).setDepth(29);
      const avatar = this.createMapHero(npc.character, npc.x, npc.y, 31, 1.02);
      const label = this.add.text(npc.x, npc.y + 76, npc.name, {
        fontFamily: "Nunito, Arial, sans-serif",
        fontSize: "15px",
        color: "#2d174d",
        backgroundColor: "#ffffffdd",
        padding: { x: 8, y: 5 },
        stroke: "#ffffff",
        strokeThickness: 2
      }).setOrigin(0.5).setDepth(31);
      const memoryBadge = this.add.text(npc.x, npc.y + 103, NPCMemorySystem.statusFor(npc.name), {
        fontFamily: "Nunito, Arial, sans-serif",
        fontSize: "12px",
        color: "#ffffff",
        backgroundColor: "#2d174dcc",
        padding: { x: 7, y: 4 },
        align: "center",
        wordWrap: { width: 135 }
      }).setOrigin(0.5).setDepth(31);
      const zone = this.add.zone(npc.x, npc.y + 22, 150, 170)
        .setDepth(35)
        .setInteractive({ useHandCursor: true });
      zone.on("pointerover", () => {
        const quest = QuestSystem.all().find((item) => item.id === npc.questId);
        const memoryLine = NPCMemorySystem.memoryFor(npc.name, this.progress, this.mood);
        avatar.setScale(1.08);
        glow.setAlpha(0.5);
        label.setBackgroundColor("#fff2a8");
        memoryBadge.setText(NPCMemorySystem.statusFor(npc.name));
        this.hoverText.setText(`${npc.name}: ${memoryLine}`);
        this.activeNpcQuestText = quest ? `${memoryLine} ${quest.prompt}` : memoryLine;
        this.infoText.setText(this.activeNpcQuestText);
      });
      zone.on("pointerout", () => {
        avatar.setScale(1);
        glow.setAlpha(0.26);
        label.setBackgroundColor("#ffffffdd");
        this.hoverText.setText("");
        this.activeNpcQuestText = "";
      });
      zone.on("pointerdown", () => {
        NPCMemorySystem.recordVisit(npc.name);
        memoryBadge.setText(NPCMemorySystem.statusFor(npc.name));
        this.openNpcQuest(npc.questId, npc.name);
      });
      this.tweens.add({ targets: [avatar, glow], y: "-=7", duration: 1300, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    });
  }

  openNpcQuest(questId, npcName) {
    const quest = QuestSystem.all().find((item) => item.id === questId);
    const memoryLine = NPCMemorySystem.memoryFor(npcName, this.progress, this.mood);
    if (!quest) {
      this.infoText.setText(`${npcName}: ${memoryLine}`);
      return;
    }
    const gameIndex = this.games.findIndex((game) => quest.targetCategories.includes(game.category));
    if (gameIndex < 0) {
      this.infoText.setText(`${npcName}: ${memoryLine} ${quest.prompt}`);
      return;
    }
    const game = this.games[gameIndex];
    const required = UnlockSystem.requiredPoints(gameIndex);
    const unlocked = UnlockSystem.isUnlocked(required);
    if (!unlocked) {
      this.infoText.setText(`${npcName}: ${memoryLine} ${game.title} needs ${required} points.`);
      return;
    }
    this.openLauncher(game, gameIndex, true, required);
  }

  createMapHero(character, x, y, depth = 30, scale = 1) {
    const hero = getHero(character);
    const avatar = this.add.container(x, y).setDepth(depth);
    const shadow = this.add.ellipse(0, 42, 52, 14, 0x000000, 0.2);
    avatar.add(shadow);
    hero.layers.forEach((layer) => {
      avatar.add(this.add.sprite(0, 0, `lpc-${layer}`, FRONT_FRAME).setScale(scale));
    });
    return avatar;
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
    const hero = getHero(character);
    const cape = RewardSystem.equippedItem("capes");
    const outfit = RewardSystem.equippedItem("outfits");
    const crown = RewardSystem.equippedItem("crowns");
    const avatar = this.add.container(this.player.x, this.player.y - 14).setDepth(900);

    const shadow = this.add.ellipse(0, 30, 50, 16, 0x000000, 0.24);
    avatar.add(shadow);
    this.heroLayerSprites = [];
    const equippedLayers = [
      cape?.id === "gratitude-cape" ? "cape-purple" : null,
      outfit?.id === "empathy-wings" ? "wings-teal" : null,
      ...hero.layers,
      outfit?.id === "royal-helper-coat" ? "torso-plate" : null
    ].filter(Boolean);

    equippedLayers.forEach((layer) => {
      const sprite = this.add.sprite(0, -2, `lpc-${layer}`, FRONT_FRAME).setScale(1.35);
      avatar.add(sprite);
      this.heroLayerSprites.push({ layer, sprite });
    });
    if (crown) {
      const crownLayer = crown.id === "courage-crown" ? "crown-purple" : "crown-gold";
      const crownSprite = this.add.sprite(0, -2, `lpc-${crownLayer}`, FRONT_FRAME).setScale(1.35);
      avatar.add(crownSprite);
      this.heroLayerSprites.push({ layer: crownLayer, sprite: crownSprite });
    }
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

  applyEmotionAdaptiveWorld() {
    const mood = this.mood || EmotionSystem.getKingdomMood(this.progress);
    this.speedMultiplier = mood.speedMultiplier;
    if (mood.warmth > 0.55) {
      const sunlight = this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0xfff2a8, (mood.warmth - 0.45) * 0.16)
        .setDepth(3);
      const rays = this.add.graphics().setDepth(4);
      rays.fillStyle(0xffd166, (mood.warmth - 0.45) * 0.08);
      for (let i = 0; i < 7; i += 1) {
        rays.fillTriangle(200 + i * 420, 0, 360 + i * 420, 0, 240 + i * 420, WORLD_HEIGHT);
      }
      this.tweens.add({ targets: sunlight, alpha: sunlight.alpha * 1.35, duration: 1800, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    }
    if (mood.peace > 0.55) {
      for (let i = 0; i < 18; i += 1) {
        const mote = this.add.circle(160 + (i * 313) % 2900, 220 + (i * 197) % 1600, 5, 0x7bdff2, 0.22 + mood.peace * 0.18).setDepth(5);
        this.tweens.add({
          targets: mote,
          y: mote.y - 26,
          alpha: 0.08,
          duration: 2600 + i * 80,
          yoyo: true,
          repeat: -1,
          ease: "Sine.easeInOut"
        });
      }
      this.prepareCalmAudio(mood);
    }
    if (mood.shadow > 0.08) {
      const storm = this.add.rectangle(WORLD_WIDTH / 2, WORLD_HEIGHT / 2, WORLD_WIDTH, WORLD_HEIGHT, 0x17122f, mood.shadow)
        .setDepth(6);
      this.tweens.add({ targets: storm, alpha: mood.shadow * 0.78, duration: 2100, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      for (let i = 0; i < Math.ceil(mood.shadow * 22); i += 1) {
        const fog = this.add.ellipse(260 + i * 260, 420 + (i % 5) * 280, 260, 58, 0x2d174d, 0.08 + mood.shadow * 0.08).setDepth(7);
        this.tweens.add({ targets: fog, x: fog.x + 42, duration: 5200 + i * 160, yoyo: true, repeat: -1 });
      }
    }
  }

  prepareCalmAudio(mood) {
    this.input.once("pointerdown", () => {
      if (this.calmAudioStarted || (!window.AudioContext && !window.webkitAudioContext)) return;
      const AudioContextClass = window.AudioContext || window.webkitAudioContext;
      const ctx = new AudioContextClass();
      const gain = ctx.createGain();
      gain.gain.value = 0.018 + mood.peace * 0.018;
      gain.connect(ctx.destination);
      [196, 246.94, 329.63].forEach((frequency, index) => {
        const osc = ctx.createOscillator();
        const noteGain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = frequency;
        noteGain.gain.value = 0.12 / (index + 1);
        osc.connect(noteGain);
        noteGain.connect(gain);
        osc.start();
        this.tweens.addCounter({
          from: 0,
          to: Math.PI * 2,
          duration: 3200 + index * 900,
          repeat: -1,
          onUpdate: (tween) => {
            noteGain.gain.value = (0.05 + Math.sin(tween.getValue()) * 0.02) / (index + 1);
          }
        });
      });
      this.calmAudioStarted = true;
      this.events.once("shutdown", () => ctx.close());
    });
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
    const panel = this.add.rectangle(480, 42, 928, 74, 0x2d174d, 0.9).setStrokeStyle(3, 0xffffff);
    this.pointsText = this.add.text(36, 17, "", {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "17px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#1d1236",
      strokeThickness: 3
    });
    this.infoText = this.add.text(480, 12, "", {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "18px",
      color: "#fff3b0",
      fontStyle: "bold",
      align: "center",
      wordWrap: { width: 420 },
      stroke: "#1d1236",
      strokeThickness: 4
    }).setOrigin(0.5, 0);
    this.questText = this.add.text(918, 13, "", {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "13px",
      color: "#ffffff",
      align: "right",
      wordWrap: { width: 250 },
      stroke: "#1d1236",
      strokeThickness: 3
    }).setOrigin(1, 0);
    this.hoverText = this.add.text(480, 690, "", {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "18px",
      color: "#2d174d",
      backgroundColor: "#ffffffdd",
      padding: { x: 12, y: 7 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1001);
    const controls = this.add.text(480, 45, "E Enter  •  I Story Forge  •  C Character  •  M Dashboard  •  L Logout", {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "14px",
      color: "#ffffff",
      fontStyle: "bold",
      stroke: "#1d1236",
      strokeThickness: 3
    }).setOrigin(0.5, 0);
    this.hud.add([panel, this.pointsText, this.infoText, controls, this.questText]);
    this.createHudButton(80, 720, "Dashboard (M)", () => this.scene.start("DashboardScene"), 0xffd166, "#3a2900");
    this.createHudButton(245, 720, "Shop", () => this.scene.start("ShopScene"), 0x2ec4b6, "#053f3b");
    this.createHudButton(370, 720, "Closet", () => this.scene.start("ClosetScene"), 0x7b4dff, "#ffffff");
    this.createHudButton(505, 720, "Room", () => this.scene.start("PlayerRoomScene"), 0xd76d77, "#ffffff");
    this.createHudButton(650, 720, "Story Forge", () => this.scene.start("StoryForgeScene"), 0xff8fab, "#ffffff");
    this.createHudButton(850, 720, "Card View", () => { window.location.href = "card-view.html"; }, 0xffb703, "#3a2900");
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

  createHudButton(x, y, text, onClick, color = 0x5a2da0, textColor = "#ffffff") {
    const width = Math.max(110, text.length * 8 + 28);
    const bg = this.add.rectangle(x, y, width, 38, color, 0.96)
      .setStrokeStyle(3, 0xffffff, 0.88)
      .setScrollFactor(0)
      .setDepth(1001)
      .setInteractive({ useHandCursor: true });
    const button = this.add.text(x, y, text, {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "15px",
      color: textColor,
      fontStyle: "bold",
      stroke: textColor === "#ffffff" ? "#1d1236" : "#ffffff",
      strokeThickness: 2
    }).setOrigin(0.5).setScrollFactor(0).setDepth(1002).setInteractive({ useHandCursor: true });
    [bg, button].forEach((target) => {
      target.on("pointerover", () => bg.setScale(1.04));
      target.on("pointerout", () => bg.setScale(1));
      target.on("pointerdown", onClick);
    });
  }

  refreshHUD() {
    this.progress = PlayerData.loadProgress();
    this.mood = EmotionSystem.getKingdomMood(this.progress);
    const activeQuest = QuestSystem.getActiveQuest(this.progress);
    this.pointsText.setText(`Points: ${this.progress.points}${DEV_UNLOCK_ALL_GAMES ? " • Dev unlocked" : ""}`);
    this.questText.setText(`Mood: ${this.mood.sky}\n${activeQuest.npc}: ${activeQuest.prompt}`);
  }

  update() {
    const speed = 230 * (this.speedMultiplier || 1);
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
      this.infoText.setText(this.activeNpcQuestText || "Walk near a portal to see its game. Use the buttons below anytime.");
    }

    if (Phaser.Input.Keyboard.JustDown(this.keys.C)) this.scene.start("CharacterSelectScene", { returnToDashboard: false });
    if (Phaser.Input.Keyboard.JustDown(this.keys.M)) this.scene.start("DashboardScene");
    if (Phaser.Input.Keyboard.JustDown(this.keys.I)) this.scene.start("StoryForgeScene");
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
    if (!this.heroLayerSprites?.length) return;
    if (this.player.body.velocity.length() > 20) {
      this.heroLayerSprites.forEach(({ layer, sprite }) => {
        if (!sprite.anims.isPlaying) sprite.play(`lpc-${layer}-walk`);
      });
      return;
    }
    this.heroLayerSprites.forEach(({ sprite }) => {
      sprite.stop();
      sprite.setFrame(FRONT_FRAME);
    });
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
