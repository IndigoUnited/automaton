var mkdirp = require('mkdirp');
var fs     = require('fs');

var task = {
    'id'      : 'mkdir',
    'author'  : 'Indigo United',
    'name'    : 'Make dir recursively',
    'options' : {
        'dir': {
            'description': 'The directory you want to create'
        }
    },
    'tasks'   :
    [
        {
            'task' : function (opt, next) {
                fs.stat(opt.dir, function (err, stat) {
                    if (!err || err.code !== 'ENOENT') {
                        if (stat && !stat.isDirectory()) {
                            next(new Error('Passed dir already exists and is not a directory.'));
                        } else {
                            next(err);
                        }
                    }

                    mkdirp(opt.dir, function (err) {
                        if (err) {
                            next(err);
                        }
                        else {
                            next();
                        }
                    });
                });

            },
            description: 'make dir "{{dir}}"'
        }
    ]
};

module.exports = task;