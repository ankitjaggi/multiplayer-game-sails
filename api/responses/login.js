module.exports = function login(inputs) {

    inputs = inputs || {};

    // Get access to `req` and `res`
    var req = this.req;
    var res = this.res;
    console.log(inputs.username);
    // Look up the user
    User.findUser({
        username: inputs.username
    }, function (err, user) {

        if (err) return res.negotiate(err);
        if (!user) {

            if (req.wantsJSON || !inputs.invalidRedirect) {
                return res.badRequest('Invalid username/password combination.');
            }
            return res.redirect(inputs.invalidRedirect);
        }
        console.log(user);
        var password = inputs.password;
        var hasher = require("password-hash");
        if (hasher.verify(password, user.password)) {

            // "Remember" the user in the session
            // Subsequent requests from this user agent will have `req.session.me` set.
            req.session.me = user.id;
            req.session.name = user.userName;

            // If this is not an HTML-wanting browser, e.g. AJAX/sockets/cURL/etc.,
            // send a 200 response letting the user agent know the login was successful.
            // (also do this if no `successRedirect` was provided)
            if (req.wantsJSON || !inputs.successRedirect) {
                return res.ok();
            }

            // Otherwise if this is an HTML-wanting browser, redirect to /.
            return res.redirect(inputs.successRedirect);
        }
        else {
            if (req.wantsJSON || !inputs.invalidRedirect) {
                return res.badRequest('Invalid username/password combination.');
            }
            return res.redirect(inputs.invalidRedirect);
        }
    });
};