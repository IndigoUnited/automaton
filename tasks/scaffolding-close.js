var fs     = require('fs'),
    interp = require('../lib/interpolate'),
    glob   = require('glob'),
    async  = require('async'),
    utils  = require('amd-utils')
;

var task = {
    id      : 'scaffolding-close',
    author  : 'Indigo United',
    name    : 'Scaffolding: close placeholder',
    options : {
        files: {
            description: 'The files to scaffold. Accepts an array of files or a single one through a string. Works with minimatch.'
        },
        placeholders: {
            description: 'Which placeholder(s) to close'
        },
        trim: {
            description: 'Trim leading or trailing spaces',
            'default': true
        },
        glob: {
            description: 'The options to pass to glob (please look the available options in the glob package README)',
            'default': null
        }
    },
    tasks   :
    [
        {
            task : function (opt, next) {
                var files = !utils.lang.isArray(opt.files) ? [opt.files] : opt.files;
                var data = {};

                opt.placeholders.forEach(function (placeholder) {
                    data[placeholder] = '';
                });

                // data is done at this time
                // For each item in the files array, perform a glob
                async.forEach(files, function (file, next) {
                    glob(file, opt.glob, function (err, files) {
                        if (err) {
                            return next(err);
                        }

                        // For each file in the glob result,
                        // close the placeholders
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

                                    contents = interp(contents.toString(), data, { trim: opt.trim });
                                    fs.writeFile(file, contents, next);
                                });
                            });
                        }, next);
                    });
                }, next);
            }
        }
    ]
};

module.exports = task;