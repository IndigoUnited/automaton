var spawn = require('child_process').spawn;

var task = {
    id         : 'run',
    author     : 'Indigo United',
    name       : 'Run',
    description: 'Run command',
    options    : {
        cmd: {
            description: 'What command to execute'
        },
        cwd: {
            description: 'Current working directory of the child process',
            'default': null
        }
    },
    tasks      :
    [
        {
            task: function (opt, next) {
                var child,
                    that = this;

                if (process.platform === 'win32') {
                    child = spawn('cmd', ['/s', '/c', opt.cmd], { cwd: opt.cwd });
                } else {
                    child = spawn('sh', ['-c', opt.cmd], { cwd: opt.cwd });
                }

                this.log.infoln('Running: '.green + opt.cmd + '\n');

                // Added colors support with the customFds option
                // If that is removed, we have access to the .stdout and .stderr again
                child.stdout.on('data', function (data) {
                    that.log.info(data.toString());
                });

                child.stderr.on('data', function (data) {
                    that.log.error(data.toString());
                });

                child.on('exit', function (code) {
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