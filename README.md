# Nirapod Survey — Everyday Personal Safety & Emergency HCI Study

A self-contained web app version of the Nirapod personal safety survey (streets, parking lots, campus, home, public transit, etc.). No framework, no build step — just HTML/CSS/JS. Every submission lands as a new row in a Google Sheet via a Google Apps Script backend.

```
nirapod-survey/
├── index.html      the page
├── style.css       styling
├── script.js       survey logic + submission UI
├── Code.gs         paste this into Google Apps Script
├── netlify/functions/submit.js  secure server-side proxy to Apps Script
├── netlify.toml    Netlify config
└── README.md
```

## Step 1 — Create the Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) and create a new, blank sheet.
2. Name it whatever you like, e.g. "Nirapod Responses". You don't need to add any columns — the script creates them automatically on the first submission.

## Step 2 — Add the Apps Script backend

1. In the Sheet, go to **Extensions → Apps Script**.
2. Delete the placeholder `function myFunction() {}` code.
3. Open `Code.gs` from this project, copy all of it, and paste it into the Apps Script editor.
4. Click the **Save** icon (or `Ctrl+S` / `Cmd+S`).

## Step 3 — Deploy the script as a Web App

1. In the Apps Script editor, click **Deploy → New deployment**.
2. Click the gear icon next to "Select type" and choose **Web app**.
3. Set:
   - **Execute as:** Me
   - **Who has access:** Anyone
4. Click **Deploy**. Google will ask you to authorize the script (it's your own script, acting on your own Sheet) — approve it.
5. Copy the **Web app URL** it gives you. It looks like:
   ```
   https://script.google.com/macros/s/AKfycb.../exec
   ```
   Keep this tab open — you'll need to redeploy (Deploy → Manage deployments → Edit → New version) if you ever change `Code.gs`.

## Step 4 — Connect Netlify securely to your Sheet

1. In your Netlify site dashboard, open **Site configuration → Environment variables**.
2. Add a new variable:
   - **Key:** `GOOGLE_APPS_SCRIPT_URL`
   - **Value:** the Web App URL you copied in Step 3 (`https://script.google.com/macros/s/.../exec`)
3. Redeploy the site so the serverless function picks up the value.

The frontend now submits to a Netlify Function, so the Google Apps Script URL is not exposed in the browser UI.

## Step 5 — Test it locally (optional)

You can open `index.html` directly in a browser, or serve the folder locally:

```bash
cd nirapod-survey
python3 -m http.server 8080
```

Then visit `http://localhost:8080`, fill out the survey, and check that a new row appears in your Google Sheet.

## Step 6 — Deploy to Netlify

**Option A — drag and drop (fastest):**
1. Go to [app.netlify.com/drop](https://app.netlify.com/drop).
2. Drag the whole `nirapod-survey` folder onto the page.
3. Netlify gives you a live URL immediately.

**Option B — Git-based deploy (recommended for updates later):**
1. Push this folder to a new GitHub repository.
2. In Netlify: **Add new site → Import an existing project**, connect the repo.
3. Build settings: leave **Build command** empty and set **Publish directory** to `.` (this is already set in `netlify.toml`).
4. Deploy.

**Option C — Netlify CLI:**
```bash
npm install -g netlify-cli
cd nirapod-survey
netlify deploy --prod
```

## Step 7 — Verify end to end

1. Open your live Netlify URL.
2. Complete the survey.
3. Confirm a new row appears in the "Responses" tab of your Google Sheet, with a header row for each question ID plus a `submitted_at` timestamp.

## Customizing

- **Add/edit/remove questions:** everything lives in the `SECTIONS` array at the top of `script.js` — each question is one object with an `id`, `type` (`radio`, `checkbox`, `likert`, or `text`), `title`, and `options` where relevant. No HTML editing needed.
- **Colors/fonts:** edit the CSS variables at the top of `style.css`.
- **Analyzing results:** since everything lands in a normal Google Sheet, you can pivot, chart, or export to CSV directly from Sheets.

## Notes on privacy

The form collects no name, phone number, or account identifier — only the answers themselves plus a submission timestamp, matching the original survey's anonymity guarantee.
