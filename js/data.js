/* ==========================================
   DATA.JS — Static Data & Constants
   StyleAI · June 2026
   ========================================== */

const CITIES = [
  // India
  "Mumbai", "Delhi", "Bengaluru", "Hyderabad", "Chennai", "Kolkata",
  "Pune", "Ahmedabad", "Jaipur", "Surat", "Lucknow", "Chandigarh",
  "Indore", "Bhopal", "Nagpur", "Kochi", "Guwahati",
  // International
  "New York", "London", "Paris", "Tokyo", "Dubai", "Singapore",
  "Sydney", "Toronto", "Berlin", "Milan", "Barcelona", "Amsterdam",
  "Hong Kong", "Seoul", "Bangkok", "Mumbai", "São Paulo"
];

// Climate zones by city
const CITY_CLIMATE = {
  "Mumbai": "tropical", "Delhi": "semi-arid", "Bengaluru": "temperate",
  "Hyderabad": "semi-arid", "Chennai": "tropical", "Kolkata": "tropical",
  "Pune": "temperate", "Ahmedabad": "semi-arid", "Jaipur": "arid",
  "Chandigarh": "continental", "Kochi": "tropical", "Guwahati": "subtropical",
  "New York": "continental", "London": "oceanic", "Paris": "oceanic",
  "Tokyo": "temperate", "Dubai": "desert", "Singapore": "tropical",
  "Sydney": "temperate", "Toronto": "continental", "Berlin": "continental",
  "Milan": "temperate", "Barcelona": "mediterranean",
  "Hong Kong": "subtropical", "Seoul": "continental", "Bangkok": "tropical"
};

const COLORS = [
  { name: "white", hex: "#f5f5f0" },
  { name: "black", hex: "#1a1a1a" },
  { name: "navy", hex: "#1f3a5f" },
  { name: "grey", hex: "#8a8a8a" },
  { name: "beige", hex: "#d4b896" },
  { name: "olive", hex: "#6b7c3a" },
  { name: "burgundy", hex: "#7c2035" },
  { name: "sky blue", hex: "#5ba3d9" },
  { name: "brown", hex: "#7a4f2e" },
  { name: "khaki", hex: "#c3aa77" },
  { name: "rust", hex: "#c0522a" },
  { name: "forest green", hex: "#2d5a3d" },
  { name: "charcoal", hex: "#3a3a3a" },
  { name: "cream", hex: "#f0e6d0" },
  { name: "blush", hex: "#e8a8a8" },
  { name: "mustard", hex: "#d4a017" },
  { name: "coral", hex: "#e87060" },
  { name: "mint", hex: "#78c5a8" }
];

const SUBTYPES_BY_CATEGORY = {
  tops: ["T-Shirt", "Shirt (Formal)", "Shirt (Casual)", "Polo", "Henley", "Sweatshirt", "Hoodie", "Tank Top", "Linen Shirt", "Overshirt"],
  bottoms: ["Jeans (Slim)", "Jeans (Straight)", "Chinos", "Trousers (Formal)", "Shorts", "Joggers", "Cargo Pants", "Linen Pants", "Cargo Shorts"],
  outerwear: ["Blazer", "Bomber Jacket", "Denim Jacket", "Leather Jacket", "Windbreaker", "Overcoat", "Puffer Jacket", "Shacket"],
  footwear: ["Sneakers (Low)", "Sneakers (High)", "Loafers", "Oxford Shoes", "Derby Shoes", "Chelsea Boots", "Sandals", "Slippers", "Running Shoes"],
  accessories: ["Watch", "Belt", "Sunglasses", "Cap / Hat", "Backpack", "Tote Bag", "Wallet", "Scarf", "Bracelet", "Necklace"],
  ethnic: ["Kurta", "Sherwani", "Pathani Suit", "Dhoti", "Saree", "Salwar Kameez", "Lehenga", "Anarkali"]
};

