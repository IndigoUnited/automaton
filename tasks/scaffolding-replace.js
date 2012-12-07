var fs         = require('fs'),
    stringLib  = require('../lib/string'),
    glob       = require('glob'),
    async      = require('async'),
    utils      = require('amd-utils')
;

var task = {
    id      : 'scaffolding-replace',
    author  : 'Indigo United',
    name    : 'Scaffolding: replace',
    options : {
        file: {
            description: 'The file(s) to apply the replace (supports minimatch patterns)'
        },
        data: {
            description: 'The data to replace. Keys are placeholders and values the content of each placeholder.'
        },
        type: {
            description: 'The type of the data. Accepts "string" (default) and "file"',
            'default': 'string'
        }
    },
    tasks   :
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
                                return next(err);
                            }

                            data[key] = contents;
                            next();
                        });
                    } else {
                        data[key] = opt.data[key];
                        next();
                    }
                }, function () {
                    // data is done at this time
                    // For each item in the files array, perform a glob
                    async.forEach(files, function (file, next) {
                        glob(file, function (err, files) {
                            if (err) {
                                return next(err);
                            }

                            // For each file in the glob result,
                            // perform the interpolation
                            async.forEach(files, function (file, next) {
                                // Only apply to files
                                fs.stat(file, function (err, stat) {
                                    if (err) {
                                        return next(err);
                                    }

                                    if (!stat.isFile()) {
                                        return next();
                                    }

                                    fs.readFile(file, function (err, contents) {
                                        if (err) {
                                            return next(err);
                                        }

                                        contents = stringLib.interpolate(contents.toString(), data);
                                        fs.writeFile(file, contents, next);
                                    });
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