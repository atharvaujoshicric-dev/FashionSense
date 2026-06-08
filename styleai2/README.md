# StyleAI — Your Personal Fashion Designer

Mobile-first fashion advisor · June 2026 Trends · No API keys · No backend · All local

---

## Demo Login
- **Username:** `demo`  
- **Password:** `demo123`

Or create your own account from the splash screen.

---

## What's New (v2)

- ✅ **Demo login** — instant access, no signup needed
- ✅ **Fixed: Create Account** button now works reliably
- ✅ **Fixed: Photos now save** to wardrobe correctly
- ✅ **Universal photo picker** — every photo upload offers Camera · Gallery · Files
- ✅ **Auto image compression** — photos compressed before saving (prevents storage issues)
- ✅ **Auto color detection** — upload a clothing photo, color is detected automatically
- ✅ **Virtual try-on** — add your full-body photo, see outfit badges overlaid on your photo
- ✅ **Shop reference images** — every shopping suggestion shows a real reference image
- ✅ **Save outfits** — bookmark your favourite outfit combinations

---

## Folder Structure

```
styleai/
├── index.html              ← Splash / Login / Register
├── css/
│   ├── base.css            ← Tokens, global styles, photo picker
│   ├── auth.css            ← Auth screens + demo button
│   ├── app.css             ← Dashboard + shared
│   ├── wardrobe.css
│   ├── outfit.css
│   ├── shop.css            ← 2-column image grid
│   ├── tryon.css           ← Virtual try-on UI
│   └── hair.css
└── js/
    ├── data.js             ← All trend data, colors, cities
    ├── auth.js             ← Auth + demo account seeding
    ├── ui.js               ← Shared utilities
    ├── photo-picker.js     ← Universal Camera/Gallery/Files picker
    ├── image-analyze.js    ← Canvas-based color detection
    ├── fashion-engine.js   ← Core outfit logic
    ├── tryon.js            ← Try-on renderer
    ├── shop-images.js      ← Unsplash reference images
    ├── dashboard.js
    ├── wardrobe.js
    ├── outfit.js
    ├── shop.js
    ├── hair.js
    └── profile.js
└── pages/
    ├── dashboard.html
    ├── wardrobe.html
    ├── outfit.html
    ├── shop.html
    ├── hair.html
    └── profile.html
```

---

## GitHub Pages Deploy

1. Create new GitHub repo, upload all files maintaining folder structure
2. Settings → Pages → Source → main branch / root
3. Live at `https://yourusername.github.io/reponame/`

---

## Privacy

Everything is stored in `localStorage` on your device only. Nothing is sent anywhere.
