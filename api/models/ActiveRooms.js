/**
 * ActiveRooms.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {
	connection: 'localMysqlServer',
	
  attributes: {
  	room: {
  		model: 'GameRoom'
  	},
  	user: {
  		model: 'User'
  	},
    status: {
      type: 'string',
      enum: ['joined room', 'ready', 'playing'],
      defaultsTo: 'joined room',
      required: false,
    }
  },

  countUsersInRoom: function(inputs, cb) {
    // console.log(inputs.roomId);
    ActiveRooms.count({room: inputs.roomId}).exec(cb);
  },

  isUserInRoom: function(inputs, cb) {
    // console.log(inputs.roomId);
    // console.log(inputs.userId);
    ActiveRooms.find({room: inputs.roomId, user: inputs.userId}).exec(cb);
  },

};

