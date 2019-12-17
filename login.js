var socket = io();
console.log('loaded');

$('#regform').submit(() => {
  var passkey = sha512($('#passkey').val());
  var name = $('#username').val();
  socket.emit('Client_Send_Username', name,passkey);
  console.log('Name is '+name);
  console.log('Hash is '+passkey);


});

socket.on('svr_msg', function(data) {
  document.getElementById('svr-messages').innerHTML = data;
});

/*socket.on('login_success', function(data) {
  document.getElementById('form').innerHTML = data;//"<input id="input" autocomplete="off" placeholder="Message!">";
});*/

socket.on('userExists', function(data) {
  document.getElementById('error-container').innerHTML = data;
});
