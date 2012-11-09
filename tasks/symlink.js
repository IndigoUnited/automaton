var fs   = require('fs');
var path = require('path');

var task = {
    'id'      : 'symlink',
    'author'  : 'Indigo United',
    'name'    : 'Symlink',
    'options' : {
        'src': {
            'description': 'The original file you want to reference'
        },
        'dst': {
            'description': 'The symlink file that will be generated'
        },
        'type': {
            'description': 'Can be either "dir", "file", or "junction" (default is "file")',
            'default': 'file'
        }
    },
    'tasks'   :
    [
        {
            'task' : function (ctx, opt, next) {
                var src = path.resolve(ctx.cwd, opt.src),
                    dst = path.resolve(ctx.cwd, opt.dst);

                fs.symlink(src, dst, opt.type, next);
            }
        }
    ]
};

module.exports = task;