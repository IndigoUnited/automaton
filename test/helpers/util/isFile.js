'use strict';

var fs = require('fs');

function isFile(file) {
    var stat;

    try {
        stat = fs.statSync(file);
    } catch (e) {
        return false;
    }

    return stat.isFile();
}

module.exports = isFile;
