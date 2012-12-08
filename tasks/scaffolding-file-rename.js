var fs     = require('fs'),
    glob   = require('glob'),
    async  = require('async'),
    utils  = require('amd-utils'),
    interp = require('../lib/interpolate')
;

var task = {
    id      : 'scaffolding-file-rename',
    author  : 'Indigo United',
    name    : 'Scaffolding: file rename',
    options : {
        dir: {
            description: 'The directory(ies) you want to to use as the base of the rename.'
        },
        data: {
            description: 'The data to be used while renaming. Keys are placeholders and values the content of each placeholder.'
        }
    },
    tasks   :
    [
        {
            task : function (opt, next) {
                var dirs = utils.lang.isArray(opt.dir) ? opt.dir : [opt.dir];

                // Do this in series, because it can give problems if the directories intersect eachother
                async.forEachSeries(dirs, function (dir, next) {
                    glob(opt.dir + '/**/*{{*}}*', function (err, matches) {
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