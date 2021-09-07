exports.headers = function (req, res) {
  res.set("Content-Type", "text/plain");
  var s = "";
  for (var name in req.headers) s += name + ": " + req.headers[name] + "\n";
  res.send(s);
};

exports.redirect = function (req, res) {
  res.redirect(301, "/headers");
};

// send dummy cookie
exports.cookies = function (req, res) {
  // signed will take precedence
  res.cookie("user-id-signed", "user123_abc", { signed: true, httpOnly: true });
  res.cookie("user-id", "user123_abc");
  res.send();
};
// send dummy cookie

exports["cookies-get"] = function (req, res) {
  const cookiesData = {};
  cookiesData.simple = req.cookies;
  cookiesData.signed = req.signedCookies;
  cookiesData.secret = req.secret;
  res.send(cookiesData);
};

let userNumber = 1;

exports.sessions = function (req, res) {
  console.log(req.session);
  const sessionsData = {};
  if (!req.session.userId) {
    req.session.userId = userNumber;
    userNumber++;
  }
  console.log(req.session);
  sessionsData.session = req.session;
  res.send(sessionsData);
};

// Intertional failing
exports.fail = function (req, res) {
  throw new Error("Nope!");
};

exports["epic-fail"] = function (req, res) {
  process.nextTick(function () {
    throw new Error("Destored Everything!");
  });
};
