// server.js
const express = require('express');
const app = express();

// Parse JSON bodies
app.use(express.json());

// Port for Heroku or local
const PORT = process.env.PORT || 5000;

// Your verification token (same as in Meta dashboard)
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'token';

// GET endpoint — webhook verification
app.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified!');
    res.status(200).send(challenge);
  } else {
    console.log('Webhook verification failed!');
    res.sendStatus(403);
  }
});

// POST endpoint — handle incoming messages
app.post('/', (req, res) => {
  console.log('\n\n=== Incoming webhook ===');
  console.log(JSON.stringify(req.body, null, 2)); // full payload
  console.log('=======================\n\n');

  // Always acknowledge
  res.sendStatus(200);
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});