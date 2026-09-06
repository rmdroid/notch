'use strict';
(() => {
  const key = 'termnotch-privacy-v1';
  const notice = document.querySelector('#privacy-notice');
  const settings = document.querySelector('[data-privacy-settings]');
  if (!notice || !settings) return;

  function readChoice() {
    try {
      const value = localStorage.getItem(key);
      return value === 'analytics' || value === 'necessary' ? value : null;
    } catch { return null; }
  }
  let choice = readChoice();
  let analyticsStarted = false;
  function startAnalytics() {
    if (choice !== 'analytics' || analyticsStarted || !/^https?:$/.test(location.protocol)) return;
    analyticsStarted = true;
    const script = document.createElement('script');
    script.id = 'termnotch-analytics';
    script.defer = true;
    script.src = 'https://cv.rm-on.de/script.js';
    script.dataset.websiteId = '9b8f1b9f-6ba0-465a-824f-d46e39731ac3';
    document.head.append(script);
  }
  function closeNotice() {
    const hadFocus = notice.contains(document.activeElement);
    notice.hidden = true;
    if (hadFocus) settings.focus({ preventScroll: true });
  }
  notice.hidden = choice !== null;
  notice.querySelectorAll('[data-consent]').forEach(button => {
    button.addEventListener('click', () => {
      choice = button.dataset.consent;
      try { localStorage.setItem(key, choice); } catch { /* Applies to this page even if storage is unavailable. */ }
      closeNotice();
      if (choice === 'analytics') startAnalytics();
      else if (analyticsStarted) location.reload();
    });
  });
  settings.addEventListener('click', () => {
    notice.hidden = false;
    notice.querySelector('[data-consent]').focus();
  });
  // Keep a withdrawal in another open tab effective on this page as well.
  window.addEventListener('storage', event => {
    if (event.key !== key && event.key !== null) return;
    choice = readChoice();
    notice.hidden = choice !== null;
    if (choice !== 'analytics' && analyticsStarted) location.reload();
    else startAnalytics();
  });
  startAnalytics();
})();