// June 2026 Trending items
const TRENDS_2026 = [
  { emoji: "🥻", label: "Silhouette", name: "Relaxed Wide Leg", desc: "Fluid trousers dominating street style" },
  { emoji: "🧥", label: "Outerwear", name: "Shacket Layers", desc: "Shirt-jacket hybrids as statement pieces" },
  { emoji: "👟", label: "Footwear", name: "Chunky Loafers", desc: "Platform loafers replacing sneakers" },
  { emoji: "🎨", label: "Color", name: "Warm Terracotta", desc: "Earth tones and burnt oranges lead 2026" },
  { emoji: "👕", label: "Top", name: "Linen Everything", desc: "Breathable linen shirts & sets trending hard" },
  { emoji: "🕶️", label: "Accessory", name: "Shield Sunglasses", desc: "Wraparound futuristic frames back strong" },
  { emoji: "🧤", label: "Texture", name: "Suede & Nubuck", desc: "Tactile suede across jackets & shoes" },
  { emoji: "🖤", label: "Pattern", name: "Tonal Monochrome", desc: "Head-to-toe single color palettes" },
  { emoji: "🌿", label: "Material", name: "Organic Cotton", desc: "Sustainable basics with premium feel" },
  { emoji: "💍", label: "Jewellery", name: "Bold Silver", desc: "Chunky silver rings & chains for all genders" }
];

// COLOR THEORY — what goes with what
const COLOR_PAIRS = {
  "white":        ["navy", "black", "grey", "beige", "sky blue", "forest green", "burgundy"],
  "black":        ["white", "grey", "burgundy", "navy", "beige", "rust", "cream"],
  "navy":         ["white", "beige", "grey", "khaki", "cream", "sky blue"],
  "grey":         ["white", "black", "navy", "burgundy", "sky blue", "charcoal"],
  "beige":        ["white", "navy", "brown", "olive", "forest green", "rust"],
  "olive":        ["beige", "white", "brown", "khaki", "rust", "cream"],
  "burgundy":     ["white", "grey", "beige", "black", "cream"],
  "sky blue":     ["white", "navy", "grey", "beige"],
  "brown":        ["beige", "white", "cream", "olive", "khaki"],
  "khaki":        ["white", "navy", "olive", "brown", "forest green"],
  "rust":         ["beige", "olive", "black", "cream", "brown"],
  "forest green": ["beige", "white", "khaki", "brown", "cream"],
  "charcoal":     ["white", "grey", "black", "beige"],
  "cream":        ["navy", "brown", "forest green", "olive", "rust"],
  "blush":        ["white", "grey", "beige", "cream"],
  "mustard":      ["navy", "black", "forest green", "brown"],
  "coral":        ["white", "navy", "beige", "cream"],
  "mint":         ["white", "navy", "grey", "beige"]
};

// OUTFIT RULES by occasion
const OCCASION_RULES = {
  casual: {
    name: "Casual",
    tops: ["tops"],
    bottoms: ["bottoms"],
    outerwear: true,
    footwear: true,
    vibe: ["relaxed", "everyday", "comfortable"],
    trendScore: 0.8
  },
  work: {
    name: "Work / Office",
    tops: ["tops"],
    bottoms: ["bottoms"],
    outerwear: true,
    footwear: true,
    vibe: ["professional", "smart casual", "polished"],
    preferFormal: true
  },
  party: {
    name: "Party / Night Out",
    tops: ["tops", "outerwear"],
    bottoms: ["bottoms"],
    footwear: true,
    vibe: ["statement", "bold", "stylish"],
    trendScore: 1.0
  },
  date: {
    name: "Date Night",
    tops: ["tops"],
    bottoms: ["bottoms"],
    outerwear: true,
    footwear: true,
    vibe: ["romantic", "put-together", "refined"]
  },
  gym: {
    name: "Gym / Active",
    tops: ["tops"],
    bottoms: ["bottoms"],
    footwear: true,
    vibe: ["sporty", "functional", "athletic"],
    preferSports: true
  },
  ethnic: {
    name: "Ethnic / Festive",
    tops: ["ethnic"],
    bottoms: ["ethnic", "bottoms"],
    footwear: true,
    vibe: ["traditional", "festive", "cultural"]
  },
  beach: {
    name: "Beach / Resort",
    tops: ["tops"],
    bottoms: ["bottoms"],
    footwear: true,
    vibe: ["relaxed", "tropical", "vacation"],
    preferLight: true
  }
};

