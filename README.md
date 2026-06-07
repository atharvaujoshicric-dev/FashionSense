# StyleAI — Your Personal Fashion Designer

A fully client-side fashion advisor app built for mobile browsers.  
No API keys. No backend. No subscriptions. Pure fashion intelligence.

**Trends accurate as of June 2026.**

---

## Features

- **User Accounts** — Local login/register with profile (gender, city, body type, face shape)
- **My Wardrobe** — Upload & categorise clothes by type, color, pattern, fit with photos
- **Outfit Suggester** — AI-style outfit combinations from your wardrobe using color theory + 2026 trends. Occasion-aware (Casual, Work, Party, Date, Gym, Ethnic, Beach). City/climate aware. Interactive swap to remix any piece.
- **What to Buy** — Curated 2026 picks across Essentials, Trending, and Upgrades — personalised by gender and wardrobe gaps.
- **Hair & Beard** — Face-shape-based hairstyle and beard recommendations from 2026 trend database, with grooming tips and product suggestions.

---

## Tech Stack

- Vanilla HTML, CSS, JavaScript — zero dependencies
- LocalStorage for user data and wardrobe
- Mobile-first design with bottom nav and sheet modals
- No external APIs, no backend

---

## Deploy to GitHub Pages

1. Create a new GitHub repository (e.g. `styleai`)
2. Upload all files maintaining the folder structure:
   ```
   styleai/
   ├── index.html
   ├── css/
   │   ├── base.css
   │   ├── auth.css
   │   ├── app.css
   │   ├── wardrobe.css
   │   ├── outfit.css
   │   ├── shop.css
   │   └── hair.css
   ├── js/
   │   ├── data.js
   │   ├── auth.js
   │   ├── ui.js
   │   ├── dashboard.js
   │   ├── wardrobe.js
   │   ├── fashion-engine.js
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
3. Go to **Settings → Pages → Source → main branch / root**
4. Your app will be live at `https://yourusername.github.io/styleai/`

---

## Usage

1. Open the app and tap **Create Account**
2. Fill in your profile (gender, city, body type, face shape)
3. Go to **Wardrobe** and add your clothes (photo optional)
4. Go to **Outfit** → choose occasion → tap **Generate Outfit**
5. Tap any slot to swap a piece and remix the outfit
6. Visit **Hair & Beard** and select your face shape for personalised recommendations
7. Check **What to Buy** for 2026 trend picks curated to your gender and wardrobe gaps

---

## Privacy

All data is stored locally on your device using `localStorage`.  
Nothing is sent to any server. Ever.
