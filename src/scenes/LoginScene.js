import { AuthSystem } from "../systems/AuthSystem.js?v=73";

export class LoginScene extends Phaser.Scene {
  constructor() {
    super("LoginScene");
  }

  create() {
    this.cameras.main.setBackgroundColor("#3d2466");
    this.add.rectangle(480, 380, 960, 760, 0x3d2466);
    this.add.circle(130, 145, 120, 0xffd166, 0.18);
    this.add.circle(840, 610, 170, 0x7bdff2, 0.18);

    this.add.text(480, 130, "Kind Kingdom", {
      fontFamily: "Berkshire Swash, Georgia, serif",
      fontSize: "62px",
      color: "#ffffff",
      stroke: "#20133b",
      strokeThickness: 8
    }).setOrigin(0.5);

    this.add.text(480, 190, "Log in to save heroes, points, quests, and Skill XP.", {
      fontFamily: "Nunito, Arial, sans-serif",
      fontSize: "21px",
      color: "#fff8d6"
    }).setOrigin(0.5);

    const form = this.add.dom(480, 430).createFromHTML(`
      <form class="kk-login-form">
        <label>
          <span>Username</span>
          <input name="username" autocomplete="username" placeholder="kind_hero">
        </label>
        <label>
          <span>Password</span>
          <input name="password" type="password" autocomplete="current-password" placeholder="4+ characters">
        </label>
        <div class="kk-login-actions">
          <button type="submit" data-action="login">Log In</button>
          <button type="button" data-action="signup">Create Account</button>
        </div>
        <p data-message>Local development login. Do not use a real password.</p>
      </form>
    `);

    const node = form.node;
    const message = node.querySelector("[data-message]");
    const submit = (mode) => {
      const username = node.querySelector("[name='username']").value;
      const password = node.querySelector("[name='password']").value;
      const result = mode === "signup"
        ? AuthSystem.signup(username, password)
        : AuthSystem.login(username, password);
      message.textContent = result.ok ? "Entering your dashboard..." : result.message;
      message.classList.toggle("error", !result.ok);
      if (result.ok) this.time.delayedCall(250, () => this.scene.start("DashboardScene"));
    };

    node.addEventListener("submit", (event) => {
      event.preventDefault();
      submit("login");
    });
    node.querySelector("[data-action='signup']").addEventListener("click", () => submit("signup"));
  }
}
