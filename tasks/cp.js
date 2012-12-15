var fs      = require('fs');
var fstream = require('fstream');
var glob    = require('glob');
var async   = require('async');
var path    = require('path');
var rimraf  = require('rimraf');

var task = {
    id      : 'cp',
    author  : 'Indigo United',
    name    : 'Copy',
    options : {
        files: {
            description: 'The files to copy. Accepts an object in which keys are the source files and values the destination. Source values support minimatch.'
        },
        glob: {
            description: 'The options to pass to glob (please look the available options in the glob package README)',
            'default': null
        }
    },
    tasks  :
    [
        {
            task : function (opt, next) {
                var sources = Object.keys(opt.files);

                // TODO: support array of dest

                // Foreach source file..
                // Note that series is used to avoid conflicts between each pattern
                async.forEachSeries(sources, function (src, next) {
                    var dst = opt.files[src];
                    src = path.normalize(src);

                    // Expand the files to get an array of files and directories
                    // The files do not overlap directories and directories do not overlay eachother
                    expand(src, opt.glob, function (err, files, dirs, directMatch) {
                        // If the source pattern was a direct match
                        if (directMatch) {
                            // If the source is directory
                            // or a file which dst ends with /, concatenate the source basename.
                            if (dirs.length || /[\/\\]$/.test(dst)) {
                                dst = dst + path.basename(files[0]);
                            }

                            // Copy it directly
                            return copy(files[0], dst, 'File', next);
                        }

                        // Create a batch of files and folders
                        var batch = files.map(function (file) {
                            return { src: file, type: 'File' };
                        });
                        batch.push.apply(batch, dirs.map(function (dir) {
                            return { src: dir, type: 'Directory' };
                        }));

                        // Finally copy everything
                        async.forEach(batch, function (obj, next) {
                            var dst = path.join(opt.files[src], getRelativePath(obj.src, src));
                            copy(obj.src, dst, obj.type, function () {
                                // Remove dot files from the directory if the dot option is set to false
                                if (obj.type === 'Directory' && (!opt.glob || !opt.glob.dot)) {
                                    removeDotfiles(dst, next);
                                } else {
                                    next();
                                }
                            });
                        }, next);
                    });
                }, next);
            }
        }
    ]
};

/**
 * Removes dotfiles from a directory
 *
 * @param {String}   dir  The dir
 * @param {Function} next The callback to call when done (follows the node convention)
 */
function removeDotfiles(dir, callback) {
    dir = path.normalize(dir);

    glob(dir + '/**/.*', function (err, dotFiles) {
        if (err) {
            return callback(err);
        }

        async.forEach(dotFiles, function (dotFile, next) {
            rimraf(dotFile, next);
        }, callback);
    });
}

/**
 * Expands the given minimatch pattern to an array if files and an array of dirs.
 * The files are guaranteed to not overlap with the folders.
 * The dirs are guaranteed to not overlap eachother.
 *
 * @param {String}   pattern   The pattern
 * @param {Object}   minimatch The options to pass to the minimatch
 * @param {Function} callback  The callback to call with the files and folders (follows node conventions)
 */
function expand(pattern, options, next) {
    var files = [];
    var dirs = [];

    glob(pattern, options, function (err, matches) {
        if (err) {
            return next(err);
        }

        async.forEach(matches, function (match, next) {
            fs.stat(match, function (err, stat) {
                if (err) {
                    return next(err);
                }

                match = path.normalize(match);

                if (stat.isDirectory()) {
                    dirs.push(match);
                } else {
                    files.push(match);
                }

                next();
            });
        }, function (err) {
            if (err) {
                return next(err);
            }

            // If we only got one match and it was the same as the original pattern,
            // then it was a direct match
            var directMatch = matches.length === 1 && matches[0] === pattern;

            cleanup(files, dirs);
            next(null, files, dirs, directMatch);
        });
    });
}

/**
 * Takes an array of files and folders and removes overlapping ones.
 * See the expand function for more info.
 *
 * @param {Array} files The array of files
 * @param {Array} dirs  The array of dirs
 */
function cleanup(files, dirs) {
    var x, y;

    // Cleanup files that overlap dirs
    dirs.forEach(function (dir) {
        for (x = files.length - 1; x >= 0; --x) {
            if (path.dirname(files[x]).indexOf(dir) !== -1) {
                files.splice(x, 1);
            }
        }
    });

    // Sort dirs, from lower path to higher path size
    dirs.sort(function (first, second) {
        var firstLength = first.length;
        var secondLength = second.length;

        if (firstLength > secondLength) {
            return 1;
        }
        if (firstLength < secondLength) {
            return -1;
        }

        return 0;
    });

    // Cleanup dirs that overlap eachother
    for (x = 0; x < dirs.length; ++x) {
        for (y = x + 1; y < dirs.length; ++y) {
            if (dirs[y].indexOf(dirs[x]) === 0) {
                dirs.splice(y, 1);
                --x;
                --y;
            }
        }
    }
}

/**
 * Gets the relative path of a file relative to the pattern.
 * For instance:
 *   file = /a/b.js
 *   pattern = /a/*
 *
 * Should return b.js
 *
 * @param {String} file    The file
 * @param {String} pattern The pattern
 *
 * @return {String} The relative path
 */
function getRelativePath(file, pattern) {
    var length = file.length,
        x;

    for (x = 0; x < length; ++x) {
        if (file[x] !== pattern[x]) {
            return file.substr(x);
        }
    }

    return path.basename(file);
}

/**
 * Copies src to dst asynchronously.
 *
 * @param {String}   src      The source
 * @param {String}   dst      The destination
 * @param {String}   type     The type of the source ('File' or 'Directory')
 * @param {Function} callback The function to call when done (follows node conventions)
 */
function copy(src, dst, type, callback) {
    var reader = fstream.Reader(src).pipe(
        fstream.Writer({
            type: type,
            path: dst
        })
    );

    reader.on('end', callback);
    reader.on('error', callback);
}

module.exports = task;