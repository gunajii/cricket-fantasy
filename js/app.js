// ── PRIVATE DREAM11 — app.js ──

const APP = {
  version: '1.1.0',
  name: 'Private Dream11',
  maxUsers: 15,
  maxCredits: 100,
  maxPlayers: 11,
};

const Store = {
  get: (key) => {
    try {
      return JSON.parse(localStorage.getItem(key));
    } catch {
      return null;
    }
  },

  set: (key, val) => {
    try {
      localStorage.setItem(key, JSON.stringify(val));
    } catch (e) {
      console.warn('Storage error', e);
    }
  },

  remove: (key) =>
    localStorage.removeItem(key),

  clear: () =>
    localStorage.clear(),
};

const Auth = {
  currentUser: null,

  init() {
    const saved =
      Store.get('pd11_current_user');

    if (saved) {
      this.currentUser = saved;
      this.updateUI();
      return true;
    }

    return false;
  },

  login(username, pin) {
    const users =
      Store.get('pd11_users') || {};

    if (users[username]) {
      if (users[username].pin === pin) {
        this.currentUser = {
          username,
          ...users[username],
        };

        Store.set(
          'pd11_current_user',
          this.currentUser
        );

        this.updateUI();

        return { ok: true };
      }

      return {
        ok: false,
        msg: 'Wrong PIN',
      };
    }

    const allUsers =
      Object.keys(users);

    if (
      allUsers.length >=
      APP.maxUsers
    ) {
      return {
        ok: false,
        msg: `League full (max ${APP.maxUsers})`,
      };
    }

    users[username] = {
      pin,
      createdAt: Date.now(),
      teams: [],
    };

    Store.set(
      'pd11_users',
      users
    );

    this.currentUser = {
      username,
      ...users[username],
    };

    Store.set(
      'pd11_current_user',
      this.currentUser
    );

    this.updateUI();

    return { ok: true };
  },

  logout() {
    this.currentUser = null;

    Store.remove(
      'pd11_current_user'
    );

    window.location.href =
      'index.html';
  },

  require() {
    if (!this.currentUser) {
      window.location.href =
        'index.html';

      return false;
    }

    return true;
  },

  updateUI() {
    const el =
      document.getElementById(
        'nav-username'
      );

    const av =
      document.getElementById(
        'nav-avatar'
      );

    if (el)
      el.textContent =
        this.currentUser.username;

    if (av)
      av.textContent =
        this.currentUser.username[0].toUpperCase();
  },
};

const Leagues = {
  getAll() {
    return (
      Store.get('pd11_leagues') ||
      {}
    );
  },

  save(leagues) {
    Store.set(
      'pd11_leagues',
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
      link,
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
        msg: 'Invalid code',
      };

    if (
      leagues[
        code
      ].members.includes(username)
    )
      return {
        ok: false,
        msg: 'Already joined',
      };

    leagues[
      code
    ].members.push(username);

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
        (m) =>
          m.id === team.matchId
      );

    if (
      match &&
      match.status !==
        'upcoming'
    ) {
      Toast.show(
        'Team locked — match started',
        'error'
      );

      return false;
    }

    leagues[
      code
    ].teams[username] = team;

    this.save(leagues);

    return true;
  },

  getLeaderboard(code) {
    const leagues =
      this.getAll();

    if (!leagues[code])
      return [];

    const league =
      leagues[code];

    return Object.entries(
      league.teams
    )
      .map(([user, team]) => ({
        username: user,
        teamName: team.name,
        points:
          Points.calcTeamPoints(
            team
          ),
        captain: team.captain,
        viceCaptain:
          team.viceCaptain,
        players: team.players,
      }))
      .sort(
        (a, b) =>
          b.points - a.points
      )
      .map((e, i) => ({
        ...e,
        rank: i + 1,
      }));
  },

  generateCode() {
    const chars =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

    let code = '';

    for (let i = 0; i < 6; i++)
      code +=
        chars[
          Math.floor(
            Math.random() *
              chars.length
          )
        ];

    const leagues =
      this.getAll();

    return leagues[code]
      ? this.generateCode()
      : code;
  },
};

const Toast = {
  show(
    msg,
    type = 'info'
  ) {
    console.log(
      `[${type}]`,
      msg
    );
  },
};

document.addEventListener(
  'DOMContentLoaded',
  () => {
    Auth.init();
  }
);

// ── RESTORED HELPERS ──

const Time = {
  formatMatch(ts) {
    if (!ts) return '';

    const d = new Date(ts);

    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  },

  isWithin24h(ts) {
    if (!ts) return false;

    const now = Date.now();

    return (
      ts > now &&
      ts <= now + 86400000
    );
  },

  countdown(ts) {
    const diff = ts - Date.now();

    if (diff <= 0)
      return 'Starting soon';

    const h = Math.floor(diff / 3600000);

    const m = Math.floor(
      (diff % 3600000) / 60000
    );

    if (h > 0)
      return `${h}h ${m}m`;

    return `${m}m`;
  }
};

const Modal = {
  open(id) {
    const el =
      document.getElementById(id);

    if (el)
      el.classList.add('open');
  },

  close(id) {
    const el =
      document.getElementById(id);

    if (el)
      el.classList.remove('open');
  }
};

function seedDemoStats() {
  return;
}