// BODY TYPE advice
const BODY_TYPE_TIPS = {
  slim: {
    tops: "Layering and structured shirts add visual volume. Try slim-fit or regular-fit cuts.",
    bottoms: "Straight or slim-leg jeans work best. Avoid overly baggy cuts.",
    avoid: "Avoid clothes that are too tight as they accentuate narrowness."
  },
  athletic: {
    tops: "Almost everything works! Fitted tees and button-downs show off your build.",
    bottoms: "Slim and straight cuts complement your proportions.",
    avoid: "Avoid boxy or shapeless cuts that hide your physique."
  },
  average: {
    tops: "Regular, slim, or relaxed fits all work. Experiment freely.",
    bottoms: "Chinos and straight-leg jeans are universally flattering.",
    avoid: "Avoid overly baggy bottoms with tight tops — balance is key."
  },
  broad: {
    tops: "Structured shoulders and V-necks balance your frame. Solid colours work great.",
    bottoms: "Straight or relaxed leg creates balance. Avoid skinny jeans.",
    avoid: "Avoid very tight tops that emphasise upper-body width."
  },
  plus: {
    tops: "Relaxed-fit with structured shoulders. Dark colours and vertical patterns are great.",
    bottoms: "Straight or wide-leg trousers create elegant proportions.",
    avoid: "Avoid very tight fits and horizontal stripes."
  }
};

