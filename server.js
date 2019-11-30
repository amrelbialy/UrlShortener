'use strict';

var express = require('express');
var mongo = require('mongodb');
var mongoose = require('mongoose');
var dns = require('dns');
var cors = require('cors');
var bodyParser = require('body-parser');
var app = express();

// Basic Configuration 
var port = process.env.PORT || 3000;

/** this project needs a db !! **/
mongoose.connect("mongodb+srv://amr:messi+bestfriend@cluster0-kfx2r.mongodb.net/test?retryWrites=true&w=majority", { useNewUrlParser: true ,  useMongoClient: true });
const connection = mongoose.connection;

connection.once('open' , () => {
    console.log('MongoDB database connection established successfully')
})

//creating the model with schema

var urlShortener = new mongoose.Schema({
    "original_url": String,
    "short_url": String
});

var urlShortenerModel = mongoose.model("urlShortenerModel", urlShortener);

app.use(cors());

/** this project needs to parse POST bodies **/
// you should mount the body-parser here
app.use(bodyParser.urlencoded({ extended: 'false' }));
app.use(bodyParser.json());

//use css

app.use('/public', express.static(process.cwd() + '/public'));

//get html
app.get('/', function (req, res) {
    res.sendFile(process.cwd() + '/views/index.html');
});


// your first API endpoint... 
app.get("/api/hello", function (req, res) {
    res.json({ greeting: 'hello API' });
});

//post original url, but make sure it is valid first
app.post('/api/shorturl/new', function (req, res) {
    var originalUrl = req.body.url;
    var domainName = originalUrl.replace(/(^\w+:|^)\/\//, "");
    dns.lookup(domainName, function (error, url) {
        if (error) {
            res.json({ "error": "invalid URL" });
        } else {

            CreateAndSaveShortUrl(originalUrl, function (newShortId) {
                res.json({ "original_url": originalUrl, "short_url": newShortId });
            });
        }
    });

});

function CreateAndSaveShortUrl(originalUrl, callback) {
    urlShortenerModel.findOne({ "original_url": originalUrl }, function (err, item) {

        if (item !== null) {
            callback(item.short_url);
        } else {
            var shortId = GenerateUniqueShortId();
            //saving original url and short url in db in order to be able to get it after          
            const newUrl = new urlShortenerModel({
                "original_url": originalUrl,
                "short_url": shortId
            });

            newUrl.save();

            callback(shortId);
        }
    });
}


//when the short url is visited redirect to original url
app.get('/api/shorturl/:shortId', function (req, res) {
    //have to use findOne function here and then req. redirect()
    var shortId = req.params.shortId;
    FindByShortId(shortId, function (item) {
        console.log(item);
        if (item) {
            res.redirect(item.original_url);
        } else {
            res.redirect('/');
        }
    });
});

function FindByShortId(shortId, callback) {
    urlShortenerModel.findOne({ "short_url": shortId }, function (err, item) {
        callback(item);
    });
}

function GenerateUniqueShortId() {
    var candidateId = Math.floor(Math.random() * 9999999999999999999);
    return candidateId;
}


app.listen(port,() =>{
    console.log(`Server is running on port : ${port} `);
})