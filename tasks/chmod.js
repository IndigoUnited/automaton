var fs = require('fs');
var utils = require('amd-utils');
var async = require('async');
var glob  = require('glob');

var task = {
    id     : 'chmod',
    author : 'Indigo United',
    name   : 'Change mode',
    options: {
        file: {
            description: 'The file(s) to chmod'
        },
        mode: {
            description: 'The mode',
            'default': parseInt('0777', 8)
        }
    },
    filter: function (opt, next) {
        if (!utils.lang.isNumber(opt.mode)) {
            opt.mode = parseInt(opt.mode, 8);
        }
        next();
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
                            fs.chmod(file, opt.mode, next);
                        }, next);
                    });
                }, next);
            }
        }
    ]
};

module.exports = task;