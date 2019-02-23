'use strict';

const QuickBooks = require('node-quickbooks')
const express = require('express');
const expressHandlebars = require('express-handlebars');

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
                           '2.0');
 
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

app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
