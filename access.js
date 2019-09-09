module.exports.saveBook = function (db, title, author, text, callback) {
    db.collection('booklib').save({
        title: title,
        author: author,
        text: text
    }, callback);
};

module.exports.findBookByTitle = function (db, title, callback) {
    db.collection('booklib').findOne({
        title: title
    }, function (err, doc) {
        if (err || !doc) callback(null);
        else callback(doc.text);
    });
};

module.exports.findBookByTitleCached = function (db, redis, title, callback) {
    redis.get(title, function (err, reply) {
        if (err) callback(null);
        else if (reply) //Book exists in cache
        callback(JSON.parse(reply));
        else {
            //Book doesn't exist in cache - we need to query the main database
            db.collection('booklib').findOne({
                title: title
            }, function (err, doc) {
                if (err || !doc) callback(null);
                else {
					//Book found in database, save to cache and
                    //return to client
                    redis.set(title, JSON.stringify(doc), function () {
                        callback(doc);
                    });
                }
            });
        }
    });
};


module.exports.updateBookByTitle = function (db, redis, title, newText, callback) {
    db.collection('booklib').findAndModify({
        title: title
    }, {
        $set: {
            text: text
        }
    }, function (err, doc) { //Update the main database
        if (err) callback(err);
        else if (!doc) callback('Missing book');
        else {
            //Save new book version to cache
            redis.set(title, JSON.stringify(doc), function (err) {
                if (err) callback(err);
                else callback(null);
            });
        }
    });
};




module.exports.findAllBooksAndCached = function (db, redis, key, callback) {
    redis.get(key, function (err, reply) {
        if (err) callback(null);
        else if (reply) //Book exists in cache
        callback(JSON.parse(reply));
        else {
            //Book doesn't exist in cache - we need to query the main database
            db.collection('booklib').find().toArray(function (err, doc) {
                if (err || !doc) callback(null);
                else {
					//Book found in database, save to cache and
					//return to client
					//console.log(" --- > ",JSON.stringify(doc))
                    redis.set(key, JSON.stringify(doc), function () {
                        callback(doc);
                    });
                }
            });
        }
    });
};