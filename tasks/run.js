'use strict';

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
            task: function (opt, ctx, next) {
                var child,
                    that = this,
                    output = '',
                    onData;

                if (process.platform === 'win32') {
                    child = spawn('cmd', ['/s', '/c', opt.cmd], { cwd: opt.cwd });
                } else {
                    child = spawn('sh', ['-c', opt.cmd], { cwd: opt.cwd });
                }

                this.log.infoln('Running: '.green + opt.cmd + '\n');

                onData = function (data) {
                    // Buffer the response until we find a new line
                    output += data.toString();

                    var pos = output.lastIndexOf('\n');
                    if (pos !== -1) {
                        // If there is a new line in the buffer, output it
                        that.log.infoln(output.substr(0, pos));
                        output = output.substr(pos + 1);
                    }
                };

                child.stdout.on('data', onData);
                child.stderr.on('data', onData);

                child.on('exit', function (code) {
                    // Log the remaining buffer
                    if (output) {
                        this.log.infoln(output);
                    }

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