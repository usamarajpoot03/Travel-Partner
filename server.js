const express = require("express");
const app = express();
const handleBars = require("express-handlebars");
const fortune = require("./libs/fortune");
// view engine
app.engine("handlebars", handleBars({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// avoid sending server info
app.disable("x-powered-by");

// static content
app.use(express.static(__dirname + "/public"));

// port settings
app.set("port", process.env.PORT || 3000);

// test detection middleware
app.use((req, res, next) => {
  res.locals.showTests =
    req.get("env") != "production" && req.query.test == "1";
  next();
});

// routes
app.get("/", function (req, res) {
  res.render("home");
});

app.get("/about", function (req, res) {
  res.render("about", {
    fortune: fortune.getFortune(),
    pageTestScript: "/qa/tests-about.js",
  });
});

app.get("/tours/hood-river", function (req, res) {
  res.render("tours/hood-river");
});

app.get("/tours/request-group-rate", function (req, res) {
  res.render("tours/request-group-rate");
});

// respond with headers
app.get("/headers", function (req, res) {
  res.set("Content-Type", "text/plain");
  var s = "";
  for (var name in req.headers) s += name + ": " + req.headers[name] + "\n";
  res.send(s);
});

// respond with headers
app.get("/redirect", function (req, res) {
  res.redirect(301, "/headers");
});

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500);
  res.render("500");
});
// error handlers
app.use(function (req, res) {
  res.status(404);
  res.render("404");
});

app.listen(app.get("port"), function () {
  console.log(`App is listening to the port ${app.get("port")}`);
});
