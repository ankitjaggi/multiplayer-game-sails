/**
 * GameController
 *
 * @description :: Server-side logic for managing games
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

module.exports = {
	index: function(req, res) {
		if(req.session.me) {
			// console.log("Logged in");
			// console.log("Let's start!");
			return res.view('game_index');
		}
		else {
			res.redirect('/');
		}
	},

	newroom: function(req, res) {

		if(req.socket && req.session.me) {
			var socket = req.socket;
			var io = sails.io;
			userid = req.session.me;
			// console.log("Logged in as: "+userid);
			username = req.session.name;
			// console.log(username);
			User.findOne({id: userid}).exec(createRoom);
		}

		else {
			return res.badRequest('Not authorized');
		}

		function createRoom(err, user) {
			if (err) {
				// console.log(err);
		    	return res.badRequest(err);
			}
			else if(user) {
				var roomid = GameRoom.generateRoomId();
				// console.log(roomid);
				GameRoom.create({
					roomid: roomid,
					owner: user,
					title: username+"'s Room"
				}).exec(function(err, created) {
					if (err) {
						// sails.log(err);
						return res.badRequest('Room could not be created.');
					}
					else {
						sails.log(created);
						created.status = 'waiting';
						created.save();
						GameRoom.publishCreate(created);
						ActiveRooms.create({room: created, user: user}).exec(function(err, activeroom) {
							if(err) {
								// console.log(err);
							}
							else {
								activeroom.status = 'joined room';
								activeroom.save();
								GameRoom.unwatch(req);
								GameRoom.subscribe(req.socket, created);
								GameRoom.publishAdd(created.roomid, 'users', {id: activeroom.id, roomid: created.roomid, userid: user.id, username: user.userName, status: activeroom.status});
								// socket.emit('newGameCreated', {roomId: created.id, mySocketId: socket.id});
								// ActiveRooms.subscribe(req.socket, activeroom);
								// console.log(created.roomid);
								sails.sockets.join(req.socket, created.roomid.toString());
								// console.log("socket joined");
								// sails.sockets.broadcast(created.id.toString(), 'playerJoined', {id: activeroom.id, userid: user.id, username: user.userName, status: activeroom.status});
								return res.ok({room: created});
							}
						});
					}
				});
			}
			else {
				sails.log("No user found!");
				return res.badRequest('No user found!');
			}
		}
		
	},

	joinroom: function(req, res) {

		if(req.socket && req.session.me) {
			var socket = req.socket;
			var io = sails.io;
			userId = req.session.me;
			// console.log(userId);
			roomId = req.param('roomid');
			GameRoom.findOne({roomid: roomId}).exec(function (gameroomerr, room) {
				if(gameroomerr) {
					// console.log(gameroomerr);
					return res.badRequest(gameroomerr);
				}
				else if(room) {
					// console.log("Found gameroom");
					// console.log(room);
					if(room.status != 'playing') {
						ActiveRooms.isUserInRoom({roomId: room.roomid, userId: userId}, function(err, status) {
						if (err) {
							// console.log("Error1");
							// console.log(err);
							return res.badRequest(err);
						}
						else if(status.length != 0) {
							// console.log(status);
							return res.badRequest("User already in room");
						}
						else {
							// console.log(status);
							ActiveRooms.countUsersInRoom({roomId: room.roomid}, function(err, count) {
								if (err) {
									// console.log("Error2");
									// console.log(err);
									return res.negotiate(err);
								}
								else if(count) {
									// console.log("Count");
									// console.log(count);
									if(count < 4) {
										User.findOne({id: userId}).exec(function(usererr, user) {
										if(usererr) {
											// console.log(usererr);
											return res.negotiate(usererr);
										}
										else if(user) {
											// console.log("Found user");
											// console.log(user);
											ActiveRooms.create({room: room, user: user}).exec(function(activeerr, activeroom) {
												if(activeerr) {
													// console.log(activeerr);
													return res.badRequest(activeerr);
												}
												else if(activeroom) {
													// activeroom.status = 'joined room';
													// activeroom.save();
													// console.log("User added to room");
													if(count == 3)
														sails.sockets.blast('roomFull', {roomid: room.roomid});
													GameRoom.unwatch(req);
													GameRoom.subscribe(req.socket, room);
													GameRoom.publishAdd(room.roomid, 'users', {id: activeroom.id, roomid: room.roomid, userid: user.id, username: user.userName, status: activeroom.status});
													sails.sockets.join(req.socket, room.roomid.toString());
													// io.sockets.in(room.id.toString()).emit('joined', {thisIs: 'theMessage'});
													// sails.sockets.broadcast(room.id.toString(), 'playerJoined', {id: activeroom.id, userid: user.id, username: user.userName, status: activeroom.status});
													return res.ok("User added to room");
												}
												else {
													// console.log("in active room else");
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
					else {
						return res.badRequest("The game has already begun!");
					}	
				}
				else
					return res.badRequest("Room not found");
			});
		}
		else
			return res.badRequest('Not authorized');
	},

	subscriberooms: function(req, res) {
		
		GameRoom.watch(req.socket);

		return res.ok();
	},

	unsubscriberooms: function(req, res) {
		if (!req.isSocket) {
		  return res.badRequest('Only a socket request can use this endpoint!');
		}

		GameRoom.unwatch(req);


		GameRoom.find(function foundRooms(err, rooms) {
			GameRoom.unsubscribe(req, rooms);
			if(req.param('roomid'))
				GameRoom.subscribe(req, req.param('roomid'));
			return res.ok();
		});

	},

	iamready: function(req, res) {
		// console.log('I am ready');
		if(req.session.me) {
			ActiveRooms.update({user: req.session.me}, {status: 'ready'}).exec(function(err, response) {
				if(err) return res.badRequest(err);
				else {
					sails.sockets.broadcast(response[0].room.toString(), 'playerReady', {id: req.session.me, name: req.session.name});
					return res.ok("Player "+req.session.name+" is ready!");
				}
			});
		}
		else
			res.redirect('/');
	},


	startplaying: function(req, res) {
		// console.log('Inside start playing');
		if(req.session.me) {
			roomid = req.param('roomid');
			GameRoom.findOne({roomid: roomid, owner: req.session.me}, startPlay);
		}
		else {
			res.redirect('/');
		}

		function startPlay(err, gameroom) {
			if(err) return res.badRequest(err);
			else if(typeof gameroom == 'undefined') return res.badRequest('Room could not be found or you are not the owner of this room!');
			else {
				if(gameroom.status == 'waiting' || gameroom.status == 'created') {
					ActiveRooms.find({room: gameroom.roomid}).exec(function(err, response) {
						// console.log(response);
						if(err) return res.badRequest(err);
						else if(response.length >= 2 && response.length <= 4) {
							for(var i=0;i<response.length;i++) {
								if(response[i].status != 'ready') {
									break;
								}
							}
							if(i == response.length) {
								gameroom.status = 'playing';
								gameroom.save();
								sails.sockets.blast('roomStartedPlay', {roomid: gameroom.roomid});
								sails.sockets.broadcast(gameroom.roomid.toString(), 'gameStarted', {});
								return res.ok('Game has begun!');
							}
							else {
								return res.badRequest("All players need to be ready in order to start the game!");
							}
							
						}
						else
							res.badRequest('Cannot start game.');
					});
				}
				else
					return res.badRequest('Game has already started!');
			}
		}
	},

	fetchplayers: function(req, res) {
		if(req.socket && req.session.me) {
			ActiveRooms.find({room: req.param('roomid')}).populate('user').exec(function(err, players) {
				// console.log(players);
				if(err) return res.badRequest(err);
				return res.ok(players);
			});
		}
		else
			return res.badRequest('Not authorized');
	},

	endgame: function(req, res) {
		if(req.socket && req.session.me) {
			var room = req.param('roomid');
			ActiveRooms.destroy({room: room}).exec(function(err) {
				if(err) return res.badRequest(err);
				GameRoom.update({roomid: room}, {status: 'finished'}).exec(function(err, record) {
					if(err) return res.badRequest(err);
					return res.ok();
				});
				
			});
		}
		else
			return res.badRequest('Not authorized');
	},

	getquestion: function(req, res) {
		if(req.socket && req.session.me) {
			var socketId = sails.sockets.getId(req);
			// console.log('Inside get question');
			var room = req.param('room');
			var round = req.param('round');
			var questionData;

			// Question can also be fetched using the database.

			if(round == 1) {
				var options = ['3', '4', '5', '6'];
				questionData = {
					question: 'How many times was Jon Snow stabbed to death?',
					round: round,
					options: options,
				};
				sails.sockets.broadcast(socketId, 'sendQuestion', questionData);
			}
			else if(round >= 2) {
				sails.sockets.broadcast(room.toString(), 'gameOver');
			}
		}
		else
			return res.badRequest('Not authorized');
	},

	checkanswer: function(req, res) {
		if(req.socket && req.session.me) {
			// console.log('Inside check answer');
			var socketId = sails.sockets.getId(req);
			// console.log(req.param);
			var roomId = req.param('roomId');
			// console.log(roomId);
			var round = req.param('round');
			// console.log(round);
			var answer = req.param('answer');
			// console.log(answer);

			if(round == '1') {
				// console.log('Round 1')
				if(answer == '6') {
					// console.log('correct');
					sails.sockets.broadcast(socketId, 'answerDetails', {roomId: roomId, round: round, status: 'correct'});
				}
				else
					sails.sockets.broadcast(socketId, 'answerDetails', {roomId: roomId, round: round, status: 'wrong'});
			}

			else if(round == '2') {
				if(answer == 'a') {

				}
				else {
					return res.ok({status: 'wrong'});
				}
			}
		}
		else
			return res.badRequest('Not authorized');
	},

	rooms: function(req, res) {
		// console.log("Insdie rooms");
		// console.log("Inside socket rooms");
		ActiveRooms.query('select gameroom.roomid, gameroom.title, count(activerooms.room) as count from gameroom, activerooms where activerooms.room = gameroom.roomid and gameroom.status = "waiting" group by gameroom.roomid having count(activerooms.room) <= 3', function(err, results) {
		  if (err) return res.serverError(err);
		  // console.log(results);
		  return res.ok(results);
		});
		
	},
};

