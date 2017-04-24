var express = require('express');
var app = express();
var http = require('http').createServer(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;

// Роутинг
app.use(express.static(__dirname + '/public'));

http.listen(port, function () {
  console.log('Подключение к порту %d', port);
});

// Комната

var countUsers = 0;
	
//Подключение нового пользователя
io.on('connection', function (socket) {
	console.log('user connected');
	var addUser = false;
	// Новое сообщение 
	socket.on('newMessage', function (dataText) {
		socket.broadcast.emit('newMessage', {
			userName: socket.userName,
			message: dataText
		});
});

	// Подключение нового пользователя
	socket.on('addUser', function (userName) {
		console.log('addUser');
		if (addUser) return;
		socket.userName = userName;
		countUsers++;
		addUser = true;
		socket.emit('login', {
			countUsers: countUsers
		});
		// Сообщение другим пользователям о подключении нового пользователя
		socket.broadcast.emit('joinUser', {
			userName: socket.userName,
			countUsers: countUsers
		});
	});

	// Оповещение о том, что пользователь покинул чат
	socket.on('disconnect', function () {
		console.log('disconnect');
		if (addUser) {
			countUsers--;
			socket.broadcast.emit('leftUser', {
				userName: socket.userName,
				countUsers: countUsers
			});
		}
	});
});