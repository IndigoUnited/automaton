var fs        = require('fs'),
    glob      = require('glob'),
    async     = require('async'),
    stringLib = require('../lib/string')
;

var task = {
    id      : 'scaffolding-file-rename',
    author  : 'Indigo United',
    name    : 'Scaffolding: file rename',
    options : {
        dir: {
            description: 'The directory you want to to use as the base of the rename.'
        },
        data: {
            description: 'The data to be used while renaming. Keys are placeholders and values the content of each placeholder.'
        }
    },
    tasks   :
    [
        {
            task : function (opt, next) {
                glob(opt.dir + '/**/*{{*}}*', function (err, matches) {
                    if (err) {
                        return next(err);
                    }

                    // Grab the list of files to rename
                    var filesToRename = [];
                    matches.forEach(function (match) {
                        var before = match;
                        var after = stringLib.interpolate(match, opt.data);

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
                                next();
                            } else {
                                next(err);
                            }
                        });
                    }, next);
                });
            }
        }
    ]
};

module.exports = task;