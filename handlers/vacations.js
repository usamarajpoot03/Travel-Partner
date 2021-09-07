const db = require("../database");
var Vacation = require("../database/models/vacation");

// vacations

exports.home = function (req, res) {
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
};

exports.setCurrency = function (req, res) {
  req.session.currency = req.params.currency;
  return res.redirect(303, "/vacations");
};

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
