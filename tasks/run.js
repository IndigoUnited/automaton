var spawn   = require('child_process').spawn,
    utils   = require('amd-utils')
;

var task = {
    id     : 'run',
    author : 'Indigo United',
    name   : 'Run command',
    options: {
        cmd: {
            description: 'What command to execute'
        },
        cwd: {
            description: 'Current working directory of the child process',
            'default': null
        }
    },
    tasks  :
    [
        {
            task : function (opt, next) {
                var child;

                if (process.platform === 'win32') {
                    child = spawn('cmd', ['/s', '/c', opt.cmd], { cwd: opt.cwd, customFds: [0, 1, 2] });
                } else {
                    child = spawn('sh', ['-c', opt.cmd], { cwd: opt.cwd, customFds: [0, 1, 2] });
                }

                var separator = '\n' + utils.string.repeat('-', 30) + '\n';
                console.log(separator, 'Running: '.info, opt.cmd, separator);

                child.stdout.on('data', function (data) {
                    process.stdout.write(data.toString());
                });

                child.stderr.on('data', function (data) {
                    process.stderr.write(data.toString());
                });

                child.on('exit', function (code) {
                    console.log(separator);
                    if (code === 0) {
                        return next();
                    }

                    next(new Error('Error running command: ' + opt.cmd));
                }.bind(this));
            }
        }
    ]
};

module.exports = task;