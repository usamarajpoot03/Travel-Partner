const express = require("express");
const app = express();

app.set("view engine", "pug");

app.set("port", process.env.PORT || 3000);

app.get("/", function (req, res) {
  res.render("home");
});
app.get("/about", function (req, res) {
  res.render("about");
});

app.use(function (req, res) {
  res.status(404);
  res.render("404");
});

// custom 500 page
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500);
  res.render("500");
});

app.listen(app.get("port"), function () {
  console.log(`App is listening to the port ${app.get("port")}`);
});
