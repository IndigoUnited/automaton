'use strict';

var fs = require('fs');

function isDir(file) {
    var stat;

    try {
        stat = fs.statSync(file);
    } catch (e) {
        return false;
    }

    return stat.isDirectory();
}

module.exports = isDir;
