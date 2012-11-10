var exec   = require('child_process').exec,
    colors = require('colors');

var task = {
    'id'      : 'run',
    'author'  : 'Indigo United',
    'name'    : 'Run command',
    'options' : {
        'cmd': {
            'description': 'What command to execute'
        },
        'cwd': {
            'description': 'Current working directory of the child process',
            'default': null
        }
    },
    'tasks'   :
    [
        {
            'task' : function (opt, next) {
                // TODO: replace with spawn
                exec(opt.cmd, { 'cwd': opt.cwd, stdio: ['pipe', 'pipe', 'pipe'] }, function (error, stdout, stderr) {
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