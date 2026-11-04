(() => {
  const STORAGE_KEY = 'mindmate-private-space-v1';
  const moods = [
    { id: 'grounded', label: 'Grounded', emoji: '🌿' },
    { id: 'okay', label: 'Okay', emoji: '☀️' },
    { id: 'tense', label: 'Tense', emoji: '🌧️' },
    { id: 'low', label: 'Low', emoji: '🌙' },
    { id: 'energized', label: 'Energized', emoji: '✨' },
  ];
  const prompts = [
    'What is one small thing that felt good today?',
    'What would you say to a friend feeling the way you do?',
    'What can wait until tomorrow?',
    'When did you feel most like yourself today?',
    'What is something you handled, even if it was hard?',
    'What does your body need a little more of right now?',
    'What would make the next hour feel gentler?',
    'What is one thing you can let be unfinished?',
  ];
  let data = loadData();
  let selectedMood = '';
  let toastTimeout;
  let breathTimer;
  let breathElapsed = 0;
  let breathing = false;
  const $ = (selector) => document.querySelector(selector);
  const $$ = (selector) => [...document.querySelectorAll(selector)];
  const today = new Date();
  const dateKey = localDateKey(today);
  selectedMood = data.moods.find((item) => item.date === dateKey)?.mood || '';
  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

  function loadData() {
    try {
      const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
      return { moods: Array.isArray(saved.moods) ? saved.moods : [], entries: Array.isArray(saved.entries) ? saved.entries : [] };
    } catch { return { moods: [], entries: [] }; }
  }
  function persist() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return true; }
    catch { showToast('This browser could not save your note. Try exporting it before you leave.'); return false; }
  }
  function localDateKey(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }
  function prettyDate(value, options = { month: 'short', day: 'numeric', year: 'numeric' }) {
    const date = new Date(`${value}T12:00:00`);
    return Number.isNaN(date.getTime()) ? '' : new Intl.DateTimeFormat(undefined, options).format(date);
  }
  function moodById(id) { return moods.find((mood) => mood.id === id); }
  function renderMoodButtons() {
    ['#today-moods', '#reflect-moods'].forEach((selector) => {
      const host = $(selector);
      host.innerHTML = moods.map((mood) => `<button class="mood-choice" type="button" data-mood="${mood.id}" aria-pressed="false"><span class="mood-emoji" aria-hidden="true">${mood.emoji}</span><span>${mood.label}</span></button>`).join('');
    });
  }
  function setPage(page) {
    $$('.page').forEach((section) => section.classList.toggle('active', section.id === `page-${page}`));
    $$('[data-page]').forEach((button) => button.classList.toggle('active', button.dataset.page === page));
    if (page === 'journal') renderEntries();
    if (page === 'reflect') renderMoodHistory();
    $('#main-content').focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  function showToast(message) {
    const toast = $('#toast');
    toast.textContent = message;
    toast.classList.add('visible');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => toast.classList.remove('visible'), 3000);
  }
  function saveMood(id, note = '') {
    const mood = moodById(id);
    if (!mood) return;
    data.moods = data.moods.filter((item) => item.date !== dateKey);
    data.moods.unshift({ id: crypto.randomUUID?.() || String(Date.now()), mood: id, note: note.trim(), date: dateKey, createdAt: new Date().toISOString() });
    const stored = persist();
    selectedMood = id;
    renderToday();
    renderMoodHistory();
    const feedback = $('#mood-feedback');
    if (feedback) feedback.textContent = stored ? `Saved. You checked in as feeling ${mood.label.toLowerCase()}.` : 'This check-in is only in the open tab; this browser could not store it.';
    if (stored) showToast('Check-in saved for today.');
  }
  function renderToday() {
    const todaysMood = data.moods.find((item) => item.date === dateKey);
    $('#last-checkin').innerHTML = todaysMood ? `<span class="last-dot">●</span> Today you felt <strong>${esc(moodById(todaysMood.mood)?.label || 'something new')}</strong>${todaysMood.note ? ` <span class="last-note">· “${esc(todaysMood.note)}”</span>` : ''}` : '';
    const sorted = [...data.entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    $('#recent-entries').innerHTML = sorted.length ? sorted.slice(0, 3).map((entry) => `<article class="recent-note"><span>${esc(prettyDate(entry.date))}</span><h3>${esc(entry.title || 'A private note')}</h3><p>${esc(entry.body.slice(0, 145))}${entry.body.length > 145 ? '…' : ''}</p></article>`).join('') : '<div class="empty-note">Your journal is a blank page for now. That’s a lovely place to begin.</div>';
  }
  function renderMoodHistory() {
    const host = $('#mood-history');
    if (!host) return;
    const recent = [...data.moods].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 12);
    host.innerHTML = recent.length ? `<div class="history-list">${recent.map((item) => { const mood = moodById(item.mood); return `<article class="history-row"><span class="history-emoji">${mood?.emoji || '◦'}</span><span class="history-name">${esc(mood?.label || 'Check-in')}</span><span class="history-date">${esc(prettyDate(item.date))}</span>${item.note ? `<p>${esc(item.note)}</p>` : ''}</article>`; }).join('')}</div>` : '<div class="empty-note">Your check-ins will be here when you are ready.</div>';
  }
  function renderEntries() {
    const sorted = [...data.entries].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    $('#entry-total').textContent = `${sorted.length} ${sorted.length === 1 ? 'note' : 'notes'}`;
    $('#all-entries').innerHTML = sorted.length ? sorted.map((entry) => `<article class="entry-row"><div><span>${esc(prettyDate(entry.date))}</span><h3>${esc(entry.title || 'A private note')}</h3><p>${esc(entry.body.slice(0, 220))}${entry.body.length > 220 ? '…' : ''}</p></div><button class="delete-entry" type="button" data-delete-entry="${esc(entry.id)}" aria-label="Delete ${esc(entry.title || 'private note')}">×</button></article>`).join('') : '<div class="empty-note">Your notes will appear here. They are only saved in this browser.</div>';
  }
  function renderPrompt() {
    const dayOfYear = Math.floor((new Date(today.getFullYear(), today.getMonth(), today.getDate()) - new Date(today.getFullYear(), 0, 0)) / 86400000);
    const chosen = prompts[dayOfYear % prompts.length];
    $('#daily-prompt').textContent = chosen;
    $('#prompt-list').innerHTML = prompts.slice(dayOfYear % prompts.length, dayOfYear % prompts.length + 3).concat(prompts.slice(0, Math.max(0, dayOfYear % prompts.length + 3 - prompts.length))).map((prompt) => `<button class="prompt-option" type="button">${esc(prompt)} <span>＋</span></button>`).join('');
  }
  function openPrivacy() { $('#privacy-dialog').showModal(); }
  function exportData() {
    const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), ...data }, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = Object.assign(document.createElement('a'), { href: url, download: `mindmate-notes-${dateKey}.json` });
    link.click(); URL.revokeObjectURL(url); showToast('Your data export is ready.');
  }
  function clearData() {
    if (!window.confirm('Delete all MindMate check-ins and journal notes saved in this browser? This cannot be undone.')) return;
    data = { moods: [], entries: [] }; selectedMood = ''; localStorage.removeItem(STORAGE_KEY); updateMoodPressed(); renderToday(); renderEntries(); renderMoodHistory(); $('#privacy-dialog').close(); showToast('Your saved MindMate data was deleted.');
  }
  function breathStep() {
    const cycle = breathElapsed % 14;
    let phase, remaining, instruction, size;
    if (cycle < 4) { phase = 'INHALE'; remaining = 4 - cycle; instruction = 'Breathe in slowly through the nose, if comfortable.'; size = 'expanded'; }
    else if (cycle < 8) { phase = 'PAUSE'; remaining = 8 - cycle; instruction = 'Let the breath rest. Skip the pause if it feels uncomfortable.'; size = 'expanded'; }
    else { phase = 'EXHALE'; remaining = 14 - cycle; instruction = 'Let the breath out gently. There is no need to force it.'; size = 'softened'; }
    $('#breath-phase').textContent = `${phase} · ${remaining}`;
    $('#breath-instruction').textContent = instruction;
    $('#session-orb').classList.toggle('expanded', size === 'expanded');
    $('#session-orb').classList.toggle('softened', size === 'softened');
  }
  function toggleBreathing() {
    if (breathing) {
      breathing = false; clearInterval(breathTimer); $('#breath-phase').textContent = 'PAUSED'; $('#breath-instruction').textContent = 'Take a moment, then return to your natural breathing.'; $('#breath-toggle').innerHTML = 'Continue <span>↗</span>'; $('#session-orb').classList.remove('expanded', 'softened'); return;
    }
    if (breathElapsed >= 120) breathElapsed = 0;
    breathing = true; $('#breath-toggle').textContent = 'Pause'; breathStep();
    breathTimer = setInterval(() => {
      breathElapsed += 1;
      if (breathElapsed >= 120) { clearInterval(breathTimer); breathing = false; $('#breath-phase').textContent = 'COMPLETE'; $('#breath-instruction').textContent = 'You made a little space for yourself. Take the rest of your day at your own pace.'; $('#breath-toggle').innerHTML = 'Start again <span>↗</span>'; $('#session-orb').classList.remove('expanded', 'softened'); return; }
      breathStep();
    }, 1000);
  }

  document.addEventListener('click', (event) => {
    const pageButton = event.target.closest('[data-page]');
    if (pageButton) { setPage(pageButton.dataset.page); return; }
    const moodButton = event.target.closest('[data-mood]');
    if (moodButton) {
      const id = moodButton.dataset.mood;
      if (moodButton.closest('#today-moods')) { setPage('reflect'); selectedMood = id; updateMoodPressed(); }
      else { selectedMood = id; updateMoodPressed(); }
      return;
    }
    const action = event.target.closest('[data-action]')?.dataset.action;
    if (action === 'privacy') openPrivacy();
    if (action === 'close-dialog') $('#privacy-dialog').close();
    if (action === 'export') exportData();
    if (action === 'clear-data') clearData();
    const prompt = event.target.closest('.prompt-option');
    if (prompt) { $('#entry-body').value = `${prompt.textContent.replace('＋', '').trim()}\n\n`; $('#entry-body').focus(); updateEntryCount(); }
    const deleteButton = event.target.closest('[data-delete-entry]');
    if (deleteButton && confirm('Delete this journal note?')) { data.entries = data.entries.filter((item) => item.id !== deleteButton.dataset.deleteEntry); persist(); renderEntries(); renderToday(); showToast('Journal note deleted.'); }
  });
  function updateMoodPressed() { $$('[data-mood]').forEach((button) => { button.setAttribute('aria-pressed', String(button.dataset.mood === selectedMood)); }); }
  $('#mood-form').addEventListener('submit', (event) => { event.preventDefault(); if (!selectedMood) { $('#mood-feedback').textContent = 'Choose the feeling that fits best, or skip the check-in for now.'; return; } saveMood(selectedMood, $('#mood-note').value); });
  $('#mood-note').addEventListener('input', (event) => { $('#mood-char-count').textContent = `${event.target.value.length} / 280`; });
  $('#journal-form').addEventListener('submit', (event) => {
    event.preventDefault(); const body = $('#entry-body').value.trim(); if (!body) return;
    data.entries.unshift({ id: crypto.randomUUID?.() || String(Date.now()), date: dateKey, createdAt: new Date().toISOString(), title: $('#entry-title').value.trim(), body });
    const stored = persist(); event.target.reset(); updateEntryCount(); renderEntries(); renderToday(); $('#journal-feedback').textContent = stored ? 'Your note is saved in this browser.' : 'Your note is only in the open tab; this browser could not store it.'; if (stored) showToast('Your note is saved.');
  });
  function updateEntryCount() { $('#entry-char-count').textContent = `${$('#entry-body').value.length.toLocaleString()} / 5,000`; }
  $('#entry-body').addEventListener('input', updateEntryCount);
  $('#breath-toggle').addEventListener('click', toggleBreathing);
  $('#privacy-dialog').addEventListener('click', (event) => { if (event.target === $('#privacy-dialog')) $('#privacy-dialog').close(); });

  renderMoodButtons(); updateMoodPressed(); renderPrompt(); renderToday(); renderEntries(); renderMoodHistory();
  $('#today-date').textContent = new Intl.DateTimeFormat(undefined, { weekday: 'long', month: 'long', day: 'numeric' }).format(today);
})();
