// ── PRIVATE DREAM11 — app.js ──
// Core: Auth, Storage, Utilities, Toast, Navigation

const APP = {
  version: '1.0.0',
  name: 'Private Dream11',
  maxUsers: 15,
  maxCredits: 100,
  maxPlayers: 11,
};

// ── STORAGE HELPERS ──
const Store = {
  get: (key) => { try { return JSON.parse(localStorage.getItem(key)); } catch { return null; } },
  set: (key, val) => { try { localStorage.setItem(key, JSON.stringify(val)); } catch(e) { console.warn('Storage error', e); } },
  remove: (key) => localStorage.removeItem(key),
  clear: () => localStorage.clear(),
};

// ── USER AUTH ──
const Auth = {
  currentUser: null,

  init() {
    const saved = Store.get('pd11_current_user');
    if (saved) {
      this.currentUser = saved;
      this.updateUI();
      return true;
    }
    return false;
  },

  login(username, pin) {
    const users = Store.get('pd11_users') || {};
    if (users[username]) {
      if (users[username].pin === pin) {
        this.currentUser = { username, ...users[username] };
        Store.set('pd11_current_user', this.currentUser);
        this.updateUI();
        return { ok: true };
      }
      return { ok: false, msg: 'Wrong PIN' };
    }
    // New user registration
    const allUsers = Object.keys(users);
    if (allUsers.length >= APP.maxUsers) {
      return { ok: false, msg: `This league is full (max ${APP.maxUsers} users)` };
    }
    users[username] = { pin, createdAt: Date.now(), teams: [] };
    Store.set('pd11_users', users);
    this.currentUser = { username, ...users[username] };
    Store.set('pd11_current_user', this.currentUser);
    this.updateUI();
    Toast.show('Account created! Welcome, ' + username + ' 🎉', 'success');
    return { ok: true, isNew: true };
  },

  logout() {
    this.currentUser = null;
    Store.remove('pd11_current_user');
    window.location.href = 'index.html';
  },

  require() {
    if (!this.currentUser) {
      window.location.href = 'index.html';
      return false;
    }
    return true;
  },

  updateUI() {
    const el = document.getElementById('nav-username');
    const av = document.getElementById('nav-avatar');
    if (el) el.textContent = this.currentUser.username;
    if (av) av.textContent = this.currentUser.username[0].toUpperCase();
  }
};

