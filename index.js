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

  // Store messages in-memory
  const entry = req.body.entry || [];
  entry.forEach(e => {
    (e.changes || []).forEach(change => {
      const value = change.value || {};
      (value.messages || []).forEach(msg => {
        const wa_id = msg.from;
        const ts = msg.timestamp;
        if (!customerMessages[wa_id]) customerMessages[wa_id] = [];
        customerMessages[wa_id].push({ timestamp: ts, message: msg.text?.body || '[non-text]' });
      });
    });
  });

  res.sendStatus(200);
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));