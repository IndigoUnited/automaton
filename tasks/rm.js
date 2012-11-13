var rimraf = require('rimraf');

var task = {
    'id'     : 'rm',
    'author' : 'Indigo United',
    'name'   : 'Remove',
    'options' : {
        'file': {
            'description': 'The file or directory you want to remove'
        }
    },
    'tasks'  :
    [
        {
            'task' : function (opt, next) {
                rimraf(opt.file, function (err) {
                    if (err) {
                        next(err);
                    } else {
                        next();
                    }
                });
            }
        }
    ]
};

module.exports = task;