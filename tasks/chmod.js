var fs = require('fs');
var utils = require('amd-utils');
var async = require('async');
var glob  = require('glob');

var task = {
    id         : 'chmod',
    author     : 'Indigo United',
    name       : 'Change mode',
    description: 'Chmod files',
    options    : {
        files: {
            description: 'The files to chmod. Accepts an array of files or a single one through a string. Works with minimatch.'
        },
        mode: {
            description: 'The mode',
            'default': parseInt('0777', 8)
        },
        glob: {
            description: 'The options to pass to glob (please look the available options in the glob package README)',
            'default': {
                dot: true
            }
        }
    },
    filter     : function (opt, next) {
        if (!utils.lang.isNumber(opt.mode)) {
            opt.mode = parseInt(opt.mode, 8);
        }
        next();
    },
    tasks      :
    [
        {
            task: function (opt, next) {
                var files = utils.lang.isArray(opt.files) ? opt.files : [opt.files];

                async.forEach(files, function (file, next) {
                    glob(file, opt.glob, function (err, files) {
                        if (err) {
                            return next(err);
                        }

                        async.forEach(files, function (file, next) {
                            // TODO: give better error messages if file does not exist
                            fs.chmod(file, opt.mode, next);
                        }, next);
                    });
                }, next);
            }
        }
    ]
};

module.exports = task;