var rimraf = require('rimraf');
var utils  = require('amd-utils');
var async  = require('async');
var glob   = require('glob');

var task = {
    id     : 'rm',
    author : 'Indigo United',
    name   : 'Remove',
    options: {
        files: {
            description: 'The files or directories to remove. Accepts an array of entries or a single one through a string. Works with minimatch.'
        },
        glob: {
            description: 'The options to pass to glob (please look the available options in the glob package README)',
            'default': null
        }
    },
    tasks  :
    [
        {
            task: function (opt, next) {
                var files = utils.lang.isArray(opt.files) ? opt.files : [opt.files];

                async.forEach(files, function (file, next) {
                    glob(file, opt.glob, function (err, files) {
                        if (err) {
                            return next(err);
                        }

                        async.forEach(files, function (file) {
                            rimraf(file, next);
                        }, next);
                    });
                }, next);
            }
        }
    ]
};

module.exports = task;