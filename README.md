# SYD204 — Task List API (Backend + Frontend)

A Task List REST API built three times (in-memory → MySQL → MVC), plus a browser
frontend that uses the API.

| Restaurant | This project |
|---|---|
| Dining room | `public/` (index.html, styles.css, app.js) |
| Menu | `src/routes/taskRoutes.js` |
| Chef | `src/controllers/taskController.js` |
| Pantry | `src/models/taskModel.js` |
| Mise en place | `src/db.js` (connection pool) |
| Secret recipe book | `.env` |

## 1. Install

```bash
npm install
```

## 2. Part 1 — in-memory (no database needed)

```bash
npm run start:part1        # node server-part1.js
```

Open http://localhost:3000 (health check) and http://localhost:3000/app (frontend).
Stop and restart: the tasks are gone. That is the limitation Part 2 fixes.

## 3. Part 2 — MySQL on Aiven

1. In Aiven, create your own service user on `mysql-20713dd0`
   (Users tab → Create service user → `caching_sha2_password`). Copy the password.
2. In MySQL Workbench, connect to host `mysql-20713dd0-rub-a06b.b.aivencloud.com`,
   port `15308`, your username, SSL required. Run `database/schema.sql`.
3. Copy `.env.example` to `.env` and put in YOUR username and password:
   ```bash
   cp .env.example .env
   ```
4. Prove the connection:
   ```bash
   npm run test:db          # expect: Connected to MySQL { ok: 1, db: 'defaultdb', ... }
   ```
5. Start the single-file MySQL server:
   ```bash
   npm start                # node server.js
   ```

Persistence proof: create a task, Ctrl+C, `npm start` again, GET /tasks — it is still there.

## 4. Part 3 — MVC

```bash
npm run start:mvc          # node server-mvc.js
```

Same endpoints, same JSON. Request flow:
`server-mvc.js → taskRoutes.js → taskController → taskModel → MySQL`

## Endpoints

| Method | URL | Body | Success | Errors |
|---|---|---|---|---|
| GET | `/` | – | 200 | – |
| GET | `/tasks` | – | 200 array (newest first) | 500 |
| GET | `/tasks/:id` | – | 200 | 404 |
| POST | `/tasks` | `{ "title": "..." }` | 201 | 400 |
| PUT | `/tasks/:id` | `{ "title": "...", "completed": true }` | 200 | 400, 404 |
| PATCH | `/tasks/:id` | `{ "completed": true }` and/or `{ "title": "..." }` | 200 | 400, 404 |
| DELETE | `/tasks/:id` | – | 204 | 404 |

(Part 1 has no PUT, as in the lab.)

## Frontend

Served by the same Express server at **http://localhost:3000/app**.

- Add a task (POST)
- Tick the checkbox to mark complete (PATCH `completed`)
- Edit or double-click a title to rename (PATCH `title`)
- Delete (DELETE)
- Filter All / To do / Done, live counts, API connection indicator

The browser never connects to MySQL. It only sends HTTP requests to `/tasks`.
Titles are shown with `textContent`, so a title like `<script>` is displayed as text.

## Security notes

- Every user value goes into SQL through `?` placeholders. POST a title of
  `'; DROP TABLE tasks; --` — it is stored as plain text and the table survives.
- `.env` is in `.gitignore`. Only `.env.example` (no real password) is committed.
- The error handler logs `err.stack` on the server and never sends it to the client.

## Testing checklist (Postman / Thunder Client)

| # | Request | Expect |
|---|---|---|
| 1 | GET / | 200 |
| 2 | GET /tasks | 200 array |
| 3 | POST /tasks `{ "title": "Task A" }` | 201 |
| 4 | POST /tasks `{ "title": "Task B" }` | 201 |
| 5 | GET /tasks/&lt;id of A&gt; | 200 |
| 6 | GET /tasks/9999 | 404 |
| 7 | PATCH /tasks/&lt;id&gt; `{ "completed": true }` | 200 |
| 8 | PUT /tasks/&lt;id&gt; `{ "title": "...", "completed": true }` | 200 |
| 9 | DELETE /tasks/&lt;your id&gt; | 204 |
| 10 | GET /tasks/&lt;deleted id&gt; | 404 |
| 11 | POST /tasks `{}` | 400 |
| 12 | POST /tasks `{ "title": "'; DROP TABLE tasks; --" }` | 201, table still exists |

## Troubleshooting

| Symptom | Fix |
|---|---|
| `ECONNREFUSED` / timeout | Port must be 15308, not 3306; check DB_HOST |
| TLS / SSL error | `DB_SSL=REQUIRED` in `.env` |
| `Access denied for user` | Wrong DB_USER / DB_PASS — use your own service user, not avnadmin |
| `req.body` is undefined | `app.use(express.json())` must come before routes |
| `EADDRINUSE: 3000` | Another server is running — Ctrl+C it, or set `PORT=3001` |
| `Table 'defaultdb.tasks' doesn't exist` | Run `database/schema.sql` in Workbench |
