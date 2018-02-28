var app = require('express')();
var server = require('http').createServer(app);
var fs = require('fs');
var io = require('socket.io').listen(server);
var serveStatic = require('serve-static');

var session = require('cookie-session');
var bodyParser = require('body-parser');
var urlencodedParser = bodyParser.urlencoded({ extended: false });

var port = process.env.PORT || 8081;
var todolistArray = [];

var MongoClient = require('mongodb').MongoClient;

//Connection to todolistapp database
MongoClient.connect("mongodb://localhost/todolistapp", function(error, db) {
    if (error) throw error;

    //We put the list stored in todolist collection into todolistArray
    db.collection("todolist").find().toArray(function (error, results) {
        if (error) throw error;

        results.forEach(function(result) {
            todolistArray.push(result.item);
        });
    });
});

//Server is running
console.log("ToDoList app is running on localhost:" + port);

/* We use sessions */
app.use(session({secret: 'todosecret'}));

/* Root access and /public */
app.use(serveStatic(__dirname + '/'));
app.use(serveStatic(__dirname + '/public/'));

/* On /todolist */
app.get('/todolist', function(req, res) {
    res.render('index.ejs', {todolist: todolistArray});
});

/* On /ajouter */
app.post('/todolist/ajouter/', urlencodedParser, function(req, res) {
    if (req.body.newtodo != '') {
        //We insert the new todo into todolistArray
        todolistArray.push(req.body.newtodo);
        //We connect to database
        MongoClient.connect("mongodb://localhost/todolistapp", function(error, db) {
            if (error) throw error;

            //We insert the new todo into database
            db.collection("todolist").insert({item: req.body.newtodo}, null, function(error, results) {
              if (error) throw error;
              console.log("item inserted into todolist: " + req.body.newtodo);
            });
        });
    }

    /* We emit the new list to all the clients */
    io.sockets.on('connection', function (socket) {
      socket.broadcast.emit('send newtodo', {newtodolist: todolistArray});
    });

    res.redirect('/todolist');
});

/* On /supprimer/:index */
app.get('/todolist/supprimer/:index', function(req, res) {
    var itemToRemove = todolistArray[req.params.index];
    //We remove the selected item from todolistArray
    todolistArray.splice(req.params.index, 1);

    //We connect to database
    MongoClient.connect("mongodb://localhost/todolistapp", function(error, db) {
        if (error) throw error;
        //We remove the selected item from database
        db.collection("todolist").remove({item: itemToRemove}, null, function(error, results) {
          if (error) throw error;
          console.log("item removed from todolist: " + itemToRemove);
        });
    });

    /* We emit the new list to all the clients */
    io.sockets.on('connection', function (socket) {
      socket.broadcast.emit('send newtodo', {newtodolist: todolistArray});
    });

    res.redirect('/todolist');
});

/* En cas d'erreur d'URL on redirige vers /todolist */
app.use(function(req, res, next) {
    res.redirect('/todolist');
});

server.listen(port);
