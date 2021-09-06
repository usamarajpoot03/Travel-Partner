const express = require("express");
const app = express();
const handleBars = require("express-handlebars");
const bodyParser = require("body-parser");
var formidable = require("formidable");
const fortune = require("./libs/fortune");
const credentials = require("./credentials");
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
      } catch (err) {
        // if Express error route failed, try
        // plain Node response
        console.error("Express error mechanism failed.\n", err.stack);
        res.statusCode = 500;
        res.setHeader("content-type", "text/plain");
        res.end("Server error.");
      }
    } catch (err) {
      console.error("Unable to send 500 response.\n", err.stack);
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

// send dummy cookie
app.get("/cookies", function (req, res) {
  // signed will take precedence
  res.cookie("user-id-signed", "user123_abc", { signed: true, httpOnly: true });
  res.cookie("user-id", "user123_abc");
  res.send();
});

// send dummy cookie
app.get("/cookies-get", function (req, res) {
  const cookiesData = {};
  cookiesData.simple = req.cookies;
  cookiesData.signed = req.signedCookies;
  cookiesData.secret = req.secret;
  res.send(cookiesData);
});

let userNumber = 1;

app.get("/sessions", function (req, res) {
  console.log(req.session);
  const sessionsData = {};
  if (!req.session.userId) {
    req.session.userId = userNumber;
    userNumber++;
  }
  console.log(req.session);

  sessionsData.session = req.session;
  res.send(sessionsData);
});

// Intertional failing
app.get("/fail", function (req, res) {
  throw new Error("Nope!");
});

app.get("/epic-fail", function (req, res) {
  process.nextTick(function () {
    throw new Error("Destored Everything!");
  });
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
