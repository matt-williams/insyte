'use strict';

const express = require('express');
const QuickBooks = require('node-quickbooks')

const PORT = process.env.PORT || 8080;
const QB_CLIENT_ID = process.env.QB_CLIENT_ID;
const QB_CLIENT_SECRET = process.env.QB_CLIENT_SECRET;
const QB_ACCESS_TOKEN = process.env.QB_ACCESS_TOKEN;
const QB_REALM_ID = process.env.QB_REALM_ID;

const qbo = new QuickBooks(QB_CLIENT_ID,
                           QB_CLIENT_SECRET,
                           QB_ACCESS_TOKEN,
                           null,
                           QB_REALM_ID,
                           true,
                           true,
                           34,
                           "2.0");
 
const app = express();

app.get('/', (req, res) => {
  qbo.findCustomers({
    fetchAll: true
  }, function(e, customers) {
    res.send(`Hello ${customers.QueryResponse.Customer[0].DisplayName}`);
  })
});

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
