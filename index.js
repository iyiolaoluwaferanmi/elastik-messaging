var bodyParser = require('body-parser');
var express = require('express');
var app = express();
var xhub = require('express-x-hub');

app.set('port', (process.env.PORT || 5000));
app.listen(app.get('port'), () => {
  console.log(`Server running on port ${app.get('port')}`);
});

app.use(xhub({ algorithm: 'sha1', secret: process.env.APP_SECRET }));
app.use(bodyParser.json());

var token = process.env.TOKEN || 'token';

// This stores all messages grouped by WA ID
const customerMessages = {};

// Root endpoint to view stored messages
app.get('/', function(req, res) {
  console.log(req);
  res.send('<pre>' + JSON.stringify(customerMessages, null, 2) + '</pre>');
});

// Webhook verification endpoints for Facebook, Instagram, and Threads
app.get(['/facebook', '/instagram', '/threads'], function(req, res) {
  if (
    req.query['hub.mode'] == 'subscribe' &&
    req.query['hub.verify_token'] == token
  ) {
    res.send(req.query['hub.challenge']);
  } else {
    res.sendStatus(400);
  }
});

// Endpoint to handle incoming POST requests from WhatsApp
app.post('/facebook', function(req, res) {
  console.log('Facebook request body:', JSON.stringify(req.body, null, 2));

  // Check for valid X-Hub signature
  if (!req.isXHubValid()) {
    console.log('Warning - request header X-Hub-Signature not present or invalid');
    res.sendStatus(401);
    return;
  }

  const entry = req.body.entry;
  entry.forEach(event => {
    event.changes.forEach(change => {
      const value = change.value;

      // Process messages if they exist in the incoming payload
      if (value.messages) {
        value.messages.forEach(message => {
          const wa_id = message.from;  // WhatsApp ID of the sender
          const timestamp = message.timestamp;  // Message timestamp
          const textBody = message.text?.body || message.button?.payload || '[non-text message]';  // Extracting message body

          // Now store the message
          storeMessage(wa_id, timestamp, textBody);  // 👈 Store it
        });
      }
    });
  });

  // Acknowledge receipt of the webhook
  res.sendStatus(200);
});

// Function to store messages in the customerMessages object
function storeMessage(wa_id, timestamp, textBody) {
  if (!customerMessages[wa_id]) {
    customerMessages[wa_id] = {};  // Initialize if the customer doesn't exist yet
  }

  // Format key like 'message_time_1', 'message_time_2', etc.
  const key = `message_time_${Object.keys(customerMessages[wa_id]).length + 1}`;

  // Store the message with timestamp and body
  customerMessages[wa_id][key] = {
    timestamp: timestamp,
    message: textBody
  };
}
