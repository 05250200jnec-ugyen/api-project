// server-mvc.js — PART 3 complete (MVC entry point) + frontend
require('dotenv').config();
const path = require('path');
const express = require('express');
const taskRoutes = require('./src/routes/taskRoutes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Frontend (the "dining room") — open http://localhost:3000/app
app.use('/app', express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
  res.json({ message: 'Task API (MVC version) is ready!' });
});

// Every route inside taskRoutes is prefixed with /tasks
app.use('/tasks', taskRoutes);

// Unknown URL → 404 JSON
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Global error handler — 4 parameters so Express treats it as an error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  // Bad JSON in the request body is the client's fault → 400
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'Invalid JSON body' });
  }
  res.status(err.statusCode || 500).json({
    error: err.statusCode ? err.message : 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`MVC server running at http://localhost:${PORT}`);
  console.log(`Frontend:            http://localhost:${PORT}/app`);
});