// SHOP SUGGESTIONS by category gaps
const SHOP_ITEMS_2026 = {
  male: {
    essential: [
      { icon: "👕", name: "White Linen Shirt", reason: "The #1 versatile piece of 2026. Wears from beach to work.", price: "₹1,200–₹3,500", tags: ["summer", "trending", "versatile"] },
      { icon: "👖", name: "Beige Chinos", reason: "Pairs with nearly everything in your wardrobe.", price: "₹1,500–₹4,000", tags: ["casual", "work", "essential"] },
      { icon: "👟", name: "Chunky Loafers", reason: "The footwear trend dominating 2026 street style.", price: "₹2,500–₹8,000", tags: ["trending", "versatile"] },
      { icon: "🧥", name: "Olive Shacket", reason: "Shirt-jacket hybrid — perfect for layering this season.", price: "₹2,000–₹6,000", tags: ["outerwear", "trending"] },
      { icon: "⌚", name: "Minimalist Watch", reason: "Elevates every outfit instantly. A timeless investment.", price: "₹3,000–₹15,000", tags: ["accessory", "essential"] }
    ],
    trending: [
      { icon: "🕶️", name: "Shield Sunglasses", reason: "Wraparound frames are the eyewear statement of 2026.", price: "₹500–₹3,000", tags: ["trending", "accessory"] },
      { icon: "👕", name: "Oversized Graphic Tee", reason: "Streetwear staple — earth tone graphics dominate.", price: "₹800–₹2,500", tags: ["casual", "street"] },
      { icon: "👟", name: "Retro Running Shoe", reason: "Vintage athletic silhouettes are peak 2026 style.", price: "₹4,000–₹12,000", tags: ["footwear", "trending"] },
      { icon: "💍", name: "Chunky Silver Ring", reason: "Men's jewellery is mainstream. Silver chain or ring is a must.", price: "₹300–₹2,000", tags: ["accessory", "trending"] }
    ],
    upgrade: [
      { icon: "🧥", name: "Unstructured Blazer", reason: "Upgrade from formal to smart-casual. A wardrobe game-changer.", price: "₹3,000–₹12,000", tags: ["work", "party", "upgrade"] },
      { icon: "👞", name: "Chelsea Boots", reason: "Upgrade your footwear game. Works casual to semi-formal.", price: "₹3,500–₹10,000", tags: ["footwear", "upgrade"] },
      { icon: "🎒", name: "Structured Tote Bag", reason: "Replace your backpack for office — the sophisticated upgrade.", price: "₹2,000–₹8,000", tags: ["upgrade", "accessory"] }
    ]
  },
  female: {
    essential: [
      { icon: "👗", name: "Linen Wide-Leg Pants", reason: "The silhouette of 2026. Effortlessly elegant and cool.", price: "₹1,200–₹4,000", tags: ["trending", "versatile"] },
      { icon: "👕", name: "Fitted Crew Neck Tee", reason: "The ultimate layering base. Every wardrobe needs 2-3.", price: "₹500–₹2,000", tags: ["essential", "basic"] },
      { icon: "👟", name: "Platform Loafers", reason: "Adding height and edge to any outfit. 2026's shoe of the year.", price: "₹2,000–₹8,000", tags: ["trending", "footwear"] },
      { icon: "👜", name: "Structured Mini Bag", reason: "Compact statement bags lead accessories trends.", price: "₹1,500–₹12,000", tags: ["accessory", "trending"] },
      { icon: "🧥", name: "Tailored Blazer", reason: "The most versatile piece — dress up any outfit instantly.", price: "₹2,500–₹10,000", tags: ["essential", "versatile"] }
    ],
    trending: [
      { icon: "🌸", name: "Sheer Floral Overlay Top", reason: "Layered sheer fabrics trend hard in summer 2026.", price: "₹800–₹3,000", tags: ["trending", "feminine"] },
      { icon: "🕶️", name: "Oversized Square Frames", reason: "Bold eyewear is the accessory statement of the season.", price: "₹500–₹4,000", tags: ["accessory", "trending"] },
      { icon: "💎", name: "Layered Necklaces", reason: "Delicate stacking necklaces are everywhere in 2026.", price: "₹300–₹3,000", tags: ["jewellery", "trending"] },
      { icon: "🧣", name: "Silk Neck Scarf", reason: "Worn in hair, neck, or bag handle — the versatile 2026 accent.", price: "₹400–₹2,500", tags: ["accessory", "trending"] }
    ],
    upgrade: [
      { icon: "👗", name: "Slip Midi Dress", reason: "Effortless elegance. Can be dressed up or down for any occasion.", price: "₹1,500–₹6,000", tags: ["upgrade", "versatile"] },
      { icon: "👡", name: "Block Heel Mules", reason: "Comfortable elegance upgrade over flat sandals.", price: "₹1,500–₹6,000", tags: ["footwear", "upgrade"] },
      { icon: "🧥", name: "Trench Coat", reason: "A wardrobe investment that transcends every season.", price: "₹3,000–₹15,000", tags: ["outerwear", "upgrade"] }
    ]
  },
  nonbinary: {
    essential: [
      { icon: "👕", name: "Oversized Linen Shirt", reason: "Fluid, gender-free, and peak 2026 trend.", price: "₹1,200–₹3,500", tags: ["trending", "versatile"] },
      { icon: "👖", name: "Wide-Leg Trousers", reason: "Relaxed silhouettes dominate 2026's most expressive looks.", price: "₹1,500–₹5,000", tags: ["trending", "essential"] },
      { icon: "👟", name: "Gender-Neutral Chunky Sneakers", reason: "Bold sneaker silhouettes that make a statement.", price: "₹3,000–₹12,000", tags: ["footwear", "trending"] }
    ],
    trending: [
      { icon: "💍", name: "Statement Silver Jewellery", reason: "Chunky silver is the most prominent accessory trend of 2026.", price: "₹400–₹3,000", tags: ["accessory", "trending"] },
      { icon: "🕶️", name: "Shield / Wrap Sunglasses", reason: "Futuristic frames for a bold, gender-fluid look.", price: "₹600–₹4,000", tags: ["accessory", "trending"] }
    ],
    upgrade: [
      { icon: "🧥", name: "Structured Shacket", reason: "The hybrid outerwear piece for all body types and styles.", price: "₹2,000–₹7,000", tags: ["outerwear", "upgrade"] }
    ]
  }
};

