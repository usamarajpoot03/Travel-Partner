const express = require("express");
const app = express();
const handleBars = require("express-handlebars");
const bodyParser = require("body-parser");
var formidable = require("formidable");
var jqupload = require("jquery-file-upload-middleware");
const fortune = require("./libs/fortune");
// view engine
app.engine(
  "handlebars",
  handleBars({
    defaultLayout: "main",
    helpers: {
      section: function (name, options) {
        if (!this._sections) this._sections = {};
        this._sections[name] = options.fn(this);
        return null;
      },
    },
  })
);
app.set("view engine", "handlebars");

// avoid sending server info
app.disable("x-powered-by");
// body parser for post
app.use(bodyParser());

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

// tour routes
app.get("/tours/hood-river", function (req, res) {
  res.render("tours/hood-river");
});

app.get("/tours/request-group-rate", function (req, res) {
  res.render("tours/request-group-rate");
});

// newletter
app.get("/newsletter", function (req, res) {
  // we will learn about CSRF later...for now, we just
  // provide a dummy value
  res.render("newsletter", { csrf: "CSRF token goes here" });
});

// contest
app.get("/contest/vacation-photo", function (req, res) {
  var now = new Date();
  res.render("contest/vacation-photo", {
    year: now.getFullYear(),
    month: now.getMonth(),
  });
});

app.post("/contest/vacation-photo/:year/:month", function (req, res) {
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    if (err) return res.redirect(303, "/error");
    console.log("received fields:");
    console.log(fields);
    console.log("received files:");
    console.log(files);
    res.redirect(303, "/thank-you");
  });
});

// form submission
app.post("/process", function (req, res) {
  if (req.xhr || req.accepts("json,html") === "json") {
    // if there were an error, we would send { error: 'error description' }
    res.send({ success: true });
  } else {
    // if there were an error, we would redirect to an error page
    res.redirect(303, "/thank-you");
  }
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