// ── TOAST NOTIFICATIONS ──
const Toast = {
  container: null,

  init() {
    this.container = document.getElementById('toast-container');
    if (!this.container) {
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      this.container.id = 'toast-container';
      document.body.appendChild(this.container);
    }
  },

  show(msg, type = 'info', duration = 3000) {
    if (!this.container) this.init();
    const icon = type === 'success' ? '✅' : type === 'error' ? '❌' : 'ℹ️';
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<span>${icon}</span><span>${msg}</span>`;
    this.container.appendChild(toast);
    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(20px)';
      toast.style.transition = 'all 0.3s';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }
};

// ── LEAGUE SYSTEM ──
const Leagues = {
  getAll() { return Store.get('pd11_leagues') || {}; },
  save(leagues) { Store.set('pd11_leagues', leagues); },

  create(name, matchId, matchName, username) {
    const leagues = this.getAll();
    const code = this.generateCode();
    leagues[code] = {
      code,
      name,
      matchId,
      matchName,
      createdBy: username,
      createdAt: Date.now(),
      members: [username],
      teams: {},
    };
    this.save(leagues);
    return code;
  },

  join(code, username) {
    const leagues = this.getAll();
    if (!leagues[code]) return { ok: false, msg: 'Invalid league code' };
    if (leagues[code].members.includes(username)) return { ok: false, msg: 'Already in this league' };
    if (leagues[code].members.length >= APP.maxUsers) return { ok: false, msg: 'League is full' };
    leagues[code].members.push(username);
    this.save(leagues);
    return { ok: true, league: leagues[code] };
  },

  addTeam(code, username, team) {
    const leagues = this.getAll();
    if (!leagues[code]) return false;
    leagues[code].teams[username] = team;
    this.save(leagues);
    return true;
  },

  getLeaderboard(code) {
    const leagues = this.getAll();
    if (!leagues[code]) return [];
    const league = leagues[code];
    return Object.entries(league.teams).map(([user, team]) => ({
      username: user,
      teamName: team.name,
      points: Points.calcTeamPoints(team),
      captain: team.captain,
      viceCaptain: team.viceCaptain,
      players: team.players,
    })).sort((a, b) => b.points - a.points).map((e, i) => ({ ...e, rank: i + 1 }));
  },

  getUserLeagues(username) {
    const all = this.getAll();
    return Object.values(all).filter(l => l.members.includes(username));
  },

  generateCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
    const leagues = this.getAll();
    return leagues[code] ? this.generateCode() : code;
  }
};

// ── TEAMS ──
const Teams = {
  getAll(username) {
    const all = Store.get('pd11_teams') || {};
    return all[username] || [];
  },

  save(username, teams) {
    const all = Store.get('pd11_teams') || {};
    all[username] = teams;
    Store.set('pd11_teams', all);
  },

  create(username, team) {
    const teams = this.getAll(username);
    team.id = Date.now().toString();
    team.createdAt = Date.now();
    teams.push(team);
    this.save(username, teams);
    return team.id;
  },

  get(username, teamId) {
    return this.getAll(username).find(t => t.id === teamId);
  },

  validate(players, credits) {
    if (players.length !== APP.maxPlayers) return { ok: false, msg: `Select exactly ${APP.maxPlayers} players` };
    const used = players.reduce((s, p) => s + p.credits, 0);
    if (used > APP.maxCredits) return { ok: false, msg: `Over credit limit (${used}/${APP.maxCredits})` };
    // Role checks
    const roles = { wk: 0, bat: 0, all: 0, bowl: 0 };
    players.forEach(p => {
      const r = (p.role || '').toLowerCase();
      if (r.includes('wicket') || r === 'wk') roles.wk++;
      else if (r.includes('bat')) roles.bat++;
      else if (r.includes('all')) roles.all++;
      else roles.bowl++;
    });
    if (roles.wk < 1) return { ok: false, msg: 'Need at least 1 Wicket-Keeper' };
    // Team player count
    const teamCounts = {};
    players.forEach(p => { teamCounts[p.team] = (teamCounts[p.team] || 0) + 1; });
    for (const [team, count] of Object.entries(teamCounts)) {
      if (count > 7) return { ok: false, msg: `Max 7 players from ${team}` };
    }
    return { ok: true };
  }
};

// ── POINTS CALCULATION (Dream11 Scoring) ──
const Points = {
  rules: {
    // Batting
    run: 1,
    boundary4: 1,
    boundary6: 2,
    half_century: 8,
    century: 16,
    duck: -2,
    // Bowling
    wicket: 25,
    lbwBowled: 8,
    dot_ball: 0.5,
    four_wickets: 4,
    five_wickets: 8,
    maiden: 4,
    // Fielding
    catch: 8,
    stumping: 12,
    run_out_direct: 12,
    run_out_indirect: 6,
    // Strike Rate (min 10 balls)
    sr_below_70: -6,
    sr_70_80: -4,
    sr_80_100: -2,
    sr_above_170: 6,
    sr_150_170: 4,
    sr_130_150: 2,
    // Economy Rate (min 2 overs)
    eco_below_5: 6,
    eco_5_6: 4,
    eco_6_7: 2,
    eco_10_11: -2,
    eco_11_12: -4,
    eco_above_12: -6,
    // Playing XI
    playing: 4,
  },

  calcPlayerPoints(stats) {
    if (!stats) return 0;
    let pts = 0;
    if (stats.isPlaying) pts += this.rules.playing;

    // Batting
    const runs = stats.runs || 0;
    const balls = stats.balls || 0;
    pts += runs * this.rules.run;
    pts += (stats.fours || 0) * this.rules.boundary4;
    pts += (stats.sixes || 0) * this.rules.boundary6;
    if (runs >= 100) pts += this.rules.century;
    else if (runs >= 50) pts += this.rules.half_century;
    if (runs === 0 && balls > 0 && stats.isOut) pts += this.rules.duck;
    if (balls >= 10) {
      const sr = (runs / balls) * 100;
      if (sr > 170) pts += this.rules.sr_above_170;
      else if (sr > 150) pts += this.rules.sr_150_170;
      else if (sr > 130) pts += this.rules.sr_130_150;
      else if (sr < 70) pts += this.rules.sr_below_70;
      else if (sr < 80) pts += this.rules.sr_70_80;
      else if (sr < 100) pts += this.rules.sr_80_100;
    }

    // Bowling
    const wickets = stats.wickets || 0;
    pts += wickets * this.rules.wicket;
    pts += (stats.lbw_bowled || 0) * this.rules.lbwBowled;
    if (wickets >= 5) pts += this.rules.five_wickets;
    else if (wickets >= 4) pts += this.rules.four_wickets;
    pts += (stats.maidens || 0) * this.rules.maiden;
    pts += (stats.dotBalls || 0) * this.rules.dot_ball;
    const overs = stats.overs || 0;
    if (overs >= 2) {
      const eco = stats.economy || 0;
      if (eco < 5) pts += this.rules.eco_below_5;
      else if (eco < 6) pts += this.rules.eco_5_6;
      else if (eco < 7) pts += this.rules.eco_6_7;
      else if (eco >= 10 && eco < 11) pts += this.rules.eco_10_11;
      else if (eco >= 11 && eco < 12) pts += this.rules.eco_11_12;
      else if (eco >= 12) pts += this.rules.eco_above_12;
    }

    // Fielding
    pts += (stats.catches || 0) * this.rules.catch;
    pts += (stats.stumpings || 0) * this.rules.stumping;
    pts += (stats.runOutDirect || 0) * this.rules.run_out_direct;
    pts += (stats.runOutIndirect || 0) * this.rules.run_out_indirect;

    return Math.round(pts * 10) / 10;
  },

  calcTeamPoints(team) {
    if (!team || !team.players) return 0;
    const allStats = Store.get('pd11_player_stats') || {};
    let total = 0;
    team.players.forEach(p => {
      const stats = allStats[p.id] || {};
      let pts = this.calcPlayerPoints(stats);
      if (p.id === team.captain) pts *= 2;
      else if (p.id === team.viceCaptain) pts *= 1.5;
      total += pts;
    });
    return Math.round(total * 10) / 10;
  },

  getPlayerPoints(playerId) {
    const allStats = Store.get('pd11_player_stats') || {};
    return this.calcPlayerPoints(allStats[playerId] || {});
  }
};

// ── NAVIGATION HELPERS ──
const Nav = {
  init() {
    // Highlight active nav
    const links = document.querySelectorAll('.nav-links a');
    const path = window.location.pathname.split('/').pop() || 'index.html';
    links.forEach(a => {
      if (a.getAttribute('href') === path) a.classList.add('active');
    });

    // Hamburger
    const ham = document.getElementById('hamburger');
    const navLinks = document.querySelector('.nav-links');
    if (ham && navLinks) {
      ham.addEventListener('click', () => navLinks.classList.toggle('open'));
    }

    // Logout
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) logoutBtn.addEventListener('click', () => Auth.logout());
  }
};

// ── MODAL HELPERS ──
const Modal = {
  open(id) {
    const el = document.getElementById(id);
    if (el) el.classList.add('open');
  },
  close(id) {
    const el = document.getElementById(id);
    if (el) el.classList.remove('open');
  },
  init() {
    document.querySelectorAll('.modal-overlay').forEach(m => {
      m.addEventListener('click', e => {
        if (e.target === m) m.classList.remove('open');
      });
    });
    document.querySelectorAll('.modal-close').forEach(btn => {
      btn.addEventListener('click', () => {
        btn.closest('.modal-overlay').classList.remove('open');
      });
    });
  }
};

// ── URL PARAMS ──
const Params = {
  get(key) {
    return new URLSearchParams(window.location.search).get(key);
  }
};

// ── TIME HELPERS ──
const Time = {
  formatMatch(ts) {
    if (!ts) return '';
    const d = new Date(ts);
    return d.toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
  },
  isWithin24h(ts) {
    if (!ts) return false;
    const now = Date.now();
    return ts > now && ts <= now + 86400000;
  },
  isLive(match) {
    return match.status === 'live' || match.status === 'in_progress';
  },
  isFinished(match) {
    return match.status === 'finished' || match.status === 'completed';
  },
  isUpcoming(match) {
    return match.status === 'upcoming' || match.status === 'scheduled';
  },
  countdown(ts) {
    const diff = ts - Date.now();
    if (diff <= 0) return 'Starting soon';
    const h = Math.floor(diff / 3600000);
    const m = Math.floor((diff % 3600000) / 60000);
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  }
};

// ── INIT ON LOAD ──
document.addEventListener('DOMContentLoaded', () => {
  Toast.init();
  Modal.init();
  Auth.init();
  Nav.init();
});
