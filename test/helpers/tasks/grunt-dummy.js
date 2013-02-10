'use strict';

module.exports = function (grunt) {
    grunt.registerMultiTask('dummy', 'Dummy task.', function () {
        grunt.log.writeln('dummy');
    });
};