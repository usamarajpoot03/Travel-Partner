var mongoose = require("mongoose");
var credentials = require("../credentials");
const vacationSchema = require("./models/vacation");
const vacationInSeasonListenerSchema = require("./models/vacationInSeasonListener");
var opts = {
  //   server: {
  //     socketOptions: { keepAlive: 1 },
  //   },
};
switch ("development") {
  case "development":
    mongoose.connect(credentials.mongo.development.connectionString, opts);
    break;
  case "production":
    mongoose.connect(credentials.mongo.production.connectionString, opts);
    break;
  default:
    throw new Error("Unknown execution environment: " + process.env.NODE_ENV);
}

var Vacation = mongoose.model("Vacation", vacationSchema);
var VacationInSeasonListener = mongoose.model(
  "VacationInSeasonListener",
  vacationInSeasonListenerSchema
);
const db = {};
db.mongoose = mongoose;
db.Vacation = Vacation;
db.VacationInSeasonListener = VacationInSeasonListener;

module.exports = db;