// HAIR & BEARD DATA
const HAIR_DATA = {
  male: {
    oval: {
      hair: [
        { name: "Textured Crop", why: "Oval face suits most cuts. The textured crop adds dimension and is trending heavily in 2026.", tags: ["🔥 Hot 2026", "Low maintenance"] },
        { name: "Modern Undercut", why: "Clean sides with longer top creates a polished everyday look. Very versatile.", tags: ["Classic", "Versatile"] },
        { name: "Curtains / Middle Part", why: "The 90s revival cut that dominated 2024-2026. Effortlessly stylish.", tags: ["🔥 Trending", "Easy to style"] },
        { name: "Buzz Cut with Fade", why: "Clean and masculine. Works exceptionally well with oval faces.", tags: ["Low maintenance", "Sharp"] }
      ],
      beard: [
        { name: "Medium Stubble (3-7mm)", why: "Universally flattering on oval faces. Adds masculinity without overpowering.", tags: ["🔥 Trending", "Versatile"] },
        { name: "Short Boxed Beard", why: "Well-groomed and structured. Ideal for both casual and professional settings.", tags: ["Professional", "Clean"] },
        { name: "Clean Shaven", why: "Lets facial features speak. Pairs beautifully with textured hair.", tags: ["Classic", "Fresh"] },
        { name: "Full Beard (trimmed)", why: "A full but shaped beard adds gravitas and suits oval faces well.", tags: ["Bold", "Masculine"] }
      ]
    },
    round: {
      hair: [
        { name: "High Fade with Volume on Top", why: "Height on top elongates a round face. The 2026 goto for round-faced guys.", tags: ["🔥 2026 Pick", "Slimming"] },
        { name: "Slick Back", why: "Pulling hair back creates length and reduces roundness visually.", tags: ["Sharp", "Elongating"] },
        { name: "Pompadour", why: "Classic volume builder. Dramatic and stylish, perfect for round faces.", tags: ["Statement", "Bold"] },
        { name: "Side Part with High Fade", why: "Asymmetry breaks up roundness and gives a defined, sharp look.", tags: ["Classic", "Structured"] }
      ],
      beard: [
        { name: "Extended Goatee", why: "Elongates the face vertically, which is ideal for round faces. Very slimming.", tags: ["🔥 Recommended", "Slimming"] },
        { name: "Chinstrap", why: "Defines the jawline and creates the illusion of a slimmer face.", tags: ["Defined", "Sharp"] },
        { name: "Angular Beard (squared bottom)", why: "Adding sharp angles at chin creates jaw definition for round faces.", tags: ["Structured", "Bold"] }
      ]
    },
    square: {
      hair: [
        { name: "Textured Quiff", why: "Soft textures soften a strong jawline. Quiff adds height gracefully.", tags: ["🔥 Trending", "Softening"] },
        { name: "Medium Length Side Part", why: "Adds a relaxed, effortless feel that balances strong jaw features.", tags: ["Balanced", "Relaxed"] },
        { name: "Curtain Hair (Longer)", why: "Frame your square jaw with longer, flowing curtain hair. Very 2026.", tags: ["🔥 2026", "Romantic"] },
        { name: "Messy Crop", why: "Tousled, carefree texture contrasts beautifully with a defined jaw.", tags: ["Casual", "Modern"] }
      ],
      beard: [
        { name: "Light Stubble (1-3mm)", why: "Subtle stubble complements a strong jaw without over-emphasising it.", tags: ["Subtle", "Clean"] },
        { name: "Rounded Beard", why: "Softening the beard shape complements the angular face perfectly.", tags: ["Balanced", "Soft"] },
        { name: "Clean Shaven", why: "Shows off the defined jawline — a bold choice that works very well.", tags: ["Bold", "Sharp"] }
      ]
    },
    heart: {
      hair: [
        { name: "Side Swept Fringe", why: "Adds width at the forehead level, balancing the narrow chin.", tags: ["Balancing", "Elegant"] },
        { name: "Medium Length with Volume at Sides", why: "Volume at the jaw area balances the wider forehead of heart faces.", tags: ["Balanced", "Recommended"] },
        { name: "Wavy / Curly Natural", why: "Natural volume at the sides is perfectly suited to heart-shaped faces.", tags: ["Natural", "Carefree"] }
      ],
      beard: [
        { name: "Full Beard at Chin", why: "Building width at the chin creates balance for the wider forehead.", tags: ["🔥 Recommended", "Balancing"] },
        { name: "Goatee with Mustache", why: "Draws attention to the chin and adds definition where needed.", tags: ["Definition", "Classic"] }
      ]
    },
    oblong: {
      hair: [
        { name: "Side Part with Width", why: "Adds visual width to a long face. Avoid tall hair styles.", tags: ["Widening", "Balanced"] },
        { name: "Textured Fringe / Forward Crop", why: "Horizontal fringe breaks up the face length beautifully.", tags: ["Shortening effect", "Trendy"] },
        { name: "Curls / Wavy Medium Length", why: "Natural waves add width — perfect for elongated faces.", tags: ["Natural", "Volumising"] }
      ],
      beard: [
        { name: "Full Moustache (no beard)", why: "Adds horizontal visual weight, reducing perceived face length.", tags: ["Widening", "Classic"] },
        { name: "Short Stubble", why: "Keeps it clean without adding vertical length that beard can add.", tags: ["Clean", "Subtle"] }
      ]
    }
  },
  female: {
    oval: {
      hair: [
        { name: "Long Beachy Waves", why: "Oval faces can pull off anything. Beachy waves are the dominant 2026 look.", tags: ["🔥 2026", "Effortless"] },
        { name: "Blunt Bob (Jaw Length)", why: "Sharp, modern, editorial. Very trendy and universally loved.", tags: ["Bold", "Trending"] },
        { name: "Curtain Bangs with Long Layers", why: "Soft framing with curtain bangs is the biggest hair trend of 2026.", tags: ["🔥 Hot", "Romantic"] },
        { name: "Sleek Ponytail / Updo", why: "Shows off your balanced features beautifully. Clean and polished.", tags: ["Classic", "Polished"] }
      ]
    },
    round: {
      hair: [
        { name: "Long Layers (Collarbone+)", why: "Length elongates a round face. Layers create movement.", tags: ["Elongating", "Recommended"] },
        { name: "High Ponytail", why: "Height on top creates the illusion of length. Chic and effective.", tags: ["Quick", "Slimming"] },
        { name: "Side-Parted Long Bob", why: "Asymmetry and length both work to define and slim round faces.", tags: ["Modern", "Flattering"] },
        { name: "Voluminous Top with Flat Sides", why: "Strategic volume placement elongates the face vertically.", tags: ["Structured", "Bold"] }
      ]
    },
    square: {
      hair: [
        { name: "Soft Waves / Curls", why: "Soft texture contrasts with a strong jaw — the perfect balance.", tags: ["Softening", "Feminine"] },
        { name: "Curtain Bangs", why: "Frames the forehead softly, taking attention away from the jaw.", tags: ["🔥 2026", "Softening"] },
        { name: "Long Bob with Waves", why: "Chin-length waves soften the jawline beautifully.", tags: ["Modern", "Flattering"] }
      ]
    },
    heart: {
      hair: [
        { name: "Chin-Length Bob", why: "Adds width at chin level, balancing a wider forehead.", tags: ["Balancing", "Chic"] },
        { name: "Side Swept Bangs", why: "Breaks the wide forehead visually. Very flattering.", tags: ["Classic", "Balanced"] },
        { name: "Loose Waves from Mid-Length", why: "Volume from the jaw down creates balance with wider forehead.", tags: ["Romantic", "Soft"] }
      ]
    },
    oblong: {
      hair: [
        { name: "Blunt Bangs", why: "Horizontal cut shortens the visual length of the face.", tags: ["Bold", "Shortening"] },
        { name: "Shoulder-Length with Volume", why: "Width at shoulders reduces the elongated appearance.", tags: ["Widening", "Balanced"] },
        { name: "Wavy Lob", why: "Natural volume and movement adds width to an oblong face.", tags: ["Natural", "Flattering"] }
      ]
    }
  },
  nonbinary: {
    oval: {
      hair: [
        { name: "Textured Crop / Short Layers", why: "Gender-neutral and sharp. Trending across all style communities in 2026.", tags: ["🔥 2026", "Androgynous"] },
        { name: "Curtain Hair", why: "The most gender-fluid trendy cut of 2025-2026.", tags: ["🔥 Trending", "Versatile"] },
        { name: "Buzzcut with Style Detail", why: "A bold, expressive choice that is beautifully minimal.", tags: ["Bold", "Minimal"] },
        { name: "Long Waves (all lengths)", why: "Flowing hair is timeless and transcends gender expression.", tags: ["Free-spirited", "Classic"] }
      ]
    },
    round: {
      hair: [
        { name: "High-Top Fade", why: "Height elongates and creates a striking silhouette.", tags: ["Bold", "Slimming"] },
        { name: "Slicked Back Undercut", why: "Clean and sharp, effective for elongating round faces.", tags: ["Sharp", "Androgynous"] }
      ]
    },
    square: {
      hair: [
        { name: "Shaggy Textured Mid-Length", why: "Relaxed texture softens angular features. Very 2026 indie style.", tags: ["🔥 2026 Indie", "Soft"] },
        { name: "Wavy Curtains", why: "Flowing curtain frames soften a square jaw beautifully.", tags: ["Romantic", "Modern"] }
      ]
    },
    heart: {
      hair: [
        { name: "Short Sides, Voluminous Top", why: "Structured top with minimal sides balances heart face proportions.", tags: ["Balanced", "Modern"] }
      ]
    },
    oblong: {
      hair: [
        { name: "Tousled Fringe", why: "Horizontal fringe breaks up face length. Very expressive.", tags: ["Expressive", "Trendy"] }
      ]
    }
  }
};

