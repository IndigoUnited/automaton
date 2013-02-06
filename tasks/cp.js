'use strict';

var fstream = require('fstream');
var glob    = require('glob');
var async   = require('async');
var path    = require('path');
var fs      = require('fs');
var utils   = require('mout');
var mkdirp  = require('mkdirp');

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
            default: null
        }
    },
    tasks:
    [
        {
            task: function (opt, ctx, next) {
                opt.glob = opt.glob || {};
                var sources = Object.keys(opt.files);
                var error;

                // Cycle through each source
                // Note that series is used to avoid conflicts between each pattern
                async.forEachSeries(sources, function (pattern, next) {
                    var dsts = utils.lang.isArray(opt.files[pattern]) ? opt.files[pattern] : [opt.files[pattern]];
                    dsts = utils.array.unique(dsts.map(function (dst) { return path.normalize(dst); }));
                    pattern = path.normalize(pattern);

                    // Expand the files to get an array of files and directories
                    expand(pattern, opt.glob, function (err, files, dirs, directMatch) {
                        if (err) {
                            return next(err);
                        }

                        if (!files.length && !dirs.length) {
                            error = new Error('ENOENT, no such file or directory \'' + pattern + '\'');
                            error.code = 'ENOENT';
                            return next(error);
                        }

                        // Process the matches for each dst
                        async.forEach(dsts, function (dst, next) {
                            if (directMatch) {
                                processDirectMatch(files, dirs, dst, ctx, next);
                            } else {
                                processPatternMatch(pattern, files, dirs, dst, ctx, next);
                            }
                        }, next);
                    });
                }, next);
            }
        }
    ]
};

/**
 * Processes a direct match.
 *
 * @param {Array}    files The files
 * @param {Array}    dirs  The directories
 * @param {String}   dst   The destination
 * @param {Object}   ctx   The context
 * @param {Function} next  The callback to call with the files and folders (follows node conventions)
 */
function processDirectMatch(files, dirs, dst, ctx, next) {
    var src = files[0] || dirs[0];
    var srcType = files[0] === src ? 'file' : 'dir';
    var dstType;
    var error;

    // Check if dirname of the dst exists
    fs.stat(path.dirname(dst), function (err) {
        if (err) {
            return next(err);
        }

        // Dst is a folder if:
        //  - if exists and is a folder
        //  - ends with /
        fs.stat(dst, function (err, stat) {
            if (stat) {
                dstType = stat.isFile() ? 'file' : 'dir';
            } else {
                dstType = /[\/\\]$/.test(dst) ? 'dir' : srcType;
            }

            // Check if copy is possible
            if (srcType === 'dir' && dstType === 'file') {
                error = new Error('ENODIR, not a directory: \'' + dst + '\'');
                error.code = 'ENODIR';
                return next(error);
            }

            // Folder to folder
            if (srcType === 'dir' && dstType === 'dir') {
                // When copying to a folder that already exists
                // or ends with a /, the user is trying to copy the folder
                // inside it
                if (stat || /[\/\\]$/.test(dst)) {
                    dst = path.join(dst, path.basename(src));
                }

                mkdirp(dst, function (err) {
                    if (err) {
                        return err;
                    }

                    copyDir(src, dst, ctx, next);
                });
            // File to folder
            } else if (srcType === 'file' && dstType === 'dir') {
                // If copying file to dir, ensure that the dir is created
                // and perform a file to file copy afterwards
                if (!stat) {
                    fs.mkdir(dst, function (err) {
                        if (err) {
                            return err;
                        }

                        dst = path.join(dst, path.basename(src));
                        copyFile(src, dst, ctx, next);
                    });
                } else {
                    dst = path.join(dst, path.basename(src));
                    copyFile(src, dst, ctx, next);
                }
            // File to file is simple
            } else {
                copyFile(src, dst, ctx, next);
            }
        });
    });
}

/**
 * Processes a pattern match.
 *
 * @param {String}   pattern The pattern
 * @param {Array}    files   The files
 * @param {Array}    dirs    The directories
 * @param {String}   dst     The destination
 * @param {Object}   ctx     The context
 * @param {Function} next    The callback to call with the files and folders (follows node conventions)
 */
