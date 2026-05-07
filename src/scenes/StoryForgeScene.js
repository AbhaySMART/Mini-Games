import { StoryForgeSystem } from "../systems/StoryForgeSystem.js?v=79";
import { EmotionSystem } from "../systems/EmotionSystem.js?v=79";
import { NPCMemorySystem } from "../systems/NPCMemorySystem.js?v=79";

export class StoryForgeScene extends Phaser.Scene {
  constructor() {
    super("StoryForgeScene");
  }

  create() {
    this.skill = "empathy";
    this.cameras.main.setBackgroundColor("#221445");
    this.add.rectangle(480, 380, 960, 760, 0x221445);
    this.add.circle(124, 108, 72, 0x7bdff2, 0.22);
    this.add.circle(812, 118, 82, 0xffd166, 0.28);
    this.add.circle(850, 650, 128, 0xff8fab, 0.14);
    this.panel = this.add.dom(50, 60).createFromHTML(`<div class="kk-ai-panel" style="width:860px; max-width:860px;"></div>`);
    this.panel.setOrigin(0, 0);
    this.panel.setSize(860, 650);
    this.enablePanelScroll();
    this.render();
    this.generate();
  }

  render(story = null, message = "") {
    const skills = StoryForgeSystem.skills();
    this.panel.node.innerHTML = `
      <div class="kk-ai-head">
        <div>
          <span>Kindness Story Model</span>
          <h2>Story Forge</h2>
          <p>Create fresh kindness situations, dialogue, challenges, and NPC conversations for real-life social skills practice.</p>
        </div>
        <button data-nav="dashboard">Back to Home</button>
      </div>
      <div class="kk-ai-skills">
        ${skills.map((skill) => `<button data-skill="${skill.id}" class="${this.skill === skill.id ? "active" : ""}">${skill.label}</button>`).join("")}
      </div>
      <div class="kk-ai-actions">
        <button data-generate>Generate New Story</button>
        <button data-random>Surprise Me</button>
      </div>
      <div class="kk-ai-story">
        ${story ? storyTemplate(story, message) : `<p class="kk-ai-loading">Creating a new kindness quest...</p>`}
      </div>
      <div class="kk-ai-history">
        <b>Recent story quests</b>
        ${StoryForgeSystem.latest(4).map((item) => `<button data-history="${item.id}">${item.title}<small>${item.skill}</small></button>`).join("") || "<p>No generated stories yet.</p>"}
      </div>
    `;
    this.panel.setOrigin(0, 0);
    this.bind();
  }

  bind() {
    this.panel.node.querySelectorAll("[data-skill]").forEach((button) => {
      button.addEventListener("click", () => {
        this.skill = button.dataset.skill;
        this.render(this.story, "Skill focus changed. Generate a new story when ready.");
      });
    });
    this.panel.node.querySelector("[data-generate]")?.addEventListener("click", () => this.generate());
    this.panel.node.querySelector("[data-random]")?.addEventListener("click", () => {
      const skills = StoryForgeSystem.skills();
      this.skill = skills[Math.floor(Math.random() * skills.length)].id;
      this.generate();
    });
    this.panel.node.querySelector("[data-nav]")?.addEventListener("click", () => this.scene.start("DashboardScene"));
    this.panel.node.querySelectorAll("[data-choice]").forEach((button) => {
      button.addEventListener("click", () => {
        const choice = this.story?.choices?.[Number(button.dataset.choice)];
        if (!choice) return;
        EmotionSystem.recordChoice(Boolean(choice.correct), {
          skill: this.story?.skill || this.skill,
          label: this.story?.title || "Story Forge choice"
        });
        NPCMemorySystem.recordStoryChoice({
          npcName: this.story?.npcName,
          skill: this.story?.skill || this.skill,
          title: this.story?.title || "Story Forge",
          correct: Boolean(choice.correct)
        });
        this.render(this.story, choice.correct ? `Strong choice: ${choice.result}` : `Try again: ${choice.result}`);
      });
    });
    this.panel.node.querySelectorAll("[data-history]").forEach((button) => {
      button.addEventListener("click", () => {
        const story = StoryForgeSystem.latest(20).find((item) => item.id === button.dataset.history);
        if (story) {
          this.story = story;
          this.skill = StoryForgeSystem.skills().find((skill) => skill.label === story.skill)?.id || this.skill;
          this.render(story, "Loaded from recent generated quests.");
        }
      });
    });
  }

  async generate() {
    this.render(null);
    this.story = await StoryForgeSystem.generate({ skill: this.skill });
    this.render(this.story, "Created. Pick a challenge choice to test the lesson.");
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

function storyTemplate(story, message) {
  return `
    <article class="kk-ai-card">
      <div class="kk-ai-title-row">
        <div>
          <span>${story.skill}</span>
          <h3>${story.title}</h3>
        </div>
        <small>${story.setting}</small>
      </div>
      <p>${story.situation}</p>
      <div class="kk-ai-columns">
        <section>
          <b>Dialogue</b>
          ${story.dialogue.map((line) => `<p>${line}</p>`).join("")}
        </section>
        <section>
          <b>NPC Conversation</b>
          ${story.npcConversation.map((turn) => `<p><strong>${turn.speaker}:</strong> ${turn.line}</p>`).join("")}
        </section>
      </div>
      <div class="kk-ai-challenge">
        <b>${story.challenge}</b>
        ${story.choices.map((choice, index) => `<button data-choice="${index}">${choice.text}</button>`).join("")}
      </div>
      <div class="kk-ai-reflection">${message || story.reflection}</div>
    </article>
  `;
}
