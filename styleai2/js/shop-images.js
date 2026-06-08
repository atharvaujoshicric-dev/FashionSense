/* ==========================================
   SHOP-IMAGES.JS — Reference images for shop
   Uses Unsplash Source API (free, no key)
   Each item has a curated search query
   ========================================== */

/**
 * Returns an Unsplash image URL for a shop item.
 * Uses the Unsplash Source API: https://source.unsplash.com/featured/?{query}
 * This is free and does not require an API key.
 * Images are 400x500 for fashion card proportions.
 */
function getShopImageUrl(item) {
  // Map item names to specific Unsplash queries for best results
  const queryMap = {
    // Male essentials
    'White Linen Shirt':        'white linen shirt men fashion',
    'Beige Chinos':             'beige chinos men outfit',
    'Chunky Loafers':           'chunky loafers shoes fashion',
    'Olive Shacket':            'olive shacket jacket men',
    'Minimalist Watch':         'minimalist watch wrist men',
    'Shield Sunglasses':        'shield sunglasses fashion',
    'Oversized Graphic Tee':    'oversized graphic tshirt streetwear',
    'Retro Running Shoe':       'retro running sneakers fashion',
    'Chunky Silver Ring':       'silver ring men jewellery',
    'Unstructured Blazer':      'unstructured blazer men smart casual',
    'Chelsea Boots':            'chelsea boots men leather',
    'Structured Tote Bag':      'tote bag men office',
    // Female essentials
    'Linen Wide-Leg Pants':     'linen wide leg pants women fashion',
    'Fitted Crew Neck Tee':     'fitted white tshirt women minimal',
    'Platform Loafers':         'platform loafers shoes women',
    'Structured Mini Bag':      'structured mini bag women',
    'Tailored Blazer':          'tailored blazer women fashion',
    'Sheer Floral Overlay Top': 'sheer floral top women fashion',
    'Oversized Square Frames':  'oversized sunglasses square women',
    'Layered Necklaces':        'layered necklaces women jewellery',
    'Silk Neck Scarf':          'silk scarf women accessory',
    'Slip Midi Dress':          'slip midi dress women elegant',
    'Block Heel Mules':         'block heel mules women shoes',
    'Trench Coat':              'trench coat women fashion',
    // Nonbinary
    'Oversized Linen Shirt':    'oversized linen shirt unisex fashion',
    'Wide-Leg Trousers':        'wide leg trousers unisex fashion',
    'Gender-Neutral Chunky Sneakers': 'chunky sneakers unisex streetwear',
    'Statement Silver Jewellery':     'statement silver jewellery unisex',
    'Shield / Wrap Sunglasses':       'wrap sunglasses futuristic fashion',
    'Structured Shacket':             'shacket jacket unisex fashion',
  };

  const query = queryMap[item.name] || `${item.name} fashion clothing`;
  // We use a deterministic seed based on item name so the same item always shows the same image
  const seed  = Math.abs(hashStr(item.name)) % 9999;
  return `https://source.unsplash.com/400x500/?${encodeURIComponent(query)}&sig=${seed}`;
}

function hashStr(str) {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (Math.imul(31, h) + str.charCodeAt(i)) | 0;
  }
  return h;
}
