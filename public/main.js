$(function() {
  // Обработка вводимых значений
  var $window = $(window);
  var $usernameInput = $('.usernameInput'); 
  var $messages = $('.messages'); 
  var $inputMessage = $('.inputMessage'); 

  var $loginPage = $('.login.page'); 
  var $chatPage = $('.chat.page'); 

  // Параметры запроса имени пользователя
  var username;
  var connected = false;
  var typing = false;
  var lastTypingTime;
  var $currentInput = $usernameInput.focus();

  var socket = io();

  // Отправка сообщения
  $window.keydown(function (event) {
    if (event.which === 13) {
      if (username) {
        sendMessage();
        socket.emit('stopTyping');
        typing = false;
      } else {
        setUsername();
      }
    }
  });

  $inputMessage.on('input', function() {
    updateTyping();
  });
  
  //Количество пользователей в чате
  function addParticipantsMessage (data) {
    var message = '';
    message = "Количество пользователей в чате: " + data.numUsers;
    log(message);
  }

  // Получение имени пользователя
  function setUsername () {
    username = cleanInput($usernameInput.val().trim());
    if (username) {
      $loginPage.fadeOut();
      $chatPage.show();
      $loginPage.off('click');
      $currentInput = $inputMessage.focus();
      // Передача имени пользователя
      socket.emit('addUser', username);
    }
  }

  // Передача сообщения
  function sendMessage () {
    var message = $inputMessage.val();
    message = cleanInput(message);
    if (message && connected) {
      $inputMessage.val('');
      addChatMessage({
        username: username,
        message: message
      });
      socket.emit('newMessage', message);
    }
  }

  // Вывод информации на форму
  function log (message, options) {
    var $el = $('<li>').addClass('log').text(message);
    addMessageElement($el, options);
  }

  // Информации о новом сообщении
  function addChatMessage (data, options) {
    var $typingMessages = getTypingMessages(data);
    options = options || {};
    if ($typingMessages.length !== 0) {
      options.fade = false;
      $typingMessages.remove();
    }

    var $usernameDiv = $('<span class="username"/>')
      .text(data.username)
    var $messageBodyDiv = $('<span class="messageBody">')
      .text(data.message);

    var typingClass = data.typing ? 'typing' : '';
    var $messageDiv = $('<li class="message"/>')
      .data('username', data.username)
      .addClass(typingClass)
      .append($usernameDiv, $messageBodyDiv);

    addMessageElement($messageDiv, options);
  }

  // Оповещение других пользователей о том, что клиент пишет сообщение
  function addChatTyping (data) {
    data.typing = true;
    data.message = 'пишет...';
    addChatMessage(data);
  }

  // Пользователь покинул чат/перестал писать сообщение
  function removeChatTyping (data) {
    getTypingMessages(data).fadeOut(function () {
      $(this).remove();
    });
  }

  // Добавляет сообщение и устанавливает значения по умолчанию
  function addMessageElement (el, options) {
    var $el = $(el);
    if (!options) {
      options = {};
    }
    if (typeof options.fade === 'undefined') {
      options.fade = true;
    }
    if (typeof options.prepend === 'undefined') {
      options.prepend = false;
    }
    if (options.prepend) {
      $messages.prepend($el);
    } else {
      $messages.append($el);
    }
    $messages[0].scrollTop = $messages[0].scrollHeight;
  }

  // Очистка поля
  function cleanInput (input) {
    return $('<div/>').text(input).text();
  }


  // Updates the typing event
  function updateTyping () {
    if (connected) {
      if (!typing) {
        typing = true;
        socket.emit('typing');
      }
      lastTypingTime = (new Date()).getTime();
    }
  }


  // Информация о том, что пользователь пишет сообщение
  function getTypingMessages (data) {
    return $('.typing.message').filter(function (i) {
      return $(this).data('username') === data.username;
    });
  }

  // Вход в чат
  socket.on('login', function (data) {
    connected = true;
    var message = "Вы присоединились к чату";
    log(message, {
      prepend: true
    });
    addParticipantsMessage(data);
  });

  // Новое сообщение
  socket.on('newMessage', function (data) {
    addChatMessage(data);
  });

  // Новый пользователь присоединился к чату
  socket.on('userJoined', function (data) {
    log(data.username + ' присоединился к чату');
    addParticipantsMessage(data);
  });

  // Пользователь покинул чат
  socket.on('userLeft', function (data) {
    log(data.username + ' покинул чат');
    addParticipantsMessage(data);
    removeChatTyping(data);
  });

  // Пользователь пишет сообщение
  socket.on('typing', function (data) {
    addChatTyping(data);
  });


  // Пользователь перестал писать сообщение
  socket.on('stopTyping', function (data) {
    removeChatTyping(data);
  });

  socket.on('disconnect', function () {
    log('соединение разорвано');
  });

  socket.on('reconnect', function () {
    log('Переподключение...');
    if (username) {
      socket.emit('addUser', username);
    }
  });

  socket.on('reconnect_error', function () {
    log('Попытка подключиться не удалась');
  });

});