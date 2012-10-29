var cpr = require('cpr');

var task = {
    'id'     : 'cp',
    'author' : 'Indigo United',
    'name'   : 'Copy',
    'tasks'  :
    [
        {
            'task' : function (ctx, opt, next) {
                // TODO: validate required options
                // TODO: take into account the ctx.cwd

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
    ],
    'incompatibilities': []
};

module.exports = task;