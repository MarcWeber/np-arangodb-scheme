module.exports = function(grunt) {

  grunt.initConfig({
    coffee: {
      compileWithMaps: {
          options: {
            sourceMap: true
          },
          files: {
            'index.js': ['index.iced'],
            'test/test-test.js': ['test/test-test.iced']
          }
        },

    },

    mochaTest: {
      test: {
        options: {
          reporter: 'spec'
        },
        src: ['test/test-test.js']
      }
    }
  });

  grunt.loadNpmTasks('grunt-iced-coffee');
  grunt.loadNpmTasks('grunt-mocha-test');
  grunt.registerTask('test', ['coffee', 'mochaTest']);
}
