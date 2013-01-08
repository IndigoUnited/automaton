var fs     = require('fs'),
    interp = require('../lib/string/interpolate'),
    glob   = require('glob'),
    async  = require('async'),
    utils  = require('amd-utils')
;

var task = {
    id         : 'scaffolding-replace',
    author     : 'Indigo United',
    name       : 'Scaffolding: replace',
    description: 'Replace placeholders in file names',
    options    : {
        files: {
            description: 'The files to scaffold. Accepts an array of files or a single one through a string. Works with minimatch.'
        },
        data: {
            description: 'The data to replace. Keys are placeholders and values the content of each placeholder.'
        },
        type: {
            description: 'The type of the data. Accepts "string" (default) and "file"',
            'default': 'string'
        },
        glob: {
            description: 'The options to pass to glob (please look the available options in the glob package README)',
            'default': null
        }
    },
    tasks      :
    [
        {
            task: function (opt, ctx, next) {
                opt.glob = opt.glob || {};
                var files = !utils.lang.isArray(opt.files) ? [opt.files] : opt.files;
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
                        glob(file, opt.glob, function (err, matches) {
                            if (err) {
                                return next(err);
                            }

                            // For each match in the glob result,
                            // perform the interpolation
                            async.forEach(matches, function (file, next) {
                                // Check if is an actual file
                                // We couldn't use mark option because is bugged
                                // See: https://github.com/isaacs/node-glob/issues/50
                                fs.stat(file, function (err, stat) {
                                    if (err) {
                                        return next(err);
                                    }

                                    if (!stat.isFile()) {
                                        next();
                                    }

                                    fs.readFile(file, function (err, contents) {
                                        if (err) {
                                            return next(err);
                                        }

                                        contents = interp(contents.toString(), data);
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