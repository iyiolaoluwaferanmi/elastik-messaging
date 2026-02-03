const express = require('express');
const app = express();

app.use(express.json());

const PORT = process.env.PORT || 5000;
const VERIFY_TOKEN = process.env.VERIFY_TOKEN || 'token';

// This stores all messages grouped by WA ID
const customerMessages = {};

// GET endpoint — verification OR show messages
app.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified!');
    return res.status(200).send(challenge);
  }

  // No verification params → show stored messages
  res.send('<pre>' + JSON.stringify(customerMessages, null, 2) + '</pre>');
});

// POST endpoint — receive WhatsApp messages
app.post('/', (req, res) => {
  console.log('\n\n=== Incoming webhook ===');
  console.log(JSON.stringify(req.body, null, 2));
  console.log('=======================\n\n');

// Store messages in-memory exactly as received
const entry = req.body.entry || [];
entry.forEach(e => {
  (e.changes || []).forEach(change => {
    const value = change.value || {};
    if (!customerMessages[e.id]) customerMessages[e.id] = [];
    customerMessages[e.id].push(value); // store the entire value object raw
  });
});

  res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));