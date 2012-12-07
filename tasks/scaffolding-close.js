var fs         = require('fs'),
    stringLib  = require('../lib/string'),
    glob       = require('glob'),
    async      = require('async'),
    utils      = require('amd-utils')
;

var task = {
    id      : 'scaffolding-close',
    author  : 'Indigo United',
    name    : 'Scaffolding: close placeholder',
    options : {
        file: {
            description: 'The file(s) to apply the close (supports minimatch patterns)'
        },
        placeholders: {
            description: 'Which placeholder(s) to close'
        },
        cleanup: {
            description: 'Cleans leading or trailing spaces',
            'default': true
        }
    },
    tasks   :
    [
        {
            task : function (opt, next) {
                var files = !utils.lang.isArray(opt.file) ? [opt.file] : opt.file;
                var data = {};

                opt.placeholders.forEach(function (placeholder) {
                    data[placeholder] = '';
                });

                // data is done at this time
                // For each item in the files array, perform a glob
                async.forEach(files, function (file, next) {
                    glob(file, function (err, files) {
                        if (err) {
                            next(err);
                        }

                        // For each file in the glob result,
                        // close the placeholders
                        async.forEach(files, function (file, next) {
                            fs.readFile(file, function (err, contents) {
                                if (err) {
                                    next(err);
                                }

                                contents = stringLib.interpolate(contents.toString(), data, opt.cleanup);
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