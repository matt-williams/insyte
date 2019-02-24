'use strict';

const QuickBooks = require('node-quickbooks')
const Clarifai = require('clarifai');
const express = require('express');
const expressHandlebars = require('express-handlebars');

//const qbo = new QuickBooks(process.env.QUICKBOOKS_CLIENT_ID,
//                           process.env.QUICKBOOKS_CLIENT_SECRET,
//                           process.env.QUICKBOOKS_ACCESS_TOKEN,
//                           null,
//                           process.env.QUICKBOOKS_REALM_ID,
//                           true,
//                           false,
//                           35,
//                           '2.0');
//
//const clarifai = new Clarifai.App({
//  apiKey: process.env.CLARIFAI_API_KEY
//});

const app = express();
app.use(express.static('static'))
app.engine('handlebars', expressHandlebars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.set('views', './views');

app.get('/', (req, res) => {
  const items = require('./items.json');
  res.render('attachables', {'items': items});

//  qbo.findAttachables((err, attachables) => {
//    if (err) {
//      return res.status(500).json(err);
//    }
//
//    var itemUrls = {};
//    attachables = attachables.QueryResponse.Attachable;
//    for (var ii = 0; ii < attachables.length; ii++) {
//      var attachable = attachables[ii];
//      if (attachable.AttachableRef) {
//        for (var jj = 0; jj < attachable.AttachableRef.length; jj++) {
//          var attachableRef = attachable.AttachableRef[jj];
//          if (attachableRef.EntityRef.type == 'Item') {
//            itemUrls[attachableRef.EntityRef.value] = attachable.TempDownloadUri;
//          }
//        }
//      }
//    }
//
//    qbo.findItems((err, items) => {
//      if (err) {
//        return res.status(500).json(err);
//      }
//
//
//      var inputs = [];
//      items = items.QueryResponse.Item;
//      for (var ii = 0; ii < items.length; ii++) {
//        var item = items[ii];
//        var id = item.Id;
//        var url = itemUrls[id];
//        if (url) {
//          inputs.push({'id': id, 'url': url, 'metadata': {'quickbooks_realm_id': process.env.QUICKBOOKS_REALM_ID}});
//        }
//      }
//
//      clarifai.inputs.list({perPage: 1000}).then((oldInputs) => {
//        console.log(oldInputs);
//
////        clarifai.inputs.create(inputs).then(() => {
//          res.render('attachables', {'items': inputs});
////        }, (err) => {
////          res.status(500).json(err);
////        });
//      }, (err) => {
//        res.status(500).json(err);
//      });
//    });
//  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
