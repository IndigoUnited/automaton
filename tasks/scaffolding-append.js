'use strict';

var fs     = require('fs'),
    interp = require('../lib/string/interpolate'),
    glob   = require('glob'),
    async  = require('async'),
    utils  = require('mout')
;

var task = {
    id          : 'scaffolding-append',
    author      : 'Indigo United',
    name        : 'Scaffolding: append',
    description : 'Append data to {{placeholders}} in files. This will look for the placeholder in a file, and append a string to it.',
    options: {
        files: {
            description: 'Which files to process. Accepts a filename and array of filenames. Also note that the filenames can be minimatch patterns.'
        },
        data: {
            description: 'The data to append. Keys are placeholder names and values the content for each placeholder.'
        },
        type: {
            description: 'The type of the data. Accepts "string" and "file"',
            'default': 'string'
        },
        glob: {
            description: 'The options to pass to glob (check https://npmjs.org/package/glob for details).',
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

                opt.glob.mark = true;

                async.forEach(keys, function (key, next) {
                    if (opt.type === 'file') {
                        fs.readFile(opt.data[key], function (err, contents) {
                            if (err) {
                                return next(err);
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

                                    contents = interp(contents.toString(), data);
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