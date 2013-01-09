'use strict';

var fs     = require('fs'),
    glob   = require('glob'),
    async  = require('async'),
    utils  = require('amd-utils'),
    path   = require('path'),
    interp = require('../lib/string/interpolate')
;

var task = {
    id          : 'scaffolding-file-rename',
    author      : 'Indigo United',
    name        : 'Scaffolding: file rename',
    description : 'Replaces placeholders in a set of files.',
    options: {
        files: {
            description: 'From which dir to start looking for files with placeholders. Accepts a dir and array of dirs. Also note that the dirs can be minimatch patterns.'
        },
        data: {
            description: 'The data to be used while renaming. Keys are placeholder names and the values are the content for each placeholder.'
        },
        glob: {
            description: 'The options to pass to glob (check https://npmjs.org/package/glob for details).',
            'default': null
        }
    },
    tasks:
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
                        // Note that matches must be traversed backwards
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