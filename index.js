const express = require('express');
const bodyParser = require('body-parser');
const xhub = require('express-x-hub');
const app = express();

const PORT = process.env.PORT || 5000;
const APP_SECRET = process.env.APP_SECRET || 'YOUR_APP_SECRET';
const VERIFY_TOKEN = process.env.TOKEN || 'YOUR_VERIFY_TOKEN';

// Store raw webhook payloads in-memory
const customerMessages = [];

// Middleware
app.use(xhub({ algorithm: 'sha1', secret: APP_SECRET }));
app.use(bodyParser.json());

// Serve a simple page to show messages live
app.get('/', (req, res) => {
  let html = `
    <html>
      <head>
        <title>WhatsApp Webhook Live</title>
        <meta http-equiv="refresh" content="2">
        <style>pre { white-space: pre-wrap; word-wrap: break-word; }</style>
      </head>
      <body>
        <h2>WhatsApp Webhook Payloads (Auto-refresh every 2s)</h2>
        <pre>${JSON.stringify(customerMessages, null, 2)}</pre>
      </body>
    </html>
  `;
  res.send(html);
});

// Webhook verification (GET)
app.get('/webhook', (req, res) => {
  const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('Webhook verified!');
    return res.status(200).send(challenge);
  }
  res.status(403).send('Forbidden');
});

// Webhook POST (receives messages)
app.post('/webhook', (req, res) => {
  // Verify X-Hub signature
  if (!req.isXHubValid()) {
    console.log('Invalid X-Hub signature');
    return res.status(401).send('Invalid signature');
  }

  console.log('Webhook payload received:', JSON.stringify(req.body, null, 2));

  // Store the raw payload exactly as received
  customerMessages.push(req.body);

  // Acknowledge receipt
  res.status(200).send('EVENT_RECEIVED');
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});