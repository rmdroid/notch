'use strict';
const content = JSON.parse(document.querySelector('#page-data').textContent);
const toggle = document.querySelector('#notch-toggle');
const terminal = document.querySelector('#preview-terminal');
function togglePreview() {
  const open = toggle.getAttribute('aria-expanded') !== 'true';
  toggle.setAttribute('aria-expanded', String(open));
  terminal.classList.toggle('is-hidden', !open);
  terminal.setAttribute('aria-hidden', String(!open));
  const german = document.documentElement.lang === 'de';
  toggle.querySelector('.shortcut-action').textContent = open
    ? (german ? 'Wieder schließen' : 'Hide again')
    : (german ? 'Wieder öffnen' : 'Show again');
}
toggle.addEventListener('click', togglePreview);
document.addEventListener('keydown', (event) => {
  if (document.querySelector('dialog[open]') || /INPUT|TEXTAREA|SELECT/.test(event.target.tagName) || event.target.isContentEditable) return;
  if (event.ctrlKey && !event.metaKey && !event.altKey && event.key.toLowerCase() === 'i') {
    event.preventDefault();
    togglePreview();
  }
});
const menu = document.querySelector('.menu-button');
const navigation = document.querySelector('#navigation');
function closeMenu() {
  menu.setAttribute('aria-expanded', 'false');
  navigation.classList.remove('open');
}
menu.addEventListener('click', () => {
  const open = menu.getAttribute('aria-expanded') !== 'true';
  menu.setAttribute('aria-expanded', String(open));
  navigation.classList.toggle('open', open);
});
navigation.querySelectorAll('a').forEach(link => link.addEventListener('click', closeMenu));
document.addEventListener('keydown', event => {
  if (event.key === 'Escape' && menu.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
});
const commands = [
  'curl -X POST http://localhost:7777/toggle',
  'curl -X POST http://localhost:7777/run \\\n  -H \'Content-Type: application/json\' \\\n  -d \'{"command":"pwd"}\'',
  'curl -X POST http://localhost:7777/notify \\\n  -H \'Content-Type: application/json\' \\\n  -d \'' + JSON.stringify({ message: content.notification }) + '\''
];
const tabs = [...document.querySelectorAll('[data-api]')];
const code = document.querySelector('#api-code');
const copyStatus = document.querySelector('#copy-status');
function selectTab(index) {
  tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
  code.textContent = commands[index];
  document.querySelector('#api-panel').setAttribute('aria-labelledby', tabs[index].id);
  document.querySelector('#api-note').textContent = content.api_notes[index];
  copyStatus.textContent = '';
}
tabs.forEach((tab, index) => {
  tab.addEventListener('click', () => selectTab(index));
  tab.addEventListener('keydown', event => {
    let next;
    if (event.key === 'ArrowRight') next = (index + 1) % tabs.length;
    if (event.key === 'ArrowLeft') next = (index + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') next = 0;
    if (event.key === 'End') next = tabs.length - 1;
    if (next !== undefined) { event.preventDefault(); selectTab(next); tabs[next].focus(); }
  });
});
document.querySelector('#copy-code').addEventListener('click', async () => {
  try {
    await navigator.clipboard.writeText(code.textContent);
    copyStatus.textContent = content.copied;
  } catch {
    const range = document.createRange(); range.selectNodeContents(code);
    const selection = window.getSelection(); selection.removeAllRanges(); selection.addRange(range);
    copyStatus.textContent = content.copyerror;
  }
});
document.querySelectorAll('[data-dialog]').forEach(button => {
  button.addEventListener('click', () => document.getElementById(button.dataset.dialog).showModal());
});
document.querySelectorAll('dialog').forEach(dialog => {
  dialog.querySelector('[data-close]').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
});
const form = document.querySelector('#updates-form');
const emailInput = document.querySelector('#updates-email');
const status = document.querySelector('#updates-status');
emailInput.addEventListener('input', () => emailInput.removeAttribute('aria-invalid'));
form.addEventListener('submit', async event => {
  event.preventDefault();
  const email = emailInput.value.trim();
  const name = document.querySelector('#updates-name').value.trim() || email;
  if (!email || !emailInput.checkValidity()) {
    emailInput.setAttribute('aria-invalid', 'true'); status.textContent = content.invalid; emailInput.focus(); return;
  }
  const submit = form.querySelector('button[type=submit]');
  if (submit.disabled) return;
  submit.disabled = true;
  status.textContent = content.sending;
  try {
    const response = await fetch('https://n8n.top-beraternetzwerk.de/webhook/termine', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, signal: AbortSignal.timeout(15000),
      body: JSON.stringify({ name, email,
        message: 'TermNotch Updates / Newsletter\nName: ' + name + '\nE-Mail: ' + email + '\nSeite: ' + window.location.href,
        source: 'termnotch-landingpage-updates', page: window.location.href, interest: 'TermNotch Updates / Newsletter'
      })
    });
    if (!response.ok) throw new Error('HTTP ' + response.status);
    form.reset(); emailInput.removeAttribute('aria-invalid'); status.textContent = content.success;
  } catch { status.textContent = content.error; }
  finally { submit.disabled = false; }
});