const GROOMING_TIPS_BY_GENDER = {
  male: [
    "Use a beard oil daily — even on stubble — to prevent dryness and keep skin healthy",
    "Trim beard every 3-4 days to maintain your chosen style's clean lines",
    "Invest in a quality pomade or clay for hair styling — matte finish is peak 2026",
    "Exfoliate face 2x weekly to prevent ingrown hairs and maintain clear skin",
    "Keep eyebrows groomed — a quick clean-up makes a huge difference to overall look",
    "Use a scalp massager when shampooing — promotes hair health and thickness"
  ],
  female: [
    "Apply a heat protectant every time before using any heat styling tool",
    "Deep condition hair weekly, especially the ends to prevent breakage",
    "Use dry shampoo to extend blow-outs and add volume at roots",
    "Trim ends every 8-10 weeks even when growing — removes split ends and keeps hair healthy",
    "Use a silk pillowcase to reduce frizz and hair breakage overnight",
    "Facial massage with gua sha or roller helps with jawline definition and skin glow"
  ],
  nonbinary: [
    "Build a simple, gender-affirming grooming routine that feels authentic to you",
    "Quality moisturiser and SPF daily is the foundation of any great look",
    "Try styling paste or texture spray for that effortless, lived-in hair look",
    "Keep nails clean and shaped — simple grooming detail that elevates any outfit",
    "Invest in one great grooming product that you love using every day"
  ]
};

