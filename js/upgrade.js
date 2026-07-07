/* ==========================================
   UPGRADE.JS
   ------------------------------------------
   Right now "Subscribe" calls a TEST-ONLY Supabase function
   (mock_activate_subscription) that turns the plan on with no
   real payment. Replace startCheckout() with a real Razorpay
   Checkout call once you have a Razorpay account — see
   SETUP.md → "Going live with real billing".
   ========================================== */

window.addEventListener('cloud-ready', () => {
  const user = requireAuth();
  if (!user) return;

  if (user.trialActive && !user.subscriptionActive) {
    document.getElementById('upgrade-heading').textContent = "You're on a free trial";
    document.getElementById('upgrade-sub').textContent =
      `Your trial runs until ${new Date(user.trialEndsAt).toLocaleDateString()}. Subscribe any time to keep access after that.`;
  }
  if (user.subscriptionActive) {
    document.getElementById('upgrade-heading').textContent = "You're already subscribed";
    document.getElementById('upgrade-sub').textContent =
      `Your plan is active until ${new Date(user.subscriptionExpiresAt).toLocaleDateString()}.`;
    const btn = document.getElementById('pay-btn');
    btn.textContent = 'Go to dashboard';
    btn.onclick = () => (window.location.href = 'dashboard.html');
  }
});

async function startCheckout() {
  const btn = document.getElementById('pay-btn');
  const errEl = document.getElementById('upgrade-error');
  btn.disabled = true;
  btn.textContent = 'Processing…';

  // ---- TEST MODE (no real payment) ----
  const { error } = await window.supabaseClient.rpc('mock_activate_subscription');

  if (error) {
    errEl.textContent = 'Something went wrong — please try again.';
    errEl.classList.remove('hidden');
    btn.disabled = false;
    btn.textContent = 'Subscribe — ₹99/month';
    console.warn('mock_activate_subscription failed', error);
    return;
  }

  btn.textContent = '✓ Subscribed';
  setTimeout(() => (window.location.href = 'dashboard.html'), 700);

  /* ---- REAL RAZORPAY INTEGRATION (uncomment & adapt when ready) ----
  const order = await fetch('<your-order-creation-endpoint>', { method: 'POST' }).then(r => r.json());
  const rzp = new Razorpay({
    key: '<your-razorpay-key-id>',
    order_id: order.id,
    amount: 9900, // ₹99 in paise
    currency: 'INR',
    name: 'StyleAI',
    handler: async function (response) {
      // Verify response.razorpay_payment_id / order_id / signature on a
      // server or Supabase Edge Function BEFORE marking the user as
      // subscribed. Never trust the client-side handler alone.
    },
  });
  rzp.open();
  ------------------------------------------------------------------- */
}
