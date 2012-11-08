var exec   = require('child_process').exec,
    colors = require('colors');

var task = {
    'id'      : 'exec',
    'author'  : 'Indigo United',
    'name'    : 'Execute',
    'options' : {
        'cmd': {
            'description': 'What command to execute'
        }
    },
    'tasks'   :
    [
        {
            'task' : function (ctx, opt, next) {
                exec(opt.cmd, { cwd: ctx.cwd }, function (error, stdout, stderr) {
                    if (error) {
                        console.log(stderr.error);
                        return next(error);
                    }

                    console.log(stdout.info);

                    next();
                });
            }
        }
    ]
};

module.exports = task;