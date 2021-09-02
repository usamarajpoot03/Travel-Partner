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
    },
  });
  // register tasks
  grunt.registerTask("default", ["jshint"]);
};
