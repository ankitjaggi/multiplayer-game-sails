/**
 * GameRoom.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

var crypto = require('crypto');

module.exports = {

	connection: 'localMysqlServer',
  autoPK: false,

  attributes: {
    roomid: {
      type: 'string',
      primaryKey: true,
      unique: true,
    },
  	title: {
  		type: 'string',
  	},
  	owner: {
  		model: 'user',
  		unique: true
  	},
    status: {
      type: 'string',
      enum: ['finished', 'playing', 'waiting', 'created'],
      defaultsTo: 'created',
      required: false,
    },
  	users: {
	    collection: 'ActiveRooms',
	    via: 'user'
  	}
  },

  generateRoomId: function() {
    var length = 10;
    chars = "abcdefghijklmnopqrstuwxyzABCDEFGHIJKLMNOPQRSTUWXYZ0123456789";
    var rnd = crypto.randomBytes(length)
        , value = new Array(length)
        , len = chars.length;

    for (var i = 0; i < length; i++) {
        value[i] = chars[rnd[i] % len]
    };

    return value.join('');
   
  }
};

