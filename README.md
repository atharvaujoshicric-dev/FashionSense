# StyleAI v3 — Your Personal Fashion Designer

**Demo login:** username `demo` · password `demo123`

---

## What's New in v3 (All 10 Features)

1. **📅 Outfit Calendar** — Log daily outfits, plan future looks, track streaks, view history
2. **📊 Style Score & Analysis** — 0-100 score, category coverage bars, occasion coverage, color palette chart
3. **🌤️ Weather Integration** — Real-time weather via Open-Meteo (no key), outfit advice per temperature
4. **↗ Share Card** — Generate a lookbook-style card image, save to camera roll or share via WhatsApp/Instagram
5. **🤝 What Goes With This?** — Pick any item, see everything in your wardrobe that pairs with it
6. **🧳 Packing List** — Enter destination + days + trip type → smart packing list from your wardrobe
7. **🔍 Color Gap Finder** — Shows which colors would unlock the most new outfit combinations
8. **🎯 First-Time Onboarding** — 4-step walkthrough for new users
9. **☀️/🌙 Dark/Light Theme** — Toggle in More page or dashboard
10. **🔍 Wardrobe Search & Sort** — Search by color/type/pattern, sort by newest/oldest/category/color

---

## Folder Structure

```
styleai/
├── index.html
├── css/
│   ├── base.css        ← tokens, global, light theme vars
│   ├── auth.css
│   ├── app.css
│   ├── features.css    ← NEW: calendar, analysis, packing, weather, search
│   ├── wardrobe.css
│   ├── outfit.css
│   ├── shop.css
│   ├── tryon.css
│   └── hair.css
├── js/
│   ├── data.js             ← trend data, colors, cities
│   ├── auth.js             ← login, register, demo account
│   ├── ui.js               ← shared utilities
│   ├── theme.js            ← NEW: dark/light toggle
│   ├── weather.js          ← NEW: Open-Meteo weather
│   ├── onboarding.js       ← NEW: first-time walkthrough
│   ├── calendar.js         ← NEW: outfit calendar & history
│   ├── analysis.js         ← NEW: style score & insights
│   ├── packing.js          ← NEW: trip packing list
│   ├── share-card.js       ← NEW: canvas share card
│   ├── photo-picker.js     ← universal camera/gallery/files
│   ├── image-analyze.js    ← auto color detection
│   ├── fashion-engine.js   ← outfit generation logic
│   ├── tryon.js            ← virtual try-on
│   ├── shop-images.js      ← Unsplash reference images
│   ├── dashboard.js
│   ├── wardrobe.js         ← + search & sort
│   ├── outfit.js           ← + share + weather
│   ├── shop.js
│   ├── hair.js
│   └── profile.js
└── pages/
    ├── dashboard.html      ← + weather + new nav
    ├── wardrobe.html       ← + search bar
    ├── outfit.html         ← + weather bar + share
    ├── analysis.html       ← NEW
    ├── calendar.html       ← NEW
    ├── packing.html        ← NEW
    ├── more.html           ← NEW hub page
    ├── shop.html
    ├── hair.html
    └── profile.html
```

## GitHub Pages Deploy
1. Upload all files keeping folder structure
2. Settings → Pages → Source → main / root
3. Open at `https://yourusername.github.io/reponame/`

## Privacy
All data stored in `localStorage` on your device only.
Weather uses Open-Meteo public API (no account needed, no data sent).
