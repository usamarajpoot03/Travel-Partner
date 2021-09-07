const main = require("./handlers/main");
const testing = require("./handlers/testing");
const tours = require("./handlers/tours");
const notifications = require("./handlers/notifications");
const contest = require("./handlers/contest");
const vacations = require("./handlers/vacations");
const newsletter = require("./handlers/newsletter");

module.exports = function (app) {
  // main routes
  app.get("/", main.home);
  app.get("/about", main.about);

  //   for tours
  app.get("/tours/hood-river", tours.hoodRiver);
  app.get("/tours/request-group-rate", tours.requestGroupRate);

  //   for notifify me
  app.get("/notify-me-when-in-season", notifications.notifyMeWhenInSeason);
  app.post("/notify-me-when-in-season", notifications.notifyMeWhenInSeasonPost);

  //   for contests
  app.get("/contest/vacation-photo", contest.vacationsPhoto);
  app.post("/contest/vacation-photo/:year/:month", contest.vacationsPhotoPost);
  app.post("/process", contest.process);

  //   for vacations
  app.get("/vacations", vacations.home);
  app.get("/set-currency/:currency", vacations.setCurrency);

  //   newlettter
  app.get("/newsletter", newsletter.home);
  app.post("/newsletter", newsletter.newsletterPost);

  //   for testing purposes
  app.get("/headers", testing.headers);
  app.get("/redirect", testing.redirect);
  app.get("/cookies-get", testing["cookies-get"]);
  app.get("/sessions", testing.sessions);
  app.get("/fail", testing.fail);
  app.get("/epic-fail", testing["epic-fail"]);
};
