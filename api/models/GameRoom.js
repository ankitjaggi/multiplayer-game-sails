/**
 * GameRoom.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

	connection: 'localMysqlServer',

  attributes: {
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
  }
};

