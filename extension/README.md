# GradeItRight Sync (Chrome Extension)

One-click sync of Infinite Campus grades into your GradeItRight dashboard.
No background worker, no scheduling — you open your gradebook, click Sync,
done.

## Files

| File | Purpose |
| --- | --- |
| `manifest.json` | Manifest V3 definition |
| `popup.html` / `popup.js` | Popup UI and the three states (not on IC / ready / synced) |
| `content-script-ic.js` | Reads grades from Infinite Campus's own portal JSON API, including weighted category breakdowns |
| `sync.js` | POSTs the parsed grades to `/api/extension-sync` |
| `auth.js` | Runs on GradeItRight pages; copies the Supabase session into `chrome.storage` |

## Load the extension

1. Open `chrome://extensions` and enable **Developer mode** (top right).
2. Click **Load unpacked** and select this `extension/` folder.
3. After editing any file, click the reload icon (⟳) on the extension's card.

## Test it

1. Start the app (`npm run dev`) and sign into GradeItRight at
   `http://localhost:3000/login`. Loading any page while signed in stores
   your session token for the extension (via `auth.js`).
2. Navigate to your Infinite Campus gradebook page (the view that shows
   assignments with scores like `45/50`).
3. Click the extension icon. You should see **"We found your Infinite Campus
   gradebook. Ready to sync your grades?"** — click **Sync Now**.

### Confirm the content script is reading grades

Open DevTools (F12) on the Infinite Campus tab and check the Console. On
sync you'll see a line like:

```
[GradeItRight] scraped [{ name: "Algebra II", assignments: [...] }]
```

If the array is empty, you're not on a page with visible grade tables.

### Verify the sync reached Supabase

Open your GradeItRight dashboard — matched assignments show their updated
scores, and any classes/assignments that didn't already exist are created
automatically. The popup reports how many were updated vs. newly added.
Each successful sync also writes a row to the `syncs` table.

Notes:
- Sync is rate limited to **once per hour** per user (server-side).
- Classes/assignments that don't match an existing one by name are
  **auto-created** — review them on your dashboard afterward, since scraped
  names may not always be exactly what you'd choose yourself.
- If Infinite Campus reports a class as using weighted categories (its
  gradebook actually calculates the grade from category weights, not just
  raw points), the class is created — or upgraded, if it already exists as
  points-based with no categories set up yet — as a **weighted** class, with
  matching categories and their weight percentages created automatically.
  Classes where IC's categories are just organizational labels (not actually
  used to compute the grade) stay points-based, matching how IC itself
  grades them.

## Before Chrome Web Store submission

- Replace the placeholder navy icons in `icons/` with real artwork.
- Change `APP_URL` in `sync.js` to the production URL.
- Change the `auth.js` content-script match in `manifest.json` from
  `http://localhost:3000/*` to the production domain.
- Zip the contents of this folder (not the folder itself) and upload.
