'use strict';

var fs     = require('fs'),
    glob   = require('glob'),
    async  = require('async'),
    utils  = require('amd-utils'),
    interp = require('../lib/string/interpolate')
;

var task = {
    id          : 'scaffolding-file-rename',
    author      : 'Indigo United',
    name        : 'Scaffolding: file rename',
    description : 'Replaces placeholders in a set of files.',
    options: {
        dirs: {
            description: 'From which dir to start looking for files with placeholders. Accepts a dir and array of dirs. Also note that the dirs can be minimatch patterns.'
        },
        data: {
            description: 'The data to be used while renaming. Keys are placeholder names and the values are the content for each placeholder.'
        },
        recursive: {
            description: 'For each dir passed in the dirs option, apply the rename recursively, finding matches in all the hierarchy.',
            'default': true
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
                var dirs = utils.lang.isArray(opt.dirs) ? opt.dirs : [opt.dirs];

                // Do this in series, because it can give problems if the directories intersect eachother
                async.forEachSeries(dirs, function (dir, next) {
                    glob(dir + (opt.recursive ? '/**/*{{*}}*' : '/*{{*}}*'), opt.glob, function (err, matches) {
                        if (err) {
                            return next(err);
                        }

                        // Grab the list of files to rename
                        var filesToRename = [];
                        matches.forEach(function (match) {
                            var before = match;
                            var after = interp(match, opt.data);

                            if (before !== after) {
                                matches.forEach(function (match, i) {
                                    matches[i] = match.replace(before, after);
                                });
                                filesToRename.push({ before: before, after: after });
                            }
                        });


                        // Foreach file found, rename it (has to be in series)
                        async.forEachSeries(filesToRename, function (obj, next) {
                            fs.rename(obj.before, obj.after, function (err) {
                                if (!err || err.code === 'ENOENT') {
                                    return next();
                                }
                                next(err);
                            });
                        }, next);
                    });
                }, next);
            }
        }
    ]
};

module.exports = task;