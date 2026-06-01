const USERS_KEY = "kkUsers";
const SESSION_KEY = "kkCurrentUser";
const ADMIN_USERNAME = "abhayagarwal";
const ADMIN_PASSWORD = "Abb^5952";

export const AuthSystem = {
  currentUser() {
    return localStorage.getItem(SESSION_KEY);
  },

  isLoggedIn() {
    return Boolean(this.currentUser());
  },

  login(username, password) {
    const cleanName = normalizeUsername(username);
    if (!cleanName || !password) {
      return { ok: false, message: "Enter a username and password." };
    }
    if (cleanName === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
      ensureAdminUser();
      localStorage.setItem(SESSION_KEY, cleanName);
      return { ok: true, user: cleanName, admin: true };
    }
    const users = readUsers();
    const user = users[cleanName];
    if (!user || user.password !== password) {
      return { ok: false, message: "That login does not match an account." };
    }
    localStorage.setItem(SESSION_KEY, cleanName);
    return { ok: true, user: cleanName };
  },

  signup(username, password) {
    const cleanName = normalizeUsername(username);
    if (cleanName.length < 3) {
      return { ok: false, message: "Username needs at least 3 letters." };
    }
    if (!password || password.length < 4) {
      return { ok: false, message: "Password needs at least 4 characters." };
    }
    const users = readUsers();
    if (users[cleanName]) {
      return { ok: false, message: "That username already exists." };
    }
    users[cleanName] = {
      username: cleanName,
      password,
      createdAt: Date.now()
    };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
    localStorage.setItem(SESSION_KEY, cleanName);
    return { ok: true, user: cleanName };
  },

  logout() {
    localStorage.removeItem(SESSION_KEY);
  },

  isAdmin() {
    return this.currentUser() === ADMIN_USERNAME;
  }
};

export function userScopedKey(baseKey) {
  const user = AuthSystem.currentUser();
  return user ? `${baseKey}:${user}` : baseKey;
}

function readUsers() {
  try {
    return JSON.parse(localStorage.getItem(USERS_KEY) || "{}");
  } catch {
    return {};
  }
}

function ensureAdminUser() {
  const users = readUsers();
  if (!users[ADMIN_USERNAME]) {
    users[ADMIN_USERNAME] = {
      username: ADMIN_USERNAME,
      password: ADMIN_PASSWORD,
      role: "admin",
      createdAt: Date.now()
    };
    localStorage.setItem(USERS_KEY, JSON.stringify(users));
  }
}

function normalizeUsername(username) {
  return String(username || "").trim().toLowerCase().replace(/[^a-z0-9_-]+/g, "");
}
