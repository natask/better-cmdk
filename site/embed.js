/* Real Master CMDK embed — this site is itself a Master CMDK surface.
   Loads the SDK from the live station and registers this page.
   Fully optional: if the station is unreachable or anonymous calls 401,
   the site keeps working and the inline mock stays the primary demo. */

const BASE_URL = 'https://34.187.233.150.sslip.io';

let demoToastShown = false;

function toast(message) {
  if (typeof window.__bcmdkToast === 'function') {
    window.__bcmdkToast(message, 'warn');
  }
}

function demoModeOnce(reason) {
  if (demoToastShown) return;
  demoToastShown = true;
  toast('Master CMDK embed: demo mode (anonymous, not authorized to post)');
  console.warn('[master-cmdk embed] demo mode:', reason);
}

function looks401(value) {
  const s = String((value && value.message) || value || '');
  return s.includes('401') || /unauthori[sz]ed/i.test(s);
}

// Surface 401s from the SDK's own async calls (anonymous comments).
window.addEventListener('unhandledrejection', (event) => {
  if (looks401(event.reason)) {
    demoModeOnce(event.reason);
    event.preventDefault();
  }
});

(async () => {
  try {
    const sdk = await import(`${BASE_URL}/sdk/master-cmdk.js`);
    const result = sdk.init?.({
      baseUrl: BASE_URL,
      appId: 'better-cmdk-site',
      surface: 'web'
    });
    if (result && typeof result.catch === 'function') {
      result.catch((err) => {
        if (looks401(err)) demoModeOnce(err);
        else console.warn('[master-cmdk embed] init failed:', err);
      });
    }
    console.info('[master-cmdk embed] initialized as surface "better-cmdk-site"');
  } catch (err) {
    // Offline, blocked, or the station is down — the site works without it.
    if (looks401(err)) demoModeOnce(err);
    else console.warn('[master-cmdk embed] unavailable, running standalone:', err);
  }
})();
