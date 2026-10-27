// test-api.js — runs the 12-step SYD204 test sequence against your running API.
// Usage: start the server (npm run start:mvc), then in a SECOND terminal run:
//   node test-api.js
// Needs no extra packages (uses Node 18+ built-in fetch).

const BASE = process.env.BASE_URL || 'http://localhost:3000';
let passed = 0;
let failed = 0;

async function call(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: { 'Content-Type': 'application/json' },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  return { status: res.status, data };
}

function check(num, label, res, expectedStatus, extra = true) {
  const ok = res.status === expectedStatus && extra;
  ok ? passed++ : failed++;
  const mark = ok ? 'PASS' : 'FAIL';
  console.log(`${mark}  ${String(num).padStart(2)}. ${label.padEnd(48)} → ${res.status} (expected ${expectedStatus})`);
  if (res.data !== null && res.data !== '') {
    const shown = JSON.stringify(res.data);
    console.log(`        ${shown.length > 110 ? shown.slice(0, 110) + '…' : shown}`);
  }
}

async function main() {
  console.log(`\nTesting ${BASE}\n`);

  let r = await call('GET', '/');
  check(1, 'GET /  (health check)', r, 200);

  r = await call('GET', '/tasks');
  check(2, 'GET /tasks  (list)', r, 200, Array.isArray(r.data));

  r = await call('POST', '/tasks', { title: 'Ugyen - Task A' });
  check(3, 'POST /tasks  { title: "Task A" }', r, 201, r.data && r.data.id && r.data.created_at);
  const idA = r.data && r.data.id;

  r = await call('POST', '/tasks', { title: 'Ugyen - Task B' });
  check(4, 'POST /tasks  { title: "Task B" }', r, 201);
  const idB = r.data && r.data.id;

  r = await call('GET', `/tasks/${idA}`);
  check(5, `GET /tasks/${idA}  (Task A)`, r, 200, r.data && r.data.id === idA);

  r = await call('GET', '/tasks/9999');
  check(6, 'GET /tasks/9999  (missing)', r, 404);

  r = await call('PATCH', `/tasks/${idA}`, { completed: true });
  check(7, `PATCH /tasks/${idA}  { completed: true }`, r, 200, r.data && Boolean(Number(r.data.completed)));

  r = await call('PUT', `/tasks/${idB}`, { title: 'Ugyen - Connect to MySQL (done)', completed: true });
  check(8, `PUT /tasks/${idB}  { title, completed }`, r, 200, r.data && r.data.title === 'Ugyen - Connect to MySQL (done)');

  r = await call('DELETE', `/tasks/${idA}`);
  check(9, `DELETE /tasks/${idA}`, r, 204);

  r = await call('GET', `/tasks/${idA}`);
  check(10, `GET /tasks/${idA}  (deleted)`, r, 404);

  r = await call('POST', '/tasks', {});
  check(11, 'POST /tasks  { }  (validation)', r, 400);

  const evil = "'; DROP TABLE tasks; --";
  r = await call('POST', '/tasks', { title: evil });
  check(12, 'POST /tasks  SQL injection title', r, 201, r.data && r.data.title === evil);

  r = await call('GET', '/tasks');
  check(13, 'GET /tasks  (table still exists)', r, 200, Array.isArray(r.data));

  console.log(`\n${passed} passed, ${failed} failed\n`);
  process.exit(failed ? 1 : 0);
}

main().catch((err) => {
  console.error('\nCould not reach the server:', err.cause?.code || err.message);
  console.error('Start it first with: npm run start:mvc\n');
  process.exit(1);
});
