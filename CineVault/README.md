# CineVault

A responsive, multi-page student project for discovering TV series and keeping a personal watchlist. The catalog uses TVMaze; account, theme, search, and watchlist data stay in this browser with `localStorage`.

**Author:** Alimurat Nurbakyt  
**Group:** SE-2512

## Pages

- `index.html` — introduction and live featured shelf
- `catalog.html` — TVMaze search and genre filters
- `details.html` — TVMaze synopsis and save action
- `watchlist.html` — saved shows
- `about.html` — project goal, audience, and workflow
- `contact.html` — validated contact form saved locally
- `signup.html`, `login.html`, `profile.html` — browser-only account demonstration

## Run locally

Open a terminal in this folder and run:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`. A local server is needed for reliable API requests; opening the HTML file directly may block `fetch()`.

## Demo notes

- Search TVMaze by title, then filter results by genre. The last search is remembered.
- Save shows from the home page, catalog, or details page. The watchlist persists in the browser.
- Theme, demo accounts, and contact notes are also stored locally.
- This is a front-end class demonstration, not real authentication. Passwords are stored in plain text in this browser. Use a unique demo password and never enter a password you use elsewhere.

## Hosting and submission

Publish the folder with GitHub Pages, Netlify, or Vercel. Add the live URL and repository URL to `CineVault_SE-2512_Links.txt` before submitting. The report should include final site screenshots after publication.
