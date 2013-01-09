'use strict';

var fstream = require('fstream');
var glob    = require('glob');
var async   = require('async');
var path    = require('path');
var fs      = require('fs');
var utils   = require('amd-utils');

var task = {
    id          : 'cp',
    author      : 'Indigo United',
    name        : 'Copy',
    description : 'Copy a file or set of files.',
    options: {
        files: {
            description: 'Which files should be copied. Accepts an object in which keys are the source files and values the destination. Source values support minimatch.'
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
                // TODO: standardize behavior with unix cp
                //       - If dst does not exist, give error
                //       - Copying a directory into a file should give error
                //       - Copying a directory/file, into another directory that exists
                //         but does not end with a /, it should act like it did
                //       - Copying a file into a file is obvious
                opt.glob = opt.glob || {};
                var sources = Object.keys(opt.files);

                // Foreach source file..
                // Note that series is used to avoid conflicts between each pattern
                async.forEachSeries(sources, function (pattern, next) {
                    var dsts = utils.lang.isArray(opt.files[pattern]) ? opt.files[pattern] : [opt.files[pattern]];
                    dsts = utils.array.unique(dsts.map(function (dst) { return path.normalize(dst); }));

                    // Expand the files to get an array of files and directories
                    // The files do not overlap directories and directories do not overlay eachother
                    expand(pattern, opt.glob, function (err, files, dirs, directMatch) {
                        var src,
                            isFile;

                        if (err) {
                            return next(err);
                        }

                        // If the source pattern was a direct match
                        // Copy directly to the dests
                        if (directMatch) {
                            src = dirs[0] || files[0];
                            isFile = src === files[0];

                            return async.forEach(dsts, function (dst, next) {
                                // If the source is a directory
                                // or a file which dst ends with /, concatenate the source basename.
                                if (/[\/\\]$/.test(dst)) {
                                    dst = path.join(dst, path.basename(src));
                                }

                                return copy(src, dst, isFile ? 'File': 'Directory', next);
                            }, next);
                        }

                        // Create a batch of files and folders
                        var batch = files.map(function (file) {
                            return { src: file, type: 'File' };
                        });
                        batch.push.apply(batch, dirs.map(function (dir) {
                            return { src: dir, type: 'Directory' };
                        }));

                        // Finally copy everything
                        // Series is used to prevent strange things from happening
                        async.forEachSeries(batch, function (obj, next) {
                            async.forEach(dsts, function (dst, next) {
                                dst = path.join(dst, relativePath(obj.src, pattern));
                                copy(obj.src, dst, obj.type, next);
                            }, next);
                        }, next);
                    });
                }, next);
            }
        }
    ]
};

/**
 * Expands the given minimatch pattern to an array of files and an array of dirs.
 * The files are guaranteed to not overlap with the folders.
 * The dirs are guaranteed to not overlap eachother.
 *
 * @param {String}   pattern   The pattern
 * @param {Object}   [options] The options to pass to the glob
 * @param {Function} callback  The callback to call with the files and folders (follows node conventions)
 */
function expand(pattern, options, next) {
    var files = [];
    var dirs = [];
    var hasGlobStar = false;
    var hasStar = pattern.indexOf('*') !== -1;
    var lastMatch;

    options = options || {};

    // TODO: throw an error on commas

    // Check if ** pattern was used
    if (!options.glob || !options.glob.noglobstar) {
        hasGlobStar = pattern.indexOf('**') !== -1;
    }

    // Mark option is bugged for single * patterns
    // See: https://github.com/isaacs/node-glob/issues/50
    // For now we stat ourselves
    //options.mark = true;
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

                if (stat.isFile()) {
                    lastMatch = match;
                    files.push(lastMatch);
                } else if (!hasStar || hasGlobStar) {
                    lastMatch = match.replace(/[\/\\]+$/, '');
                    dirs.push(path.normalize(lastMatch));
                }

                next();
            });
        }, function (err) {
            if (err) {
                return next(err);
            }

            // If we only got one match and it was the same as the original pattern,
            // then it was a direct match
            var directMatch = matches.length === 1 && lastMatch === path.normalize(pattern).replace(/[\/\\]+$/, '');
            if (!directMatch) {
                cleanup(files, dirs);
            }

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

    // Cleanup dirs that overlap files
    for (x = 0; x < dirs.length; ++x) {
        for (y = files.length - 1; y >= 0; --y) {
            if (files[y].indexOf(dirs[x]) === 0) {
                dirs.splice(x, 1);
                --x;
                break;
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
function relativePath(file, pattern) {
    var length = file.length,
        x;

    pattern = path.normalize(pattern);

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
    var reader = fstream.Reader({
        path: src,
        follow: true
    }).pipe(
        fstream.Writer({
            type: type,
            path: dst
        })
    );

    reader.on('end', callback);
    reader.on('error', callback);
}

module.exports = task;
module.exports.expand = expand;
module.exports.relativePath = relativePath;