exports.vacationsPhoto = function (req, res) {
  var now = new Date();
  res.render("contest/vacation-photo", {
    year: now.getFullYear(),
    month: now.getMonth(),
  });
};

exports.vacationsPhotoPost = function (req, res) {
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    if (err) return res.redirect(303, "/error");
    if (err) {
      res.session.flash = {
        type: "danger",
        intro: "Oops!",
        message:
          "There was an error processing your submission. " +
          "Pelase try again.",
      };
      return res.redirect(303, "/contest/vacation-photo");
    }
    var photo = files.photo;
    var dir = vacationPhotoDir + "/" + Date.now();
    var path = dir + "/" + photo.name;
    fs.mkdirSync(dir);
    fs.renameSync(photo.path, dir + "/" + photo.name);
    saveContestEntry(
      "vacation-photo",
      fields.email,
      req.params.year,
      req.params.month,
      path
    );
    req.session.flash = {
      type: "success",
      intro: "Good luck!",
      message: "You have been entered into the contest.",
    };
    return res.redirect(303, "/contest/vacation-photo/entries");
  });
};

// form submission
exports.process = function (req, res) {
  if (req.xhr || req.accepts("json,html") === "json") {
    // if there were an error, we would send { error: 'error description' }
    res.send({ success: true });
  } else {
    // if there were an error, we would redirect to an error page
    res.redirect(303, "/thank-you");
  }
};
