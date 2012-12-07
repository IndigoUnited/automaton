var fs         = require('fs'),
    stringLib  = require('../lib/string'),
    glob       = require('glob'),
    async      = require('async'),
    utils      = require('amd-utils')
;

var task = {
    id      : 'scaffolding-append',
    author  : 'Indigo United',
    name    : 'Scaffolding: append',
    options : {
        file: {
            description: 'The file(s) to apply the append (supports minimatch patterns)'
        },
        data: {
            description: 'The data to append. Keys are placeholders and values the content of each placeholder.'
        },
        type: {
            description: 'The type of the data. Accepts "string" (default) and "file"',
            'default': 'string'
        }
    },
    task    :
    [
        {
            task: function (opt, next) {
                var files = !utils.lang.isArray(opt.file) ? [opt.file] : opt.file;
                var data = {};
                var keys = Object.keys(opt.data);

                async.forEach(keys, function (key, next) {
                    if (opt.type === 'file') {
                        fs.readFile(opt.data[key], function (err, contents) {
                            if (err) {
                                next(err);
                            }

                            data[key] = contents + '{{' + key + '}}';
                            next();
                        });
                    } else {
                        data[key] = opt.data[key] + '{{' + key + '}}';
                        next();
                    }
                }, function () {
                    // data is done at this time
                    // For each item in the files array, perform a glob
                    async.forEach(files, function (file, next) {
                        glob(file, function (err, files) {
                            if (err) {
                                next(err);
                            }

                            // For each file in the glob result,
                            // perform the interpolation
                            async.forEach(files, function (file, next) {
                                fs.readFile(file, function (err, contents) {
                                    if (err) {
                                        next(err);
                                    }

                                    contents = stringLib.interpolate(contents.toString(), data);
                                    fs.writeFile(file, contents, next);
                                });
                            }, next);
                        });
                    }, next);
                });
            }
        }
    ]
};

module.exports = task;