// ── PRIVATE DREAM11 — points.js ──
// Points display, player stats rendering, auto-refresh

const PointsUI = {
  // Render player stats table for a league
  renderPlayerStats(players) {
    if (!players || !players.length) return '<div class="empty-state"><div class="empty-icon">📊</div><div class="empty-title">No player data</div></div>';
    const allStats = Store.get('pd11_player_stats') || {};
    return `
    <table class="leaderboard-table" style="width:100%">
      <thead>
        <tr>
          <th>Player</th>
          <th>Role</th>
          <th>Team</th>
          <th>Status</th>
          <th style="text-align:right">Points</th>
        </tr>
      </thead>
      <tbody>
        ${players.map(p => {
          const stats = allStats[p.id] || {};
          const pts = Points.calcPlayerPoints(stats);
          return `
          <tr>
            <td>
              <div class="flex gap-8" style="align-items:center">
                <span style="font-size:20px">${p.roleEmoji || '🏏'}</span>
                <span style="font-weight:700">${p.name}</span>
              </div>
            </td>
            <td><span class="filter-chip" style="cursor:default;padding:3px 8px">${p.role}</span></td>
            <td style="color:var(--text2);font-size:13px">${p.team}</td>
            <td><span class="player-status status-${p.status || 'unannounced'}">${p.status || 'Unannounced'}</span></td>
            <td style="text-align:right;font-family:'JetBrains Mono',monospace;font-weight:600;color:var(--green)">${pts}</td>
          </tr>`;
        }).join('')}
      </tbody>
    </table>`;
  },

  // Render player card for team builder
  renderPlayerCard(p, selected, captainId, vcId, onSelect, onCaptain, onVC) {
    const isSel = selected.some(s => s.id === p.id);
    const isCap = p.id === captainId;
    const isVC = p.id === vcId;
    let cls = 'player-card';
    if (isCap) cls += ' captain';
    else if (isVC) cls += ' vice-captain';
    else if (isSel) cls += ' selected';

    const pts = Points.getPlayerPoints(p.id);

    return `
    <div class="${cls}" data-player-id="${p.id}">
      <div class="player-icon">${p.roleEmoji || '🏏'}</div>
      <div class="player-info">
        <div class="player-name">
          ${p.name}
          ${isCap ? '<span class="captain-badge badge-c">C</span>' : ''}
          ${isVC ? '<span class="captain-badge badge-vc">VC</span>' : ''}
        </div>
        <div class="player-role">${p.role} · ${p.team}</div>
        <span class="player-status status-${p.status || 'unannounced'}">${p.status || 'Unannounced'}</span>
      </div>
      <div class="player-right">
        <div class="player-credits">${p.credits}</div>
        <div class="player-pts">${pts} pts</div>
        <div class="flex gap-8 mt-4" style="justify-content:flex-end">
          ${isSel ? `
            <button class="btn btn-sm ${isCap ? 'btn-primary' : 'btn-secondary'}" onclick="${onCaptain}('${p.id}')" title="Set Captain">C</button>
            <button class="btn btn-sm ${isVC ? 'btn-outline' : 'btn-secondary'}" onclick="${onVC}('${p.id}')" title="Set Vice-Captain">VC</button>
            <button class="btn btn-sm btn-danger" onclick="${onSelect}('${p.id}')">✕</button>
          ` : `
            <button class="btn btn-sm btn-secondary" onclick="${onSelect}('${p.id}')">+ Add</button>
          `}
        </div>
      </div>
    </div>`;
  },

  // Render selected team pitch view
  renderPitchView(selectedPlayers, captainId, vcId) {
    if (!selectedPlayers.length) {
      return `<div class="pitch-view" style="height:200px;display:flex;align-items:center;justify-content:center;color:rgba(255,255,255,0.3);font-size:14px;letter-spacing:1px">SELECT PLAYERS TO SEE PITCH VIEW</div>`;
    }
    // Sort by role
    const wk = selectedPlayers.filter(p => p.role === 'WK');
    const bat = selectedPlayers.filter(p => p.role === 'BAT');
    const all = selectedPlayers.filter(p => p.role === 'ALL');
    const bowl = selectedPlayers.filter(p => p.role === 'BOWL');

    const renderRow = (players, label) => {
      if (!players.length) return '';
      return `
      <div class="pitch-row-label">${label}</div>
      <div class="pitch-row">
        ${players.map(p => {
          const isCap = p.id === captainId;
          const isVC = p.id === vcId;
          return `
          <div class="pitch-player" title="${p.name}">
            <div class="pitch-player-icon ${isCap ? 'is-captain' : isVC ? 'is-vc' : 'selected'}">
              ${p.roleEmoji || '🏏'}
              ${isCap ? '<span class="pitch-badge badge-c">C</span>' : ''}
              ${isVC ? '<span class="pitch-badge badge-vc" style="background:var(--blue);color:white">VC</span>' : ''}
            </div>
            <div class="pitch-player-label">${p.name.split(' ')[0]}</div>
          </div>`;
        }).join('')}
      </div>`;
    };

    return `
    <div class="pitch-view">
      ${renderRow(wk, 'Wicket Keeper')}
      ${renderRow(bat, 'Batters')}
      ${renderRow(all, 'All-rounders')}
      ${renderRow(bowl, 'Bowlers')}
    </div>`;
  },

  // Render leaderboard rows
  renderLeaderboard(entries) {
    if (!entries.length) return `<div class="empty-state"><div class="empty-icon">🏆</div><div class="empty-title">No teams yet</div><div class="empty-subtitle">Create your team to join the leaderboard</div></div>`;

    const medals = ['🥇', '🥈', '🥉'];

    return `
    <table class="leaderboard-table" style="width:100%">
      <thead>
        <tr>
          <th>Rank</th>
          <th>Team / User</th>
          <th>Captain</th>
          <th style="text-align:right">Points</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        ${entries.map((e, i) => `
        <tr>
          <td class="rank-cell rank-${e.rank}">${medals[i] || '#' + e.rank}</td>
          <td>
            <div class="team-cell">
              <div class="team-avatar">${e.username[0].toUpperCase()}</div>
              <div>
                <div style="font-weight:700">${e.teamName || e.username + "'s Team"}</div>
                <div style="font-size:12px;color:var(--text3)">${e.username}</div>
              </div>
            </div>
          </td>
          <td>
            <div style="font-size:13px;color:var(--accent)">
              ${e.captain ? (e.players || []).find(p => p.id === e.captain)?.name || '—' : '—'}
              <span class="captain-badge badge-c" style="margin-left:4px">C</span>
            </div>
          </td>
          <td class="points-cell" style="text-align:right">${e.points}</td>
          <td>
            <a href="compare.html?league=${e.leagueCode || ''}&user1=${e.username}" class="btn btn-secondary btn-sm">Compare</a>
          </td>
        </tr>`).join('')}
      </tbody>
    </table>`;
  },

  // Render compare team box
  renderCompareTeam(entry) {
    if (!entry) return `<div class="empty-state"><div class="empty-icon">👤</div><div class="empty-title">Select a team</div></div>`;
    const allStats = Store.get('pd11_player_stats') || {};

    return `
    <div class="compare-team-box">
      <div class="compare-team-header">
        <div class="team-avatar" style="margin:0 auto 8px;width:44px;height:44px;font-size:20px">${entry.username[0].toUpperCase()}</div>
        <div class="compare-team-name">${entry.teamName || entry.username + "'s Team"}</div>
        <div class="compare-points">${entry.points} pts</div>
        <div style="font-size:12px;color:var(--text3);margin-top:4px">${entry.username}</div>
      </div>
      ${(entry.players || []).map(p => {
        const isCap = p.id === entry.captain;
        const isVC = p.id === entry.viceCaptain;
        const stats = allStats[p.id] || {};
        let pts = Points.calcPlayerPoints(stats);
        if (isCap) pts = Math.round(pts * 2 * 10) / 10;
        else if (isVC) pts = Math.round(pts * 1.5 * 10) / 10;
        return `
        <div class="compare-player-row ${isCap ? 'captain-row' : ''}">
          <span style="font-size:16px">${p.roleEmoji || '🏏'}</span>
          <div style="flex:1">
            <div style="font-weight:700;font-size:14px">
              ${p.name}
              ${isCap ? '<span class="captain-badge badge-c">C</span>' : ''}
              ${isVC ? '<span class="captain-badge badge-vc">VC</span>' : ''}
            </div>
            <div style="font-size:12px;color:var(--text3)">${p.role} · ${p.team}</div>
          </div>
          <div style="font-family:\'JetBrains Mono\',monospace;font-weight:600;color:var(--green);font-size:14px">${pts}</div>
        </div>`;
      }).join('')}
    </div>`;
  }
};
