var rimraf = require('rimraf');
var utils  = require('amd-utils');
var async  = require('async');
var glob   = require('glob');

var task = {
    id     : 'rm',
    author : 'Indigo United',
    name   : 'Remove',
    options: {
        file: {
            description: 'The file(s) to remove'
        }
    },
    tasks  :
    [
        {
            task : function (opt, next) {
                var files = utils.lang.isArray(opt.file) ? opt.file : [opt.file];

                async.forEach(files, function (file, next) {
                    glob(file, function (err, files) {
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