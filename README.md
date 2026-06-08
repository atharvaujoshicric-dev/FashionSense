# StyleAI — Your Personal Fashion Designer

Mobile-first fashion advisor. No API keys. No backend. No subscriptions.  
All data stored privately on your device.  
**Trends accurate as of June 2026.**

---

## Quick Start

### Demo Account
- **Username:** `demo`  
- **Password:** `demo123`  

Or tap **⚡ Demo Login** on the splash screen — no signup needed.

---

## Features

| Feature | Details |
|---|---|
| 👤 User Accounts | Local login/register. Multi-user on same device. |
| 👕 My Wardrobe | Add clothes with photo. **Color & type auto-detected from photo.** |
| 📷 Universal Photo Picker | Every upload supports **Camera · Gallery · Files** |
| ✨ Outfit Suggester | Color-theory + climate + body-type + 2026 trends |
| 🪞 Virtual Try-On | Add your full-body photo → see outfit pieces overlaid on you |
| 🔖 Save Looks | Save favourite outfit combinations |
| 🛍️ What to Buy | Gap analysis + gender-specific 2026 trend picks |
| 💈 Hair & Beard | Face-shape recommendations for 5 shapes × 3 genders |
| 🌍 City-Aware | 50+ cities with climate-adjusted outfit suggestions |

---

## Folder Structure

```
styleai/
├── index.html              ← Splash / Login / Register
├── css/
│   ├── base.css            ← Design tokens + photo picker + global
│   ├── auth.css            ← Auth screens + demo button
│   ├── app.css             ← Dashboard + shared
│   ├── wardrobe.css        ← Wardrobe grid + auto-detect UI
│   ├── outfit.css          ← Outfit page + saved looks
│   ├── shop.css
│   ├── hair.css
│   └── tryon.css           ← Virtual try-on UI
├── js/
│   ├── data.js             ← 2026 trend data, cities, colors, hair DB
│   ├── auth.js             ← Auth + demo account seeding
│   ├── ui.js               ← Shared utilities, toast, pills
│   ├── photo-picker.js     ← Universal camera/gallery/files picker
│   ├── image-analyze.js    ← Canvas-based color detection (no API)
│   ├── fashion-engine.js   ← Core outfit intelligence
│   ├── tryon.js            ← Virtual try-on renderer
│   ├── dashboard.js
│   ├── wardrobe.js
│   ├── outfit.js
│   ├── shop.js
│   ├── hair.js
│   └── profile.js
└── pages/
    ├── dashboard.html
    ├── wardrobe.html
    ├── outfit.html
    ├── shop.html
    ├── hair.html
    └── profile.html
```

---

## Deploy on GitHub Pages

1. Create a new GitHub repo (e.g. `styleai`)
2. Upload **all files** maintaining the folder structure above
3. Go to **Settings → Pages → Source → main branch / root**
4. Live at: `https://yourusername.github.io/styleai/`

> **Tip:** Use GitHub Desktop or drag-and-drop upload in the GitHub web UI for easiest upload.

---

## Privacy

All data (accounts, wardrobe, photos, outfits) is stored in `localStorage` on your device only.  
Nothing is transmitted to any server. Ever.
