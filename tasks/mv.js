/*jshint regexp:false*/

var fs           = require('fs');
var async        = require('async');
var path         = require('path');
var utils        = require('amd-utils');
var expand       = require('./cp').expand;
var relativePath = require('./cp').relativePath;

var task = {
    id         : 'mv',
    author     : 'Indigo United',
    name       : 'Copy',
    description: 'Move files',
    options    : {
        files: {
            description: 'The files to copy. Accepts an object in which keys are the source files and values the destination. Source values support minimatch.'
        },
        glob: {
            description: 'The options to pass to glob (please look the available options in the glob package README)',
            'default': {
                dot: true
            }
        }
    },
    tasks      :
    [
        {
            task: function (opt, next) {
                // TODO: standardize behavior with unix mv
                //       - If dst does not exist, give error
                //       - Moving a directory into a file should give error
                //       - Moving a directory/file, into another directory that exists
                //         but does not end with a /, it should act like it did
                //       - Moving a file into a file is obvious
                opt.glob = opt.glob || {};
                var sources = Object.keys(opt.files);

                // Foreach source file..
                // Note that series is used to avoid conflicts between each pattern
                async.forEachSeries(sources, function (pattern, next) {
                    var dsts = utils.lang.isArray(opt.files[pattern]) ? opt.files[pattern] : [opt.files[pattern]];
                    dsts = utils.array.unique(dsts.map(function (dst) { return path.normalize(dst); }));

                    // If the user specified a /**/* pattern, optimize it
                    if (!opt.glob || !opt.glob.noglobstar) {
                        pattern = pattern.replace(/(\/\*\*\/\*)+$/g, '/*');
                    }

                    // Expand the files to get an array of files and directories
                    // The files do not overlap directories and directories do not overlay eachother
                    expand(pattern, opt.glob, function (err, files, dirs, directMatch) {
                        // If the source pattern was a direct match
                        // Move directly to the dests
                        if (directMatch) {
                            return async.forEach(dsts, function (dst, next) {
                                var src = dirs[0] || files[0];
                                // If the source is a directory
                                // or a file which dst ends with /, concatenate the source basename.
                                if (/[\/\\]$/.test(dst)) {
                                    dst = path.join(dst, path.basename(src));
                                }

                                return fs.rename(src, dst, next);
                            }, next);
                        }

                        // Create a batch of files and folders
                        var batch = [],
                            cache;

                        batch.push.apply(batch, files);
                        batch.push.apply(batch, dirs);

                        // Analyze the structure of the source entries,
                        // generating a cache of stat's
                        cache = analyzeStructure(batch, pattern, null, function (err) {
                            if (err) {
                                return next(err);
                            }

                            // For each dst, replicate the structure before actually proceed to the rename
                            async.forEach(dsts, function (dst, next) {
                                replicateStructure(dst, cache, pattern, function (err) {
                                    if (err) {
                                        return next(err);
                                    }

                                    // Rename everything
                                    async.forEach(batch, function (src, next) {
                                        var finalDst = path.join(dst, relativePath(src, pattern));
                                        fs.rename(src, finalDst, next);
                                    }, next);
                                });
                            }, next);
                        });
                    });
                }, next);
            }
        }
    ]
};

/**
 * Analyzes the structure of an array of files,
 * generating a stat cache (mode only) for each subpath found.
 *
 * @param {Array}    files    The files
 * @param {String}   pattern  The original path used in glob
 * @param {Object}   [cache]  The cache to be used, will create one if not specified.
 * @param {Function} callback The function to call when done, following the node convetion
 *
 * @return {Object}  The cache object
 */
function analyzeStructure(files, pattern, cache, callback) {
    cache = cache || {};

    if (!files.length) {
        return callback();
    }

    // Extract the base path
    var currPath = files[0],
        length = currPath.length,
        basePath,
        x,
        remaining = [];


    for (x = 0; x < length; ++x) {
        if (currPath[x] !== pattern[x]) {
            basePath = path.normalize(currPath.substr(0, x)).replace(/[\/\\]+$/, '');
            break;
        }
    }

    // Then, find paths that have not being stated yet
    length = files.length;
    for (x = 0; x < length; x++) {
        currPath = files[x];

        while ((currPath = path.dirname(currPath)) && currPath !== basePath) {
            if (cache[currPath]) {
                break;
            } else {
                cache[currPath] = -1;
                remaining.push(currPath);
            }
        }
    }

    // Finally, stat them and add them to the cache
    async.forEachSeries(remaining, function (entry, next) {
        var parts = entry.split(path.sep),
            partsLength = parts.length,
            i = 1;

        async.until(function () { return i > partsLength; }, function (next) {
            var curr = path.join.apply(path, parts.slice(0, i));
            ++i;

            if (cache[curr] !== -1) {
                return next();
            }

            cache[curr] = true;
            fs.stat(curr, function (err, stat) {
                if (err) {
                    return next(err);
                }

                cache[curr] = stat.mode;
                next();
            });
        }, next);
    }, callback);

    return cache;
}

/**
 * Replicates the structure present in the cache into dst.
 *
 * @param {String}   dst      The dst path
 * @param {String}   pattern  The original path used in glob
 * @param {Object}   cache    The cache.
 * @param {Function} callback The function to call when done, following the node convetion
 */
function replicateStructure(dst, pattern, cache, callback) {
    var basePathPos = 0,
        paths = Object.keys(cache),
        currPath,
        length,
        x;

    if (!paths.length) {
        return callback();
    }

    // Find the base path pos
    pattern = path.normalize(pattern);
    currPath = paths[0];
    length = currPath.length;
    for (x = 0; x < length; ++x) {
        if (currPath[x] !== pattern[x]) {
            basePathPos = x;
            break;
        }
    }

    // Order the paths from small to large
    paths.sort(sortFunc);

    // For each path in the cache, create the correspondent directory
    // in the dst, respecting the mode stored in the cache
    length = paths.length;
    async.forEachSeries(paths, function (currPath, next) {
        var dstPath = path.join(dst, currPath.substr(basePathPos));
        fs.mkdir(dstPath, cache[currPath], next);
    }, callback);
}

/**
 * Sort function used in the replicate structure.
 */
function sortFunc(first, second) {
    var firstLength = first.length;
    var secondLength = second.length;

    if (firstLength > secondLength) {
        return 1;
    }
    if (firstLength < secondLength) {
        return -1;
    }

    return 0;
}

module.exports = task;