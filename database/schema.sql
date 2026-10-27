-- database/schema.sql
-- Run this in MySQL Workbench against the class Aiven server.
-- The Aiven database name is defaultdb — do not CREATE DATABASE.

USE defaultdb;

CREATE TABLE IF NOT EXISTS tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Seed a few rows only if the table is empty
INSERT INTO tasks (title, completed)
SELECT * FROM (
  SELECT 'Set up the Node.js project', FALSE UNION ALL
  SELECT 'Install Express and mysql2', TRUE UNION ALL
  SELECT 'Create the database schema', TRUE UNION ALL
  SELECT 'Build the GET /tasks route', FALSE UNION ALL
  SELECT 'Build the POST /tasks route', FALSE UNION ALL
  SELECT 'Test all endpoints in Postman', FALSE
) AS seed_data
WHERE NOT EXISTS (SELECT 1 FROM tasks LIMIT 1);

SELECT 'Setup complete' AS status;
SELECT * FROM tasks;
