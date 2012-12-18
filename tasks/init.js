var fs    = require('fs');
var utils = require('amd-utils');

var task = {
    id      : 'init',
    author  : 'Indigo United',
    name    : 'Init',
    options : {
        name: {
            description: 'The task name',
            'default': 'autofile'
        },
        dst: {
            description: 'Directory where the task will be created',
            'default': process.cwd()
        }
    },
    filter: function (opt, next) {
        if (utils.string.endsWith(opt.name, '.js')) {
            opt.name = opt.name.slice(0, -3);
        }
        opt.filename = opt.name + '.js';

        fs.stat(opt.filename, function (err) {
            if (!err || err.code !== 'ENOENT') {
                return next(new Error('Filename ' + opt.filename + ' already exists.'));
            }

            next();
        });
    },
    tasks  :
    [
        {
            task: 'cp',
            options: {
                src: __dirname + '/../base_autofile.js',
                dst: '{{dst}}/{{filename}}'
            }
        },
        {
            task: 'scaffolding-replace',
            options: {
                file: '{{dst}}/{{filename}}',
                data: {
                    name: '{{name}}'
                }
            }
        }
    ]
};

module.exports = task;