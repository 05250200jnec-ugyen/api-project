// public/app.js — the "dining room".
// The browser never touches MySQL. It only talks HTTP to our Express API.

const API = '/tasks';

const els = {
  form: document.getElementById('add-form'),
  input: document.getElementById('new-title'),
  list: document.getElementById('list'),
  empty: document.getElementById('empty'),
  error: document.getElementById('error'),
  status: document.getElementById('status'),
  refresh: document.getElementById('refresh'),
  template: document.getElementById('task-template'),
  filters: document.querySelectorAll('[data-filter]'),
  countAll: document.getElementById('count-all'),
  countActive: document.getElementById('count-active'),
  countDone: document.getElementById('count-done'),
};

let tasks = [];
let filter = 'all';

// ---------- API helpers (one per HTTP method) ----------

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (res.status === 204) return null; // DELETE: no body
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}

const api = {
  list: () => request(API),                                                     // GET
  create: (title) => request(API, { method: 'POST', body: JSON.stringify({ title }) }), // POST
  patch: (id, fields) => request(`${API}/${id}`, { method: 'PATCH', body: JSON.stringify(fields) }), // PATCH
  remove: (id) => request(`${API}/${id}`, { method: 'DELETE' }),                // DELETE
};

// MySQL returns completed as 0/1; the in-memory version returns true/false.
const isDone = (task) => Boolean(Number(task.completed));

// ---------- UI helpers ----------

function showError(message) {
  els.error.textContent = message;
  els.error.hidden = false;
  clearTimeout(showError.timer);
  showError.timer = setTimeout(() => (els.error.hidden = true), 5000);
}

function setStatus(online) {
  els.status.textContent = online ? 'connected' : 'offline';
  els.status.className = `status ${online ? 'online' : 'offline'}`;
}

function formatDate(value) {
  if (!value) return '';
  const d = new Date(value);
  return isNaN(d) ? '' : d.toLocaleString(undefined, { dateStyle: 'medium', timeStyle: 'short' });
}

function render() {
  const done = tasks.filter(isDone).length;
  els.countAll.textContent = tasks.length;
  els.countDone.textContent = done;
  els.countActive.textContent = tasks.length - done;

  const visible = tasks.filter((t) =>
    filter === 'all' ? true : filter === 'done' ? isDone(t) : !isDone(t)
  );

  els.list.replaceChildren(...visible.map(renderTask));
  els.empty.hidden = visible.length > 0;
}

function renderTask(task) {
  const li = els.template.content.firstElementChild.cloneNode(true);
  const done = isDone(task);
  li.dataset.id = task.id;
  li.classList.toggle('done', done);

  const toggle = li.querySelector('.toggle');
  toggle.checked = done;
  toggle.addEventListener('change', () => toggleTask(task, toggle.checked));

  // textContent (not innerHTML) so a title like "<script>" is shown as text
  const title = li.querySelector('.title');
  title.textContent = task.title;
  title.addEventListener('dblclick', () => startEdit(li, task));

  li.querySelector('.meta').textContent =
    `#${task.id}` + (task.created_at ? ` · ${formatDate(task.created_at)}` : '');

  li.querySelector('.edit').addEventListener('click', () => startEdit(li, task));
  li.querySelector('.delete').addEventListener('click', () => deleteTask(task));
  return li;
}

function startEdit(li, task) {
  const body = li.querySelector('.body');
  const input = document.createElement('input');
  input.type = 'text';
  input.maxLength = 255;
  input.value = task.title;
  body.replaceChildren(input);
  input.focus();
  input.select();

  let finished = false;
  const finish = async (save) => {
    if (finished) return;
    finished = true;
    const value = input.value.trim();
    if (save && value && value !== task.title) {
      try {
        const updated = await api.patch(task.id, { title: value });
        replaceTask(updated);
      } catch (err) {
        showError(err.message);
      }
    }
    render();
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') finish(true);
    if (e.key === 'Escape') finish(false);
  });
  input.addEventListener('blur', () => finish(true));
}

function replaceTask(updated) {
  tasks = tasks.map((t) => (t.id === updated.id ? updated : t));
}

// ---------- Actions ----------

async function loadTasks() {
  try {
    tasks = await api.list();
    setStatus(true);
    render();
  } catch (err) {
    setStatus(false);
    showError(`Could not load tasks: ${err.message}`);
  }
}

async function addTask(e) {
  e.preventDefault();
  const title = els.input.value.trim();
  if (!title) return;

  const button = els.form.querySelector('button');
  button.disabled = true;
  try {
    const created = await api.create(title);
    tasks.unshift(created); // newest first, same as ORDER BY created_at DESC
    els.input.value = '';
    render();
  } catch (err) {
    showError(err.message);
  } finally {
    button.disabled = false;
    els.input.focus();
  }
}

async function toggleTask(task, completed) {
  try {
    const updated = await api.patch(task.id, { completed });
    replaceTask(updated);
  } catch (err) {
    showError(err.message);
  }
  render();
}

async function deleteTask(task) {
  if (!confirm(`Delete "${task.title}"?`)) return;
  try {
    await api.remove(task.id);
    tasks = tasks.filter((t) => t.id !== task.id);
    render();
  } catch (err) {
    showError(err.message);
    loadTasks(); // re-sync if the task was already gone (404)
  }
}

// ---------- Wire up ----------

els.form.addEventListener('submit', addTask);
els.refresh.addEventListener('click', loadTasks);
els.filters.forEach((btn) =>
  btn.addEventListener('click', () => {
    filter = btn.dataset.filter;
    els.filters.forEach((b) => b.classList.toggle('active', b === btn));
    render();
  })
);

loadTasks();
