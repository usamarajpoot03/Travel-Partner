const express = require("express");
const app = express();
const handleBars = require("express-handlebars");
const bodyParser = require("body-parser");
var formidable = require("formidable");
const credentials = require("./credentials");
const db = require("./database");
var fs = require("fs");

// var sessionStore = new MongoSessionStore(db.mongoose.connection);

// var emailService = require("./libs/email.js")(credentials);
// emailService.send('joecustomer@gmail.com', 'Hood River tours on sale today!',
//  'Get \'em while they\'re hot!');

// Using Domain Context for error handling
app.use(function (req, res, next) {
  // create a domain for this request
  var domain = require("domain").create();
  // handle errors on this domain
  domain.on("error", function (err) {
    console.error("DOMAIN ERROR CAUGHT\n", err.stack);
    try {
      // failsafe shutdown in 5 seconds
      setTimeout(function () {
        console.error("Failsafe shutdown.");
        process.exit(1);
      }, 5000);
      // disconnect from the cluster
      var worker = require("cluster").worker;
      if (worker) worker.disconnect();
      // stop taking new requests
      server.close();
      try {
        // attempt to use Express error route
        next(err);
      } catch (err1) {
        // if Express error route failed, try
        // plain Node response
        console.error("Express error mechanism failed.\n", err1.stack);
        res.statusCode = 500;
        res.setHeader("content-type", "text/plain");
        res.end("Server error.");
      }
    } catch (err2) {
      console.error("Unable to send 500 response.\n", err2.stack);
    }
  });
  // add the request and response objects to the domain
  domain.add(req);
  domain.add(res);
  // execute the rest of the request chain in the domain
  domain.run(next);
});

// Logging setup
switch (app.get("env")) {
  case "development":
    // compact, colorful dev logging
    app.use(require("morgan")("dev"));
    break;
  case "production":
    // module 'express-logger' supports daily log rotation
    app.use(
      require("express-logger")({
        path: __dirname + "/log/requests.log",
      })
    );
    break;
}

// externalization cookies
app.use(require("cookie-parser")(credentials.cookieSecret));
const session = require("express-session");

var MongoDBStore = require("connect-mongodb-session")(session);
var store = new MongoDBStore({
  uri: credentials.mongo.development.connectionString,
  collection: "TravelPartnerSessions",
});
store.on("error", function (error) {
  console.log(error);
});

app.use(
  require("express-session")({
    secret: "This is a secret",
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 1 week
    },
    store: store,
    resave: true,
    saveUninitialized: true,
  })
);

app.use(require("express-session")());

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

// flash message middleware
app.use(function (req, res, next) {
  // if there's a flash message, transfer
  // it to the context, then clear it
  res.locals.flash = req.session.flash;
  delete req.session.flash;
  next();
});

// for cluster mode logs
app.use(function (req, res, next) {
  var cluster = require("cluster");
  if (cluster.isWorker)
    console.log("Worker %d received request", cluster.worker.id);
  next();
});

// only for api
app.use("/api", require("cors")());

app.get("/api/attractions", function (req, res) {
  db.Attraction.find({ approved: true }, function (err, attractions) {
    if (err) return res.send(500, "Error occurred: database error.");
    res.json(
      attractions.map(function (a) {
        return {
          name: a.name,
          id: a._id,
          description: a.description,
          location: a.location,
        };
      })
    );
  });
});

app.post("/api/attraction", function (req, res) {
  var a = new db.Attraction({
    name: req.body.name,
    description: req.body.description,
    location: { lat: req.body.lat, lng: req.body.lng },
    history: {
      event: "created",
      email: req.body.email,
      date: new Date(),
    },
    approved: false,
  });
  a.save(function (err, a) {
    if (err) return res.send(500, "Error occurred: database error.");
    res.json({ id: a._id });
  });
});

app.get("/api/attraction/:id", function (req, res) {
  db.Attraction.findById(req.params.id, function (err, a) {
    if (err) return res.send(500, "Error occurred: database error.");
    res.json({
      name: a.name,
      id: a._id,
      description: a.description,
      location: a.location,
    });
  });
});

// all routes defined here
require("./routes.js")(app);

app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500);
  res.render("500");
});

// directly serving files
var autoViews = {};
app.use(function (req, res, next) {
  var path = req.path.toLowerCase();
  // check cache; if it's there, render the view
  if (autoViews[path]) return res.render(autoViews[path]);
  // if it's not in the cache, see if there's
  // a .handlebars file that matches
  if (fs.existsSync(__dirname + "/views" + path + ".handlebars")) {
    autoViews[path] = path.replace(/^\//, "");
    return res.render(autoViews[path]);
  }
  // no view found; pass on to 404 handler
  next();
});

// error handlers
app.use(function (req, res) {
  res.status(404);
  res.render("404");
});

function startServer() {
  app.listen(app.get("port"), function () {
    console.log(
      `App is listening to the port ${app.get("port")} & env is ${app.get(
        "env"
      )}`
    );
  });
}

if (require.main === module) {
  startServer();
} else {
  module.exports = startServer;
}
