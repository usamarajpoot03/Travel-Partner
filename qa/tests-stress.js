var loadtest = require("loadtest");
var expect = require("chai").expect;
describe("Stress tests", function () {
  it("Homepage should handle 1000 requests in 1 second", function (done) {
    var options = {
      url: "http://localhost:3000",
      // concurrency: 4,
      maxRequests: 1,
    };

    loadtest.loadTest(options, function (err, result) {
      expect(!err);
      expect(result.totalTimeSeconds < 5);
      done();
    });
  });
});
