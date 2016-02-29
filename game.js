var io;
var gameSocket;


exports.initGame = function(sio, socket){
    // io = sio;
    // gameSocket = socket;
    // gameSocket.emit('connected', { message: "You are connected!" });

    // Player Events
    sails.socket.on('playerJoinGame', playerJoinGame);
    sails.socket.on('playerAnswer', playerAnswer);
    sails.socket.on('playerRestart', playerRestart);
}

function playerAnswer(data) {
	console.log(data);
	if(data.answer == '6') {
		console.log('Right answer!');
		sails.sockets.emit('answerDetails', {status: 'correct', userid: data});
	}
	else {
		console.log('Wrong answer!');
		sails.sockets.emit('answerDetails', {status: 'wrong', userid: data});
	}
}