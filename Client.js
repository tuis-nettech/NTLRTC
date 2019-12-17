var socket = io();
console.log('loaded');

socket.on('svr_msg', function(data) {
  document.getElementById('svr-messages').innerHTML = data;
});

socket.on('userlist', function(data) {
  document.getElementById('userlist').innerHTML = data;
});

socket.on('login_success', function(data) {
  document.getElementById('form').innerHTML = data;//"<input id="input" autocomplete="off" placeholder="Message!">";
});

socket.on('userExists', function(data) {
  document.getElementById('error-container').innerHTML = data;
});

$('#message_form').submit(function() {
  //socket.emit('message', $('#input').val());
  var text = $('#input').val();
  if (text) {
    socket.emit('message', {
      body: text
    });
    console.log('sending...');
    $('#input').val('');
  }
  return false;
});

socket.on('newmsg', function(message) {
  document.getElementById('messages').innerHTML += '<div>' + message.user + ':' + message.body + '</div>';
});
