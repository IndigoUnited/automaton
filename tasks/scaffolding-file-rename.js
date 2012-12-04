var fs        = require('fs'),
    utils     = require('amd-utils'),
    path      = require('path'),
    glob      = require('glob')
;

var task = {
    'id'      : 'scaffolding-file-rename',
    'author'  : 'Indigo United',
    'name'    : 'Scaffolding: file rename',
    'options' : {
        'dir': {
            'description': 'The directory you want to to use as the base of the rename',
            'default': ''
        }
    },
    'tasks'   :
    [
        {
            'task' : function (opt, next) {
                glob(opt.dir + '/**/*', function (err, files) {
                    if (err) {
                        return next(err);
                    }

                    next();
                });
            }
        }
    ]
};

module.exports = task;