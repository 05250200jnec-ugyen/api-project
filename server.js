// server.js — PART 2 complete (MySQL, single file)
require('dotenv').config(); // MUST be the first line
const path = require('path');
const express = require('express');
const pool = require('./src/db');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use('/app', express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.json({ message: 'Task API is ready! 🚀', version: 'MySQL edition' });
});

// GET /tasks
app.get('/tasks', async (req, res, next) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM tasks ORDER BY created_at DESC'
    );
    res.json(rows);
  } catch (err) {
    next(err);
  }
});

// GET /tasks/:id
app.get('/tasks/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);

    if (!rows[0]) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// POST /tasks
app.post('/tasks', async (req, res, next) => {
  try {
    const { title, completed = false } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }

    const [result] = await pool.query(
      'INSERT INTO tasks (title, completed) VALUES (?, ?)',
      [title.trim(), completed]
    );

    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PUT /tasks/:id (full replacement)
app.put('/tasks/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;

    if (!title || typeof title !== 'string' || title.trim() === '') {
      return res.status(400).json({ error: 'Title is required' });
    }
    if (typeof completed !== 'boolean') {
      return res.status(400).json({ error: 'completed must be true or false' });
    }

    const [result] = await pool.query(
      'UPDATE tasks SET title = ?, completed = ? WHERE id = ?',
      [title.trim(), completed, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// PATCH /tasks/:id (partial update)
app.patch('/tasks/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, completed } = req.body;

    if (title === undefined && completed === undefined) {
      return res.status(400).json({ error: 'Provide title or completed to update' });
    }

    const updates = [];
    const values = [];

    if (title !== undefined) {
      if (typeof title !== 'string' || title.trim() === '') {
        return res.status(400).json({ error: 'Title cannot be empty' });
      }
      updates.push('title = ?');
      values.push(title.trim());
    }

    if (completed !== undefined) {
      if (typeof completed !== 'boolean') {
        return res.status(400).json({ error: 'completed must be true or false' });
      }
      updates.push('completed = ?');
      values.push(completed);
    }

    values.push(id);

    const [result] = await pool.query(
      `UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }

    const [rows] = await pool.query('SELECT * FROM tasks WHERE id = ?', [id]);
    res.json(rows[0]);
  } catch (err) {
    next(err);
  }
});

// DELETE /tasks/:id
app.delete('/tasks/:id', async (req, res, next) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query('DELETE FROM tasks WHERE id = ?', [id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ error: 'Task not found' });
    }
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

// Global error handler — 4 parameters so Express treats it as an error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  res.status(err.statusCode || 500).json({
    error: err.statusCode ? err.message : 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
  console.log(`Frontend:          http://localhost:${PORT}/app`);
  console.log('GET    /tasks');
  console.log('GET    /tasks/:id');
  console.log('POST   /tasks');
  console.log('PUT    /tasks/:id');
  console.log('PATCH  /tasks/:id');
  console.log('DELETE /tasks/:id');
});
