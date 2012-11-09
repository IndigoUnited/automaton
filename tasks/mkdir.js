var mkdirp = require('mkdirp');
var path   = require('path');

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
                var dir = path.resolve(ctx.cwd, opt.dir);

                mkdirp(dir, function (err) {
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