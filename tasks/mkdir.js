'use strict';

var mkdirp = require('mkdirp');
var fs     = require('fs');
var path   = require('path');
var utils  = require('mout');
var async  = require('async');

var task = {
    id          : 'mkdir',
    author      : 'Indigo United',
    name        : 'Make directory',
    description : 'Make directory recursively, just like `mkdir -p`',
    options: {
        dirs: {
            description: 'The directory you want to create. Accepts a directory or an array of directories.'
        },
        mode: {
            description: 'The directory permissions.',
            default: '0777'
        }
    },
    filter     : function (opt, ctx, next) {
        if (!utils.lang.isNumber(opt.mode)) {
            opt.mode = parseInt(opt.mode, 8);
        }
        next();
    },
    tasks      :
    [
        {
            task: function (opt, ctx, next) {
                var dirs = utils.lang.isArray(opt.dirs) ? opt.dirs : [opt.dirs];
                var error;

                async.forEach(dirs, function (dir, next) {
                    dir = path.normalize(dir);

                    fs.stat(dir, function (err) {
                        if (!err || err.code !== 'ENOENT') {
                            error = new Error('EEXIST, target already exists \'' + dir + '\'');
                            error.code = 'EEXISTS';
                            return next(error);
                        }

                        mkdirp(dir, opt.mode, next);
                    });
                }, next);
            }
        }
    ]
};

module.exports = task;