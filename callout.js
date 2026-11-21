/* The standalone Strickland page: the sourced box and its letter. Reads saved details; never writes storage. */
(() => {
  'use strict';
  const C = window.CAMPAIGN, T = window.CAMPAIGN_CONTENT, M = window.ActionModel;
  const $ = id => document.getElementById(id);
  const callout = T.callout, official = callout && C.officials.find(o => o.id === callout.official);
  if (!official) return;

  $('calloutEyebrow').textContent = callout.eyebrow || '';
  $('calloutTitle').textContent = callout.title || '';
  $('calloutItems').replaceChildren(...(callout.items || []).map(item => {
    const div = document.createElement('div'), dt = document.createElement('dt'), dd = document.createElement('dd');
    dt.textContent = item.label; dd.textContent = item.text; div.append(dt, dd); return div;
  }));
  $('calloutSources').replaceChildren('Sources: ', ...(callout.sources || []).flatMap((source, i) => {
    const link = Object.assign(document.createElement('a'), { href: source.url, target: '_blank', rel: 'noopener noreferrer', textContent: source.name + ' ↗' });
    return i ? [', ', link] : [link];
  }));
  $('letterTitle').textContent = callout.dialogTitle || callout.action;
  $('calloutNote').textContent = callout.note || '';
  $('calloutCallNote').textContent = callout.callNote || '';
  $('calloutForm').href = official.website;
  $('calloutCall').href = 'tel:+1' + official.phone.replace(/\D/g, '');
  $('calloutCall').textContent = 'Call ' + official.phone;

  // Details the visitor already entered on the main page, if this browser has them.
  let saved = {};
  try { saved = JSON.parse(localStorage.getItem(`leadership-${C.code.toLowerCase()}-drafts-v3`))?.details || {}; } catch {}
  if (typeof saved !== 'object' || !saved) saved = {};
  $('letterName').value = typeof saved.name === 'string' ? saved.name : '';
  $('letterCity').value = typeof saved.city === 'string' ? saved.city : '';
  $('letterZip').value = typeof saved.zip === 'string' ? saved.zip : '';

  const greeting = official.greeting || `Dear Representative ${official.name.split(' ').at(-1)},`;
  let edited = false;
  function render() {
    if (edited) return;
    const details = { ...saved, name: $('letterName').value, city: $('letterCity').value, zip: $('letterZip').value };
    const name = details.name.trim() || '[Your name]';
    $('calloutBody').value = greeting + '\n\n' + callout.letter.message.replace('[Your name]', name).replace('[Your location]', M.location(details));
  }
  $('calloutSubject').value = callout.letter.subject;
  render();
  for (const id of ['letterName', 'letterCity', 'letterZip']) $(id).addEventListener('input', render);
  // Once the visitor edits the letter itself, the detail fields stop overwriting it.
  $('calloutBody').addEventListener('input', () => { edited = true; });

  let timer;
  function feedback(text) { $('feedback').textContent = text; $('feedback').classList.add('show'); clearTimeout(timer); timer = setTimeout(() => $('feedback').classList.remove('show'), 2600); }
  $('calloutCopy').onclick = async () => {
    const text = $('calloutBody').value;
    try { if (!navigator.clipboard?.writeText) throw new Error(); await navigator.clipboard.writeText(text); feedback('Copied. Ready to paste.'); return; } catch {}
    $('calloutBody').focus(); $('calloutBody').select();
    let ok = false; try { ok = document.execCommand('copy'); } catch {}
    feedback(ok ? 'Copied. Ready to paste.' : 'Clipboard unavailable. Text selected; use your device’s Copy command.');
  };
})();
