// ── PRIVATE DREAM11 — matches.js ──
// Fetches live match data from CricAPI (free tier) + fallback demo data

const Matches = {
  // CricAPI key — user can set their own key in localStorage as 'pd11_api_key'
  // Free key from https://cricapi.com — 100 req/day
  apiKey: () => Store.get('pd11_api_key') || '',
  baseUrl: 'https://api.cricapi.com/v1',
  cache: null,
  cacheTime: 0,
  cacheTTL: 120000, // 2 min cache

  async fetchAll() {
    // Return cache if fresh
    if (this.cache && Date.now() - this.cacheTime < this.cacheTTL) {
      return this.cache;
    }
    const key = this.apiKey();
    if (!key) {
      return this.getDemoMatches();
    }
    try {
      const res = await fetch(`${this.baseUrl}/currentMatches?apikey=${key}&offset=0`);
      const data = await res.json();
      if (data.status !== 'success') throw new Error(data.reason || 'API error');

      const matches = (data.data || []).map(m => this.normalise(m));
      this.cache = matches;
      this.cacheTime = Date.now();
      Store.set('pd11_matches_cache', { matches, time: Date.now() });
      return matches;
    } catch (e) {
      console.warn('API fetch failed, using cache/demo:', e.message);
      const cached = Store.get('pd11_matches_cache');
      if (cached) return cached.matches;
      return this.getDemoMatches();
    }
  },

  normalise(m) {
    // Map CricAPI fields to our internal schema
    const start = m.dateTimeGMT ? new Date(m.dateTimeGMT).getTime() : 0;
    const teams = m.teams || [m.t1 || 'Team A', m.t2 || 'Team B'];
    const scores = m.score || [];

    let status = 'upcoming';
    if (m.matchEnded) status = 'finished';
    else if (m.matchStarted) status = 'live';

    return {
      id: m.id || String(Date.now() + Math.random()),
      name: m.name || `${teams[0]} vs ${teams[1]}`,
      team1: { name: teams[0], shortName: this.shortName(teams[0]) },
      team2: { name: teams[1], shortName: this.shortName(teams[1]) },
      startTime: start,
      venue: m.venue || 'TBD',
      format: m.matchType ? m.matchType.toUpperCase() : 'T20',
      status,
      score1: scores[0] ? `${scores[0].r}/${scores[0].w} (${scores[0].o} ov)` : '',
      score2: scores[1] ? `${scores[1].r}/${scores[1].w} (${scores[1].o} ov)` : '',
      result: m.status || '',
      seriesName: m.series_id || '',
    };
  },

  shortName(name) {
    if (!name) return '???';
    const words = name.trim().split(/\s+/);
    if (words.length === 1) return name.substring(0, 3).toUpperCase();
    return words.map(w => w[0]).join('').substring(0, 3).toUpperCase();
  },

  getLive(all) { return all.filter(m => m.status === 'live'); },
  getUpcoming24h(all) { return all.filter(m => m.status === 'upcoming' && Time.isWithin24h(m.startTime)); },
  getFinished(all) { return all.filter(m => m.status === 'finished').slice(0, 10); },

  teamEmoji(name) {
    const map = {
      'india': '🇮🇳', 'australia': '🇦🇺', 'england': '🏴󠁧󠁢󠁥󠁮󠁧󠁿',
      'pakistan': '🇵🇰', 'south africa': '🇿🇦', 'new zealand': '🇳🇿',
      'west indies': '🌴', 'sri lanka': '🇱🇰', 'bangladesh': '🇧🇩',
      'afghanistan': '🇦🇫', 'zimbabwe': '🇿🇼', 'ireland': '🇮🇪',
      'netherlands': '🇳🇱', 'kenya': '🇰🇪', 'uae': '🇦🇪',
    };
    const lower = name.toLowerCase();
    for (const [k, v] of Object.entries(map)) {
      if (lower.includes(k)) return v;
    }
    return '🏏';
  },

  renderCard(match, context = 'home') {
    const e1 = this.teamEmoji(match.team1.name);
    const e2 = this.teamEmoji(match.team2.name);
    const isLive = match.status === 'live';
    const isFinished = match.status === 'finished';
    const isUpcoming = match.status === 'upcoming';

    let badgeHtml = '';
    if (isLive) badgeHtml = `<span class="match-status-badge badge-live">LIVE</span>`;
    else if (isFinished) badgeHtml = `<span class="match-status-badge badge-finished">FINISHED</span>`;
    else badgeHtml = `<span class="match-status-badge badge-upcoming">UPCOMING</span>`;

    let score1Html = '', score2Html = '';
    if (isLive || isFinished) {
      score1Html = match.score1 ? `<div class="team-score"><div class="score-runs">${match.score1}</div></div>` : '';
      score2Html = match.score2 ? `<div class="team-score"><div class="score-runs">${match.score2}</div></div>` : '';
    } else {
      score1Html = `<div class="team-score"><div class="score-overs">${Time.countdown(match.startTime)}</div></div>`;
      score2Html = '';
    }

    let resultHtml = '';
    if (isFinished && match.result) {
      resultHtml = `<div class="match-result">🏆 ${match.result}</div>`;
    }

    let actionsHtml = '';
    if (context === 'home') {
      if (isUpcoming || isLive) {
        actionsHtml = `
          <button class="btn btn-primary btn-sm" onclick="HomeActions.createLeague('${match.id}', '${this.escapeHtml(match.name)}')">
            🏆 Create League
          </button>
          <button class="btn btn-secondary btn-sm" onclick="HomeActions.joinLeague('${match.id}', '${this.escapeHtml(match.name)}')">
            Join League
          </button>`;
      } else {
        actionsHtml = `<button class="btn btn-secondary btn-sm" onclick="HomeActions.viewLeague('${match.id}')">View Details</button>`;
      }
    }

    const timeStr = match.startTime ? Time.formatMatch(match.startTime) : '';

    return `
    <div class="match-card ${match.status}" data-match-id="${match.id}">
      <div class="match-card-top">
        <span class="match-format">${match.format}</span>
        ${badgeHtml}
      </div>
      <div class="match-teams">
        <div class="team-row">
          <div class="team-info">
            <div class="team-flag">${e1}</div>
            <div>
              <div class="team-name">${match.team1.shortName}</div>
              <div class="team-fullname">${match.team1.name}</div>
            </div>
          </div>
          ${score1Html}
        </div>
        <hr class="vs-divider">
        <div class="team-row">
          <div class="team-info">
            <div class="team-flag">${e2}</div>
            <div>
              <div class="team-name">${match.team2.shortName}</div>
              <div class="team-fullname">${match.team2.name}</div>
            </div>
          </div>
          ${score2Html}
        </div>
      </div>
      <div class="match-meta">
        ${timeStr ? `<span class="meta-item"><span class="meta-icon">🕐</span>${timeStr}</span>` : ''}
        ${match.venue ? `<span class="meta-item"><span class="meta-icon">📍</span>${match.venue.substring(0, 30)}</span>` : ''}
      </div>
      ${resultHtml}
      ${actionsHtml ? `<div class="match-actions">${actionsHtml}</div>` : ''}
    </div>`;
  },

  escapeHtml(str) {
    return String(str).replace(/'/g, "\\'").replace(/"/g, '&quot;');
  },

  // ── DEMO DATA (no API key needed) ──
  getDemoMatches() {
    const now = Date.now();
    const hour = 3600000;
    return [
      {
        id: 'demo_1', name: 'India vs Australia — 1st T20I',
        team1: { name: 'India', shortName: 'IND' },
        team2: { name: 'Australia', shortName: 'AUS' },
        startTime: now - 2 * hour, venue: 'Wankhede Stadium, Mumbai',
        format: 'T20', status: 'live',
        score1: '165/4 (18.2 ov)', score2: '142/7 (20 ov)', result: '',
      },
      {
        id: 'demo_2', name: 'England vs Pakistan — 2nd ODI',
        team1: { name: 'England', shortName: 'ENG' },
        team2: { name: 'Pakistan', shortName: 'PAK' },
        startTime: now + 3 * hour, venue: 'Lord\'s Cricket Ground, London',
        format: 'ODI', status: 'upcoming',
        score1: '', score2: '', result: '',
      },
      {
        id: 'demo_3', name: 'South Africa vs New Zealand — Test Day 2',
        team1: { name: 'South Africa', shortName: 'RSA' },
        team2: { name: 'New Zealand', shortName: 'NZ' },
        startTime: now + 5 * hour, venue: 'Newlands, Cape Town',
        format: 'TEST', status: 'upcoming',
        score1: '', score2: '', result: '',
      },
      {
        id: 'demo_4', name: 'West Indies vs Sri Lanka — T20',
        team1: { name: 'West Indies', shortName: 'WI' },
        team2: { name: 'Sri Lanka', shortName: 'SL' },
        startTime: now + 8 * hour, venue: 'Kensington Oval, Bridgetown',
        format: 'T20', status: 'upcoming',
        score1: '', score2: '', result: '',
      },
      {
        id: 'demo_5', name: 'Bangladesh vs Afghanistan — ODI',
        team1: { name: 'Bangladesh', shortName: 'BAN' },
        team2: { name: 'Afghanistan', shortName: 'AFG' },
        startTime: now - 5 * hour, venue: 'Shere Bangla Stadium, Dhaka',
        format: 'ODI', status: 'finished',
        score1: '278/8 (50 ov)', score2: '241/10 (47.3 ov)',
        result: 'Bangladesh won by 37 runs',
      },
      {
        id: 'demo_6', name: 'Ireland vs Zimbabwe — T20',
        team1: { name: 'Ireland', shortName: 'IRE' },
        team2: { name: 'Zimbabwe', shortName: 'ZIM' },
        startTime: now - 24 * hour, venue: 'Harare Sports Club',
        format: 'T20', status: 'finished',
        score1: '156/6 (20 ov)', score2: '149/9 (20 ov)',
        result: 'Ireland won by 7 runs',
      },
    ];
  },

  // ── PLAYER LIST PER MATCH (Demo) ──
  getDemoPlayers(matchId) {
    const match = this.getDemoMatches().find(m => m.id === matchId);
    const teams = match ? [match.team1.name, match.team2.name] : ['Team A', 'Team B'];

    const roles = ['WK', 'BAT', 'BAT', 'BAT', 'ALL', 'ALL', 'ALL', 'BOWL', 'BOWL', 'BOWL', 'BOWL'];
    const wkEmoji = '🧤', batEmoji = '🏏', allEmoji = '⚡', bowlEmoji = '🎳';

    const roleEmoji = r => r === 'WK' ? wkEmoji : r === 'BAT' ? batEmoji : r === 'ALL' ? allEmoji : bowlEmoji;

    const names = {
      [teams[0]]: ['Rohit Sharma', 'Shubman Gill', 'Virat Kohli', 'KL Rahul', 'Hardik Pandya', 'Ravindra Jadeja', 'Axar Patel', 'Jasprit Bumrah', 'Mohammed Siraj', 'Kuldeep Yadav', 'Arshdeep Singh'],
      [teams[1]]: ['David Warner', 'Travis Head', 'Steve Smith', 'Marnus Labuschagne', 'Cameron Green', 'Glenn Maxwell', 'Matthew Wade', 'Pat Cummins', 'Mitchell Starc', 'Josh Hazlewood', 'Adam Zampa'],
    };

    const credits = [9.5, 9.0, 10.5, 8.5, 9.0, 9.0, 8.0, 10.0, 8.0, 8.0, 8.5,
                     9.0, 9.5, 10.0, 9.0, 8.5, 9.5, 8.0, 9.5, 9.0, 8.5, 8.0];

    const statuses = ['announced', 'announced', 'announced', 'announced', 'announced',
                      'announced', 'unannounced', 'announced', 'announced', 'announced', 'announced'];

    let players = [];
    let idx = 0;

    for (const team of Object.keys(names)) {
      (names[team] || []).forEach((name, i) => {
        const role = i === 0 && team === teams[0] ? 'WK' : roles[i] || 'BAT';
        players.push({
          id: `${matchId}_${team}_${i}`,
          name,
          team,
          role,
          roleEmoji: roleEmoji(role),
          credits: credits[idx] || 8.0,
          status: statuses[i] || 'unannounced',
          points: Math.floor(Math.random() * 80) + 20,
        });
        idx++;
      });
    }

    return players;
  }
};

// ── PLAYER STATS SEEDING (Demo only) ──
function seedDemoStats() {
  const stats = Store.get('pd11_player_stats');
  if (stats) return; // already seeded
  const players = Matches.getDemoPlayers('demo_1');
  const newStats = {};
  players.forEach(p => {
    newStats[p.id] = {
      isPlaying: Math.random() > 0.1,
      runs: Math.floor(Math.random() * 80),
      balls: Math.floor(Math.random() * 60) + 5,
      fours: Math.floor(Math.random() * 6),
      sixes: Math.floor(Math.random() * 3),
      isOut: Math.random() > 0.3,
      wickets: Math.random() > 0.6 ? Math.floor(Math.random() * 4) : 0,
      overs: Math.random() > 0.5 ? Math.floor(Math.random() * 4) + 1 : 0,
      economy: (Math.random() * 8 + 4).toFixed(1) * 1,
      maidens: Math.random() > 0.8 ? 1 : 0,
      catches: Math.random() > 0.7 ? 1 : 0,
      stumpings: 0,
      runOutDirect: 0,
      runOutIndirect: 0,
      dotBalls: Math.floor(Math.random() * 8),
    };
  });
  Store.set('pd11_player_stats', newStats);
}
