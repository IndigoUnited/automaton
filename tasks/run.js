var spawn   = require('child_process').spawn,
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
                // TODO: add support for windows
                var child = spawn('/bin/sh', ['-c', opt.cmd], { 'cwd': opt.cwd });

                child.stdout.on('data', function (data) {
                    console.log(data.toString());
                });

                child.stderr.on('data', function (data) {
                    console.log(data.toString().error);
                });

                child.on('exit', function (code) {
                    console.log('child process exited with code ' + code);

                    if (code === 0) {
                        next();
                    }
                    else {
                        next(new Error('Error running command: ' + opt.cmd));
                    }
                }.bind(this));

/*                exec(opt.cmd, { 'cwd': opt.cwd, stdio: ['pipe', 'pipe', 'pipe'] }, function (error, stdout, stderr) {
                    if (error) {
                        console.log(stderr.error);
                        return next(error);
                    }

                    console.log(stdout.info);

                    next();
                });
*/
            }
        }
    ]
};

module.exports = task;