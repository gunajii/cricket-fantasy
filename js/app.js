// ── PRIVATE DREAM11 — app.js ──

const APP = {
  version: '1.2.0',
  maxUsers: 15,
  maxCredits: 100,
  maxPlayers: 11
};

const Store = {
  get(key) {
    try {
      return JSON.parse(
        localStorage.getItem(key)
      );
    } catch {
      return null;
    }
  },

  set(key, val) {
    localStorage.setItem(
      key,
      JSON.stringify(val)
    );
  },

  remove(key) {
    localStorage.removeItem(key);
  }
};

const Auth = {
  currentUser: null,

  init() {
    const saved =
      Store.get(
        "pd11_current_user"
      );

    if (saved) {
      this.currentUser = saved;
      this.updateUI();
    }
  },

  login(username, pin) {
    let users =
      Store.get("pd11_users") ||
      {};

    if (users[username]) {
      if (
        users[username].pin !==
        pin
      ) {
        return {
          ok: false,
          msg: "Wrong PIN"
        };
      }
    } else {
      if (
        Object.keys(users)
          .length >=
        APP.maxUsers
      ) {
        return {
          ok: false,
          msg: "League full"
        };
      }

      users[username] = {
        pin,
        createdAt: Date.now()
      };
    }

    Store.set(
      "pd11_users",
      users
    );

    this.currentUser = {
      username
    };

    Store.set(
      "pd11_current_user",
      this.currentUser
    );

    this.updateUI();

    return { ok: true };
  },

  logout() {
    Store.remove(
      "pd11_current_user"
    );

    location.href =
      "index.html";
  },

  updateUI() {
    const el =
      document.getElementById(
        "nav-username"
      );

    if (
      el &&
      this.currentUser
    ) {
      el.textContent =
        this.currentUser.username;
    }
  }
};

const Leagues = {
  getAll() {
    return (
      Store.get(
        "pd11_leagues"
      ) || {}
    );
  },

  save(leagues) {
    Store.set(
      "pd11_leagues",
      leagues
    );
  },

  create(
    name,
    matchId,
    matchName,
    username
  ) {
    const leagues =
      this.getAll();

    const code =
      this.generateCode();

    const link =
      `${window.location.origin}/cricket-fantasy/league.html?code=${code}`;

    leagues[code] = {
      code,
      name,
      matchId,
      matchName,
      createdBy: username,
      createdAt: Date.now(),
      members: [username],
      teams: {},
      link
    };

    this.save(leagues);

    return code;
  },

  join(code, username) {
    const leagues =
      this.getAll();

    if (!leagues[code])
      return {
        ok: false,
        msg: "Invalid code"
      };

    if (
      leagues[
        code
      ].members.includes(
        username
      )
    )
      return {
        ok: false,
        msg: "Already joined"
      };

    leagues[
      code
    ].members.push(
      username
    );

    this.save(leagues);

    return { ok: true };
  },

  addTeam(
    code,
    username,
    team
  ) {
    const leagues =
      this.getAll();

    if (!leagues[code])
      return false;

    const match =
      Matches.cache?.find(
        m =>
          m.id ===
          team.matchId
      );

    if (
      match &&
      match.status !==
        "upcoming"
    ) {
      alert(
        "Team locked — match started"
      );
      return false;
    }

    leagues[
      code
    ].teams[username] = team;

    this.save(leagues);

    return true;
  },

  // CRITICAL FIX — this was missing
  getUserLeagues(username) {
    const leagues =
      this.getAll();

    return Object.values(
      leagues
    ).filter(
      l =>
        l.members &&
        l.members.includes(
          username
        )
    );
  },

  generateCode() {
    const chars =
      "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";

    let code = "";

    for (
      let i = 0;
      i < 6;
      i++
    ) {
      code +=
        chars[
          Math.floor(
            Math.random() *
              chars.length
          )
        ];
    }

    const leagues =
      this.getAll();

    return leagues[code]
      ? this.generateCode()
      : code;
  }
};

const Time = {
  formatMatch(ts) {
    if (!ts) return "";

    const d =
      new Date(ts);

    return d.toLocaleString(
      "en-IN",
      {
        timeZone:
          "Asia/Kolkata",
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      }
    );
  },

  isWithin24h(ts) {
    if (!ts) return false;

    const now =
      Date.now();

    return (
      ts > now &&
      ts <=
        now +
          24 *
            60 *
            60 *
            1000
    );
  }
};

const Modal = {
  open(id) {
    const el =
      document.getElementById(
        id
      );

    if (el)
      el.classList.add(
        "open"
      );
  },

  close(id) {
    const el =
      document.getElementById(
        id
      );

    if (el)
      el.classList.remove(
        "open"
      );
  }
};

function seedDemoStats() {
  return;
}

document.addEventListener(
  "DOMContentLoaded",
  () => {
    Auth.init();
  }
);
