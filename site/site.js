/* Better CMDK demo site — local palette mock + page behavior.
   Everything here runs locally. Nothing is sent to any API. */

(function () {
  'use strict';

  /* ---------- toast ---------- */

  var toastRegion = document.querySelector('.toast-region');

  function toast(message, kind) {
    if (!toastRegion) return;
    var el = document.createElement('div');
    el.className = 'toast' + (kind === 'warn' ? ' toast-warn' : '');
    el.textContent = message;
    toastRegion.appendChild(el);
    setTimeout(function () {
      el.classList.add('toast-out');
      setTimeout(function () { el.remove(); }, 260);
    }, 3600);
  }

  // Shared with embed.js so the real SDK can report demo mode.
  window.__bcmdkToast = toast;

  /* ---------- scroll reveal ---------- */

  var revealEls = Array.prototype.slice.call(document.querySelectorAll('.reveal'));
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  if (reduceMotion || !('IntersectionObserver' in window)) {
    revealEls.forEach(function (el) { el.classList.add('is-visible'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- palette mock ---------- */

  var overlay = document.getElementById('cmdk');
  if (!overlay) return;

  var listView = overlay.querySelector('[data-view="list"]');
  var composerView = overlay.querySelector('[data-view="composer"]');
  var input = overlay.querySelector('.cmdk-input');
  var list = overlay.querySelector('.cmdk-list');
  var textarea = overlay.querySelector('.cmdk-textarea');
  var lastFocus = null;
  var selectedIndex = 0;

  var ACTIONS = [
    {
      icon: '↗',
      label: 'Open the live station dashboard',
      hint: 'external',
      run: function () {
        window.open('https://34.187.233.150.sslip.io/dashboard', '_blank', 'noopener');
        closePalette();
      }
    },
    {
      icon: '§',
      label: 'Jump to: how the loop works',
      hint: 'on this page',
      run: function () {
        closePalette();
        var target = document.getElementById('loop');
        if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    },
    {
      icon: '¶',
      label: 'Jump to: principles',
      hint: 'on this page',
      run: function () {
        closePalette();
        var target = document.getElementById('principles');
        if (target) target.scrollIntoView({ behavior: reduceMotion ? 'auto' : 'smooth' });
      }
    },
    {
      icon: '＋',
      label: 'Request a change…',
      hint: 'composer',
      request: true,
      run: function () { showComposer(); }
    }
  ];

  var visibleActions = ACTIONS.slice();

  function renderList() {
    list.innerHTML = '';
    if (visibleActions.length === 0) {
      var empty = document.createElement('li');
      empty.className = 'cmdk-empty';
      empty.textContent = 'no matches — try "request"';
      list.appendChild(empty);
      return;
    }
    visibleActions.forEach(function (action, i) {
      var li = document.createElement('li');
      li.className = 'cmdk-item' + (action.request ? ' cmdk-item-request' : '');
      li.setAttribute('role', 'option');
      li.setAttribute('aria-selected', i === selectedIndex ? 'true' : 'false');
      li.innerHTML =
        '<span class="cmdk-item-icon">' + action.icon + '</span>' +
        '<span class="cmdk-item-label"></span>' +
        '<span class="cmdk-item-hint">' + action.hint + '</span>';
      li.querySelector('.cmdk-item-label').textContent = action.label;
      li.addEventListener('click', function () { action.run(); });
      li.addEventListener('mousemove', function () {
        if (selectedIndex !== i) { selectedIndex = i; renderList(); }
      });
      list.appendChild(li);
    });
  }

  function filterActions() {
    var q = input.value.trim().toLowerCase();
    visibleActions = q
      ? ACTIONS.filter(function (a) { return a.label.toLowerCase().indexOf(q) !== -1; })
      : ACTIONS.slice();
    selectedIndex = 0;
    renderList();
  }

  function showList() {
    composerView.hidden = true;
    listView.hidden = false;
    input.value = '';
    filterActions();
    input.focus();
  }

  function showComposer() {
    listView.hidden = true;
    composerView.hidden = false;
    textarea.value = '';
    textarea.focus();
  }

  function openPalette() {
    lastFocus = document.activeElement;
    overlay.hidden = false;
    document.body.style.overflow = 'hidden';
    showList();
  }

  function closePalette() {
    overlay.hidden = true;
    document.body.style.overflow = '';
    if (lastFocus && typeof lastFocus.focus === 'function') lastFocus.focus();
  }

  function togglePalette() {
    if (overlay.hidden) openPalette();
    else closePalette();
  }

  function sendRequest() {
    var text = textarea.value.trim();
    if (!text) {
      textarea.focus();
      toast('Describe the change first — even one sentence.', 'warn');
      return;
    }
    closePalette();
    toast('Change request captured locally — demo mode, nothing was sent.');
  }

  /* triggers */

  Array.prototype.forEach.call(document.querySelectorAll('[data-open-palette]'), function (btn) {
    btn.addEventListener('click', openPalette);
  });

  overlay.querySelector('[data-cmdk-close]').addEventListener('click', closePalette);
  Array.prototype.forEach.call(overlay.querySelectorAll('[data-cmdk-back]'), function (btn) {
    btn.addEventListener('click', showList);
  });
  overlay.querySelector('[data-cmdk-send]').addEventListener('click', sendRequest);

  input.addEventListener('input', filterActions);

  /* keyboard — capture phase so the site mock stays the primary cmd-K handler */

  window.addEventListener('keydown', function (e) {
    if ((e.metaKey || e.ctrlKey) && (e.key === 'k' || e.key === 'K')) {
      e.preventDefault();
      e.stopImmediatePropagation();
      togglePalette();
      return;
    }
    if (overlay.hidden) return;

    if (e.key === 'Escape') {
      e.preventDefault();
      closePalette();
      return;
    }

    if (!composerView.hidden) {
      if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        sendRequest();
      }
      return;
    }

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (visibleActions.length) {
        selectedIndex = (selectedIndex + 1) % visibleActions.length;
        renderList();
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (visibleActions.length) {
        selectedIndex = (selectedIndex - 1 + visibleActions.length) % visibleActions.length;
        renderList();
      }
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (visibleActions[selectedIndex]) visibleActions[selectedIndex].run();
    }
  }, true);

  renderList();
})();
