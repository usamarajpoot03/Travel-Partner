var mongoose = require("mongoose");
var vacationInSeasonListenerSchema = mongoose.Schema({
  email: String,
  skus: [String],
});
module.exports = vacationInSeasonListenerSchema;
