const express = require('express');
const bodyParser = require('body-parser');
const xhub = require('express-x-hub');

const app = express();
const PORT = process.env.PORT || 5000;
const APP_SECRET = process.env.APP_SECRET;
const VERIFY_TOKEN = process.env.TOKEN || 'token';

// In-memory store for raw messages
const customerMessages = {};

// Middleware
app.use(xhub({ algorithm: 'sha1', secret: APP_SECRET }));
app.use(bodyParser.json());

// Root GET: show stored messages
app.get('/', (req, res) => {
  res.send('<pre>' + JSON.stringify(customerMessages, null, 2) + '</pre>');
});

// Webhook verification endpoint for WhatsApp
app.get('/webhook', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified!');
    return res.status(200).send(challenge);
  }
  res.status(403).send('Forbidden');
});

// Webhook POST: receive WhatsApp messages
app.post('/webhook', (req, res) => {
  // Verify X-Hub signature
  if (!req.isXHubValid()) {
    console.log('Invalid X-Hub signature');
    return res.status(401).send('Invalid signature');
  }

  const entry = req.body.entry || [];
  entry.forEach(e => {
    (e.changes || []).forEach(change => {
      const value = change.value || {};
      if (!customerMessages[e.id]) customerMessages[e.id] = [];
      customerMessages[e.id].push(value); // store raw value
    });
  });

  console.log('Webhook received:', JSON.stringify(req.body, null, 2));
  res.status(200).send('EVENT_RECEIVED');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});