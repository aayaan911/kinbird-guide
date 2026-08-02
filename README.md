# KINBIRD OS

**Aviary Command System for KinBird Aviary — Fischer's lovebird breeding, Dhaka, Bangladesh.**

A single-file, self-contained operations brain that runs entirely in the browser. No server, no login, no running cost. Built to help a ~10-pair aviary out-produce competitors three times its size, through data and timing rather than resources.

### Live

- **OS dashboard:** https://aayaan911.github.io/kinbird-guide/system.html
- **Electrician install guide:** https://aayaan911.github.io/kinbird-guide/

---

## What it does

| Module | Function |
|---|---|
| **BRAIN** | Daily auto-briefing + retrieval chat over a verified knowledge base. Cites sources, refuses to invent numbers. |
| **WEATHER** | Live Dhaka conditions + 3-day forecast + 15-city regional network, translated into device orders (exhaust, fans, lights, feed, supplements). |
| **Autonomous agents** | In-browser agents that self-run: Weather, Front-watch, Drought/El Niño, Egg-watch, Season. |
| **SEASON** | Aug-May month-by-month plan with climate normals, light settings, and action lists. Countdowns to season start/end. |
| **EGG LAB** | Egg weight-loss analyser. Enter weights, get a hold/raise/lower humidity verdict against the 13-16% target. |
| **LOG** | Pairs, clutches, egg weights, room readings. Computes fertility %, dead-in-shell %, hatch %, fledge %, auto-flags weak pairs. |
| **TASKS / DAILY** | Aviary task tracker and daily operations checklist. |
| **TEACH** | Add your own verified knowledge; the brain remembers it. |
| **SCIENCE** | Verified breeding science + applied war doctrine (Napoleon, Alexander, Khalid ibn al-Walid). |
| **RESEARCH** | Citation library: every source the OS is built on, clickable. |

---

## How the autonomous layer works

Everything updates itself in the browser, with no Claude and no backend:

- Weather refreshes every **15 minutes** from the [Open-Meteo API](https://open-meteo.com) (free, no key, CORS-enabled).
- The daily briefing and all agents recompute from that live data.
- Progress, logs and taught knowledge persist in `localStorage`.

**Boundary:** a browser page can only auto-pull APIs that allow cross-origin access. It cannot scrape closed research or ENSO bulletins by itself, so those are curated in the RESEARCH tab and refreshed on weekly updates.

---

## Season intelligence

- Best window: **October to March**, peak **November to February**.
- **El Niño 2026-27:** a strong El Niño (97-100% probability through winter) suppresses Bangladesh rainfall, so this season runs drier than normal. The OS watches for this and flips guidance toward *raising* humidity and cutting exhaust when eggs risk over-drying.

---

## Stack

- Pure HTML + CSS + vanilla JavaScript, one file (`system.html`).
- Data source: Open-Meteo. Climate normals: Foreca / World Weather & Climate (1990-2020).
- Optional: Cloudflare Worker (`worker.js`) for cross-device sync and grounded AI chat. Setup in `CLOUDFLARE-SETUP.md`.
- Hosting: GitHub Pages (auto-deploy on push). Cloudflare Pages compatible.

---

## Files

- `system.html` — the OS
- `index.html` — mobile electrician install guide
- `worker.js` — optional Cloudflare Worker (sync + grounded AI)
- `CLOUDFLARE-SETUP.md` — deploy guide for the optional cloud layer

---

*Built on verified data. Not affiliated with SONOFF, Open-Meteo, or any cited source.*
