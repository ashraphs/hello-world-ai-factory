const express = require('express');
const app = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('Hello World — deployed through OpenWebUI, Codex CLI, GitHub, and Coolify.');
});

app.get('/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

const server = app.listen(PORT, () => {
  console.log(`Hello World app listening on port ${PORT}`);
});

module.exports = { app, server };
