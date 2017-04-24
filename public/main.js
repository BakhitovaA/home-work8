$(function() {
	
	// Обработка вводимых значений
	var socket = io();
	var $window = $(window);
	
	var $messages = $('.messages'); 
	var $inputUserName = $('.inputUserName'); 
	var $inputMessage = $('.inputMessage'); 
	var $inputIncome = $inputUserName.focus();

	var $login = $('.login'); 
	var $chat = $('.chat'); 

	// Параметры запроса имени пользователя
	var userName = '';
	var connected = false;
	
	// Вход в чат
	socket.on('login', function (data) {
		connected = true;
		logOut("Вы присоединились к чату", {
			prepend: true
		});
		numberUsers(data);
	});

	// Новое сообщение
	socket.on('newMessage', function (data) {
		addMessageInChat(data);
	});

	// Новый пользователь присоединился к чату
	socket.on('joinUser', function (data) {
		logOut(data.userName + ' присоединился к чату');
		numberUsers(data);
	});

	// Пользователь покинул чат
	socket.on('leftUser', function (data) {
		logOut(data.userName + ' покинул чат');
		numberUsers (data);
		userExitChat(data);
	});

	// Отклик на действие пользователя на форме
	$window.keydown(function (event) {
		if (event.which === 13) {
			if (userName) {
				toSendMessage();
			} else {
				toUserName();
			}
		}
	});

	//Количество пользователей в чате
	function numberUsers (data) {
		logOut("Количество пользователей в чате: " + data.countUsers);
	}

	// Получение имени пользователя
	function toUserName () {
		userName = entrance($inputUserName.val().trim());
		if (userName) {
			$inputIncome = $inputMessage.focus();
			socket.emit('addUser', userName);
		}
	}

	// Передача сообщения
	function toSendMessage () {
		var message = $inputMessage.val();
		if (message && connected === true) {
			$inputMessage.val(''); //Очистка поля для ввода сообщения
			addMessageInChat({
				userName: userName,
				message: message
			});
			socket.emit('newMessage', message);
		}
	}
	
	// Вывод информации о новом сообщении на форму
	function addMessageInChat (data, options) {
		var $messageDiv = $('<div class="messages"/>')
			.data('userName', data.userName)
			.addClass(data.typing)
			.append($('<div class="userName"/>').text(data.userName), $('<div class="messages">').text(data.message));
		addMessage($messageDiv, options);		
	}

	function addMessage (inf, options) {
		var $inf = $(inf);
		options = {};
		options.prepend = false;
		if (options.prepend) {
			$messages.prepend($inf);
		} else {
			$messages.append($inf);
		}
	}
	
	// Пользователь покинул чат
	function userExitChat (data) {
		userExitMessages(data).fadeOut(function () {
			$(this).remove();
		});
	}
	
	function userExitMessages (data) {
		return $('.typing.message').filter(function (inf) {
			return $(this).data('userName') === data.userName;
		});
	}
	
	function entrance (input) {
		return $('<div/>').text(input).text();
	}
	
	// Вывод информации на форму
	function logOut (message, options) {
		var $div = $('<div>').addClass('logOut').text(message);
		addMessage($div, options);
	}
});