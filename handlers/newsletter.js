exports.home = function (req, res) {
  // we will learn about CSRF later...for now, we just
  // provide a dummy value
  res.render("newsletter", { csrf: "CSRF token goes here" });
};

exports.newsletterPost = function (req, res) {
  var name = req.body.name || "",
    email = req.body.email || "";
  // input validation
  if (!email.match(VALID_EMAIL_REGEX)) {
    if (req.xhr) return res.json({ error: "Invalid name email address." });
    req.session.flash = {
      type: "danger",
      intro: "Validation error!",
      message: "The email address you entered was not valid.",
    };
    return res.redirect(303, "/newsletter/archive");
  }
  new NewsletterSignup({ name: name, email: email }).save(function (err) {
    if (err) {
      if (req.xhr) return res.json({ error: "Database error." });
      req.session.flash = {
        type: "danger",
        intro: "Database error!",
        message: "There was a database error; please try again later.",
      };
      return res.redirect(303, "/newsletter/archive");
    }
    if (req.xhr) return res.json({ success: true });
    req.session.flash = {
      type: "success",
      intro: "Thank you!",
      message: "You have now been signed up for the newsletter.",
    };
    return res.redirect(303, "/newsletter/archive");
  });
};
