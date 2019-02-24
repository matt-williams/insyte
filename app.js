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
        el.attrs.filter(attr => attr.name == 'src').map(attr => attr.value).forEach(imageUrl => imageUrls.push(imageUrl));
      }
      if (el.childNodes) {
        el.childNodes.forEach(findImages);
      }
    }
    findImages(parse5.parse(item.content));
  });
  return imageUrls;
}

async function getScores(feedUrl) { 
  var urls = await getRssImages(feedUrl);
  var scoreById = {};
  await Promise.all(urls.map(url =>
    clarifai.inputs.search([{"input":{"url": url, 'metadata': {'quickbooks_realm_id': process.env.QUICKBOOKS_REALM_ID}}}]).then(results => {
      if (results.status.code != 10000) {
        return console.log(`Error while searching for ${url}: ${results.status}`);
      }
      results.hits.forEach(result => {
        scoreById[result.input.id] = (scoreById[result.input.id] || 0) + result.score;
      });
//      console.log(results.hits.map(result => [result.input.id, result.score]));
    })
  ));
  for (var id in scoreById) {
    scoreById[id] /= urls.length;
  }
  return scoreById;
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

//getScores('https://www.pinterest.co.uk/matwilliams2875/feed.rss').then(scores => console.log(scores));

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
    attachables.QueryResponse.Attachable.forEach(attachable => {
      if (attachable.AttachableRef) {
        attachable.AttachableRef.forEach(attachableRef => {
          if (attachableRef.EntityRef.type == 'Item') {
            itemUrls[attachableRef.EntityRef.value] = attachable.TempDownloadUri;
          }
        });
      }
    });

    qbo.findItems((err, items) => {
      if (err) {
        return res.status(500).json(err);
      }

      var items = items.QueryResponse.Item;
      items = items.filter(item => item.Type == 'Inventory');
      items.forEach(item => {
        item.Url = itemUrls[item.Id];
      });

      clarifai.inputs.list({perPage: 1000}).then(oldInputs => {
        var oldInputsById = {};
        for (var ii = 0; ii < oldInputs.length; ii++) {
          var oldInput = oldInputs[ii];
          oldInputsById[oldInput.id] = oldInput;
        };
  
        var inputs = items.filter(item => !!item.Url && !oldInputsById[item.Id]).map(item => ({'id': item.Id, 'url': item.Url, 'metadata': {'quickbooks_realm_id': process.env.QUICKBOOKS_REALM_ID}}));
        if (inputs.length > 0) {
          console.log("Adding to Clarifai", inputs);
          clarifai.inputs.create(inputs).then(() => {
            res.render('attachables', {'items': items});
          }, err => {
            res.status(500).json(err);
          });
        } else {
          res.render('attachables', {'items': items});
        }
      }, err => {
        res.status(500).json(err);
      });
    });
  });
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
