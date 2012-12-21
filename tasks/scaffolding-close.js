var fs     = require('fs'),
    interp = require('../lib/string/interpolate'),
    glob   = require('glob'),
    async  = require('async'),
    utils  = require('amd-utils')
;

var task = {
    id         : 'scaffolding-close',
    author     : 'Indigo United',
    name       : 'Scaffolding: close placeholder',
    description: 'Close placeholders in files',
    options    : {
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
            'default': {
                dot: true
            }
        }
    },
    tasks       :
    [
        {
            task: function (opt, next) {
                opt.glob = opt.glob || {};
                var files = !utils.lang.isArray(opt.files) ? [opt.files] : opt.files;
                var data = {};

                opt.placeholders.forEach(function (placeholder) {
                    data[placeholder] = '';
                });

                // data is done at this time
                // For each item in the files array, perform a glob
                opt.glob.mark = true;
                async.forEach(files, function (file, next) {
                    glob(file, opt.glob, function (err, matches) {
                        if (err) {
                            return next(err);
                        }

                        var files = matches.filter(function (match) {
                            return !utils.string.endsWith(match, '/');
                        });

                        // For each file in the glob result,
                        // perform the interpolation
                        async.forEach(files, function (file, next) {
                            fs.readFile(file, function (err, contents) {
                                if (err) {
                                    return next(err);
                                }

                                contents = interp(contents.toString(), data, { trim: opt.trim });
                                fs.writeFile(file, contents, next);
                            });
                        }, next);
                    });
                }, next);
            }
        }
    ]
};

module.exports = task;