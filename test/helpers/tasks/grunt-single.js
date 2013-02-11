'use strict';

var fs = require('fs');

module.exports = function (grunt) {
    grunt.registerTask('dummy-single', 'Dummy single', function () {
        var file = grunt.config('dummy-single.file');
        fs.writeFileSync(file, 'dummy');
    });
};