import { KingdomNewsSystem } from "../systems/KingdomNewsSystem.js?v=74";

export class KingdomNewsScene extends Phaser.Scene {
  constructor() {
    super("KingdomNewsScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#1f1740");
    this.add.rectangle(480, 380, 960, 760, 0x1f1740);
    this.add.circle(120, 112, 70, 0xffd166, 0.34);
    this.add.circle(820, 650, 130, 0x7bdff2, 0.16);
    this.panel = this.add.dom(480, 60).createFromHTML(`<div class="kk-news-panel" style="width:860px; max-width:860px;"></div>`);
    this.panel.setOrigin(0.5, 0);
    this.enablePanelScroll();
    this.posts = KingdomNewsSystem.latest(8);
    this.selectedId = this.posts[0]?.id || null;
    this.render();
    KingdomNewsSystem.markAllRead();
  }

  render() {
    const posts = this.posts || KingdomNewsSystem.latest(8);
    const selected = posts.find((post) => post.id === this.selectedId) || posts[0];
    this.panel.node.innerHTML = `
      <div class="kk-news-head">
        <div>
          <span>Kingdom News</span>
          <h2>The world reacts to your progress</h2>
          <p>Short reports appear when places are restored, festivals begin, or the kingdom mood changes.</p>
        </div>
        <button data-nav="dashboard">Back to Home</button>
      </div>
      ${selected ? fullArticleTemplate(selected) : "<p class='kk-news-empty'>No kingdom news yet. Complete a quest to make headlines.</p>"}
      <div class="kk-news-list" aria-label="More Kingdom News">
        ${posts.map((post) => headlineTemplate(post, post.id === selected?.id)).join("")}
      </div>
    `;
    this.panel.setOrigin(0.5, 0);
    this.panel.node.querySelector("[data-nav]")?.addEventListener("click", () => this.scene.start("DashboardScene"));
    this.panel.node.querySelectorAll("[data-news-id]").forEach((button) => {
      button.addEventListener("click", () => {
        this.selectedId = button.dataset.newsId;
        this.panel.node.scrollTop = 0;
        this.render();
      });
    });
  }

  enablePanelScroll() {
    const node = this.panel.node;
    node.addEventListener("wheel", (event) => {
      const before = node.scrollTop;
      node.scrollTop += event.deltaY;
      if (node.scrollTop !== before) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, { passive: false });

    let lastY = 0;
    node.addEventListener("touchstart", (event) => {
      lastY = event.touches[0]?.clientY || 0;
    }, { passive: true });
    node.addEventListener("touchmove", (event) => {
      const y = event.touches[0]?.clientY || lastY;
      const before = node.scrollTop;
      node.scrollTop += lastY - y;
      lastY = y;
      if (node.scrollTop !== before) {
        event.preventDefault();
        event.stopPropagation();
      }
    }, { passive: false });
  }
}

function fullArticleTemplate(post) {
  return `
    <article class="kk-news-article">
      <img src="${post.image}" alt="" onerror="this.src='assets/images/games/compliment-castle.jpg'">
      <div>
        <span>${post.kicker} • ${post.date}</span>
        <h3>${post.title}</h3>
        <strong>${post.summary}</strong>
        <p>${post.body}</p>
      </div>
    </article>
  `;
}

function headlineTemplate(post, active) {
  return `
    <button class="kk-news-headline ${active ? "active" : ""}" type="button" data-news-id="${post.id}">
      <img src="${post.image}" alt="" onerror="this.src='assets/images/games/compliment-castle.jpg'">
      <span>${post.kicker}</span>
      <b>${post.title}</b>
      <small>${post.summary}</small>
    </button>
  `;
}
