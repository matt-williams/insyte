'use strict';

const QuickBooks = require('node-quickbooks')
const Clarifai = require('clarifai');
const RssParser = require('rss-parser');
const parse5 = require('parse5');
const express = require('express');
const expressHandlebars = require('express-handlebars');

const rssParser = new RssParser();

async function getRssImages(feedUrl) {
  let feed = await rssParser.parseURL(feedUrl);
  var imageUrls = [];
  feed.items.forEach(item => {
    function findImages(el) {
      if (el.tagName == 'img') {
        el.attrs.filter((attr) => attr.name == 'src').map((attr) => attr.value).forEach((imageUrl) => imageUrls.push(imageUrl));
      }
      if (el.childNodes) {
        el.childNodes.forEach(findImages);
      }
    }
    findImages(parse5.parse(item.content));
  });
  return imageUrls;
}

const qbo = new QuickBooks(process.env.QUICKBOOKS_CLIENT_ID,
                           process.env.QUICKBOOKS_CLIENT_SECRET,
                           process.env.QUICKBOOKS_ACCESS_TOKEN,
                           null,
                           process.env.QUICKBOOKS_REALM_ID,
                           true,
                           false,
                           35,
                           '2.0');

const clarifai = new Clarifai.App({
  apiKey: process.env.CLARIFAI_API_KEY
});
 
        getRssImages('https://www.pinterest.co.uk/matwilliams2875/feed.rss').then((urls) => {
console.log(urls);
          clarifai.inputs.search([{"input":{"url": urls[0], 'metadata': {'quickbooks_realm_id': process.env.QUICKBOOKS_REALM_ID}}}]).then((results) => {
            console.log(results.status);
            console.log(results.hits);
          })
        }, (err) => console.log(err));

const app = express();
app.use(express.static('static'))
app.engine('handlebars', expressHandlebars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.set('views', './views');

app.get('/', (req, res) => {
  qbo.findAttachables((err, attachables) => {
    if (err) {
      return res.status(500).json(err);
    }

    var itemUrls = {};
    attachables.QueryResponse.Attachable.forEach((attachable) => {
      if (attachable.AttachableRef) {
        attachable.AttachableRef.forEach((attachableRef) => {
          if (attachableRef.EntityRef.type == 'Item') {
            itemUrls[attachableRef.EntityRef.value] = attachable.TempDownloadUri;
          }
        });
      }
    });

    clarifai.inputs.list({perPage: 1000}).then((inputs) => {
      var inputsById = {};
      inputs.forEach((input) => {
        inputsById[input.id] = input;
      });

      qbo.findItems((err, items) => {
        if (err) {
          return res.status(500).json(err);
        }

        var inputs = [];
        items.QueryResponse.Item.forEach((item) => {
          var id = item.Id;
          var url = itemUrls[id];
          if (url && !inputsById[id]) {
            inputs.push({'id': id, 'url': url, 'metadata': {'quickbooks_realm_id': process.env.QUICKBOOKS_REALM_ID}});
          }
        });

        if (inputs.length > 0) {
          console.log("Creating", inputs);
          clarifai.inputs.create(inputs).then(() => {
            res.render('attachables', {'items': inputs});
          }, (err) => {
            res.status(500).json(err);
          });
        } else {
          res.render('attachables', {'items': inputs});
        }

      });
    }, (err) => {
      res.status(500).json(err);
    });
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
