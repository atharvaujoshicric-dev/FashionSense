/* ==========================================
   ONBOARDING.JS — First-time user walkthrough
   ========================================== */

const OB_KEY = u => 'styleai_onboarded_' + u;

function checkOnboarding(user) {
  if (!user) return;
  const done = localStorage.getItem(OB_KEY(user.username));
  if (!done) showOnboarding(user);
}

function showOnboarding(user) {
  if (document.getElementById('onboarding-overlay')) return;

  const steps = [
    {
      icon:  '✦',
      title: 'Welcome to StyleAI',
      body:  `Hi ${user.name.split(' ')[0]}! Your personal fashion designer is ready. Let's get you set up in 3 quick steps.`,
      btn:   'Let\'s Go →'
    },
    {
      icon:  '👕',
      title: 'Add Your Clothes',
      body:  'Go to Wardrobe and add your clothes — just tap ＋. Take a photo and the color is detected automatically.',
      btn:   'Got it →',
      action: () => {}
    },
    {
      icon:  '🧍',
      title: 'Add Your Photo',
      body:  'Add a full-body photo in Profile → it unlocks virtual try-on so you can see outfits on yourself.',
      btn:   'Next →'
    },
    {
      icon:  '✨',
      title: 'Get Your Outfit',
      body:  'Go to Outfit, pick an occasion, tap Generate — StyleAI picks the best combination from your wardrobe using 2026 trends.',
      btn:   'Start Styling ✦'
    }
  ];

  let currentStep = 0;

  const overlay = document.createElement('div');
  overlay.id    = 'onboarding-overlay';
  overlay.style.cssText = `
    position:fixed;inset:0;z-index:9000;
    background:rgba(0,0,0,0.85);backdrop-filter:blur(8px);
    display:flex;align-items:flex-end;animation:fadeIn 0.3s ease
  `;

  const sheet = document.createElement('div');
  sheet.style.cssText = `
    background:var(--bg-card);border:1px solid var(--border);
    border-radius:32px 32px 0 0;padding:2rem 1.5rem 2.5rem;
    width:100%;text-align:center;
  `;

  function render() {
    const s = steps[currentStep];
    sheet.innerHTML = `
      <div style="font-size:3rem;margin-bottom:0.75rem">${s.icon}</div>
      <h2 style="font-family:'Cormorant Garamond',serif;font-size:1.8rem;margin-bottom:0.75rem">${s.title}</h2>
      <p style="font-size:0.92rem;color:var(--text-secondary);line-height:1.6;margin-bottom:1.75rem;max-width:300px;margin-left:auto;margin-right:auto">${s.body}</p>
      <div style="display:flex;gap:0.5rem;justify-content:center;margin-bottom:1rem">
        ${steps.map((_,i) =>
          `<div style="width:8px;height:8px;border-radius:50%;background:${i===currentStep?'var(--accent)':'var(--border)'};transition:background 0.2s"></div>`
        ).join('')}
      </div>
      <button class="btn-primary" style="width:100%;font-size:1rem;padding:1rem" onclick="_obNext()">
        ${s.btn}
      </button>
      <button style="background:none;border:none;color:var(--text-muted);font-size:0.82rem;margin-top:0.75rem;cursor:pointer;font-family:'DM Sans',sans-serif" onclick="_obSkip()">
        Skip for now
      </button>
    `;
  }

  window._obNext = () => {
    if (steps[currentStep].action) steps[currentStep].action();
    currentStep++;
    if (currentStep >= steps.length) {
      _obComplete(user);
    } else {
      render();
    }
  };

  window._obSkip = () => _obComplete(user);

  overlay.appendChild(sheet);
  document.body.appendChild(overlay);
  render();
}

function _obComplete(user) {
  localStorage.setItem(OB_KEY(user.username), '1');
  const el = document.getElementById('onboarding-overlay');
  if (el) {
    el.style.animation = 'fadeIn 0.2s ease reverse';
    setTimeout(() => el.remove(), 200);
  }
}

function resetOnboarding(username) {
  localStorage.removeItem(OB_KEY(username));
}
