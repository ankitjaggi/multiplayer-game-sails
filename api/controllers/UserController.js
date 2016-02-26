/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Controllers
 */

var mygame = require('./SocketController');

module.exports = {

	login: function(req, res) {
		console.log("Trying to login");
		console.log('Still trying...');
		// return res.login({
  //           username: req.param('username'),
  //           password: req.param('password'),
  //           successRedirect: '/game',
  //           invalidRedirect: '/'
  //       });
		
		console.log(req.param('username'));
	    // Look up the user
	    User.findUser({
	        username: req.param('username')
	    }, function (err, user) {

	        if (err) return res.negotiate(err);
	        if (!user) {

	            if (req.wantsJSON) {
	                return res.badRequest('Invalid username/password combination.');
	            }
	            return res.redirect('/');
	        }
	        console.log(user);
	        var password = req.param('password');
	        var hasher = require("password-hash");
	        if (hasher.verify(password, user.password)) {

	            // "Remember" the user in the session
	            // Subsequent requests from this user agent will have `req.session.me` set.
	            req.session.me = user.id;
	            req.session.name = user.userName;
	            user.status = 'online';
	            user.save();
	            // If this is not an HTML-wanting browser, e.g. AJAX/sockets/cURL/etc.,
	            // send a 200 response letting the user agent know the login was successful.
	            // (also do this if no `successRedirect` was provided)
	            if (req.wantsJSON) {
	                return res.ok();
	            }

	            console.log("socket: "+req.socket);
	   //          sails.io.sockets.on('connection', function (socket) {
				//     console.log('user logged in: '+user.userName);
				//     mygame.initGame(sails.io, socket);
				// });
				// Otherwise if this is an HTML-wanting browser, redirect to /game.
	            return res.redirect('/game');
	        }
	        else {
	            if (req.wantsJSON) {
	                return res.badRequest('Invalid username/password combination.');
	            }
	            return res.redirect('/');
	        }
	    });
	},


	signup: function (req, res) {
		console.log("Registering new user: "+req.param('name'));

		var password = req.param('password');
	    var hasher = require("password-hash");
	    password = hasher.generate(password);

	    User.findUser({
	          username: req.param('username')
	      }, function (err, usr) {
	        if(err) {
	          console.log("Inside error");
	          return res.serverError("DB Error");
	          

	        }
	        else if(usr) {
	          console.log("Found user...");
	          return res.send(400, {error: "Username already exists"});
	      		
	        }
	        else {
	          console.log("Creating new user");
	          User.create({
	            fullName: req.param('name'),
	            userName: req.param('username'),
	            password: password,
	          })
	          .exec(function(err, user) {
	          	
	          	if(err) {
	          		console.log(err);
	          	}
	          	else if(user) {
	          		req.session.me = user.id;
		            req.session.name = user.name;
		          	if (req.wantsJSON) {
	            		return res.ok('Signup successful!');
		            }
		            
		            return res.redirect('/game');
	          	}
	          	
	          });
	        

	        }
	    });


        // User.signup({
        //     name: req.param('name'),
        //     username: req.param('username'),
        //     password: req.param('password'),
        // }, function (err, user) {
        // 	console.log(err);
        // 	console.log(user);
        //     // res.negotiate() will determine if this is a validation error
        //     // or some kind of unexpected server error, then call `res.badRequest()`
        //     // or `res.serverError()` accordingly.
        //     if (err) return res.negotiate(err);

        //     // Go ahead and log this user in as well.
        //     // We do this by "remembering" the user in the session.
        //     // Subsequent requests from this user agent will have `req.session.me` set.
        //     req.session.me = user.id;
        //     req.session.name = user.name;

        //     // If this is not an HTML-wanting browser, e.g. AJAX/sockets/cURL/etc.,
        //     // send a 200 response letting the user agent know the signup was successful.
        //     if (req.wantsJSON) {
        //         return res.ok('Signup successful!');
        //     }

        //     // Otherwise if this is an HTML-wanting browser, redirect to /welcome.
        //     return res.redirect('/game');
        // });
    },
    logout: function(req, res) {
    	console.log("Logging out...");
    	req.session.me = null;
    	console.log('Logged out successfully!');
        // If this is not an HTML-wanting browser, e.g. AJAX/sockets/cURL/etc.,
        // send a simple response letting the user agent know they were logged out
        // successfully.
        if (req.wantsJSON) {
            return res.ok('Logged out successfully!');
        }

        // Otherwise if this is an HTML-wanting browser, do a redirect.
        return res.redirect('/');
    },

    changeStatus: function(req, res) {
    	console.log("Changing status fo user...");
    	User.findOne({id: req.param('id')}).exec(function(err, user) {
	        if (err) {
	            return res.negotiate(err);
	        }
	        else {
	            // req.session.me.status = req.param('status');
	            user.status = req.param('status');
	            user.save();
	        }
	    });
    }
};

