'use strict';

const QuickBooks = require('node-quickbooks')
const Clarifai = require('clarifai');
const RssParser = require('rss-parser');
const parse5 = require('parse5');
const express = require('express');
const expressHandlebars = require('express-handlebars');
const fs = require('fs');

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

function getItems() {
  return new Promise((resolve, reject) => {
    qbo.findItems((err, items) => {
      if (err) {
        return reject(err);
      } 
      resolve(items.QueryResponse.Item);
    });
  });
}

function getReport() {
  return new Promise((resolve, reject) => {
    qbo.reportGeneralLedgerDetail((err, report) => {
      if (err) {
        return reject(err);
      } 
      resolve(report);
    });
  });
}

function getAttachables() {
  return new Promise((resolve, reject) => {
    qbo.findAttachables((err, attachables) => {
      if (err) {
        return reject(err);
      } 
      resolve(attachables.QueryResponse.Attachable);
    });
  });
}

function augmentItems(items) {
  const augmentationItems = require('./augmentation-items.json');
  var augmentationItemsById = {};
  augmentationItems.forEach(augmentationItem => {
    augmentationItemsById[augmentationItem.Id] = augmentationItem;
  });
  items.forEach(item => {
    var augmentationItem = augmentationItemsById[item.Id];
    if (augmentationItem) {
      for (var key in augmentationItem) {
        item[key] = augmentationItem[key];
      }
    }
  });
  return items;
}

async function getItemsWithAttachables() {
  var items_attachables = await Promise.all([getItems(), getAttachables()]);
  var items = items_attachables[0];
  var attachables = items_attachables[1];

  var itemUrls = {};
  attachables.forEach(attachable => {
    if (attachable.AttachableRef) {
      attachable.AttachableRef.forEach(attachableRef => {
        if (attachableRef.EntityRef.type == 'Item') {
          itemUrls[attachableRef.EntityRef.value] = attachable.TempDownloadUri;
        }
      });
    }
  });

  items = items.filter(item => item.Type == 'Inventory');
  items.forEach(item => {
    item.Url = itemUrls[item.Id];
  });

  items = augmentItems(items);

  return items;
}

//getItemsWithAttachables().then(i => console.log(i));

const app = express();
app.use(express.static('static'))
app.engine('handlebars', expressHandlebars({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');
app.set('views', './views');

app.get('/', (req, res) => res.redirect('/report.html'))
app.get('/report.html', async (req, res) => {
  try {
    items = await getItemsWithAttachables();
    res.render('attachables', {'items': items});
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});
app.get('/report2.html', async (req, res) => {
  try {
    var items = await getItemsWithAttachables();
    var oldInputs = await clarifai.inputs.list({perPage: 1000});

    var oldInputsById = {};
    for (var ii = 0; ii < oldInputs.length; ii++) {
      var oldInput = oldInputs[ii];
      oldInputsById[oldInput.id] = oldInput;
    };
  
    var inputs = items.filter(item => !!item.Url && !oldInputsById[item.Id]).map(item => ({'id': item.Id, 'url': item.Url, 'metadata': {'quickbooks_realm_id': process.env.QUICKBOOKS_REALM_ID}}));
    if (inputs.length > 0) {
      console.log("Adding to Clarifai", inputs);
      await clarifai.inputs.create(inputs);
    }

    var scores = await getScores('https://www.pinterest.co.uk/matwilliams2875/feed.rss');
    items.forEach(item => {
      item.Score = (scores[item.Id] * 100).toFixed(1) + '%';
    });

    fs.writeFile('items.json', JSON.stringify(items, null, 2), (err) => {if (err) {console.log(err)}});
    res.render('attachables', {'items': items});
  } catch (err) {
    console.log(err);
    res.status(500).json(err);
  }
});

const PORT = process.env.PORT || 8080;
app.listen(PORT, () => console.log(`Listening on port ${PORT}`));
