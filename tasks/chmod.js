'use strict';

var fs    = require('fs');
var utils = require('mout');
var async = require('async');
var glob  = require('glob');

var task = {
    id          : 'chmod',
    author      : 'Indigo United',
    name        : 'Change mode',
    description : 'Change mode of a file or a set of files.',
    options: {
        files: {
            description: 'Which file to chmod. Accepts a filename and array of filenames. Also note that the filenames can be minimatch patterns.'
        },
        mode: {
            description: 'The mode to apply.',
            'default': '0777'
        },
        glob: {
            description: 'The options to pass to glob (check https://npmjs.org/package/glob for details).',
            'default': null
        }
    },
    filter: function (opt, ctx, next) {
        if (!utils.lang.isNumber(opt.mode)) {
            opt.mode = parseInt(opt.mode, 8);
        }
        next();
    },
    tasks:
    [
        {
            task: function (opt, ctx, next) {
                var files = utils.lang.isArray(opt.files) ? opt.files : [opt.files];
                var error;

                async.forEach(files, function (file, next) {
                    glob(file, opt.glob, function (err, files) {
                        if (err) {
                            return next(err);
                        }

                        if (!files.length) {
                            error = new Error('ENOENT, no such file or directory \'' + file + '\'');
                            error.code = 'ENOENT';
                            return next(error);
                        }

                        async.forEach(files, function (file, next) {
                            fs.chmod(file, opt.mode, next);
                        }, next);
                    });
                }, next);
            }
        }
    ]
};

module.exports = task;