export const HEROES = [
  {
    id: "knight",
    title: "Kind Knight",
    color: 0x7b4dff,
    layers: ["body-male", "legs-navy", "torso-plate", "hair-page"]
  },
  {
    id: "mage",
    title: "Mindful Mage",
    color: 0x2ec4b6,
    layers: ["hair-princess-bg", "body-female", "legs-purple", "torso-purple-frock", "hair-princess-fg"]
  },
  {
    id: "ranger",
    title: "Helping Ranger",
    color: 0x52b788,
    layers: ["hair-long-bg", "body-teen", "legs-forest", "torso-forest-tunic", "hair-long-fg"]
  },
  {
    id: "bard",
    title: "Listening Bard",
    color: 0xff8fab,
    layers: ["body-male", "legs-purple", "torso-rose-frock", "hair-pixie"]
  }
];

export const HERO_LAYER_ASSETS = {
  "body-male": "assets/lpc-generated/heroes/body-male.png",
  "body-female": "assets/lpc-generated/heroes/body-female.png",
  "body-teen": "assets/lpc-generated/heroes/body-teen.png",
  "legs-navy": "assets/lpc-generated/heroes/legs-navy.png",
  "legs-forest": "assets/lpc-generated/heroes/legs-forest.png",
  "legs-purple": "assets/lpc-generated/heroes/legs-purple.png",
  "torso-plate": "assets/lpc-generated/heroes/torso-plate.png",
  "torso-purple-frock": "assets/lpc-generated/heroes/torso-purple-frock.png",
  "torso-forest-tunic": "assets/lpc-generated/heroes/torso-forest-tunic.png",
  "torso-rose-frock": "assets/lpc-generated/heroes/torso-rose-frock.png",
  "hair-page": "assets/lpc-generated/heroes/hair-page.png",
  "hair-pixie": "assets/lpc-generated/heroes/hair-pixie.png",
  "hair-long-bg": "assets/lpc-generated/heroes/hair-long-bg.png",
  "hair-long-fg": "assets/lpc-generated/heroes/hair-long-fg.png",
  "hair-princess-bg": "assets/lpc-generated/heroes/hair-princess-bg.png",
  "hair-princess-fg": "assets/lpc-generated/heroes/hair-princess-fg.png",
  "cape-purple": "assets/lpc-generated/accessories/cape-purple-behind.png",
  "cape-blue": "assets/lpc-generated/accessories/cape-blue-behind.png",
  "cape-teal": "assets/lpc-generated/accessories/cape-teal-behind.png",
  "wings-teal": "assets/lpc-generated/accessories/wings-teal-behind.png",
  "crown-gold": "assets/lpc-generated/accessories/crown-gold.png",
  "crown-purple": "assets/lpc-generated/accessories/crown-purple.png"
};

export const FRONT_FRAME = 19;
export const WALK_FRAMES = [18, 19, 20, 21, 22, 23, 24, 25, 26];

export function getHero(id) {
  return HEROES.find((hero) => hero.id === id) || HEROES[0];
}
