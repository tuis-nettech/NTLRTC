var socket = io();
console.log('loaded');
$('#form').submit(function() {
  socket.emit('Client_Send_Username', $('#username').val());
  console.log('Name is '+$('#username').val());
});

socket.on('svr_msg', function(data) {
  document.getElementById('svr-messages').innerHTML = data;
});

socket.on('userlist', function(data) {
  document.getElementById('userlist').innerHTML = data;
});

socket.on('Joined', function(data) {

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
