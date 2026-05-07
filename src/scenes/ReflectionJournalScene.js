import { ReflectionJournalSystem } from "../systems/ReflectionJournalSystem.js?v=70";

export class ReflectionJournalScene extends Phaser.Scene {
  constructor() {
    super("ReflectionJournalScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#6fb7ff");
    this.add.rectangle(480, 380, 960, 760, 0x6fb7ff);
    this.add.rectangle(480, 520, 960, 380, 0xb9ef9a);
    this.add.circle(818, 122, 72, 0xffd166, 0.92);
    this.panel = this.add.dom(480, 388).createFromHTML(`<div class="kk-journal-panel"></div>`);
    this.enablePanelScroll();
    this.render();
  }

  render() {
    const entries = ReflectionJournalSystem.entries();
    this.panel.node.innerHTML = `
      <div class="kk-journal-head">
        <div>
          <span>Private Reflection Journal</span>
          <h2>Your growth timeline</h2>
          <p>Saved reflections from completed games appear here on notebook paper.</p>
        </div>
        <button data-nav="dashboard">Back to Home</button>
      </div>
      <div class="kk-journal-paper">
        ${entries.length ? entries.map(entryTemplate).join("") : `
          <article class="kk-journal-entry empty">
            <h3>No reflections yet</h3>
            <p>Complete a mini-game, answer the reflection prompts, and your private entry will appear here.</p>
          </article>
        `}
      </div>
    `;
    this.panel.node.querySelector("[data-nav]")?.addEventListener("click", () => this.scene.start("DashboardScene"));
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

function entryTemplate(entry) {
  const date = new Date(entry.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  return `
    <article class="kk-journal-entry">
      <span>${date} • ${entry.category}</span>
      <h3>${entry.gameTitle}</h3>
      <p><b>How I might feel:</b> ${entry.feeling || "Not answered yet."}</p>
      <p><b>My connection:</b> ${entry.experience || "Not answered yet."}</p>
      <p><b>Next time I could:</b> ${entry.nextStep || "Not answered yet."}</p>
    </article>
  `;
}
