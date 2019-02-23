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
  const inputs = [{"id":"38","url":"https://intuit-qbo-prod-28.s3.amazonaws.com/123145730635304/attachments/6e82145d-df44-432f-8059-3db4ddc8d60d105.jpg?AWSAccessKeyId=AKIAJEXDXKNYCBUNCCCQ&Expires=1550951199&Signature=ajC%2FTvDeAuITDGuc%2BWAVqqiL3sg%3D","metadata":{"quickbooks_realm_id":"123145730635304"}},{"id":"39","url":"https://intuit-qbo-prod-27.s3.amazonaws.com/123145730635304/attachments/c1f3fa7b-491e-43ee-b400-2cea277c3607106.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20190223T193139Z&X-Amz-SignedHeaders=host&X-Amz-Expires=900&X-Amz-Credential=AKIAJEXDXKNYCBUNCCCQ%2F20190223%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=db45eaba1bfd66d6a8a72d0d006579bd95aa576d4bc65c5150bc482a93df600f","metadata":{"quickbooks_realm_id":"123145730635304"}},{"id":"37","url":"https://intuit-qbo-prod-20.s3.amazonaws.com/123145730635304/attachments/25863fa3-94da-4898-8d55-c4df4184725a104.jpg?AWSAccessKeyId=AKIAJEXDXKNYCBUNCCCQ&Expires=1550951199&Signature=1yLvRsEjTD3FWF2Z92U0%2B7D4beU%3D","metadata":{"quickbooks_realm_id":"123145730635304"}},{"id":"34","url":"https://intuit-qbo-prod-19.s3.amazonaws.com/123145730635304/attachments/85bd170b-2915-41b0-97f0-bab61ae9eafa101.jpg?AWSAccessKeyId=AKIAJEXDXKNYCBUNCCCQ&Expires=1550951199&Signature=n0BP8lOkSKAYWmga7ExAUzmV9Sk%3D","metadata":{"quickbooks_realm_id":"123145730635304"}},{"id":"32","url":"https://intuit-qbo-prod-5.s3.amazonaws.com/123145730635304/attachments/2e8919ac-1b36-4fff-a4ad-74e26170e1d5NU14.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20190223T193139Z&X-Amz-SignedHeaders=host&X-Amz-Expires=900&X-Amz-Credential=AKIAJEXDXKNYCBUNCCCQ%2F20190223%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=84136e21231f041a5aaf220372fc45f33076b2555245165a21fe4982fb9b5cce","metadata":{"quickbooks_realm_id":"123145730635304"}},{"id":"35","url":"https://intuit-qbo-prod-5.s3.amazonaws.com/123145730635304/attachments/e5caa978-a6a6-4bf8-975c-cf8ea12ecbb4102.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20190223T193139Z&X-Amz-SignedHeaders=host&X-Amz-Expires=900&X-Amz-Credential=AKIAJEXDXKNYCBUNCCCQ%2F20190223%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=62badbd373839d11d50b246c405e35db6aa48b4bf1fe1af7818520728a51195d","metadata":{"quickbooks_realm_id":"123145730635304"}},{"id":"33","url":"https://intuit-qbo-prod-5.s3.amazonaws.com/123145730635304/attachments/3c6c65df-6710-478e-bbf0-22f6685a8d1a107.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20190223T193139Z&X-Amz-SignedHeaders=host&X-Amz-Expires=899&X-Amz-Credential=AKIAJEXDXKNYCBUNCCCQ%2F20190223%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=74d7b93edf8a8a8a4161c118d7c32961c7c206f0617da3463483c32818c263b3","metadata":{"quickbooks_realm_id":"123145730635304"}},{"id":"36","url":"https://intuit-qbo-prod-17.s3.amazonaws.com/123145730635304/attachments/eca1f4ab-b0db-4de5-9b90-71689098d648103.jpg?X-Amz-Algorithm=AWS4-HMAC-SHA256&X-Amz-Date=20190223T193139Z&X-Amz-SignedHeaders=host&X-Amz-Expires=900&X-Amz-Credential=AKIAJEXDXKNYCBUNCCCQ%2F20190223%2Fus-east-1%2Fs3%2Faws4_request&X-Amz-Signature=5cf6b7dfab631e3fac0d6a7bece801ab5e4c59a95ec787ffdb80c61abeabe13d","metadata":{"quickbooks_realm_id":"123145730635304"}}]
  res.render('attachables', {'items': inputs});

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
