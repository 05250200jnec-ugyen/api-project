// server-part1.js — PART 1 complete (in-memory Task API)
// Run: node server-part1.js   (no database needed — data is lost on restart)
const path = require('path');
const express = require('express');
const app = express();

app.use(express.json());
app.use('/app', express.static(path.join(__dirname, 'public')));

const PORT = process.env.PORT || 3000;

// Temporary "database" — a JavaScript array
let tasks = [];
let nextId = 1;

// Health check
app.get('/', (req, res) => {
  res.json({ message: 'Task API is ready! 🚀' });
});

// GET /tasks — return every task
app.get('/tasks', (req, res) => {
  res.json(tasks);
});

// POST /tasks — create a task
app.post('/tasks', (req, res) => {
  const { title } = req.body;

  if (!title || typeof title !== 'string' || title.trim() === '') {
    return res.status(400).json({ error: 'Title is required' });
  }

  const newTask = {
    id: nextId++,
    title: title.trim(),
    completed: false,
  };

  tasks.push(newTask);
  res.status(201).json(newTask);
});

// GET /tasks/:id — return one task
app.get('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const task = tasks.find((item) => item.id === id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  res.json(task);
});

// PATCH /tasks/:id — update title and/or completed
app.patch('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const { title, completed } = req.body;
  const task = tasks.find((item) => item.id === id);

  if (!task) {
    return res.status(404).json({ error: 'Task not found' });
  }
  if (completed !== undefined && typeof completed !== 'boolean') {
    return res.status(400).json({ error: 'completed must be true or false' });
  }
  if (title !== undefined && (typeof title !== 'string' || title.trim() === '')) {
    return res.status(400).json({ error: 'Title cannot be empty' });
  }

  if (completed !== undefined) task.completed = completed;
  if (title !== undefined) task.title = title.trim();
  res.json(task);
});

// DELETE /tasks/:id — remove a task
app.delete('/tasks/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const index = tasks.findIndex((item) => item.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Task not found' });
  }

  tasks.splice(index, 1);
  res.status(204).send();
});

app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.stack);
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  res.status(err.statusCode || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`Frontend:          http://localhost:${PORT}/app`);
  console.log('GET    /tasks');
  console.log('POST   /tasks');
  console.log('GET    /tasks/:id');
  console.log('PATCH  /tasks/:id');
  console.log('DELETE /tasks/:id');
});
