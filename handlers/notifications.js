const db = require("../database");

exports.notifyMeWhenInSeason = function (req, res) {
  res.render("notify-me-when-in-season", { sku: req.query.sku });
};

exports.notifyMeWhenInSeasonPost = function (req, res) {
  db.VacationInSeasonListener.update(
    { email: req.body.email },
    { $push: { skus: req.body.sku } },
    { upsert: true },
    function (err) {
      if (err) {
        console.error(err.stack);
        req.session.flash = {
          type: "danger",
          intro: "Ooops!",
          message: "There was an error processing your request.",
        };
        return res.redirect(303, "/vacations");
      }
      req.session.flash = {
        type: "success",
        intro: "Thank you!",
        message: "You will be notified when this vacation is in season.",
      };
      return res.redirect(303, "/vacations");
    }
  );
};
