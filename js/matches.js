// ── PRIVATE DREAM11 — matches.js ──

const Matches = {
  apiKey: () =>
    Store.get('pd11_api_key') ||
    'ccb48ccf-62f4-48c2-b868-87289ce92ae9',

  baseUrl: 'https://api.cricapi.com/v1',

  cache: null,
  cacheTime: 0,
  cacheTTL: 120000,

  // ─────────────────────────────
  // FETCH MATCHES
  // ─────────────────────────────

  async fetchAll() {
    if (
      this.cache &&
      Date.now() - this.cacheTime <
        this.cacheTTL
    ) {
      return this.cache;
    }

    const key = this.apiKey();

    try {
      const res = await fetch(
        `${this.baseUrl}/currentMatches?apikey=${key}&offset=0`
      );

      const data =
        await res.json();

      if (
        data.status !==
        'success'
      ) {
        throw new Error(
          data.reason
        );
      }

      const matches =
        (data.data || []).map(
          (m) =>
            this.normalise(m)
        );

      this.cache = matches;
      this.cacheTime =
        Date.now();

      return matches;
    } catch (e) {
      console.warn(
        'API failed — using demo'
      );

      return this.getDemoMatches();
    }
  },

  // ─────────────────────────────
  // NORMALISE DATA
  // ─────────────────────────────

  normalise(m) {
    const start =
  m.dateTimeGMT
    ? new Date(
        m.dateTimeGMT + "Z"
      ).getTime()
    : 0;

    let status =
      'upcoming';

    if (m.matchEnded)
      status =
        'finished';
    else if (
      m.matchStarted
    )
      status = 'live';

    const teams =
      m.teams ||
      [m.t1, m.t2];

    return {
      id: m.id,

      name: m.name,

      seriesName:
        m.seriesName ||
        m.series_id ||
        '',

      startTime: start,

      venue:
        m.venue || '',

      format:
        (
          m.matchType ||
          'T20'
        ).toUpperCase(),

      status,

      team1: {
        name: teams[0],
        shortName:
          this.shortName(
            teams[0]
          ),
      },

      team2: {
        name: teams[1],
        shortName:
          this.shortName(
            teams[1]
          ),
      },
    };
  },

  shortName(name) {
    if (!name)
      return 'TBD';

    const words =
      name
        .trim()
        .split(' ');

    if (
      words.length === 1
    )
      return name
        .substring(0, 3)
        .toUpperCase();

    return words
      .map(
        (w) => w[0]
      )
      .join('')
      .substring(0, 3)
      .toUpperCase();
  },

  // ─────────────────────────────
  // IPL FILTER
  // ─────────────────────────────

  isIPL(match) {
    if (!match)
      return false;

    const name =
      (
        match.name || ''
      ).toLowerCase();

    const series =
      (
        match.seriesName ||
        ''
      ).toLowerCase();

    return (
      name.includes('ipl') ||
      name.includes(
        'indian premier league'
      ) ||
      series.includes(
        'ipl'
      ) ||
      series.includes(
        'indian premier league'
      )
    );
  },

  // ─────────────────────────────
  // FILTERS
  // ─────────────────────────────

  getLive(all) {
    return all.filter(
      (m) =>
        m.status ===
          'live' &&
        this.isIPL(m)
    );
  },

  getUpcoming24h(all) {
    return all.filter(
      (m) =>
        m.status ===
          'upcoming' &&
        this.isIPL(m) &&
        Time.isWithin24h(
          m.startTime
        )
    );
  },

  getFinished(all) {
    return all
      .filter(
        (m) =>
          m.status ===
            'finished' &&
          this.isIPL(m)
      )
      .slice(0, 10);
  },

  // ─────────────────────────────
  // MATCH CARD
  // ─────────────────────────────

  renderCard(match) {
    const isUpcoming =
      match.status ===
      'upcoming';

    let actions = '';

    if (isUpcoming) {
      actions = `
        <button class="btn btn-primary btn-sm"
          onclick="HomeActions.createLeague(
            '${match.id}',
            '${this.escapeHtml(match.name)}'
          )">
          🏆 Create League
        </button>
      `;
    }

    return `
      <div class="match-card">
        <div>
          ${match.team1.shortName}
          vs
          ${match.team2.shortName}
        </div>

        <div>
          ${Time.formatMatch(
            match.startTime
          )}
        </div>

        <div>
          ${actions}
        </div>
      </div>
    `;
  },

  escapeHtml(str) {
    return String(str)
      .replace(
        /'/g,
        "\\'"
      )
      .replace(
        /"/g,
        '&quot;'
      );
  },

  // ─────────────────────────────
  // PLAYERS
  // ─────────────────────────────

  async fetchPlayers(
    matchId
  ) {
    const key =
      this.apiKey();

    try {
      const res =
        await fetch(
          `${this.baseUrl}/match_squad?apikey=${key}&id=${matchId}`
        );

      const data =
        await res.json();

      if (
        data.status !==
          'success' ||
        !data.data
      ) {
        throw new Error(
          'No players'
        );
      }

      return data.data.map(
        (p) => ({
          id: p.id,
          name: p.name,
          team:
            p.teamName,
          role:
            this.mapRole(
              p.role
            ),
          roleEmoji:
            this.roleEmoji(
              p.role
            ),
          credits: 8,
          status:
            p.playing
              ? 'announced'
              : 'unannounced',
          points: 0,
        })
      );
    } catch (e) {
      console.warn(
        'Player API failed'
      );

      return this.getDemoPlayers(
        matchId
      );
    }
  },

  mapRole(role) {
    if (!role)
      return 'BAT';

    const r =
      role.toLowerCase();

    if (
      r.includes(
        'keeper'
      )
    )
      return 'WK';

    if (
      r.includes(
        'bowl'
      )
    )
      return 'BOWL';

    if (
      r.includes(
        'all'
      )
    )
      return 'ALL';

    return 'BAT';
  },

  roleEmoji(role) {
    if (
      role === 'WK'
    )
      return '🧤';

    if (
      role === 'BOWL'
    )
      return '🎳';

    if (
      role === 'ALL'
    )
      return '⚡';

    return '🏏';
  },

  // ─────────────────────────────
  // DEMO PLAYERS
  // ─────────────────────────────

  getDemoPlayers(
    matchId
  ) {
    const teams = [
      'Team A',
      'Team B',
    ];

    const roles = [
      'WK',
      'BAT',
      'BAT',
      'BAT',
      'ALL',
      'ALL',
      'ALL',
      'BOWL',
      'BOWL',
      'BOWL',
      'BOWL',
    ];

    let players = [];

    teams.forEach(
      (team) => {
        roles.forEach(
          (role, i) => {
            players.push({
              id:
                matchId +
                '_' +
                team +
                '_' +
                i,

              name:
                team +
                ' Player ' +
                (i + 1),

              team,

              role,

              roleEmoji:
                this.roleEmoji(
                  role
                ),

              credits: 8,

              status:
                'unannounced',

              points: 0,
            });
          }
        );
      }
    );

    return players;
  },
};