function processPatternMatch(pattern, files, dirs, dst, ctx, next) {
    // TODO: avoid doing mkdirp for each file
    async.forEachLimit(files, 30, function (file, next) {
        var currDst = path.join(dst, relativePath(file, pattern));

        mkdirp(path.dirname(currDst), function (err) {
            if (err) {
                return next(err);
            }

            copyFile(file, currDst, ctx, next);
        });
    }, function (err) {
        if (err) {
            throw err;
        }

        async.forEachLimit(dirs, 30, function (dir, next) {
            var currDst = path.join(dst, relativePath(dir, pattern));

            mkdirp(currDst, function (err) {
                if (err) {
                    return next(err);
                }

                copyDir(dir, currDst, ctx, next);
            });
        }, next);
    });
}

/**
 * Copies a file asynchronously.
 *
 * @param {String}   src  The source
 * @param {String}   dst  The destination
 * @param {Object}   ctx  The context
 * @param {Function} next The function to call when done (follows node conventions)
 */
function copyFile(src, dst, ctx, next) {
    ctx.log.debugln('Copying file ' + src + ' to ' + dst);

    var stream = fs.createReadStream(src)
        .pipe(fs.createWriteStream(dst))
        .on('close', next)
        .on('error', function (err) {
            stream.removeAllListeners();
            next(err);
        });
}

/**
 * Copies a directory asynchronously.
 *
 * @param {String}   src  The source
 * @param {String}   dst  The destination
 * @param {Object}   ctx  The context
 * @param {Function} next The function to call when done (follows node conventions)
 */
function copyDir(src, dst, ctx, next) {
    ctx.log.debugln('Copying directory ' + src + ' to ' + dst);

    var stream = fstream.Reader({
            path: src,
            follow: true
        }).pipe(
            fstream.Writer({
                type: 'Directory',
                path: dst
            })
        );

    stream
        .on('close', next)
        .on('error', function (err) {
            stream.removeAllListeners();
            next(err);
        });
}

/**
 * Expands the given minimatch pattern to an array of files and an array of dirs.
 * The dirs are guaranteed to not overlap files.
 *
 * @param {String}   pattern The pattern
 * @param {Object}   options The options to pass to the glob
 * @param {Function} next    The callback to call with the files and folders (follows node conventions)
 */
function expand(pattern, options, next) {
    var files = [];
    var dirs = [];
    var hasGlobStar = false;
    var hasStar = pattern.indexOf('*') !== -1;
    var lastMatch = '';

    options = options || {};

    // Check if ** pattern was used
    if (!options.glob || !options.glob.noglobstar) {
        hasGlobStar = pattern.indexOf('**') !== -1;
    }

    // Expand with glob
    options.mark = true;
    glob(pattern, options, function (err, matches) {
        if (err) {
            return next(err);
        }

        matches.forEach(function (match) {
            var isFile = !/[\/\\]$/.test(match);

            if (isFile) {
                lastMatch = match;
                files.push(lastMatch);
            } else if (!hasStar || hasGlobStar) {
                lastMatch = match.replace(/[\/\\]+$/, '');
                dirs.push(lastMatch);
            }
        });

        // If we only got one match and it was the same as the original pattern,
        // then it was a direct match
        // If we only got one match and it was the same as the original pattern,
        // then it was a direct match
        pattern = path.normalize(pattern).replace(/[\/\\]+$/, '');
        lastMatch = path.normalize(lastMatch).replace(/[\/\\]+$/, '');

        var directMatch = matches.length === 1 && lastMatch === pattern;
        if (!directMatch) {
            cleanup(files, dirs);
        }

        next(null, files, dirs, directMatch);
    });
}

/**
 * Takes an array of files and folders and takes care of overlapping.
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
    file = path.normalize(file);

    for (x = 0; x < length; ++x) {
        if (file[x] !== pattern[x]) {
            return file.substr(x);
        }
    }

    return path.basename(file);
}

module.exports = task;
