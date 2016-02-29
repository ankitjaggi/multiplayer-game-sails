jQuery(function($){


// var socket = io.connect();
// socket.on('connect', function socketConnected() {
//     console.log("Socket connected");
//     // console.log("Socket ID: "+ this.socket.sessionid);
//     socket.get('/game/listavailablerooms');

//     socket.on('joined', function userJoined(data) {
//         console.log("user joined");
//         console.log(data);
//     });
// });

var players = [];


var currentroomid = 0;

var owner = '';

// var socketIO = {
	
//     // var mySocketId = '',

// 	init: function() {
//         socketIO.socket = io.connect();
//         socketIO.bindEvents();
//     },

//     bindEvents: function() {

        

//     	socketIO.socket.on('connect', socketIO.onConnected );
//         socketIO.socket.on('hostNewGame', socketIO.hostNewGame );
//         socketIO.socket.on('onNewGameCreated', socketIO.onNewGameCreated);
//         socketIO.socket.on('playerJoinedRoom', socketIO.playerJoinedRoom);
//         socketIO.socket.on('joined', socketIO.joined);
//         socketIO.socket.on('hello', socketIO.hello);

//         socketIO.socket.get('/game/listavailablerooms');
//         // socketIO.socket.on('beginNewGame', socketIO.beginNewGame );
//         // socketIO.socket.on('newWordData', socketIO.onNewWordData);
//         // socketIO.socket.on('hostCheckAnswer', socketIO.hostCheckAnswer);
//         // socketIO.socket.on('gameOver', socketIO.gameOver);
//         // socketIO.socket.on('error', socketIO.error );
//     },

//     onConnected: function(data) {
//     	console.log("Connected");
//     	console.log(data);
//     	console.log(socketIO.socket);
//         socketIO.mySocketId = socketIO.socket.socket.sessionid;
//     },

//     hostNewGame: function(data) {
//     	// console.log(data);
//     	socketIO.socket.post('/game/newroom', {}, function(res, jwres) {
//             console.log(res);
//             console.log(jwres);
//             if(jwres.statusCode != 200) {
//             	console.log("Room not created...");
//             }
//             else {
//             	console.log("Room created");
//             	socketIO.onNewGameCreated(res.room);
//             }
//         });

//     	// socketIO.socket.emit('hostCreateNewGame');
//     },

//     joinGame: function(data) {

//         socketIO.socket.post('/game/joinroom', {roomid: 2}, function(res, jwres) {
//             console.log(res);
//             console.log(jwres);
//         });
//     },

//     onNewGameCreated: function(data) {
//         console.log("Insdide on new game created");
//     	console.log(data);
//     	console.log("new room created");
//     	newRoomCreated();
//     	$("#host").show();
//     	$("#index").hide();
//     },

//     playerJoinedRoom: function(data) {
//     	console.log(data);
//     	console.log("player joined room");
//     	addPlayerToRoom(data);
//     },

//     hello: function(data) {
//         console.log("Hello");
//         alert("hello");
//         console.log(data);
//     },

//     joined: function(data) {
//         alert("Yes");
//         console.log(data);
//         console.log("player joined room");
//     },


// }


io.socket.on('connect', function(){
    console.log("Yes! Connected. finally!!!");
    console.log(io.socket);
    io.socket.get('/game/listavailablerooms');

    io.socket.on('gameroom', function printMessage(event) {
        console.log(event);
        console.log(event.verb);
        switch(event.verb) {
            case 'created': newRoomCreated(event.data);
                            break;
            case 'addedTo': newPlayerJoined(event.added);
                            break;
            default: console.log(event);

        }
    });

  });

// socketIO.init();

$("#createroom").click(function() {
	// socketIO.hostNewGame();
    io.socket.post('/game/newroom', {}, function(res, jwres) {
        // console.log(res.room.owner);
        // console.log(jwres);
        if(jwres.statusCode != 200) {
            console.log("Room not created...");
        }
        else {
            console.log("Room created");
            players.push(res.room.title.split('\'')[0]);
            currentroomid = res.room.id;
            // io.socket.get('/game/unwatchrooms');
            // socketIO.onNewGameCreated(res.room);
        }
    });
    $("#join").hide();
    $("#host").show();
    $("#index").hide();
});

$("#roomslist").on('click', '.join-room', function() {
    var button = $(this);
    var buttonID = $(this).attr('id');
    console.log(buttonID);
    var roomID = buttonID.split('_')[1];
    console.log(roomID);
    io.socket.post('/game/joinroom', {roomid: roomID}, function(res, jwres) {
        console.log(res);
        // console.log(jwres);
        if(jwres.statusCode == 200) {
            // io.socket.get('/game/unwatchrooms');
            currentroomid = roomID;
        }
        else {
            alert("Could not join room because: "+res.error);
        }
    });
});


function newRoomCreated(data) {
	alert("New Room has been created");
    $("#roomslist").append("<tr><td>"+data.title+"</td><td><td><span id='roomplayercount_"+data.id+"'>1</span> / 4</td></td><td><button class='btn btn-default join-room' id='join_"+data.id+"'>Join</button>");
    $("#start_game").prop("disabled", true);
}

function newPlayerJoined(data) {
    console.log(data);
    players.push(data.username);
    console.log(players);
    if (players.length >= 2) {
        $("#start_game").show();
        $("#start_game").prop("disabled", false);
    }
	$("#players").append("<tr><td>"+data.username+"</td><td>&nbsp;</td><td><span id='playerstatus_"+data.id+"'>"+data.status+"</span></td></tr>");
}

// getRooms();

function getRooms(response) {
    console.log(response);
    var output = '';
    $.each(response, function(index, value) {
        console.log(index+" "+value);
        output.append("<tr><td>"+value.title+"</td><td><span id='roomplayercount_"+value.id+"'>"+value.count+"</span> / 4</td>");
    });
    $("#roomslist").append(output);
}

function fetchPlayers(room) {
    console.log('here to fetch players');
}

function updatePlayerCount(data) {

}

function startPlaying() {
    $.ajax('/game/startplaying', {
        method: 'POST',
        data: {roomid: currentroomid},
        success: function(response) {
            console.log(response);
        },
        error: function(error) {
            console.log(error.responseText);
        }
    });
}

function getReady() {
    $.ajax('/game/iamready', {
        success: function(response) {
            console.log(response);
            updatePlayerStatus(response.id, 'ready');
        },
        error: function(error) {
            console.log(error.responseText);
        }
    });
}

function updatePlayerStatus(user, status) {
    $("#playerstatus_"+user).text(status);
}

});