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
    // Boilerplate options, see:
    // * https://www.npmjs.com/package/express-session#resave
    // * https://www.npmjs.com/package/express-session#saveuninitialized
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

// all routes defined here
require("./routes.js")(app);

// newletter
app.get("/newsletter", function (req, res) {
  // we will learn about CSRF later...for now, we just
  // provide a dummy value
  res.render("newsletter", { csrf: "CSRF token goes here" });
});

app.post("/newsletter", function (req, res) {
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
});

var Vacation = require("./database/models/vacation");

// vacations
app.get("/vacations", function (req, res) {
  db.Vacation.find({ available: true }, function (err, vacations) {
    var currency = req.session.currency || "USD";
    var context = {
      currency: currency,
      vacations: vacations.map(function (vacation) {
        return {
          sku: vacation.sku,
          name: vacation.name,
          description: vacation.description,
          inSeason: vacation.inSeason,
          price: convertFromUSD(vacation.priceInCents / 100, currency),
          qty: vacation.qty,
        };
      }),
    };
    switch (currency) {
      case "USD":
        context.currencyUSD = "selected";
        break;
      case "GBP":
        context.currencyGBP = "selected";
        break;
      case "BTC":
        context.currencyBTC = "selected";
        break;
    }
    res.render("vacations", context);
  });
});

app.get("/notify-me-when-in-season", function (req, res) {
  res.render("notify-me-when-in-season", { sku: req.query.sku });
});

app.post("/notify-me-when-in-season", function (req, res) {
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
});

app.get("/set-currency/:currency", function (req, res) {
  req.session.currency = req.params.currency;
  return res.redirect(303, "/vacations");
});
function convertFromUSD(value, currency) {
  switch (currency) {
    case "USD":
      return value * 1;
    case "GBP":
      return value * 0.6;
    case "BTC":
      return value * 0.0023707918444761;
    default:
      return NaN;
  }
}

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
