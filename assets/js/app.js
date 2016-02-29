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


var myRoomId = 0;

var userid = '';

var round = 1;

var score = 0;
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
    io.socket.get('/game/subscriberooms');

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

    io.socket.on('playerJoined', function playerJoined(message) {
        console.log(message);
        newPlayerJoined(message);
    });

    io.socket.on('message', function parseMessage(event) {
        console.log(event);
    });

    io.socket.on('playerReady', function nowReady(message) {
        console.log("player is ready!!!!");
        console.log(message);
        updatePlayerStatus(message.id, 'Ready');
    });

    io.socket.on('gameStarted', function gameStarted(message) {
        console.log("game has started");
        showGameInit();
    });

    io.socket.on('roomUnavailable', function roomUnavailable(message) {
        console.log("room gone!");
        removeRoomFromScreen(message);
    });

    io.socket.on('sendQuestion', function parseQuestion(message) {
        console.log(message);
        showQuestion(message);
    });

    io.socket.on('answerDetails', function answer(data) {
        console.log(data);
        manipulateScores(data);
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
            alert("Room not created!");
        }
        else {
            console.log("Room created");
            // players.push(res.room.title.split('\'')[0]);
            myRoomId = res.room.roomid;
            // io.socket.post('/game/unsubscriberooms', {roomid: res.room.id});
            // socketIO.onNewGameCreated(res.room);
            $("#join").hide();
            $("#room").show();
            $("#index").hide();
        }
    });
    
});

$("#start_game").click(startPlaying);

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
            // io.socket.post('/game/unsubscriberooms', {roomid: roomID});
            myRoomId = roomID;
            $("#index").hide();
            $("#join").hide();
            $("#room").show();
        }
        else {
            alert("Could not join room because: "+res.error);
        }
    });
});

$("#get_ready").click(function() {
    $.ajax('/game/iamready', {
        success: function(data) {
            console.log(data);
            console.log('yayyy');
            updatePlayerStatus(data.id, 'ready');
        },
        error: function(error) {
            console.log(error.responseText);
        }
    });
});

function addPlayerToRoom(data) {
    console.log(data);
    count = $("#roomplayercount_"+data.roomid).text();
    count += 1;
    $("#roomplayercount_"+data.roomid).text(count);
}

function removeRoomFromScreen(message) {
    console.log(message);
    $("#join_"+message.roomid).closest('tr').remove();
}

function showGameInit() {
    $("#index").hide();
    $("#room").hide();
    $("#join").hide();
    $("#gamescreen").show();
    $("#gamescreen").html("<h3>The game has begun!</h3>");
    setTimeout(function() {
        io.socket.post('/game/getquestion', {round: round, room: myRoomId});
    }, 1000);
}

function showQuestion(data) {
    $("#gamescreen").append(data.question);
    var options = data.options;
    var list = $('<ul/>').attr('id','options');

    $.each(options, function(){
        list                                
            .append( $('<li/>')              
                .append( $('<button/>')      
                    .addClass('btnAnswer')   
                    .addClass('btn')
                    .addClass('btn-info')        
                    .val(this)               
                    .html(this)
                )
            )
    });
    $("#gamescreen").append(list);
}

$("#gamescreen").on('click', '.btnAnswer',function() {
    var $btn = $(this); 
    var answer = $btn.val();

    console.log(answer);

    var data = {
        roomId: myRoomId,
        answer: answer,
        round: round,
    }
    console.log(data);
    // io.socket.emit('playerAnswer', data);
    io.socket.post('/game/checkanswer', data, function(res, jwres) {
        if(jwres.statusCode != 200)
            alert(res);
        else {
            console.log(res);
        }
    });

    // $.ajax('/checkanswer', {
    //     method: 'POST',
    //     data: data,
    //     success: function(response) {
    //         console.log(response);
    //     },
    //     error: function(error) {
    //         console.log(error.responseText);
    //         alert(error.responseText);
    //     }
    // });
});


// function showRoom() {

// }

function newRoomCreated(data) {
	// alert("New Room has been created");
    count = data.count | 1;
    $("#roomslist").append("<tr id='room_"+data.roomid+"'><td>"+data.title+"</td><td><td><span id='roomplayercount_"+data.roomid+"'>"+count+"</span> / 4</td></td><td><button class='btn btn-default join-room' id='join_"+data.roomid+"'>Join</button>");
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
	$("#players").append("<tr><td>"+data.username+"</td><td>&nbsp;</td><td><span id='playerstatus_"+data.userid+"'>"+data.status+"</span></td></tr>");
}

// showRooms();

fetchRooms();

function fetchRooms() {
    console.log("sskjfd");
    $.ajax('/rooms', {
        method: 'GET',
        success: function(response) {
            console.log(response);
            showRooms(response);
        },
        error: function(error) {
            console.log(error.responseText);
        }
    });
}

function showRooms(response) {
    console.log(response);
    var output = '';
    if(response.length >= 1) {
        $.each(response, function(index, value) {
            console.log(index+" "+value);
            newRoomCreated(value);
            output += "<tr><td>"+value.title+"</td><td><span id='roomplayercount_"+value.roomid+"'>"+value.count+"</span> / 4</td>";
        });
        // $("#roomslist").append(output);
    }
    
}

function fetchPlayers(room) {
    console.log('here to fetch players');
}

function updatePlayerCount(data) {

}

function startPlaying() {
    $.ajax('/game/startplaying', {
        method: 'POST',
        data: {roomid: myRoomId},
        success: function(response) {
            console.log(response);
            // alert(response);
        },
        error: function(error) {
            console.log(error.responseText);
        }
    });
}

function manipulateScores(data) {
    if(data.status == 'correct')
        score += 1;
    else
        score -= 1;
    console.log(score);
}

// function getReady() {
//     $.ajax('/game/iamready', {
//         success: function(response) {
//             console.log(response);
//             updatePlayerStatus(response.id, 'ready');
//         },
//         error: function(error) {
//             console.log(error.responseText);
//         }
//     });
// }

function updatePlayerStatus(user, status) {
    $("#playerstatus_"+user).text(status);
}

});