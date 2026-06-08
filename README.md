# StyleAI — Your Personal Fashion Designer

A fully client-side fashion advisor app. No API keys. No backend. All local.  
**Trends accurate as of June 2026.**

---

## Demo Login
- **Username:** `demo`  
- **Password:** `demo123`

Or click **⚡ Demo Login** on the splash screen.

---

## Folder Structure

```
styleai/
├── index.html              ← Splash / Login / Register
├── css/
│   ├── base.css            ← Design tokens, global styles
│   ├── auth.css            ← Splash + auth screens + demo button
│   ├── app.css             ← Dashboard + shared app UI + stats
│   ├── wardrobe.css        ← Wardrobe grid + auto-detect banner
│   ├── outfit.css          ← Outfit result + saved looks
│   ├── shop.css            ← Shop suggestion cards
│   ├── hair.css            ← Hair & beard cards
│   └── tryon.css           ← Virtual try-on overlay UI
├── js/
│   ├── data.js             ← All 2026 trend data, cities, colors, hair DB
│   ├── auth.js             ← Login / register / demo account / sessions
│   ├── ui.js               ← Shared UI utilities
│   ├── image-analyze.js    ← Canvas-based color detection from photos
│   ├── fashion-engine.js   ← Outfit scoring engine (color theory, climate, body)
│   ├── tryon.js            ← Virtual try-on renderer
│   ├── dashboard.js        ← Dashboard stats + trends
│   ├── wardrobe.js         ← Wardrobe CRUD + auto-detect integration
│   ├── outfit.js           ← Outfit generation + swap + save
│   ├── shop.js             ← Shopping suggestions
│   ├── hair.js             ← Hair & beard recommendations
│   └── profile.js          ← Profile edit + body photo + style score
└── pages/
    ├── dashboard.html
    ├── wardrobe.html
    ├── outfit.html
    ├── shop.html
    ├── hair.html
    └── profile.html
```

---

## Features

| Feature | How it works |
|---|---|
| **Multi-user login** | LocalStorage, no server needed |
| **Demo account** | Pre-seeded `demo/demo123`, one tap login |
| **Auto-detect color** | Canvas pixel analysis on clothing photo — detects dominant color automatically |
| **Wardrobe** | 6 categories, photo upload, color/type/fit/pattern tagging |
| **Outfit engine** | Color theory + climate + body type + 2026 trends scoring |
| **Virtual try-on** | Upload your full-body photo → clothing badges overlaid on your photo |
| **Save looks** | Bookmark up to 20 outfit combinations |
| **Shop picks** | Gender-specific 2026 essentials, trending, and upgrades |
| **Hair & Beard** | 5 face shapes × 3 genders with grooming tips |
| **Style Score** | Dynamic score based on wardrobe diversity |

---

## Deploy to GitHub Pages

1. Create a new repo (e.g. `styleai`)
2. Push all files keeping the folder structure intact
3. **Settings → Pages → Source → main branch / root**
4. Live at: `https://yourusername.github.io/styleai/`

---

## Privacy
All data (wardrobe, photos, outfits) stored locally on your device using `localStorage`.  
Nothing is ever sent to any server.
