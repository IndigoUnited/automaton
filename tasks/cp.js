var cpr = require('cpr');

var task = {
    'id'      : 'cp',
    'author'  : 'Indigo United',
    'name'    : 'Copy',
    'options' : {
        'src': {
            'description': 'What should be copied'
        },
        'dst': {
            'description': 'Destination of the copy'
        },
        'mkdir': {
            'description': 'If parent folder of the destination does not exist, create it',
            'default': true
        }
    },
    'tasks'  :
    [
        {
            'task' : function (ctx, opt, next) {
                // TODO: check if src exists

                // TODO: check if dst parent folder exists, and create if not

                cpr(opt.src, opt.dst, {
                    deleteFirst: false, // delete destination before
                    overwrite: true,    // if the file exists, overwrite it
                    confirm: true       // after the copy, stat all the copied files to make sure they are there
                }, function(errs, files) {
                    if (errs) {
                        next(errs);
                    }
                    else {
                        next();
                    }
                });
            }
        }
    ]
};

module.exports = task;