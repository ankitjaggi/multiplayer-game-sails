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
						return res.send(err);
					}
					else {
						sails.log(created);
						ActiveRooms.create({room: created, user: user}).exec(function (err, activeroom){
							if(err) {
								console.log(err);
							}
							else {
								return res.json({room: created});
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
	},

	joinroom: function(req, res) {
		
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
												console.log("User added to room");
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
		if(req.session.me) {
			// var query = GameRoom.find().populate('ActiveRooms').populate('GameRoom').where({''})
		}	
		else {
			res.redirect('/');
		}
	}
};

