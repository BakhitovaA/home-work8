var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

http.listen(port, function () {
  console.log('Подключение к порту %d', port);
});

// Routing
app.use(express.static(__dirname + '/public'));

// Комната

var numUsers = 0;

//Подключение нового пользователя
io.on('connection', function (socket) {
	console.log('a user connected');
	var addedUser = false;

// Новое сообщение 
	socket.on('newMessage', function (dataText) {
		socket.broadcast.emit('newMessage', {
			username: socket.username,
			message: dataText
		});
	});

  // Подключение нового пользователя
  socket.on('addUser', function (username) {
    if (addedUser) return;
    socket.username = username;
    numUsers++;
    addedUser = true;
    socket.emit('login', {
      numUsers: numUsers
    });
    // Сообщение другим пользователям о подключении нового пользователя
    socket.broadcast.emit('userJoined', {
      username: socket.username,
      numUsers: numUsers
    });
  });

  // Оповещение других пользователей о том, что пользователь пишет сообщение
  socket.on('typing', function () {
    socket.broadcast.emit('typing', {
      username: socket.username
    });
  });

	//Очищение строки, когда пользователь перестал писать
  socket.on('stopTyping', function () {
    socket.broadcast.emit('stopTyping', {
      username: socket.username
    });
  });

  // Оповещение о том, что пользователь покинул чат
  socket.on('disconnect', function () {
    if (addedUser) {
      --numUsers;
      socket.broadcast.emit('userLeft', {
        username: socket.username,
        numUsers: numUsers
      });
    }
  });
});