var express = require('express')
var redisClient = require('redis').createClient;
var redis = redisClient(6379, 'localhost');
var MongoClient = require('mongodb').MongoClient
var app = express()

var bodyParser = require('body-parser')
app.use(bodyParser.urlencoded({ extended: false }))

app.use(bodyParser.json())

var mongoUrl = 'mongodb://localhost:27017/booklib';

var access = require('./access.js');

MongoClient.connect(mongoUrl, {useNewUrlParser: true, useUnifiedTopology: true }, function (err, db) {
	if (err) throw 'Error connecting to database - ' + err;

	app.get('/', function(req, res){
		res.status(200).send("Hurray!! All set.")
	});

	app.post('/book', function (req, res) {
		if (!req.body.title || !req.body.author) res.status(400).send("Please send a title and an author for the book");
		else if (!req.body.text) res.status(400).send("Please send some text for the book");
		else {
			access.saveBook(db, req.body.title, req.body.author, req.body.text, function (err) {
				if (err) res.status(500).send("Server error");
				else res.status(201).send("Saved");
			});
		}
	});

	// app.get('/book/:title', function (req, res) {
	// 	if (!req.param('title')) res.status(400).send("Please send a proper title");
	// 	else {
	// 		access.findBookByTitle(db, req.param('title'), function (book) {
	// 			if (!text) res.status(500).send("Server error");
	// 			else res.status(200).send(book);
	// 		});
	// 	}
	// });

	app.get('/book/:title', function (req, res) {
		if (!req.params.title) res.status(400).send("Please send a proper title");
		else {
			access.findBookByTitleCached(db, redis, req.params.title, function (book) {
				if (!req.params.title) res.status(500).send("Server error");
				else res.status(200).send(book);
			});
		}
	});

	app.get('/book', function (req, res) {
		access.findAllBooksAndCached(db, redis, "All_BOOKS", function (bookList) {
			res.status(200).send(bookList);
		});
	});

	app.put('/book/:title', function (req, res) {
		if (!req.param("title")) res.status(400).send("Please send the book title");
		else if (!req.param("text")) res.status(400).send("Please send the new text");
		else {
			access.updateBookByTitle(db, redis, req.param("title"), req.param("text"), function (err) {
				if (err == "Missing book") res.status(404).send("Book not found");
				else if (err) res.status(500).send("Server error");
				else res.status(200).send("Updated");
			});
		}
	});

	app.listen(8000, function () {
		console.log('Listening on port 8000');
	});
});