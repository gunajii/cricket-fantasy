# 🏏 Private Dream11

A lightweight, private fantasy cricket website for 12–15 friends. Built with pure HTML, CSS, and JavaScript. No backend. No server. Runs on GitHub Pages for free, 24×7.

---

## 🚀 Features

- **Match Center** — Live, Upcoming (next 24h only), and Past matches
- **Private Leagues** — Create leagues with a 6-char code; friends join by code
- **Team Builder** — Pick 11 players, set Captain (2×) & Vice-Captain (1.5×), stay under 100 credits
- **Leaderboard** — Real-time rankings per league
- **Team Comparison** — Side-by-side player and points comparison
- **Player Points** — Dream11 scoring rules auto-calculated
- **Player Status** — Announced / Unannounced / Substitute
- **No backend** — All data in localStorage; 12–15 private users

---

## 📁 Folder Structure

```
private-dream11/
├── index.html          ← Home (login + match center)
├── league.html         ← Create/join/manage leagues
├── team.html           ← Team builder (pitch view)
├── leaderboard.html    ← Rankings + player points
├── compare.html        ← Head-to-head team comparison
├── css/
│   └── style.css
├── js/
│   ├── app.js          ← Auth, storage, leagues, scoring
│   ├── matches.js      ← Match fetch, CricAPI, demo data
│   └── points.js       ← Points UI rendering
└── README.md
```

---

## 🛠️ Deployment on GitHub Pages (Step by Step)

### Step 1 — Create a GitHub account
If you don't have one: https://github.com/signup

### Step 2 — Create a new repository
1. Go to https://github.com/new
2. Repository name: `private-dream11`
3. Set to **Public** (GitHub Pages requires Public for free tier)
4. Click **Create repository**

### Step 3 — Upload files
**Option A: GitHub Web UI (easiest)**
1. Open your new repository
2. Click **Add file → Upload files**
3. Upload ALL files maintaining the folder structure:
   - `index.html`, `league.html`, `team.html`, `leaderboard.html`, `compare.html`
   - `css/style.css`
   - `js/app.js`, `js/matches.js`, `js/points.js`
4. Commit changes

**Option B: Git command line**
```bash
git clone https://github.com/YOUR_USERNAME/private-dream11.git
cd private-dream11
# Copy all files here
git add .
git commit -m "Initial commit"
git push
```

### Step 4 — Enable GitHub Pages
1. Go to your repository → **Settings**
2. Scroll to **Pages** section
3. Source: **Deploy from a branch**
4. Branch: `main` → folder: `/ (root)`
5. Click **Save**

### Step 5 — Your site is live!
Wait 1–2 minutes, then visit:
```
https://YOUR_USERNAME.github.io/private-dream11/
```

Share this URL with your 12–15 friends. That's it!

---

## 🔑 API Key Setup (for live match data)

Without an API key, the app shows **demo match data**. To get live cricket data:

1. Go to https://cricapi.com
2. Sign up for free (100 requests/day free tier)
3. Copy your API key
4. Open the app → click **⚙️ API Key** button on the home page
5. Paste your key and save

**Alternative free APIs:**
- https://rapidapi.com/search/cricket (search "cricket")
- https://www.cricketdata.org

> The API key is stored in your browser's localStorage. Each user sets their own key.

---

## 🎮 How to Use

### First time setup
1. Visit the GitHub Pages URL
2. Enter any username (2+ chars) + 4-6 digit PIN
3. New account is created automatically

### Create a league
1. Go to **Home** → find a match → click **Create League**
2. Name your league
3. Share the **6-character code** with friends

### Join a league
1. Click **Join League** anywhere
2. Enter the 6-char code your friend shared

### Build your team
1. Go to **Build Team** (or click from league page)
2. Select 11 players within 100 credits
3. Set Captain (C) — gets 2× points
4. Set Vice-Captain (VC) — gets 1.5× points
5. Click **Save Team**

### View leaderboard
- Go to **Leaderboard** → select your league
- Rankings update based on match stats

### Compare teams
- Go to **Compare** → select league → pick two players to compare

---

## 🏆 Dream11 Scoring Rules

| Action | Points |
|--------|--------|
| Run scored | +1 |
| Boundary (4) | +1 |
| Six | +2 |
| Half-century | +8 |
| Century | +16 |
| Duck (batsman) | -2 |
| Wicket | +25 |
| LBW / Bowled bonus | +8 |
| 4 wickets | +4 bonus |
| 5 wickets | +8 bonus |
| Maiden over | +4 |
| Dot ball | +0.5 |
| Catch | +8 |
| Stumping | +12 |
| Run out (direct) | +12 |
| Run out (indirect) | +6 |
| Playing XI | +4 |
| **Captain** | **2× points** |
| **Vice-Captain** | **1.5× points** |

**Strike Rate Bonus/Penalty** (min 10 balls):
- SR > 170: +6 | SR 150–170: +4 | SR 130–150: +2
- SR < 70: -6 | SR 70–80: -4 | SR 80–100: -2

**Economy Rate Bonus/Penalty** (min 2 overs):
- < 5: +6 | 5–6: +4 | 6–7: +2
- 10–11: -2 | 11–12: -4 | > 12: -6

---

## 🔒 Privacy & Data

- All data stored in **localStorage** (in each user's browser)
- No server, no database, no tracking
- Data is shared across users only through the league code system
- Private leagues — no one outside can join without the code
- Max 15 users (enforced by app)

---

## 🛠️ Customisation

### Change max users
In `js/app.js`, line 5:
```javascript
maxUsers: 15,  // Change to your preferred limit
```

### Change max credits
```javascript
maxCredits: 100,  // Change credit limit
```

### Use real API data
Set your CricAPI key via the ⚙️ button in the app.

---

## ❓ FAQ

**Q: Is it free?**
A: Yes, 100% free on GitHub Pages forever.

**Q: Will data be lost?**
A: Data lives in each user's browser localStorage. If they clear browser data, their data is lost. The site itself stays online via GitHub Pages.

**Q: Can I add more than 15 users?**
A: Yes, change `maxUsers` in `js/app.js`.

**Q: Does it work on mobile?**
A: Yes, fully responsive.

**Q: Do I need to install anything?**
A: No. Just a browser.

---

*Built for private use · Non-commercial · GitHub Pages hosted*
