var mkdirp = require('mkdirp');

var task = {
    'id'      : 'mkdir',
    'author'  : 'Indigo United',
    'name'    : 'Make dir recursively',
    'options' : {
        'dir': {
            'description': 'The directory you want to create', // description is not mandatory, but helps task readibility
            'filter': function (v) {
                return v + '. now that is cool!!';
            }
        }
    },
    'tasks'   :
    [
        {
            'task' : function (ctx, opt, next) {
                // TODO: validate required options
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