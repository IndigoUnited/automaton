var mkdirp = require('mkdirp');

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
            'task' : function (ctx, opt, next) {
                // TODO: take into account the ctx.cwd
console.log('mkdir opts', opt);
                mkdirp(opt.dir, function (err) {
                    if (err) {
                        next(err);
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