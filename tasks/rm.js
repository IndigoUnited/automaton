'use strict';

var rimraf = require('rimraf');
var utils  = require('amd-utils');
var async  = require('async');
var glob   = require('glob');

var task = {
    id          : 'rm',
    author      : 'Indigo United',
    name        : 'Remove',
    description : 'Remove file or set of files.',
    options: {
        files: {
            description: 'Which files should be removed. Accepts a filename and array of filenames. Also note that the filenames can be minimatch patterns.'
        },
        glob: {
            description: 'The options to pass to glob (check https://npmjs.org/package/glob for details).',
            'default': null
        }
    },
    tasks      :
    [
        {
            task: function (opt, ctx, next) {
                // TODO: optimize this with the expand function
                var files = utils.lang.isArray(opt.files) ? opt.files : [opt.files];

                async.forEach(files, function (file, next) {
                    glob(file, opt.glob, function (err, matches) {
                        if (err) {
                            return next(err);
                        }

                        async.forEach(matches, function (match, next) {
                            rimraf(match, next);
                        }, next);
                    });
                }, next);
            }
        }
    ]
};

module.exports = task;