const HAIR_PRODUCTS = {
  male: [
    { icon: "🫙", name: "Matte Clay / Pomade", use: "For textured crops, undercuts, and styled looks" },
    { icon: "🛢️", name: "Beard Oil", use: "Daily conditioning for any beard length" },
    { icon: "✂️", name: "Beard Trimmer", use: "Maintain clean lines and consistent length at home" },
    { icon: "🧴", name: "Scalp Tonic", use: "Promotes healthy hair growth and fights dandruff" }
  ],
  female: [
    { icon: "🌸", name: "Hair Serum (Argan Oil)", use: "Tames frizz and adds brilliant shine to all hair types" },
    { icon: "💨", name: "Volumising Mousse", use: "Lift at roots for all-day volume" },
    { icon: "🔥", name: "Heat Protectant Spray", use: "Essential before any heat styling" },
    { icon: "✨", name: "Dry Shampoo", use: "Refresh and add texture between washes" }
  ],
  nonbinary: [
    { icon: "🧴", name: "Texture Spray / Sea Salt", use: "Creates effortless, tousled texture without stiffness" },
    { icon: "🌿", name: "Natural Hair Oil", use: "All-purpose scalp and hair nourishment" },
    { icon: "🫧", name: "Gentle Sulfate-Free Shampoo", use: "Preserves colour and maintains scalp health" }
  ]
};

