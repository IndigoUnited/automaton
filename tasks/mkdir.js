var mkdirp = require('mkdirp');

var task = {
    'id'     : 'mkdir',
    'author' : 'Indigo United',
    'name'   : 'Make dir recursively',
    'tasks'  :
    [
        {
            'task' : function (ctx, opt, next) {
                // TODO: validate required options
                // TODO: take into account the ctx.cwd

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
    ],
    'incompatibilities': []
};

module.exports = task;