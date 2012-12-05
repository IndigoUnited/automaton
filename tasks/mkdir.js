var mkdirp = require('mkdirp');
var fs     = require('fs');
var utils  = require('amd-utils');
var async  = require('async');

var task = {
    'id'      : 'mkdir',
    'author'  : 'Indigo United',
    'name'    : 'Make dir recursively',
    'options' : {
        'dir': {
            'description': 'The directory you want to create'
        },
        'mode': {
            'description': 'The directory permissions',
            'default': '0777'

        }
    },
    'filter': function (opt) {
        if (!utils.lang.isNumber(opt.mode)) {
            opt.mode = parseInt(opt.mode, 8);
        }
    },
    'tasks' :
    [
        {
            'task' : function (opt, next) {
                var dir = utils.lang.isArray(opt.dir) ? opt.dir : [opt.dir];

                async.forEach(dir, function (dir, next) {
                    fs.stat(dir, function (err, stat) {
                        if (!err || err.code !== 'ENOENT') {
                            if (stat && !stat.isDirectory()) {
                                next(new Error('Passed dir already exists and is not a directory.'));
                            } else {
                                next(err);
                            }
                        }

                        mkdirp(dir, opt.mode, next);
                    });
                }, next);
            },
            description: 'Make dir'
            /*
            description: function (opt) {
                return 'Making dirs: ' opt.dir.join(',');
            }*/

        }
    ]
};

module.exports = task;