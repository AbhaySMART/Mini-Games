import { PlayerData } from "./PlayerData.js?v=43";

export const DEV_UNLOCK_ALL_GAMES = true;

export const UnlockSystem = {
  getPoints() {
    return PlayerData.loadProgress().points;
  },

  addPoints(amount) {
    return PlayerData.addPoints(amount);
  },

  requiredPoints(index) {
    return Math.floor(index / 4) * 50;
  },

  isUnlocked(requiredPoints) {
    return DEV_UNLOCK_ALL_GAMES || this.getPoints() >= requiredPoints;
  },

  isCompleted(slug) {
    return PlayerData.loadProgress().completed.includes(slug);
  }
};
