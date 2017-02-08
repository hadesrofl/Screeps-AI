module.exports = function(grunt) {

    // Project configuration.
    grunt.initConfig({
      pkg: grunt.file.readJSON('package.json'),
      screeps: {
          options: {
              email: 'test@test.org',
              password: 'password',
              branch: 'default',
              ptr: false
          },
          dist: {
              src: ['src/*.js']
          }
      }
    });

    grunt.loadNpmTasks('grunt-screeps');

    // Default task(s).
    grunt.registerTask('default', ['screeps']);
}
