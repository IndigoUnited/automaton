'use strict';

var fs     = require('fs'),
    glob   = require('glob'),
    async  = require('async'),
    utils  = require('amd-utils'),
    path   = require('path'),
    interp = require('../lib/string/interpolate')
;

var task = {
    id         : 'scaffolding-file-rename',
    author     : 'Indigo United',
    name       : 'Scaffolding: file rename',
    description: 'Replace placeholders in file names',
    options    : {
        files: {
            description: 'The files to rename. Accepts an array of files or a single one through a string. Works with minimatch.'
        },
        data: {
            description: 'The data to be used while renaming. Keys are placeholders and values the content of each placeholder.'
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
                var files = utils.lang.isArray(opt.files) ? opt.files : [opt.files];

                // Do this in series, because it can give problems if the directories intersect eachother
                async.forEachSeries(files, function (file, next) {
                    glob(file, opt.glob, function (err, matches) {
                        if (err) {
                            return next(err);
                        }

                        // Grab the list of files to rename
                        // Note that we have walk the matches backwards
                        var x;
                        var filesToRename = [];
                        var before;
                        var after;

                        for (x = matches.length - 1; x >= 0; --x) {
                            before = path.basename(matches[x]);
                            after = interp(before, opt.data);

                            if (before !== after) {
                                filesToRename.push({ before: matches[x], after: path.dirname(matches[x]) + '/' + after });
                            }
                        }

                        // Foreach file found, rename it (has to be in series)
                        async.forEachSeries(filesToRename, function (obj, next) {
                            fs.rename(obj.before, obj.after, next);
                        }, next);
                    });
                }, next);
            }
        }
    ]
};

module.exports = task;