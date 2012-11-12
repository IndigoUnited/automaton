var cpr    = require('cpr').cpr;
var fs     = require('fs');
var mkdirp = require('mkdirp');


function copy(src, dst, next) {
    cpr(src, dst, {
        deleteFirst: false, // delete destination before
        overwrite: true,    // if the file exists, overwrite it
        confirm: true       // after the copy, stat all the copied files to make sure they are there
    }, function (errs) {
        if (errs) {
            next(errs);
        }
        else {
            next();
        }
    });
}

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
            'task' : function (opt, next) {
                // Check if folder exists
                fs.stat(opt.src, function (error) {
                    if (error && error.code === 'ENOENT') {
                        next(error);
                    }
//console.log('cp', opt);
                    // Create dst folder
                    if (opt.mkdir) {
                        mkdirp(opt.dst, function (error) {
                            if (error) {
                                next(error);
                            }

                            // Finally execute the recursive copy
                            copy(opt.src, opt.dst, next);
                        });
                    } else {
                        copy(opt.src, opt.dst, next);
                    }
                });
            }
        }
    ]
};

module.exports = task;