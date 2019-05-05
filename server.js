// server.js
// where your node app starts

// init project
const express = require('express');
const app = express();
const dns = require('dns');

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI, {useNewUrlParser: true});

const bodyParser = require('body-parser');

// we've started you off with Express, 
// but feel free to use whatever libs or frameworks you'd like through `package.json`.


// functions:
const genID = (len = 9) => `${Math.random().toString(36).substr(2, len)}`;


// body Parser
app.use(bodyParser.urlencoded({extended: false}));

// http://expressjs.com/en/starter/static-files.html
app.use(express.static('public'));

// http://expressjs.com/en/starter/basic-routing.html
app.get('/', function(request, response) {
  response.sendFile(__dirname + '/views/index.html');
});


// Model:

const urlSchema = new mongoose.Schema({
  longURL: String,
  shortURL: String
});

const UrlModel = mongoose.model('urlmodels', urlSchema);
const urlRegEx = /^htt(p|ps):\/\/.*/i


// POST request that checks the url

app.post('/api/shorturl/new', (req,res) => {
  let url = '';
  if(urlRegEx.test(req.body.url)) {
    // if the url has http or https
    url = req.body.url.match(/[^htt^(p|.s):\/\/].*/i)[0].split('/')[0];
  } else {
    // if the url doesn't have http or https
    // split at / and return the first value
    url = req.body.url.split('/')[0];
  }
  dns.lookup(url,(err,address)=> { 
    if (!err) {
      // check if http:// or https:// present
      let longUrl = (urlRegEx.test(req.body.url)) ? req.body.url : 'http://' + req.body.url; 
      
      // generate shorthand url
      let shortUrl = genID(3);
      
      // set the new DB value and save it to DB
      let shorten = new UrlModel({longURL: longUrl, shortURL: shortUrl});
      shorten.save((err,data)=>{
        if (err) {
          res.json(err)
        } else {
          res.json({original_url: shorten.longURL, short_url: shortUrl });  
        }
      });
      //
    } else {
      res.json({error: 'invalid url'});
    }
  });    
    //res.json({error:'invalid url'});
});


// GET request that fetches and redirects the URL or throws an error
app.get('/api/shorturl/:url', (req,res) => {
  let find = UrlModel.findOne({shortURL: req.params.url});
  find.exec()
    .then(data=>res.redirect(301, data.longURL))
    .catch(err=>res.json({error: 'invalid url', errcode: err.code}));
});






// listen for requests :)
const listener = app.listen(process.env.PORT, function() {
  console.log('Your app is listening on port ' + listener.address().port);
});
