'use strict';

var fs = require('fs');

module.exports = function (file) {
    var stat;

    try {
        stat = fs.statSync(file);
    } catch (e) {
        return false;
    }

    return stat.isDirectory();
};