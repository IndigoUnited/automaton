'use strict';

var fs    = require('fs');
var path  = require('path');
var utils = require('mout');

var task = {
    id          : 'init',
    author      : 'Indigo United',
    name        : 'Init',
    description : 'Init an empty autofile.',
    options: {
        name: {
            description: 'The task name.',
            'default': 'autofile'
        },
        dst: {
            description: 'Directory in which the task will be created.',
            'default': process.cwd()
        }
    },
    filter     : function (opt, ctx, next) {
        var error;

        if (utils.string.endsWith(opt.name, '.js')) {
            opt.name = opt.name.slice(0, -3);
        }
        opt.filename = path.join(opt.dst, opt.name + '.js');
        opt.__dirname = __dirname;

        fs.stat(opt.filename, function (err) {
            if (!err || err.code !== 'ENOENT') {
                error = new Error('EEXIST, file already exists \'' + opt.filename + '\'');
                error.code = 'EXISTS';
                return next(error);
            }

            next();
        });
    },
    tasks     :
    [
        {
            task: 'cp',
            options: {
                files: {
                    '{{__dirname}}/../base_autofile.js': '{{filename}}'
                }
            }
        },
        {
            task: 'scaffolding-replace',
            options: {
                files: '{{filename}}',
                data: {
                    name: '{{name}}'
                }
            }
        }
    ]
};

module.exports = task;