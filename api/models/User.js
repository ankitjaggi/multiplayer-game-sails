/**
 * User.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */
var bcrypt = require('bcrypt');
var SALT_WORK_FACTOR = 10;

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
    email: { 
      type: 'email',
      required: true,
      unique: true
    },
    password: {
      type: 'string',
      required: true,
      minLength: 6,
      maxLength: 50
    },
  },

  beforeCreate: function (attrs, cb) {
	    bcrypt.hash(attrs.password, SALT_WORK_FACTOR, function (err, hash) {
	      attrs.password = hash;
	      return cb();    
	    });
	},
};

