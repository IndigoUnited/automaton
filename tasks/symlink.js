'use strict';

var fs   = require('fs');

var task = {
    id         : 'symlink',
    author     : 'Indigo United',
    name       : 'Symlink',
    description: 'Create a symlink.',
    options    : {
        src: {
            'description': 'The original file you want to reference.'
        },
        dst: {
            'description': 'The symlink file that will be generated.'
        },
        type: {
            description: 'Can be either "dir", "file", or "junction" (default is "file"). Check http://nodejs.org/api/fs.html#fs_fs_symlink_srcpath_dstpath_type_callback for more info.',
            default: 'file'
        }
    },
    tasks      :
    [
        {
            task: function (opt, ctx, next) {
                fs.symlink(opt.src, opt.dst, opt.type, next);
            }
        }
    ]
};

module.exports = task;