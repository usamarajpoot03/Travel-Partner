module.exports = function (grunt) {
  // load plugins
  ["grunt-contrib-jshint", "grunt-mocha-test"].forEach(function (task) {
    grunt.loadNpmTasks(task);
  });
  // configure plugins
  grunt.initConfig({
    jshint: {
      app: ["server.js", "public/js/**/*.js", "lib/**/*.js"],
      qa: ["Gruntfile.js", "public/qa/**/*.js", "qa/**/*.js"],
      options: {
        esversion: 6,
      },
    },
    mochaTest: {
      test: {
        options: {
          reporter: "spec",
          captureFile: "results.txt", // Optionally capture the reporter output to a file
          quiet: false, // Optionally suppress output to standard out (defaults to false)
          clearRequireCache: false, // Optionally clear the require cache before running tests (defaults to false)
          clearCacheFilter: (key) => true, // Optionally defines which files should keep in cache
          noFail: false, // Optionally set to not fail on failed tests (will still fail on other errors)
        },
        src: ["qa/tests-stress.js"],
      },
    },
  });
  // register tasks
  grunt.registerTask("default", ["jshint", "mochaTest"]);
};
