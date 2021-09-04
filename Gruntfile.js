module.exports = function (grunt) {
  // load plugins
  ["grunt-contrib-jshint"].forEach(function (task) {
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
  });
  // register tasks
  grunt.registerTask("default", ["jshint"]);
};
