jQuery(function($){

var socketIO = {
	
	init: function() {
        socketIO.socket = io.connect();
        socketIO.bindEvents();
    },

    bindEvents: function() {
    	socketIO.socket.on('connected', socketIO.onConnected );
        socketIO.socket.on('hostNewGame', socketIO.hostNewGame );
        socketIO.socket.on('onNewGameCreated', socketIO.onNewGameCreated);
        socketIO.socket.on('playerJoinedRoom', socketIO.playerJoinedRoom);
        socketIO.socket.on('joined', socketIO.joined);
        socketIO.socket.on('hello', socketIO.hello);
        // socketIO.socket.on('beginNewGame', socketIO.beginNewGame );
        // socketIO.socket.on('newWordData', socketIO.onNewWordData);
        // socketIO.socket.on('hostCheckAnswer', socketIO.hostCheckAnswer);
        // socketIO.socket.on('gameOver', socketIO.gameOver);
        // socketIO.socket.on('error', socketIO.error );
    },

    onConnected: function(data) {
    	console.log("Connected");
    	console.log(data);
    	console.log(socketIO.socket);
    },

    hostNewGame: function(data) {
    	// console.log(data);
    	io.socket.post('/newroom', {}, function(res, jwres) {
            console.log(res);
            console.log(jwres);
            if(jwres.statusCode != 200) {
            	console.log("Room not created...");
            }
            else {
            	console.log("Room created");
            	socketIO.onNewGameCreated(res.room);
            }
        });

    	// socketIO.socket.emit('hostCreateNewGame');
    },

    joinGame: function(data) {

        io.socket.post('/joinroom', {roomid: 2}, function(res, jwres) {
            console.log(res);
            console.log(jwres);
        });
    },

    onNewGameCreated: function(data) {
    	console.log(data);
    	console.log("new room created");
    	newRoomCreated();
    	$("#host").show();
    	$("#index").hide();
    },

    playerJoinedRoom: function(data) {
    	console.log(data);
    	console.log("player joined room");
    	addPlayerToRoom(data);
    },

    hello: function(data) {
        console.log("Hello");
        alert("hello");
        console.log(data);
    },

    joined: function(data) {
        alert("Yes");
        console.log(data);
        console.log("player joined room");
    },


}

socketIO.init();

$("#createroom").click(function() {
	socketIO.hostNewGame();
});

$("#joinroom").click(function() {
    socketIO.joinGame();
});

function newRoomCreated() {
	alert("New Room has been created");
}

function addPlayerToRoom(data) {
	$("#players").append(data);
}

});