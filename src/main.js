import { LoginScene } from "./scenes/LoginScene.js?v=77";
import { DashboardScene } from "./scenes/DashboardScene.js?v=77";
import { BootScene } from "./scenes/BootScene.js?v=77";
import { CharacterSelectScene } from "./scenes/CharacterSelectScene.js?v=77";
import { KingdomMapScene } from "./scenes/KingdomMapScene.js?v=77";
import { MiniGameLauncherScene } from "./scenes/MiniGameLauncherScene.js?v=77";
import { ShopScene } from "./scenes/ShopScene.js?v=77";
import { ClosetScene } from "./scenes/ClosetScene.js?v=77";
import { PlayerRoomScene } from "./scenes/PlayerRoomScene.js?v=77";
import { StoryForgeScene } from "./scenes/StoryForgeScene.js?v=77";
import { KingdomNewsScene } from "./scenes/KingdomNewsScene.js?v=77";
import { ReflectionJournalScene } from "./scenes/ReflectionJournalScene.js?v=77";

const config = {
  type: Phaser.AUTO,
  parent: "game",
  width: 960,
  height: 760,
  backgroundColor: "#8fd3ff",
  pixelArt: true,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  dom: {
    createContainer: true
  },
  physics: {
    default: "arcade",
    arcade: { debug: false }
  },
  scene: [
    BootScene,
    LoginScene,
    DashboardScene,
    CharacterSelectScene,
    KingdomMapScene,
    MiniGameLauncherScene,
    ShopScene,
    ClosetScene,
    PlayerRoomScene,
    StoryForgeScene,
    KingdomNewsScene,
    ReflectionJournalScene
  ]
};

window.addEventListener("load", () => {
  if (!window.Phaser) {
    document.querySelector("#game").innerHTML = "<p class='world-error'>Phaser could not load. Check your connection and refresh.</p>";
    return;
  }
  new Phaser.Game(config);
});