// STYLING TIPS by occasion & body type
const STYLING_TIPS_DB = {
  casual: [
    "Roll up your sleeves slightly — instantly elevates a casual look",
    "Tuck just the front of your shirt (French tuck) for an effortless, put-together look",
    "Match your belt to your shoes for a cohesive, intentional look",
    "Layer with an open overshirt or unstructured jacket for instant depth"
  ],
  work: [
    "Stick to neutral palettes — navy, grey, beige — for maximum versatility",
    "Ensure all clothes are wrinkle-free; it's the #1 professional grooming factor",
    "Wear polished leather shoes — they elevate even simple outfits",
    "A structured bag or briefcase ties the whole professional look together"
  ],
  party: [
    "One statement piece is enough — let it be the hero, keep the rest simple",
    "Dark bottoms and a bold top is the foolproof party formula",
    "Statement footwear can transform even a simple outfit into a party look",
    "Accessorise intentionally — a watch, ring, or necklace adds the finishing touch"
  ],
  date: [
    "Wear something you feel genuinely comfortable and confident in — it shows",
    "Light fragrance is as important as your outfit — don't skip it",
    "Subtle colour coordination (not matching) shows you have an eye for detail",
    "Clean shoes are non-negotiable on a date — people notice"
  ],
  gym: [
    "Choose moisture-wicking fabrics — comfort is performance",
    "Matching sets look intentional and put-together at the gym",
    "Compression fits under loose tops gives a dynamic, athletic look",
    "Clean white or neutral sneakers always look fresh at the gym"
  ],
  ethnic: [
    "Fit is everything with ethnic wear — a well-tailored kurta transforms the look",
    "Juttis or Kolhapuri sandals complete the ethnic look authentically",
    "Minimal modern accessories with ethnic wear feel fresh and contemporary",
    "Iron ethnic wear carefully — crisp fabric elevates the entire look"
  ],
  beach: [
    "Linen is your best friend — breathable, stylish, and perfect beach material",
    "Keep the palette light and warm — whites, beiges, and pastels",
    "Sandals or espadrilles are the ideal beach footwear choices",
    "UV-protective or a wide-brim hat is both practical and stylish at the beach"
  ]
};

const BUDGET_TIPS = [
  "Invest in quality basics first — 5 great basics outperform 15 average pieces every time.",
  "The cost-per-wear formula: a ₹3,000 blazer worn 50 times costs ₹60 per wear. Budget smart.",
  "Shop end-of-season sales for outerwear — blazers and jackets drop 40-60% off.",
  "Linen and cotton in neutral colours are the most versatile investment for Indian climates.",
  "One quality leather belt and watch elevates every outfit instantly — prioritise accessories.",
  "Build a 3-colour base wardrobe first (white, navy, beige), then add colours gradually."
];
