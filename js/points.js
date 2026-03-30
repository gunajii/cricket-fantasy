// ── PRIVATE DREAM11 — points.js ──

const Points = {
  rules: {
    run: 1,
    boundary4: 1,
    boundary6: 2,
    half_century: 8,
    century: 16,
    duck: -2,

    wicket: 25,
    lbwBowled: 8,
    dot_ball: 0.5,
    four_wickets: 4,
    five_wickets: 8,
    maiden: 4,

    catch: 8,
    stumping: 12,
    run_out_direct: 12,
    run_out_indirect: 6,

    playing: 4,
  },

  calcPlayerPoints(stats) {
    if (!stats) return 0;

    let pts = 0;

    if (stats.isPlaying)
      pts +=
        this.rules.playing;

    const runs =
      stats.runs || 0;

    const balls =
      stats.balls || 0;

    pts +=
      runs *
      this.rules.run;

    pts +=
      (stats.fours || 0) *
      this.rules.boundary4;

    pts +=
      (stats.sixes || 0) *
      this.rules.boundary6;

    if (runs >= 100)
      pts +=
        this.rules.century;

    else if (runs >= 50)
      pts +=
        this.rules.half_century;

    if (
      runs === 0 &&
      balls > 0 &&
      stats.isOut
    )
      pts +=
        this.rules.duck;

    const wickets =
      stats.wickets || 0;

    pts +=
      wickets *
      this.rules.wicket;

    pts +=
      (stats.catches || 0) *
      this.rules.catch;

    pts +=
      (stats.stumpings || 0) *
      this.rules.stumping;

    pts +=
      (stats.runOutDirect ||
        0) *
      this.rules.run_out_direct;

    pts +=
      (stats.runOutIndirect ||
        0) *
      this.rules.run_out_indirect;

    return Math.round(
      pts * 10
    ) / 10;
  },

  calcTeamPoints(team) {
    if (
      !team ||
      !team.players
    )
      return 0;

    const allStats =
      Store.get(
        'pd11_player_stats'
      ) || {};

    let total = 0;

    team.players.forEach(
      (p) => {
        const stats =
          allStats[p.id] ||
          null;

        let pts =
          this.calcPlayerPoints(
            stats
          );

        if (
          p.id ===
          team.captain
        )
          pts *= 2;

        else if (
          p.id ===
          team.viceCaptain
        )
          pts *= 1.5;

        total += pts;
      }
    );

    return Math.round(
      total * 10
    ) / 10;
  },

  getPlayerPoints(
    playerId
  ) {
    const allStats =
      Store.get(
        'pd11_player_stats'
      ) || {};

    const stats =
      allStats[playerId];

    if (!stats)
      return 0;

    return this.calcPlayerPoints(
      stats
    );
  },
};
