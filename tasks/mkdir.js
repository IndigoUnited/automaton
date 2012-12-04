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

                if (utils.lang.isString(opt.dir)) {
                    opt.dir = [opt.dir];
                }
                var tasks = [];

                for (var i = 0, l = opt.dir.length; i < l; ++i) {
                    tasks.push(function (i) {
                        fs.stat(opt.dir[i], function (err, stat) {
                            if (!err || err.code !== 'ENOENT') {
                                if (stat && !stat.isDirectory()) {
                                    next(new Error('Passed dir already exists and is not a directory.'));
                                } else {
                                    next(err);
                                }
                            }

                            mkdirp(opt.dir[i], opt.mode, function (err) {
                                if (err) {
                                    next(err);
                                }
                                else {
                                    next();
                                }
                            });
                        });
                    }.bind(this, i));
                }
                async.parallel(tasks, next);
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