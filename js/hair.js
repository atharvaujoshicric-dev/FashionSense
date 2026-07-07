/* ==========================================
   HAIR.JS — Hair & Beard Recommendations
   ========================================== */

let currentUser = null;
let selectedFaceShape = null;

window.addEventListener('cloud-ready', () => {
  currentUser = requireAuth();
  if (!currentUser) return;
  initAvatar(currentUser);

  // Pre-select from profile
  if (currentUser.faceShape) {
    const btn = document.querySelector(`.face-card[data-shape="${currentUser.faceShape}"]`);
    if (btn) selectFaceShape(currentUser.faceShape, btn);
  }
});

function selectFaceShape(shape, btn) {
  selectedFaceShape = shape;
  document.querySelectorAll('.face-card').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  renderHairRecommendations(shape);
}

function renderHairRecommendations(shape) {
  const user = currentUser;
  const gender = user.gender || 'male';
  const genderKey = gender === 'nonbinary' ? 'nonbinary' : gender;

  const shapeData = HAIR_DATA[genderKey]?.[shape] || HAIR_DATA.male?.[shape];

  if (!shapeData) return;

  document.getElementById('hair-placeholder').classList.add('hidden');
  document.getElementById('hair-results').classList.remove('hidden');

  // Hair
  const hairCards = document.getElementById('hair-cards');
  hairCards.innerHTML = '';
  (shapeData.hair || []).forEach((h, i) => {
    hairCards.appendChild(buildHairCard(h, i + 1));
  });

  // Beard (only for male/nonbinary)
  const beardSection = document.getElementById('beard-section');
  if (gender === 'female') {
    beardSection.style.display = 'none';
  } else {
    beardSection.style.display = 'block';
    const beardCards = document.getElementById('beard-cards');
    beardCards.innerHTML = '';
    (shapeData.beard || []).forEach((b, i) => {
      beardCards.appendChild(buildHairCard(b, i + 1));
    });
    if ((shapeData.beard || []).length === 0) {
      beardSection.style.display = 'none';
    }
  }

  // Grooming tips
  const tips = GROOMING_TIPS_BY_GENDER[gender] || GROOMING_TIPS_BY_GENDER.male;
  const tipsList = document.getElementById('grooming-tips-list');
  tipsList.innerHTML = '';
  tips.forEach(tip => {
    const li = document.createElement('li');
    li.textContent = tip;
    tipsList.appendChild(li);
  });

  // Products
  const products = HAIR_PRODUCTS[gender] || HAIR_PRODUCTS.male;
  const productCards = document.getElementById('product-cards');
  productCards.innerHTML = '';
  products.forEach(p => {
    const card = document.createElement('div');
    card.className = 'product-card';
    card.innerHTML = `
      <div class="product-icon">${p.icon}</div>
      <div>
        <div class="product-name">${p.name}</div>
        <div class="product-use">${p.use}</div>
      </div>
    `;
    productCards.appendChild(card);
  });
}

function buildHairCard(item, rank) {
  const card = document.createElement('div');
  card.className = 'hair-card';

  const tagsHtml = (item.tags || []).map(t => {
    const isHot = t.toLowerCase().includes('hot') || t.toLowerCase().includes('trending') || t.includes('🔥');
    return `<span class="hair-tag ${isHot ? 'hot' : ''}">${t}</span>`;
  }).join('');

  card.innerHTML = `
    <div class="hair-card-rank">${rank}</div>
    <div class="hair-card-info">
      <div class="hair-card-name">${item.name}</div>
      <div class="hair-card-why">${item.why}</div>
      <div class="hair-card-tags">${tagsHtml}</div>
    </div>
  `;
  return card;
}
