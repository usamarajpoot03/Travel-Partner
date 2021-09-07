const main = require("./handlers/main");
const testing = require("./handlers/testing");
const tours = require("./handlers/tours");

module.exports = function (app) {
  // main routes
  app.get("/", main.home);
  app.get("/about", main.about);

  //   for tours
  app.get("/tours/hood-river", tours.hoodRiver);
  app.get("/tours/request-group-rate", tours.requestGroupRate);

  //   for testing purposes
  app.get("/headers", testing.headers);
  app.get("/redirect", testing.redirect);
  app.get("/cookies-get", testing["cookies-get"]);
  app.get("/sessions", testing.sessions);
  app.get("/fail", testing.fail);
  app.get("/epic-fail", testing["epic-fail"]);
};
