'use strict';

const QuickBooks = require('node-quickbooks')
const Clarifai = require('clarifai');
const express = require('express');
const expressHandlebars = require('express-handlebars');

const qbo = new QuickBooks(process.env.QUICKBOOKS_CLIENT_ID,
                           process.env.QUICKBOOKS_CLIENT_SECRET,
                           process.env.QUICKBOOKS_ACCESS_TOKEN,
                           null,
                           process.env.QUICKBOOKS_REALM_ID,
                           true,
                           true,
                           34,
                           '2.0');
 
const clarifai = new Clarifai.App({
  apiKey: process.env.CLARIFAI_API_KEY
});
 
const app = express();
app.engine('handlebars', expressHandlebars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.set('views', './views');

app.get('/', (req, res) => {
  qbo.findAttachables((e, attachables) => {
    if (e) {
      return res.status(500).json(e);
    }

    var attachableUrls = {};
    attachables = attachables.QueryResponse.Attachable;
    for (var ii = 0; ii < attachables.length; ii++) {
      var attachable = attachables[ii];
      if (attachable.AttachableRef) {
        for (var jj = 0; jj < attachable.AttachableRef.length; jj++) {
          var attachableRef = attachable.AttachableRef[jj];
          if (attachableRef.EntityRef.type == 'Item') {
            attachableUrls[attachableRef.EntityRef.value] = attachable.TempDownloadUri;
          }
        }
      }
    }

    qbo.findItems((e, items) => {
      if (e) {
        return res.status(500).json(e);
      }

      var itemUrls = [];
      items = items.QueryResponse.Item;
      for (var ii = 0; ii < items.length; ii++) {
        var item = items[ii];
        itemUrls.push({'Id': item.Id, 'Url': attachableUrls[item.Id]});
      }

      res.render('attachables', {'Items': itemUrls});
    });
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
