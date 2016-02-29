/**
 * GameController
 *
 * @description :: Server-side logic for managing games
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	index: function(req, res) {
		if(req.session.me) {
			console.log("Logged in");
			console.log("Let's start!");
			return res.view('game_index');
		}
		else {
			res.redirect('/');
		}
	},

	newroom: function(req, res) {

		if(req.socket) {

			var socket = req.socket;
			var io = sails.io;
			userid = req.session.me;
			console.log("Logged in as: "+userid);
			username = req.session.name;
			console.log(username);
			User.findOne({id: userid}).exec(function (err, user){
			 	if (err) {
			 		console.log(err);
				    return res.negotiate(err);
				}
				else if(user) {
					GameRoom.create({
						owner: user,
						title: username+"'s Room"
					}).exec(function (err, created) {
						if (err) {
							sails.log(err);
							return res.send(400, {error: 'Room could not be created.'});
						}
						else {
							sails.log(created);
							created.status = 'waiting';
							created.save();
							GameRoom.publishCreate(created);
							ActiveRooms.create({room: created, user: user}).exec(function (err, activeroom){
								if(err) {
									console.log(err);
								}
								else {
									activeroom.status = 'joined room';
									activeroom.save();
									GameRoom.publishAdd(created.id, 'users', {id: activeroom.id, username: user.userName, status: activeroom.status});
									// socket.emit('newGameCreated', {roomId: created.id, mySocketId: socket.id});
									ActiveRooms.subscribe(req.socket, activeroom);
									console.log(created.id);
									socket.join(created.id.toString());
									// console.log("socket joined");
									// debugger;
									// io.sockets.in(created.id.toString()).emit('joined', {thisIs: 'theMessage'});
									sails.sockets.broadcast(created.id.toString(), 'joined', {name: user.fullName});
									return res.send(200, {room: created});
								}
							});
						}
					});
					
				}
				else {
					sails.log("No user found!");
				}
				// res.send("Hello!");
			});
		}
		
	},

	joinroom: function(req, res) {

		var socket = req.socket;
		var io = sails.io;
		userId = req.session.me;
		console.log(userId);
		roomId = req.param('roomid');
		GameRoom.findOne({id: roomId}).exec(function (gameroomerr, room) {
			if(gameroomerr) {
				console.log(gameroomerr);
				return res.negotiate(gameroomerr);

			}
			else if(room) {
				console.log("Found gameroom");
				console.log(room);
				ActiveRooms.isUserInRoom({roomId: room.id, userId: userId}, function(err, status) {
					if (err) {
						console.log("Error1");
						console.log(err);
						return res.negotiate(err);
					}
					else if(status.length != 0) {
						console.log(status);
						return res.badRequest("User already in room");
					}
					else {
						console.log(status);
						ActiveRooms.countUsersInRoom({roomId: room.id}, function(err, count) {
							if (err) {
								console.log("Error2");
								console.log(err);
								return res.negotiate(err);
							}
							else if(count) {
								console.log("Count");
								console.log(count);
								if(count < 4) {
									User.findOne({id: userId}).exec(function(usererr, user) {
									if(usererr) {
										console.log(usererr);
										return res.negotiate(usererr);
									}
									else if(user) {
										console.log("Found user");
										console.log(user);
										ActiveRooms.create({room: room, user: user}).exec(function(activeerr, activeroom) {
											if(activeerr) {
												console.log(activeerr);
												return res.negotiate(activeerr);
											}
											else if(activeroom) {
												activeroom.status = 'joined room';
												activeroom.save();
												console.log("User added to room");
												// GameRoom.subscribe(req.socket, activeroom);
												GameRoom.publishAdd(room.id, 'users', {id: activeroom.id, username: user.userName, status: activeroom.status});
												// sails.sockets.join(socket, room.id.toString());
												// io.sockets.in(room.id.toString()).emit('joined', {thisIs: 'theMessage'});
												// sails.socket.emit('hello', {});
												// debugger;
												// sails.sockets.broadcast(room.id.toString(), 'joined', {name: user.fullName});
												return res.ok("User added to room");
											}
											else {
												console.log("in active room else");
												return res.badRequest("User could not be added");
											}
												
										});
									}
									else {
										return res.badRequest("User not found");
									}
									});
								}
								else {
									return res.badRequest("Room full.");
								}
							}
						});
					}
				});

				
			}
			else
				return res.badRequest("Room not found");
		});

	},

	listavailablerooms: function(req, res) {
		
		GameRoom.watch(req.socket);

		// ActiveRooms.query('select gameroom.id, gameroom.title, count(activerooms.room) as count from gameroom, activerooms where activerooms.room = gameroom.id and gameroom.status = "waiting" group by gameroom.id having count(activerooms.room) <= 3', function(err, results) {
		// 	  if (err) return res.serverError(err);
		// 	  console.log(results);
		// 	  return res.send(200, results.rows);
		// 	});

		GameRoom.find(function foundRooms(err, rooms) {
			GameRoom.subscribe(req.socket, rooms);
			return res.ok(rooms);
		});
	},

	unwatchrooms: function(req, res) {
		if (!req.isSocket) {
		  return res.badRequest('Only a socket request can use this endpoint!');
		}

		GameRoom.unwatch(req);

		GameRoom.find(function foundRooms(err, rooms) {
			GameRoom.unsubscribe(req, rooms);
			return res.ok();
		});
	},

	iamready: function(req, res) {
		console.log('I am ready');
		if(req.session.me) {
			// roomid = req.param('roomid');
			ActiveRooms.update({user: req.session.me}, {status: 'ready'}).exec(function(err, response) {
				if(err) return res.badRequest(err);
				else {
					console.log(response);
					ActiveRooms.publishUpdate(response.id, response, req);
					return res.ok();
				}
			});
		}
		else
			res.redirect('/');
	},


	startplaying: function(req, res) {
		console.log('Inside start playing');
		if(req.session.me) {
			roomid = req.param('roomid');
			GameRoom.findOne({id: roomid, owner: req.session.me}, function(err, gameroom) {
				if(err) return res.badRequest(err);
				else if(gameroom.length == 0) return res.badRequest('Room could not be found or you are not the owner of this room!');
				else {
					ActiveRooms.count({room: roomid}).exec(function(err, response) {
						console.log(response);
						if(err) return res.badRequest(err);
						else if(response >= 2 && response <= 4) {
							gameroom.status = 'playing';
							gameroom.save();
							return res.ok('Game has begun!');
						}
						else
							res.badRequest('Cannot start game.');
					});
					
				}
			});
		}
		else {
			res.redirect('/');
		}
	},

	isroomfull: function(req, res) {
		if(req.isSocket) {
			console.log('Inside isRoomFull');
			if(req.session.me) {
				console.log("Logged in as: "+req.session.me);
				id = req.params('id');
				console.log("Room ID: "+id);

			}
			else {
				return res.badRequest("can only be accessed by logged in users");
			}
		}
		else
			return res.badRequest('Can only be accessed via socket');
	},

	// rooms: function(req, res) {
	// 	console.log("Insdie rooms");
	// 	if(req.isSocket) {
	// 		console.log("Inside socket rooms");
	// 		ActiveRooms.query('select gameroom.id, gameroom.title, count(activerooms.room) as count from gameroom, activerooms where activerooms.room = gameroom.id and gameroom.status = "waiting" group by gameroom.id having count(activerooms.room) <= 3', function(err, results) {
	// 		  if (err) return res.serverError(err);
	// 		  console.log(results);
	// 		  return res.send(200, results.rows);
	// 		});
	// 	}
	// 	else {
	// 		return res.badRequest('Can only be accessed via sockets');
	// 	}
		
	// },
};

