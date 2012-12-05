var fs        = require('fs'),
    utils     = require('amd-utils'),
    glob      = require('glob'),
    async     = require('async')
;

var task = {
    'id'      : 'scaffolding-file-rename',
    'author'  : 'Indigo United',
    'name'    : 'Scaffolding: file rename',
    'options' : {
        'what': {
            'description': 'What you want to replace. Note that you can specify a file in the form filename:placeholder, or just ommit the placeholder'
        },
        'with': {
            'description': 'What you want to replace it with'
        },
        'dir': {
            'description': 'The directory you want to to use as the base of the rename.',
            'default': ''
        }
    },
    'tasks'   :
    [
        {
            'task' : function (opt, next) {
                var dir = utils.lang.isArray(opt.dir) ? opt.dir : [opt.dir];
                var replacements = {};
                replacements[opt.what] = opt['with'];

                // Foreach directory, get all the files
                async.forEach(dir, function (dir, next) {
                    glob(opt.dir + '/**/*{{' + opt.what + '}}*', function (err, matches) {
                        if (err) {
                            return next(err);
                        }

                        // Grab the list of files to rename
                        var filesToRename = [];
                        matches.forEach(function (match) {
                            var before = match;
                            var after = utils.string.interpolate(match, replacements);

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
                }, next);
            }
        }
    ]
};

module.exports = task;