const fortune = require("../libs/fortune");

exports.home = function (req, res) {
  res.render("home");
};

exports.about = function (req, res) {
  res.render("about", {
    fortune: fortune.getFortune(),
    pageTestScript: "/qa/tests-about.js",
  });
};
