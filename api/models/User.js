/**
 * User.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

module.exports = {

	connection: 'localMysqlServer',

  attributes: {
  	fullName: {
      type: 'string',
      size: 128,
      required: true
    },
    userName: {
      type: 'string',
      required: true,
      size: 30,
      unique: true
    },
    password: {
      type: 'string',
      required: true,
    },
    status: {
      type: 'string',
      enum: ['offline', 'online'],
      defaultsTo: 'offline',
      required: false
    },
    gameroom: {
      collection: 'GameRoom',
      via: 'owner'
    }
  },


  // Find if user exists
  findUser: function(inputs, cb) {
    User.findOne({
      username: inputs.username
    })
    .exec(cb);
  },
};

